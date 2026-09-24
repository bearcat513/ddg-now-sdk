/**
 * Field mappings: the rules for reading, validating and describing the
 * cross-configuration links stored on a schema.
 *
 * Mappings arrive from three directions — the editor, a `*.ddg.json` import,
 * and a request body — so the shape is decided in one place rather than three.
 * `parseMappings` is strict in the same way `parseMetadata` is: a mapping that
 * was meant to hold a schema together and is quietly dropped is worse than one
 * that says why it was refused.
 */

import {
  isResolvableMapping,
  SPREADING_FIELD_TYPES,
  type Field,
  type FieldMapping,
  type ReferenceMode,
} from "./types";

export const MAPPING_LIMITS = {
  /** Past this, the panel stops being a list and the schema wants splitting. */
  perConfig: 50,
  /** Matches the field-name cap in configFile.ts. */
  nameLength: 200,
} as const;

const MODES: ReferenceMode[] = ["random", "cycle", "unique"];

export type ParseMappingsResult = { ok: true; mappings: FieldMapping[] } | { ok: false; error: string };

/** A fresh, empty row for the editor to fill in. */
export function newMapping(): FieldMapping {
  return { id: crypto.randomUUID(), field: "", fromConfig: "", fromField: "", mode: "random" };
}

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * Reads whatever was sent into well-formed mappings, or says what is wrong.
 *
 * Absent and `[]` both mean "no mappings" — every configuration saved before
 * this feature existed lands on that path.
 */
export function parseMappings(raw: unknown): ParseMappingsResult {
  if (raw === undefined || raw === null) return { ok: true, mappings: [] };
  if (!Array.isArray(raw)) return { ok: false, error: '"mappings" must be an array.' };
  if (raw.length > MAPPING_LIMITS.perConfig) {
    return {
      ok: false,
      error: `Too many field mappings (${raw.length}); the limit is ${MAPPING_LIMITS.perConfig} per configuration.`,
    };
  }

  const mappings: FieldMapping[] = [];
  const claimed = new Set<string>();

  for (const [index, entry] of raw.entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, error: `Mapping ${index + 1} is not an object.` };
    }
    const source = entry as Record<string, unknown>;

    const field = asString(source.field).slice(0, MAPPING_LIMITS.nameLength);
    const fromConfig = asString(source.fromConfig).slice(0, MAPPING_LIMITS.nameLength);
    const fromField = asString(source.fromField).slice(0, MAPPING_LIMITS.nameLength);
    const mode = MODES.includes(source.mode as ReferenceMode) ? (source.mode as ReferenceMode) : "random";

    // Two mappings onto one field would race for the same column, and which
    // of them won would come down to array order. Refuse instead.
    if (field && claimed.has(field)) {
      return { ok: false, error: `Field "${field}" is mapped twice; a field can draw from one place only.` };
    }
    if (field) claimed.add(field);

    mappings.push({
      id: asString(source.id) || crypto.randomUUID(),
      field,
      fromConfig,
      fromConfigName: asString(source.fromConfigName) || undefined,
      fromField,
      mode,
    });
  }

  return { ok: true, mappings };
}

/**
 * The fields a mapping may attach to: the schema's own top-level fields.
 *
 * Not `rowColumns`, which is the right list for the far side. A bundle or an
 * object spreads into several columns from one coherent draw, and replacing
 * one of them with a borrowed value would leave the rest of the set describing
 * somebody else — so those are left out rather than offered and then refused
 * by `resolveMappings`, which only ever sees whole fields.
 */
export function mappableFields(fields: Field[]): string[] {
  return fields
    .filter(field => field.name && !SPREADING_FIELD_TYPES.has(field.type))
    .filter(field => !(field.type === "array" && field.options?.arrayOf === "object"))
    .map(field => field.name);
}

/**
 * Mappings that name a field this schema does not have.
 *
 * Not fatal on its own: a field can be renamed with the mappings panel closed,
 * and losing the link silently would be the worse outcome. The editor marks
 * these rows, and `resolveMappings` refuses the run rather than generating a
 * column nobody asked for.
 */
export function danglingMappings(mappings: FieldMapping[], fields: Field[]): FieldMapping[] {
  const names = new Set(mappableFields(fields));
  return mappings.filter(mapping => isResolvableMapping(mapping) && !names.has(mapping.field));
}

/** "customer_id ← Customers.id" — one mapping as a line of prose. */
export function describeMapping(mapping: FieldMapping, configName?: string): string {
  const source = configName || mapping.fromConfigName || mapping.fromConfig || "—";
  return `${mapping.field || "—"} ← ${source}.${mapping.fromField || "—"}`;
}
