/**
 * The record layer for whiteboards.
 *
 * Kept beside `templates.ts` rather than inside `db.ts` for the same reason:
 * a board references no schema, field or dataset. It is a drawing people make
 * *about* those things, and it is the same drawing whichever one is open.
 *
 * `GlideRecordSecure` on every read and write, as everywhere else in the
 * layer, so who may change a board is the ACL's answer and nothing here
 * elevates.
 */

import { GlideRecordSecure } from '@servicenow/glide'
import {
    EMPTY_WHITEBOARD_SCENE,
    type Whiteboard,
    type WhiteboardInput,
    type WhiteboardSummary,
} from '../lib/whiteboard.ts'
import { WHITEBOARD_TABLE } from './tables.ts'

function readSummary(gr: GlideRecordSecure<typeof WHITEBOARD_TABLE>): WhiteboardSummary {
    return {
        id: gr.getUniqueValue(),
        name: gr.getValue('name') ?? '',
        ownerId: gr.getValue('sys_created_by') ?? '',
        // Asked of the record rather than worked out from the owner name: the
        // write ACL is the rule, and this is it being evaluated.
        canWrite: gr.canWrite(),
        createdAt: gr.getValue('sys_created_on') ?? '',
        updatedAt: gr.getValue('sys_updated_on') ?? '',
    }
}

/**
 * Every board the caller may read, without its drawing.
 *
 * The opposite call from `listTemplates`, and for the reason that one gives
 * in reverse: a template is a few kilobytes of text the nav searches inside,
 * and a scene can be megabytes of pasted images nobody searches. The query
 * still fetches the column — a GlideRecord has no projection — but it is not
 * copied into the response, which is the part that crosses the network.
 */
export function listWhiteboards(limit = 200): WhiteboardSummary[] {
    const gr = new GlideRecordSecure(WHITEBOARD_TABLE)
    gr.orderByDesc('sys_updated_on')
    gr.setLimit(limit)
    gr.query()

    const boards: WhiteboardSummary[] = []
    while (gr.next()) boards.push(readSummary(gr))
    return boards
}

export function getWhiteboard(id: string): Whiteboard | null {
    const gr = new GlideRecordSecure(WHITEBOARD_TABLE)
    if (!gr.get(id)) return null
    return { ...readSummary(gr), scene: gr.getValue('scene') || EMPTY_WHITEBOARD_SCENE }
}

export function createWhiteboard(input: WhiteboardInput): Whiteboard | null {
    const gr = new GlideRecordSecure(WHITEBOARD_TABLE)
    gr.initialize()
    gr.setValue('name', input.name.trim())
    gr.setValue('scene', input.scene)
    const id = gr.insert()
    return id ? getWhiteboard(id) : null
}

/**
 * Saves a board, answering with its summary rather than the whole record.
 *
 * The page saves as it is drawn on, and the caller already holds the scene it
 * just sent; echoing megabytes of it back on every autosave would be the
 * single largest thing this API sends.
 */
export function updateWhiteboard(id: string, input: WhiteboardInput): WhiteboardSummary | null {
    const gr = new GlideRecordSecure(WHITEBOARD_TABLE)
    if (!gr.get(id)) return null
    gr.setValue('name', input.name.trim())
    gr.setValue('scene', input.scene)
    if (!gr.update()) return null

    const saved = new GlideRecordSecure(WHITEBOARD_TABLE)
    return saved.get(id) ? readSummary(saved) : null
}

export function deleteWhiteboard(id: string): boolean {
    const gr = new GlideRecordSecure(WHITEBOARD_TABLE)
    if (!gr.get(id)) return false
    if (!gr.canDelete()) return false
    return Boolean(gr.deleteRecord())
}
