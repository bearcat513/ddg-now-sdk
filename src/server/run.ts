/**
 * Running a generation.
 *
 * One place that knows how a configuration becomes rows, and what happens to
 * those rows — so the REST endpoint, the scheduled job and a UI Action all
 * take the same path rather than each assembling it slightly differently.
 *
 * The Bun app ran every generation inside the request that asked for it, held
 * the whole result in memory, and stored it as a 64 MB JSON column. None of
 * those three survive the move:
 *
 *   - Anything past a few thousand rows is enqueued as a job. A synchronous
 *     100k-row generation inside an interactive transaction will hit the
 *     platform's transaction quota. Small runs — a ten-row preview on a form
 *     — stay synchronous, because making those asynchronous would be silly.
 *   - Rows are written to an attachment, not a column.
 *   - A target-table run streams into `GlideRecord` inserts through
 *     `generateInto` rather than materialising the array first.
 */

import { gs } from '@servicenow/glide'
import { datasetName } from './lib/datasetName.ts'
import type { Row } from './lib/rows.ts'
import type { Field, SchemaConfig } from './lib/types.ts'
import { rowColumns } from './lib/types.ts'
import { createDataset, finishDataset, getConfig, maxRows, setDatasetState, syncRowLimit, writeDatasetAttachment } from './db/db.ts'
import type { ChoiceSourceOptions } from './generate/choices.ts'
import { generateInto, generateRows, resolveChoiceScripts } from './generate/generate.ts'
import { insertRows, type InsertOptions, type InsertReport } from './generate/insert.ts'
import { serialize, type ExportFormat } from './export/export.ts'

export type RunOptions = ChoiceSourceOptions & {
    /** Override the configuration's stored row count for this run. */
    rowCount?: number
    /** Serialisation of the stored rows. CSV unless asked otherwise. */
    format?: ExportFormat
}

export type RunResult =
    | { ok: true; datasetId: string; rowCount: number; state: 'complete' | 'queued' }
    | { ok: false; error: string }

/** The config with its dynamic choice sources already resolved. */
function prepare(config: SchemaConfig, options: RunOptions): { fields: Field[]; count: number } {
    const fields = resolveChoiceScripts(config.fields, options)
    const requested = options.rowCount ?? config.rowCount
    return { fields, count: Math.max(1, Math.min(requested || 10, maxRows())) }
}

/**
 * Generates rows and hands them back without storing anything.
 *
 * This is the preview path — a handful of rows to show on a form, or the body
 * of a `/infer`-then-`/generate` round trip in a script. It deliberately has
 * no dataset record and no attachment, so nothing accumulates from looking.
 */
export function previewRows(configId: string, rowCount: number, options: RunOptions = {}): Row[] | null {
    const config = getConfig(configId)
    if (!config) return null
    const { fields } = prepare(config, options)
    return generateRows({ ...config, fields, rowCount: Math.max(1, Math.min(rowCount, PREVIEW_ROW_CAP)) }, maxRows())
}

/** No preview window is worth more rows than someone will scroll through. */
const PREVIEW_ROW_CAP = 100

/** A schema that has not been stored, as the preview path accepts it. */
export type InlineSchema = {
    fields: Field[]
    rowCount?: number
    seed?: string
    locale?: string
}

/**
 * The same preview, from a schema that has no record yet.
 *
 * This exists because of what Preview means in the editor: rows from the
 * fields on screen, stored nowhere, before deciding whether the schema is
 * worth keeping. Routing that through `previewRows` would have meant saving
 * first — pressing a button that promises to store nothing and having it
 * create a record is the kind of surprise that teaches people not to press it.
 *
 * It reads nothing and writes nothing, so there is no access decision to make
 * here: the caller is generating from fields they just typed. A dynamic choice
 * source is the exception, and `resolveChoiceScripts` reads it with the
 * caller's own session exactly as a stored run does.
 */
export function previewInline(schema: InlineSchema, options: RunOptions = {}): Row[] {
    const fields = resolveChoiceScripts(schema.fields, options)
    const requested = options.rowCount ?? schema.rowCount ?? 10
    return generateRows(
        {
            fields,
            rowCount: Math.max(1, Math.min(requested, PREVIEW_ROW_CAP)),
            seed: schema.seed,
            locale: schema.locale,
        },
        maxRows(),
    )
}

/**
 * Runs a generation into the app's own dataset store.
 *
 * Returns as soon as the work is *placed*: a small run comes back complete,
 * a large one comes back `queued` with a dataset id to poll. Both answers name
 * a record, which is what a CI script wants either way.
 */
export function runToDataset(configId: string, options: RunOptions = {}): RunResult {
    const config = getConfig(configId)
    if (!config) return { ok: false, error: 'No such configuration, or you may not read it.' }

    let prepared: { fields: Field[]; count: number }
    try {
        prepared = prepare(config, options)
    } catch (error) {
        return { ok: false, error: (error as Error).message }
    }

    const fieldCount = rowColumns(prepared.fields).length
    const async = prepared.count > syncRowLimit()
    const datasetId = createDataset({
        name: datasetName(config.name),
        configId: config.id,
        rowCount: async ? 0 : prepared.count,
        fieldCount,
        state: 'queued',
    })
    if (!datasetId) return { ok: false, error: 'Could not create the dataset record.' }

    if (async) {
        // The job picks it up from the `queued` state; the caller polls the
        // record. Nothing else needs to be handed over, because the dataset
        // already names the configuration it came from.
        gs.info(`[ddg] queued ${prepared.count} rows for config ${config.id} as dataset ${datasetId}`)
        return { ok: true, datasetId, rowCount: prepared.count, state: 'queued' }
    }

    const outcome = fillDataset(datasetId, config, prepared.fields, prepared.count, options.format ?? 'csv')
    if (!outcome.ok) return outcome
    return { ok: true, datasetId, rowCount: outcome.rowCount, state: 'complete' }
}

/**
 * Generates a run's rows and attaches them to an existing dataset record.
 *
 * Shared by the synchronous path above and the scheduled job, so a queued run
 * and an immediate one produce byte-identical output for the same seed.
 */
export function fillDataset(
    datasetId: string,
    config: SchemaConfig,
    fields: Field[],
    count: number,
    format: ExportFormat,
): { ok: true; rowCount: number } | { ok: false; error: string } {
    setDatasetState(datasetId, 'running')
    try {
        const rows = generateRows({ ...config, fields, rowCount: count }, maxRows())
        const file = serialize(rows, format, datasetName(config.name))
        const attachmentId = writeDatasetAttachment(datasetId, file.fileName, file.contentType, file.body)
        if (!attachmentId) {
            setDatasetState(datasetId, 'failed', 'Could not write the rows as an attachment.')
            return { ok: false, error: 'Could not write the rows as an attachment.' }
        }
        finishDataset(datasetId, rows.length, rowColumns(fields).length)
        return { ok: true, rowCount: rows.length }
    } catch (error) {
        const message = (error as Error).message
        setDatasetState(datasetId, 'failed', message)
        gs.error(`[ddg] dataset ${datasetId} failed: ${message}`)
        return { ok: false, error: message }
    }
}

/**
 * Runs a generation straight into a real table.
 *
 * Streams: `generateInto` hands over one row at a time and the insert happens
 * immediately, so a run of a hundred thousand never holds more than one row.
 * Inserts are still one GlideRecord at a time — that is the honest baseline.
 * If throughput matters the levers are `skipBusinessRules` where the target
 * table allows it, a staging table with an Import Set transform map, or simply
 * accepting a slower job because it is asynchronous anyway.
 */
export function runToTable(
    configId: string,
    table: string,
    options: RunOptions & InsertOptions = {},
): { ok: true; report: InsertReport } | { ok: false; error: string } {
    const config = getConfig(configId)
    if (!config) return { ok: false, error: 'No such configuration, or you may not read it.' }

    let prepared: { fields: Field[]; count: number }
    try {
        prepared = prepare(config, options)
    } catch (error) {
        return { ok: false, error: (error as Error).message }
    }

    // Inserted in batches so the mapping and permission checks in
    // `insertRows` are paid once per batch rather than once per row, while the
    // row loop still never holds the whole run.
    const BATCH = 200
    const total: InsertReport = { inserted: 0, attempted: 0, errors: [] }
    let batch: Row[] = []
    let aborted = false

    const flush = (): boolean => {
        if (!batch.length) return true
        const report = insertRows(table, batch, options)
        total.inserted += report.inserted
        total.attempted += report.attempted
        for (const error of report.errors) total.errors.push(error)
        batch = []
        // A table-level failure (no such table, no create access) repeats on
        // every batch, so the first one ends the run rather than logging it
        // five hundred times.
        return report.attempted > 0 || report.errors.length === 0
    }

    generateInto(
        { ...config, fields: prepared.fields, rowCount: prepared.count },
        (row) => {
            batch.push(row)
            if (batch.length >= BATCH && !flush()) {
                aborted = true
                return false
            }
            return true
        },
        maxRows(),
    )
    if (!aborted) flush()

    if (!total.inserted && total.errors.length) return { ok: false, error: total.errors[0]! }
    return { ok: true, report: total }
}
