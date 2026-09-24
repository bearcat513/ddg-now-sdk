/**
 * Runs the small JavaScript snippets a user attaches to an `enum` field so the
 * choices can come from a live source (an HTTP API, a database-backed service,
 * a CSV on disk served over HTTP…) instead of a hand-typed list.
 *
 * The snippet is the *body* of an async function and must return an array:
 *
 *   const res = await fetch("https://api.example.com/statuses");
 *   const data = await res.json();
 *   return data.map(s => s.name);
 *
 * It runs server-side (so there is no CORS to fight) inside a `node:vm`
 * context with a deliberately small set of globals. That is a guard against
 * mistakes, not against malice: `fetch` alone is enough to reach the network,
 * and a `node:vm` context is not a security sandbox.
 *
 * Which matters more now that anyone can register an account: a snippet is
 * code this server runs, written by whoever wrote the field. So `env` exposes
 * only variables named `DDG_SCRIPT_*` — the ones deliberately put there for
 * snippets to read — and not the rest of the server's environment, which is
 * where PocketBase's own credentials and every other secret live.
 */

import vm from "node:vm";

export const DEFAULT_SCRIPT_TIMEOUT_MS = 10_000;

/**
 * Environment variables a snippet may read, by prefix. Name a variable
 * `DDG_SCRIPT_API_TOKEN` and a snippet sees `env.DDG_SCRIPT_API_TOKEN`;
 * everything else in the server's environment stays out of reach.
 */
export const SCRIPT_ENV_PREFIX = "DDG_SCRIPT_";

function scriptEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[0].startsWith(SCRIPT_ENV_PREFIX) && entry[1] !== undefined,
    ),
  );
}

export const MAX_CHOICES = 5_000;
const MAX_SCRIPT_LENGTH = 20_000;
const MAX_CHOICE_LENGTH = 1_000;

export type ScriptSuccess = {
  ok: true;
  /** The choices, stringified and de-duplicated, ready to hand to the generator. */
  values: string[];
  /** How many values the snippet returned before the cap and de-duplication. */
  returned: number;
  truncated: boolean;
  durationMs: number;
  /** Anything the snippet logged, so the UI can show it next to the result. */
  logs: string[];
};

export type ScriptFailure = { ok: false; error: string; logs: string[] };

export type ScriptResult = ScriptSuccess | ScriptFailure;

export type RunScriptOptions = {
  timeoutMs?: number;
  maxValues?: number;
};

/**
 * The globals a snippet can see. Everything here is either needed to fetch and
 * reshape remote data, or is a pure standard-library value.
 */
function createSandbox(logs: string[]): Record<string, unknown> {
  const log = (...args: unknown[]) => {
    if (logs.length >= 50) return;
    logs.push(args.map(a => (typeof a === "string" ? a : safeStringify(a))).join(" "));
  };

  const sandbox: Record<string, unknown> = {
    // network
    fetch,
    Headers,
    Request,
    Response,
    FormData,
    AbortController,
    AbortSignal,
    // encoding
    URL,
    URLSearchParams,
    TextDecoder,
    TextEncoder,
    atob,
    btoa,
    Blob,
    // standard library
    JSON,
    Math,
    Date,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    RegExp,
    Error,
    TypeError,
    Promise,
    Intl,
    BigInt,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    structuredClone,
    // timers, so a snippet can back off between paginated requests
    setTimeout,
    clearTimeout,
    queueMicrotask,
    // API tokens for a snippet to use go in the environment as DDG_SCRIPT_*.
    // A copy of just those, so a snippet can neither read the server's other
    // secrets nor mutate its environment.
    env: scriptEnv(),
    console: { log, info: log, warn: log, error: log, debug: log },
  };

  sandbox.globalThis = sandbox;
  return sandbox;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** Turns one returned item into a choice string, or explains why it cannot. */
function toChoice(item: unknown, index: number): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof item === "string") return { ok: true, value: item };
  if (typeof item === "number" || typeof item === "boolean" || typeof item === "bigint") {
    return { ok: true, value: String(item) };
  }
  if (item === null || item === undefined) {
    return { ok: false, error: `item ${index} is ${item === null ? "null" : "undefined"}` };
  }
  return {
    ok: false,
    error:
      `item ${index} is ${Array.isArray(item) ? "an array" : "an object"} — map it to a string first, ` +
      `e.g. return data.map(d => d.name)`,
  };
}

/** Accepts a bare array, or `{ values: [...] }` / `{ data: [...] }` for convenience. */
function asArray(returned: unknown): unknown[] | null {
  if (Array.isArray(returned)) return returned;
  if (returned && typeof returned === "object") {
    for (const key of ["values", "data", "results", "items"] as const) {
      const nested = (returned as Record<string, unknown>)[key];
      if (Array.isArray(nested)) return nested;
    }
  }
  return null;
}

export async function runChoiceScript(source: string, options: RunScriptOptions = {}): Promise<ScriptResult> {
  const logs: string[] = [];
  const code = (source ?? "").trim();

  if (!code) return { ok: false, error: "The script is empty.", logs };
  if (code.length > MAX_SCRIPT_LENGTH) {
    return { ok: false, error: `The script is longer than ${MAX_SCRIPT_LENGTH} characters.`, logs };
  }

  const timeoutMs = Math.max(100, Math.min(options.timeoutMs ?? DEFAULT_SCRIPT_TIMEOUT_MS, 60_000));
  const maxValues = Math.max(1, Math.min(options.maxValues ?? MAX_CHOICES, MAX_CHOICES));
  const started = performance.now();

  // Two guards are needed, because they stop different things. `vm`'s own
  // timeout only covers what runs inside `runInContext`, so the snippet is
  // *invoked* there: that bounds its synchronous prefix, and an await-free
  // `while (true) {}` is killed rather than wedging the server. Once the
  // snippet hits its first `await` it is out of vm's reach, so the promise it
  // returns is raced against a timer for the rest of the budget.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms.`)), timeoutMs);
  });

  let returned: unknown;
  try {
    const context = vm.createContext(createSandbox(logs));
    const pending = vm.runInContext(`(async function choices() {\n${code}\n})()`, context, {
      timeout: timeoutMs,
      filename: "enum-source.js",
    }) as Promise<unknown>;

    // Whoever loses the race must not surface later as an unhandled rejection.
    void Promise.resolve(pending).catch(() => {});
    returned = await Promise.race([pending, expired]);
  } catch (error) {
    // A syntax error surfaces here too, which is exactly where the user looks.
    return { ok: false, error: error instanceof Error ? error.message : String(error), logs };
  } finally {
    clearTimeout(timer);
  }

  const durationMs = performance.now() - started;
  const items = asArray(returned);
  if (!items) {
    const shape = returned === undefined ? "returned nothing" : `returned ${typeof returned}`;
    return {
      ok: false,
      error: `The script must return an array of choices (it ${shape}). Example: return ["active", "archived"];`,
      logs,
    };
  }

  const values: string[] = [];
  const seen = new Set<string>();
  let truncated = false;

  for (const [index, item] of items.entries()) {
    if (values.length >= maxValues) {
      truncated = true;
      break;
    }
    const choice = toChoice(item, index);
    if (!choice.ok) return { ok: false, error: `The script returned an unusable choice: ${choice.error}.`, logs };
    const value = choice.value.slice(0, MAX_CHOICE_LENGTH);
    if (value === "" || seen.has(value)) continue;
    seen.add(value);
    values.push(value);
  }

  if (!values.length) {
    return { ok: false, error: "The script returned no usable choices (the array was empty).", logs };
  }

  return { ok: true, values, returned: items.length, truncated, durationMs, logs };
}
