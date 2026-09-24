import type { Dataset, Field, FieldMapping, SchemaConfig } from "./types";
import type { Metadata } from "./metadata";
import type { Note, ResolvedReference } from "./notes";
import type { Preferences } from "./preferences";
import type { TelegramState } from "./telegram";
import type { ScriptTemplate } from "./scriptTemplate";

/** An API failure that kept its status, so 401 can be told from 400. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError((payload as { error?: string }).error ?? `Request failed (${response.status})`, response.status);
  }
  return payload as T;
}

export type GenerateResult = {
  dataset: Dataset;
  rows: Record<string, unknown>[];
  total: number;
  truncated: boolean;
};

export type InferResult = {
  fields: Field[];
  notes: string[];
  detected: "json" | "typescript" | "sql";
};

/** Result of running an enum field's choice script from the editor. */
export type EnumPreviewResult =
  | {
      ok: true;
      values: string[];
      count: number;
      returned: number;
      truncated: boolean;
      durationMs: number;
      logs: string[];
    }
  | { ok: false; error: string; logs: string[] };

export type ScriptTemplatePayload = { name: string; body: string };

export type NotePayload = { title: string; body: string };

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  createdAt: string;
  /** Sent with the session, so the first paint already has the right theme. */
  preferences: Preferences;
};

/** What the server will say about one record's sharing. */
export type Shares = {
  /** The owner's address — who shared it with you, when it is not yours. */
  owner: string;
  /** Who it is shared with. Populated for the owner only. */
  sharedWith: string[];
  /** Whether this account may change that list. */
  canShare: boolean;
};

/** The two things that can be shared, spelled as their API path segment. */
export type Shareable = "configs" | "script-templates";

/**
 * One API key, as the server will describe it — never the key itself.
 *
 * The secret exists in the issuing response and nowhere else: only its
 * SHA-256 is stored, so there is nothing to show a second time.
 */
export type ApiKey = {
  id: string;
  name: string;
  createdAt: string;
  /** Empty when the key never expires. */
  expiresAt: string;
  /** Empty until first use; written at most every few minutes after that. */
  lastUsedAt: string;
};

/** The one response that carries the secret, and the only time it exists. */
export type IssuedApiKey = ApiKey & { key: string };

export type ConfigPayload = {
  name: string;
  description: string;
  fields: Field[];
  /** Fields in this schema that draw from another configuration. */
  mappings: FieldMapping[];
  rowCount: number;
  seed: string;
  locale: string;
  metadata: Metadata;
};

/**
 * What one configuration offers a mapping on its far side.
 *
 * `dataset` is the run the columns were read from, and null when that
 * configuration has never been generated — in which case `columns` is what its
 * schema says it will produce, and a mapping onto it will not resolve until it
 * has been run once.
 */
export type ConfigColumns = {
  columns: string[];
  dataset: Dataset | null;
};

/** The download formats a generated dataset can be served as. */
export type ExportFormat = "csv" | "json" | "sql";

/**
 * What a notification settings save may carry.
 *
 * `botToken` is write-only and three-valued: absent keeps the stored one —
 * the page never has it to send back — and `""` drops it.
 */
export type TelegramPayload = Partial<TelegramState> & { botToken?: string };

const exportUrl = (id: string, format: ExportFormat) => `/api/datasets/${id}/export?format=${format}`;

const scriptUrl = (datasetId: string, templateId: string) =>
  `/api/datasets/${datasetId}/script?templateId=${encodeURIComponent(templateId)}`;

/** The exact bytes a download link serves, as a string for the clipboard. */
async function fetchText(url: string, whatFailed: string): Promise<string> {
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    // The error path answers with the standard { error } JSON envelope.
    const message = (() => {
      try {
        return (JSON.parse(text) as { error?: string }).error;
      } catch {
        return undefined;
      }
    })();
    throw new Error(message ?? `${whatFailed} failed (${response.status})`);
  }
  return text;
}

const sharesUrl = (kind: Shareable, id: string) => `/api/${kind}/${encodeURIComponent(id)}/shares`;

/** `?limit=` where a limit was asked for, and nothing where it was not. */
const limitQuery = (limit?: number) => (limit === undefined ? "" : `?limit=${limit}`);

/** Where the whole-workspace download lives. */
const WORKSPACE_EXPORT_URL = "/api/export";

/** The OpenAPI document, for Postman, Bruno and the code generators. */
const OPENAPI_URL = "/api/openapi.json";

export const api = {
  /* --------------------------------- auth -------------------------------- */

  register: (body: { email: string; password: string; name?: string }) =>
    request<{ user: SessionUser }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: SessionUser }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ user: SessionUser }>("/api/auth/me"),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ user: SessionUser }>("/api/auth/password", { method: "POST", body: JSON.stringify(body) }),

  /* -------------------------------- sharing ------------------------------ */

  listShares: (kind: Shareable, id: string) => request<Shares>(sharesUrl(kind, id)),
  addShare: (kind: Shareable, id: string, email: string) =>
    request<Shares>(sharesUrl(kind, id), { method: "POST", body: JSON.stringify({ email }) }),
  removeShare: (kind: Shareable, id: string, email: string) =>
    request<Shares>(`${sharesUrl(kind, id)}?email=${encodeURIComponent(email)}`, { method: "DELETE" }),

  /* ------------------------------- api keys ------------------------------ */

  listApiKeys: () => request<ApiKey[]>("/api/keys"),
  /** The response is the only place the key will ever appear. */
  createApiKey: (body: { name: string; expiresInDays?: number }) =>
    request<IssuedApiKey>("/api/keys", { method: "POST", body: JSON.stringify(body) }),
  deleteApiKey: (id: string) => request<{ ok: true }>(`/api/keys/${encodeURIComponent(id)}`, { method: "DELETE" }),

  /* --------------------------------- data -------------------------------- */

  /** Counts are null when PocketBase cannot be reached. */
  meta: () =>
    request<{
      url: string;
      reachable: boolean;
      configs: number | null;
      datasets: number | null;
      scriptTemplates: number | null;
      notes: number | null;
    }>("/api/meta"),

  /* ------------------------------ preferences ---------------------------- */

  getPreferences: () => request<Preferences>("/api/preferences"),
  savePreferences: (preferences: Preferences) =>
    request<Preferences>("/api/preferences", { method: "PUT", body: JSON.stringify(preferences) }),

  /** Every configuration and script template, plus preferences, as one file. */
  workspaceExportUrl: WORKSPACE_EXPORT_URL,
  workspaceExportText: () => fetchText(WORKSPACE_EXPORT_URL, "The workspace export"),

  /* ---------------------------- notifications ---------------------------- */

  getTelegram: () => request<TelegramState>("/api/telegram"),
  /** The bot token is write-only: leave it out to keep the stored one. */
  saveTelegram: (body: TelegramPayload) =>
    request<TelegramState>("/api/telegram", { method: "PUT", body: JSON.stringify(body) }),
  unlinkTelegram: () => request<TelegramState>("/api/telegram", { method: "DELETE" }),
  pairTelegram: () => request<TelegramState>("/api/telegram/pair", { method: "POST" }),
  confirmTelegramPairing: () => request<TelegramState>("/api/telegram/pair/confirm", { method: "POST" }),
  testTelegram: () => request<TelegramState>("/api/telegram/test", { method: "POST" }),

  /** This whole API as an OpenAPI 3.0 document — needs no credential to read. */
  openApiUrl: OPENAPI_URL,
  openApiFileName: "dummy-data-generator.openapi.json",
  openApiText: () => fetchText(OPENAPI_URL, "The OpenAPI document"),

  listConfigs: () => request<SchemaConfig[]>("/api/configs"),
  /** Columns a field mapping may draw from, and the dataset behind them. */
  configColumns: (id: string) => request<ConfigColumns>(`/api/configs/${encodeURIComponent(id)}/columns`),
  createConfig: (body: ConfigPayload) =>
    request<SchemaConfig>("/api/configs", { method: "POST", body: JSON.stringify(body) }),
  updateConfig: (id: string, body: ConfigPayload) =>
    request<SchemaConfig>(`/api/configs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteConfig: (id: string) => request<{ ok: true }>(`/api/configs/${id}`, { method: "DELETE" }),
  importConfig: (file: unknown) =>
    request<SchemaConfig>("/api/configs/import", { method: "POST", body: JSON.stringify(file) }),
  exportConfigUrl: (id: string) => `/api/configs/${id}/export`,

  previewEnumScript: (script: string) =>
    request<EnumPreviewResult>("/api/enum/preview", { method: "POST", body: JSON.stringify({ script }) }),

  infer: (input: string) => request<InferResult>("/api/infer", { method: "POST", body: JSON.stringify({ input }) }),

  /** `limit` caps the rows that come back inline; the dataset is stored whole. */
  generate: (
    body: {
      fields: Field[];
      mappings: FieldMapping[];
      rowCount: number;
      seed: string;
      locale: string;
      name: string;
      configId: string | null;
    },
    limit?: number,
  ) => request<GenerateResult>(`/api/generate${limitQuery(limit)}`, { method: "POST", body: JSON.stringify(body) }),

  listDatasets: (limit?: number) => request<Dataset[]>(`/api/datasets${limitQuery(limit)}`),
  /** Column names only — what a reference field needs to point at a column. */
  datasetColumns: (id: string) => request<{ columns: string[] }>(`/api/datasets/${id}/columns`),
  getDataset: (id: string, limit?: number) => request<GenerateResult>(`/api/datasets/${id}${limitQuery(limit)}`),
  deleteDataset: (id: string) => request<{ ok: true }>(`/api/datasets/${id}`, { method: "DELETE" }),

  exportUrl,
  exportText: (id: string, format: ExportFormat) => fetchText(exportUrl(id, format), "Export"),

  listScriptTemplates: () => request<ScriptTemplate[]>("/api/script-templates"),
  createScriptTemplate: (body: ScriptTemplatePayload) =>
    request<ScriptTemplate>("/api/script-templates", { method: "POST", body: JSON.stringify(body) }),
  updateScriptTemplate: (id: string, body: ScriptTemplatePayload) =>
    request<ScriptTemplate>(`/api/script-templates/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteScriptTemplate: (id: string) =>
    request<{ ok: true }>(`/api/script-templates/${id}`, { method: "DELETE" }),

  listNotes: () => request<Note[]>("/api/notes"),
  createNote: (body: NotePayload) => request<Note>("/api/notes", { method: "POST", body: JSON.stringify(body) }),
  updateNote: (id: string, body: NotePayload) =>
    request<Note>(`/api/notes/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteNote: (id: string) => request<{ ok: true }>(`/api/notes/${encodeURIComponent(id)}`, { method: "DELETE" }),
  noteExportUrl: (id: string) => `/api/notes/${encodeURIComponent(id)}/export`,
  noteExportText: (id: string) => fetchText(`/api/notes/${encodeURIComponent(id)}/export`, "The note export"),

  /**
   * What a note's `[[…]]` references point at, right now.
   *
   * Asked of the server rather than answered from the lists the page is
   * already holding, because those are cut to what the sidebar shows, because
   * only the database can say that a referenced record is gone — and because a
   * reference naming a field wants that field's value, which is nowhere on
   * this side at all.
   *
   * Each ref is what stands between the brackets: `cfg_1a2b`, or
   * `ds_9f8e#rows`.
   */
  resolveNoteReferences: (refs: string[]) =>
    request<{ references: ResolvedReference[] }>("/api/notes/references", {
      method: "POST",
      body: JSON.stringify({ refs }),
    }),

  /** A dataset rendered into a template, ready to download or copy. */
  scriptUrl,
  scriptText: (datasetId: string, templateId: string) =>
    fetchText(scriptUrl(datasetId, templateId), "Rendering the script"),
};
