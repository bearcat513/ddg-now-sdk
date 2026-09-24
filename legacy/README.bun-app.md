# Dummy Data Generator

An internal dev tool for turning a data structure into realistic dummy data. Paste a JSON
sample, a TypeScript interface, or a `CREATE TABLE` statement; the app infers a typed schema,
generates matching fake data, stores it in PocketBase, and exports it as CSV or JSON — as a
download or straight to the clipboard.

Everyone has their own account, their own schemas, templates and data, and their own preferences; a
schema or a script template can be shared, read-only, with anyone else who has an account — see
[Accounts and sharing](#accounts-and-sharing).

The app and its database run together under Docker Compose:

```bash
cp .env.example .env     # ports, PocketBase version, dashboard credentials
bun run docker:up        # http://localhost:3000, PocketBase on :8091
```

Open it and create an account — the sign-up form is the front door.

Or run the server on the host against the same PocketBase — see [Running it](#running-it).

Usable as a UI or as a local REST API — see [API](#api).

## What it does

**Infer a schema from a structure.** Paste any of these into the *Import structure* tab:

| Input | Example | Notes |
| --- | --- | --- |
| JSON | `{"email": "a@b.com", "created_at": "..."}` | Objects or arrays; arrays sample distinct values for enums |
| TypeScript | `interface User { id: string; role: "admin" \| "user" }` | Literal unions become enums, `?` becomes a null rate |
| SQL DDL | `CREATE TABLE users (id SERIAL PRIMARY KEY, ...)` | `UNIQUE`/`PRIMARY KEY` become unique fields, nullable columns get a null rate |

Types are guessed from both the field name and the value shape — `email` produces addresses,
`created_at` produces recent timestamps, `salary` produces prices, `is_active` produces booleans.
Nested objects flatten to dot paths (`address.city`), which stay flat in CSV and re-nest in JSON.

**Tune every field.** Around 195 generators, grouped by the kind of application they belong to:

| Group | What it covers |
| --- | --- |
| Identity, Person, Location, Internet | Names, emails, addresses, IPs, user agents, avatars |
| Business, Commerce, Finance | Products, SKUs, prices, IBANs, BICs, ISINs, UPC/EAN, tracking numbers, order status |
| Observability | HTTP method and status, log level, latency, trace and span IDs, stack traces, semver, git SHAs, CVEs, cron, k8s pods |
| Auth | API keys, JWTs, password hashes, OTPs, sessions, OAuth scopes, tenants, roles, plan tiers, seats |
| Network, Device | CIDR, ports, subnet masks, ASNs, IMEIs, OS and app versions, screen sizes, carriers |
| Government, Health | SSNs (reserved range only), EINs, VINs, passports, ICD-10, NPI, MRN, blood types, drugs |
| Content, Analytics | Markdown, HTML, headlines, tag lists, image URLs, embedding vectors, class labels |
| Text, Primitive, Date | Lorem, integers, floats, booleans, dates |
| Custom, Relational, Testing | Enums, templates, arrays, formulas, objects, bundles, references, cross-schema mappings, edge-case strings |
| Flavor | Flights, airports, books, food, music, animals, colors, database and hacker jargon |
| ServiceNow | `Now query`, `sys_id`, `sys_class_name`, record numbers, journal entries |

Per field you can set min/max, decimals, enum choices and weights, a distribution, date ranges and
formats, a prefix/suffix, a percentage of nulls, a uniqueness constraint, and a condition that
decides whether the field has a value at all. The `Template pattern` type composes values —
`ORD-{{number:1000-9999}}-{{letter:3}}` — and any other generator name works as a token
(`{{city}}`, `{{firstName}}`, `{{index}}`).

Identifiers that carry a check digit are generated with a valid one: IMEI, UPC-A, EAN-13, ISIN,
CUSIP and NPI all verify. `SSN` only ever uses the 900-999 area, which is permanently unassigned,
so a generated one can never collide with a real person's.

**Skew the values the way real data is skewed.** Two options do most of the work here, because
uniform data is the single biggest reason fixtures behave nothing like production.

*Weights*, on any field that picks from a pool, take one number per value:

| Field | Values | Weights | Result |
| --- | --- | --- | --- |
| `status` | `active, churned` | `9, 1` | ~10% churn, not 50% |
| `plan` | built-in | built-in | free 62%, pro 24%, team 10%, enterprise 4% |

`HTTP status`, `Log level`, `Order status`, `Role`, `Plan tier` and `Class label` ship with a
realistic weighting already; typing your own values and weights replaces it. The editor shows the
resulting percentages as you type.

*Distributions*, on any numeric field, choose the shape of the draw:

| Distribution | Shape | Use it for |
| --- | --- | --- |
| Uniform | Flat across the range | IDs, counters, anything genuinely arbitrary |
| Normal | Bell curve around a mean | Heights, scores, ages |
| Log-normal | Right-skewed, long tail | Latency, order value, file size, session length |
| Pareto | Heavy-tailed | Quantities, seat counts — mostly 1, occasionally 400 |

Min still floors the draw; leaving Max empty keeps the tail, which is the point of choosing a
skewed shape. `Latency (ms)`, `Transaction amount`, `Quantity`, `Seat count` and `File size` start
out already shaped this way, so a p95 you compute over generated data means something.

**Keep related columns agreeing with each other.** A row whose `email` has nothing to do with its
`first_name`, or whose city sits in the wrong state, breaks as soon as anything downstream assumes
the two are related. Two options fix that.

*Built from* points a field at another field in the same row:

| Field | Built from | Result |
| --- | --- | --- |
| `email` | `full_name` | `ada.lovelace34@example.com` |
| `handle` | `full_name` | `ada.lovelace` |
| `slug` | `title` | `the-post-title-slugified` |

*Correlated bundle* goes further: one draw fills several columns that agree by construction. A
bundle named `customer` occupies `customer.first_name`, `customer.email` and the rest — flat
columns in CSV, a nested object in JSON, exactly like any other dot path.

| Bundle | Columns |
| --- | --- |
| Person | `first_name`, `last_name`, `full_name`, `email`, `username`, `phone` |
| Address | `street`, `city`, `state`, `state_code`, `zip`, `country`, `country_code`, `latitude`, `longitude` |
| Payment card | `brand`, `number`, `last4`, `expiry`, `cvv` — the number matches the brand, `last4` matches the number |
| Device | `model`, `os`, `os_version`, `app_version`, `screen`, `carrier` |
| Company | `name`, `domain`, `email`, `catch_phrase`, `department` |

**Generate in another language.** *Locale* in the header applies to every name, address and phone
number in the schema. It belongs to the schema rather than to you, because a schema written for
German address formats produces nonsense generated in English. An unrecognized locale falls back to
English rather than failing the run.

**Give a field a value only sometimes.** *Only when* holds a condition; on rows where it is false
the field is `null`:

```
status == 'cancelled'                 → cancelled_at only fills in for cancelled orders
plan != 'free' and seats > 10         → enterprise-only columns stay empty elsewhere
deleted_at is null                    → a column that only applies to live records
is_active                             → a bare field is a truthiness test
```

Comparisons are `== != < <= > >=`, joined with `and`, `or` and `not`, with `is null` / `is not null`
for the blank cases, and parentheses where precedence needs saying. Numbers compare numerically and
everything else as text, so `seats > 9` is true for 10. A condition may name any column, including
one a bundle spread (`customer.email is not null`), and the field it reads is always generated
first regardless of schema order. Unknown names, self-references and syntax errors are rejected
before any row is built — like formulas, these are parsed into an AST, never `eval`-ed.

**Put timestamps in a believable order.** Two independent random dates give you `ended_at` before
`started_at` on half the rows.

*Must follow*, on any date field, pushes the value past another date column in the same row, so a
pair is always the right way round. *Sequential timestamp* walks forward from row to row instead of
drawing independently:

| Option | Effect |
| --- | --- |
| Step | Seconds between consecutive rows |
| Jitter % | How much each step varies, so the series is not a metronome |
| Business hours | Keeps every timestamp inside Mon-Fri, 09:00-17:00 |

With no start date the series ends around now. Each row is strictly after the one before it, so
event streams, session logs and bookings sort correctly and any ordering assertion holds.

**Nest structure, not just columns.** `Nested object` groups child fields into dot paths —
`address.city`, `address.zip` — flat in CSV and re-nested in JSON, to any depth up to three levels.
`Array of…` set to *object* gives the shape fixtures usually actually need:

```json
{
  "order_id": 1,
  "line_items": [
    { "sku": "LUP-865143", "qty": 2, "price": 797.59 },
    { "sku": "RLI-372294", "qty": 1, "price": 55.09 }
  ]
}
```

Array items stay real nested objects rather than dot paths, since nothing downstream would expand a
dot inside an array element.

**Point one table at another.** `Reference (foreign key)` draws its values from a column of a
dataset you already generated — pick the dataset, pick the column, pick how rows walk it:

| Draw | Meaning |
| --- | --- |
| Random | Many-to-one — the usual foreign key |
| Cycle in order | Round-robin through the pool, wrapping |
| One each | One-to-one; later rows are `null` once the pool runs out |

The pool is read at generation time, so it always reflects what that dataset holds now, and it is
read with your own token — a reference can only reach a dataset your account can already see. The
source column's types survive the trip, so a numeric key stays a number rather than arriving as
text. Generate the parents, then the children, then export both as SQL and load them in that order.

**Point one schema at another, and keep it pointed.** A reference field pins one particular
dataset by id, which is the right thing for a one-off but the wrong unit for a relationship: the
moment you regenerate the parent, every child is still pointing at yesterday's rows. A **field
mapping** names the *configuration* instead, and resolves — at generation time — against whatever
that configuration most recently produced.

Open a schema and use the **Mappings** tab:

| This field | | From configuration | Its column | Draw |
| --- | --- | --- | --- | --- |
| `customer_id` | ← | Customers | `id` | Random |
| `region` | ← | Customers | `state` | Cycle in order |

The three draws are the same three a reference field offers. A mapped field takes its values from
the far side whatever type it was declared as — that is the point of mapping it — while its own
`nullPercent`, prefix and suffix still apply on top. Regenerate Customers and the next run of
Orders picks the new rows up with nothing to re-point.

Mappings are stored on the configuration, travel with its `*.ddg.json` export, and are resolved
with your own token, so a mapping can only ever reach data your account can already see. A mapping
onto a configuration that has never been generated fails the run with a `409` that says so, rather
than quietly producing keys that match nothing. A field may be mapped only once, and a mapping onto
a field the schema no longer has is flagged in the editor and refused at generation.

**Generate the input that breaks things.** `Edge case string` draws from pools of valid-but-nasty
values, which is what a dev-facing generator is for:

| Variant | Holds |
| --- | --- |
| `text` | Empty and whitespace-only strings, `null` as text, quotes, newlines, 255- and 1024-character strings |
| `unicode` | CJK, RTL scripts, combining marks, emoji including ZWJ sequences, zero-width and full-width characters |
| `injection` | SQL, XSS, path traversal, template and log4shell-shaped payloads |
| `numeric` | `-0`, `1e309`, `NaN`, `Infinity`, values past `Number.MAX_SAFE_INTEGER`, Arabic-Indic digits, mixed separators |
| `all` | Every pool at once |

These exercise your validation, escaping and storage on purpose rather than waiting for a user to
find the gap. Nothing here executes anywhere — they are strings your own code decides what to do
with.

**Pull enum choices from a live source.** An `Enum (pick one)` field is a typed list by default,
but switching *Choices from* to **Script** lets you fetch the pool instead. The snippet is the body
of an async function and must return an array:

```js
const response = await fetch("https://api.example.com/v1/plans", {
  headers: { Authorization: `Bearer ${env.DDG_SCRIPT_API_TOKEN}` },
});
if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
const plans = await response.json();
return plans.map(plan => plan.code);
```

It runs **on the server, once per generation, before any row is built** — so there is no CORS to
work around, `env` reads the API tokens you put in the server's environment, and every row draws
from the values that source held at that moment. Two fields sharing the same snippet share one request.
*Run script* in the editor executes the same code path generation uses and shows the resulting
choices, the timing, and anything you `console.log`.

Check `response.ok` before reading the body, as the starter snippet does. An API that answers an
auth or rate-limit failure with an error envelope has no data to `.map` over, and skipping the
check turns a plain `401` into a confusing `TypeError: undefined is not an object` further down.

Returned items are stringified, trimmed of blanks and duplicates, and capped at 5,000 choices. A
snippet that throws, returns a non-array, returns nothing usable, or runs longer than 10 seconds
fails the generation with an error naming the field, rather than quietly producing nulls — and
`while (true) {}` is terminated instead of wedging the server.

Snippets run in a `node:vm` context holding `fetch`, the standard library, timers, and `env`;
`process`, `require`, and `Bun` are not reachable. `env` holds **only** the variables named
`DDG_SCRIPT_*` — put a token for a snippet in `.env` as `DDG_SCRIPT_API_TOKEN=…` and it is
readable; nothing else in the server's environment is, including PocketBase's own credentials.

That is still a guard against mistakes rather than against malice: a `node:vm` context is not a
security sandbox, and `fetch` alone reaches the network. A snippet is code this server runs,
written by whoever wrote the field — so it is worth remembering that anyone who can register an
account can write one. Keep sign-up to people you would give a shell to, or put the app behind
something that decides who reaches it.

**Calculate fields from other fields.** The `Calculated (formula)` type derives a value from the
other numeric fields in the same record, so totals actually add up:

```
subtotal        = quantity * unit_price
after_discount  = subtotal * (1 - discount_pct / 100)
tax             = round(after_discount * 0.0825, 2)
total           = after_discount + tax
```

The editor lists every referenceable field as a clickable chip and validates the expression as you
type. Supported: `+ - * / % ^`, parentheses, and `round, floor, ceil, abs, sqrt, pow, min, max`.
Reference a field by name (`unit_price`, `order.total`) or bracket it if it contains spaces
(`[line total]`). Booleans coerce to `1` / `0`, so `is_premium * 10` works.

Dependencies resolve automatically — a formula may reference another calculated field regardless
of declaration order, while output columns stay in schema order. Unknown field names, non-numeric
references, self-references, circular chains, and syntax errors are all rejected *before* any row
is generated. At runtime, a row that cannot produce a finite number (divide by zero, a
non-numeric input) yields `null` rather than a wrong value.

Expressions are parsed into an AST and evaluated by hand — there is no `eval` anywhere.

**Stand in for a ServiceNow lookup.** The `Now query` type takes a *table*, an encoded *query*, and
a *limit*, and describes the call along with a row count drawn from `1..limit`:

```json
{"table":"incident","query":"active=true^priority=1","limit":25,"count":7}
```

The table and query are echoed verbatim; only `count` varies per row, so a schema can carry a
plausible-looking query result without an instance to talk to. Nothing is sent anywhere — this is a
generator, not a client.

Each export renders it the way that format can actually hold it. JSON nests it as a real object,
encoded once — never a string of escaped JSON:

```json
{ "id": 1, "lookup": { "table": "incident", "query": "active=true", "limit": 25, "count": 7 } }
```

CSV has no nesting, so the same value collapses to a compact JSON string in its cell, quoted and
escaped like any other text. Adding a prefix or suffix asks for text either way, so that encodes
the object once and affixes your string to it.

**Reproduce a run.** Set a seed and the same schema always yields byte-identical data. Leave it
blank for fresh data each time.

**Read one record whole.** The preview truncates every cell to a line, which is fine for an ID and
useless for a stack trace, a markdown block or an array of line items. Click any row — or focus it
and press Enter — and a panel opens with the full record: every column at its real length, nested
values pretty-printed rather than squeezed onto one line, and `null` told apart from an empty
string. The arrow keys step through records without closing it, Escape closes it, and there is a
copy button on each field as well as one for the record as a whole, which yields the same nested
JSON the export holds for it.

It reads the rows already on screen rather than fetching, so stepping through is instant. That also
means it reaches only as far as the preview does — when a dataset is larger than the preview
window, the panel's header says so.

**Save and export data.** Schemas are saved as named configurations; every generation is persisted
as a dataset. Both live in PocketBase and are listed in the sidebar. Export any dataset to CSV,
JSON or SQL — download it as a file, or hit the copy button beside any format to put the same text
on the clipboard. All three read the stored rows, so you always get every row, not just the preview
window.

The SQL export is a file of `INSERT` statements, batched 500 rows at a time, with identifiers
double-quoted and literals escaped — valid in Postgres and SQLite alike. The table name comes from
the schema name (`Employee records` → `employee_records`), dot-path columns keep their names, and
objects and arrays are written as JSON text:

```sql
INSERT INTO "order_lines" ("id", "customer.email", "tags", "note") VALUES
  (1, 'ada@example.com', '["new","priority"]', 'O''Brien'),
  (2, 'bob@example.com', '[]', NULL);
```

**Drop a dataset into a script.** A *script template* is a chunk of JavaScript you write once,
holding the placeholder `${GENERATED_DATASET}` wherever the rows belong. Write it in the **Scripts**
tab, generate a dataset, then pick the template beside the preview to copy or download the script
with the data already in it:

```js
// Seed incidents
const records = ${GENERATED_DATASET};      // ← the placeholder you write

for (const record of records) {
  const gr = new GlideRecord("incident");
  gr.initialize();
  gr.setValue("short_description", record.summary);
  gr.insert();
}
```

The dataset is substituted as the same pretty-printed JSON the download serves, so a script and an
export of one dataset never disagree. Every occurrence of the placeholder is replaced, and a
template without one renders back unchanged — the editor warns when that is the case. Templates are
saved in PocketBase alongside configurations and datasets, and listed in the sidebar.

Nothing here executes: rendering is a string substitution, and the result is text for you to copy,
download, and run wherever you meant to run it.

**Share a schema as a file.** Each configuration downloads as a single self-contained
`*.ddg.json` document holding every field, type, and option — hover a configuration in the sidebar
for its download button, or use the download button in the header to export whatever is currently
on screen (saved or not). The upload button beside *Configurations* imports one back.

```json
{
  "kind": "dummy-data-generator/config",
  "version": 2,
  "name": "Order lines",
  "rowCount": 40,
  "seed": "abc",
  "locale": "de",
  "fields": [
    { "name": "customer", "type": "bundle", "options": { "bundle": "person" } },
    { "name": "qty", "type": "integer", "options": { "min": 1, "max": 9 } },
    { "name": "status", "type": "enum", "options": { "values": ["paid", "refunded"], "weights": [9, 1] } },
    { "name": "refunded_at", "type": "recentDate", "options": { "when": "status == 'refunded'" } },
    { "name": "total", "type": "computed", "options": { "expression": "qty * 2.5", "decimals": 2 } }
  ]
}
```

Version 2 added the locale and the options above; a version 1 file imports unchanged.

The files are meant to live in a repo next to the code they produce fixtures for: internal row ids
are stripped on export so the JSON stays stable and diffable, and fresh ids are assigned on import.
`kind` and `version` are optional, so a hand-written file with just `name` and `fields` imports
fine. Imports are validated before anything is saved — unknown field types, missing or duplicate
field names, unresolvable formulas, conditions naming a column that does not exist, objects nested
deeper than three levels, and files from a newer version are all rejected with a specific message,
unrecognized option keys are stripped, and out-of-range values are clamped. An imported
name that already exists gets a ` (2)` suffix rather than shadowing the existing record.

**Arrange the window.** The left-hand nav folds away with the button in its own header, and comes
back with the one that takes its place in the main header. The schema editor and the preview are
split by a divider you can drag — double-click it to even them up again, or focus it and use the
arrow keys (hold shift for a bigger step). Neither pane can be dragged past 20% or 80%, so the other
one never becomes unusable. Below a wide screen the two panes stack and the divider goes away, since
there is no vertical line left to drag.

Dragging writes the width straight to CSS and tells React once, when the pointer goes up — a
hundred-row preview and a long field list are not worth re-rendering sixty times a second to show a
number that is about to change again.

**Find a type by typing.** With around 195 generators the picker is a search box: open it and type.
It matches on the label, on the group, and on the type name that appears in `*.ddg.json` and in
template tokens — so `latencyMs`, `Latency`, and `observability` all reach the same field. Every
word has to match, in any order, so `seq date` and `date seq` both find the sequential timestamp,
and each extra word narrows. Arrow keys move, Enter picks, Escape closes.

**Set your own defaults.** The gear beside your name opens *Settings*, where a handful of
preferences decide what the app starts you with. They belong to the account rather than the
browser, so they follow you to another machine, and they save themselves as you change them.

| Preference | What it changes |
| --- | --- |
| Theme | Light, dark, or whatever the operating system says |
| Accent color | One of seven — blue, violet, emerald, amber, rose, cyan or slate |
| Rows per schema | What the *Rows* box starts at for a new schema |
| Default seed | Prefills *Seed*, so runs are reproducible by default |
| New field type | The type *Add field* starts a field as |
| Preferred export | Which download — CSV, JSON or SQL — is offered first beside the preview |
| Default script template | The template preselected when rendering a dataset into a script |
| Preview rows | How many rows the table shows; the whole dataset is still stored and exported |
| Datasets listed | How many recent datasets the sidebar keeps on screen |
| Deleting | Whether a delete asks first. It is the only confirmation there is |

The sidebar's collapsed state, which of its lists are folded shut, and the width of the editor's
two panes are preferences too, set by using them rather than by a control on this page — so a
layout you drag into shape is the one you come back to, on whichever machine you sign in from.

### Finding things

Configurations, script templates and datasets are each a foldable list in the sidebar, with a count
on the heading that stays readable while the list is shut. Above them is one search box — `⌘K`,
`Ctrl-K` or `/` from anywhere — that searches all three at once.

It looks past the names, because the thing you remember about a schema is often not what it is
called: a field name, the type you picked it by, a ticket number in its metadata, what it borrows
from another schema, or a line in the body of a script template. When a row turns up for a reason
that is not its name, it says which — `field: customer_id`, `ticket: DDG-412` — so a result whose
title does not contain what you typed does not read as a bug. While a search is running, lists with
hits open regardless of how you left them, and lists without stay shut.

The accent is a `data-accent` attribute on `<html>`, beside the class that carries the theme, and
each of the seven palettes has a light and a dark half. It moves the primary surfaces and the focus
ring — buttons, the tab underline, checkboxes, the icons that mark something as shared, and the
sidebar's current selection — and deliberately leaves two things alone: the neutral grey behind a
hovered row, which is what tells "the pointer is here" apart from "this is selected", and anything
carrying its own meaning. A delete stays red, a warning stays amber, and the preview table keeps
colouring booleans, numbers and JSON by type, because those say what a thing *is* rather than which
colour you picked. *Slate* is the app's original look, for anyone who would rather have no hue at
all.

The same page changes your password, and is where the whole-workspace export lives.

**Export everything at once.** *Export workspace* downloads one JSON file holding every
configuration and script template you can see — your own and the ones shared with you — along with
your preferences:

```json
{
  "kind": "dummy-data-generator/workspace",
  "version": 1,
  "exportedAt": "2026-09-16T12:00:00.000Z",
  "exportedBy": "you@example.com",
  "preferences": { "theme": "dark", "accentColor": "violet", "defaultRowCount": 25, "…": "…" },
  "configs": [
    { "kind": "dummy-data-generator/config", "version": 1, "name": "Order lines", "fields": [] }
  ],
  "scriptTemplates": [{ "name": "Seed incidents", "body": "const records = ${GENERATED_DATASET};" }]
}
```

Every entry under `configs` is itself a complete `*.ddg.json` document — the same bytes the
single-configuration download serves — so one lifted out of the bundle imports through the upload
button unchanged, and the two exports can never disagree. Anything that came from someone else's
account is marked `"sharedWithMe": true`. Generated datasets are deliberately left out: they are
data rather than configuration, one of them can outweigh everything else here, and each already has
its own CSV and JSON download.

## Running it

Two containers, defined in `docker-compose.yml`: `app` (this Bun server, UI and API) and
`pocketbase` (the database). `docker-compose.override.yml` publishes their host ports, and Compose
loads it automatically for a local `docker compose up` — a deploy target that names a compose file
with `-f` gets the base file, which publishes nothing.

```bash
cp .env.example .env     # required: PB_VERSION and the superuser credentials
bun run docker:up        # build + start both, in the background
bun run docker:logs      # follow both
bun run docker:down      # stop; the pb_data volume (your data) survives
```

| URL | What |
| --- | --- |
| `http://localhost:3000` | The app |
| `http://localhost:8091/_/` | PocketBase dashboard, as `PB_ADMIN_EMAIL` |

PocketBase creates its superuser on first boot from `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD`
(`docker/pb_hooks/setup/superuser.js`), and never touches it again — rotating the password in the
dashboard survives a redeploy. `bun run docker:init` resets it back to the `.env` values, which is
the way back in if the app starts answering `401`.

**Working on the app itself** is faster outside the container, with only the database in Docker:

```bash
docker compose up -d pocketbase
bun install
bun dev                 # hot reload, http://localhost:3000
PORT=4000 bun dev       # or anywhere else
```

Bun loads `.env` too, so `bun dev` finds the same credentials and, through `PB_PORT`, the same
PocketBase. `POCKETBASE_URL` overrides the location outright — Compose sets it to
`http://pocketbase:8080` for the containerised app.

## Accounts and sharing

Sign-up is open: an email address and a password of at least eight characters make an account, and
you are signed in immediately. Everything you then create — configurations, script templates,
generated datasets — is yours, and nobody else's list, count or export can reach it.

**Sharing** is the deliberate exception, and it covers the two things worth passing around: a
configuration and a script template. Hover one in the sidebar and use the share button, or use the
one in the header for the schema on screen, then type the address of someone who already has an
account. What they get is read-only:

| A recipient can | A recipient cannot |
| --- | --- |
| Open it, and see it under *Shared with me* | Rename, edit or delete it |
| Export it as `*.ddg.json` | Share it on to anyone else |
| Generate data from it — the rows are theirs, not yours | See who else it is shared with |
| Render their own datasets through a shared template | |

Saving a change to something shared with you does not fail — it keeps your own copy, owned by you.
The *Save* button says so. A recipient can also drop a share from their own list, and the owner can
revoke it at any time; either way it simply disappears from the recipient's sidebar.

Generated datasets are never shared. Rows belong to the account that generated them, even when the
schema came from someone else.

Addresses are only ever resolved, never listed: sharing looks up the address you typed and tells
you whether an account exists for it, and nothing anywhere can enumerate the accounts on the
instance. The owner of a record sees the addresses it is shared with; a recipient sees only who
shared it with them.

**Upgrading from the single-account version?** Records made before accounts existed have no owner
and are invisible until somebody claims them, so the first account to register inherits all of
them. Every account created after that starts empty.

## API keys

A session lasts a week and lives in a cookie, which is right for a browser and useless for a cron
job. An **API key** is the second way to prove who you are: a long-lived credential a script sends
as a header, issued from *Settings → API keys* or from `POST /api/keys`.

```bash
# issue one — this response is the only place the key will ever appear
curl -sb jar -X POST localhost:3000/api/keys -H 'content-type: application/json' \
  -d '{"name":"nightly seed job","expiresInDays":90}' | jq -r .key

# then skip signing in altogether
curl -s localhost:3000/api/configs -H 'X-API-Key: pk_…' | jq
```

A key resolves to the same `@request.auth` a session does — the hook in `docker/pb_hooks/keys/`
sets it before any collection rule is evaluated — so it reaches **exactly** what its owner reaches
and nothing more, under the same rules, with no second access model to keep in step. That also
means it works against PocketBase's own REST API directly, not just the endpoints here.

| A key can | A key cannot |
| --- | --- |
| Everything its owner can do with a session | Issue a key |
| Reach PocketBase's REST API directly, with the same header | Revoke a key |
| Outlive a week — or never expire at all | Be read back after it is issued |

Issuing and revoking are deliberately the one thing a key may not do. They are how you recover from
a leaked key, so leaving them to a key would let a leaked one mint its replacement and survive being
revoked — both halves refuse it, here and in PocketBase. Revocation is a delete, and it takes effect
on the key's next request.

Only the SHA-256 of a key is stored, in a hidden field, so the raw value exists in one response and
nowhere else; a database that leaks hands over nothing usable, and a lost key is replaced rather
than recovered. Each account may hold 25 at a time, and closing an account revokes its keys.

## Telegram notifications

A key turns this into something a cron job uses, and a cron job is something nobody watches. Under
*Settings → Telegram notifications* an account can be told when a run finishes or fails, in a chat
rather than in a log it would have to go and read.

**The bot.** Notifications go through a Telegram bot, and there are two ways to have one. Whoever
runs the server can set `TELEGRAM_BOT_TOKEN` in `.env`, and then every account on it can link a chat
with no setup of their own. Otherwise an account brings its own token from
[@BotFather](https://t.me/BotFather) — `/newbot`, answer twice — and pastes it into the settings
page, where it is stored on that account's own record and never sent back to the browser. An
account's own token wins over the server's.

**The chat.** Telegram will not tell a bot which chats exist: a chat has to speak first. So the
settings page issues a short pairing code, you send it to the bot (the link does it for you), and
*I've sent it* looks for that exact code and keeps the chat it arrived in — which is also what
proves the chat is yours. Messages are read without consuming them, so two accounts pairing on one
shared bot cannot swallow each other's. A group or a channel can be set by hand instead, with
`chatId` on `PUT /api/telegram`.

**What gets sent.** A finished run says what ran, how many rows and fields, how long it took, the
seed, and the dataset id to fetch it by; a failed one says why it failed — an enum script that
stopped answering, a dataset a reference field no longer finds. Both are off by default, and two
settings keep them from becoming noise: a floor under the rows worth reporting, and *only for API
keys*, which is on by default because a run you made in the editor already has its rows on screen.

| Setting | What it does |
| --- | --- |
| Notifications | The switch. Off sends nothing and leaves the rest configured |
| A run finishes / A run fails | Which events are worth a message |
| Only for API keys | Stay quiet for runs made in the editor |
| Smallest run worth reporting | Rows. `0` reports every run, however short |

The message is sent by the same request that caused it, using that caller's own token, and it is not
awaited: a Telegram outage delays no rows and fails no run. What went wrong instead lands on the
settings record, which is what the page shows under the toggles — so a bot that was blocked or a
chat that was deleted says so rather than leaving you waiting on a message that is not coming.

## Storage

Everything lives in PocketBase, in five collections created by `docker/pb_migrations/`:

| Collection | Holds |
| --- | --- |
| `configs` | Saved schemas — the field list as JSON, plus row count, seed and locale |
| `datasets` | One record per generation, rows stored whole as JSON |
| `script_templates` | Script bodies with a `${GENERATED_DATASET}` placeholder |
| `api_keys` | One record per [API key](#api-keys) — its SHA-256 and never the key |
| `telegram_settings` | One per account: where [notifications](#telegram-notifications) go, and about what |

The first three carry an `owner`, and the two shareable ones a `sharedWith` list; a key and a
notification setting carry the `user` they belong to, and are deleted with them. Ids stay the readable
`cfg_…` / `ds_…` / `tpl_…` strings the API has always used; the migration widens PocketBase's
fixed-length id field to allow them. Deleting a configuration leaves the datasets generated from it
in place, with their link cleared. Closing an account takes its records with it.

Notification settings do get a collection, for one reason: an account's own bot token can live in
it. The preferences blob below rides along with every session — it is handed to the browser on
sign-in — and a credential must not travel that way. That record is read only when something is
about to be sent, by the request that is about to send it.

Preferences get no collection of their own: they are one `preferences` JSON field on the account's
own `users` record, since a preference set belongs to exactly one account, is read with the session
on every page load, and should die with the account. They inherit the rule the `users` collection
already has — an account may read and update itself, and nothing else — and every read and write
goes through one normalizer (`src/lib/preferences.ts`), so a stored blob that is missing a key,
holds a stale one, or was written by hand still reads back as a complete, in-range set.

**Who may do what is decided by PocketBase, not by this server.** Every collection carries API
rules — `owner = @request.auth.id || sharedWith.id ?= @request.auth.id` to read a configuration,
owner-only to change it — and the Bun server holds no credentials of its own: it passes your token
through and PocketBase evaluates those rules against *you*. A mistake in a route here cannot hand
one account another's records, because the route has no authority to hand them over with. The
browser never holds a PocketBase token either; it lives in an httpOnly cookie.

Two hooks back that up (`docker/pb_hooks/`): `owner` is stamped from the authenticated account on
create and restored on update, so neither can be set from a request body, and the sharing endpoints
run inside PocketBase, where resolving an address does not require the ability to read the user
list.

The data is in the `pb_data` Docker volume. `docker compose down` keeps it; `docker compose down -v`
is what deletes it. A stored dataset is capped at 64 MB of JSON — a run over that is refused with a
message suggesting `?save=false`, which streams the rows back without storing them.

## API

Everything the UI can do is a REST call on the same `Bun.serve` router — no separate API server, no
extra process. `GET /api` returns the endpoint index, so the app documents itself:

```bash
curl -s localhost:3000/api | jq
```

Everything except `/api`, `/api/health`, `/api/openapi.json` and `/api/auth/*` needs a session.
Sign in once with a cookie jar and every later call is authenticated:

```bash
curl -sc jar -X POST localhost:3000/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"your-password"}'
curl -sb jar localhost:3000/api/configs | jq
```

An `Authorization: <token>` header works too, for a script holding a PocketBase user token, and an
`X-API-Key: pk_…` header works for a script holding an [API key](#api-keys). Anything else gets a
`401`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api` | Endpoint index |
| `GET` | `/api/health` | Liveness check — what the container healthcheck polls |
| `GET` | `/api/openapi.json` | This API as an OpenAPI 3.0 document, for Postman, Bruno and Insomnia |
| `POST` | `/api/auth/register` | `{ email, password, name? }` → create an account and sign in |
| `POST` | `/api/auth/login` | `{ email, password }` → start a session |
| `POST` | `/api/auth/logout` | End the session |
| `GET` | `/api/auth/me` | The signed-in account, with its preferences |
| `POST` | `/api/auth/password` | `{ currentPassword, newPassword }` → change it |
| `GET` `PUT` | `/api/preferences` | Read / replace this account's preferences |
| `GET` `PUT` `DELETE` | `/api/telegram` | Read / replace / clear [Telegram notification](#telegram-notifications) settings |
| `POST` | `/api/telegram/pair` | Issue a pairing code to send the bot |
| `POST` | `/api/telegram/pair/confirm` | Look for that code, and keep the chat it came from |
| `POST` | `/api/telegram/test` | Send a test message to the linked chat |
| `GET` `POST` | `/api/keys` | List / issue API keys — the `POST` response is the only one carrying the key |
| `DELETE` | `/api/keys/:id` | Revoke an API key |
| `GET` | `/api/export` | Download every configuration and script template as one JSON file |
| `GET` | `/api/meta` | PocketBase URL, reachability and your record counts |
| `GET` | `/api/field-types` | Every field type, its group and options, plus the locale and bundle catalogs |
| `POST` | `/api/infer` | `{ input }` → infer fields from JSON / TypeScript / SQL |
| `POST` | `/api/formula/validate` | `{ expression, fields }` → validate a calculated field |
| `POST` | `/api/enum/preview` | `{ script }` → run an enum's choice script and return the values it yields |
| `GET` `POST` | `/api/configs` | List / create configurations |
| `GET` `PUT` `DELETE` | `/api/configs/:id` | Read / replace / delete a configuration |
| `GET` `POST` `DELETE` | `/api/configs/:id/shares` | List / add (`{ email }`) / remove (`?email=`) a recipient |
| `GET` | `/api/configs/:id/export` | Download a configuration as `*.ddg.json` |
| `POST` | `/api/configs/import` | Create a configuration from a `*.ddg.json` body |
| `GET` | `/api/configs/:id/columns` | What a field mapping may draw from this schema, and from which dataset |
| `POST` | `/api/configs/:id/generate` | Generate using a stored schema |
| `POST` | `/api/generate` | Generate from an inline schema |
| `GET` | `/api/datasets` | List datasets (`?limit=`) |
| `GET` `DELETE` | `/api/datasets/:id` | Read rows (`?limit=` `?offset=`) / delete |
| `GET` | `/api/datasets/:id/columns` | A dataset's column names — what a reference field points at |
| `GET` | `/api/datasets/:id/export` | Download a dataset (`?format=csv\|json\|sql`) |
| `GET` | `/api/datasets/:id/script` | Render a dataset into a script template (`?templateId=`) |
| `GET` `POST` | `/api/script-templates` | List / create script templates |
| `GET` `PUT` `DELETE` | `/api/script-templates/:id` | Read / replace / delete a script template |
| `GET` `POST` `DELETE` | `/api/script-templates/:id/shares` | List / add (`{ email }`) / remove (`?email=`) a recipient |

Both generate endpoints accept the same output options:

| Param | Effect |
| --- | --- |
| `?format=csv\|json\|sql` | Return a file download instead of the JSON envelope |
| `?save=false` | Skip persistence — all rows come back inline, nothing is stored |
| `?limit=N` | Cap the rows returned inline; `0` means all. Defaults to 100 when saving |

`POST /api/configs/:id/generate` also takes `?rows=`, `?seed=`, `?name=` and `?locale=` to override
the stored values, so one saved schema can serve many one-off requests.

### OpenAPI

`GET /api/openapi.json` is the same API as an OpenAPI 3.0 document — every endpoint, its parameters,
what it answers with, and the three ways to authenticate. It needs no credential to read, and the
`servers` entry names the host it was fetched from, so a collection imported from a running server
points back at that server.

```bash
curl -s localhost:3000/api/openapi.json -o dummy-data-generator.openapi.json
```

In **Postman**, *Import → Link* and paste the URL; in **Bruno**, *Import Collection → OpenAPI V3*.
Both arrive with every request built and the `X-API-Key` header wired to a collection variable — set
it to an [API key](#api-keys) and the whole collection reaches exactly what you do. *Settings →
OpenAPI spec* has the same download and the link to paste.

The document is generated from one list of operations that `GET /api` also prints its index from, so
the two descriptions of this API cannot drift apart — and `bun test` fails if an endpoint is
described there without being a route this server answers.

### Recipes

`jar` below is the cookie jar from the sign-in above; every call carries it.

```bash
# 100 rows of CSV from a saved schema, straight to a file, nothing persisted
curl -sb jar -X POST 'localhost:3000/api/configs/cfg_abc123/generate?rows=100&format=csv&save=false' \
  -o fixtures.csv

# reproducible JSON for a test fixture — same seed, same bytes, every time
curl -sb jar -X POST 'localhost:3000/api/configs/cfg_abc123/generate?seed=ci&format=json&save=false' \
  -o fixtures.json

# turn a table definition straight into data
curl -sb jar localhost:3000/api/infer -H 'content-type: application/json' \
  -d '{"input":"CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE)"}' \
  | jq '{name: "users", rowCount: 50, fields: .fields}' \
  | curl -sb jar -X POST 'localhost:3000/api/generate?format=csv&save=false' \
      -H 'content-type: application/json' --data-binary @-

# seed a database: parents first, children referencing them, both as SQL
users=$(curl -sb jar -X POST localhost:3000/api/generate -H 'content-type: application/json' \
  -d '{"name":"users","rowCount":100,"fields":[{"id":"a","name":"id","type":"autoIncrement"},
       {"id":"b","name":"person","type":"bundle","options":{"bundle":"person"}}]}' | jq -r .dataset.id)

curl -sb jar "localhost:3000/api/datasets/$users/columns" | jq
curl -sb jar "localhost:3000/api/datasets/$users/export?format=sql" > users.sql

curl -sb jar -X POST 'localhost:3000/api/generate?format=sql&save=false' -H 'content-type: application/json' \
  -d "{\"name\":\"orders\",\"rowCount\":500,\"fields\":[
       {\"id\":\"a\",\"name\":\"id\",\"type\":\"autoIncrement\"},
       {\"id\":\"b\",\"name\":\"user_id\",\"type\":\"reference\",
        \"options\":{\"refDataset\":\"$users\",\"refField\":\"id\",\"refMode\":\"random\"}}]}" > orders.sql

# a log stream: ordered timestamps, weighted statuses, a log-normal latency tail
curl -sb jar -X POST 'localhost:3000/api/generate?save=false' -H 'content-type: application/json' \
  -d '{"name":"requests","rowCount":1000,"fields":[
       {"id":"a","name":"ts","type":"sequentialDate","options":{"step":30,"jitter":60}},
       {"id":"b","name":"status","type":"httpStatus"},
       {"id":"c","name":"latency_ms","type":"latencyMs"},
       {"id":"d","name":"error","type":"stackTrace","options":{"when":"status >= 500"}}]}' | jq '.rows[0]'

# generate the same schema in another language
curl -sb jar -X POST 'localhost:3000/api/configs/cfg_abc123/generate?locale=ja&save=false' | jq '.rows[0]'

# back up everything you have configured, and check what came with it
curl -sb jar localhost:3000/api/export -o ddg-workspace.json
jq '{configs: (.configs | length), templates: (.scriptTemplates | length)}' ddg-workspace.json

# take one configuration back out of that bundle and import it
jq '.configs[0]' ddg-workspace.json \
  | curl -sb jar -X POST localhost:3000/api/configs/import \
      -H 'content-type: application/json' --data-binary @-

# raise the default row count without touching the rest
curl -sb jar localhost:3000/api/preferences | jq '.defaultRowCount = 500' \
  | curl -sb jar -X PUT localhost:3000/api/preferences \
      -H 'content-type: application/json' --data-binary @-

# move a configuration between machines
curl -sb jar localhost:3000/api/configs/cfg_abc123/export -o order-lines.ddg.json
curl -sb jar -X POST localhost:3000/api/configs/import -H 'content-type: application/json' \
  --data-binary @order-lines.ddg.json

# page through a stored dataset
curl -sb jar 'localhost:3000/api/datasets/ds_abc123?limit=50&offset=100'

# save a script template, then render a dataset into it
curl -sb jar -X POST localhost:3000/api/script-templates -H 'content-type: application/json' \
  -d '{"name":"Seed incidents","body":"const records = ${GENERATED_DATASET};"}'
curl -sb jar 'localhost:3000/api/datasets/ds_abc123/script?templateId=tpl_abc123' -o seed-incidents.js

# share a schema with a teammate, see the list, then take it back
curl -sb jar -X POST localhost:3000/api/configs/cfg_abc123/shares \
  -H 'content-type: application/json' -d '{"email":"teammate@example.com"}'
curl -sb jar localhost:3000/api/configs/cfg_abc123/shares
curl -sb jar -X DELETE 'localhost:3000/api/configs/cfg_abc123/shares?email=teammate@example.com'

# check what an enum's choice script currently returns, without generating anything
curl -sb jar localhost:3000/api/enum/preview -H 'content-type: application/json' \
  -d '{"script":"const r = await fetch(\"https://api.example.com/plans\"); return (await r.json()).map(p => p.code);"}'
```

### Conventions

Errors are always `{ "error": "..." }` with a `4xx` status. A missing or expired session is `401`;
a record that is not yours — or does not exist — is `404` either way, so the API never confirms the
existence of something you cannot see. Validation happens before anything is written — a bad formula, an unknown field type or a malformed body is rejected up front. Unknown
`/api/*` paths return a JSON 404 rather than the SPA's HTML, so a typo in a script fails loudly.
Every API request is logged to the terminal with its status and duration:

```
POST /api/configs/cfg_abc123/generate?rows=100&format=csv → 200 (12.4ms)
```

The server listens on `PORT` (default 3000) and is deliberately same-origin only — no CORS headers,
so a random page in your browser cannot reach a tool that reads and writes local files.

## CLI

The same API, as a command you can put in a cron job: `ddg`. It is one file — Bun's
[single-file executable](https://bun.com/docs/bundler/executables) bundles the CLI and the Bun
runtime together — so the machine that runs it needs no Bun, no `node_modules` and no checkout.

```bash
bun run cli:build                        # dist/cli/ddg, for this platform
bun run cli:build --all                  # every platform: macOS, Linux, Windows
bun run cli:build --target bun-linux-x64 --outdir build
bun run cli:build --bytecode             # slower build, faster start

bun run cli -- configs list              # or run it from source, no build
```

Point it at a server and sign in once; the token lands in `~/.config/ddg/config.json`, mode `0600`.

```bash
ddg login --url http://localhost:3000    # asks for the password, never echoes it
ddg keys new "nightly seed job" --days 90 # a key for the machine that will do this unattended
DDG_API_KEY=pk_… ddg configs list         # what a cron job does instead of signing in
```

| Command | What it does |
| --- | --- |
| `ddg login` / `logout` / `whoami` | Sign in, forget the credential, say who you are |
| `ddg status` | Whether the server and PocketBase are up — no credential needed |
| `ddg keys [list \| new <name> \| rm <id>]` | Issue and revoke [API keys](#api-keys) (needs a session, not a key) |
| `ddg configs [list \| show \| export \| import \| rm]` | The saved schemas, and the `*.ddg.json` file they travel as |
| `ddg generate <config-id>` | Generate from a stored schema — `--rows` `--seed` `--locale` `--name` override it |
| `ddg generate --file schema.ddg.json` | Generate from a schema file, storing nothing but the dataset |
| `ddg datasets [list \| show \| export \| script \| rm]` | Generated data: rows, downloads, and a script template rendered |
| `ddg templates` / `ddg notes` | List, read and delete the rest of the workspace |
| `ddg infer <file\|->` | JSON / TypeScript / SQL → a schema, `--as-config` to write the file |
| `ddg openapi` / `ddg endpoints` | The spec, and the server's own endpoint index |

Two flags run through everything: `--json` prints the API's own answer for `jq` to read, and
`--url` points at another server for one command. Every `--out FILE` also writes to standard output
when it is left off, so a pipe works as well as a filename.

```bash
# a CSV fixture from a saved schema, reproducible, nothing kept on the server
ddg generate cfg_abc123 --rows 500 --seed ci --format csv --no-save > fixtures.csv

# a sample of real data becomes fake data, without opening the app
ddg infer sample.json --as-config --name Orders --out orders.ddg.json
ddg generate --file orders.ddg.json --rows 1000 --format sql --out orders.sql

# what a script reads
ddg datasets list --json | jq -r '.[0].id'
```

Where it looks, in order: a flag, then `DDG_URL` / `DDG_API_KEY` / `DDG_TOKEN` in the environment,
then the settings file, then `http://localhost:3000`. Exit codes are `0` done, `2` for a command
typed wrong — an unknown flag is refused before a request goes out — and `1` for everything the
server refused.

## Layout

```
src/
  index.ts              Bun.serve routes (API + SPA)
  lib/types.ts          Field types shared by server and UI
  lib/formula.ts        Calculated-field and `when` parsers + evaluators (shared)
  lib/configFile.ts     Portable *.ddg.json build + validate (shared)
  lib/preferences.ts    Per-account preferences + the one normalizer (shared)
  lib/workspaceFile.ts  The whole-workspace bundle (shared)
  lib/scriptTemplate.ts Dataset-into-script substitution (shared)
  lib/rows.ts           Dot-path rows: nesting, and one value as text (shared)
  lib/api.ts            Typed fetch client
  server/infer.ts       JSON / TypeScript / SQL → schema
  server/generate.ts    Schema → rows (faker-backed)
  server/export.ts      CSV, JSON and SQL serializers
  server/references.ts  Foreign keys: a dataset column becomes a field's pool
  server/db.ts          Storage: configs, datasets, script templates
  server/pocketbase.ts  Per-request PocketBase client, error mapping
  server/session.ts     The session cookie and the token in it
  server/auth.ts        Register, sign in, sign out, change password
  server/preferences.ts Preferences on the account's own users record
  server/share.ts       Share endpoints, proxied to PocketBase
  server/http.ts        Route helpers: errors, params, logging
  components/app/       Sidebar, schema editor, preview + row inspector, auth, sharing, settings
  components/app/ApiKeys.tsx      Issuing, listing and revoking API keys, inside Settings
  components/app/TypeSelect.tsx   The searchable field-type picker
  components/app/SplitHandle.tsx  The draggable divider between the editor panes
  cli/run.ts            The CLI: parse, dispatch, exit code
  cli/commands.ts       Every command it answers to, as one table
  cli/client.ts         The API from a terminal: absolute URL + explicit credential
  cli/settings.ts       ~/.config/ddg/config.json, and where a credential comes from

cli-build.ts            The `ddg` single-file executable (bun build --compile)

styles/globals.css      Design tokens, the dark theme, and the seven accent palettes

docker/
  bun.dockerfile        The app image
  pb.dockerfile         PocketBase + the hooks and migrations below
  pb_migrations/        Collections, ownership fields, access rules, preferences
  pb_hooks/             Superuser bootstrap, ownership, sharing endpoints, API-key issuing + middleware
docker-compose.yml           Both services; publishes nothing
docker-compose.override.yml  Local host ports + live hooks/migrations mounts
```

## Scripts

```bash
bun dev             # hot-reloading dev server
bun test            # inference, generation, export, editor rendering, end-to-end API tests
bun start           # production mode
bun run build
bun run cli:build   # dist/cli/ddg, the standalone CLI (--all for every platform)
bun run cli -- …    # the same CLI from source

bun run docker:up    # build + start app and PocketBase
bun run docker:down  # stop both, keep the data
bun run docker:logs  # follow both
bun run docker:init  # reset the PocketBase superuser to the .env credentials
```

`bun test` runs the API suite against a throwaway PocketBase container on its own port and its own
empty volume, rebuilt from `docker/pb.dockerfile` on every run — so a change to the access rules or
the sharing hooks is what gets tested, and the data `docker:up` is holding is never touched.
Without Docker those tests skip, with a note saying so, and everything that does not touch storage
still runs. `PB_TEST_URL` points them at an instance you started yourself instead.
