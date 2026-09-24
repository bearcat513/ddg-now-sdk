/**
 * The portable configuration file: one JSON document per schema, carrying
 * every field, type and option needed to reproduce it elsewhere.
 *
 * Same document as the Bun app's — `kind`, `version`, and a field list with
 * the internal row ids stripped so the files stay stable and diffable in
 * version control. A file exported from either build opens in the other.
 *
 * Two things did not come across. `mappings` is written as an empty array
 * rather than dropped, because a file without the key is a version-2 file and
 * this is still a version-3 document; the editor has no mappings panel here,
 * so there is nothing to put in it. And the Bun version's 250-line validator
 * stayed on the server: the import path posts to `POST /config`, which checks
 * every field type against `FIELD_TYPE_SET` before writing anything. Running a
 * copy of those rules in the browser would be a second rule that could
 * disagree with the one that counts, and it could only ever produce a nicer
 * error for a file that was going to be refused anyway.
 */

import type { Field, FieldMapping, Metadata } from '../../server/lib/types'

export const CONFIG_FILE_KIND = 'dummy-data-generator/config'
export const CONFIG_FILE_VERSION = 3

/** A field as it appears on disk — same shape as `Field`, minus the id. */
export type PortableField = Omit<Field, 'id'>

export type ConfigFile = {
    kind: typeof CONFIG_FILE_KIND
    version: number
    name: string
    description: string
    rowCount: number
    seed: string
    locale: string
    metadata: Metadata
    fields: PortableField[]
    mappings: FieldMapping[]
    exportedAt: string
}

export type ConfigFileInput = {
    name: string
    description?: string
    rowCount?: number
    seed?: string
    locale?: string
    metadata?: Metadata
    fields: Field[]
}

/* -------------------------------- export -------------------------------- */

/** Strips ids, recursively, so the file stays stable and diffable. */
export function toPortableField(field: Field): PortableField {
    const { id: _id, ...rest } = field
    const options = rest.options
    if (!options || !Object.keys(options).length) return { ...rest, options: undefined }
    const nested = options.fields?.length ? options.fields.map(toPortableField) : undefined
    return { ...rest, options: { ...options, ...(nested ? { fields: nested as unknown as Field[] } : {}) } }
}

export function buildConfigFile(config: ConfigFileInput): ConfigFile {
    return {
        kind: CONFIG_FILE_KIND,
        version: CONFIG_FILE_VERSION,
        name: config.name,
        description: config.description ?? '',
        rowCount: config.rowCount ?? 100,
        seed: config.seed ?? '',
        locale: config.locale ?? '',
        metadata: config.metadata ?? {},
        fields: config.fields.map(toPortableField),
        mappings: [],
        exportedAt: new Date().toISOString(),
    }
}

export function serializeConfigFile(config: ConfigFileInput): string {
    return JSON.stringify(buildConfigFile(config), null, 2)
}

/** "Employee records" -> "employee-records.ddg.json" */
export function configFileName(name: string): string {
    const slug =
        name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || 'configuration'
    return `${slug}.ddg.json`
}

/* -------------------------------- import -------------------------------- */

const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback)

/** Every field needs an id to be editable; a file deliberately has none. */
function withIds(fields: unknown[]): Field[] {
    return fields.map((raw) => {
        const field = { ...(raw as PortableField), id: crypto.randomUUID() } as Field
        const nested = field.options?.fields
        if (Array.isArray(nested) && nested.length) {
            field.options = { ...field.options, fields: withIds(nested) }
        }
        return field
    })
}

export type ParseConfigResult =
    | { ok: true; config: ConfigFileInput }
    | { ok: false; error: string }

/**
 * Reads a file into something `POST /config` will accept.
 *
 * It checks only what has to be true for the request to be worth sending —
 * that this is the right kind of document, from a version this build knows,
 * with a field array in it. Field types, option shapes and limits are the
 * server's to enforce, and its refusal is the one that matters.
 */
export function parseConfigFile(raw: unknown): ParseConfigResult {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { ok: false, error: 'Expected a configuration object at the top level of the file.' }
    }

    const file = raw as Record<string, unknown>

    if (file.kind !== undefined && file.kind !== CONFIG_FILE_KIND) {
        return { ok: false, error: `Not a ${CONFIG_FILE_KIND} file (found kind "${String(file.kind)}").` }
    }

    const version = Number(file.version ?? CONFIG_FILE_VERSION)
    if (Number.isFinite(version) && version > CONFIG_FILE_VERSION) {
        return {
            ok: false,
            error: `This file is version ${version}, but this app understands up to version ${CONFIG_FILE_VERSION}.`,
        }
    }

    if (!Array.isArray(file.fields)) return { ok: false, error: 'The file has no "fields" array.' }
    if (!file.fields.length) return { ok: false, error: 'The file has no fields in it.' }

    return {
        ok: true,
        config: {
            name: asString(file.name, 'Imported schema'),
            description: asString(file.description),
            rowCount: Number.isFinite(Number(file.rowCount)) ? Number(file.rowCount) : 100,
            seed: asString(file.seed),
            locale: asString(file.locale),
            metadata: (file.metadata as Metadata | undefined) ?? {},
            fields: withIds(file.fields),
        },
    }
}
