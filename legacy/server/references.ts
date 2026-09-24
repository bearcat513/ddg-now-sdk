/**
 * Foreign keys, in two flavours.
 *
 * A `reference` field draws from a column of one particular dataset the caller
 * already generated. A *field mapping* draws from a column of whatever dataset
 * a whole other configuration most recently produced — the same mechanism with
 * a later binding, so a schema's relationships survive the source being
 * regenerated.
 *
 * Both pools are loaded once per generation and folded into the field's
 * options, the same trick `resolveChoiceScripts` uses, so `generateRows` stays
 * synchronous. The caller's own token does the reading, so neither can reach
 * data that account is not allowed to see.
 */

import { mappableFields } from "../lib/mappings";
import {
  isResolvableMapping,
  rowColumns,
  usesReference,
  type Dataset,
  type Field,
  type FieldMapping,
  type SchemaConfig,
} from "../lib/types";
import { getDataset, latestDatasetForConfig } from "./db";
import { ApiError } from "./http";

/** Values held for one reference pool. Beyond this, a draw is representative enough. */
const MAX_POOL = 50_000;

function poolFrom(rows: Record<string, unknown>[], column: string): unknown[] {
  // Insertion-ordered, so `cycle` and `unique` walk the source's own row order.
  // Keyed by a stringified form for de-duplication, but the value kept is the
  // original: a numeric key must stay a number on the way into JSON or SQL.
  const seen = new Map<string, unknown>();
  for (const row of rows) {
    const value = row[column];
    if (value === null || value === undefined || value === "") continue;
    const key = typeof value === "object" ? JSON.stringify(value) : `${typeof value}:${String(value)}`;
    if (!seen.has(key)) seen.set(key, value);
    if (seen.size >= MAX_POOL) break;
  }
  return [...seen.values()];
}

/**
 * Loads every referenced column. Datasets are fetched once each, however many
 * fields point at them, since the rows are the expensive part.
 */
export async function resolveReferences(fields: Field[], token: string): Promise<Field[]> {
  const referencing = fields.filter(usesReference);
  if (!referencing.length) return fields;

  const datasetIds = [...new Set(referencing.map(field => field.options!.refDataset!))];
  const loaded = new Map<string, Record<string, unknown>[]>();

  await Promise.all(
    datasetIds.map(async id => {
      const dataset = await getDataset(token, id);
      if (!dataset) {
        throw new ApiError(`Referenced dataset "${id}" does not exist, or is not yours to read.`, 404);
      }
      loaded.set(id, dataset.rows);
    }),
  );

  const pools = new Map<string, unknown[]>();
  for (const field of referencing) {
    const { refDataset, refField } = field.options!;
    const rows = loaded.get(refDataset!) ?? [];
    const pool = poolFrom(rows, refField!);
    if (!pool.length) {
      throw new ApiError(
        `Reference field "${field.name}": column "${refField}" holds no values in the dataset it points at.`,
      );
    }
    pools.set(field.id, pool);
  }

  return fields.map(field => {
    const refPool = pools.get(field.id);
    return refPool ? { ...field, options: { ...field.options, refPool } } : field;
  });
}

/* ----------------------------- mappings ----------------------------- */

/**
 * Applies a configuration's field mappings, the last step before generation.
 *
 * Where `resolveReferences` reads a dataset the field named outright, a
 * mapping names a *configuration* and resolves to whatever that configuration
 * most recently produced — so regenerating the source is all it takes for
 * everything downstream to pick up the new values.
 *
 * The mapped field becomes a `reference` for this run whatever it was
 * declared as. That is the point: a mapping says "these values come from over
 * there", and a mapped field that still drew a random UUID of its own would be
 * a mapping in name only. Its own options are left alone otherwise, so
 * `nullPercent` and a prefix still apply on top of the borrowed value.
 */
export async function resolveMappings(fields: Field[], mappings: FieldMapping[], token: string): Promise<Field[]> {
  const live = mappings.filter(isResolvableMapping);
  if (!live.length) return fields;

  const names = new Set(mappableFields(fields));
  for (const mapping of live) {
    if (!names.has(mapping.field)) {
      throw new ApiError(
        `Field mapping for "${mapping.field}": this schema has no such field. ` +
          "Point the mapping at a field that exists, or remove it.",
      );
    }
  }

  // One read per source configuration, however many columns are borrowed from
  // it — the rows are the expensive part, as in `resolveReferences`.
  const configIds = [...new Set(live.map(mapping => mapping.fromConfig))];
  const datasets = new Map<string, Awaited<ReturnType<typeof latestDatasetForConfig>>>();
  await Promise.all(
    configIds.map(async id => {
      datasets.set(id, await latestDatasetForConfig(token, id));
    }),
  );

  const pools = new Map<string, unknown[]>();
  for (const mapping of live) {
    const label = describe(mapping);
    const dataset = datasets.get(mapping.fromConfig);
    if (!dataset) {
      throw new ApiError(
        `${label}: that configuration has no generated data yet, or none you can see. ` +
          "Generate it once and the mapping will resolve.",
        409,
      );
    }

    const pool = poolFrom(dataset.rows, mapping.fromField);
    if (!pool.length) {
      throw new ApiError(
        `${label}: column "${mapping.fromField}" holds no values in "${dataset.name}", ` +
          "the newest dataset from that configuration.",
      );
    }
    pools.set(mapping.field, pool);
  }

  return fields.map(field => {
    const mapping = live.find(entry => entry.field === field.name);
    if (!mapping) return field;
    return {
      ...field,
      type: "reference" as const,
      options: { ...field.options, refMode: mapping.mode, refPool: pools.get(field.name) },
    };
  });
}

/** How a mapping names itself in an error, without leaking record ids. */
function describe(mapping: FieldMapping): string {
  const source = mapping.fromConfigName || mapping.fromConfig;
  return `Field mapping "${mapping.field}" ← ${source}.${mapping.fromField}`;
}

/** The column names of a stored dataset, for the reference picker in the UI. */
/** Union across a window of rows: a null-heavy first row would hide columns. */
export function columnsOf(rows: Record<string, unknown>[]): string[] {
  const columns = new Set<string>();
  for (const row of rows.slice(0, 50)) {
    for (const key of Object.keys(row)) columns.add(key);
  }
  return [...columns];
}

export async function datasetColumns(token: string, id: string): Promise<string[] | null> {
  const dataset = await getDataset(token, id);
  return dataset ? columnsOf(dataset.rows) : null;
}

/**
 * What a mapping may point at on the far side of one configuration, and which
 * dataset the answer came from.
 *
 * When that configuration has been generated, the columns are the dataset's
 * own — exactly what a mapping will draw from. When it has not, they fall back
 * to the schema's declared columns, so a mapping can be written before either
 * side has ever been run; the null `dataset` is what the editor warns on.
 */
export async function configColumns(
  token: string,
  config: SchemaConfig,
): Promise<{ columns: string[]; dataset: Dataset | null }> {
  const latest = await latestDatasetForConfig(token, config.id);
  if (!latest) return { columns: rowColumns(config.fields), dataset: null };

  const { rows, ...summary } = latest;
  return { columns: columnsOf(rows), dataset: summary };
}
