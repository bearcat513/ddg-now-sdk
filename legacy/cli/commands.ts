/**
 * Every command the CLI answers to, as one table.
 *
 * The same idea as `src/index.ts`: one place that knows the whole surface, so
 * the help text, the flag validation and the dispatcher are all reading the
 * same list and cannot drift from it. A command declares the flags it takes;
 * anything else is a typo and is refused before a request goes out.
 *
 * The verbs follow the API rather than inventing a vocabulary over it — a
 * `GET /api/configs` is `ddg configs list` — so the reference at `/docs` and
 * this CLI describe the same server in the same words.
 */
import { assertKnownFlags, boolFlag, numberFlag, stringFlag, UsageError, type Flags } from "./args";
import { CliError, writeBody, type Client } from "./client";
import { clearSettings, writeSettings, type Resolved, type Stored } from "./settings";
import { bold, count, describe, dim, green, json, table, truncate } from "./output";
import { parseConfigFile, serializeConfigFile } from "../lib/configFile";
import { valueToText } from "../lib/rows";
import { timeAgo } from "../lib/timeAgo";
import type { GenerateResult, InferResult, ApiKey, IssuedApiKey } from "../lib/api";
import type { Dataset, Field, SchemaConfig } from "../lib/types";
import type { ScriptTemplate } from "../lib/scriptTemplate";
import type { Note } from "../lib/notes";

export type Context = {
  client: Client;
  flags: Flags;
  /** What was left on the line after the command name. */
  args: string[];
  /** `--json`: print what the API said, and nothing else. */
  json: boolean;
  settings: { path: string; stored: Stored; resolved: Resolved };
  print: (text?: string) => void;
};

export type Command = {
  name: string;
  summary: string;
  usage: string;
  /** Extra paragraphs for `ddg help <command>`. */
  details?: string;
  booleans?: readonly string[];
  /** Flags this command takes, beyond the global ones. */
  flags?: readonly string[];
  aliases?: Record<string, string>;
  /** Commands that need no credential — everything else is refused early. */
  anonymous?: boolean;
  run: (ctx: Context) => Promise<void>;
};

/* -------------------------------- helpers -------------------------------- */

/** The first positional, or a usage error naming what was wanted. */
function required(ctx: Context, what: string, index = 0): string {
  const value = ctx.args[index];
  if (!value) throw new UsageError(`${what} is required.`);
  return value;
}

/**
 * Dispatches `ddg <noun> <verb>`, with `list` as the verb nobody has to type.
 *
 * Listing is what someone wants nine times out of ten, and it is the one verb
 * that is safe to run by accident.
 */
async function sub(ctx: Context, verbs: Record<string, (ctx: Context) => Promise<void>>): Promise<void> {
  const [verb = "list", ...rest] = ctx.args;
  const run = verbs[verb];
  if (!run) {
    throw new UsageError(`Unknown subcommand "${verb}". Try one of: ${Object.keys(verbs).join(", ")}.`);
  }
  await run({ ...ctx, args: rest });
}

/** Prints the API's own JSON, or draws it — the choice every command makes. */
function render(ctx: Context, payload: unknown, draw: () => void): void {
  if (ctx.json) {
    ctx.print(json(payload));
    return;
  }
  draw();
}

/** A list that is empty is a sentence, not a table with no rows under it. */
function list<T>(ctx: Context, items: T[], empty: string, headers: string[], row: (item: T) => string[]): void {
  render(ctx, items, () => {
    if (!items.length) {
      ctx.print(dim(empty));
      return;
    }
    ctx.print(table(headers, items.map(row)));
  });
}

/** Reads a file the user named, or standard input when they wrote `-`. */
async function readInput(source: string): Promise<string> {
  if (source === "-") return await Bun.stdin.text();
  const file = Bun.file(source);
  if (!(await file.exists())) throw new CliError(`No such file: ${source}`);
  return await file.text();
}

/** `ok` for the deletes, so a script can see the verb landed. */
const confirmDeleted = (ctx: Context, what: string, id: string) =>
  render(ctx, { ok: true, id }, () => ctx.print(`${green("Deleted")} ${what} ${id}`));

/* ---------------------------------- auth --------------------------------- */

/**
 * A password, without putting it in the shell's history or in `ps`.
 *
 * Piped input wins when there is any, which is what a CI job does; otherwise
 * the terminal is put in raw mode so the characters are never echoed. A
 * password on the command line is accepted too — sometimes there is no
 * terminal and no pipe — but it is last, and the help says why.
 */
async function readPassword(flags: Flags): Promise<string> {
  const given = stringFlag(flags, "password") ?? process.env.DDG_PASSWORD;
  if (given) return given;

  if (!process.stdin.isTTY) {
    const piped = (await Bun.stdin.text()).replace(/\r?\n$/, "");
    if (piped) return piped;
    throw new UsageError("No password on standard input. Pass --password, or run this from a terminal.");
  }

  process.stdout.write("Password: ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  try {
    let value = "";
    for await (const chunk of process.stdin) {
      for (const char of new TextDecoder().decode(chunk as Uint8Array)) {
        if (char === "\r" || char === "\n") {
          process.stdout.write("\n");
          return value;
        }
        // Ctrl-C has to work here as it does everywhere else, and the terminal
        // must be handed back before this process stops existing.
        if (char === "\u0003") {
          process.stdout.write("\n");
          process.stdin.setRawMode(false);
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        // Other control characters are keys, not input: arrows, tab, escape.
        if (char >= " ") value += char;
      }
    }
    return value;
  } finally {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
}

const login: Command = {
  name: "login",
  summary: "Sign in, or store an API key, for every later command",
  usage: "ddg login [--url URL] [--email you@example.com] [--password … | --key pk_…]",
  details:
    "Signing in keeps the session token the server would have put in a browser cookie.\n" +
    "--key stores an API key instead, which never expires on its own and is what a\n" +
    "cron job should use — issue one with `ddg keys new`, or in Settings → API keys.\n\n" +
    "The password is read from --password, then $DDG_PASSWORD, then standard input,\n" +
    "then a hidden prompt. Prefer the last two: an argument is visible in `ps`.",
  flags: ["email", "password"],
  anonymous: true,
  async run(ctx) {
    const { path, stored } = ctx.settings;

    // A key proves itself by being used: /api/auth/me is the cheapest call
    // that fails loudly when it is wrong.
    if (ctx.client.credential?.kind === "key") {
      const { user } = await ctx.client.get<{ user: { email: string } }>("/api/auth/me");
      await writeSettings(path, {
        url: ctx.client.baseUrl,
        credential: ctx.client.credential.value,
        email: user.email,
        savedAt: new Date().toISOString(),
      });
      render(ctx, { url: ctx.client.baseUrl, email: user.email, kind: "key" }, () =>
        ctx.print(`${green("Stored")} an API key for ${bold(user.email)} at ${ctx.client.baseUrl} — ${dim(path)}`),
      );
      return;
    }

    const email = stringFlag(ctx.flags, "email") ?? stored.email ?? prompt("Email:")?.trim();
    if (!email) throw new UsageError("An email address is required.");

    const { user, token } = await ctx.client.login(email, await readPassword(ctx.flags));
    await writeSettings(path, {
      url: ctx.client.baseUrl,
      credential: token,
      email: user.email,
      savedAt: new Date().toISOString(),
    });

    render(ctx, { url: ctx.client.baseUrl, email: user.email, kind: "token" }, () =>
      ctx.print(`${green("Signed in")} as ${bold(user.email)} at ${ctx.client.baseUrl} — ${dim(path)}`),
    );
  },
};

const logout: Command = {
  name: "logout",
  summary: "End the stored session and forget the credential",
  usage: "ddg logout",
  anonymous: true,
  async run(ctx) {
    // Best effort: a token the server has already forgotten, or a server that
    // is not running, must not stop the local file from being removed.
    if (ctx.client.credential?.kind === "token") {
      await ctx.client.request("POST", "/api/auth/logout").catch(() => undefined);
    }
    await clearSettings(ctx.settings.path);
    render(ctx, { ok: true }, () => ctx.print(`${green("Signed out")} — removed ${dim(ctx.settings.path)}`));
  },
};

const whoami: Command = {
  name: "whoami",
  summary: "The account this CLI is acting as",
  usage: "ddg whoami",
  async run(ctx) {
    const { user } = await ctx.client.get<{
      user: { id: string; email: string; name: string; verified: boolean; createdAt: string };
    }>("/api/auth/me");

    render(ctx, user, () =>
      ctx.print(
        describe([
          ["Email", user.email],
          ["Name", user.name || dim("—")],
          ["Account", user.id],
          ["Verified", user.verified ? "yes" : "no"],
          ["Server", ctx.client.baseUrl],
          [
            "Credential",
            `${ctx.client.credential?.kind ?? "none"} ${dim(`(from the ${ctx.settings.resolved.source})`)}`,
          ],
        ]),
      ),
    );
  },
};

const status: Command = {
  name: "status",
  summary: "Whether the server and its database are up",
  usage: "ddg status",
  anonymous: true,
  async run(ctx) {
    const health = await ctx.client.get<{ status: string; uptime: number; env: string }>("/api/health");

    // The counts need a credential; the liveness check does not. A `status`
    // that refuses to answer without one would be useless for the question it
    // is usually asked: "is the thing running?"
    const meta = ctx.client.credential
      ? await ctx.client
          .get<{ url: string; reachable: boolean; configs: number | null; datasets: number | null }>("/api/meta")
          .catch(() => null)
      : null;

    render(ctx, { server: ctx.client.baseUrl, health, meta }, () =>
      ctx.print(
        describe([
          ["Server", `${ctx.client.baseUrl} ${green(health.status)} ${dim(`${health.env}, up ${health.uptime}s`)}`],
          ["Database", meta ? `${meta.url} ${meta.reachable ? green("reachable") : "unreachable"}` : dim("—")],
          ["Yours", meta ? `${meta.configs ?? "?"} configs, ${meta.datasets ?? "?"} datasets` : dim("sign in to see")],
        ]),
      ),
    );
  },
};

const keys: Command = {
  name: "keys",
  summary: "List, issue and revoke API keys",
  usage: "ddg keys [list | new <name> [--days N] | rm <id>]",
  details:
    "Keys cannot manage keys — issuing and revoking need a real session, which is\n" +
    "how a leaked key is recovered from. Sign in with `ddg login` first.\n" +
    "The issuing response is the only place a key ever appears.",
  flags: ["days"],
  async run(ctx) {
    await sub(ctx, {
      list: async ctx => {
        const issued = await ctx.client.get<ApiKey[]>("/api/keys");
        list(ctx, issued, "No API keys.", ["ID", "NAME", "CREATED", "EXPIRES", "LAST USED"], key => [
          key.id,
          truncate(key.name, 30),
          timeAgo(key.createdAt),
          key.expiresAt ? new Date(key.expiresAt).toISOString().slice(0, 10) : dim("never"),
          key.lastUsedAt ? timeAgo(key.lastUsedAt) : dim("never"),
        ]);
      },
      new: async ctx => {
        const key = await ctx.client.json<IssuedApiKey>("POST", "/api/keys", {
          body: { name: required(ctx, "A name for the key"), expiresInDays: numberFlag(ctx.flags, "days") },
        });
        render(ctx, key, () => {
          ctx.print(`${green("Issued")} ${bold(key.name)} ${dim(key.id)}`);
          ctx.print("");
          ctx.print(key.key);
          ctx.print("");
          ctx.print(dim("This is the only time the key is shown. Store it now — DDG_API_KEY reads it."));
        });
      },
      rm: async ctx => {
        const id = required(ctx, "A key id");
        await ctx.client.request("DELETE", `/api/keys/${encodeURIComponent(id)}`);
        confirmDeleted(ctx, "API key", id);
      },
    });
  },
};

/* ------------------------------- the records ------------------------------ */

const configs: Command = {
  name: "configs",
  summary: "The saved schemas",
  usage: "ddg configs [list | show <id> | export <id> [--out FILE] | import <file> | rm <id>]",
  flags: ["out"],
  aliases: { o: "out" },
  async run(ctx) {
    await sub(ctx, {
      list: async ctx => {
        const saved = await ctx.client.get<SchemaConfig[]>("/api/configs");
        list(ctx, saved, "No configurations yet.", ["ID", "NAME", "FIELDS", "ROWS", "UPDATED"], config => [
          config.id,
          truncate(config.name, 34),
          String(config.fields.length),
          config.rowCount.toLocaleString(),
          timeAgo(config.updatedAt),
        ]);
      },
      show: async ctx => {
        const id = required(ctx, "A configuration id");
        const config = await ctx.client.get<SchemaConfig>(`/api/configs/${encodeURIComponent(id)}`);
        render(ctx, config, () => {
          ctx.print(
            describe([
              ["Name", bold(config.name)],
              ["ID", config.id],
              ["Rows", config.rowCount.toLocaleString()],
              ["Seed", config.seed || dim("random")],
              ["Locale", config.locale || dim("default")],
              ["Shared with", config.sharedWith.length ? config.sharedWith.join(", ") : dim("nobody")],
              ["Updated", `${timeAgo(config.updatedAt)}`],
            ]),
          );
          ctx.print("");
          ctx.print(table(["FIELD", "TYPE"], config.fields.map(fieldRow)));
        });
      },
      export: async ctx => {
        const id = required(ctx, "A configuration id");
        const response = await ctx.client.request("GET", `/api/configs/${encodeURIComponent(id)}/export`);
        await writeBody(response, stringFlag(ctx.flags, "out"));
      },
      import: async ctx => {
        const source = required(ctx, "A *.ddg.json file");
        const parsed = JSON.parse(await readInput(source)) as unknown;
        const saved = await ctx.client.json<SchemaConfig>("POST", "/api/configs/import", { body: parsed });
        render(ctx, saved, () =>
          ctx.print(
            `${green("Imported")} ${bold(saved.name)} ${dim(saved.id)} — ${count(saved.fields.length, "field")}`,
          ),
        );
      },
      rm: async ctx => {
        const id = required(ctx, "A configuration id");
        await ctx.client.request("DELETE", `/api/configs/${encodeURIComponent(id)}`);
        confirmDeleted(ctx, "configuration", id);
      },
    });
  },
};

/** One row of a field listing: the name, and the type with its shape. */
const fieldRow = (field: Field): string[] => [field.name || dim("(unnamed)"), field.type];

const datasets: Command = {
  name: "datasets",
  summary: "The generated data",
  usage:
    "ddg datasets [list [--limit N] | show <id> [--limit N] | export <id> [--format csv|json|sql] [--out FILE]\n" +
    "              | script <id> --template <template-id> [--out FILE] | rm <id>]",
  flags: ["limit", "offset", "format", "out", "template"],
  aliases: { o: "out", f: "format", n: "limit" },
  async run(ctx) {
    await sub(ctx, {
      list: async ctx => {
        const stored = await ctx.client.get<Dataset[]>("/api/datasets", { limit: numberFlag(ctx.flags, "limit") });
        list(ctx, stored, "Nothing generated yet.", ["ID", "NAME", "ROWS", "FIELDS", "CREATED"], dataset => [
          dataset.id,
          truncate(dataset.name, 40),
          dataset.rowCount.toLocaleString(),
          String(dataset.fieldCount),
          timeAgo(dataset.createdAt),
        ]);
      },
      show: async ctx => {
        const id = required(ctx, "A dataset id");
        const result = await ctx.client.get<GenerateResult & { offset: number }>(
          `/api/datasets/${encodeURIComponent(id)}`,
          { limit: numberFlag(ctx.flags, "limit") ?? 20, offset: numberFlag(ctx.flags, "offset") },
        );
        render(ctx, result, () => printRows(ctx, result));
      },
      export: async ctx => {
        const id = required(ctx, "A dataset id");
        const response = await ctx.client.request("GET", `/api/datasets/${encodeURIComponent(id)}/export`, {
          params: { format: stringFlag(ctx.flags, "format") ?? "json" },
        });
        await writeBody(response, stringFlag(ctx.flags, "out"));
      },
      script: async ctx => {
        const id = required(ctx, "A dataset id");
        const templateId = stringFlag(ctx.flags, "template");
        if (!templateId) throw new UsageError("--template is required; see `ddg templates list`.");
        const response = await ctx.client.request("GET", `/api/datasets/${encodeURIComponent(id)}/script`, {
          params: { templateId },
        });
        await writeBody(response, stringFlag(ctx.flags, "out"));
      },
      rm: async ctx => {
        const id = required(ctx, "A dataset id");
        await ctx.client.request("DELETE", `/api/datasets/${encodeURIComponent(id)}`);
        confirmDeleted(ctx, "dataset", id);
      },
    });
  },
};

const templates: Command = {
  name: "templates",
  summary: "The script templates a dataset can be rendered into",
  usage: "ddg templates [list | show <id> | rm <id>]",
  async run(ctx) {
    await sub(ctx, {
      list: async ctx => {
        const saved = await ctx.client.get<ScriptTemplate[]>("/api/script-templates");
        list(ctx, saved, "No script templates yet.", ["ID", "NAME", "UPDATED"], template => [
          template.id,
          truncate(template.name, 40),
          timeAgo(template.updatedAt),
        ]);
      },
      show: async ctx => {
        const template = await ctx.client.get<ScriptTemplate>(
          `/api/script-templates/${encodeURIComponent(required(ctx, "A template id"))}`,
        );
        render(ctx, template, () => ctx.print(template.body));
      },
      rm: async ctx => {
        const id = required(ctx, "A template id");
        await ctx.client.request("DELETE", `/api/script-templates/${encodeURIComponent(id)}`);
        confirmDeleted(ctx, "script template", id);
      },
    });
  },
};

const notes: Command = {
  name: "notes",
  summary: "The workspace's notes",
  usage: "ddg notes [list | show <id> | rm <id>]",
  async run(ctx) {
    await sub(ctx, {
      list: async ctx => {
        const saved = await ctx.client.get<Note[]>("/api/notes");
        list(ctx, saved, "No notes yet.", ["ID", "TITLE", "UPDATED"], note => [
          note.id,
          truncate(note.title || "Untitled", 44),
          timeAgo(note.updatedAt),
        ]);
      },
      show: async ctx => {
        const note = await ctx.client.get<Note>(`/api/notes/${encodeURIComponent(required(ctx, "A note id"))}`);
        render(ctx, note, () => {
          ctx.print(bold(note.title || "Untitled"));
          ctx.print("");
          ctx.print(note.body);
        });
      },
      rm: async ctx => {
        const id = required(ctx, "A note id");
        await ctx.client.request("DELETE", `/api/notes/${encodeURIComponent(id)}`);
        confirmDeleted(ctx, "note", id);
      },
    });
  },
};

/* ------------------------------- generating ------------------------------- */

/** The inline table a `generate` or a `datasets show` prints. */
function printRows(ctx: Context, result: GenerateResult): void {
  if (result.dataset) {
    ctx.print(
      `${bold(result.dataset.name)} ${dim(result.dataset.id)} — ${count(result.total, "row")}` +
        `${result.truncated ? dim(` (showing ${result.rows.length})`) : ""}`,
    );
    ctx.print("");
  }

  if (!result.rows.length) {
    ctx.print(dim("No rows."));
    return;
  }

  // Every row, because a column can be missing from the first one — a null
  // rate is allowed to swallow it.
  const headers = [...new Set(result.rows.flatMap(row => Object.keys(row)))];
  ctx.print(
    table(
      headers,
      result.rows.map(row => headers.map(header => truncate(valueToText(row[header]), 24))),
    ),
  );
}

const generate: Command = {
  name: "generate",
  summary: "Generate data from a saved schema, or from a schema file",
  usage:
    "ddg generate <config-id> [--rows N] [--seed S] [--locale L] [--name N]\n" +
    "                         [--format csv|json|sql] [--out FILE] [--limit N] [--no-save]\n" +
    "ddg generate --file schema.ddg.json [same options]",
  details:
    "With a configuration id the stored schema runs as it is, and --rows, --seed,\n" +
    "--name and --locale override it for this one run.\n\n" +
    "--format writes the rows as a file instead of a summary — to --out, or to\n" +
    "standard output, so `ddg generate cfg_… --format csv > people.csv` is the\n" +
    "whole pipeline. --no-save keeps nothing on the server and returns every row.",
  booleans: ["save"],
  flags: ["file", "rows", "seed", "locale", "name", "format", "out", "limit", "save"],
  aliases: { o: "out", f: "format", n: "rows" },
  async run(ctx) {
    const file = stringFlag(ctx.flags, "file");
    const configId = ctx.args[0];
    if (!file && !configId) throw new UsageError("A configuration id, or --file, is required.");
    if (file && configId) throw new UsageError("Pass a configuration id or --file, not both.");

    const save = boolFlag(ctx.flags, "save", true);
    const format = stringFlag(ctx.flags, "format");
    const params = {
      format,
      limit: numberFlag(ctx.flags, "limit"),
      save: save ? undefined : "false",
    };

    const response = file
      ? await ctx.client.request("POST", "/api/generate", {
          params,
          body: { ...(await schemaFromFile(file, ctx.flags)) },
        })
      : await ctx.client.request("POST", `/api/configs/${encodeURIComponent(configId!)}/generate`, {
          params: {
            ...params,
            rows: numberFlag(ctx.flags, "rows"),
            seed: stringFlag(ctx.flags, "seed"),
            locale: stringFlag(ctx.flags, "locale"),
            name: stringFlag(ctx.flags, "name"),
          },
        });

    // A format asked for a file, and a file is what the server sent: hand it
    // straight on, unread, whatever its size.
    if (format) {
      await writeBody(response, stringFlag(ctx.flags, "out"));
      return;
    }

    const result = (await response.json()) as GenerateResult;
    render(ctx, result, () => printRows(ctx, result));
  },
};

/** The body `/api/generate` wants, read out of a `*.ddg.json` file. */
async function schemaFromFile(file: string, flags: Flags): Promise<Record<string, unknown>> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readInput(file));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "could not parse it";
    throw new CliError(`${file} is not valid JSON — ${reason}.`);
  }

  // Parsed here rather than posted blind, so a bad file is a sentence about
  // that file instead of a 400 about a request the user never wrote.
  const parsed = parseConfigFile(raw);
  if (!parsed.ok) throw new CliError(`${file}: ${parsed.error}`);

  const { config } = parsed;
  return {
    fields: config.fields,
    mappings: config.mappings,
    rowCount: numberFlag(flags, "rows") ?? config.rowCount,
    seed: stringFlag(flags, "seed") ?? config.seed,
    locale: stringFlag(flags, "locale") ?? config.locale,
    name: stringFlag(flags, "name") ?? config.name,
    configId: null,
  };
}

const infer: Command = {
  name: "infer",
  summary: "Turn a JSON sample, a TypeScript interface or a CREATE TABLE into a schema",
  usage: "ddg infer <file | -> [--as-config] [--name NAME] [--out FILE]",
  details:
    "--as-config writes a *.ddg.json file instead of a field listing, which is what\n" +
    "`ddg generate --file` reads — so a sample of real data becomes fake data in two\n" +
    "commands, without opening the app:\n\n" +
    "  ddg infer sample.json --as-config --name Orders --out orders.ddg.json\n" +
    "  ddg generate --file orders.ddg.json --rows 500 --format csv --out orders.csv",
  booleans: ["as-config"],
  flags: ["as-config", "name", "out", "rows"],
  aliases: { o: "out" },
  async run(ctx) {
    const input = await readInput(required(ctx, "A file to read (or - for standard input)"));
    const result = await ctx.client.json<InferResult>("POST", "/api/infer", { body: { input } });

    if (boolFlag(ctx.flags, "as-config", false)) {
      const file = serializeConfigFile({
        name: stringFlag(ctx.flags, "name") ?? "Inferred schema",
        description: "",
        fields: result.fields,
        rowCount: numberFlag(ctx.flags, "rows") ?? 100,
      });
      const out = stringFlag(ctx.flags, "out");
      if (out && out !== "-") await Bun.write(out, file);
      else ctx.print(file);
      return;
    }

    render(ctx, result, () => {
      ctx.print(dim(`Detected ${result.detected} — ${count(result.fields.length, "field")}`));
      ctx.print(table(["FIELD", "TYPE"], result.fields.map(fieldRow)));
      for (const note of result.notes) ctx.print(dim(note));
    });
  },
};

/* --------------------------------- the API -------------------------------- */

const openapi: Command = {
  name: "openapi",
  summary: "This API as an OpenAPI 3.0 document",
  usage: "ddg openapi [--out FILE]",
  details:
    "Needs no credential. The document names the server it came from, so a collection\n" +
    "imported from it points back at that server.",
  flags: ["out"],
  aliases: { o: "out" },
  anonymous: true,
  async run(ctx) {
    const response = await ctx.client.request("GET", "/api/openapi.json");
    await writeBody(response, stringFlag(ctx.flags, "out"));
  },
};

const endpoints: Command = {
  name: "endpoints",
  summary: "The server's own endpoint index",
  usage: "ddg endpoints",
  details:
    "Read from GET /api, so it is the running server's list rather than this CLI's idea\n" +
    "of it — including any endpoint newer than the binary.",
  anonymous: true,
  async run(ctx) {
    // `{ "GET    /api/configs": "List configurations" }` — the key is already
    // padded by the server, which is a table waiting to be split in two.
    const index = await ctx.client.get<{ endpoints?: Record<string, string> }>("/api");
    const rows = Object.entries(index.endpoints ?? {});
    render(ctx, index, () => {
      if (!rows.length) {
        ctx.print(dim("The server listed no endpoints."));
        return;
      }
      ctx.print(
        table(
          ["METHOD", "PATH", "PURPOSE"],
          rows.map(([route, summary]) => {
            const [method = "", path = ""] = route.trim().split(/\s+/, 2);
            return [method, path, truncate(summary, 64)];
          }),
        ),
      );
    });
  },
};

export const COMMANDS: Command[] = [
  login,
  logout,
  whoami,
  status,
  keys,
  configs,
  generate,
  datasets,
  templates,
  notes,
  infer,
  openapi,
  endpoints,
];

/** Global flags: accepted by every command, handled before dispatch. */
export const GLOBAL_FLAGS = ["url", "key", "token", "json", "help", "version", "config"] as const;
export const GLOBAL_BOOLEANS = ["json", "help", "version"] as const;

/** Refuses a flag the command did not declare, before anything is sent. */
export function checkFlags(command: Command, flags: Flags): void {
  assertKnownFlags(flags, [...GLOBAL_FLAGS, ...(command.flags ?? [])]);
}
