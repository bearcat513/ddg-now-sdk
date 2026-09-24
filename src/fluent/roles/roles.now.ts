import '@servicenow/sdk/global'
import { Role } from '@servicenow/sdk/core'

/**
 * Two roles, and the split between them is the one decision worth making here.
 *
 * `user` covers everything the Bun app let any signed-up account do: write
 * schemas, run generations into the app's own dataset store, read the results.
 * All of that stays inside this scope.
 *
 * `table_writer` covers the one operation that does not — generating straight
 * into `incident`, or into another app's tables. Those writes land in a system
 * of record, and the fact that they are a mode of the same generator does not
 * make them the same act. The Bun version never had this capability at all, so
 * nothing is being taken away by gating it.
 */

export const ddgUser = Role({
    name: 'x_1040823_ddg_now.user',
    description: 'Create schema configurations and generate data into the app’s own dataset store.',
})

export const ddgTableWriter = Role({
    name: 'x_1040823_ddg_now.table_writer',
    description: 'Generate data directly into real tables. Writes leave this application’s scope.',
    // A table writer is always also a user: the configuration has to be
    // readable before it can be run against anything.
    containsRoles: [ddgUser],
})
