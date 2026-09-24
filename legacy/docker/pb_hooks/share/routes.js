/// <reference path="../../pb_data/types.d.ts" />

/**
 * The sharing endpoints, under PocketBase's own router.
 *
 * `$apis.requireAuth()` rejects anonymous callers before the handler runs, so
 * `e.auth` is always a real account below. The Bun server proxies these with
 * the caller's token — it never speaks for anyone.
 */
module.exports.register = () => {
  const path = "/api/ddg/shares/{collection}/{id}";

  routerAdd("GET", path, e => require(`${__hooks}/lib/sharing.js`).list(e), $apis.requireAuth());
  routerAdd("POST", path, e => require(`${__hooks}/lib/sharing.js`).add(e), $apis.requireAuth());
  routerAdd("DELETE", path, e => require(`${__hooks}/lib/sharing.js`).remove(e), $apis.requireAuth());
};
