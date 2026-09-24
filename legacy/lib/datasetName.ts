/**
 * What a generated dataset is called.
 *
 * A schema is generated from over and over, so the schema's name alone makes a
 * history of identical entries. Every run therefore signs itself with the
 * moment it happened: "Orders · 2026-09-18T14:23:05Z".
 *
 * The stamp is UTC and ISO-8601 to the second — it sorts lexically, means the
 * same thing wherever it is read, and survives a trip through a filename. The
 * sidebar still shows local relative time beside it, which is what a person
 * reads; this is what tells two runs apart.
 */

/** The `datasets.name` column's ceiling, from docker/pb_migrations. */
export const MAX_DATASET_NAME_LENGTH = 200;

/** What sits between the schema's name and the stamp. */
const SEPARATOR = " · ";

/** The name a run falls back to when the schema has none. */
export const UNTITLED_DATASET = "Untitled dataset";

/** A stamp this module wrote, at the end of a name. */
const STAMP_PATTERN = /\s·\s\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/** "2026-09-18T14:23:05Z" — ISO-8601 UTC, seconds precision. */
export function generationStamp(at: Date = new Date()): string {
  return `${at.toISOString().slice(0, 19)}Z`;
}

/**
 * The schema's name back out of a dataset's, for anywhere the run's moment is
 * noise — the SQL table an export seeds, for one.
 */
export function withoutGenerationStamp(name: string): string {
  return name.replace(STAMP_PATTERN, "").trim();
}

/**
 * `"Orders"` → `"Orders · 2026-09-18T14:23:05Z"`.
 *
 * An already-stamped name is re-stamped rather than stacked, so a caller that
 * echoes a dataset's name back at `?name=` gets one timestamp, not a growing
 * chain of them. The schema's half is trimmed where it would push the whole
 * name past what the column holds — the stamp is the part that has to survive,
 * since it is what makes the name unique.
 */
export function datasetName(schemaName: string, at: Date = new Date()): string {
  const stamp = generationStamp(at);
  const room = MAX_DATASET_NAME_LENGTH - stamp.length - SEPARATOR.length;
  const base = withoutGenerationStamp(schemaName.trim()) || UNTITLED_DATASET;
  return `${base.slice(0, room).trim()}${SEPARATOR}${stamp}`;
}
