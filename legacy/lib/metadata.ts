/**
 * Configuration metadata: free-form key/value pairs stored beside a schema.
 *
 * What a schema is *for* rarely fits in its name — which team owns it, the
 * ticket it was written for, the environment it seeds, the table it lands in.
 * These pairs carry that, travel with the configuration through export and
 * import, and reach a script template as `${CONFIG_METADATA}`.
 *
 * Values are text. Anything richer belongs in the schema itself, and keeping
 * them flat is what lets a script read `metadata.team` without checking shapes.
 *
 * Pair *order* is not preserved: these are stored in a PocketBase json column,
 * which hands its keys back sorted. A saved configuration therefore reads its
 * metadata alphabetically, whatever order it was typed in.
 */

/** What a configuration stores: an ordered set of named strings. */
export type Metadata = Record<string, string>;

/** One row in the editor, where a half-typed key is still a valid state. */
export type MetadataPair = { key: string; value: string };

export const METADATA_LIMITS = {
  /** Beyond this it is a database, not a label. */
  pairs: 50,
  key: 64,
  value: 512,
} as const;

export type ParseMetadataResult = { ok: true; metadata: Metadata } | { ok: false; error: string };

/**
 * Validates and normalizes whatever a caller sent as metadata.
 *
 * Strict rather than forgiving: metadata is written by hand, and a value that
 * was silently dropped for being the wrong shape is worse than one that says
 * why it was refused. Missing and null both mean "none", so a caller that
 * knows nothing about metadata can leave it out.
 */
export function parseMetadata(raw: unknown): ParseMetadataResult {
  if (raw === undefined || raw === null) return { ok: true, metadata: {} };

  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: '"metadata" must be an object of key/value pairs.' };
  }

  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length > METADATA_LIMITS.pairs) {
    return {
      ok: false,
      error: `A configuration may carry ${METADATA_LIMITS.pairs} metadata pairs; this one has ${entries.length}.`,
    };
  }

  const metadata: Metadata = {};
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.trim();
    if (!key) return { ok: false, error: "A metadata key cannot be blank." };
    if (key.length > METADATA_LIMITS.key) {
      return { ok: false, error: `The metadata key "${key.slice(0, 20)}…" is longer than ${METADATA_LIMITS.key} characters.` };
    }

    // A number or a boolean is what a hand-written JSON body tends to carry,
    // and reading it back as text is what the caller meant either way.
    if (typeof rawValue === "object" && rawValue !== null) {
      return { ok: false, error: `The metadata value for "${key}" must be text, not an object or an array.` };
    }
    const value = rawValue === undefined || rawValue === null ? "" : String(rawValue);
    if (value.length > METADATA_LIMITS.value) {
      return { ok: false, error: `The metadata value for "${key}" is longer than ${METADATA_LIMITS.value} characters.` };
    }

    metadata[key] = value;
  }

  return { ok: true, metadata };
}

/**
 * Whatever is in a stored row, as metadata.
 *
 * Lenient where `parseMetadata` is strict, and for the opposite reason: this
 * reads back what this app itself wrote, where the only surprise worth
 * handling is a configuration saved before metadata existed. A row that
 * somehow holds something else reads as none rather than failing the request.
 */
export function readMetadata(raw: unknown): Metadata {
  const parsed = parseMetadata(raw);
  return parsed.ok ? parsed.metadata : {};
}

/** The stored object as editor rows, in whatever order it came back in. */
export function toPairs(metadata: Metadata | undefined): MetadataPair[] {
  return Object.entries(metadata ?? {}).map(([key, value]) => ({ key, value }));
}

/**
 * Editor rows back as the stored object.
 *
 * A blank key is a row someone is still typing, so it is dropped rather than
 * saved; where a key repeats, the last one wins, which is what an object
 * literal would have done anyway.
 */
export function fromPairs(pairs: MetadataPair[]): Metadata {
  const metadata: Metadata = {};
  for (const { key, value } of pairs) {
    const trimmed = key.trim();
    if (trimmed) metadata[trimmed] = value;
  }
  return metadata;
}

/** Whether two sets carry the same pairs — what "unsaved changes" would ask. */
export const sameMetadata = (a: Metadata, b: Metadata): boolean =>
  JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
