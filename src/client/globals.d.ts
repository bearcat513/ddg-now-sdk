/**
 * The platform globals a UI Page is given.
 *
 * `<sdk:now-ux-globals>` in `index.html` puts these on `window` before the
 * bundle runs: `g_ck` is the session token every request to a scoped REST
 * endpoint has to carry, and `NOW` holds what the server knew about the
 * session at render time.
 *
 * Typed loosely and read defensively on purpose. This is a blob the platform
 * renders into the page rather than an API with a contract, and the app uses
 * exactly one field of it — who is signed in, for the nav's footer. Anything
 * that mattered more than a display name would go through a request.
 */

declare global {
    interface Window {
        g_ck?: string
        NOW?: {
            user?: {
                displayName?: string
                userName?: string
                sysId?: string
            }
        }
    }
}

export {}
