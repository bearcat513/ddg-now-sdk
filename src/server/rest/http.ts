/**
 * Small helpers shared by the scripted REST handlers.
 *
 * `src/index.ts` had 36 routes, most of which existed to serve the React SPA.
 * On a platform where lists and forms come free, those have no audience: the
 * subset worth an endpoint is the one a CI pipeline or a developer's script
 * would call. What is left needs a consistent way to read a JSON body, answer
 * with a status code, and turn a thrown error into a response — which is all
 * this file is.
 */

import { gs } from '@servicenow/glide'

/** The parts of `RESTAPIRequest` the handlers use. */
export type RestRequest = {
    body?: { dataString?: string; data?: unknown }
    pathParams: Record<string, string>
    queryParams: Record<string, string[] | string>
}

/** The parts of `RESTAPIResponse` the handlers use. */
export type RestResponse = {
    setStatus(status: number): void
    setBody(body: unknown): void
    setHeader(name: string, value: string): void
    setContentType(type: string): void
    getStreamWriter(): { writeString(text: string): void }
}

export function json(response: RestResponse, status: number, body: unknown): void {
    response.setStatus(status)
    response.setBody(body)
}

export function fail(response: RestResponse, status: number, error: string): void {
    json(response, status, { error })
}

/** The request body as an object, whichever shape the platform handed over. */
export function readBody(request: RestRequest): Record<string, unknown> {
    const data = request.body?.data
    if (data && typeof data === 'object') return data as Record<string, unknown>
    const raw = request.body?.dataString
    if (!raw) return {}
    try {
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
    } catch {
        return {}
    }
}

/** A single query parameter, whether the platform gave a string or a list. */
export function param(request: RestRequest, name: string): string | undefined {
    const value = request.queryParams?.[name]
    if (Array.isArray(value)) return value[0]
    return value === undefined ? undefined : String(value)
}

/**
 * Runs a handler body so a thrown error becomes a 500 with a message rather
 * than the platform's generic failure. Every route goes through this.
 *
 * It takes the body and calls it rather than returning a wrapped function,
 * because the Fluent build resolves a route's `script:` to a named function
 * declaration — a handler that was the *result* of a call would not resolve.
 */
export function guarded(name: string, response: RestResponse, body: () => void): void {
    try {
        body()
    } catch (error) {
        const message = (error as Error).message ?? String(error)
        gs.error(`[ddg] ${name} failed: ${message}`)
        fail(response, 500, message)
    }
}
