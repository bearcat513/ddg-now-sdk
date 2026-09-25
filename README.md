# Dummy Data Generator — ServiceNow scoped application

Paste a JSON sample, a TypeScript interface or a `CREATE TABLE` statement; get a typed schema,
then generate seeded, realistically-shaped test data from it — into the app's own dataset store,
or straight into a real ServiceNow table.

Scope `x_1040823_ddg_now`. Built and installed with the Now SDK.

```bash
npm install
npx now-sdk auth --list     # confirm the target instance
npm run build && npm run deploy
```

Then open **Dummy Data Generator → Generator** in the navigator. A worked example
(`Support tickets (example)`) installs as demo data — open it and press **Preview 10 rows**.

---

## What this is a port of

This repository was a Bun + PocketBase + React application. The conversion followed
`Porting DDG to ServiceNow.md`, which is still worth reading: it explains the decisions, and
this README only records what was actually built.

The honest summary is that the parts carrying the design work ported almost untouched, and the
parts that touched a runtime did not port at all.

| Ported unchanged | Rewritten | Cut |
| --- | --- | --- |
| `infer.ts` (type inference) | `generate.ts`'s value layer | `node:vm` enum snippets |
| `formula.ts` (formula + condition evaluators) | `db.ts` → GlideRecord | The custom sharing model |
| `types.ts` (the `FieldType` union, ~215 generators) | `index.ts` → `RestApi()` | Auth, sessions, API keys |
| `export.ts` (CSV / JSON / SQL serialisers) | `script.ts` → named choice sources | Telegram notifications |
| `rows.ts` (the flatten/unflatten row model) | `App.tsx` → a UI Page with a URL | The CLI, OpenAPI generation, notes |
| `components/ui/`, `FieldRow`, `TypeSelect`, `PreviewTable` | `lib/api.ts` → the scoped REST API | Sharing, the dashboard |
| `scriptTemplate.ts`, `ScriptTemplatePanel`, `CodeEditor` | `script_templates` → a scoped table | |

The original source is kept under `legacy/` rather than deleted — this repository has no git
history, so it is the only copy.

### Why faker had to go

`@faker-js/faker` is on ServiceNow's **unsupported** third-party list — not untested, tested and
does not work on the Rhino server runtime. Every leaf value in the 1,500-line generator came from
a `Faker` instance.

Counting the actual surface rather than the line count made it tractable: about two thirds of the
232 call sites were arithmetic and string assembly over a random stream, which needs no library at
all. `src/server/generate/random.ts` is a seeded PRNG (mulberry32) wearing faker's exact
property-bag shape — `r.number.int`, `r.person.firstName` — so `generate.ts` ported by changing
one import and one type annotation rather than at every call site.

The remaining third needed *data*: names, cities, companies, book titles. `tools/build-locale-data.mjs`
runs locally, reads the faker locale definitions already in `node_modules`, and writes a capped
slice into `src/server/generate/data/en.ts` (~90 KB). Faker ships megabytes across every locale;
this ships one locale and a few kilobytes.

`chance` is on the supported list and would have covered `person` and `address`. It was not used:
mixing it in means two random streams and two seeding mechanisms, and reproducible output is the
one property the generator exists to guarantee.

### What survived intact

The distribution maths (normal, log-normal, Pareto), the check-digit algorithms (Luhn, UPC-A,
EAN-13, ISIN, CUSIP, NPI), the weighted-choice logic, the uniqueness trackers, the template
expander and the `resolveOrder` dependency sort are all pure functions over a random stream. They
are most of the file's genuine complexity and none of it was at risk. `tests/generate.test.ts`
asserts all of it, including that a given seed still replays byte-identically.

### The ServiceNow field types

The one group the Bun app could not have had. `insertRows` writes straight into a real table, so
the generators that matter most here are the ones whose output a platform column will actually
accept:

- **Choice fields** — `incidentState`, `taskPriority`, `taskImpact`, `taskUrgency`, `taskCategory`,
  `contactType`, `changeType`, `changeRisk`, `approvalState`. Each pool carries both halves of the
  choice and `variant` picks one: `value` (the default, what a record stores and what an insert
  needs) or `label` (what a list shows). Values are strings even when they look numeric, because
  that is how the platform returns every field. The pools are weighted, so a thousand generated
  incidents look like a queue rather than a uniform draw — and the draw happens once either way, so
  flipping `variant` re-labels the same rows instead of generating different ones.
- **Platform formats** — `glideDateTime` (`YYYY-MM-DD HH:mm:ss`, UTC, the only shape a
  `glide_date_time` takes, so it has no `format` option), `glideDuration` (an offset from the epoch,
  so two days three hours is `1970-01-03 03:00:00`; `variant: "human"` gives `2 Days 3 Hours`),
  `encodedQuery`, `appScope`, `cmdbClass`, `nowRole`, `nowUserId` (`first.last`, the stock
  `user_name` shape, and it honours `derivesFrom` like `email` does).
- **Free text with the right flavour** — `shortDescription`, `assignmentGroup`, `closeCode`,
  `ciName`.

`infer` knows these by column name, so a sample row with `short_description`, `priority`,
`opened_at` and `assignment_group` in it comes back as an incident-shaped schema rather than a
paragraph, an enum and two dates.

---

## Architecture

Two halves the Bun version kept together.

**Runtime**, on the instance:

```
Paste JSON / TS / DDL  →  inference  →  x_..._config + x_..._field
                                              │
                                              ├─→ x_..._dataset (rows_json)
                                              └─→ a real table, via GlideRecord
```

**Design time**, on your laptop: `tools/codegen.mjs` turns the same inferred field list into a
`Table()` definition you commit and install. Paste a DDL statement, get a real scoped table.

### Layout

```
src/
  fluent/              .now.ts metadata definitions
    tables/            config, field, mapping, dataset, template
    acls/ roles/       access control
    rest/ jobs/        the scripted API and the queue-draining job
    script-includes/   the named entry points
    menu/ forms/ ui-actions/ data/
    generated/keys.ts  auto-generated, committed
  server/              ES modules, typed Glide imports — the actual logic
    lib/               types, formula, rows, datasetName (ported)
    infer/             ported unchanged
    generate/          random.ts, generate.ts, choices.ts, insert.ts, data/
    export/ db/ rest/ jobs/ ui-actions/ business-rules/
    run.ts             orchestration shared by every caller
    bridge.ts          what the Script Includes call
  script-includes/     Class.create wrappers — deliberately NOT under src/server
  client/              the React UI Page — Tailwind + shadcn (see UI, below)
    components/ui/     copied-in primitives; components/app/ this product
    lib/api.ts         the only file that knows a URL
tools/                 design-time only: codegen, locale data, client build, hooks
tests/                 run on Node against the module source
legacy/                the Bun application, kept for reference
```

`src/script-includes/` sits outside `src/server/` on purpose: everything under the server modules
directory is compiled into a `sys_module`, and a `Class.create` file compiled that way fails at
runtime.

---

## The record model

`x_..._config` is the schema. Its fields are a **child table**, not a JSON blob — PocketBase stored
the whole `Field[]` array in one column because it could; here one row per field buys list views,
filtering, per-field ACLs, and a related list that replaces most of what the SPA's schema editor
did.

Two things stay JSON, both deliberately:

- `field.options` — `FieldOptions` is a genuinely heterogeneous bag (`min`/`max` for numerics,
  `values`/`weights` for enums, `pattern` for templates). Flattening 40-odd optional properties
  into columns would produce a table that is mostly null.
- `config.metadata` — free-form key/value pairs describing what a schema is for.

`field.field_type` is a **String, not a ChoiceColumn**. The `FieldType` union has ~215 members;
expressing that as choices is 215 lines of Fluent kept in lockstep by hand, and every added
generator becomes a schema migration. The union stays the single source of truth in the module
layer, and a business rule validates against `FIELD_TYPE_SET` on write — so adding a generator
makes it valid automatically.

**Rows live in `rows_json` on the dataset record**, as the JSON string the export and the script
renderer both serve verbatim. The column carries the `json_view` dictionary attribute, so opening
the record in a platform form shows formatted JSON rather than one unbroken line, and the record's
own read ACL is the only thing guarding the data. The cost is that a query has no column
projection: listing datasets reads every dataset's rows with it. `DATASET_JSON_LIMIT` in
`src/server/db/tables.ts` mirrors the column's length, and a run whose JSON would not fit is failed
with that as the reason rather than stored truncated.

`x_..._template` is a script template: JavaScript with `${GENERATED_DATASET}` and a dozen other
placeholders that a run is substituted into. Its body is a `ScriptColumn`, so the record opened in
a platform form gets a script editor, and it references nothing — the same template renders
whichever dataset it is pointed at. See [Script templates](#script-templates).

`x_..._user_pref` is the last table and belongs to nothing else: one row per person, holding how
they like the workspace arranged. It is columns rather than a blob for the same reason the field
list is a child table — see [Preferences](#preferences) for why it is a table of its own rather
than `sys_user_preference` or a column on `sys_user`.

---

## Access control

The Bun app got this right and the principle is unchanged: **the server holds no credentials and
grants nothing on its own.** Every request carried the caller's own token and PocketBase's
collection rules decided what they could see.

Here the session *is* the caller's and ACLs decide. Every read and write in `src/server/db/db.ts`
goes through `GlideRecordSecure`, which enforces them — not `GlideRecord`, which in a scoped app
does not. Nothing elevates.

| Role | Can |
| --- | --- |
| `x_1040823_ddg_now.user` | Read any configuration; edit and delete their own; generate into the dataset store |
| `x_1040823_ddg_now.table_writer` | All of the above, plus generate into real tables |

The split exists because target-table writes leave this scope and land in a system of record. That
is a different act from filling the app's own store, not a flag on the same one.

Two differences from PocketBase worth knowing:

- **Per-record ownership is not automatic.** `sys_created_by` gives the equivalent through an ACL
  condition. Note it holds a user *name*, not a sys_id, so the conditions compare against
  `gs.getUserName()` — the `DYNAMIC` "Me" filter yields `gs.getUserID()` and would silently never
  match.
- **Sharing is gone.** `sharedWith` and the `/api/ddg/shares/...` hook routes have no analogue.
  Configurations are readable app-wide and writable by their creator; datasets are private to
  whoever generated them, matching the Bun app's "generated data is never shared".

---

## The REST API

Seven route groups, not the Bun server's thirty-six — most of those existed to feed the SPA, and the
page that replaced it needs two of them. Base path `/api/x_1040823_ddg_now/ddg`.

| Route | Method | Purpose |
| --- | --- | --- |
| `/infer` | POST | Paste a structure, get a field list |
| `/config` | POST | Store an inferred field list as a schema |
| `/config/{configId}/generate` | POST | Run a generation |
| `/dataset` · `/dataset/{id}` | GET | Dataset metadata and run state |
| `/dataset/{id}/export` | GET | The rows themselves |
| `/dataset/{id}/script` | GET | That run rendered into a script template |
| `/template` · `/template/{id}` | GET · POST · PUT · DELETE | Script templates |
| `/preferences` | GET · PUT | The caller's own workspace preferences |

These are also what the UI Page talks to — every read and write it makes is one of these routes.

```bash
# infer
curl -u "$SN_USER:$SN_PASS" -X POST \
  "$SN_HOST/api/x_1040823_ddg_now/ddg/infer" \
  -H 'Content-Type: application/json' \
  -d '{"input": "{\"email\":\"a@b.com\",\"age\":31}"}'

# generate — 200 with a finished dataset, or 202 with one to poll
curl -u "$SN_USER:$SN_PASS" -X POST \
  "$SN_HOST/api/x_1040823_ddg_now/ddg/config/<sys_id>/generate" \
  -H 'Content-Type: application/json' -d '{"rowCount": 100}'

# a preview stores nothing
curl ... -d '{"preview": true, "rowCount": 5}'

# straight into a real table (needs table_writer, and create access on the target)
curl ... -d '{"table": "incident", "rowCount": 50, "mapping": {"short_description": "short_description"}}'

# the rows
curl -u "$SN_USER:$SN_PASS" "$SN_HOST/api/x_1040823_ddg_now/ddg/dataset/<id>/export"

# the same rows dropped into a saved script template, served as a .js file
curl -u "$SN_USER:$SN_PASS" \
  "$SN_HOST/api/x_1040823_ddg_now/ddg/dataset/<id>/script?template=<template_sys_id>"

# preferences — always the caller's own; a PUT is a patch, and the reply is
# what was kept after clamping
curl -u "$SN_USER:$SN_PASS" "$SN_HOST/api/x_1040823_ddg_now/ddg/preferences"
curl -u "$SN_USER:$SN_PASS" -X PUT "$SN_HOST/api/x_1040823_ddg_now/ddg/preferences" \
  -H 'Content-Type: application/json' -d '{"theme": "dark", "defaultRowCount": 250}'
```

Route handlers are typed modules, not script strings — `RestApi` is one of the Fluent APIs that
accepts function imports. They are written as `export function` declarations rather than `const`
bindings, which is what the Fluent build can resolve a `script:` reference to.

---

## Running at scale

Three changes from the Bun version, none optional:

**Large runs are asynchronous.** Anything past `x_1040823_ddg_now.sync_row_limit` (default 2,000)
rows is placed as a `queued` dataset and picked up by a scheduled job every five minutes; the
endpoint answers `202` with a record to poll. A synchronous 100k-row generation in an interactive
transaction will hit the platform's transaction quota. A ten-row preview stays synchronous.

**The row loop never holds everything.** `generateInto(config, sink)` yields one row at a time;
`generateRows` is the collecting wrapper over it. A target-table run streams into `GlideRecord`
inserts in batches of 200.

**The cap is a property, not a literal.** `x_1040823_ddg_now.max_rows` (default 100,000). The Bun
version's hard-coded 100,000 was never chosen from anything; what an instance tolerates is a
property of the instance.

Row-at-a-time `GlideRecord.insert()` is the honest baseline and it is not fast. The levers, in
order: `skipBusinessRules` where the target table allows it, a staging table with an Import Set
transform map, or accepting a slower job because it runs asynchronously anyway.

---

## Dynamic enum choices

`src/server/script.ts` ran a user-authored async function body in a `node:vm` context with `fetch`
in scope. There is no `vm` on the platform, no `fetch`, and `new Function()` is disallowed
outright — so this was replaced, not ported. That is the right outcome regardless: the original
file's own comment conceded its sandbox "is a guard against mistakes, not against malice", and on
a system of record a snippet would have run with the application's own privileges.

Three replacements, in order of preference:

```jsonc
{ "valuesFrom": "scriptInclude", "scriptInclude": "DdgIncidentStates" }   // getChoices()
{ "valuesFrom": "table", "choiceTable": "incident", "choiceQuery": "active=true", "choiceField": "state" }
{ "valuesFrom": "rest", "restMessage": "Vendor codes", "restMethod": "get" }
```

A Script Include needs the role to create one, which is the authorisation boundary the sandbox was
trying and failing to draw. A table read is local and goes through `GlideRecordSecure`, so a choice
list can never become a read channel for rows the caller cannot see.

One structural note: **a module cannot instantiate a Script Include by name.** `new x_scope.Thing()`
resolves only in Script Include execution context and throws in a module, and no Glide API takes a
name and returns an instance. So the `DdgGenerator` bridge — which *is* in that context — passes a
`callScriptInclude` function down into the module layer. Calls that arrive without it get a clear
error for that one source rather than a silent empty pool.

`resolveChoiceScripts()` keeps its original shape: resolve every source up front, deduplicate
identical ones, let `generateRows()` stay synchronous. What went away is the concurrency trick —
every source here blocks, so there is nothing to await.

---

## Script templates

A template is JavaScript with placeholders that a finished run is substituted into, so rows can be
dropped straight into a script you already have — a `GlideRecord` seeding loop, a fixture file, a
migration. Written in the **Scripts** tab, rendered from the picker beside the preview table, and
served by `GET /dataset/{id}/script?template=<sys_id>` as a `.js` download.

```js
var source = { config: ${CONFIG_NAME}, rows: ${ROW_COUNT}, generatedAt: ${GENERATED_AT} };
var records = ${GENERATED_DATASET};

records.forEach(function (record) {
  var gr = new GlideRecord('incident');
  gr.initialize();
  gr.setValue('short_description', record.short_description);
  gr.insert();
});
```

Thirteen placeholders: the rows themselves, and what the run knew about itself — its name, id, row
and field counts, column names and timestamp, plus the configuration's name, id, seed, locale,
schema and metadata. Three rules hold the feature together, and each one is a bug if dropped:

- **Every placeholder expands to a JavaScript *literal*,** quotes and brackets included, so a
  template never has to quote a substitution and an apostrophe in a dataset name can never end the
  string it was pasted into. A configuration that has since been deleted renders as `null`, which
  is still a literal a script can test.
- **One substitution pass, with a replacement function.** A generated row can contain anything,
  including the text `${ROW_COUNT}` — a second pass would substitute into the data, and a string
  replacement would let `$&` and `$'` in a row act as replacement patterns.
- **The rows go in as the stored column, byte for byte.** A script and a download of the same
  dataset can never disagree about what was generated, which also means switching templates costs
  a request rather than a run.

`src/server/lib/scriptTemplate.ts` holds all of that, is Glide-free, and is imported by both the
render endpoint and the editor — so the chips in the palette, the tokens the highlighter colours
and the tokens the server substitutes are one list. `tests/scriptTemplate.test.ts` covers the
three rules above.

Read is app-wide for the role and writes are the creator's, the same rule configurations get;
`canWrite` rides down on the record so **Save** on somebody else's template reads "Save my copy"
and forks it, rather than the page guessing at an ACL the platform has already evaluated.

---

## Codegen: inferred schema → Fluent table

```bash
npm run codegen -- --name orders --from ./sample.json          # prints, and diffs
npm run codegen -- --name orders --from ./schema.sql --write
```

Runs **locally, never on the instance** — it emits `.now.ts` source, which the build compiles.

~215 generators collapse onto about a dozen column types. Two transformations the emitter has to do
that the Bun app got for free:

- **Column names need normalising** and checking for collisions — `address.city` and `address_city`
  snake-case to the same thing. Reported, not silently merged.
- **Names are capped.** A table name must fit in 30 characters *including* the scope prefix, and
  `x_1040823_ddg_now_` already spends 18. Truncation is deterministic and reported.

> **The hazard, stated plainly.** Regenerating a `.now.ts` file that dropped a column is a *tracked
> deletion*. Every record Fluent defines has its identity in `keys.ts`, and a `keys.ts` entry with
> no matching Fluent code is read as an intentional delete — it ships a delete record that removes
> the column from every instance the app is installed on, including through future upgrades. This
> is why `--write` is opt-in and the default prints a diff. **Never run codegen unattended in CI
> against a file that has already been installed.**

Emitted files carry `// @fluent-disable-sync-for-file`, so a `transform` pull and a `codegen` run
do not fight over the same file.

---

## Build and deploy

```bash
npm run build      # compiles and validates Fluent, writes artifacts
npm run deploy     # installs the last build
npm test           # the generator, on Node
npm run typecheck
```

Always in that order. A failed build leaves the previous artifacts in place, so deploying without
a clean build pushes stale output.

### The prebuild hook

`tools/sync-module-paths.mjs` runs before every build. It exists because of a discrepancy worth
recording: the SDK docs describe the Script Include bridge pattern as
`require('./dist/modules/<path>.js')`, but **this SDK version (4.11.2) emits a different form** for
every `require` it generates itself:

```
require('<scope>/<package>/<version>/src/server/<path>.ts')
```

Source path, `.ts` extension, and the package version baked in. A hand-written wrapper is the one
place the build does not generate that string, so it is the one place that silently breaks on the
next version bump — the Script Include still installs, still registers, and fails only when someone
calls it. The hook rewrites the version from `package.json` on every build and reports what it
changed.

### keys.ts

`src/fluent/generated/keys.ts` maps every `Now.ID[...]` to a generated sys_id. It is
auto-generated and **belongs in version control**.

- Never write a sys_id by hand — always `Now.ID['descriptive-key']`.
- Renaming a key creates a new record and orphans the old one. Key names are effectively permanent.
- Deleting a Fluent definition is a tracked deletion (see the codegen hazard above).
- Use `--frozenKeys` in CI so a build fails rather than silently regenerating an out-of-date file.

---

## Tests

```bash
npm test
```

70 tests, run on Node against the module source. They cover the phase-two go/no-go the porting plan
called for — a given seed produces byte-identical output — plus every one of the ~215 field types,
the check digits, the distributions, the dependency ordering, inference, and the serialisers.

They cannot run the Glide-dependent layers (`db`, `choices`, `run`). `tools/glide-stub.mjs` makes
those imports resolve, and every member of it **throws when called** — a stub that quietly returned
empty results would let a test pass while exercising nothing.

Two constraints the module source now honours so it can be run this way:

- No constructor parameter properties. `formula.ts` had two; they need a TypeScript *transform*,
  and Node 26 does type stripping only. The compiled output is identical.
- Extensionless relative imports need `tools/ts-resolve.mjs`, since Node's resolver does not guess
  extensions the way the SDK's bundler does.

---

## UI

The UI is the Bun application's, rebuilt on the platform rather than replaced by it.

The first port took the other road: lists and forms carried the app, and a UI Page covered only
the two things a form genuinely cannot do. That version worked and was a third of the code — but
it was a ServiceNow application that happened to generate data, not the tool this repository is a
port *of*. So the UI was brought back: the same shadcn-style primitives, the same Tailwind design
tokens, the same three-pane workspace.

```
┌──────────┬────────────────────────────────────────────┐
│ Sidebar  │ name · rows · seed · locale   Save Generate│
│  configs ├──────────────────┬─────────────────────────┤
│  scripts │ [Import][Schema] │ PreviewTable            │
│  datasets│ [Scripts]        │ Script ▾ · CSV JSON SQL │
│          │ ── FieldRow ──── │  1 │ email │ status     │
│  ⌘K      │ ── FieldRow ──── │  2 │ …     │ …          │
│  + New   │ ══ SplitHandle ══│ → RowDetail             │
└──────────┴──────────────────┴─────────────────────────┘
```

What is still the Bun app, essentially untouched: `FieldRow` (the 1,000-line schema editor and the
hardest part of the UI), `TypeSelect` (a searchable picker over ~215 generators), `PreviewTable`
and `RowDetail`, `SplitHandle`, `ImportPanel`, `MetadataEditor`, and the `components/ui`
primitives. `SettingsPanel` is back, trimmed to the preferences this application actually has.
`ScriptTemplatePanel` and `CodeEditor` came across too, and the Scripts tab with them.
What is gone with the features behind it: the sign-in screen, the share dialog, the API-key
preview, the dashboard, and the mappings and notes tabs. What is new: the URL, and where
preferences live.

### Stack

| Concern | Choice | Note |
| --- | --- | --- |
| Components | shadcn-style copy-in, `cva` + `cn()` | Copied from `legacy/components/ui/`, not a dependency |
| Styling | Tailwind v4, the original token set | `styles/globals.css`, compiled by a prebuild step |
| Primitives | Radix (`label`, `popover`, `select`, `slot`) | Bundled into the page; Rhino's unsupported list is a *server* list |
| Icons | `lucide-react` | Tree-shaken into its own chunk |
| Data | `lib/api.ts` over the scoped REST API | One typed object, one place that adds `X-UserToken` |

`@servicenow/react-components` is no longer a dependency. That is the reversal this UI is: the
page brings its own design system, and a platform web component dropped into it would arrive
wearing a different one.

### How it is wired

```
src/client/
  index.html           entry — <sdk:now-ux-globals> then main.tsx
  main.tsx             React bootstrap; imports the compiled stylesheet
  app.tsx              the workspace: state, actions, layout
  styles/globals.css   design tokens — an INPUT, compiled by tools/build-css.mjs
  generated/app.css    the compiled output (gitignored)
  components/ui/       button, input, label, popover, select, textarea
  components/app/      Sidebar, FieldRow, TypeSelect, PreviewTable, RowDetail,
                       ImportPanel, MetadataEditor, ScriptTemplatePanel,
                       CodeEditor, SettingsPanel, SplitHandle
  lib/                 api.ts, navigation.ts, navSearch.ts, configFile.ts,
                       metadata.ts, codeEdit.ts, highlight.ts, clipboard.ts,
                       timeAgo.ts, utils.ts
src/fluent/ui-pages/studio.now.ts
```

Three properties on `UiPage` carry the contract: `endpoint` must start with the scope prefix,
`html` must be an **import of the client entry point** (not a string — that import is what
connects the page to the bundle), and `direct: true` is required or the React root never mounts.

The prebuild in `tools/prebuild.mjs` runs three things in a fixed order, and the order is the
whole point:

1. `build-css.mjs` — Tailwind's CLI compiles `styles/globals.css` to `generated/app.css`.
2. `build-client.mjs` — rollup bundles `main.tsx`, which imports that file. The pipeline turns a
   CSS import into an emitted asset plus a runtime `<link>`, so the stylesheet ships as a separate
   cacheable file rather than inlined in the bundle.
3. The Fluent compiler resolves the UI page's HTML import to the built file in `dist/static/`.

Tailwind runs as a child process ahead of rollup rather than as a plugin inside it, because a
plugin would mean a bundler config — and there is no webpack, vite or PostCSS config here, nor
should there be. `npm run dev` runs the same compile in `--watch` mode alongside the bundler's
watcher, so a class typed into a component reaches the instance the way an edit to the component
does.

```bash
npm run dev     # watch the client and push on save; Fluent changes still need build + deploy
```

### The data layer

`lib/api.ts` is the only file in the client that knows a URL — the Bun app's convention, kept. A
component that calls `fetch` directly is a bug.

Dropping the platform's record components meant the page needed real read and write endpoints, so
`src/fluent/rest/api.now.ts` grew from six routes to twenty-one: list and read configurations, save
one, delete one, delete a dataset, read a stored run's rows back as JSON, preview from a field
list sent inline, and the five that keep script templates plus the one that renders into them. They are the *same* routes a CI pipeline calls. Giving the page a private set
would have been two paths to the same records, drifting.

Two details worth knowing:

- **The nav list carries a summary, not schemas.** `GET /config` sends a field count and the field
  *names* — enough for the "12 fields" subtitle and for the search box to match a column — and
  `summariseFields` produces both in a single `GlideRecordSecure` pass. Opening a configuration is
  a separate fetch. The Bun app's list came back with every schema inline because each one was a
  single JSON column; the child table is what changed that.
- **Runs are stored as JSON, and only as JSON.** It is the only format the rows can be read back
  out of — CSV and SQL are lossy about types — and `GET /dataset/{id}/export?format=csv`
  serialises on demand, so the preview table costs nothing and a run takes no `format` at all.

### Routing and the Polaris frame

The Bun app kept which schema was open in React state and nothing else; it was one page on a
server of its own. On the platform that is not enough, so every state worth returning to has a
URL: `?config=<sys_id>&dataset=<sys_id>&template=<sys_id>&tab=schema`. `URLSearchParams`, no router library, no hash
routing.

The part that is easy to leave out: a UI Page opened from the navigator runs **inside the Polaris
iframe**, where `history.pushState` updates an address bar nobody can see. `lib/navigation.ts`
checks `window.self !== window.top` and tells the frame separately via
`CustomEvent.fireTop('magellanNavigator.permalink.set', …)`, or the breadcrumb and title go stale
while the page underneath them changes.

### Preferences

Stored per user on a table of their own, `x_1040823_ddg_now_user_pref` — one row each, reached
through `GET` and `PUT /preferences`, edited in the settings view.

The Bun app kept them as a JSON blob on the account's own `users` record and shipped them down on
the session object. The platform equivalents would be `sys_user_preference` or a column on
`sys_user`; this application deliberately does neither. A table of its own is queryable and
reportable, the app's own ACLs decide who reads a row rather than `sys_user`'s, and uninstalling
takes the preferences with it instead of leaving a column behind on a core table.

**Real columns, not a blob.** Same judgement as the field list in `config.now.ts`: a fixed, known
set of values belongs in columns, where list views, filtering and a form come free. `FieldOptions`
stays JSON because it is genuinely heterogeneous; nine named preferences are not.

Two rules the design leans on:

- **`normalizePreferences` in `src/server/lib/preferences.ts` is the only way a stored set is
  read.** It lives under `src/server` and is imported by both the REST handler and the settings
  panel, so the bounds the UI clamps to and the bounds the server stores are the same bounds. It is
  Glide-free because it is also bundled into the page. It is idempotent, which is what lets the
  page apply a change optimistically and the server normalize the same change independently
  without the two disagreeing.
- **`user` is not the caller's to set.** The `set-preference-owner` business rule stamps it from
  `gs.getUserID()` on insert, so a request that named someone else's sys_id cannot write a row that
  person would then read as their own. The ACLs are own-row on read, write and delete; create
  carries no condition because the field it would test is one the caller does not control.

A `PUT` is a **patch** merged over the stored set, not a replacement — so a script sending
`{"theme": "dark"}` changes the theme and nothing else. The reply is what was actually kept after
clamping, and the panel takes it as the truth: ask for 50,000 preview rows and the input settles on
1,000 rather than showing a number the server refused.

Anything belonging to the data rather than the layout stays where it was — a configuration's row
count, seed and locale are columns on the configuration.

### Access

The page has its own `ui_page` ACL requiring `x_1040823_ddg_now.user`. Without it a user lacking
the role would reach a working page showing nothing, which reads as a broken application rather
than as a permissions answer.

The client calls the scoped REST API with `X-UserToken: window.g_ck` and no other credential —
the session doing the fetching is the user's own, which is the same property the server side
relies on. There is nothing in the browser that grants anything.

---

## Known gaps

- **Nothing has been executed on the instance yet.** The app builds, installs, every record is in
  place and the client bundle is served; the generator passes its full suite on Node, but Rhino
  has not run it and nobody has opened the page in a browser. See *Verifying on the instance*.
- **One locale.** `en` only. Adding one is a line in `tools/build-locale-data.mjs` and a rebuild,
  but it is ~90 KB of bundled source each.
- **No form layout is defined.** The default all-fields form applies on the native record form.
  The UI Page does not use it — it has its own editor — but someone reaching a configuration
  through the navigator gets the default.
- **No dirty-state guard.** The editor does not warn before you navigate away from unsaved
  changes, in the page or in the browser's `beforeunload`.
- **Preferences cost a round trip before the theme settles.** They live on a table, so there is
  nothing to read synchronously before the first paint: the page opens on the defaults and applies
  the account's set when `GET /preferences` answers. An account set to "dark" on a machine whose OS
  is light therefore paints light for one frame. Caching them in `localStorage` would close that
  gap and reintroduce the per-browser store the table replaced, so it is left open.
- **`userAgent`, `avatarUrl`, `imageUrl` and `dataUri`** produce plausible shapes rather than
  faker's exact output — a fixed pool, an `example.com` host, a `picsum.photos` URL and an inline
  SVG respectively. Nothing depends on their exact values.
- **Mappings are stored and read but not yet resolved at generation time.** `FieldMapping` has its
  table and its record layer; `resolveReferences` from the Bun version has not been reimplemented
  against `GlideRecordSecure`.

## Verifying on the instance

The one thing that cannot be checked from here is whether the generator runs under Rhino. From the
project root:

```bash
export SN_HOST=https://dev295575.service-now.com SN_USER=... SN_PASS=...

# 1. inference — pure TypeScript, no Glide
curl -s -u "$SN_USER:$SN_PASS" -X POST "$SN_HOST/api/x_1040823_ddg_now/ddg/infer" \
  -H 'Content-Type: application/json' -d '{"input":"{\"email\":\"a@b.com\",\"age\":31}"}'

# 2. a preview — the generator itself, nothing stored
curl -s -u "$SN_USER:$SN_PASS" -X POST \
  "$SN_HOST/api/x_1040823_ddg_now/ddg/config/06e26530e761410cad1987d07ddebcb0/generate" \
  -H 'Content-Type: application/json' -d '{"preview":true,"rowCount":3}'

# 3. a stored run, then the rows
curl -s -u "$SN_USER:$SN_PASS" -X POST \
  "$SN_HOST/api/x_1040823_ddg_now/ddg/config/06e26530e761410cad1987d07ddebcb0/generate" \
  -H 'Content-Type: application/json' -d '{"rowCount":50}'
```

Step 2 is the real one. Run it twice: the same seed must produce the same rows, and the rows must
match what `npm test` produces locally for the same configuration.

Then open the page itself — that exercises the same endpoints through the browser, plus the
component library and the Polaris frame, which curl cannot:

```
https://dev295575.service-now.com/x_1040823_ddg_now_studio.do
```

Worth checking specifically, because they are the parts most likely to be wrong and least likely
to fail loudly: that **Import a structure** returns a field list for pasted JSON; that
**Preview 10 rows** on the demo configuration renders a table; that the configuration form shows
its **Schema Field** related list; that saving a script template and pressing **Script** beside a
stored run downloads a file with the rows substituted in; and that navigating between views
updates the breadcrumb when the page is opened from the navigator rather than directly.
