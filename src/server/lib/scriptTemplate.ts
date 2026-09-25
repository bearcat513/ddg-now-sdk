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
 * Rendering is a pure substitution, and it lives beside `preferences.ts` for
 * the same reason that one does: the endpoint that renders a script and the
 * editor that writes one have to agree about what a placeholder is, down to
 * its spelling, without a round trip to find out. So this is compiled into the
 * `sys_module` with the rest of `src/server` *and* bundled into the page —
 * which is why it is Glide-free and side-effect-free, exactly like the
 * preference normalizer.
 *
 * The caller decides how the rows themselves were serialized. On the platform
 * that is the dataset's `rows_json` column, read back verbatim, so a script
 * and a download of the same dataset can never disagree about what the rows
 * were.
 */

import type { Field } from './types.ts'

/** Where a placeholder draws from, for the editor's palette. */
export type PlaceholderGroup = 'dataset' | 'configuration'

export type ScriptPlaceholder = {
    /** The text written in a template, `${LIKE_THIS}`. */
    token: string
    /** Just the name inside the braces — what the palette shows. */
    name: string
    group: PlaceholderGroup
    /** What it expands to, in one line. */
    description: string
    /** A rendered example, so the literal-not-text rule is visible up front. */
    example: string
}

const placeholder = (
    name: string,
    group: PlaceholderGroup,
    description: string,
    example: string,
): ScriptPlaceholder => ({ token: `\${${name}}`, name, group, description, example })

/**
 * Every placeholder a template may carry.
 *
 * The rows come first because they are the point; the rest describe the run
 * that produced them.
 */
export const PLACEHOLDERS: ScriptPlaceholder[] = [
    placeholder('GENERATED_DATASET', 'dataset', 'Every row, as the JSON a download serves', '[\n  { "id": 1 }\n]'),
    placeholder('DATASET_NAME', 'dataset', "The dataset's name, schema and run stamp", '"Orders · 2026-09-18 14:23:05"'),
    placeholder('DATASET_ID', 'dataset', "The stored dataset's sys_id", '"a1b2c3d4e5f6…"'),
    placeholder('ROW_COUNT', 'dataset', 'How many rows it holds', '500'),
    placeholder('FIELD_COUNT', 'dataset', 'How many fields it was generated from', '7'),
    placeholder('COLUMN_NAMES', 'dataset', 'The column names the rows carry', '["id","customer.email"]'),
    placeholder('GENERATED_AT', 'dataset', 'When the run happened', '"2026-09-18 14:23:05"'),
    placeholder('CONFIG_NAME', 'configuration', 'The configuration it came from', '"Orders"'),
    placeholder('CONFIG_ID', 'configuration', "That configuration's sys_id", '"9f8e7d6c5b4a…"'),
    placeholder('CONFIG_SEED', 'configuration', 'The seed it is set to reproduce with', '"steady"'),
    placeholder('CONFIG_LOCALE', 'configuration', 'The locale its names and addresses come from', '"de"'),
    placeholder('CONFIG_FIELDS', 'configuration', 'The schema itself, field by field', '[{"name":"id","type":"uuid"}]'),
    placeholder('CONFIG_METADATA', 'configuration', 'Its key/value pairs, as an object', '{"team":"billing"}'),
]

/** The rows placeholder, named on its own: it is the one a template needs. */
export const DATASET_PLACEHOLDER = '${GENERATED_DATASET}'

/**
 * A stored template.
 *
 * `ownerId` is `sys_created_by` — a user *name*, not a sys_id, because that is
 * what the column holds and what the ACL on this table compares against. There
 * is no `sharedWith`: sharing was a PocketBase-era table of its own and the
 * platform answers that question with roles and ACLs instead.
 *
 * `canWrite` is that answer, carried with the record. The Bun app compared
 * `ownerId` to the signed-in account's id to decide whether Save would edit
 * this template or fork it; here the same question is the ACL's, and a client
 * comparing a user *name* it never reliably learns would be guessing at a rule
 * the platform has already evaluated.
 */
export type ScriptTemplate = {
    id: string
    name: string
    body: string
    ownerId: string
    /** Whether the caller may save over this one, as the ACL decides. */
    canWrite: boolean
    createdAt: string
    updatedAt: string
}

export const MAX_TEMPLATE_NAME_LENGTH = 120
export const MAX_TEMPLATE_BODY_LENGTH = 200_000

/** What one render has to say. Keyed by token; anything missing is left alone. */
export type ScriptTemplateValues = Record<string, string>

/**
 * What a rendered template is told about its run.
 *
 * `config` is null where the dataset came from a configuration that has since
 * been deleted — the placeholders then render as `null`, which is still a
 * literal a script can test.
 */
export type ScriptTemplateContext = {
    dataset: { id: string; name: string; rowCount: number; fieldCount: number; createdAt: string }
    config: {
        id: string
        name: string
        seed?: string
        locale?: string
        fields?: Field[]
        metadata?: Record<string, string>
    } | null
    /** The rows, already serialized the way a download serves them. */
    datasetJson: string
    /** Column names, as `GET /dataset/{id}/rows` reports them. */
    columns: string[]
}

/**
 * A JavaScript literal for a value a template will paste somewhere.
 *
 * On one line, whatever it is: a substitution lands in the middle of someone
 * else's code, and pretty-printed JSON there would carry its own indentation
 * into a line that already had some. The rows are the exception, and they
 * arrive already serialized — as the same bytes the download serves.
 */
const literal = (value: unknown) => JSON.stringify(value ?? null)

/**
 * The schema as a script should see it: names, types and options, without the
 * ids the editor uses to keep its rows apart. Those are a sys_id here rather
 * than a browser's bookkeeping, and they are still not what a script wants.
 */
function portableField(field: Field): Record<string, unknown> {
    const copy: Record<string, unknown> = { ...(field as unknown as Record<string, unknown>) }
    delete copy.id
    const options = field.options
    if (options && options.fields && options.fields.length) {
        copy.options = { ...options, fields: options.fields.map(portableField) }
    } else if (!options || !Object.keys(options).length) {
        delete copy.options
    }
    return copy
}

export function scriptTemplateValues(context: ScriptTemplateContext): ScriptTemplateValues {
    const { dataset, config } = context
    return {
        '${GENERATED_DATASET}': context.datasetJson,
        '${DATASET_NAME}': literal(dataset.name),
        '${DATASET_ID}': literal(dataset.id),
        '${ROW_COUNT}': String(dataset.rowCount),
        '${FIELD_COUNT}': String(dataset.fieldCount),
        '${COLUMN_NAMES}': literal(context.columns),
        '${GENERATED_AT}': literal(dataset.createdAt),
        '${CONFIG_NAME}': literal(config?.name),
        '${CONFIG_ID}': literal(config?.id),
        '${CONFIG_SEED}': literal(config?.seed),
        '${CONFIG_LOCALE}': literal(config?.locale),
        '${CONFIG_FIELDS}': literal(config?.fields?.map(portableField)),
        '${CONFIG_METADATA}': literal(config?.metadata),
    }
}

/** Matches any known placeholder, and nothing that merely looks like one. */
const PLACEHOLDER_PATTERN = new RegExp(PLACEHOLDERS.map((entry) => entry.token.replace(/[${}]/g, '\\$&')).join('|'), 'g')

/** How many times `token` appears — by default, the rows placeholder. */
export function countPlaceholders(body: string, token: string = DATASET_PLACEHOLDER): number {
    return body.split(token).length - 1
}

/** Which placeholders a template actually carries, in the order listed above. */
export function usedPlaceholders(body: string): ScriptPlaceholder[] {
    return PLACEHOLDERS.filter((entry) => body.includes(entry.token))
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
    return body.replace(PLACEHOLDER_PATTERN, (match) => values[match] ?? match)
}

/** "Seed incidents" -> "seed-incidents.js" */
export function scriptFileName(name: string): string {
    const slug =
        name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || 'script'
    return `${slug}.js`
}

/** The body a brand-new template starts with, so the placeholders are discoverable. */
export const STARTER_TEMPLATE_BODY = [
    '// Each placeholder below is replaced with a JavaScript literal — quotes and',
    '// brackets included — when a dataset is rendered into this template.',
    'var source = { config: ${CONFIG_NAME}, rows: ${ROW_COUNT}, generatedAt: ${GENERATED_AT} };',
    `var records = ${DATASET_PLACEHOLDER};`,
    '',
    'records.forEach(function (record) {',
    "  var gr = new GlideRecord('incident');",
    '  gr.initialize();',
    "  gr.setValue('short_description', record.short_description);",
    '  gr.insert();',
    '});',
].join('\n')
