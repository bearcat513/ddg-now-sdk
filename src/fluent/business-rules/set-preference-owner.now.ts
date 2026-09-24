import '@servicenow/sdk/global'
import { BusinessRule } from '@servicenow/sdk/core'
import { setPreferenceOwner } from '../../server/business-rules/set-preference-owner'

/**
 * Makes `user` the platform's answer rather than the caller's.
 *
 * `before insert` so the value is corrected before it is stored — see the
 * module for why this is a business rule and not an ACL condition.
 */
BusinessRule({
    $id: Now.ID['ddg-set-preference-owner'],
    name: 'DDG — stamp preference owner',
    table: 'x_1040823_ddg_now_user_pref',
    when: 'before',
    action: ['insert'],
    order: 100,
    active: true,
    script: setPreferenceOwner,
})
