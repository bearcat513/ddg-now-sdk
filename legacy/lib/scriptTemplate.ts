/**
 * Script templates: a chunk of JavaScript with placeholders that a generated
 * dataset is substituted into, so rows can be dropped straight into a script
 * you already have.
 *
 * Beyond the rows themselves, a template can reach what the run knew about
 * itself — how many rows, which columns, which configuration produced them —
 * because a seeding script usually has to say where its data came from.
 *
 * Every placeholder expands to a *JavaScript literal*, quotes and brackets
 * included: `${DATASET_NAME}` becomes `"Orders · 2026-…Z"`, not `Orders`. One
 * rule for all of them means a template never has to quote a substitution, and
 * an apostrophe in a name can never end a string it was pasted into.
 *
 * Rendering is a pure substitution and lives here, shared by the server (which
 * serves the rendered file) and the editor (which lists what is available) —
 * the caller decides how the rows themselves were serialized.
 */

import { toPortableField } from "./configFile";
import type { Metadata } from "./metadata";
import type { Field } from "./types";

/** Where a placeholder draws from, for the editor's palette. */
export type PlaceholderGroup = "dataset" | "configuration";

export type ScriptPlaceholder = {
  /** The text written in a template, `${LIKE_THIS}`. */
  token: string;
  /** Just the name inside the braces — what the palette shows. */
  name: string;
  group: PlaceholderGroup;
  /** What it expands to, in one line. */
  description: string;
  /** A rendered example, so the literal-not-text rule is visible up front. */
  example: string;
};

const placeholder = (
  name: string,
  group: PlaceholderGroup,
  description: string,
  example: string,
): ScriptPlaceholder => ({ token: `\${${name}}`, name, group, description, example });

/**
 * Every placeholder a template may carry.
 *
 * The rows come first because they are the point; the rest describe the run
 * that produced them.
 */
export const PLACEHOLDERS: ScriptPlaceholder[] = [
  placeholder("GENERATED_DATASET", "dataset", "Every row, as the JSON a download serves", '[\n  { "id": 1 }\n]'),
  placeholder("DATASET_NAME", "dataset", "The dataset's name, schema and run stamp", '"Orders · 2026-09-18T14:23:05Z"'),
  placeholder("DATASET_ID", "dataset", "The stored dataset's id", '"ds_8f2c1a"'),
  placeholder("ROW_COUNT", "dataset", "How many rows it holds", "500"),
  placeholder("FIELD_COUNT", "dataset", "How many fields it was generated from", "7"),
  placeholder("COLUMN_NAMES", "dataset", "The column names the rows carry", '["id","customer.email"]'),
  placeholder("GENERATED_AT", "dataset", "When the run happened", '"2026-09-18T14:23:05.482Z"'),
  placeholder("CONFIG_NAME", "configuration", "The configuration it came from", '"Orders"'),
  placeholder("CONFIG_ID", "configuration", "That configuration's id", '"cfg_3b91d0"'),
  placeholder("CONFIG_SEED", "configuration", "The seed it is set to reproduce with", '"steady"'),
  placeholder("CONFIG_LOCALE", "configuration", "The locale its names and addresses come from", '"de"'),
  placeholder("CONFIG_FIELDS", "configuration", "The schema itself, field by field", '[{"name":"id","type":"uuid"}]'),
  placeholder("CONFIG_METADATA", "configuration", "Its key/value pairs, as an object", '{"team":"billing"}'),
];

/** The rows placeholder, named on its own: it is the one a template needs. */
export const DATASET_PLACEHOLDER = "${GENERATED_DATASET}";

export type ScriptTemplate = {
  id: string;
  name: string;
  body: string;
  /** The account that owns it. Compare with your own id to know if it's yours. */
  ownerId: string;
  /** Accounts it is shared with, read-only. Only the owner is told. */
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
};

export const MAX_TEMPLATE_NAME_LENGTH = 120;
export const MAX_TEMPLATE_BODY_LENGTH = 200_000;

/** What one render has to say. Keyed by token; anything missing is left alone. */
export type ScriptTemplateValues = Record<string, string>;

/**
 * What a rendered template is told about its run.
 *
 * `config` is null where the dataset was generated from an inline schema, or
 * from a configuration that has since been deleted — the placeholders then
 * render as `null`, which is still a literal a script can test.
 */
export type ScriptTemplateContext = {
  dataset: { id: string; name: string; rowCount: number; fieldCount: number; createdAt: string };
  config: {
    id: string;
    name: string;
    seed?: string;
    locale?: string;
    fields?: Field[];
    metadata?: Metadata;
  } | null;
  /** The rows, already serialized the way a download serves them. */
  datasetJson: string;
  /** Column names, as `GET /api/datasets/:id/columns` reports them. */
  columns: string[];
};

/**
 * A JavaScript literal for a value a template will paste somewhere.
 *
 * On one line, whatever it is: a substitution lands in the middle of someone
 * else's code, and pretty-printed JSON there would carry its own indentation
 * into a line that already had some. The rows are the exception, and they
 * arrive already serialized — as the same bytes the download serves.
 */
const literal = (value: unknown) => JSON.stringify(value ?? null);

export function scriptTemplateValues(context: ScriptTemplateContext): ScriptTemplateValues {
  const { dataset, config } = context;
  return {
    "${GENERATED_DATASET}": context.datasetJson,
    "${DATASET_NAME}": literal(dataset.name),
    "${DATASET_ID}": literal(dataset.id),
    "${ROW_COUNT}": String(dataset.rowCount),
    "${FIELD_COUNT}": String(dataset.fieldCount),
    "${COLUMN_NAMES}": literal(context.columns),
    "${GENERATED_AT}": literal(dataset.createdAt),
    "${CONFIG_NAME}": literal(config?.name),
    "${CONFIG_ID}": literal(config?.id),
    "${CONFIG_SEED}": literal(config?.seed),
    "${CONFIG_LOCALE}": literal(config?.locale),
    // Ids are the browser's bookkeeping; what a script wants is the schema.
    "${CONFIG_FIELDS}": literal(config?.fields?.map(toPortableField)),
    "${CONFIG_METADATA}": literal(config?.metadata),
  };
}

/** Matches any known placeholder, and nothing that merely looks like one. */
const PLACEHOLDER_PATTERN = new RegExp(
  PLACEHOLDERS.map(entry => entry.token.replace(/[${}]/g, "\\$&")).join("|"),
  "g",
);

/** How many times `token` appears — by default, the rows placeholder. */
export function countPlaceholders(body: string, token: string = DATASET_PLACEHOLDER): number {
  return body.split(token).length - 1;
}

/** Which placeholders a template actually carries, in the order listed above. */
export function usedPlaceholders(body: string): ScriptPlaceholder[] {
  return PLACEHOLDERS.filter(entry => body.includes(entry.token));
}

/**
 * Substitutes every known placeholder, in one pass.
 *
 * One pass rather than one per placeholder, because a value may itself contain
 * something that looks like another placeholder — a generated row can hold any
 * text at all — and a second pass would then substitute into the data. The
 * replacement is a function for the same class of reason: a string replacement
 * would treat `$&` and `$'` in the data as patterns and silently corrupt it.
 */
export function renderScriptTemplate(body: string, values: ScriptTemplateValues): string {
  return body.replace(PLACEHOLDER_PATTERN, match => values[match] ?? match);
}

/** "Seed incidents" -> "seed-incidents.js" */
export function scriptFileName(name: string): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "script";
  return `${slug}.js`;
}

/** The body a brand-new template starts with, so the placeholders are discoverable. */
export const STARTER_TEMPLATE_BODY = [
  "// Each placeholder below is replaced with a JavaScript literal — quotes and",
  "// brackets included — when a dataset is rendered into this template.",
  `const source = { config: \${CONFIG_NAME}, rows: \${ROW_COUNT}, generatedAt: \${GENERATED_AT} };`,
  `const records = ${DATASET_PLACEHOLDER};`,
  "",
  "for (const record of records) {",
  '  const gr = new GlideRecord("incident");',
  "  gr.initialize();",
  '  gr.setValue("short_description", record.short_description);',
  "  gr.insert();",
  "}",
].join("\n");
