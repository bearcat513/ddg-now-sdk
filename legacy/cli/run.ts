/**
 * The CLI, as one function.
 *
 * Everything the terminal does lives here rather than at the top level of
 * `main.ts`, so a test can run a whole command — flags, dispatch, request,
 * output — and read back what it printed and what it would have exited with.
 * `main.ts` is then the four lines that connect this to the real process.
 *
 * It does four things and delegates the rest: pick the command, parse its
 * flags, build a client from the address and credential in scope, and turn
 * whatever comes back out of it into an exit code.
 */
import { parseArgs, UsageError, type Flags } from "./args";
import { Client, CliError } from "./client";
import { checkFlags, COMMANDS, GLOBAL_BOOLEANS, type Command } from "./commands";
import { bold, dim, red } from "./output";
import { readSettings, resolve, settingsPath, type Env } from "./settings";

/**
 * Stamped in at build time by `cli-build.ts`.
 *
 * `typeof` rather than a bare read, because running from source never defines
 * it and an undeclared identifier is only safe inside a `typeof`.
 */
declare const DDG_CLI_VERSION: string | undefined;
export const VERSION = typeof DDG_CLI_VERSION === "string" ? DDG_CLI_VERSION : "dev";

/** Where the output goes. Given, so a test can collect it. */
export type Io = {
  print: (text?: string) => void;
  fail: (text: string) => void;
  env: Env;
};

const processIo: Io = {
  print: (text = "") => console.log(text),
  fail: text => console.error(text),
  env: process.env,
};

/* ---------------------------------- help --------------------------------- */

export function usage(): string {
  const width = Math.max(...COMMANDS.map(command => command.name.length));
  return [
    `${bold("ddg")} — dummy data generator, from the command line ${dim(VERSION)}`,
    "",
    `${dim("Usage:")} ddg <command> [options]`,
    "",
    ...COMMANDS.map(command => `  ${command.name.padEnd(width)}  ${command.summary}`),
    "",
    dim("Global options:"),
    "  --url URL       The server to talk to (default: $DDG_URL, then the stored one)",
    "  --key pk_…      An API key for this one run (default: $DDG_API_KEY)",
    "  --token TOKEN   A PocketBase user token for this one run (default: $DDG_TOKEN)",
    "  --json          Print the API's own JSON instead of a table",
    "  --config FILE   Use a different settings file (default: $DDG_CONFIG)",
    "  --help          This, or a command's own help",
    "",
    `${dim("Start with:")} ddg login  ${dim("— then")}  ddg configs list`,
    `${dim("Help for one command:")} ddg help generate`,
  ].join("\n");
}

export function commandHelp(command: Command): string {
  return [
    `${bold(command.name)} — ${command.summary}`,
    "",
    command.usage,
    ...(command.details ? ["", command.details] : []),
    ...(command.flags?.length ? ["", dim(`Options: ${command.flags.map(flag => `--${flag}`).join(", ")}`)] : []),
  ].join("\n");
}

/* -------------------------------- dispatch ------------------------------- */

/**
 * Exit codes worth telling apart in a script: 2 is "you typed it wrong", 1 is
 * "the server said no", and 0 is the work being done.
 */
export async function run(argv: string[], io: Io = processIo): Promise<number> {
  try {
    return await dispatch(argv, io);
  } catch (error) {
    if (error instanceof UsageError) {
      io.fail(`${red("error")} ${error.message}`);
      io.fail(dim("Run `ddg help <command>` for the usage."));
      return 2;
    }
    if (error instanceof CliError) {
      io.fail(`${red("error")} ${error.message}`);
      return error.exitCode;
    }
    // A bug rather than a refusal: the stack is the useful part.
    io.fail(String(error instanceof Error ? (error.stack ?? error.message) : error));
    return 1;
  }
}

async function dispatch(argv: string[], io: Io): Promise<number> {
  // The command comes off the front before anything is parsed, because each
  // one declares its own flags — `--limit` takes a value here and not there.
  const [name, ...rest] = argv;

  if (!name || name === "help" || name === "--help" || name === "-h") {
    // Parsed rather than scanned: `ddg help --url http://… generate` must not
    // mistake the address for the topic.
    const { positionals } = parseArgs(rest, { booleans: [...GLOBAL_BOOLEANS] });
    const topic = positionals[0];
    const command = topic ? COMMANDS.find(entry => entry.name === topic) : undefined;
    if (topic && !command) {
      io.fail(`No such command: ${topic}`);
      return 2;
    }
    io.print(command ? commandHelp(command) : usage());
    return 0;
  }

  if (name === "--version" || name === "-v" || name === "version") {
    io.print(VERSION);
    return 0;
  }

  const command = COMMANDS.find(entry => entry.name === name);
  if (!command) {
    io.fail(`No such command: ${name}\nRun \`ddg help\` for the list.`);
    return 2;
  }

  const { positionals, flags } = parseArgs(rest, {
    booleans: [...GLOBAL_BOOLEANS, ...(command.booleans ?? [])],
    aliases: { h: "help", ...(command.aliases ?? {}) },
  });

  if (flags.help) {
    io.print(commandHelp(command));
    return 0;
  }

  checkFlags(command, flags);

  const path = stringOr(flags.config) ?? settingsPath(io.env);
  const stored = await readSettings(path);
  const resolved = resolve(flags, io.env, stored);

  // Refused here rather than by the server, so the message names the two ways
  // to fix it instead of describing a 401.
  if (!resolved.credential && !command.anonymous) {
    io.fail(`${red("Not signed in.")} Run \`ddg login\`, or set DDG_API_KEY to a key from Settings → API keys.`);
    return 1;
  }

  await command.run({
    client: new Client(resolved.url, resolved.credential),
    flags,
    args: positionals,
    json: flags.json === true,
    settings: { path, stored, resolved },
    print: io.print,
  });

  return 0;
}

const stringOr = (value: Flags[string] | undefined): string | undefined =>
  typeof value === "string" ? value : undefined;
