/**
 * Notes: Markdown a person writes about the rest of their workspace, with
 * live references to the records it is about.
 *
 * A reference is written `[[cfg_1a2b3c4d]]` and stores nothing but the id.
 * That is the whole point of it: renaming a configuration renames it in every
 * note that mentions it, because no note ever copied the name down. What the
 * reader sees is resolved at render time, through their own credentials, so a
 * note can name a record the reader cannot see and the sentence around it
 * still arrives intact.
 *
 * A reference can go further and name one field of that record —
 * `[[ds_9f8e#rows]]`, `[[cfg_1a2b#metadata]]` — in which case what renders is
 * the field's current *value*, not the record's name. A field holding an array
 * renders as a table, which is what makes a note able to quote the data it is
 * written about rather than describe it. Same rule as the name: nothing is
 * copied into the note, so the table is of the rows that exist when it is
 * read.
 *
 * The prefix on an id is what says which collection to look in — `cfg_`,
 * `ds_`, `tpl_`, `note_` — which is why `newId()` in src/server/db.ts mints
 * readable, type-tagged ids rather than letting PocketBase autogenerate them.
 *
 * Everything here is pure: the editor uses it to find what a body references
 * before it is saved, and the server uses the same functions to resolve those
 * references against the database.
 */

/** What a `[[…]]` reference can point at. */
export type ReferenceKind = "config" | "dataset" | "script-template" | "note";

export type Note = {
  id: string;
  title: string;
  body: string;
  /** The account that owns it. Notes are never shared, so this is always you. */
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export const MAX_NOTE_TITLE_LENGTH = 200;
export const MAX_NOTE_BODY_LENGTH = 100_000;

/**
 * How many distinct references one note may resolve in a single request.
 *
 * A note is prose, and prose that names sixty records is an index — and each
 * distinct record behind them is a read through PocketBase, so the ceiling is
 * a cost as well as a shape. Beyond it the extra references still render, as
 * unresolved chips.
 */
export const MAX_NOTE_REFERENCES = 60;

/**
 * How much of an array field a table shows.
 *
 * A dataset holds up to a hundred thousand rows and a note is a page of
 * prose, so a table here is a window on the data, never the whole of it — the
 * dataset's own export is where all of it lives. The row cap is what the
 * reader sees; the column cap stops one wide schema from making the table
 * unreadable sideways.
 */
export const MAX_REFERENCE_ROWS = 50;
export const MAX_REFERENCE_COLUMNS = 12;

/** Past this a cell is an essay, and the table stops being a table. */
export const MAX_REFERENCE_CELL = 120;

/** Id prefix → what that record is, for every kind a note may point at. */
const KIND_BY_PREFIX: Record<string, ReferenceKind> = {
  cfg: "config",
  ds: "dataset",
  tpl: "script-template",
  note: "note",
};

/** How each kind is named where one has to be written out. */
export const REFERENCE_LABELS: Record<ReferenceKind, string> = {
  config: "Configuration",
  dataset: "Dataset",
  "script-template": "Script template",
  note: "Note",
};

/**
 * Which collection an id belongs to, or null where the prefix names none.
 *
 * Null rather than a guess: an id whose prefix is unknown is a reference to
 * nothing, and rendering it as a broken chip is more use to the person who
 * typed it than quietly resolving it against the wrong collection.
 */
export function referenceKind(id: string): ReferenceKind | null {
  const prefix = id.slice(0, id.indexOf("_"));
  return (prefix && KIND_BY_PREFIX[prefix]) || null;
}

/* ------------------------------- the token ------------------------------- */

/**
 * The text a reference is written as: `[[id]]`, or `[[id#field]]`.
 *
 * `#` rather than `.` between the two halves, because a field path may itself
 * be dotted — `[[ds_9f8e#rows.email]]` is one column of one dataset — and a
 * single separator would leave no way to tell the id from the first segment.
 */
export const referenceToken = (id: string, field = ""): string => `[[${id}${field ? `#${field}` : ""}]]`;

/** What one reference points at: a record, and optionally one field of it. */
export type ReferenceTarget = {
  id: string;
  /** Empty where the reference names the record itself. */
  field: string;
};

/** Its identity, and the string a request and a resolution agree on. */
export const referenceKey = ({ id, field }: ReferenceTarget): string => (field ? `${id}#${field}` : id);

/** A field path is dotted segments; the `#` is already gone by the time it gets here. */
const FIELD_PATH = /^[A-Za-z0-9_.-]{1,120}$/;

/**
 * Reads `id#field` back apart.
 *
 * Returns null for anything that is not a reference at all, so one function
 * decides what counts — the parser, the resolver and the editor all ask it
 * rather than each carrying their own idea.
 */
export function parseReferenceTarget(text: string): ReferenceTarget | null {
  const hash = text.indexOf("#");
  const id = hash === -1 ? text : text.slice(0, hash);
  const field = hash === -1 ? "" : text.slice(hash + 1);

  if (!referenceKind(id)) return null;
  if (field && !FIELD_PATH.test(field)) return null;
  return { id, field };
}

/** Matches a reference anywhere in a body. Ids are what `newId()` mints. */
const REFERENCE = /\[\[([a-z0-9_]{3,40})(#[A-Za-z0-9_.-]{1,120})?\]\]/g;

/**
 * Every reference a body makes, once each, in the order they first appear.
 *
 * Deduplicated by the whole target rather than by the id: `[[ds_1]]` and
 * `[[ds_1#rows]]` are two different things to render, and one read to make
 * them both — which is the resolver's business, not this function's.
 */
export function noteReferences(body: string): ReferenceTarget[] {
  const seen = new Map<string, ReferenceTarget>();
  for (const match of body.matchAll(REFERENCE)) {
    const target = parseReferenceTarget(`${match[1]!}${match[2] ?? ""}`);
    if (target) seen.set(referenceKey(target), target);
  }
  return [...seen.values()];
}

/* ------------------------------- the fields ------------------------------ */

/** How a field's value renders, which the picker says before you pick it. */
export type FieldShape = "value" | "text" | "table";

export type ReferenceFieldSpec = {
  /** What goes after the `#`. */
  path: string;
  label: string;
  shape: FieldShape;
  hint: string;
};

/**
 * What each kind of record offers a reference.
 *
 * A curated list rather than "every property": it is what the picker shows,
 * and it is also the object the server walks a path against, so a note can
 * only ever surface what is named here. A path may go deeper than the list —
 * `rows.email` plucks one column out of the rows — which is why the server
 * walks rather than looks up.
 */
export const REFERENCE_FIELDS: Record<ReferenceKind, ReferenceFieldSpec[]> = {
  config: [
    { path: "name", label: "name", shape: "value", hint: "What the schema is called" },
    { path: "description", label: "description", shape: "value", hint: "Its description, if it has one" },
    { path: "rowCount", label: "rowCount", shape: "value", hint: "Rows a run of it produces" },
    { path: "seed", label: "seed", shape: "value", hint: "The seed it reproduces with" },
    { path: "locale", label: "locale", shape: "value", hint: "Where its names and addresses come from" },
    { path: "fields", label: "fields", shape: "table", hint: "Every field: name, type, options" },
    { path: "mappings", label: "mappings", shape: "table", hint: "Fields that draw from another configuration" },
    { path: "metadata", label: "metadata", shape: "table", hint: "Its key/value pairs" },
    { path: "updatedAt", label: "updatedAt", shape: "value", hint: "When it was last saved" },
  ],
  dataset: [
    { path: "name", label: "name", shape: "value", hint: "The schema and the run stamp" },
    { path: "rows", label: "rows", shape: "table", hint: "The generated rows themselves" },
    { path: "rowCount", label: "rowCount", shape: "value", hint: "How many rows it holds" },
    { path: "fieldCount", label: "fieldCount", shape: "value", hint: "How many fields it came from" },
    { path: "createdAt", label: "createdAt", shape: "value", hint: "When the run happened" },
  ],
  "script-template": [
    { path: "name", label: "name", shape: "value", hint: "What the template is called" },
    { path: "body", label: "body", shape: "text", hint: "The script itself" },
    { path: "updatedAt", label: "updatedAt", shape: "value", hint: "When it was last saved" },
  ],
  note: [
    { path: "title", label: "title", shape: "value", hint: "The note's title" },
    { path: "body", label: "body", shape: "text", hint: "What it says, as Markdown" },
    { path: "updatedAt", label: "updatedAt", shape: "value", hint: "When it was last saved" },
  ],
};

/* ----------------------------- the resolution ---------------------------- */

/**
 * One field, resolved into something a page can draw without deciding
 * anything.
 *
 * Cells arrive as strings, already cut to length, so the payload is bounded by
 * the caps above whatever the data turned out to be — and the renderer stays a
 * renderer rather than a second place that decides how a value reads.
 */
export type ResolvedField =
  | { path: string; shape: "value"; value: string }
  | { path: string; shape: "text"; value: string }
  | {
      path: string;
      shape: "table";
      columns: string[];
      rows: string[][];
      /** Rows before the cap — what the table is a window on. */
      total: number;
      truncated: boolean;
      /** Columns the cap left out, so a wide table admits to being cut. */
      hiddenColumns: number;
    }
  /** The record resolved; this path inside it names nothing. */
  | { path: string; shape: "missing" };

/** One reference, resolved — or as much of it as the reader is allowed. */
export type ResolvedReference = {
  id: string;
  kind: ReferenceKind;
  /** What the record is called now, not what it was called when written. */
  label: string;
  /** A line under the name: field count, row count, whatever fits. */
  detail: string;
  /** False where the record is gone, or was never yours to read. */
  found: boolean;
  /** Present only where the reference named a field. */
  field?: ResolvedField;
};

/** The chip for a reference nothing answered for. */
export function missingReference({ id, field }: ReferenceTarget): ResolvedReference {
  return {
    id,
    kind: referenceKind(id) ?? "config",
    label: id,
    detail: "Not found",
    found: false,
    ...(field ? { field: { path: field, shape: "missing" as const } } : {}),
  };
}

/**
 * The body a brand-new note starts with.
 *
 * It is one worked example rather than a blank page: the two keystrokes that
 * open a menu are the only things here that cannot be guessed from the
 * toolbar, so the starter says them in the one place someone is certain to
 * read.
 */
export const STARTER_NOTE_BODY = [
  "## What this is for",
  "",
  "Type `[[` to reference a configuration, dataset, script template or another",
  "note. References show the record's current name, so renaming one updates",
  "every note that mentions it.",
  "",
  "- Type `/` for a heading, a list, a quote or a code block",
  "- **Bold** and `code` work as usual",
].join("\n");

/**
 * The note as the Markdown file it is: its title as the top heading, then the
 * body exactly as it was written.
 *
 * One function rather than one per caller, because three places hand this file
 * over — the editor's own save, the nav's download beside each note, and
 * `GET /api/notes/:id/export` — and a file that differs by where it came from
 * is a file somebody has to diff to trust.
 */
export function noteMarkdown(title: string, body: string): string {
  const heading = `# ${title.trim() || "Untitled note"}`;
  // One trailing newline, whatever the editor was left sitting on — and a
  // heading alone where nothing has been written under it yet.
  const text = body.replace(/\s+$/, "");
  return text ? `${heading}\n\n${text}\n` : `${heading}\n`;
}

/** "Seeding notes" -> "seeding-notes.md" */
export function noteFileName(title: string): string {
  const slug =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "note";
  return `${slug}.md`;
}

/**
 * The first line of prose in a body, for a list that has one line to spend on
 * it — headings, bullets, fences and reference brackets stripped back to the
 * words underneath.
 */
export function noteExcerpt(body: string, limit = 80): string {
  for (const raw of body.split("\n")) {
    const line = raw
      .replace(/```.*/, "")
      .replace(/^\s*[#>\-*]+\s*/, "")
      .replace(/^\s*\d+[.)]\s*/, "")
      .replace(/\[\[([a-z0-9_]{3,40})\]\]/g, "$1")
      .replace(/[*`]/g, "")
      .trim();
    if (line) return line.length > limit ? `${line.slice(0, limit - 1)}…` : line;
  }
  return "";
}

/* ------------------------------ the editor ------------------------------- */

/**
 * How far back from the caret an unclosed `[[` is looked for.
 *
 * A bound rather than a scan to the start of the note: the thing being typed
 * is a record name, and a name that has run past this is not one — it is a
 * `[[` somebody left open several sentences ago.
 */
const MAX_QUERY_LENGTH = 60;

/** A half-typed reference under the caret: where it starts, and what is typed. */
export type ReferenceQuery = { start: number; query: string };

/**
 * A half-typed reference, split at the `#`.
 *
 * `record` is null until the brackets hold an id the picker knows — which is
 * what decides whether it is offering records or the fields of one. So
 * `[[ord` offers records, and `[[cfg_1a2b#ro` offers that configuration's
 * fields beginning "ro".
 */
export type ReferenceStage =
  | { stage: "record"; query: string }
  | { stage: "field"; id: string; kind: ReferenceKind; query: string };

/**
 * Which of the two the picker is on.
 *
 * The id is checked rather than assumed: `[[not an id#x` is still someone
 * typing a record name, badly, and offering them the fields of nothing would
 * be a dead end they could not back out of.
 */
export function referenceStage(query: string): ReferenceStage {
  const hash = query.indexOf("#");
  if (hash === -1) return { stage: "record", query };

  const id = query.slice(0, hash);
  const kind = referenceKind(id);
  return kind ? { stage: "field", id, kind, query: query.slice(hash + 1) } : { stage: "record", query };
}

/**
 * The `[[…` being typed at `caret`, if there is one.
 *
 * Anything that would end a reference ends the search: a newline, a closing
 * bracket, or the start of the note. So `[[orders]] and [[cu|` finds the
 * second one, and `[[orders]]|` finds none — which is what stops the picker
 * from reopening over a reference that is already finished.
 */
export function activeReferenceQuery(value: string, caret: number): ReferenceQuery | null {
  const from = Math.max(0, caret - MAX_QUERY_LENGTH);
  const window = value.slice(from, caret);

  const opened = window.lastIndexOf("[[");
  if (opened === -1) return null;

  const query = window.slice(opened + 2);
  if (/[[\]\n]/.test(query)) return null;

  return { start: from + opened, query };
}

/** Replacing the half-typed reference with a finished one. */
export type ReferenceEdit = { value: string; caret: number };

/**
 * Finishes a reference: everything from the `[[` up to the caret becomes
 * `[[id]]` — or `[[id#field]]` — and the caret lands after it, ready for the
 * rest of the sentence.
 */
export function insertReference(
  value: string,
  active: ReferenceQuery,
  caret: number,
  id: string,
  field = "",
): ReferenceEdit {
  const token = referenceToken(id, field);
  // Brackets already closed ahead of the caret are the ones this reference is
  // being written into — `openReferenceFields` leaves exactly that — so they
  // are consumed rather than left behind as a second, empty pair.
  const after = value.startsWith("]]", caret) ? caret + 2 : caret;
  return {
    value: `${value.slice(0, active.start)}${token}${value.slice(after)}`,
    caret: active.start + token.length,
  };
}

/**
 * Opens a record's reference for a field to be named, leaving the caret inside
 * the brackets — `[[cfg_1a2b#|]]` — so the picker can carry straight on.
 *
 * Written as one edit rather than as "insert, then move": the caret has to
 * land between the `#` and the `]]`, and there is no other position that keeps
 * the picker open on the same reference.
 */
export function openReferenceFields(
  value: string,
  active: ReferenceQuery,
  caret: number,
  id: string,
): ReferenceEdit {
  const opened = `[[${id}#`;
  return {
    value: `${value.slice(0, active.start)}${opened}]]${value.slice(caret)}`,
    caret: active.start + opened.length,
  };
}
