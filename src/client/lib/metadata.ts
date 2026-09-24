/**
 * Configuration metadata: free-form key/value pairs stored beside a schema.
 *
 * What a schema is *for* rarely fits in its name — which team owns it, the
 * ticket it was written for, the environment it seeds, the table it lands in.
 * These pairs carry that and travel with the configuration through export and
 * import.
 *
 * This is the editor's half of the Bun app's `lib/metadata.ts`. The validating
 * half stayed on the server: `parseMetadata` guarded an endpoint, and a copy
 * running in the browser would be a second rule that could disagree with the
 * one that counts.
 *
 * Pair *order* is not preserved — the values live in a JSON column and come
 * back with their keys sorted — so a saved configuration reads its metadata
 * alphabetically, whatever order it was typed in.
 */

/** What a configuration stores: a set of named strings. */
export type Metadata = Record<string, string>

/** One row in the editor, where a half-typed key is still a valid state. */
export type MetadataPair = { key: string; value: string }

export const METADATA_LIMITS = {
    /** Beyond this it is a database, not a label. */
    pairs: 50,
    key: 64,
    value: 512,
} as const

/** The stored object as editor rows, in whatever order it came back in. */
export function toPairs(metadata: Metadata | undefined): MetadataPair[] {
    return Object.entries(metadata ?? {}).map(([key, value]) => ({ key, value }))
}

/**
 * Editor rows back as the stored object.
 *
 * A blank key is a row someone is still typing, so it is dropped rather than
 * saved; where a key repeats, the last one wins, which is what an object
 * literal would have done anyway.
 */
export function fromPairs(pairs: MetadataPair[]): Metadata {
    const metadata: Metadata = {}
    for (const { key, value } of pairs) {
        const trimmed = key.trim()
        if (trimmed) metadata[trimmed] = value
    }
    return metadata
}
