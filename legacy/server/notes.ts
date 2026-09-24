/**
 * Resolving the `[[…]]` references in a note.
 *
 * A note stores ids, not names (see src/lib/notes.ts), so something has to
 * turn `[[cfg_1a2b3c4d]]` into "Orders · 7 fields" before it can be read. That
 * happens here rather than in the browser for two reasons: the editor's lists
 * are cut to what the sidebar shows, so a note may name a dataset older than
 * the history limit; and a reference may point at a record that has since been
 * deleted, which only the database can say.
 *
 * A reference can also name one field — `[[ds_9f8e#rows]]` — and then what
 * comes back is that field's value, shaped into something the page draws
 * without deciding anything: a string, or a table of strings already cut to
 * the caps in src/lib/notes.ts. Two things follow from doing it here. The
 * dataset holding those rows never crosses to the browser whole — fifty rows
 * of it do — and the field is read through the same token as the record, so
 * naming a field is never a way to reach further than naming the record was.
 *
 * Every read goes through the caller's own token, so a reference resolves only
 * as far as that account may see. A record somebody else owns — or one that is
 * gone — comes back as `found: false` with the id as its own label, and the
 * note still renders.
 */
import { getConfig, getDataset, getDatasetSummary, getNote, getScriptTemplate } from "./db";
import {
  MAX_NOTE_REFERENCES,
  MAX_REFERENCE_CELL,
  MAX_REFERENCE_COLUMNS,
  MAX_REFERENCE_ROWS,
  missingReference,
  parseReferenceTarget,
  referenceKey,
  referenceKind,
  type ReferenceTarget,
  type ResolvedField,
  type ResolvedReference,
} from "../lib/notes";
import { valueToText } from "../lib/rows";
import { ApiError } from "./http";

const plural = (count: number, what: string) => `${count} ${what}${count === 1 ? "" : "s"}`;

/* ------------------------------ the record ------------------------------- */

/**
 * A record, reduced to what a note may reach.
 *
 * The curated shape in `REFERENCE_FIELDS` is what the picker offers; this is
 * the same list on the other side, and it is the *whole* of what a path can
 * walk. So a field nobody put here cannot be named however a note is written —
 * which is the point of building a view rather than walking the record.
 */
type View = { label: string; detail: string; fields: Record<string, unknown> };

/**
 * Whether any reference to this record asks for something only the rows can
 * answer.
 *
 * A dataset's rows are stored as one JSON column and can run to tens of
 * megabytes, so they are read when a note actually quotes them and not to put
 * a name on a chip.
 */
const wantsRows = (targets: ReferenceTarget[]) =>
  targets.some(target => target.field === "rows" || target.field.startsWith("rows."));

async function loadView(token: string, id: string, targets: ReferenceTarget[]): Promise<View | null> {
  const kind = referenceKind(id);

  if (kind === "config") {
    const config = await getConfig(token, id);
    if (!config) return null;
    return {
      label: config.name,
      detail: plural(config.fields.length, "field"),
      fields: {
        name: config.name,
        description: config.description,
        rowCount: config.rowCount,
        seed: config.seed,
        locale: config.locale,
        fields: config.fields,
        mappings: config.mappings,
        metadata: config.metadata,
        updatedAt: config.updatedAt,
      },
    };
  }

  if (kind === "dataset") {
    const dataset = wantsRows(targets) ? await getDataset(token, id) : await getDatasetSummary(token, id);
    if (!dataset) return null;
    return {
      label: dataset.name,
      detail: plural(dataset.rowCount, "row"),
      fields: {
        name: dataset.name,
        rowCount: dataset.rowCount,
        fieldCount: dataset.fieldCount,
        createdAt: dataset.createdAt,
        // Absent on the summary read, which is right: nothing asked for them.
        rows: "rows" in dataset ? dataset.rows : undefined,
      },
    };
  }

  if (kind === "script-template") {
    const template = await getScriptTemplate(token, id);
    if (!template) return null;
    return {
      label: template.name,
      detail: plural(template.body.split("\n").length, "line"),
      fields: { name: template.name, body: template.body, updatedAt: template.updatedAt },
    };
  }

  const note = await getNote(token, id);
  if (!note) return null;
  return {
    label: note.title,
    detail: "Note",
    fields: { title: note.title, body: note.body, updatedAt: note.updatedAt },
  };
}

/* -------------------------------- the path ------------------------------- */

/** Segments that would climb out of the view rather than walk into it. */
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Walks a dotted path, plucking through arrays on the way.
 *
 * Plucking is what makes `rows.email` mean "that column": a segment applied to
 * an array is applied to each of its elements instead, and the result is an
 * array again. Missing elements stay in place as null rather than being
 * dropped, so a column keeps the length of the rows it came from — the third
 * value is still the third row's.
 */
function valueAt(source: Record<string, unknown>, path: string): { found: boolean; value: unknown } {
  let cursor: unknown = source;

  for (const segment of path.split(".")) {
    if (!segment || FORBIDDEN.has(segment)) return { found: false, value: undefined };

    if (Array.isArray(cursor)) {
      cursor = cursor.map(entry => (isPlainObject(entry) && Object.hasOwn(entry, segment) ? entry[segment] : null));
      continue;
    }

    if (!isPlainObject(cursor) || !Object.hasOwn(cursor, segment)) return { found: false, value: undefined };
    cursor = cursor[segment];
  }

  return cursor === undefined ? { found: false, value: undefined } : { found: true, value: cursor };
}

/* ------------------------------- the shape ------------------------------- */

const cell = (value: unknown): string => {
  const text = valueToText(value);
  return text.length > MAX_REFERENCE_CELL ? `${text.slice(0, MAX_REFERENCE_CELL - 1)}…` : text;
};

/** A string worth its own block rather than a place in a sentence. */
const isLongText = (value: string) => value.includes("\n") || value.length > MAX_REFERENCE_CELL;

/**
 * The columns of a table built from `entries`, in first-seen order.
 *
 * Read from every row rather than from the first one, because rows are objects
 * and a generated row can be missing a key the next one has — a table built
 * from row one alone would silently drop a column.
 */
function columnsOf(entries: Record<string, unknown>[]): { columns: string[]; hidden: number } {
  const seen = new Set<string>();
  for (const entry of entries) for (const key of Object.keys(entry)) seen.add(key);
  const all = [...seen];
  return { columns: all.slice(0, MAX_REFERENCE_COLUMNS), hidden: Math.max(0, all.length - MAX_REFERENCE_COLUMNS) };
}

/** An array, as the table a note draws — capped in both directions. */
function tableOf(path: string, entries: unknown[]): ResolvedField {
  const window = entries.slice(0, MAX_REFERENCE_ROWS);
  const objects = window.filter(isPlainObject);

  // All objects: a column per key. Anything else — a plucked column, a list of
  // strings — is one column, named after the last segment of the path asked
  // for, since that is what the reader called it.
  if (objects.length === window.length && objects.length > 0) {
    const { columns, hidden } = columnsOf(objects);
    return {
      path,
      shape: "table",
      columns,
      rows: objects.map(entry => columns.map(column => cell(entry[column]))),
      total: entries.length,
      truncated: entries.length > window.length,
      hiddenColumns: hidden,
    };
  }

  const column = path.split(".").pop() || "value";
  return {
    path,
    shape: "table",
    columns: [column],
    rows: window.map(entry => [cell(entry)]),
    total: entries.length,
    truncated: entries.length > window.length,
    hiddenColumns: 0,
  };
}

/** Whatever was found at a path, as something the page can draw. */
function shapeValue(path: string, value: unknown): ResolvedField {
  if (Array.isArray(value)) return tableOf(path, value);

  if (isPlainObject(value)) {
    // An object is a table of what it holds. Metadata read this way is the
    // pairs someone typed, which is how they were written in the first place.
    const entries = Object.entries(value);
    return {
      path,
      shape: "table",
      columns: ["key", "value"],
      rows: entries.slice(0, MAX_REFERENCE_ROWS).map(([key, entry]) => [key, cell(entry)]),
      total: entries.length,
      truncated: entries.length > MAX_REFERENCE_ROWS,
      hiddenColumns: 0,
    };
  }

  const text = valueToText(value);
  return isLongText(text) ? { path, shape: "text", value: text } : { path, shape: "value", value: text };
}

/* ----------------------------- the resolution ---------------------------- */

/**
 * Resolves a set of targets, in the order they were given.
 *
 * Grouped by record first: a note that mentions one dataset three times — its
 * name, its row count, its rows — is one read, not three, and the read is the
 * heaviest any of the three needed. Records are read concurrently, since they
 * are independent. A read that fails for its own reasons — PocketBase
 * unreachable — still throws: that is a broken page, not a broken reference.
 */
export async function resolveNoteReferences(
  token: string,
  targets: ReferenceTarget[],
): Promise<ResolvedReference[]> {
  const byRecord = new Map<string, ReferenceTarget[]>();
  for (const target of targets) {
    byRecord.set(target.id, [...(byRecord.get(target.id) ?? []), target]);
  }

  const views = new Map<string, View | null>();
  await Promise.all(
    [...byRecord].map(async ([id, group]) => views.set(id, await loadView(token, id, group))),
  );

  return targets.map(target => {
    const view = views.get(target.id);
    if (!view) return missingReference(target);

    const resolved: ResolvedReference = {
      id: target.id,
      kind: referenceKind(target.id)!,
      label: view.label,
      detail: view.detail,
      found: true,
    };
    if (!target.field) return resolved;

    const { found, value } = valueAt(view.fields, target.field);
    return {
      ...resolved,
      field: found ? shapeValue(target.field, value) : { path: target.field, shape: "missing" as const },
    };
  });
}

/** The `{ refs }` body of `POST /api/notes/references`, checked. */
export function readReferenceTargets(body: Record<string, unknown>): ReferenceTarget[] {
  const refs = body.refs;
  if (!Array.isArray(refs)) {
    throw new ApiError('"refs" must be an array of references — an id, or "id#field".');
  }
  if (refs.length > MAX_NOTE_REFERENCES) {
    throw new ApiError(
      `At most ${MAX_NOTE_REFERENCES} references can be resolved at once; this asked for ${refs.length}.`,
    );
  }

  // Deduplicated and shaped here, so a body full of repeats or of junk costs
  // one read each at most — and nothing that is not a reference gets walked.
  const targets = new Map<string, ReferenceTarget>();
  for (const raw of refs) {
    const target = parseReferenceTarget(String(raw));
    if (target) targets.set(referenceKey(target), target);
  }
  return [...targets.values()];
}
