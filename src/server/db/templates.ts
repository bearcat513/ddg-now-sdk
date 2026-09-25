/**
 * The record layer for script templates.
 *
 * Kept beside `db.ts` rather than inside it, for the reason `preferences.ts`
 * is: that file is the record layer for the application's *subject* — schemas,
 * their fields, and the datasets a run produces, all of which reference each
 * other. A template references none of them. It is a piece of text that a
 * dataset is rendered into at the moment somebody asks, and it is the same
 * template whichever dataset that is.
 *
 * The rule the rest of the layer follows holds here too: `GlideRecordSecure`
 * on every read and write, so the caller's own ACLs decide who may change a
 * template. Nothing here elevates, and the owner check the PocketBase version
 * wrote in script is an ACL condition now.
 */

import { GlideRecordSecure } from '@servicenow/glide'
import {
    MAX_TEMPLATE_BODY_LENGTH,
    MAX_TEMPLATE_NAME_LENGTH,
    type ScriptTemplate,
} from '../lib/scriptTemplate.ts'
import { TEMPLATE_TABLE } from './tables.ts'

function readTemplate(gr: GlideRecordSecure<typeof TEMPLATE_TABLE>): ScriptTemplate {
    return {
        id: gr.getUniqueValue(),
        name: gr.getValue('name') ?? '',
        body: gr.getValue('script') ?? '',
        ownerId: gr.getValue('sys_created_by') ?? '',
        // Asked of the record rather than worked out from the owner name: the
        // write ACL is the rule, and this is it being evaluated.
        canWrite: gr.canWrite(),
        createdAt: gr.getValue('sys_created_on') ?? '',
        updatedAt: gr.getValue('sys_updated_on') ?? '',
    }
}

/**
 * Every template the caller may read, bodies included.
 *
 * The configuration list deliberately leaves its fields behind and this one
 * deliberately does not, because the two lists are asked different questions.
 * A schema's children are a table of their own and a nav row only needs to
 * count them; a template *is* its body, the nav's search box looks inside it
 * for the line someone half-remembers, and opening one has to put it in the
 * editor. One list call is the whole feature's data.
 */
export function listTemplates(limit = 200): ScriptTemplate[] {
    const gr = new GlideRecordSecure(TEMPLATE_TABLE)
    gr.orderByDesc('sys_updated_on')
    gr.setLimit(limit)
    gr.query()

    const templates: ScriptTemplate[] = []
    while (gr.next()) templates.push(readTemplate(gr))
    return templates
}

export function getTemplate(id: string): ScriptTemplate | null {
    const gr = new GlideRecordSecure(TEMPLATE_TABLE)
    if (!gr.get(id)) return null
    return readTemplate(gr)
}

export type TemplateInput = { name: string; body: string }

/**
 * The lengths, checked here rather than only in the handler.
 *
 * The column carries the same ceiling, so this is not the only thing standing
 * between a 10 MB body and the table — but a truncating database is a poor way
 * to learn that a script was too long, and the message a caller gets should
 * say which limit they crossed.
 */
export function validateTemplate(input: TemplateInput): string | null {
    if (!input.name.trim()) return 'A template needs a name.'
    if (input.name.length > MAX_TEMPLATE_NAME_LENGTH) {
        return `A template name must be ${MAX_TEMPLATE_NAME_LENGTH} characters or fewer.`
    }
    if (input.body.length > MAX_TEMPLATE_BODY_LENGTH) {
        return `A template body must be ${MAX_TEMPLATE_BODY_LENGTH} characters or fewer.`
    }
    return null
}

export function createTemplate(input: TemplateInput): ScriptTemplate | null {
    const gr = new GlideRecordSecure(TEMPLATE_TABLE)
    gr.initialize()
    gr.setValue('name', input.name.trim())
    gr.setValue('script', input.body)
    const id = gr.insert()
    return id ? getTemplate(id) : null
}

export function updateTemplate(id: string, input: TemplateInput): ScriptTemplate | null {
    const gr = new GlideRecordSecure(TEMPLATE_TABLE)
    if (!gr.get(id)) return null
    gr.setValue('name', input.name.trim())
    gr.setValue('script', input.body)
    if (!gr.update()) return null
    return getTemplate(id)
}

export function deleteTemplate(id: string): boolean {
    const gr = new GlideRecordSecure(TEMPLATE_TABLE)
    if (!gr.get(id)) return false
    if (!gr.canDelete()) return false
    return Boolean(gr.deleteRecord())
}
