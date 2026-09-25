import '@servicenow/sdk/global'
import { ScriptColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * A script template: JavaScript with placeholders a dataset is rendered into.
 *
 * This is the PocketBase `script_templates` collection, minus the two columns
 * that were PocketBase's answer to questions the platform answers itself. The
 * collection carried `owner` and a `sharedWith` array; here `sys_created_by`
 * is the owner and the ACLs in `acls.now.ts` decide who may change a template,
 * exactly as they do for a configuration.
 *
 * The body is a `ScriptColumn` rather than a long string, so the record opened
 * in a platform form gets the script editor a script deserves. It is the same
 * text the page's own editor writes, and the 200,000-character ceiling is the
 * one `MAX_TEMPLATE_BODY_LENGTH` enforces on the way in — stated in both
 * places because a record can also be written through a form.
 *
 * `allowWebServiceAccess` is on for the same reason the other tables have it:
 * a pipeline reads these through `/api/now/table`, and without it those calls
 * answer 403 even with correct ACLs.
 */
export const x_1040823_ddg_now_template = Table({
    name: 'x_1040823_ddg_now_template',
    label: 'Script Template',
    display: 'name',
    allowWebServiceAccess: true,
    audit: true,
    schema: {
        name: StringColumn({ label: 'Name', maxLength: 120, mandatory: true }),
        script: ScriptColumn({ label: 'Script', maxLength: 200000 }),
    },
    index: [{ name: 'ddg_template_name', unique: false, element: 'name' }],
})
