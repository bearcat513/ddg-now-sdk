import '@servicenow/sdk/global'
import { UiAction } from '@servicenow/sdk/core'
import { generateFromForm } from '../../server/ui-actions/generate'
import { ddgUser } from '../roles/roles.now'

/**
 * One button, on the configuration form and in its list.
 *
 * `UiAction` is another API that accepts a function import, so the button runs
 * the same module the REST endpoint and the scheduled job do.
 */
UiAction({
    $id: Now.ID['ddg-generate-action'],
    name: 'Generate data',
    table: 'x_1040823_ddg_now_config',
    actionName: 'ddg_generate',
    script: generateFromForm,
    roles: [ddgUser],
    active: true,
    form: {
        showButton: true,
        // Not a context-menu entry: this is the primary thing you do with a
        // configuration, and burying it in a menu would be coy.
        style: 'primary',
    },
    list: {
        showButton: true,
    },
    // A configuration with no fields generates a row of nothing, which is a
    // confusing thing to hand someone. The condition asks the child table
    // rather than the record, because that is where the answer lives.
    condition: "!current.isNewRecord() && new GlideRecord('x_1040823_ddg_now_field').get('config', current.getUniqueValue())",
    order: 100,
})
