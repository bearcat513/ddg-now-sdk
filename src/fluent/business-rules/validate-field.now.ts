import '@servicenow/sdk/global'
import { BusinessRule } from '@servicenow/sdk/core'
import { validateField } from '../../server/business-rules/validate-field'

/**
 * Keeps `field_type` honest.
 *
 * The column is a String rather than a ChoiceColumn (see `field.now.ts` for
 * why), so this is what enforces the union. `before insert/update` so a bad
 * value is refused rather than stored and then found at generation time.
 */
BusinessRule({
    $id: Now.ID['ddg-validate-field'],
    name: 'DDG — validate schema field',
    table: 'x_1040823_ddg_now_field',
    when: 'before',
    action: ['insert', 'update'],
    order: 100,
    active: true,
    script: validateField,
})
