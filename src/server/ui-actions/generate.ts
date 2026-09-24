/**
 * The "Generate" button on a schema configuration form.
 *
 * For an internal dev tool this is most of the UI story: the form edits the
 * configuration, the related list edits its fields, and one button runs it.
 *
 * It routes through the same `run.ts` the REST endpoint uses, so a run started
 * from the form and one started from a pipeline produce identical output for
 * the same seed — which is the whole reason the orchestration is a shared
 * module rather than something each caller assembles.
 *
 * No redirect: a UI Action module receives `(current, params)` and nothing
 * else, and the `action` object that `setRedirectURL` lives on is only in
 * scope for a UI Action written as a script string. Rather than drop to a
 * string for the sake of a redirect, the result is a link in the message —
 * which also survives the list-view case, where a redirect would be wrong.
 */

import { gs, GlideRecord } from '@servicenow/glide'
import { DATASET_TABLE } from '../db/tables.ts'
import { runToDataset } from '../run.ts'

function datasetLink(datasetId: string, label: string): string {
    return `<a href="/${DATASET_TABLE}.do?sys_id=${datasetId}">${label}</a>`
}

export function generateFromForm(current: GlideRecord<'x_1040823_ddg_now_config'>): void {
    const configId = current.getUniqueValue()
    const outcome = runToDataset(configId)

    if (!outcome.ok) {
        gs.addErrorMessage(`Generation failed: ${outcome.error}`)
        return
    }

    if (outcome.state === 'queued') {
        gs.addInfoMessage(
            `Queued ${outcome.rowCount} rows. The job picks it up within five minutes — ${datasetLink(outcome.datasetId, 'watch the dataset')} for progress.`,
        )
        return
    }

    gs.addInfoMessage(
        `Generated ${outcome.rowCount} rows. The file is attached to ${datasetLink(outcome.datasetId, 'the dataset')}.`,
    )
}
