import '@servicenow/sdk/global'
import { ScheduledScript } from '@servicenow/sdk/core'
import { drainQueue } from '../../server/jobs/drain-queue'

/**
 * Runs queued generations.
 *
 * A run larger than `x_1040823_ddg_now.sync_row_limit` is placed as a `queued`
 * dataset rather than executed inside the caller's request, because a
 * synchronous hundred-thousand-row generation in an interactive transaction
 * will hit the platform's transaction quota. This is what picks those up.
 *
 * One dataset per execution, every five minutes. Draining the whole queue in
 * one pass would just move the over-long transaction from the request to the
 * job; the schedule is the throughput control, and it is a visible one.
 *
 * `ScheduledScript` accepts a function import, so the job is the same typed
 * module the REST endpoints use rather than a script string that drifts.
 */
ScheduledScript({
    $id: Now.ID['ddg-drain-queue'],
    name: 'DDG — run queued generations',
    script: drainQueue,
    active: true,
    frequency: 'periodically',
    executionInterval: { minutes: 5 },
    // The condition field is sandbox-evaluated and takes a single expression,
    // so this is a bare `get(name, value)` rather than a query. It keeps the
    // job log quiet on an instance where nobody is generating anything.
    conditional: true,
    condition: "new GlideRecord('x_1040823_ddg_now_dataset').get('state', 'queued')",
})
