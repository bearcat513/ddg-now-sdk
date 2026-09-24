
Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

## This project

Storage is **PocketBase**, not `bun:sqlite`. The app and the database run together under Docker
Compose (`bun run docker:up`).

**Access control lives in PocketBase, not in the Bun server.** Every request carries the caller's
own token (httpOnly cookie, or an `Authorization` header) and the collection rules decide what they
may see — the server holds no credentials and can grant nothing on its own. Never reintroduce a
superuser client for ordinary reads and writes; if something needs privilege, it belongs in
`docker/pb_hooks/` as a route, the way sharing does.

- `src/server/pocketbase.ts` — one client per request, error mapping
- `src/server/session.ts` / `auth.ts` — the session cookie, register/login/logout
- `src/server/db.ts` — the collections. Every call takes a token and is async.
- `src/server/share.ts` — proxies to PocketBase's `/api/ddg/shares/...` hook routes
- `docker/pb_migrations/` — collections, ownership fields, API rules. A schema change is a new
  migration file here, not a dashboard edit, or a fresh volume comes up without it.
- `docker/pb_hooks/` — server-side JS run by PocketBase's own JSVM, not by Bun. **A hook body
  cannot see its file's scope**: declare what a handler needs inside the handler, or `require` it
  there. Code that breaks this rule registers fine and fails only at runtime.

Enum choice scripts run server-side in a `node:vm` context and see only `DDG_SCRIPT_*` environment
variables. Sign-up is open, so treat a snippet as untrusted code and keep the server's secrets out
of its reach.

`bun test` builds and starts throwaway PocketBase containers; without Docker, those tests skip.
