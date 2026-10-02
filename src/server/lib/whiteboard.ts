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
    /**
     * The board's public link, for whoever may change it. Null for everyone
     * else: a colleague can already open the board, and the link is the
     * owner's to hand out.
     */
    share: WhiteboardShare | null
}

/** Whether, and how, a board can be opened by someone without an account. */
export type WhiteboardShare = {
    enabled: boolean
    /** The secret in the link. Empty until the board is first shared. */
    token: string
    /** Whether the link also asks for a password. */
    passwordProtected: boolean
}

/**
 * A change to a board's sharing, as the owner sends it.
 *
 * `password` is three-way on purpose: a string sets it, `null` removes it,
 * and leaving it out keeps whatever is there — so turning a link off and on
 * again does not silently drop its password.
 */
export type WhiteboardShareInput = {
    enabled: boolean
    password?: string | null
    /** Replace the link, so every copy of the old one stops working. */
    newLink?: boolean
}

/** What a public viewer is given: the drawing and nothing about who made it. */
export type PublicWhiteboard = {
    name: string
    scene: string
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

/* ------------------------------ public links ----------------------------- */

/**
 * The UI page a public link opens, and the query parameter carrying its token.
 * The page is listed in `sys_public`, so it renders without a session.
 */
export const WHITEBOARD_SHARE_PAGE = 'x_1040823_ddg_now_whiteboard_share.do'
export const WHITEBOARD_SHARE_PARAM = 'token'

/**
 * Length of a share token. Each character is one of 62, drawn by the
 * platform's secure generator, so 40 of them is about 238 bits: the link is the secret, and it has to be
 * one nobody can guess or enumerate.
 */
export const SHARE_TOKEN_LENGTH = 40

export const MIN_SHARE_PASSWORD_LENGTH = 6
export const MAX_SHARE_PASSWORD_LENGTH = 128

/** The full link for a token, on whichever instance the caller is looking at. */
export function whiteboardShareUrl(origin: string, token: string): string {
    return `${origin.replace(/\/+$/, '')}/${WHITEBOARD_SHARE_PAGE}?${WHITEBOARD_SHARE_PARAM}=${encodeURIComponent(token)}`
}

/**
 * Whether a string could be a token at all.
 *
 * Checked before the privileged lookup runs, so the only query an anonymous
 * caller can cause is an exact match on a well-formed value.
 */
export function isShareToken(value: unknown): value is string {
    return typeof value === 'string' && new RegExp(`^[A-Za-z0-9]{${SHARE_TOKEN_LENGTH}}$`).test(value)
}

/** Why a password cannot be set, or null when it can. */
export function validateSharePassword(password: string): string | null {
    if (password.length < MIN_SHARE_PASSWORD_LENGTH) {
        return `A share password must be at least ${MIN_SHARE_PASSWORD_LENGTH} characters.`
    }
    if (password.length > MAX_SHARE_PASSWORD_LENGTH) {
        return `A share password must be ${MAX_SHARE_PASSWORD_LENGTH} characters or fewer.`
    }
    return null
}

/**
 * Rounds of SHA-256 a share password goes through. The hash is never readable
 * through an ACL, so this is a second line rather than the first: it makes a
 * copied column slow to brute-force without making each viewer's request slow.
 */
export const SHARE_PASSWORD_ROUNDS = 1000

/**
 * A stored share password: `sha256:<rounds>:<salt>:<hex>`.
 *
 * The digest is passed in rather than imported, which is what keeps this file
 * Glide-free — the record layer hands over `GlideDigest`, and the tests hand
 * over Node's.
 */
export function hashSharePassword(
    password: string,
    salt: string,
    digest: (text: string) => string,
    rounds = SHARE_PASSWORD_ROUNDS,
): string {
    let hash = digest(`${salt}:${password}`)
    for (let round = 1; round < rounds; round++) hash = digest(`${salt}:${hash}`)
    return `sha256:${rounds}:${salt}:${hash.toLowerCase()}`
}

/** Whether `password` is the one `stored` was made from. */
export function verifySharePassword(password: string, stored: string, digest: (text: string) => string): boolean {
    const [scheme, rounds, salt, hash] = stored.split(':')
    const count = Number(rounds)
    if (scheme !== 'sha256' || !salt || !hash || !Number.isInteger(count) || count < 1) return false
    return constantTimeEqual(hashSharePassword(password, salt, digest, count), stored)
}

/** String equality that takes as long for a near miss as for a far one. */
export function constantTimeEqual(a: string, b: string): boolean {
    let difference = a.length ^ b.length
    for (let index = 0; index < Math.max(a.length, b.length); index++) {
        difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0)
    }
    return difference === 0
}

/** A shared board as the privileged lookup returns it, hash included. */
export type SharedWhiteboardRecord = PublicWhiteboard & { token: string; passwordHash: string }

export type PublicWhiteboardResult =
    | { status: 'ok'; board: PublicWhiteboard }
    | { status: 'not-found' }
    | { status: 'password-required' }
    | { status: 'wrong-password' }

/**
 * Decides what an anonymous caller holding `token` may see.
 *
 * A malformed token never reaches the lookup, and a board that is not shared
 * is indistinguishable from one that does not exist. The password is only
 * compared, in constant time, against a salted hash. What comes back is the
 * name, the drawing and when it changed — never the hash or who made it.
 */
export function resolvePublicWhiteboard(
    token: unknown,
    password: unknown,
    lookup: (token: string) => SharedWhiteboardRecord | null,
    digest: (text: string) => string,
): PublicWhiteboardResult {
    if (!isShareToken(token)) return { status: 'not-found' }
    const record = lookup(token)
    // Compared again here because the database's own match may ignore case.
    if (!record || !constantTimeEqual(record.token, token)) return { status: 'not-found' }

    if (record.passwordHash) {
        if (typeof password !== 'string' || !password) return { status: 'password-required' }
        if (!verifySharePassword(password, record.passwordHash, digest)) return { status: 'wrong-password' }
    }
    return {
        status: 'ok',
        board: { name: record.name, scene: record.scene || EMPTY_WHITEBOARD_SCENE, updatedAt: record.updatedAt },
    }
}
