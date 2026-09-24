/**
 * The portable configuration file: one JSON document per saved configuration,
 * carrying every field, type and option needed to reproduce it elsewhere.
 *
 * Internal row ids are deliberately omitted so the files stay stable and
 * diffable in version control; fresh ids are assigned on import.
 */

import { parseCondition, parseFormula } from "./formula";
import { mappableFields, parseMappings } from "./mappings";
import { parseMetadata, type Metadata } from "./metadata";
import {
  BUNDLE_COLUMNS,
  childFields,
  FIELD_TYPE_SET,
  isNumericField,
  MAX_FIELD_DEPTH,
  type BundleKind,
  type Distribution,
  type Field,
  type FieldMapping,
  type FieldOptions,
  type FieldType,
  type ReferenceMode,
  type SchemaConfig,
} from "./types";

export const CONFIG_FILE_KIND = "dummy-data-generator/config";
/**
 * 3 added `mappings`. A version 2 file still reads — it simply carries none —
 * and a version 3 file opened by an older build is refused rather than
 * silently imported without the links that hold it to its neighbours.
 */
export const CONFIG_FILE_VERSION = 3;

const MAX_FIELDS = 500;
const MAX_NAME_LENGTH = 200;

/** A field as it appears on disk — same shape as `Field`, minus the id. */
export type PortableField = Omit<Field, "id">;

export type ConfigFile = {
  kind: typeof CONFIG_FILE_KIND;
  version: number;
  name: string;
  description: string;
  rowCount: number;
  seed: string;
  locale: string;
  /** Free-form pairs, written by whoever saved the schema. */
  metadata: Metadata;
  fields: PortableField[];
  /**
   * Cross-configuration links. `fromConfig` is an id from the instance this
   * was exported from, so it may well mean nothing here — `fromConfigName`
   * rides along so the importer can still say what the mapping was reaching
   * for, and the editor can offer to re-point it.
   */
  mappings: FieldMapping[];
  exportedAt: string;
};

export type ParsedConfig = {
  name: string;
  description: string;
  rowCount: number;
  seed: string;
  locale: string;
  metadata: Metadata;
  fields: Field[];
  mappings: FieldMapping[];
};

export type ParseConfigResult = { ok: true; config: ParsedConfig } | { ok: false; error: string };

/* -------------------------------- export -------------------------------- */

/** Strips ids, recursively, so the file stays stable and diffable. */
export function toPortableField(field: Field): PortableField {
  const { id: _id, ...rest } = field;
  const options = rest.options;
  if (!options || !Object.keys(options).length) return { ...rest, options: undefined };
  const nested = options.fields?.length ? options.fields.map(toPortableField) : undefined;
  return {
    ...rest,
    options: { ...options, ...(nested ? { fields: nested as unknown as Field[] } : {}) },
  };
}

export function buildConfigFile(
  config: Pick<SchemaConfig, "name" | "fields" | "rowCount"> &
    Partial<Pick<SchemaConfig, "description" | "seed" | "locale" | "metadata" | "mappings">>,
): ConfigFile {
  return {
    kind: CONFIG_FILE_KIND,
    version: CONFIG_FILE_VERSION,
    name: config.name,
    description: config.description ?? "",
    rowCount: config.rowCount,
    seed: config.seed ?? "",
    locale: config.locale ?? "",
    metadata: config.metadata ?? {},
    fields: config.fields.map(toPortableField),
    mappings: config.mappings ?? [],
    exportedAt: new Date().toISOString(),
  };
}

export function serializeConfigFile(config: Parameters<typeof buildConfigFile>[0]): string {
  return JSON.stringify(buildConfigFile(config), null, 2);
}

/** "Employee records" -> "employee-records.ddg.json" */
export function configFileName(name: string): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "configuration";
  return `${slug}.ddg.json`;
}

/* -------------------------------- import -------------------------------- */

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const NUMBER_OPTIONS = [
  "min",
  "max",
  "decimals",
  "truePercent",
  "limit",
  "mean",
  "stddev",
  "shape",
  "step",
  "jitter",
  "dimensions",
] as const;

const STRING_OPTIONS = [
  "from",
  "to",
  "pattern",
  "prefix",
  "suffix",
  "expression",
  "script",
  "table",
  "query",
  "derivesFrom",
  "after",
  "when",
  "variant",
  "refDataset",
  "refField",
] as const;

const DISTRIBUTIONS = ["uniform", "normal", "lognormal", "pareto"];
const REFERENCE_MODES = ["random", "cycle", "unique"];

/** Keeps only recognized option keys, with the right primitive type for each. */
function sanitizeOptions(raw: unknown, depth = 0): FieldOptions | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const input = raw as Record<string, unknown>;
  const options: FieldOptions = {};

  for (const key of NUMBER_OPTIONS) {
    const value = asNumber(input[key]);
    if (value !== undefined) options[key] = value;
  }
  for (const key of STRING_OPTIONS) {
    if (typeof input[key] === "string") options[key] = input[key] as string;
  }
  // A predicate is evaluated against the row being built. A nested element is
  // not that row, so `when` only means anything at the top level; carrying it
  // deeper would read as a promise the generator does not keep.
  if (depth > 0) delete options.when;
  if (input.valuesFrom === "list" || input.valuesFrom === "script") {
    options.valuesFrom = input.valuesFrom;
  }
  if (["iso", "datetime", "date", "time", "unix"].includes(String(input.format))) {
    options.format = input.format as FieldOptions["format"];
  }
  if (Array.isArray(input.values)) {
    options.values = input.values.filter((v): v is string => typeof v === "string");
  }
  if (Array.isArray(input.weights)) {
    options.weights = input.weights.map(w => asNumber(w) ?? 1);
  }
  if (typeof input.arrayOf === "string" && FIELD_TYPE_SET.has(input.arrayOf)) {
    options.arrayOf = input.arrayOf as FieldType;
  }
  if (DISTRIBUTIONS.includes(String(input.distribution))) {
    options.distribution = input.distribution as Distribution;
  }
  if (REFERENCE_MODES.includes(String(input.refMode))) {
    options.refMode = input.refMode as ReferenceMode;
  }
  if (typeof input.bundle === "string" && input.bundle in BUNDLE_COLUMNS) {
    options.bundle = input.bundle as BundleKind;
  }
  if (input.businessHours === true) options.businessHours = true;

  // Child fields of an object, or of an array of objects. `parseConfigFile`
  // has already refused anything nested deeper than the limit, so this bound is
  // only a backstop against a caller reaching sanitizeOptions directly.
  if (Array.isArray(input.fields) && depth < MAX_FIELD_DEPTH) {
    const children: Field[] = [];
    for (const entry of input.fields) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const child = entry as Record<string, unknown>;
      const name = asString(child.name).trim();
      const type = asString(child.type);
      if (!name || !FIELD_TYPE_SET.has(type)) continue;
      const nullPercent = asNumber(child.nullPercent);
      children.push({
        id: crypto.randomUUID(),
        name: name.slice(0, MAX_NAME_LENGTH),
        type: type as FieldType,
        ...(nullPercent !== undefined ? { nullPercent: clamp(nullPercent, 0, 100) } : {}),
        ...(child.unique === true ? { unique: true } : {}),
        options: sanitizeOptions(child.options, depth + 1),
      });
    }
    if (children.length) options.fields = children;
  }

  return Object.keys(options).length ? options : undefined;
}

/** How many levels of child fields hang below one field entry in the file. */
function nestingDepth(entry: unknown, depth = 0): number {
  const options = (entry as { options?: { fields?: unknown } } | null)?.options;
  const children = Array.isArray(options?.fields) ? (options.fields as unknown[]) : [];
  if (!children.length) return depth;
  return Math.max(...children.map(child => nestingDepth(child, depth + 1)));
}

export function parseConfigFile(raw: unknown): ParseConfigResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Expected a configuration object at the top level of the file." };
  }

  const file = raw as Record<string, unknown>;

  if (file.kind !== undefined && file.kind !== CONFIG_FILE_KIND) {
    return { ok: false, error: `Not a ${CONFIG_FILE_KIND} file (found kind "${String(file.kind)}").` };
  }

  const version = asNumber(file.version) ?? CONFIG_FILE_VERSION;
  if (version > CONFIG_FILE_VERSION) {
    return {
      ok: false,
      error: `This file is version ${version}, but this app understands up to version ${CONFIG_FILE_VERSION}.`,
    };
  }

  if (!Array.isArray(file.fields)) {
    return { ok: false, error: 'The file has no "fields" array.' };
  }
  if (file.fields.length === 0) {
    return { ok: false, error: "The configuration has no fields." };
  }
  if (file.fields.length > MAX_FIELDS) {
    return { ok: false, error: `Too many fields (${file.fields.length}); the limit is ${MAX_FIELDS}.` };
  }

  const fields: Field[] = [];
  const unknownTypes = new Set<string>();
  const seenNames = new Set<string>();
  const duplicates = new Set<string>();

  for (const [index, entry] of (file.fields as unknown[]).entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, error: `Field ${index + 1} is not an object.` };
    }
    const source = entry as Record<string, unknown>;

    const name = asString(source.name).trim();
    if (!name) return { ok: false, error: `Field ${index + 1} is missing a name.` };
    if (name.length > MAX_NAME_LENGTH) {
      return { ok: false, error: `Field "${name.slice(0, 30)}…" has a name longer than ${MAX_NAME_LENGTH} characters.` };
    }
    if (seenNames.has(name)) duplicates.add(name);
    seenNames.add(name);

    const type = asString(source.type);
    if (!FIELD_TYPE_SET.has(type)) {
      unknownTypes.add(type || "(missing)");
      continue;
    }

    // Say so, rather than quietly importing a shallower schema than the file describes.
    if (nestingDepth(source) > MAX_FIELD_DEPTH) {
      return {
        ok: false,
        error: `Field "${name}" nests object fields more than ${MAX_FIELD_DEPTH} levels deep.`,
      };
    }

    const nullPercent = asNumber(source.nullPercent);
    fields.push({
      id: crypto.randomUUID(),
      name,
      type: type as FieldType,
      ...(nullPercent !== undefined ? { nullPercent: clamp(nullPercent, 0, 100) } : {}),
      ...(source.unique === true ? { unique: true } : {}),
      options: sanitizeOptions(source.options),
    });
  }

  if (unknownTypes.size) {
    return {
      ok: false,
      error: `Unknown field type(s): ${[...unknownTypes].map(t => `"${t}"`).join(", ")}.`,
    };
  }
  if (duplicates.size) {
    return {
      ok: false,
      error: `Duplicate field name(s): ${[...duplicates].map(n => `"${n}"`).join(", ")}.`,
    };
  }

  // An imported enum that says it is script-backed but carries no script would
  // only fail at the first generate; say so now.
  for (const field of fields) {
    if (field.type === "enum" && field.options?.valuesFrom === "script" && !field.options.script?.trim()) {
      return { ok: false, error: `Enum field "${field.name}" is set to use a script but has none.` };
    }
  }

  // Catch broken formulas here rather than at the first generate.
  const referenceable = fields.filter(f => isNumericField(f) || f.type === "boolean").map(f => f.name);
  for (const field of fields) {
    if (field.type !== "computed") continue;
    const parsed = parseFormula(field.options?.expression ?? "", referenceable);
    if (!parsed.ok) {
      return { ok: false, error: `Calculated field "${field.name}": ${parsed.error}` };
    }
  }

  // Same for `when` predicates, over every column the rows will actually have,
  // including the ones a bundle or an object spreads.
  const comparable = new Set<string>();
  for (const field of fields) {
    comparable.add(field.name);
    if (field.type === "bundle") {
      for (const column of BUNDLE_COLUMNS[field.options?.bundle ?? "person"]) comparable.add(`${field.name}.${column}`);
    }
    for (const child of childFields(field)) comparable.add(`${field.name}.${child.name}`);
  }
  for (const field of fields) {
    const when = field.options?.when?.trim();
    if (!when) continue;
    const parsed = parseCondition(when, comparable);
    if (!parsed.ok) {
      return { ok: false, error: `Condition on "${field.name}": ${parsed.error}` };
    }
  }

  // Additive since version 2, and optional: a file written before metadata
  // existed simply carries none.
  const metadata = parseMetadata(file.metadata);
  if (!metadata.ok) return { ok: false, error: metadata.error };

  // Same again for mappings, added in version 3.
  const mappings = parseMappings(file.mappings);
  if (!mappings.ok) return { ok: false, error: mappings.error };

  // A mapping onto a column the schema does not have could only ever fail at
  // the first generate, and by then nobody is looking at the file it came from.
  const columns = new Set(mappableFields(fields));
  for (const mapping of mappings.mappings) {
    if (mapping.field && !columns.has(mapping.field)) {
      return { ok: false, error: `Field mapping for "${mapping.field}": the schema has no such field.` };
    }
  }

  return {
    ok: true,
    config: {
      name: asString(file.name).trim().slice(0, 120) || "Imported schema",
      description: asString(file.description),
      rowCount: clamp(asNumber(file.rowCount) ?? 25, 1, 100_000),
      seed: asString(file.seed),
      locale: asString(file.locale).trim().slice(0, 20),
      metadata: metadata.metadata,
      fields,
      mappings: mappings.mappings,
    },
  };
}
