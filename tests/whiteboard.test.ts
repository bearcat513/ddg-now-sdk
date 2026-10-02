/**
 * Whiteboard validation.
 *
 * What matters is the boundary the record layer relies on: a stored scene is
 * always JSON with an element list, and never longer than the column — a
 * longer one would be truncated by the platform into text that no longer
 * opens. Anything past that is Excalidraw's own `restore` to repair.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
    EMPTY_WHITEBOARD_SCENE,
    MAX_WHITEBOARD_NAME_LENGTH,
    MAX_WHITEBOARD_SCENE_LENGTH,
    SHARE_TOKEN_LENGTH,
    WHITEBOARD_SHARE_PAGE,
    constantTimeEqual,
    hashSharePassword,
    isShareToken,
    resolvePublicWhiteboard,
    validateSharePassword,
    validateWhiteboard,
    verifySharePassword,
    whiteboardShareUrl,
    type SharedWhiteboardRecord,
} from '../src/server/lib/whiteboard.ts'

test('the empty scene is itself a valid scene', () => {
    assert.equal(validateWhiteboard({ name: 'Blank', scene: EMPTY_WHITEBOARD_SCENE }), null)
})

test('a scene with elements and files passes untouched', () => {
    const scene = JSON.stringify({
        type: 'excalidraw',
        version: 2,
        elements: [{ id: 'a', type: 'rectangle', x: 0, y: 0 }],
        appState: { viewBackgroundColor: '#ffffff' },
        files: { f1: { mimeType: 'image/png', dataURL: 'data:image/png;base64,AAAA' } },
    })
    assert.equal(validateWhiteboard({ name: 'Model', scene }), null)
})

test('a name is required and bounded', () => {
    assert.match(validateWhiteboard({ name: '   ', scene: EMPTY_WHITEBOARD_SCENE })!, /needs a name/)
    assert.match(
        validateWhiteboard({ name: 'x'.repeat(MAX_WHITEBOARD_NAME_LENGTH + 1), scene: EMPTY_WHITEBOARD_SCENE })!,
        /characters or fewer/,
    )
})

test('a scene that is not JSON, or has no element list, is refused', () => {
    assert.match(validateWhiteboard({ name: 'a', scene: '{"elements": [' })!, /not valid JSON/)
    assert.match(validateWhiteboard({ name: 'a', scene: '[]' })!, /no element list/)
    assert.match(validateWhiteboard({ name: 'a', scene: 'null' })!, /no element list/)
    assert.match(validateWhiteboard({ name: 'a', scene: '{"elements": {}}' })!, /no element list/)
})

test('a scene longer than the column is refused before it could be truncated', () => {
    const padding = 'x'.repeat(MAX_WHITEBOARD_SCENE_LENGTH)
    const scene = JSON.stringify({ elements: [], appState: { padding } })
    assert.match(validateWhiteboard({ name: 'a', scene })!, /too large/)
})

/* ------------------------------ public links ----------------------------- */

/** What `GlideDigest.getSHA256Hex` is on the instance: upper-case hex. */
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex').toUpperCase()

const TOKEN = 'A'.repeat(SHARE_TOKEN_LENGTH - 4) + 'b9Zq'

function record(overrides: Partial<SharedWhiteboardRecord> = {}): SharedWhiteboardRecord {
    return { token: TOKEN, name: 'Orders', scene: EMPTY_WHITEBOARD_SCENE, updatedAt: '2026-10-02 10:00:00', passwordHash: '', ...overrides }
}

test('a share token is exactly the right length of letters and digits', () => {
    assert.ok(isShareToken(TOKEN))
    assert.ok(!isShareToken(TOKEN.slice(1)))
    assert.ok(!isShareToken(TOKEN + 'x'))
    assert.ok(!isShareToken(TOKEN.slice(1) + '%'))
    assert.ok(!isShareToken(`${TOKEN.slice(4)}' OR`))
    assert.ok(!isShareToken(undefined))
})

test('the share link points at the public page and escapes nothing it does not need to', () => {
    assert.equal(
        whiteboardShareUrl('https://dev1.service-now.com/', TOKEN),
        `https://dev1.service-now.com/${WHITEBOARD_SHARE_PAGE}?token=${TOKEN}`,
    )
})

test('a share password is bounded', () => {
    assert.match(validateSharePassword('short')!, /at least/)
    assert.equal(validateSharePassword('long enough'), null)
    assert.match(validateSharePassword('x'.repeat(200))!, /or fewer/)
})

test('a hashed password verifies, a different one does not, and the hash is not the password', () => {
    const stored = hashSharePassword('correct horse', 'salt123', sha256, 10)
    assert.match(stored, /^sha256:10:salt123:[0-9a-f]{64}$/)
    assert.ok(!stored.includes('correct horse'))
    assert.ok(verifySharePassword('correct horse', stored, sha256))
    assert.ok(!verifySharePassword('correct horsE', stored, sha256))
    assert.ok(!verifySharePassword('correct horse', 'garbage', sha256))
    assert.ok(!verifySharePassword('correct horse', 'sha256:0:salt:abc', sha256))
})

test('the same password under two salts hashes differently', () => {
    assert.notEqual(hashSharePassword('pw-pw-pw', 'a', sha256, 2), hashSharePassword('pw-pw-pw', 'b', sha256, 2))
})

test('constantTimeEqual is plain equality', () => {
    assert.ok(constantTimeEqual('abc', 'abc'))
    assert.ok(!constantTimeEqual('abc', 'abd'))
    assert.ok(!constantTimeEqual('abc', 'abcd'))
    assert.ok(!constantTimeEqual('', 'a'))
})

test('a malformed token never reaches the lookup', () => {
    let called = false
    const result = resolvePublicWhiteboard('nope', undefined, () => ((called = true), record()), sha256)
    assert.deepEqual(result, { status: 'not-found' })
    assert.equal(called, false)
})

test('a board the lookup does not return, or returns under a differently-cased token, is not found', () => {
    assert.deepEqual(resolvePublicWhiteboard(TOKEN, undefined, () => null, sha256), { status: 'not-found' })
    assert.deepEqual(
        resolvePublicWhiteboard(TOKEN, undefined, () => record({ token: TOKEN.toLowerCase() }), sha256),
        { status: 'not-found' },
    )
})

test('an open board comes back without its hash or token', () => {
    const result = resolvePublicWhiteboard(TOKEN, undefined, () => record(), sha256)
    assert.deepEqual(result, {
        status: 'ok',
        board: { name: 'Orders', scene: EMPTY_WHITEBOARD_SCENE, updatedAt: '2026-10-02 10:00:00' },
    })
})

test('a protected board asks, refuses a wrong password, and opens for the right one', () => {
    const lookup = () => record({ passwordHash: hashSharePassword('correct horse', 's', sha256, 5) })
    assert.deepEqual(resolvePublicWhiteboard(TOKEN, undefined, lookup, sha256), { status: 'password-required' })
    assert.deepEqual(resolvePublicWhiteboard(TOKEN, '', lookup, sha256), { status: 'password-required' })
    assert.deepEqual(resolvePublicWhiteboard(TOKEN, 'wrong', lookup, sha256), { status: 'wrong-password' })

    const opened = resolvePublicWhiteboard(TOKEN, 'correct horse', lookup, sha256)
    assert.equal(opened.status, 'ok')
    assert.ok(!JSON.stringify(opened).includes('sha256:'))
})
