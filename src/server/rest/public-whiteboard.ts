/**
 * The one route anybody may call: a whiteboard opened by its public link.
 *
 *   POST /public/whiteboard/{token}   { "password"?: string }
 *
 * It is POST so a password travels in the body rather than in a URL that ends
 * up in logs and browser history. A board without a password needs no body.
 *
 * This is the only place in the application that reads a record without the
 * caller's ACLs, because an anonymous caller has none that could allow it.
 * The read itself is not here: it is the `DdgPublicWhiteboard` Script Include's
 * `_lookup`, a single exact-match query on a shared board's token, handed in
 * as `lookup`. What this file decides is what that read may reveal — the name,
 * the drawing and when it last changed, and nothing about who made it.
 *
 * It is reached through the Script Include rather than named on the route
 * directly for that reason: the privilege lives in one named, reviewable
 * place, and this module stays as unprivileged as every other.
 */

import { openPublicWhiteboard, type SharedWhiteboardRecord } from '../db/whiteboards.ts'
import { fail, guarded, json, readBody, type RestRequest, type RestResponse } from './http.ts'

export function servePublicWhiteboard(
    request: RestRequest,
    response: RestResponse,
    lookup: (token: string) => SharedWhiteboardRecord | null,
): void {
    guarded('public-whiteboard', response, () => {
        // A shared board can change at any moment, and a protected one must
        // not be served to the next person on the same proxy.
        response.setHeader('Cache-Control', 'no-store')

        const result = openPublicWhiteboard(request.pathParams?.token, readBody(request).password, lookup)
        switch (result.status) {
            case 'ok':
                return json(response, 200, result.board)
            case 'password-required':
                return json(response, 401, { error: 'This whiteboard needs a password.', passwordRequired: true })
            case 'wrong-password':
                return json(response, 401, { error: 'That password is not right.', passwordRequired: true })
            default:
                return fail(response, 404, 'This link does not open a whiteboard. It may have been turned off.')
        }
    })
}
