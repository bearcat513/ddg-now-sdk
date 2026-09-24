/**
 * Validates a schema field on write.
 *
 * This rule is the other half of the decision not to make `field_type` a
 * `ChoiceColumn`. The `FieldType` union has ~195 members; expressing it as
 * choices would be 195 lines of Fluent kept in lockstep with the TypeScript
 * union by hand, and every added generator would become a schema migration.
 * So the union stays the single source of truth in the module layer — and
 * this is what stops a typo reaching a generation run, where it would silently
 * fall through to `lorem.word()` and produce a column of nonsense.
 *
 * It imports `FIELD_TYPE_SET` from the same file the generator switches on, so
 * the two cannot drift: adding a generator makes it valid here automatically.
 */

import { gs, GlideRecord } from '@servicenow/glide'
import { FIELD_TYPE_SET } from '../lib/types.ts'

export function validateField(current: GlideRecord<'x_1040823_ddg_now_field'>): void {
    const type = current.getValue('field_type')
    if (!type || !FIELD_TYPE_SET.has(type)) {
        gs.addErrorMessage(
            `"${type}" is not a field type this generator knows. See the Field Types list, or the FieldType union in the module layer.`,
        )
        current.setAbortAction(true)
        return
    }

    const name = (current.getValue('field_name') ?? '').trim()
    if (!name) {
        gs.addErrorMessage('A field needs a name — it becomes the column name in every export.')
        current.setAbortAction(true)
        return
    }

    // `options` is free-form JSON by design, but invalid JSON is not "free
    // form", it is a run that fails on row one. Caught here rather than there.
    const options = current.getValue('options')
    if (options && options.trim()) {
        try {
            const parsed = JSON.parse(options)
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                gs.addErrorMessage('Options must be a JSON object, e.g. {"min": 1, "max": 100}.')
                current.setAbortAction(true)
            }
        } catch (error) {
            gs.addErrorMessage(`Options is not valid JSON: ${(error as Error).message}`)
            current.setAbortAction(true)
        }
    }
}
