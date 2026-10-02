/**
 * DdgPublicWhiteboard — the one privileged read in the application.
 *
 * A whiteboard's public link is opened by people with no account, so no ACL
 * can let them read it: they have no roles to grant. Something has to read
 * the board without the caller's ACLs, and per the rest of this app that
 * something is a named Script Include rather than the module layer, so the
 * elevation is in one place a reviewer can find.
 *
 * It does exactly one thing elevated: `_lookup`, an exact-match query for a
 * board that is shared *and* carries the token. Everything else — refusing a
 * malformed token before the query runs, checking the password, choosing what
 * the response may contain — is `src/server/rest/public-whiteboard.ts`, which
 * gets `_lookup` handed in the way `DdgGenerator` hands down its choice caller.
 *
 * Only this scope can call it (`package_private`); the public REST route is
 * its one caller. Glide APIs are NOT imported here — they are automatically
 * available in Script Include context. The `require()` path is rewritten from
 * package.json on every build by `tools/sync-module-paths.mjs`.
 */
var DdgPublicWhiteboard = Class.create()

DdgPublicWhiteboard.prototype = {
    initialize: function () {
        this._mod = require('x_1040823_ddg_now/ddg-now-sdk/0.0.1/src/server/rest/public-whiteboard.ts')
    },

    /** Answers `POST /public/whiteboard/{token}`. */
    serve: function (request, response) {
        this._mod.servePublicWhiteboard(request, response, this._lookup)
    },

    _lookup: function (token) {
        var gr = new GlideRecord('x_1040823_ddg_now_whiteboard')
        gr.addQuery('share_enabled', true)
        gr.addQuery('share_token', token)
        gr.setLimit(1)
        gr.query()
        if (!gr.next()) return null
        return {
            token: gr.getValue('share_token') || '',
            name: gr.getValue('name') || '',
            scene: gr.getValue('scene') || '',
            updatedAt: gr.getValue('sys_updated_on') || '',
            passwordHash: gr.getValue('share_password') || '',
        }
    },

    type: 'DdgPublicWhiteboard',
}
