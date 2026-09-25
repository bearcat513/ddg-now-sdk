/**
 * Whiteboards: an Excalidraw scene, stored whole on one record.
 *
 * Shared the way `scriptTemplate.ts` is — compiled into the `sys_module` for
 * the record layer and bundled into the page for its types and limits — so it
 * must stay Glide-free.
 *
 * The scene is kept as the text Excalidraw itself writes for a `.excalidraw`
 * file (`serializeAsJSON(..., 'local')`), images included. That is the one
 * format the drawing library, the platform form's JSON view and a person's
 * desktop copy of the app all read, so a stored board is also a file that
 * opens anywhere Excalidraw does, and nothing here has to understand it
 * beyond "an object with an `elements` array".
 */

export type WhiteboardSummary = {
    id: string
    name: string
    ownerId: string
    /** Whether the caller may save over this one, as the ACL decides. */
    canWrite: boolean
    createdAt: string
    updatedAt: string
}

/** A board with its drawing. Only the single-record endpoint sends one. */
export type Whiteboard = WhiteboardSummary & {
    /** Excalidraw's own serialized scene, verbatim. */
    scene: string
}

export type WhiteboardInput = { name: string; scene: string }

export const MAX_WHITEBOARD_NAME_LENGTH = 120

/**
 * The `maxLength` of the table's `scene` column, mirrored here because a save
 * has to be refused before the platform truncates it — a truncated scene is
 * not JSON, and a board that no longer opens is worse than a save that failed
 * and said why. Change it with the column in `whiteboard.now.ts`, never alone.
 */
export const MAX_WHITEBOARD_SCENE_LENGTH = 16_000_000

/** An empty scene, in the shape Excalidraw writes, for a board saved blank. */
export const EMPTY_WHITEBOARD_SCENE = JSON.stringify({
    type: 'excalidraw',
    version: 2,
    source: 'x_1040823_ddg_now',
    elements: [],
    appState: {},
    files: {},
})

/**
 * Why a board cannot be stored, or null when it can.
 *
 * The scene is parsed rather than trusted, but only as far as proving it is a
 * scene: Excalidraw's own `restore` is what repairs an element from an older
 * version, and a second, stricter opinion here would only refuse drawings the
 * library would have opened.
 */
export function validateWhiteboard(input: WhiteboardInput): string | null {
    if (!input.name.trim()) return 'A whiteboard needs a name.'
    if (input.name.length > MAX_WHITEBOARD_NAME_LENGTH) {
        return `A whiteboard name must be ${MAX_WHITEBOARD_NAME_LENGTH} characters or fewer.`
    }
    if (input.scene.length > MAX_WHITEBOARD_SCENE_LENGTH) {
        return 'This whiteboard is too large to store. Large pasted images are the usual cause — try removing one.'
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(input.scene)
    } catch {
        return 'The whiteboard scene is not valid JSON.'
    }
    const elements = (parsed as { elements?: unknown } | null)?.elements
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(elements)) {
        return 'The whiteboard scene has no element list.'
    }
    return null
}
