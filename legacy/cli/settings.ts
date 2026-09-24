/**
 * Where the CLI keeps the server address and the credential for it.
 *
 * One small JSON file, written only by `ddg login` and `ddg logout`, so that
 * every other command is a single word. A flag beats an environment variable
 * beats the file, which is the order of "how deliberate was this" — a `--url`
 * typed on the line is about this one run, and the file is about every run.
 *
 * The file holds a credential, so it is written `0600` and never printed back:
 * `ddg whoami` says which kind is stored and how it arrived, not what it is.
 */
import { homedir } from "node:os";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { credentialFor, type Credential } from "./client";
import type { Flags } from "./args";
import { stringFlag } from "./args";

export const DEFAULT_URL = "http://localhost:3000";

export type Stored = {
  url?: string;
  /** A `pk_…` key or a PocketBase token; the prefix says which. */
  credential?: string;
  /** Who the stored credential belongs to, for `whoami` before a round trip. */
  email?: string;
  savedAt?: string;
};

export type Env = Record<string, string | undefined>;

/**
 * `~/.config/ddg/config.json`, or wherever XDG says instead.
 *
 * macOS has its own convention for this and this file ignores it: someone
 * running a dev tool on a laptop and on a server wants the same path on both,
 * and `~/Library/Application Support` is neither greppable nor memorable.
 */
export function settingsPath(env: Env = process.env, home = homedir()): string {
  if (env.DDG_CONFIG) return env.DDG_CONFIG;
  const base = env.XDG_CONFIG_HOME?.trim() || path.join(home, ".config");
  return path.join(base, "ddg", "config.json");
}

export async function readSettings(file: string): Promise<Stored> {
  try {
    const raw = (await Bun.file(file).json()) as unknown;
    return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Stored) : {};
  } catch {
    // Missing is the normal state before the first login, and a file someone
    // has hand-edited into nonsense should not stop the CLI from starting —
    // both read as "nothing stored", and a login rewrites it.
    return {};
  }
}

export async function writeSettings(file: string, settings: Stored): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  // node:fs rather than Bun.write for the one reason that matters here: the
  // mode is applied as the file is created, so the credential is never
  // readable by anyone else, not even for the instant between write and chmod.
  await writeFile(file, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
}

export async function clearSettings(file: string): Promise<void> {
  await rm(file, { force: true });
}

/* ------------------------------ resolution ------------------------------- */

export type Resolved = {
  url: string;
  credential: Credential | null;
  /** Where the credential came from, for `whoami` and for error messages. */
  source: "flag" | "env" | "file" | "none";
};

/**
 * The address and credential this run will use.
 *
 * Pure, and given its inputs rather than reading them, so the precedence can
 * be tested without a home directory or an environment.
 */
export function resolve(flags: Flags, env: Env, stored: Stored): Resolved {
  const url = stringFlag(flags, "url") ?? env.DDG_URL ?? stored.url ?? DEFAULT_URL;

  const flagCredential = stringFlag(flags, "key") ?? stringFlag(flags, "token");
  if (flagCredential) return { url: trimSlash(url), credential: credentialFor(flagCredential), source: "flag" };

  const envCredential = env.DDG_API_KEY ?? env.DDG_TOKEN;
  if (envCredential) return { url: trimSlash(url), credential: credentialFor(envCredential), source: "env" };

  if (stored.credential) return { url: trimSlash(url), credential: credentialFor(stored.credential), source: "file" };

  return { url: trimSlash(url), credential: null, source: "none" };
}

/** `http://host:3000/` and `http://host:3000` have to mean the same thing. */
const trimSlash = (url: string) => url.replace(/\/+$/, "");
