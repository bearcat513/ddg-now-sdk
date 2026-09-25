/**
 * Generated rows are stored flat, keyed by dot path: a bundle, a nested object
 * and an inferred `address.city` all arrive as `"a.b"` columns. CSV and SQL
 * keep them that way; JSON restores the nesting.
 *
 * Both the server's JSON export and the row inspector in the UI need that same
 * reshaping, and they share it here so a record has one shape wherever it is
 * read. Key *order* can still differ: the inspector shows the rows the
 * generator returned, in schema order, while a download of a stored dataset
 * comes back through PocketBase with its keys sorted.
 */

export type Row = Record<string, unknown>;

/** "address.city" -> { address: { city } } */
export function unflatten(row: Row): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(row)) {
    const parts = path.split(".");
    let cursor = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]!;
      const next = cursor[key];
      if (typeof next !== "object" || next === null || Array.isArray(next)) cursor[key] = {};
      cursor = cursor[key] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]!] = value;
  }
  return out;
}

/** One row as the pretty-printed JSON the export would hold for it. */
export function rowToJson(row: Row): string {
  return JSON.stringify(unflatten(row), null, 2);
}

/** Plain text for one value — what a cell shows, and what copying it yields. */
export function valueToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/**
 * The inverse of `unflatten`: `{ address: { city } }` -> `"address.city"`.
 *
 * The Bun app never needed this — rows were stored flat in its JSON column and
 * only ever nested on the way out. Here the stored JSON is the nested form, so
 * reading a dataset back and serialising it as CSV has to undo that nesting
 * first. Arrays stay whole: they are values, not paths, and CSV encodes them
 * as JSON in a single cell.
 */
export function flatten(record: Record<string, unknown>, prefix = ""): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value as Record<string, unknown>, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}
