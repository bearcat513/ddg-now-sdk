/**
 * Where a dynamic enum gets its choices.
 *
 * This replaces `src/server/script.ts`, which ran a user-authored async
 * function body inside a `node:vm` context with `fetch` in scope. On the
 * platform both halves are gone: there is no `vm`, no `fetch`, and
 * `new Function()` is disallowed outright. There is no port of that feature,
 * only a replacement — and the replacement is the better design regardless of
 * what the runtime allows. The original file's own comment conceded its
 * sandbox "is a guard against mistakes, not against malice"; on a system of
 * record a snippet would have run with the application's own privileges.
 *
 * Three sources, in order of preference:
 *
 *   1. `scriptInclude` — a Script Include named in the field options, whose
 *      `getChoices()` returns the pool. Authoring one requires the role to
 *      create a Script Include, which is exactly the boundary the sandbox was
 *      trying to draw.
 *   2. `table` — a GlideRecord read with an encoded query. On-instance this is
 *      a local read rather than the HTTP round trip the snippets were making.
 *   3. `rest` — a REST Message record, for choices that genuinely live in a
 *      third-party system. That path brings credential storage, logging and
 *      MID server routing with it.
 *
 * Reads run with the caller's own session. Nothing here elevates.
 *
 * One structural note on (1): a *module* cannot instantiate a Script Include
 * by name. `new x_scope.Thing()` resolves only in Script Include execution
 * context and throws in a module, and there is no Glide API that takes a name
 * and hands back an instance. So by-name resolution is injected — the
 * `DdgGenerator` bridge runs in Script Include context and passes a
 * `callScriptInclude` in. A caller that has no bridge gets a clear error for
 * that one source rather than a silent empty pool.
 */

import { GlideRecordSecure, gs } from '@servicenow/glide'
import { RESTMessageV2 } from '@servicenow/glide/sn_ws'
import type { Field, FieldOptions } from '../lib/types.ts'

/** Resolves a Script Include by name and calls `getChoices()` on it. */
export type ScriptIncludeCaller = (name: string) => unknown

export type ChoiceSourceOptions = {
    /** Cap on values taken from any one source. */
    limit?: number
    /** Supplied by the Script Include bridge; see the note above. */
    callScriptInclude?: ScriptIncludeCaller
}

export type ChoiceResult = { ok: true; values: string[] } | { ok: false; error: string }

/** Past this a "choice list" is a dataset, and the row loop pays for it. */
const DEFAULT_LIMIT = 1000

/** A unique key per distinct source, so one source is read once per run. */
export function choiceSourceKey(opts: FieldOptions): string {
    switch (opts.valuesFrom) {
        case 'scriptInclude':
            return `si:${opts.scriptInclude ?? ''}`
        case 'table':
            return `tb:${opts.choiceTable ?? ''}|${opts.choiceQuery ?? ''}|${opts.choiceField ?? ''}`
        case 'rest':
            return `rs:${opts.restMessage ?? ''}|${opts.restMethod ?? ''}`
        default:
            return 'list'
    }
}

/** Anything a source hands back is coerced to a list of non-empty strings. */
function normalize(raw: unknown, limit: number): string[] {
    if (raw === null || raw === undefined) return []
    const items = Array.isArray(raw) ? raw : [raw]
    const seen = new Set<string>()
    const out: string[] = []
    for (const item of items) {
        if (item === null || item === undefined) continue
        const text = typeof item === 'object' ? JSON.stringify(item) : String(item)
        if (!text || seen.has(text)) continue
        seen.add(text)
        out.push(text)
        if (out.length >= limit) break
    }
    return out
}

function fromScriptInclude(name: string, limit: number, call?: ScriptIncludeCaller): ChoiceResult {
    const clean = name.trim()
    if (!clean) return { ok: false, error: 'No script include named.' }
    if (!call) {
        return {
            ok: false,
            error: `Choices from script include "${clean}" need the DdgGenerator bridge — a module cannot resolve a script include by name.`,
        }
    }
    try {
        return { ok: true, values: normalize(call(clean), limit) }
    } catch (error) {
        return { ok: false, error: `Script include "${clean}" failed: ${(error as Error).message}` }
    }
}

function fromTable(opts: FieldOptions, limit: number): ChoiceResult {
    const table = (opts.choiceTable ?? '').trim()
    const field = (opts.choiceField ?? '').trim()
    if (!table) return { ok: false, error: 'No table named for the choice source.' }
    if (!field) return { ok: false, error: 'No field named for the choice source.' }

    try {
        // Secure so the pool can never contain rows the caller cannot read —
        // a choice list is data, and an enum should not become a read channel.
        const gr = new GlideRecordSecure(table)
        if (!gr.isValid()) return { ok: false, error: `No such table "${table}".` }
        if (!gr.isValidField(field)) return { ok: false, error: `No column "${field}" on ${table}.` }

        const query = (opts.choiceQuery ?? '').trim()
        if (query) gr.addEncodedQuery(query)
        gr.setLimit(limit)
        gr.query()

        const values: string[] = []
        while (gr.next()) {
            const value = gr.getValue(field)
            if (value) values.push(value)
        }
        return { ok: true, values: normalize(values, limit) }
    } catch (error) {
        return { ok: false, error: `Reading ${table}.${field} failed: ${(error as Error).message}` }
    }
}

function fromRestMessage(opts: FieldOptions, limit: number): ChoiceResult {
    const message = (opts.restMessage ?? '').trim()
    const method = (opts.restMethod ?? '').trim()
    if (!message || !method) return { ok: false, error: 'A REST source needs both a message and a method name.' }

    try {
        // The published constructor overload takes (name, methodName); the
        // shipped type definition only models the internal Rhino signature,
        // so the cast is to the documented API rather than around a check.
        const Ctor = RESTMessageV2 as unknown as new (name: string, methodName: string) => RESTMessageV2
        const request = new Ctor(message, method)
        const response = request.execute()
        const status = Number(response.getStatusCode())
        if (status < 200 || status >= 300) {
            return { ok: false, error: `REST message "${message}" returned ${status}.` }
        }
        const parsed = JSON.parse(response.getBody())
        // A bare array, or the common `{ values }` / `{ result }` / `{ items }`.
        const list = Array.isArray(parsed) ? parsed : (parsed?.values ?? parsed?.result ?? parsed?.items ?? [])
        return { ok: true, values: normalize(list, limit) }
    } catch (error) {
        return { ok: false, error: `REST message "${message}" failed: ${(error as Error).message}` }
    }
}

/**
 * Resolves one field's choice source.
 *
 * Synchronous, unlike the `node:vm` version it replaces — every source here is
 * either a local read or a blocking outbound call, so there is nothing to
 * await and `generateRows()` stays synchronous without any concurrency trick.
 */
export function resolveChoiceSource(opts: FieldOptions, options?: ChoiceSourceOptions): ChoiceResult {
    const limit = Math.max(1, Math.min(options?.limit ?? DEFAULT_LIMIT, DEFAULT_LIMIT))
    switch (opts.valuesFrom) {
        case 'scriptInclude':
            return fromScriptInclude(opts.scriptInclude ?? '', limit, options?.callScriptInclude)
        case 'table':
            return fromTable(opts, limit)
        case 'rest':
            return fromRestMessage(opts, limit)
        default:
            return { ok: true, values: opts.values?.filter(Boolean) ?? [] }
    }
}

/** Logs what a run resolved, so a surprising pool is traceable afterwards. */
export function logResolved(field: Field, values: string[]): void {
    gs.info(`[ddg] enum "${field.name}" resolved ${values.length} choices from ${field.options?.valuesFrom}`)
}
