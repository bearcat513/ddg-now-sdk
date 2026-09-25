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

import {
    EMPTY_WHITEBOARD_SCENE,
    MAX_WHITEBOARD_NAME_LENGTH,
    MAX_WHITEBOARD_SCENE_LENGTH,
    validateWhiteboard,
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
