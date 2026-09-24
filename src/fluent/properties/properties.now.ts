import '@servicenow/sdk/global'
import { Property } from '@servicenow/sdk/core'

/**
 * The two numbers that decide how a run behaves, as properties rather than
 * constants.
 *
 * The Bun app capped a run at 100,000 rows with a literal in `generateRows`.
 * That number was never chosen from anything — it was a round figure that a
 * single-tenant process could get away with. What an instance tolerates is a
 * property of the instance, so it belongs where an admin can see and change
 * it without a code change.
 */

Property({
    $id: Now.ID['prop-max-rows'],
    name: 'x_1040823_ddg_now.max_rows',
    type: 'integer',
    value: 100000,
    description:
        'Hard ceiling on the rows one generation may produce. Lower it if runs are hitting the transaction quota.',
})

Property({
    $id: Now.ID['prop-sync-row-limit'],
    name: 'x_1040823_ddg_now.sync_row_limit',
    type: 'integer',
    value: 2000,
    description:
        'Runs up to this size happen inside the caller’s request and answer 200. Anything larger is queued for the scheduled job and answers 202 with a dataset to poll.',
})
