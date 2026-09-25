/**
 * What the Script Include bridges call.
 *
 * The module-plus-Script-Include pairing is the platform's normal shape:
 * business logic lives here as ES modules with typed Glide imports, and
 * anything that has to be callable *by name* — from a UI Action, GlideAjax,
 * another scope, a scheduled job — gets a thin `Class.create` Script Include
 * that does nothing but `require()` this and delegate.
 *
 * Everything here returns plain JSON-serialisable values, because a GlideAjax
 * caller can only receive a string and a cross-scope caller should not be
 * handed a live object.
 */

import { inferSchema } from './infer/infer.ts'
import { getConfig, listConfigs, listDatasets, maxRows, replaceFields, createConfig } from './db/db.ts'
import { previewRows, runToDataset, runToTable } from './run.ts'
import type { ScriptIncludeCaller } from './generate/choices.ts'
import type { Field } from './lib/types.ts'

/** Paste a structure, get a field list. */
export function infer(input: string): { detected: string; notes: string[]; fields: Field[] } {
    const result = inferSchema(input ?? '')
    return { detected: result.detected, notes: result.notes, fields: result.fields }
}

/** Infer a structure and store it as a new configuration in one step. */
export function inferInto(name: string, input: string): { ok: boolean; configId?: string; error?: string } {
    const result = inferSchema(input ?? '')
    if (!result.fields.length) return { ok: false, error: 'Nothing recognisable in that input.' }
    const configId = createConfig({ name }, result.fields)
    if (!configId) return { ok: false, error: 'Could not create the configuration — check your create access.' }
    return { ok: true, configId }
}

/** Replace a configuration's fields from an inferred list. */
export function applyFields(configId: string, fields: Field[]): number {
    return replaceFields(configId, fields ?? [])
}

export function config(configId: string) {
    return getConfig(configId)
}

export function configs(limit?: number) {
    return listConfigs(limit)
}

export function datasets(configId?: string) {
    return listDatasets(configId)
}

export function preview(configId: string, rowCount: number, callScriptInclude?: ScriptIncludeCaller) {
    return previewRows(configId, rowCount, { callScriptInclude })
}

/**
 * Runs a generation into the dataset store.
 *
 * `callScriptInclude` is passed down from the bridge because a module cannot
 * resolve a Script Include by name — see the note at the top of
 * `generate/choices.ts`. Every other choice source works without it.
 */
export function generate(configId: string, rowCount?: number, callScriptInclude?: ScriptIncludeCaller) {
    return runToDataset(configId, { rowCount, callScriptInclude })
}

/** Runs a generation straight into a real table. Role-gated by its caller. */
export function generateIntoTable(
    configId: string,
    table: string,
    rowCount?: number,
    mapping?: Record<string, string>,
    callScriptInclude?: ScriptIncludeCaller,
) {
    return runToTable(configId, table, { rowCount, mapping, callScriptInclude })
}

/** The configured row ceiling, so a caller can report it before running. */
export function limits(): { maxRows: number } {
    return { maxRows: maxRows() }
}
