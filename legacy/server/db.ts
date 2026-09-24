/**
 * Storage, backed by PocketBase.
 *
 * Four collections — `configs`, `datasets`, `script_templates`, `notes` —
 * defined in docker/pb_migrations/.
 *
 * Every function takes the caller's token and does its work as that user.
 * Nothing here filters by owner: the collection rules do that inside
 * PocketBase, so a missing `WHERE` in this file cannot leak another account's
 * records. A configuration or template shared with the caller comes back from
 * a read and is refused by a write, for the same reason.
 *
 * Record ids are minted here rather than by PocketBase, so they stay the
 * readable `cfg_…` / `ds_…` / `tpl_…` / `note_…` strings the REST API, the
 * exported `*.ddg.json` files and the UI have always used. The migration
 * widens PocketBase's fixed-length id field to allow them. A note's `[[…]]`
 * references lean on the same prefixes to know which collection to read.
 */
import { readMetadata, type Metadata } from "../lib/metadata";
import type { Dataset, DatasetWithRows, Field, FieldMapping, SchemaConfig } from "../lib/types";
import { MAX_NOTE_BODY_LENGTH, MAX_NOTE_TITLE_LENGTH, type Note } from "../lib/notes";
import type { ScriptTemplate } from "../lib/scriptTemplate";
import { ApiError } from "./http";
import {
  POCKETBASE_URL,
  clientFor,
  countRecords,
  isNotFound,
  pocketbaseStatus,
  toApiError,
  toIso,
} from "./pocketbase";

/** PocketBase rejects a `perPage` above this, so larger reads are paged. */
const MAX_PER_PAGE = 500;

/**
 * Matches `maxSize` on the `rows` JSON field in the migration. Checked here so
 * an oversized run fails with a sentence about the dataset instead of
 * PocketBase's generic field error after a multi-megabyte upload.
 */
const MAX_DATASET_BYTES = 64 * 1024 * 1024;

type Record_ = globalThis.Record<string, unknown>;

/* ------------------------------- helpers -------------------------------- */

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

/** Reads one record, or null when it is not there — or not this caller's. */
async function readOne(
  token: string,
  collection: string,
  id: string,
  options?: { fields?: string },
): Promise<Record_ | null> {
  try {
    return await clientFor(token).collection(collection).getOne(id, options);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw toApiError(error, `Could not read ${collection}`);
  }
}

/**
 * Lists records newest-first. `limit <= 0` means everything; anything above a
 * single page is fetched in batches, since PocketBase caps `perPage`.
 */
async function readMany(
  token: string,
  collection: string,
  { limit, sort, fields }: { limit: number; sort: string; fields?: string },
): Promise<Record_[]> {
  try {
    const records = clientFor(token).collection(collection);
    if (limit > 0 && limit <= MAX_PER_PAGE) return (await records.getList(1, limit, { sort, fields })).items;

    const all = await records.getFullList({ batch: MAX_PER_PAGE, sort, fields });
    return limit > 0 ? all.slice(0, limit) : all;
  } catch (error) {
    throw toApiError(error, `Could not list ${collection}`);
  }
}

async function write(
  token: string,
  collection: string,
  id: string | null,
  body: Record_,
  what: string,
): Promise<Record_ | null> {
  try {
    const records = clientFor(token).collection(collection);
    return id === null ? await records.create(body) : await records.update(id, body);
  } catch (error) {
    // 404 covers both "no such record" and "not yours to change": PocketBase
    // answers a rule miss the same way, and so does this API.
    if (id !== null && isNotFound(error)) return null;
    throw toApiError(error, what);
  }
}

async function remove(token: string, collection: string, id: string): Promise<boolean> {
  try {
    await clientFor(token).collection(collection).delete(id);
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw toApiError(error, `Could not delete from ${collection}`);
  }
}

/* -------------------------------- mapping -------------------------------- */

/** Relation fields come back as "" / [] when empty. */
const relationId = (value: unknown): string => (typeof value === "string" ? value : "");
const relationIds = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

function toConfig(row: Record_): SchemaConfig {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    fields: (Array.isArray(row.schema) ? row.schema : []) as Field[],
    // Like metadata: a json column, so already parsed — and absent entirely on
    // every configuration saved before mappings existed.
    mappings: (Array.isArray(row.mappings) ? row.mappings : []) as FieldMapping[],
    rowCount: Number(row.rowCount ?? 0),
    seed: String(row.seed ?? ""),
    locale: String(row.locale ?? ""),
    // Stored as a json column, so it comes back parsed — or as nothing at all
    // for a configuration saved before metadata existed.
    metadata: readMetadata(row.metadata),
    ownerId: relationId(row.owner),
    sharedWith: relationIds(row.sharedWith),
    createdAt: toIso(row.created),
    updatedAt: toIso(row.updated),
  };
}

function toDataset(row: Record_): Dataset {
  return {
    id: String(row.id),
    // An unset relation comes back as "", and the API contract says null.
    configId: relationId(row.config) || null,
    name: String(row.name ?? ""),
    rowCount: Number(row.rowCount ?? 0),
    fieldCount: Number(row.fieldCount ?? 0),
    ownerId: relationId(row.owner),
    createdAt: toIso(row.created),
  };
}

function toScriptTemplate(row: Record_): ScriptTemplate {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    body: String(row.body ?? ""),
    ownerId: relationId(row.owner),
    sharedWith: relationIds(row.sharedWith),
    createdAt: toIso(row.created),
    updatedAt: toIso(row.updated),
  };
}

/**
 * Notes carry no `sharedWith`: the collection has no such field, and its rules
 * are the owner's own.
 */
function toNote(row: Record_): Note {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    ownerId: relationId(row.owner),
    createdAt: toIso(row.created),
    updatedAt: toIso(row.updated),
  };
}

/* ----------------------------- configs ----------------------------- */

export async function listConfigs(token: string): Promise<SchemaConfig[]> {
  return (await readMany(token, "configs", { limit: 0, sort: "-updated" })).map(toConfig);
}

export async function getConfig(token: string, id: string): Promise<SchemaConfig | null> {
  const row = await readOne(token, "configs", id);
  return row ? toConfig(row) : null;
}

export type ConfigInput = {
  name: string;
  description?: string;
  fields: Field[];
  mappings?: FieldMapping[];
  rowCount: number;
  seed?: string;
  locale?: string;
  metadata?: Metadata;
};

const configBody = (input: ConfigInput): Record_ => ({
  name: input.name,
  description: input.description ?? "",
  schema: input.fields,
  mappings: input.mappings ?? [],
  rowCount: input.rowCount,
  seed: input.seed ?? "",
  locale: input.locale ?? "",
  metadata: input.metadata ?? {},
});

export async function createConfig(token: string, input: ConfigInput): Promise<SchemaConfig> {
  const row = await write(
    token,
    "configs",
    null,
    { id: newId("cfg"), ...configBody(input) },
    "Could not save the configuration",
  );
  return toConfig(row!);
}

export async function updateConfig(token: string, id: string, input: ConfigInput): Promise<SchemaConfig | null> {
  const row = await write(token, "configs", id, configBody(input), "Could not update the configuration");
  return row ? toConfig(row) : null;
}

export async function deleteConfig(token: string, id: string): Promise<boolean> {
  return remove(token, "configs", id);
}

/* ---------------------------- datasets ----------------------------- */

/** The stored rows are large, so listings ask for every field except them. */
const DATASET_SUMMARY_FIELDS = "id,config,name,rowCount,fieldCount,owner,created";

export async function listDatasets(token: string, limit = 50): Promise<Dataset[]> {
  const rows = await readMany(token, "datasets", { limit, sort: "-created", fields: DATASET_SUMMARY_FIELDS });
  return rows.map(toDataset);
}

export async function getDataset(token: string, id: string): Promise<DatasetWithRows | null> {
  const row = await readOne(token, "datasets", id);
  if (!row) return null;
  return {
    ...toDataset(row),
    rows: (Array.isArray(row.rows) ? row.rows : []) as Record_[],
  };
}

/**
 * One dataset without its rows — what a note's `[[ds_…]]` reference needs.
 *
 * `getDataset` would pull the whole thing back to read a name off it, and a
 * stored dataset runs to tens of megabytes.
 */
export async function getDatasetSummary(token: string, id: string): Promise<Dataset | null> {
  const row = await readOne(token, "datasets", id, { fields: DATASET_SUMMARY_FIELDS });
  return row ? toDataset(row) : null;
}

export async function saveDataset(
  token: string,
  input: { configId: string | null; name: string; rows: Record_[]; fieldCount: number },
): Promise<Dataset> {
  const rows = JSON.stringify(input.rows);
  if (rows.length > MAX_DATASET_BYTES) {
    throw new ApiError(
      `This dataset is ${(rows.length / 1024 / 1024).toFixed(1)} MB, over the ${MAX_DATASET_BYTES / 1024 / 1024} MB ` +
        "a stored dataset may occupy. Generate fewer rows, or add ?save=false to stream it back without storing it.",
      413,
    );
  }

  const row = await write(
    token,
    "datasets",
    null,
    {
      id: newId("ds"),
      // PocketBase wants "" for an unset relation, not null.
      config: input.configId ?? "",
      name: input.name,
      rowCount: input.rows.length,
      fieldCount: input.fieldCount,
      rows: input.rows,
    },
    "Could not save the dataset",
  );

  return toDataset(row!);
}

export async function deleteDataset(token: string, id: string): Promise<boolean> {
  return remove(token, "datasets", id);
}

/**
 * The newest dataset generated from one configuration, rows and all — what a
 * field mapping resolves to.
 *
 * Newest rather than a pinned id, so regenerating the source schema is enough
 * to refresh everything that borrows from it. The filter runs inside
 * PocketBase under the caller's own rules, so this can only ever find a
 * dataset that account generated: datasets are never shared, which means a
 * mapping onto somebody else's shared configuration resolves against your own
 * run of it, not theirs.
 */
export async function latestDatasetForConfig(token: string, configId: string): Promise<DatasetWithRows | null> {
  try {
    const client = clientFor(token);
    // Bound through the SDK's own escaper rather than interpolated: a config
    // id arrives from a request body, and the filter is a little language.
    const row = await client
      .collection("datasets")
      .getFirstListItem(client.filter("config={:configId}", { configId }), { sort: "-created" });
    return { ...toDataset(row), rows: (Array.isArray(row.rows) ? row.rows : []) as Record_[] };
  } catch (error) {
    // "No rows yet" is an answer, not a failure — the caller has a better
    // sentence to write about it than this file does.
    if (isNotFound(error)) return null;
    throw toApiError(error, "Could not read the datasets for that configuration");
  }
}

/* ------------------------- script templates ------------------------ */

export async function listScriptTemplates(token: string): Promise<ScriptTemplate[]> {
  return (await readMany(token, "script_templates", { limit: 0, sort: "-updated" })).map(toScriptTemplate);
}

export async function getScriptTemplate(token: string, id: string): Promise<ScriptTemplate | null> {
  const row = await readOne(token, "script_templates", id);
  return row ? toScriptTemplate(row) : null;
}

export type ScriptTemplateInput = { name: string; body: string };

export async function createScriptTemplate(token: string, input: ScriptTemplateInput): Promise<ScriptTemplate> {
  const row = await write(
    token,
    "script_templates",
    null,
    { id: newId("tpl"), name: input.name, body: input.body },
    "Could not save the script template",
  );
  return toScriptTemplate(row!);
}

export async function updateScriptTemplate(
  token: string,
  id: string,
  input: ScriptTemplateInput,
): Promise<ScriptTemplate | null> {
  const row = await write(
    token,
    "script_templates",
    id,
    { name: input.name, body: input.body },
    "Could not update the script template",
  );
  return row ? toScriptTemplate(row) : null;
}

export async function deleteScriptTemplate(token: string, id: string): Promise<boolean> {
  return remove(token, "script_templates", id);
}

/* -------------------------------- notes --------------------------------- */

export async function listNotes(token: string): Promise<Note[]> {
  return (await readMany(token, "notes", { limit: 0, sort: "-updated" })).map(toNote);
}

export async function getNote(token: string, id: string): Promise<Note | null> {
  const row = await readOne(token, "notes", id);
  return row ? toNote(row) : null;
}

export type NoteInput = { title: string; body: string };

/**
 * Trimmed and cut to length here as well as in the route, because this is the
 * last thing between a body and a PocketBase field error — which says
 * "title: invalid value" rather than what the limit was.
 */
const noteBody = (input: NoteInput): Record_ => ({
  title: input.title.slice(0, MAX_NOTE_TITLE_LENGTH),
  body: input.body.slice(0, MAX_NOTE_BODY_LENGTH),
});

export async function createNote(token: string, input: NoteInput): Promise<Note> {
  const row = await write(token, "notes", null, { id: newId("note"), ...noteBody(input) }, "Could not save the note");
  return toNote(row!);
}

export async function updateNote(token: string, id: string, input: NoteInput): Promise<Note | null> {
  const row = await write(token, "notes", id, noteBody(input), "Could not update the note");
  return row ? toNote(row) : null;
}

export async function deleteNote(token: string, id: string): Promise<boolean> {
  return remove(token, "notes", id);
}

/* --------------------------------- meta --------------------------------- */

export const databaseUrl = (): string => POCKETBASE_URL;

/**
 * Backs `GET /api/meta`: where the data lives and how much of it this account
 * can see — the counts come back through the same rules as every other read,
 * so they include whatever has been shared with the caller.
 */
export async function databaseMeta(token: string) {
  const status = await pocketbaseStatus();
  if (!status.reachable) {
    return { ...status, configs: null, datasets: null, scriptTemplates: null, notes: null };
  }

  try {
    const [configs, datasets, scriptTemplates, notes] = await Promise.all([
      countRecords(token, "configs"),
      countRecords(token, "datasets"),
      countRecords(token, "script_templates"),
      countRecords(token, "notes"),
    ]);
    return { ...status, configs, datasets, scriptTemplates, notes };
  } catch (error) {
    throw toApiError(error, "Could not read the record counts");
  }
}
