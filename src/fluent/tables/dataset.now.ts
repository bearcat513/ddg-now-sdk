import '@servicenow/sdk/global'
import { ChoiceColumn, IntegerColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * One generation run.
 *
 * The record carries only metadata — what was generated, from which
 * configuration, how it went. **The rows are an attachment, not a column.**
 * The Bun app stored up to 100,000 rows as a 64 MB JSON value, which is a
 * performance problem on every read of that record; an attachment costs
 * nothing until someone asks for it, and is already a file the platform will
 * serve to exactly the people who can read this record.
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
    },
    index: [{ name: 'ddg_dataset_state', unique: false, element: 'state' }],
})
