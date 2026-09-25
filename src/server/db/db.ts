/**
 * The record layer: schema configurations, their fields and mappings, and the
 * datasets a run produces.
 *
 * This replaces `src/server/db.ts`, which was 436 lines of PocketBase SDK
 * calls. The design principle survives the move intact, and it is the reason
 * this layer is short: **the server holds no credentials and grants nothing on
 * its own.** In the Bun app every request carried the caller's own token and
 * PocketBase's collection rules decided what they could see. Here the session
 * *is* the caller's and ACLs decide — so every read and write goes through
 * `GlideRecordSecure`, which enforces them, rather than `GlideRecord`, which
 * in a scoped app does not. Nothing in this file elevates, and nothing should
 * be added to it that does; privileged work belongs behind a role-gated
 * Script Include, the way the PocketBase version kept it behind a hook route.
 *
 * Two shape changes from the PocketBase model, both deliberate:
 *
 *   - The `schema` JSON blob became a real child table. PocketBase stored the
 *     whole `Field[]` array as one column because it could; on ServiceNow that
 *     costs list views, filtering, per-field ACLs, and the ability to point at
 *     a field from anywhere else. One row per field is the platform-shaped
 *     version. `FieldOptions` legitimately stays JSON — it is a genuinely
 *     heterogeneous bag, and flattening 40-odd optional properties into
 *     columns would produce a table that is mostly null.
 *   - Rows live in `rows_json` on the dataset record, as JSON text. The Bun
 *     app stored them as a JSON column too, so this is the shape that came
 *     across; what the platform adds is the `json_view` attribute, which makes
 *     the column readable on the form. It is not free — a query has no column
 *     projection, so listing datasets reads every dataset's rows — and
 *     `DATASET_JSON_LIMIT` is the ceiling that keeps it bounded.
 */

import { GlideRecordSecure, gs } from '@servicenow/glide'
import type { Field, FieldMapping, FieldOptions, FieldType, ReferenceMode, SchemaConfig, Dataset, DatasetState } from '../lib/types.ts'
import { CONFIG_TABLE, DATASET_TABLE, FIELD_TABLE, MAPPING_TABLE, MAX_ROWS_PROPERTY, SYNC_ROW_LIMIT_PROPERTY } from './tables.ts'

/* -------------------------------- helpers ------------------------------- */

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw) return fallback
    try {
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

function toInt(raw: string | null | undefined, fallback: number): number {
    const value = Number(raw)
    return Number.isFinite(value) ? value : fallback
}

/** The row ceiling for a run. Tuned by an admin, not baked into the code. */
export function maxRows(): number {
    return Math.max(1, toInt(gs.getProperty(MAX_ROWS_PROPERTY, '100000'), 100_000))
}

/** Past this, a run is enqueued rather than executed in the caller's request. */
export function syncRowLimit(): number {
    return Math.max(1, toInt(gs.getProperty(SYNC_ROW_LIMIT_PROPERTY, '2000'), 2000))
}

/* ------------------------------ configurations --------------------------- */

function readField(gr: GlideRecordSecure<typeof FIELD_TABLE>): Field {
    return {
        id: gr.getUniqueValue(),
        name: gr.getValue('field_name') ?? '',
        type: (gr.getValue('field_type') ?? 'word') as FieldType,
        nullPercent: toInt(gr.getValue('null_percent'), 0) || undefined,
        unique: gr.getValue('is_unique') === 'true',
        options: parseJson<FieldOptions>(gr.getValue('options'), {}),
    }
}

/** A configuration's fields, in the order the schema editor shows them. */
export function listFields(configId: string): Field[] {
    const gr = new GlideRecordSecure(FIELD_TABLE)
    gr.addQuery('config', configId)
    gr.orderBy('order')
    gr.query()

    const fields: Field[] = []
    while (gr.next()) fields.push(readField(gr))
    return fields
}

export function listMappings(configId: string): FieldMapping[] {
    const gr = new GlideRecordSecure(MAPPING_TABLE)
    gr.addQuery('config', configId)
    gr.query()

    const mappings: FieldMapping[] = []
    while (gr.next()) {
        mappings.push({
            id: gr.getUniqueValue(),
            field: gr.getValue('field_name') ?? '',
            fromConfig: gr.getValue('from_config') ?? '',
            fromConfigName: gr.getDisplayValue('from_config') || undefined,
            fromField: gr.getValue('from_field') ?? '',
            mode: (gr.getValue('mode') ?? 'random') as ReferenceMode,
        })
    }
    return mappings
}

function readConfig(gr: GlideRecordSecure<typeof CONFIG_TABLE>, withChildren: boolean): SchemaConfig {
    const id = gr.getUniqueValue()
    return {
        id,
        name: gr.getValue('name') ?? '',
        description: gr.getValue('description') ?? '',
        fields: withChildren ? listFields(id) : [],
        mappings: withChildren ? listMappings(id) : [],
        rowCount: toInt(gr.getValue('row_count'), 100),
        seed: gr.getValue('seed') || undefined,
        locale: gr.getValue('locale') || 'en',
        metadata: parseJson(gr.getValue('metadata'), {}),
        ownerId: gr.getValue('sys_created_by') ?? '',
        createdAt: gr.getValue('sys_created_on') ?? '',
        updatedAt: gr.getValue('sys_updated_on') ?? '',
    }
}

/**
 * Every configuration the caller may read.
 *
 * There is no owner filter here on purpose. Who may see which configuration is
 * an ACL question, and `GlideRecordSecure` has already answered it by the time
 * a row reaches this loop — re-filtering on `sys_created_by` in script would
 * be a second, weaker copy of the same rule that quietly diverges from it.
 */
export function listConfigs(limit = 200): SchemaConfig[] {
    const gr = new GlideRecordSecure(CONFIG_TABLE)
    gr.orderByDesc('sys_updated_on')
    gr.setLimit(limit)
    gr.query()

    const configs: SchemaConfig[] = []
    while (gr.next()) configs.push(readConfig(gr, false))
    return configs
}

/** How many fields a configuration has, and what they are called. */
export type FieldSummary = { count: number; names: string[] }

/** Names carried per configuration. Past this the list payload is the cost. */
const SUMMARY_NAME_CAP = 60

/**
 * A field count and name list per configuration, as one query rather than one
 * per row.
 *
 * The navigation list says "12 fields" under every configuration and its
 * search box matches on column names — the thing someone remembers about a
 * schema is often the field they added rather than what they called the
 * schema. Loading each configuration's children to answer either is the N+1
 * the child table was supposed to buy us out of.
 *
 * `GlideAggregate` would count in the database but has no secure counterpart:
 * it would report rows the caller cannot read, which is exactly the quiet
 * privilege this layer refuses. So the tally is a single `GlideRecordSecure`
 * pass — one round trip, and a summary that matches what the same person would
 * see if they opened the record.
 */
export function summariseFields(limit = 5000): Record<string, FieldSummary> {
    const gr = new GlideRecordSecure(FIELD_TABLE)
    gr.orderBy('order')
    gr.setLimit(limit)
    gr.query()

    const summaries: Record<string, FieldSummary> = {}
    while (gr.next()) {
        const configId = gr.getValue('config')
        if (!configId) continue
        const summary = summaries[configId] ?? { count: 0, names: [] }
        summary.count++
        const name = gr.getValue('field_name')
        if (name && summary.names.length < SUMMARY_NAME_CAP) summary.names.push(name)
        summaries[configId] = summary
    }
    return summaries
}

export function getConfig(id: string): SchemaConfig | null {
    const gr = new GlideRecordSecure(CONFIG_TABLE)
    if (!gr.get(id)) return null
    return readConfig(gr, true)
}

/**
 * Deletes a configuration and the field rows hanging off it.
 *
 * The children go first and explicitly. A cascade would be the platform's job
 * if the reference column declared one, and this one does not — leaving the
 * rows behind would orphan them under a `config` that no longer resolves, and
 * they would still be readable by anyone whose ACL lets them read the field
 * table directly.
 */
export function deleteConfig(id: string): boolean {
    const gr = new GlideRecordSecure(CONFIG_TABLE)
    if (!gr.get(id)) return false
    if (!gr.canDelete()) return false

    const fields = new GlideRecordSecure(FIELD_TABLE)
    fields.addQuery('config', id)
    fields.query()
    while (fields.next()) fields.deleteRecord()

    return Boolean(gr.deleteRecord())
}

export type ConfigInput = {
    name: string
    description?: string
    rowCount?: number
    seed?: string
    locale?: string
    metadata?: Record<string, string>
}

export function createConfig(input: ConfigInput, fields: Field[] = []): string | null {
    const gr = new GlideRecordSecure(CONFIG_TABLE)
    gr.initialize()
    gr.setValue('name', input.name)
    gr.setValue('description', input.description ?? '')
    gr.setValue('row_count', String(input.rowCount ?? 100))
    gr.setValue('seed', input.seed ?? '')
    gr.setValue('locale', input.locale ?? 'en')
    gr.setValue('metadata', JSON.stringify(input.metadata ?? {}))

    const id = gr.insert()
    if (!id) return null
    replaceFields(id, fields)
    return id
}

export function updateConfig(id: string, input: Partial<ConfigInput>): boolean {
    const gr = new GlideRecordSecure(CONFIG_TABLE)
    if (!gr.get(id)) return false
    if (input.name !== undefined) gr.setValue('name', input.name)
    if (input.description !== undefined) gr.setValue('description', input.description)
    if (input.rowCount !== undefined) gr.setValue('row_count', String(input.rowCount))
    if (input.seed !== undefined) gr.setValue('seed', input.seed)
    if (input.locale !== undefined) gr.setValue('locale', input.locale)
    if (input.metadata !== undefined) gr.setValue('metadata', JSON.stringify(input.metadata))
    return Boolean(gr.update())
}

/**
 * Replaces a configuration's field rows wholesale.
 *
 * The schema editor hands back the whole list, so reconciling row by row would
 * be guesswork about which row is which. Deleting and re-inserting keeps the
 * stored order equal to the edited order, at the cost of new sys_ids — which
 * nothing outside this table depends on, because a mapping names a field by
 * *name* rather than by id precisely so it survives a retype or a move.
 */
export function replaceFields(configId: string, fields: Field[]): number {
    const existing = new GlideRecordSecure(FIELD_TABLE)
    existing.addQuery('config', configId)
    existing.query()
    while (existing.next()) existing.deleteRecord()

    let order = 0
    let written = 0
    for (const field of fields) {
        if (!field.name.trim()) continue
        const gr = new GlideRecordSecure(FIELD_TABLE)
        gr.initialize()
        gr.setValue('config', configId)
        gr.setValue('field_name', field.name)
        gr.setValue('field_type', field.type)
        gr.setValue('order', String((order += 100)))
        gr.setValue('null_percent', String(field.nullPercent ?? 0))
        gr.setValue('is_unique', field.unique ? 'true' : 'false')
        gr.setValue('options', JSON.stringify(field.options ?? {}))
        if (gr.insert()) written++
    }
    return written
}

/* --------------------------------- datasets ------------------------------ */

function readDataset(gr: GlideRecordSecure<typeof DATASET_TABLE>): Dataset {
    return {
        id: gr.getUniqueValue(),
        configId: gr.getValue('config') || null,
        name: gr.getValue('name') ?? '',
        rowCount: toInt(gr.getValue('row_count'), 0),
        fieldCount: toInt(gr.getValue('field_count'), 0),
        ownerId: gr.getValue('sys_created_by') ?? '',
        state: (gr.getValue('state') ?? 'complete') as DatasetState,
        error: gr.getValue('error_message') || undefined,
        createdAt: gr.getValue('sys_created_on') ?? '',
    }
}

export function getDataset(id: string): Dataset | null {
    const gr = new GlideRecordSecure(DATASET_TABLE)
    if (!gr.get(id)) return null
    return readDataset(gr)
}

export function listDatasets(configId?: string, limit = 100): Dataset[] {
    const gr = new GlideRecordSecure(DATASET_TABLE)
    if (configId) gr.addQuery('config', configId)
    gr.orderByDesc('sys_created_on')
    gr.setLimit(limit)
    gr.query()

    const datasets: Dataset[] = []
    while (gr.next()) datasets.push(readDataset(gr))
    return datasets
}

/** Deletes a dataset. Its rows go with it: they are a column on the record. */
export function deleteDataset(id: string): boolean {
    const gr = new GlideRecordSecure(DATASET_TABLE)
    if (!gr.get(id)) return false
    if (!gr.canDelete()) return false
    return Boolean(gr.deleteRecord())
}

export type DatasetInput = {
    name: string
    configId?: string
    rowCount?: number
    fieldCount?: number
    state?: DatasetState
}

export function createDataset(input: DatasetInput): string | null {
    const gr = new GlideRecordSecure(DATASET_TABLE)
    gr.initialize()
    gr.setValue('name', input.name)
    if (input.configId) gr.setValue('config', input.configId)
    gr.setValue('row_count', String(input.rowCount ?? 0))
    gr.setValue('field_count', String(input.fieldCount ?? 0))
    gr.setValue('state', input.state ?? 'queued')
    return gr.insert()
}

export function setDatasetState(id: string, state: DatasetState, error?: string): boolean {
    const gr = new GlideRecordSecure(DATASET_TABLE)
    if (!gr.get(id)) return false
    gr.setValue('state', state)
    gr.setValue('error_message', error ?? '')
    return Boolean(gr.update())
}

export function finishDataset(id: string, rowCount: number, fieldCount: number): boolean {
    const gr = new GlideRecordSecure(DATASET_TABLE)
    if (!gr.get(id)) return false
    gr.setValue('row_count', String(rowCount))
    gr.setValue('field_count', String(fieldCount))
    gr.setValue('state', 'complete')
    gr.setValue('error_message', '')
    return Boolean(gr.update())
}

/* ---------------------------------- rows --------------------------------- */

/**
 * Writes a run's rows onto the dataset record as JSON text.
 *
 * Through `GlideRecordSecure` like every other write here, so the caller's own
 * write ACL decides — which is also what makes the rows readable to exactly
 * the people who can read the record, with no second object to secure.
 *
 * The caller checks the payload against `DATASET_JSON_LIMIT` first; a string
 * past the column's length would be truncated by the platform, and truncated
 * JSON does not parse.
 */
export function writeDatasetRows(datasetId: string, rowsJson: string): boolean {
    const gr = new GlideRecordSecure(DATASET_TABLE)
    if (!gr.get(datasetId)) return false
    if (!gr.canWrite()) return false
    gr.setValue('rows_json', rowsJson)
    return Boolean(gr.update())
}

/** A dataset's stored rows, as the JSON string that was written. */
export function readDatasetRows(datasetId: string): string | null {
    const gr = new GlideRecordSecure(DATASET_TABLE)
    if (!gr.get(datasetId)) return null
    return gr.getValue('rows_json') || null
}
