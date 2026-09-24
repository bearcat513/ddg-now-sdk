import '@servicenow/sdk/global'
import { IntegerColumn, JsonColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * A schema configuration: what to generate, and how much of it.
 *
 * The PocketBase `configs` collection kept the whole `Field[]` array in one
 * `schema` JSON column. That does not come across — see `field.now.ts` for why
 * the fields are a child table here instead. What stays on the parent is the
 * handful of things that really are properties *of the configuration*: its
 * name, how many rows a run produces, the seed that makes a run reproducible,
 * and the locale its names and addresses are drawn from.
 *
 * `metadata` stays JSON. It is free-form key/value pairs describing what a
 * schema is for — which team owns it, the ticket it was written for — and
 * that is genuinely heterogeneous rather than a set of columns waiting to be
 * discovered.
 *
 * `allowWebServiceAccess` is on because a pipeline reads these through
 * `/api/now/table`. Without it those calls return 403 even with correct ACLs,
 * which looks exactly like a permissions bug and is not one.
 */
export const x_1040823_ddg_now_config = Table({
    name: 'x_1040823_ddg_now_config',
    label: 'Schema Configuration',
    display: 'name',
    allowWebServiceAccess: true,
    audit: true,
    schema: {
        name: StringColumn({ label: 'Name', maxLength: 200, mandatory: true }),
        description: StringColumn({ label: 'Description', maxLength: 2000 }),
        row_count: IntegerColumn({ label: 'Row count', default: 100 }),
        seed: StringColumn({
            label: 'Seed',
            maxLength: 200,
            // Empty means a fresh stream each run. A text seed is hashed to a
            // 32-bit integer, exactly as the Bun version did, so the same text
            // replays the same rows.
        }),
        locale: StringColumn({ label: 'Locale', maxLength: 20, default: 'en' }),
        metadata: JsonColumn({ label: 'Metadata' }),
    },
    index: [{ name: 'ddg_config_name', unique: false, element: 'name' }],
})
