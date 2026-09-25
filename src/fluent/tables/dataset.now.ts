import '@servicenow/sdk/global'
import { ChoiceColumn, IntegerColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * One generation run.
 *
 * The record carries the metadata — what was generated, from which
 * configuration, how it went — and the rows themselves, as JSON text in
 * `rows_json`. They are a column rather than an attachment at the user's
 * direction: a record whose data is *in* the record is one thing to read, one
 * thing to export in an update set, and one thing to look at on a form, where
 * the `json_view` dictionary attribute renders the stored string as formatted
 * JSON instead of one very long line.
 *
 * The cost is paid on every read of the record, because a query has no column
 * projection: listing datasets pulls each one's rows with it. The `maxLength`
 * below is therefore the real ceiling on a run, ahead of
 * `x_1040823_ddg_now.max_rows` — a run whose JSON would not fit is failed with
 * that message rather than silently truncated. See `fillDataset`.
 *
 * `state` exists because large runs are asynchronous. Anything past
 * `x_1040823_ddg_now.sync_row_limit` rows is placed as `queued` and picked up
 * by the scheduled job; the endpoint answers 202 with this record's id and the
 * caller polls here. A small run is born `complete` and never sees the queue.
 */
export const x_1040823_ddg_now_dataset = Table({
    name: 'x_1040823_ddg_now_dataset',
    label: 'Dataset',
    display: 'name',
    allowWebServiceAccess: true,
    schema: {
        name: StringColumn({ label: 'Name', maxLength: 200, mandatory: true }),
        config: ReferenceColumn({
            label: 'Configuration',
            referenceTable: 'x_1040823_ddg_now_config',
            // A dataset outlives the configuration it came from: the rows are
            // still real data, and deleting the recipe should not delete the
            // thing that was cooked.
            cascadeRule: 'none',
        }),
        row_count: IntegerColumn({ label: 'Rows', default: 0 }),
        field_count: IntegerColumn({ label: 'Columns', default: 0 }),
        state: ChoiceColumn({
            label: 'State',
            default: 'queued',
            choices: {
                queued: 'Queued',
                running: 'Running',
                complete: 'Complete',
                failed: 'Failed',
            },
        }),
        error_message: StringColumn({ label: 'Error', maxLength: 4000 }),
        // The generated rows, as the JSON string the export and the script
        // renderer both serve verbatim. `json_view` is what makes the field
        // readable on the form: the platform pretty-prints the stored value
        // rather than showing a single unbroken line. The length is mirrored
        // as `DATASET_JSON_LIMIT` in `src/server/db/tables.ts`, which is what
        // the run checks against — change both together.
        rows_json: StringColumn({
            label: 'Rows (JSON)',
            maxLength: 16000000,
            attributes: { json_view: true },
        }),
    },
    index: [{ name: 'ddg_dataset_state', unique: false, element: 'state' }],
})
