This is a **ServiceNow scoped application** built with the Now SDK (`@servicenow/sdk`), scope
`x_1040823_ddg_now`. It was converted from a Bun + PocketBase + React app; see `README.md` for what
ported, what was rewritten, and what was cut. `Porting DDG to ServiceNow.md` is the original plan.

There is no Bun, no PocketBase and no Docker here any more. React remains, and so does the Bun
app's UI: `src/client` is that interface rebuilt on the platform — Tailwind, shadcn-style copy-in
components, the original design tokens — over this app's own scoped REST API.

The old application is kept under `legacy/` because this repository has no git history and it is
the only copy. It is a **source to copy from, not to build from**: several files under
`src/client` began as copies of files there and are maintained here. Nothing in `legacy/` is
wired into the build, and nothing should be.

## Commands

```bash
npm run build      # compiles and validates Fluent
npm run deploy     # installs the last build — always after a clean build, never instead of one
npm test           # the generator and the pure layers, on Node
npm run typecheck  # tsc over src/server and src/client
npm run codegen    # inferred schema -> a .now.ts table definition
npm run locale-data # regenerate the bundled word lists
```

`npm run build` then `npm run deploy`, in that order, every time. A failed build leaves the
previous artifacts in place, so deploying without rebuilding pushes stale output.

## Where things go

- `src/fluent/**/*.now.ts` — metadata definitions. **Declarative calls only**: a helper function or
  a `void` expression in one of these files is a build error, not a style preference.
- `src/server/**` — ES modules with typed Glide imports. This is where logic lives. Import Glide
  APIs explicitly (`import { gs, GlideRecord } from '@servicenow/glide'`); they are not globals here.
- `src/script-includes/*.js` — `Class.create` bridges. **Deliberately outside `src/server/`**:
  everything under the server modules directory is compiled into a `sys_module`, and a
  `Class.create` file compiled that way fails at runtime. Do **not** import Glide APIs in these —
  they are automatically available in Script Include context.
- `src/client/**` — the React UI Page, which is the Bun application's own UI rather than a
  platform-component page. React 18.2.0, Tailwind v4, and shadcn-style copy-in components. It has
  its own layout:
  - `components/ui/` — the copied-in primitives (`button`, `input`, `label`, `popover`, `select`,
    `textarea`), styled with `cva` + `cn()`. Generic: would be the same in an unrelated
    product. Copied from `legacy/components/ui/`, so a change here is a change to a *copy*, not to
    a dependency.
  - `components/app/` — this product: `Sidebar`, `FieldRow`, `TypeSelect`, `PreviewTable`,
    `RowDetail`, `ImportPanel`, `MetadataEditor`, `ScriptTemplatePanel`, `CodeEditor`,
    `SettingsPanel`, `SplitHandle`, `WhiteboardPanel`, `WhiteboardCanvas`.
  - `lib/api.ts` — **the only file that knows a URL.** A component that calls `fetch` is a bug.
  - `styles/globals.css` — the design tokens. It is an *input*: `tools/build-css.mjs` compiles it
    to `src/client/generated/app.css` (gitignored) before the bundle is built.
- `tools/` — design-time only. Runs on your laptop, never on the instance.

## Rules that bite

- **Never invent a sys_id.** Always `Now.ID['descriptive-key']`. The only safe raw sys_ids are ones
  a `now-sdk query` returned from a real instance.
- **Deleting a `Table()`, `BusinessRule()` or `Record()` call is a tracked deletion.** It ships a
  delete record that removes that record from every instance the app is installed on, including
  through upgrades. Confirm with the user before removing one — the code alone cannot tell you
  whether it was ever installed.
- **Access control is the platform's.** Every read and write in `src/server/db/db.ts` goes through
  `GlideRecordSecure` so the caller's own ACLs decide. Do not reintroduce privilege in the module
  layer; anything that genuinely needs it belongs behind a role-gated Script Include.
- **Only use Glide methods that appear in `@servicenow/glide`'s type definitions.** Do not assume a
  method exists from its name — the porting guide's own sketches got `sn_ws` and
  `RESTMessageV2`'s constructor wrong, and the type definitions were right.
- **A module cannot resolve a Script Include by name.** `new x_scope.Thing()` throws in module
  context. The `DdgGenerator` bridge injects `callScriptInclude` for the one place that needs it.
- **No `fetch`, no `node:` built-ins, no browser globals, no `new Function()`, no `Reflect`.**
  ES2021 syntax is fine; `async` class methods and private instance fields are not.
- **No constructor parameter properties** in `src/server`. They need a TypeScript transform, and
  the tests run under Node's type stripping, which does erasure only.
- **Never create a webpack, vite or babel config.** The SDK's build handles the client; the
  prebuild in `tools/prebuild.mjs` is the only hook. Its order is load-bearing: Tailwind compiles
  the stylesheet, then the client bundle is built, then the Fluent compiler resolves the UI page's
  HTML import. Tailwind runs there — as the CLI, ahead of rollup — precisely *because* the
  alternative would be a PostCSS config inside the bundler.
- **The UI does not use `@servicenow/react-components`.** That is a deliberate reversal, at the
  user's direction: the page is the Bun application's UI, rebuilt on its own primitives, and the
  package is no longer a dependency. So lists and forms are hand-built over `lib/api.ts` rather
  than `NowRecordListConnected` and `RecordProvider`, and adding a platform component back would
  put two visual languages on one page. What the platform still gives the page is the session —
  `window.g_ck` from `<sdk:now-ux-globals>` — and the ACLs behind every endpoint.
- **A UI affordance that needs data needs an endpoint, not a Table API call.** `src/fluent/rest/`
  is the app's whole data surface, and the page and a CI script use the same routes. Reaching
  `/api/now/table/...` from the client would be a second, undocumented data path.
- **Every view needs a URL.** `URLSearchParams`, never hash routing, and always check
  `window.self !== window.top` so the Polaris frame's breadcrumb stays in step.

## Script templates

`src/server/lib/scriptTemplate.ts` is shared the way `preferences.ts` is: compiled into the
`sys_module` *and* bundled into the page, so it must stay Glide-free. It is the single list of
placeholders — the render endpoint substitutes them, the palette offers them, and
`highlight.ts` colours them, all from `PLACEHOLDERS`.

Three properties are load-bearing, and `tests/scriptTemplate.test.ts` asserts each one:

- every placeholder expands to a **JavaScript literal**, so a template never quotes a substitution;
- substitution is **one pass with a replacement function**, because a generated row can contain
  both a placeholder-shaped string and a `$&` that a string replacement would expand;
- the rows go in as the **stored `rows_json` column verbatim**, so a script and a download of the
  same dataset never disagree.

Whether Save edits or forks a template is `canWrite` on the record — the write ACL's own answer.
Do not reintroduce an owner comparison in the client: `sys_created_by` is a user name the page
never reliably learns.

## Whiteboards

`@excalidraw/excalidraw` powers the `?view=whiteboard&board=<id>` view. Each board is one record in
`x_1040823_ddg_now_whiteboard`, and its `scene` column holds exactly the text Excalidraw writes
for a `.excalidraw` file (`serializeAsJSON(..., 'local')`), pasted images included.

- `WhiteboardCanvas.tsx` is the **only** file that imports Excalidraw, and `WhiteboardPanel` loads
  it with `React.lazy`. Keep it that way: the library is most of the bundle, and it should only
  download when someone opens a board.
- The package's stylesheet can't be imported by its package name (its `exports` only list the
  `development`/`production` conditions). `tools/build-css.mjs` copies it and its `Assistant`
  fonts into `src/client/generated/excalidraw/`, and the canvas imports that copy.
- Drawing fonts are loaded at runtime from Excalidraw's CDN fallback (`esm.sh`) unless
  `window.EXCALIDRAW_ASSET_PATH` is set.
- A board you own saves itself a moment after you stop drawing. New boards and other people's
  boards only save when you press Save, and saving someone else's board creates your own copy —
  the same rule script templates follow. `MAX_WHITEBOARD_SCENE_LENGTH` in
  `src/server/lib/whiteboard.ts` must match the column's `maxLength`.

## The generator

`@faker-js/faker` is on ServiceNow's unsupported list and does not run here. It is a **dev
dependency only**, used by `tools/build-locale-data.mjs` to bundle word lists at design time.
Never import it from `src/server`.

`src/server/generate/random.ts` replaces it: one seeded PRNG wearing faker's property-bag shape.
Add a generator by extending the `FieldType` union in `src/server/lib/types.ts`, adding its case in
`generate.ts`, and adding a `FIELD_TYPES` entry — the business rule validates against that union,
so nothing else needs changing.

Seeded reproducibility is the property the whole generator exists to guarantee. If a change makes
the same seed produce different rows, that is a bug, and `npm test` will say so.
