/**
 * Sharing a configuration or a script template with another account.
 *
 * The work happens in PocketBase (docker/pb_hooks/lib/sharing.js), because
 * resolving an email address to an account means reading the `users`
 * collection, which no user token may do. These routes are a proxy: the
 * caller's own token goes along, so PocketBase still decides whether they own
 * the record.
 */
import { ApiError } from "./http";
import { POCKETBASE_URL, toApiError } from "./pocketbase";

/** Collection names as PocketBase knows them, keyed by API path segment. */
const COLLECTIONS = {
  configs: "configs",
  "script-templates": "script_templates",
} as const;

export type Shareable = keyof typeof COLLECTIONS;

/** What a share endpoint answers with. */
export type Shares = {
  /** The owner's email address — who shared it, when it is not yours. */
  owner: string;
  /** The people it is shared with. Only ever populated for the owner. */
  sharedWith: string[];
  /** Whether this caller may change the list. */
  canShare: boolean;
};

async function relay(
  token: string,
  kind: Shareable,
  id: string,
  init: RequestInit & { search?: string } = {},
): Promise<Response> {
  const { search = "", ...request } = init;
  const url = `${POCKETBASE_URL}/api/ddg/shares/${COLLECTIONS[kind]}/${encodeURIComponent(id)}${search}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...request,
      headers: { Authorization: token, ...(request.headers ?? {}) },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw toApiError(error, "Could not reach the sharing service");
  }

  const payload = (await response.json().catch(() => null)) as
    | (Shares & { message?: string })
    | { message?: string }
    | null;

  if (!response.ok) {
    // PocketBase's error shape is { message, status }; the API's is { error }.
    throw new ApiError(payload?.message || "The sharing request failed.", response.status);
  }

  return Response.json(payload as Shares);
}

export const listShares = (token: string, kind: Shareable, id: string) => relay(token, kind, id);

export const addShare = (token: string, kind: Shareable, id: string, email: string) =>
  relay(token, kind, id, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

export const removeShare = (token: string, kind: Shareable, id: string, email: string) =>
  relay(token, kind, id, { method: "DELETE", search: `?email=${encodeURIComponent(email)}` });

export function readEmail(value: unknown): string {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) throw new ApiError("A valid email address is required.");
  return email;
}
