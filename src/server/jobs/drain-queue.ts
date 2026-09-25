/**
 * The scheduled job that runs queued generations.
 *
 * Anything past `x_1040823_ddg_now.sync_row_limit` rows is placed as a
 * `queued` dataset rather than executed inside the caller's request — a
 * synchronous hundred-thousand-row generation in an interactive transaction
 * will hit the platform's transaction quota. This job is what picks those up.
 *
 * It takes one dataset per execution on purpose. A job that drained the whole
 * queue would trade one over-long transaction for another, and the schedule is
 * the natural place to control throughput.
 */

import { GlideRecord, gs } from '@servicenow/glide'
import { getConfig, syncRowLimit } from '../db/db.ts'
import { DATASET_TABLE } from '../db/tables.ts'
import { fillDataset } from '../run.ts'
import { resolveChoiceScripts } from '../generate/generate.ts'
import { setDatasetState } from '../db/db.ts'

export function drainQueue(): void {
    // The job runs as the scheduled-job user rather than as whoever queued the
    // run, so this is the one read in the app that is not `GlideRecordSecure`
    // — there is no caller session to enforce against. It reads only its own
    // queue table and writes only the record it picked up.
    const queued = new GlideRecord(DATASET_TABLE)
    queued.addQuery('state', 'queued')
    queued.orderBy('sys_created_on')
    queued.setLimit(1)
    queued.query()
    if (!queued.next()) return

    const datasetId = queued.getUniqueValue()
    const configId = queued.getValue('config')
    if (!configId) {
        setDatasetState(datasetId, 'failed', 'The dataset names no configuration.')
        return
    }

    const config = getConfig(configId)
    if (!config) {
        setDatasetState(datasetId, 'failed', 'The configuration was deleted, or is not readable by the job user.')
        return
    }

    const count = Math.max(1, config.rowCount)
    gs.info(`[ddg] running queued dataset ${datasetId}: ${count} rows from "${config.name}"`)

    try {
        // Choice sources resolve here rather than at queue time, so a queued
        // run sees what the source holds when it runs. That is the whole point
        // of a dynamic source; caching it at enqueue would defeat it.
        const fields = resolveChoiceScripts(config.fields)
        fillDataset(datasetId, config, fields, count)
    } catch (error) {
        setDatasetState(datasetId, 'failed', (error as Error).message)
    }
}

/** How far behind the queue is. Read by the job's own condition. */
export function queueDepth(): number {
    const gr = new GlideRecord(DATASET_TABLE)
    gr.addQuery('state', 'queued')
    gr.query()
    return gr.getRowCount()
}

/** Whether a run of this size has to be queued rather than answered inline. */
export function mustQueue(rowCount: number): boolean {
    return rowCount > syncRowLimit()
}
