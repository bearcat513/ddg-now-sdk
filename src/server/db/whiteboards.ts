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

import { GlideDigest, GlideRecordSecure, GlideSecureRandomUtil } from '@servicenow/glide'
import {
    EMPTY_WHITEBOARD_SCENE,
    SHARE_TOKEN_LENGTH,
    hashSharePassword,
    isShareToken,
    resolvePublicWhiteboard,
    type PublicWhiteboardResult,
    type SharedWhiteboardRecord,
    type Whiteboard,
    type WhiteboardInput,
    type WhiteboardShare,
    type WhiteboardShareInput,
    type WhiteboardSummary,
} from '../lib/whiteboard.ts'
import { WHITEBOARD_TABLE } from './tables.ts'

export type { SharedWhiteboardRecord } from '../lib/whiteboard.ts'

function readShare(gr: GlideRecordSecure<typeof WHITEBOARD_TABLE>): WhiteboardShare {
    return {
        enabled: gr.getValue('share_enabled') === '1',
        token: gr.getValue('share_token') ?? '',
        passwordProtected: gr.getValue('share_protected') === '1',
    }
}

function readSummary(gr: GlideRecordSecure<typeof WHITEBOARD_TABLE>): WhiteboardSummary {
    const canWrite = gr.canWrite()
    return {
        id: gr.getUniqueValue(),
        name: gr.getValue('name') ?? '',
        ownerId: gr.getValue('sys_created_by') ?? '',
        // Asked of the record rather than worked out from the owner name: the
        // write ACL is the rule, and this is it being evaluated.
        canWrite,
        createdAt: gr.getValue('sys_created_on') ?? '',
        updatedAt: gr.getValue('sys_updated_on') ?? '',
        // Only whoever may change the board is told about its link; the
        // token's field ACL would hide it from anyone else anyway.
        share: canWrite ? readShare(gr) : null,
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

/* ------------------------------ public links ----------------------------- */

const sha256 = (text: string) => new GlideDigest().getSHA256Hex(text)

const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/**
 * A random string over an alphabet this file chose, from the platform's
 * secure generator. Built here rather than taken from `getSecureRandomString`
 * because `isShareToken` has to know exactly which characters a token holds.
 */
function secureRandomString(length: number): string {
    let out = ''
    for (let index = 0; index < length; index++) {
        out += TOKEN_ALPHABET.charAt(GlideSecureRandomUtil.getSecureRandomIntBound(TOKEN_ALPHABET.length))
    }
    return out
}

/**
 * Turns a board's public link on or off, sets or clears its password, or
 * replaces the link. The owner's own write, through `GlideRecordSecure` like
 * every other save — nothing here is elevated.
 *
 * A token is minted the first time a board is shared and then kept, so
 * switching a link off and on again brings the same link back. `newLink` is
 * the way to make old copies stop working.
 */
export function setWhiteboardShare(id: string, input: WhiteboardShareInput): WhiteboardShare | null {
    const gr = new GlideRecordSecure(WHITEBOARD_TABLE)
    if (!gr.get(id) || !gr.canWrite()) return null

    gr.setValue('share_enabled', input.enabled)
    if (input.newLink || !isShareToken(gr.getValue('share_token'))) {
        gr.setValue('share_token', secureRandomString(SHARE_TOKEN_LENGTH))
    }
    if (typeof input.password === 'string') {
        const salt = secureRandomString(16)
        gr.setValue('share_password', hashSharePassword(input.password, salt, sha256))
        gr.setValue('share_protected', true)
    } else if (input.password === null) {
        gr.setValue('share_password', '')
        gr.setValue('share_protected', false)
    }
    if (!gr.update()) return null

    const saved = new GlideRecordSecure(WHITEBOARD_TABLE)
    return saved.get(id) ? readShare(saved) : null
}

/**
 * What an anonymous caller holding `token` may see. The decision is
 * `resolvePublicWhiteboard`'s; this supplies the platform's SHA-256, and
 * `lookup` is the `DdgPublicWhiteboard` Script Include's privileged read,
 * handed in because a module cannot reach a Script Include by name.
 */
export function openPublicWhiteboard(
    token: unknown,
    password: unknown,
    lookup: (token: string) => SharedWhiteboardRecord | null,
): PublicWhiteboardResult {
    return resolvePublicWhiteboard(token, password, lookup, sha256)
}
