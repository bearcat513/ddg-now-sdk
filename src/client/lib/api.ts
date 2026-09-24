/**
 * The only file in the client that knows a URL.
 *
 * This is the Bun application's `lib/api.ts` convention kept intact: one typed
 * object, one place that attaches the credential, one place that turns an
 * `{ error }` body into a thrown `Error`. A component that calls `fetch`
 * directly is a bug — which matters more here than it did there, because these
 * endpoints are also the app's public API and a component reaching past this
 * file would be a second, undocumented client for them.
 *
 * What changed in the port is the credential and the list of routes. The Bun
 * version sent `credentials: "include"` and PocketBase's collection rules
 * decided what came back; here every request carries `X-UserToken:
 * window.g_ck`, the session token the UI Page is already running under, and
 * ACLs decide instead. Either way the browser grants nothing: the server is
 * answering as whoever is asking.
 *
 * The routes that served auth, sessions, API keys, sharing, notes, script
 * templates and Telegram are gone because those features did not come across.
 * What is left is schemas, runs and rows.
 */

import type { Dataset, Field, SchemaConfig } from '../../server/lib/types'
import type { Preferences } from '../../server/lib/preferences'

export const API_BASE = '/api/x_1040823_ddg_now/ddg'

declare global {
    interface Window {
        g_ck?: string
    }
}

/* ------------------------------- transport ------------------------------- */

/**
 * Strips the platform's envelope.
 *
 * A Scripted REST API wraps whatever `response.setBody()` was handed in a
 * `result` property, so a handler that answers `{ configs }` arrives here as
 * `{ result: { configs } }`. The handlers are written as though the envelope
 * were not there — it is the platform's, not the app's — and this is the one
 * place that knows about it. The export route sidesteps it by writing to the
 * stream directly, which is the whole reason `fetchText` exists alongside
 * this.
 *
 * Nothing the endpoints send has a `result` key of its own, so testing for
 * one is unambiguous. A failure the platform raised before a handler ran is
 * not enveloped, which is why the property is checked rather than assumed.
 */
function unwrap(payload: unknown): unknown {
    if (payload !== null && typeof payload === 'object' && 'result' in payload) {
        return (payload as { result: unknown }).result
    }
    return payload
}

/**
 * The message to show for a failed request, from either shape of error body.
 *
 * The handlers answer `{ error: 'a sentence' }`, enveloped like any other
 * body. A refusal the platform itself produced — an ACL saying no, a module
 * that would not load — answers `{ error: { message, detail }, status:
 * 'failure' }` and is not enveloped. Reading only the first shape turns the
 * second into the string `[object Object]`, so both are read.
 */
function errorMessage(payload: unknown): string | undefined {
    const body = unwrap(payload)
    const error = (body as { error?: unknown } | null)?.error

    if (typeof error === 'string') return error || undefined
    if (error !== null && typeof error === 'object') {
        const { message, detail } = error as { message?: string; detail?: string }
        return [message, detail].filter(Boolean).join(' — ') || undefined
    }
    return undefined
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-UserToken': window.g_ck ?? '',
            ...init.headers,
        },
    })

    // The endpoints answer with `{ error }` on every failure, so the message
    // shown to the user is the one the server actually wrote rather than a
    // sentence the UI invented for a status code.
    const text = await response.text()
    let payload: unknown = null
    try {
        payload = text ? JSON.parse(text) : null
    } catch {
        throw new Error(`The server returned something that is not JSON (${response.status}).`)
    }

    if (!response.ok) {
        throw new Error(errorMessage(payload) || `Request failed with ${response.status}.`)
    }
    return unwrap(payload) as T
}

const body = (value: unknown): RequestInit => ({ body: JSON.stringify(value) })

/**
 * Text from an endpoint that serves a file rather than JSON.
 *
 * The export route streams an attachment, so it cannot go through `request` —
 * but a failure from it still arrives as a JSON `{ error }`, which is why this
 * reads the body before deciding what happened rather than after.
 */
async function fetchText(url: string, what: string): Promise<string> {
    const response = await fetch(url, { headers: { 'X-UserToken': window.g_ck ?? '' } })
    const text = await response.text()
    if (response.ok) return text

    try {
        const message = errorMessage(JSON.parse(text))
        if (message) throw new Error(message)
    } catch (error) {
        if (error instanceof Error && error.message) throw error
    }
    throw new Error(`${what} could not be read (${response.status}).`)
}

/* --------------------------------- types --------------------------------- */

export type InferResult = {
    detected: 'json' | 'typescript' | 'sql'
    notes: string[]
    fields: Field[]
}

/**
 * A configuration as the navigation list sees it.
 *
 * `fields` is empty — the list does not load schemas — but the field *names*
 * come with it so the nav's search box can match on a column without fetching
 * every configuration in full. The server caps that list; see `navSearch.ts`.
 */
export type ConfigSummary = SchemaConfig & { fieldCount: number; fieldNames: string[] }

export type RowWindow = {
    rows: Record<string, unknown>[]
    columns: string[]
    /** True when `rows` is only the first page of what the dataset holds. */
    truncated: boolean
    total: number
}

export type GenerateResult = {
    datasetId: string
    rowCount: number
    state: 'complete' | 'queued'
}

/**
 * JSON is the stored form for anything this UI generates.
 *
 * It is the only format the rows can be read back out of — CSV and SQL are
 * lossy about types — and the export endpoint re-serialises JSON into either
 * of them on demand, so storing the richer form costs nothing and buys the
 * preview table.
 */
export const STORED_FORMAT = 'json'

export type ExportFormat = 'csv' | 'json' | 'sql'

/* ------------------------------- the client ------------------------------ */

export const api = {
    /* ------------------------------ inference ----------------------------- */

    /** Paste a structure, get a field list. Stores nothing. */
    infer: (input: string) => request<InferResult>('/infer', { method: 'POST', ...body({ input }) }),

    /**
     * Rows from the schema on screen, before it has been saved.
     *
     * This is what the editor's Preview button calls. The stored-configuration
     * equivalent is `preview` below; both store nothing, and this one also
     * needs no record — which is the state a schema is in for most of the time
     * anyone is working on it.
     */
    previewInline: (schema: { fields: Field[]; rowCount?: number; seed?: string; locale?: string }) =>
        request<{ rows: Record<string, unknown>[] }>('/preview', { method: 'POST', ...body(schema) }),

    /* --------------------------- configurations --------------------------- */

    listConfigs: () => request<{ configs: ConfigSummary[] }>('/config').then((result) => result.configs),

    getConfig: (id: string) => request<SchemaConfig>(`/config/${encodeURIComponent(id)}`),

    createConfig: (config: {
        name: string
        description?: string
        rowCount?: number
        seed?: string
        locale?: string
        fields: Field[]
    }) => request<{ configId: string; fieldCount: number }>('/config', { method: 'POST', ...body(config) }),

    /** Saves the editor's whole state. Omit `fields` to change only settings. */
    updateConfig: (
        id: string,
        config: {
            name?: string
            description?: string
            rowCount?: number
            seed?: string
            locale?: string
            fields?: Field[]
        },
    ) =>
        request<{ config: SchemaConfig; fieldCount?: number }>(`/config/${encodeURIComponent(id)}`, {
            method: 'PUT',
            ...body(config),
        }),

    deleteConfig: (id: string) =>
        request<{ ok: true }>(`/config/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    /* ------------------------------ generation ---------------------------- */

    /** A handful of rows, stored nowhere — the "what would this give me" button. */
    preview: (configId: string, rowCount: number) =>
        request<{ rows: Record<string, unknown>[] }>(`/config/${encodeURIComponent(configId)}/generate`, {
            method: 'POST',
            ...body({ preview: true, rowCount }),
        }),

    /** A real run. Answers with a dataset that is either complete or queued. */
    generate: (configId: string, rowCount?: number) =>
        request<GenerateResult>(`/config/${encodeURIComponent(configId)}/generate`, {
            method: 'POST',
            ...body({ rowCount, format: STORED_FORMAT }),
        }),

    /** A run that writes into a real ServiceNow table instead of a dataset. */
    generateIntoTable: (
        configId: string,
        table: string,
        options: { rowCount?: number; mapping?: Record<string, string>; skipBusinessRules?: boolean } = {},
    ) =>
        request<{ table: string; inserted: number; attempted: number; errors: string[] }>(
            `/config/${encodeURIComponent(configId)}/generate`,
            { method: 'POST', ...body({ table, ...options }) },
        ),

    /* ------------------------------- datasets ----------------------------- */

    listDatasets: (configId?: string) =>
        request<{ datasets: Dataset[] }>(
            configId ? `/dataset?config=${encodeURIComponent(configId)}` : '/dataset',
        ).then((result) => result.datasets),

    getDataset: (id: string) => request<Dataset>(`/dataset/${encodeURIComponent(id)}`),

    deleteDataset: (id: string) =>
        request<{ ok: true }>(`/dataset/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    /** A page of a stored run's rows, for the preview table. */
    datasetRows: (id: string, limit?: number) =>
        request<RowWindow>(
            `/dataset/${encodeURIComponent(id)}/rows${limit === undefined ? '' : `?limit=${limit}`}`,
        ),

    /**
     * Just the column names of a stored run — what the reference picker offers
     * as the pool to draw from. One row is enough to learn them, and the
     * endpoint reports the columns of the whole dataset regardless of the
     * window it returns.
     */
    datasetColumns: (id: string) => api.datasetRows(id, 1).then((result) => ({ columns: result.columns })),

    /* -------------------------------- export ------------------------------ */

    /** Where the rows of a finished dataset can be downloaded from. */
    exportUrl: (id: string, format: ExportFormat) =>
        `${API_BASE}/dataset/${encodeURIComponent(id)}/export?format=${format}`,

    /** The same file as text, for the copy buttons. */
    exportText: (id: string, format: ExportFormat) =>
        fetchText(api.exportUrl(id, format), `The ${format.toUpperCase()} export`),

    /* ----------------------------- preferences ---------------------------- */

    /**
     * Whatever this account prefers, or the defaults if it has never said.
     *
     * Neither of these takes a user. The row is always the caller's, decided by
     * the session on the server — so there is no argument here that could ask
     * for somebody else's, which is the point.
     */
    getPreferences: () =>
        request<{ preferences: Preferences }>('/preferences').then((result) => result.preferences),

    /**
     * Changes some preferences and answers with the stored set.
     *
     * A patch, not a replacement: the server merges it over what is there. The
     * reply is the set after clamping, so a caller that asked for 50,000
     * preview rows is told it got 1,000 rather than being left believing the
     * larger number.
     */
    savePreferences: (patch: Partial<Preferences>) =>
        request<{ preferences: Preferences }>('/preferences', { method: 'PUT', ...body(patch) }).then(
            (result) => result.preferences,
        ),
}
