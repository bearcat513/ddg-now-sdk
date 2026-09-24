/**
 * The flag parser.
 *
 * Small on purpose: the CLI's shape is a verb, an optional noun and a handful
 * of long flags, which is a parser and not a framework. Two rules earn their
 * keep and both come from real mistakes:
 *
 * - Boolean flags are declared, not guessed. Without that, `ddg configs list
 *   --json` reads `list` as the value of `--json`, and the command silently
 *   becomes "list nothing".
 * - Unknown flags are an error rather than a shrug. A typo in `--fromat csv`
 *   would otherwise be a successful run that quietly wrote JSON.
 */

export type Flags = Record<string, string | boolean>;

export type Parsed = { positionals: string[]; flags: Flags };

export type Spec = {
  /** Flags that never take a value; `--x` sets true, `--no-x` sets false. */
  booleans?: readonly string[];
  /** Single letters, spelled out: `{ o: "out" }` makes `-o` mean `--out`. */
  aliases?: Record<string, string>;
};

export class UsageError extends Error {}

/**
 * Whether a token is a flag rather than a value.
 *
 * A lone `-` is the usual name for standard input, and a negative number is a
 * value someone meant to pass — neither is a flag.
 */
function looksLikeFlag(token: string): boolean {
  return token.startsWith("-") && token !== "-" && !/^-\d/.test(token);
}

export function parseArgs(argv: readonly string[], spec: Spec = {}): Parsed {
  const booleans = new Set(spec.booleans ?? []);
  const aliases = spec.aliases ?? {};
  const positionals: string[] = [];
  const flags: Flags = {};

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index]!;

    // Everything after `--` is a value, whatever it looks like — the only way
    // to pass a filename that begins with a dash.
    if (token === "--") {
      positionals.push(...argv.slice(index + 1));
      break;
    }

    if (!looksLikeFlag(token)) {
      positionals.push(token);
      continue;
    }

    const body = token.startsWith("--") ? token.slice(2) : token.slice(1);
    const equals = body.indexOf("=");
    const rawName = equals === -1 ? body : body.slice(0, equals);
    const inlineValue = equals === -1 ? undefined : body.slice(equals + 1);

    // `--no-save` is the negative of `--save`, so a default-on flag has an
    // obvious way to be turned off.
    const negated = rawName.startsWith("no-");
    const name = aliases[negated ? rawName.slice(3) : rawName] ?? (negated ? rawName.slice(3) : rawName);

    if (!name) throw new UsageError(`"${token}" is not a flag.`);

    if (negated) {
      if (inlineValue !== undefined) throw new UsageError(`--no-${name} takes no value.`);
      flags[name] = false;
      continue;
    }

    if (inlineValue !== undefined) {
      if (booleans.has(name)) throw new UsageError(`--${name} takes no value.`);
      flags[name] = inlineValue;
      continue;
    }

    if (booleans.has(name)) {
      flags[name] = true;
      continue;
    }

    const next = argv[index + 1];
    if (next === undefined || looksLikeFlag(next)) throw new UsageError(`--${name} needs a value.`);
    flags[name] = next;
    index++;
  }

  return { positionals, flags };
}

/**
 * How many single-character edits apart two words are.
 *
 * Only ever run on a flag name that has already failed, so the quadratic cost
 * is a few dozen comparisons on the way to an error message.
 */
function distance(a: string, b: string): number {
  // One row of the matrix at a time: the previous row is all the next one needs.
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const substitute = previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1);
      row[j] = Math.min(row[j - 1]! + 1, previous[j]! + 1, substitute);
    }
    previous = row;
  }
  return previous[b.length]!;
}

/** Rejects a flag no command declared, naming the nearest one that exists. */
export function assertKnownFlags(flags: Flags, known: readonly string[]): void {
  for (const name of Object.keys(flags)) {
    if (known.includes(name)) continue;
    // Two edits catches the transposition and the dropped letter, which is
    // what a mistyped flag almost always is, without suggesting a flag that
    // merely happens to be short.
    const near = known
      .filter(candidate => distance(name, candidate) <= 2)
      .sort((a, b) => distance(name, a) - distance(name, b))[0];
    throw new UsageError(`Unknown flag --${name}.${near ? ` Did you mean --${near}?` : ""}`);
  }
}

/* ----------------------------- reading values ---------------------------- */

/** A flag's value as a string, or undefined when it was not given. */
export function stringFlag(flags: Flags, name: string): string | undefined {
  const value = flags[name];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new UsageError(`--${name} needs a value.`);
  return value;
}

export function numberFlag(flags: Flags, name: string): number | undefined {
  const raw = stringFlag(flags, name);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) throw new UsageError(`--${name} must be a number (got "${raw}").`);
  return Math.trunc(parsed);
}

export function boolFlag(flags: Flags, name: string, fallback: boolean): boolean {
  const value = flags[name];
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return !["false", "0", "no"].includes(value.toLowerCase());
}
