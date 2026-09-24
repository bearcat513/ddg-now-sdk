/**
 * The CLI's side of the API.
 *
 * `src/lib/api.ts` is the browser's client: relative URLs, and a session
 * cookie the page never sees. A terminal has neither, so this one carries an
 * absolute base URL and an explicit credential — an API key in `X-API-Key`, or
 * a PocketBase token in `Authorization`, exactly the two headers the server
 * already accepts (see `src/server/session.ts`).
 *
 * Nothing here knows about commands or printing: it returns parsed JSON, text,
 * or the raw `Response` for the routes that answer with a file, and it turns
 * every failure into a `CliError` carrying the server's own message.
 */
import { API_KEY_PREFIX } from "../server/session";

/** An error already phrased for the user: printed as-is, with no stack. */
export class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode = 1,
  ) {
    super(message);
  }
}

export class ApiError extends CliError {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Which header a credential travels in.
 *
 * The prefix decides it, the same test the server uses: a key starts `pk_`,
 * and a PocketBase token is a JWT, which never can.
 */
export type Credential = { kind: "key" | "token"; value: string };

export const credentialFor = (value: string): Credential => ({
  kind: value.startsWith(API_KEY_PREFIX) ? "key" : "token",
  value,
});

export type QueryValue = string | number | boolean | undefined;

/** The session cookie the login route sets, and the only place its token is. */
const SESSION_COOKIE = "ddg_session";

export class Client {
  constructor(
    readonly baseUrl: string,
    readonly credential: Credential | null,
  ) {}

  /** An absolute URL, with the undefined query values left off entirely. */
  url(path: string, params: Record<string, QueryValue> = {}): string {
    const url = new URL(path, `${this.baseUrl}/`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.href;
  }

  private headers(hasBody: boolean): Record<string, string> {
    const headers: Record<string, string> = {};
    if (hasBody) headers["Content-Type"] = "application/json";
    if (this.credential?.kind === "key") headers["X-API-Key"] = this.credential.value;
    if (this.credential?.kind === "token") headers.Authorization = this.credential.value;
    return headers;
  }

  /**
   * One request, with the connection failure and the API failure both turned
   * into sentences.
   *
   * A CLI that prints `fetch failed` for a server that is not running has
   * wasted the one chance it had to say something useful, so the address it
   * tried is part of the message.
   */
  async request(
    method: string,
    path: string,
    options: { params?: Record<string, QueryValue>; body?: unknown } = {},
  ): Promise<Response> {
    const url = this.url(path, options.params);
    const hasBody = options.body !== undefined;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: this.headers(hasBody),
        body: hasBody ? JSON.stringify(options.body) : undefined,
      });
    } catch (error) {
      throw new CliError(
        `Could not reach ${this.baseUrl} — ${error instanceof Error ? error.message : "the request failed"}.\n` +
          `Is the server running? Point elsewhere with --url or DDG_URL.`,
      );
    }

    if (!response.ok) throw await this.failure(response);
    return response;
  }

  /** The server's `{ error }` envelope, or the status when there is none. */
  private async failure(response: Response): Promise<ApiError> {
    const text = await response.text().catch(() => "");
    let message = "";
    try {
      message = String((JSON.parse(text) as { error?: string }).error ?? "");
    } catch {
      // A non-JSON body is a proxy or a crash; the status carries it instead.
    }
    if (!message) message = `Request failed (${response.status} ${response.statusText}).`;

    // A 401 with no credential attached is the first-run mistake, and the
    // server cannot know which of the two fixes applies. When one *was* sent
    // the server's own message already says it expired — repeating it here
    // would be two sentences for one fact.
    if (response.status === 401 && !this.credential) {
      message += "\nNo credential was sent: run `ddg login`, or set DDG_API_KEY to a key from Settings → API keys.";
    }
    return new ApiError(message, response.status);
  }

  async json<T>(
    method: string,
    path: string,
    options: { params?: Record<string, QueryValue>; body?: unknown } = {},
  ): Promise<T> {
    const response = await this.request(method, path, options);
    return (await response.json()) as T;
  }

  get<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
    return this.json<T>("GET", path, { params });
  }

  /**
   * Signs in and keeps the token.
   *
   * The token is never in the response body — the server puts it in an
   * httpOnly cookie, which is right for the browser this API was written for
   * and leaves the header as the only place a terminal can read it from.
   */
  async login(email: string, password: string): Promise<{ user: { email: string; name: string }; token: string }> {
    const response = await this.request("POST", "/api/auth/login", { body: { email, password } });
    const { user } = (await response.json()) as { user: { email: string; name: string } };

    const token = readSessionCookie(response.headers.getSetCookie());
    if (!token) throw new CliError("Signed in, but the server sent no session token to keep.");
    return { user, token };
  }
}

/** Pulls the session token out of the `Set-Cookie` the login route sends. */
export function readSessionCookie(cookies: string[]): string | null {
  for (const cookie of cookies) {
    const [pair] = cookie.split(";");
    const index = pair?.indexOf("=") ?? -1;
    if (!pair || index === -1) continue;
    if (pair.slice(0, index).trim() !== SESSION_COOKIE) continue;
    const value = decodeURIComponent(pair.slice(index + 1).trim());
    if (value) return value;
  }
  return null;
}

/**
 * Writes a response body where the caller asked for it: a file, or stdout.
 *
 * Streamed rather than buffered, because one of these is a CSV of a hundred
 * thousand rows and there is no reason for it to exist in memory twice.
 */
export async function writeBody(response: Response, out: string | undefined): Promise<void> {
  // `-` is the long-standing name for standard output, and so is saying
  // nothing at all — which makes `> file` and `--out file` both work.
  if (out && out !== "-") {
    await Bun.write(out, response);
    return;
  }
  await Bun.write(Bun.stdout, response);
}
