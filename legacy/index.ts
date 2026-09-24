import { serve } from "bun";
import index from "./index.html";
import docs from "./docs.html";
import {
  createConfig,
  createNote,
  createScriptTemplate,
  databaseMeta,
  databaseUrl,
  deleteConfig,
  deleteDataset,
  deleteNote,
  deleteScriptTemplate,
  getConfig,
  getDataset,
  getNote,
  getScriptTemplate,
  listConfigs,
  listDatasets,
  listNotes,
  listScriptTemplates,
  saveDataset,
  updateConfig,
  updateNote,
  updateScriptTemplate,
  type ConfigInput,
  type NoteInput,
  type ScriptTemplateInput,
} from "./server/db";
import { readReferenceTargets, resolveNoteReferences } from "./server/notes";
import { authRoutes, sessionUser } from "./server/auth";
import { readPreferences, writePreferences } from "./server/preferences";
import { addShare, listShares, readEmail, removeShare, type Shareable } from "./server/share";
import { createApiKey, deleteApiKey, listApiKeys, readKeyInput } from "./server/apiKeys";
import { API_KEY_HEADER, isApiKey, requireSessionToken, requireToken } from "./server/session";
import { exportResponse, toJson } from "./server/export";
import { buildOpenApiDocument, endpointIndex } from "./server/openapi";
import {
  confirmPairing,
  notify,
  readTelegram,
  sendTestMessage,
  startPairing,
  unlinkTelegram,
  writeTelegram,
} from "./server/telegram";
import { generateRows, resolveChoiceScripts } from "./server/generate";
import { columnsOf, configColumns, datasetColumns, resolveMappings, resolveReferences } from "./server/references";
import { inferSchema } from "./server/infer";
import { DEFAULT_SCRIPT_TIMEOUT_MS, SCRIPT_ENV_PREFIX, runChoiceScript } from "./server/script";
import {
  ApiError,
  asRecord,
  boolParam,
  fail,
  formatParam,
  handler,
  intParam,
  query,
  readJson,
} from "./server/http";
import { configFileName, parseConfigFile, serializeConfigFile } from "./lib/configFile";
import { datasetName } from "./lib/datasetName";
import { MAPPING_LIMITS, parseMappings } from "./lib/mappings";
import { METADATA_LIMITS, parseMetadata } from "./lib/metadata";
import { DEFAULT_PREFERENCES } from "./lib/preferences";
import { serializeWorkspaceFile, workspaceFileName } from "./lib/workspaceFile";
import {
  DATASET_PLACEHOLDER,
  MAX_TEMPLATE_BODY_LENGTH,
  MAX_TEMPLATE_NAME_LENGTH,
  PLACEHOLDERS,
  renderScriptTemplate,
  scriptFileName,
  scriptTemplateValues,
} from "./lib/scriptTemplate";
import {
  MAX_NOTE_BODY_LENGTH,
  MAX_NOTE_TITLE_LENGTH,
  MAX_REFERENCE_COLUMNS,
  MAX_REFERENCE_ROWS,
  noteFileName,
  noteMarkdown,
} from "./lib/notes";
import { FUNCTION_NAMES, parseFormula } from "./lib/formula";
import {
  BUNDLE_COLUMNS,
  BUNDLE_LABELS,
  EDGE_CASE_VARIANTS,
  FIELD_TYPES,
  LOCALES,
  isNumericField,
  type Field,
  type FieldMapping,
} from "./lib/types";

/** Rows returned inline when the dataset was persisted and can be fetched later. */
const DEFAULT_ROW_LIMIT = 100;

/** The generator's ceiling, and the range the stored `rowCount` allows. */
const MAX_ROWS = 100_000;

const clampRows = (rows: number) => Math.max(1, Math.min(rows, MAX_ROWS));

/**
 * A route that needs an account.
 *
 * The token goes on to PocketBase untouched, which is what actually decides
 * whether the caller may see a record — this only refuses the anonymous case
 * up front, where PocketBase would otherwise answer with an empty list rather
 * than an error.
 */
function guarded<T extends { params?: Record<string, string> }>(
  fn: (token: string, req: Request & T) => Promise<Response> | Response,
) {
  return handler<T>(req => fn(requireToken(req), req));
}

function readFields(body: Record<string, unknown>): Field[] {
  const fields = body.fields;
  if (!Array.isArray(fields)) throw new ApiError('"fields" must be an array.');
  const named = (fields as Field[]).filter(f => f && typeof f.name === "string" && f.name.trim());
  if (!named.length) throw new ApiError("Add at least one named field before generating.");
  return named;
}

function readConfigInput(body: Record<string, unknown>): ConfigInput {
  const name = String(body.name ?? "").trim();
  if (!name) throw new ApiError("A configuration name is required.");

  // Strict rather than forgiving: metadata is written by hand, and a pair
  // dropped in silence is worse than one that says why it was refused.
  const metadata = parseMetadata(body.metadata);
  if (!metadata.ok) throw new ApiError(metadata.error);

  const mappings = parseMappings(body.mappings);
  if (!mappings.ok) throw new ApiError(mappings.error);

  return {
    name,
    description: String(body.description ?? ""),
    fields: readFields(body),
    mappings: mappings.mappings,
    rowCount: clampRows(Number(body.rowCount) || 25),
    seed: String(body.seed ?? ""),
    locale: String(body.locale ?? "").trim().slice(0, 20),
    metadata: metadata.metadata,
  };
}

function readScriptTemplateInput(body: Record<string, unknown>): ScriptTemplateInput {
  const name = String(body.name ?? "").trim();
  if (!name) throw new ApiError("A template name is required.");
  if (name.length > MAX_TEMPLATE_NAME_LENGTH) {
    throw new ApiError(`A template name must be ${MAX_TEMPLATE_NAME_LENGTH} characters or fewer.`);
  }

  const script = body.body ?? body.script ?? "";
  if (typeof script !== "string") throw new ApiError('"body" must be a string.');
  if (script.length > MAX_TEMPLATE_BODY_LENGTH) {
    throw new ApiError(`A template body must be ${MAX_TEMPLATE_BODY_LENGTH} characters or fewer.`);
  }

  return { name, body: script };
}

function readNoteInput(body: Record<string, unknown>): NoteInput {
  const title = String(body.title ?? "").trim();
  if (!title) throw new ApiError("A note title is required.");
  if (title.length > MAX_NOTE_TITLE_LENGTH) {
    throw new ApiError(`A note title must be ${MAX_NOTE_TITLE_LENGTH} characters or fewer.`);
  }

  const text = body.body ?? "";
  if (typeof text !== "string") throw new ApiError('"body" must be a string.');
  if (text.length > MAX_NOTE_BODY_LENGTH) {
    throw new ApiError(`A note must be ${MAX_NOTE_BODY_LENGTH.toLocaleString()} characters or fewer.`);
  }

  return { title, body: text };
}

/**
 * Shared by `POST /api/generate` and `POST /api/configs/:id/generate`.
 *
 * `?format=csv|json|sql` streams a file back instead of the JSON envelope;
 * `?save=false` skips persistence (and then returns every row, since there
 * would be nowhere else to fetch them from); `?limit=` caps the inline rows.
 */
async function runGeneration(
  token: string,
  req: Request,
  spec: {
    fields: Field[];
    /** Cross-configuration links to resolve before the first row. */
    mappings?: FieldMapping[];
    rowCount: number;
    seed: string;
    name: string;
    configId: string | null;
    locale?: string;
    /** The stored schema this ran from, for the notification to name. */
    configName?: string;
  },
): Promise<Response> {
  // Measured here rather than by the logger: what a notification reports is
  // the generating, not the round trip that carried the request in.
  const started = performance.now();
  const viaApiKey = isApiKey(token);

  try {
    const params = query(req);
    const format = formatParam(params);
    const save = boolParam(params, "save", true);

    // Every pre-resolution step reads from outside the generator, so they all
    // run before the first row: enum scripts fetch their choices, reference
    // fields load the dataset column they draw from, and mappings load the
    // column of whatever the configuration they name last produced. Mappings
    // go last, so a field carrying both is governed by the schema-level link
    // rather than by the older per-field one.
    const fields = await resolveMappings(
      await resolveReferences(await resolveChoiceScripts(spec.fields), token),
      spec.mappings ?? [],
      token,
    );
    const rows = generateRows({ ...spec, fields });

    // The dataset belongs to whoever generated it, even when the schema came
    // from someone else's shared configuration. It is named for the schema and
    // the moment it ran, so a schema generated from twice leaves two entries
    // that can be told apart.
    const dataset = save
      ? await saveDataset(token, {
          configId: spec.configId,
          name: datasetName(spec.name),
          rows,
          fieldCount: spec.fields.length,
        })
      : null;

    // Not awaited: the rows are the answer to this request, and a Telegram
    // outage must not delay them. Nothing is sent unless this account asked.
    notify(token, {
      kind: "generated",
      name: dataset?.name ?? spec.name,
      rows: rows.length,
      fields: spec.fields.length,
      configName: spec.configName ?? "",
      seed: spec.seed,
      durationMs: performance.now() - started,
      viaApiKey,
      datasetId: dataset?.id ?? "",
    });

    if (format) return exportResponse(rows, format, spec.name);

    const limit = intParam(params, "limit", save ? DEFAULT_ROW_LIMIT : 0);
    const window = limit > 0 ? rows.slice(0, limit) : rows;

    return Response.json({
      dataset,
      rows: window,
      total: rows.length,
      truncated: window.length < rows.length,
    });
  } catch (error) {
    // A run that fails at 3am is the one worth being woken for — an enum
    // script that stopped answering, a dataset a reference field pointed at
    // and no longer finds. The request still fails the way it always did.
    notify(token, {
      kind: "failed",
      name: spec.name,
      reason: error instanceof Error ? error.message : "The generation failed.",
      viaApiKey,
    });
    throw error;
  }
}

/** `GET`/`POST`/`DELETE` for one record type's share list. */
function shareRoutes(kind: Shareable) {
  return {
    GET: guarded<{ params: { id: string } }>((token, req) => listShares(token, kind, req.params.id)),
    POST: guarded<{ params: { id: string } }>(async (token, req) => {
      const body = asRecord(await readJson(req));
      return await addShare(token, kind, req.params.id, readEmail(body.email));
    }),
    DELETE: guarded<{ params: { id: string } }>((token, req) =>
      removeShare(token, kind, req.params.id, readEmail(query(req).get("email"))),
    ),
  };
}

const server = serve({
  routes: {
    /* -------------------------------- auth ------------------------------- */

    ...authRoutes,

    /* ------------------------------ discovery ---------------------------- */

    "/api": {
      GET: handler(() =>
        Response.json({
          name: "dummy-data-generator",
          docs: "Every UI action is available here. Errors are { error: string }.",
          openapi:
            "GET /api/openapi.json is this same list as an OpenAPI 3.0 document — import it into " +
            "Postman, Bruno or Insomnia and every endpoint arrives as a request.",
          auth:
            "Every endpoint below needs an account, except /api, /api/health, /api/openapi.json " +
            "and /api/auth/*. " +
            "Sign in with POST /api/auth/login and keep the session cookie (curl: -c jar -b jar), " +
            `send a PocketBase user token as \`Authorization: <token>\`, or send an API key as ` +
            `\`${API_KEY_HEADER}: pk_…\`.`,
          apiKeys: {
            what: "A long-lived credential for scripts, in place of a week-long session cookie.",
            issue: "POST /api/keys returns the key once; only its SHA-256 is stored, so it cannot be shown again.",
            use: `Send it as \`${API_KEY_HEADER}: pk_…\` on any endpoint here, or to PocketBase directly.`,
            reaches: "Exactly what its owner reaches — it resolves to the same @request.auth a session does.",
            cannot: "Issue or revoke keys. That needs a signed-in session, so a leaked key cannot outlive its revocation.",
            revoke: "DELETE /api/keys/:id, which takes effect on the next request.",
          },
          endpoints: endpointIndex(),
          generateOptions: {
            "?format=csv|json|sql": "Return the data as a file download instead of a JSON envelope",
            "?save=false": "Do not persist the dataset; all rows are returned inline",
            "?limit=N": "Cap the rows returned inline (0 = all). Defaults to 100 when saving.",
          },
          datasetNaming: {
            what: "A stored dataset is named for the schema and the run: \"Orders \u00b7 2026-09-18T14:23:05Z\".",
            stamp: "ISO-8601 UTC to the second, so repeat runs of one schema sort and stay apart.",
            name: 'The name you send (body "name", or ?name=) is the first half; the stamp is added here.',
            restamped: "A name that already carries a stamp is re-stamped rather than stacked.",
            downloads: "?format= names the file after the run; the SQL table it seeds drops the stamp.",
          },
          fieldOptions: {
            weights: "options.weights, one number per value, skews any field that picks from a pool.",
            distribution:
              'options.distribution = "normal" | "lognormal" | "pareto" reshapes a numeric draw; ' +
              "min floors it, and leaving max unset keeps the tail.",
            derivesFrom: "options.derivesFrom names the field an email, username or slug is built from.",
            bundle: 'A "bundle" field spreads correlated columns — see GET /api/field-types for each one.',
            when: "options.when is a predicate (status == 'cancelled'); the value is null where it is false.",
            after: "options.after names a date column this value must follow, so a pair is never inverted.",
            sequential: 'A "sequentialDate" field walks forward per row (options.step, jitter, businessHours).',
            nesting: 'An "object" field, and an "array" with arrayOf "object", nest up to 3 levels.',
            reference:
              'A "reference" field draws from a stored dataset column ' +
              "(options.refDataset, refField, refMode = random | cycle | unique), read with your own token.",
            locale: "Set on the schema, not the field; it applies to every name, address and phone in the run.",
          },
          fieldMappings: {
            what:
              "A configuration's `mappings` array links a field here to a column of another configuration, so " +
              "two schemas line up the way two real tables do.",
            shape:
              "{ field, fromConfig, fromField, mode }. `mode` is random | cycle | unique, the same three draws " +
              "a reference field offers.",
            resolved:
              "Against the newest dataset generated from `fromConfig`, at generation time — regenerate the " +
              "source and everything mapped to it follows, with nothing to re-point.",
            versusReference:
              'A "reference" field pins one particular dataset by id; a mapping names the configuration and ' +
              "re-reads it every run. A field carrying both is governed by the mapping.",
            columns: "GET /api/configs/:id/columns says what a mapping may draw from, and from which dataset.",
            unresolved:
              "A mapping onto a configuration that has never been generated fails the run with 409 rather " +
              "than quietly producing values that match nothing.",
            limit: `${MAPPING_LIMITS.perConfig} per configuration, and a field may be mapped only once.`,
          },
          preferences: {
            what: "Per-account defaults for new schemas, new fields, the preview and the sidebar.",
            stored: "On your own users record, so they follow the account rather than the browser.",
            keys: Object.keys(DEFAULT_PREFERENCES),
            defaults: DEFAULT_PREFERENCES,
            unknownKeys: "Dropped, and out-of-range values are clamped, so a PUT always leaves a usable set.",
          },
          workspaceExport: {
            what: "GET /api/export bundles every configuration and script template you can see, plus your preferences.",
            entries: "Each entry under `configs` is itself a valid *.ddg.json document, importable on its own.",
            datasets: "Not included — they are data, not configuration, and each has its own CSV/JSON download.",
          },
          configMetadata: {
            what: "Free-form key/value pairs on a configuration: what the schema is for.",
            shape: 'An object of strings — { "team": "billing", "ticket": "DDG-412" }. Send it on POST/PUT /api/configs.',
            values: "Text. A number or a boolean is read as text; an object or an array is refused by name.",
            limits: `${METADATA_LIMITS.pairs} pairs, keys ${METADATA_LIMITS.key} characters, values ${METADATA_LIMITS.value}.`,
            travels: "With the configuration: its *.ddg.json export, the workspace export, and ${CONFIG_METADATA}.",
          },
          sharing: {
            what: "Configurations and script templates can be shared with other accounts, read-only.",
            recipientCan: "List, read, export, and generate from it. Datasets they generate are their own.",
            recipientCannot: "Rename, edit, delete, or re-share it. Saving a change creates their own copy.",
            datasets: "Never shared — generated rows stay with the account that generated them.",
          },
          scriptTemplates: {
            what: "A chunk of JavaScript that a generated dataset is substituted into.",
            placeholder: DATASET_PLACEHOLDER,
            renderedAs: "The dataset is inserted as pretty-printed JSON — the same bytes ?format=json serves.",
            placeholders: Object.fromEntries(
              PLACEHOLDERS.map(entry => [entry.token, `${entry.description} → ${entry.example}`]),
            ),
            everyOneIsALiteral:
              "A placeholder expands to a JavaScript literal, quotes included, so a template never quotes " +
              "a substitution itself and an apostrophe in a name cannot end the string it lands in.",
            withoutAConfiguration:
              "A dataset generated from an inline schema, or from a configuration since deleted, renders " +
              "every ${CONFIG_*} placeholder as `null`.",
            unknown: "Anything else of that shape is left alone, so a template literal in the script survives.",
          },
          notes: {
            what: "Markdown about the rest of the workspace. Private to its owner — notes are never shared.",
            references:
              "[[cfg_…]], [[ds_…]], [[tpl_…]] and [[note_…]] inside a body point at other records. " +
              "Only the id is stored, so renaming a record renames it in every note that mentions it.",
            fields:
              "[[id#field]] names one field of the record instead — [[ds_…#rows]] for the generated rows, " +
              "[[cfg_…#metadata]] for its pairs. A dotted path plucks a column: [[ds_…#rows.email]]. " +
              "A field holding an array or an object renders as a table.",
            resolving:
              "POST /api/notes/references with { refs } says what those references point at now. Resolution " +
              "runs as the caller, so a reference you may not read comes back as found: false.",
            tableLimits: `A table shows at most ${MAX_REFERENCE_ROWS} rows and ${MAX_REFERENCE_COLUMNS} columns; ` +
              "the total is reported alongside, and the dataset's own export is where all of it lives.",
            export: "GET /api/notes/:id/export downloads the note as Markdown; the workspace export carries them all.",
          },
          enumChoiceScripts: {
            what: "An enum field with options.valuesFrom = \"script\" draws its choices from options.script.",
            contract: "The script is an async function body that must return an array, e.g. " +
              'const r = await fetch(url); return (await r.json()).map(x => x.name);',
            runsAt: "Once per generation, server-side, before any row is built.",
            timeoutMs: DEFAULT_SCRIPT_TIMEOUT_MS,
            env: `Only server environment variables named ${SCRIPT_ENV_PREFIX}* are visible to a snippet.`,
          },
        }),
      ),
    },

    /**
     * The same API, in the shape Postman, Bruno and the code generators read.
     *
     * The document names the origin it was fetched from, so a collection
     * imported from a running server points back at that server — and the
     * endpoint list above is built from the same operations, so the two
     * descriptions of this API cannot drift apart.
     */
    "/api/openapi.json": {
      GET: handler(req => Response.json(buildOpenApiDocument({ serverUrl: new URL(req.url).origin }))),
    },

    "/api/meta": {
      GET: guarded(async token => Response.json(await databaseMeta(token))),
    },

    /* ---------------------------- preferences ---------------------------- */

    "/api/preferences": {
      GET: guarded(async token => Response.json(await readPreferences(token))),
      // A replace rather than a merge: the body is a whole preference set, and
      // anything missing from it falls back to that preference's default.
      PUT: guarded(async (token, req) => Response.json(await writePreferences(token, await readJson(req)))),
    },

    /* ------------------------------ api keys ----------------------------- */

    "/api/keys": {
      // Managing keys needs a real session: a leaked key must not be able to
      // mint a replacement or revoke the ones you would use to stop it.
      GET: guarded(async (_token, req) => Response.json(await listApiKeys(requireSessionToken(req)))),
      POST: guarded(async (_token, req) => {
        const body = asRecord(await readJson(req).catch(() => ({})));
        const issued = await createApiKey(requireSessionToken(req), readKeyInput(body));
        return Response.json(issued, { status: 201 });
      }),
    },

    "/api/keys/:id": {
      DELETE: guarded<{ params: { id: string } }>(async (_token, req) =>
        (await deleteApiKey(requireSessionToken(req), req.params.id))
          ? Response.json({ ok: true })
          : fail("API key not found.", 404),
      ),
    },

    /* --------------------------- workspace export ------------------------ */

    /**
     * Everything this account has written, as one file: the configurations
     * and script templates it can see — its own and the ones shared with it —
     * its notes, and its preferences. Datasets stay out; they have their own
     * exports, and one of them can outweigh everything here put together.
     */
    "/api/export": {
      GET: guarded(async (token, req) => {
        const me = await sessionUser(req);
        if (!me) return fail("Sign in to continue.", 401);

        const [configs, templates, notes] = await Promise.all([
          listConfigs(token),
          listScriptTemplates(token),
          listNotes(token),
        ]);

        const file = serializeWorkspaceFile({
          ownerId: me.id,
          email: me.email,
          configs,
          templates,
          notes,
          preferences: me.preferences,
        });

        return new Response(file, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="${workspaceFileName()}"`,
          },
        });
      }),
    },

    // Liveness only — this is what the container HEALTHCHECK polls, and the
    // API being up is a separate fact from PocketBase being up (/api/meta).
    "/api/health": {
      GET: handler(() =>
        Response.json({
          status: "ok",
          uptime: Math.round(process.uptime()),
          env: process.env.NODE_ENV ?? "development",
        }),
      ),
    },

    "/api/field-types": {
      GET: guarded(() =>
        Response.json({
          groups: [...new Set(FIELD_TYPES.map(t => t.group))],
          types: FIELD_TYPES,
          formulaFunctions: FUNCTION_NAMES,
          locales: LOCALES,
          bundles: Object.entries(BUNDLE_COLUMNS).map(([kind, columns]) => ({
            kind,
            label: BUNDLE_LABELS[kind as keyof typeof BUNDLE_LABELS],
            columns,
          })),
          edgeCaseVariants: EDGE_CASE_VARIANTS,
        }),
      ),
    },

    /* ------------------------------ configs ------------------------------ */

    "/api/configs": {
      GET: guarded(async token => Response.json(await listConfigs(token))),
      POST: guarded(async (token, req) =>
        Response.json(await createConfig(token, readConfigInput(asRecord(await readJson(req)))), { status: 201 }),
      ),
    },

    "/api/configs/import": {
      POST: guarded(async (token, req) => {
        const parsed = parseConfigFile(await readJson(req));
        if (!parsed.ok) return fail(parsed.error);

        // Keep re-imports distinguishable instead of silently piling up
        // identically named records.
        const taken = new Set((await listConfigs(token)).map(c => c.name));
        let name = parsed.config.name;
        for (let suffix = 2; taken.has(name); suffix++) name = `${parsed.config.name} (${suffix})`;

        return Response.json(await createConfig(token, { ...parsed.config, name }), { status: 201 });
      }),
    },

    "/api/configs/:id": {
      GET: guarded<{ params: { id: string } }>(async (token, req) => {
        const config = await getConfig(token, req.params.id);
        return config ? Response.json(config) : fail("Configuration not found.", 404);
      }),
      PUT: guarded<{ params: { id: string } }>(async (token, req) => {
        const updated = await updateConfig(token, req.params.id, readConfigInput(asRecord(await readJson(req))));
        // Shared, not owned, lands here too: PocketBase refuses the write and
        // the record reads as missing, which is the same answer either way.
        return updated ? Response.json(updated) : fail("Configuration not found, or not yours to change.", 404);
      }),
      DELETE: guarded<{ params: { id: string } }>(async (token, req) =>
        (await deleteConfig(token, req.params.id))
          ? Response.json({ ok: true })
          : fail("Configuration not found, or not yours to delete.", 404),
      ),
    },

    "/api/configs/:id/shares": shareRoutes("configs"),

    "/api/configs/:id/export": {
      GET: guarded<{ params: { id: string } }>(async (token, req) => {
        const config = await getConfig(token, req.params.id);
        if (!config) return fail("Configuration not found.", 404);
        return new Response(serializeConfigFile(config), {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="${configFileName(config.name)}"`,
          },
        });
      }),
    },

    /**
     * What a field mapping may point at inside this configuration: the columns
     * of its newest dataset, or — when it has never been generated — the
     * columns its schema says it will have. `dataset` is null in that second
     * case, which is what the mappings editor warns on.
     */
    "/api/configs/:id/columns": {
      GET: guarded<{ params: { id: string } }>(async (token, req) => {
        const config = await getConfig(token, req.params.id);
        if (!config) return fail("Configuration not found.", 404);
        return Response.json(await configColumns(token, config));
      }),
    },

    "/api/configs/:id/generate": {
      POST: guarded<{ params: { id: string } }>(async (token, req) => {
        const config = await getConfig(token, req.params.id);
        if (!config) return fail("Configuration not found.", 404);

        // Overrides let one stored schema serve many one-off requests.
        const params = query(req);
        return await runGeneration(token, req, {
          fields: config.fields,
          mappings: config.mappings,
          rowCount: intParam(params, "rows", config.rowCount),
          seed: params.get("seed") ?? config.seed ?? "",
          locale: params.get("locale") ?? config.locale ?? "",
          name: params.get("name") ?? config.name,
          configId: config.id,
          configName: config.name,
        });
      }),
    },

    /* --------------------------- notifications ---------------------------- */

    /**
     * Where this account wants to be told about its runs, and about what.
     *
     * The bot token never comes back out: the response says whether one is
     * stored, which is all the settings page has to draw.
     */
    "/api/telegram": {
      GET: guarded(async token => Response.json(await readTelegram(token))),
      PUT: guarded(async (token, req) => Response.json(await writeTelegram(token, await readJson(req)))),
      DELETE: guarded(async token => Response.json(await unlinkTelegram(token))),
    },

    "/api/telegram/pair": {
      POST: guarded(async token => Response.json(await startPairing(token))),
    },

    /**
     * Telegram will not tell a bot which chats exist, so a chat has to speak
     * first: this looks for the code, and keeps the chat that sent it.
     */
    "/api/telegram/pair/confirm": {
      POST: guarded(async token => Response.json(await confirmPairing(token))),
    },

    "/api/telegram/test": {
      POST: guarded(async (token, req) => {
        const me = await sessionUser(req);
        if (!me) return fail("Sign in to continue.", 401);
        return Response.json(await sendTestMessage(token, me.email));
      }),
    },

    /* ----------------------------- inference ----------------------------- */

    "/api/infer": {
      POST: guarded(async (_token, req) => {
        const body = asRecord(await readJson(req));
        if (typeof body.input !== "string") throw new ApiError('"input" must be a string.');
        return Response.json(inferSchema(body.input));
      }),
    },

    "/api/formula/validate": {
      POST: guarded(async (_token, req) => {
        const body = asRecord(await readJson(req));
        if (typeof body.expression !== "string") throw new ApiError('"expression" must be a string.');

        // Accepts either full field objects or bare names.
        const raw = Array.isArray(body.fields) ? body.fields : [];
        const referenceable = raw
          .map(entry =>
            typeof entry === "string"
              ? entry
              : isNumericField(entry as Field) || (entry as Field)?.type === "boolean"
                ? (entry as Field).name
                : null,
          )
          .filter((name): name is string => Boolean(name));

        const result = parseFormula(body.expression, raw.length ? referenceable : undefined);
        return result.ok
          ? Response.json({ valid: true, references: result.refs })
          : Response.json({ valid: false, error: result.error });
      }),
    },

    "/api/enum/preview": {
      POST: guarded(async (_token, req) => {
        const body = asRecord(await readJson(req));
        if (typeof body.script !== "string") throw new ApiError('"script" must be a string.');

        const timeoutMs = body.timeoutMs === undefined ? undefined : Number(body.timeoutMs);
        const result = await runChoiceScript(body.script, {
          timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : undefined,
          maxValues: Number(body.maxValues) || undefined,
        });

        return result.ok
          ? Response.json({
              ok: true,
              values: result.values,
              count: result.values.length,
              returned: result.returned,
              truncated: result.truncated,
              durationMs: Math.round(result.durationMs),
              logs: result.logs,
            })
          : Response.json({ ok: false, error: result.error, logs: result.logs });
      }),
    },

    /* ----------------------------- generation ---------------------------- */

    "/api/generate": {
      POST: guarded(async (token, req) => {
        const body = asRecord(await readJson(req));
        const fields = readFields(body);
        const mappings = parseMappings(body.mappings);
        if (!mappings.ok) return fail(mappings.error);
        return await runGeneration(token, req, {
          fields,
          mappings: mappings.mappings,
          rowCount: clampRows(Number(body.rowCount) || 25),
          seed: String(body.seed ?? ""),
          locale: String(body.locale ?? "").trim().slice(0, 20),
          name: String(body.name ?? "").trim() || "Untitled dataset",
          configId: typeof body.configId === "string" ? body.configId : null,
        });
      }),
    },

    /* ------------------------------ datasets ----------------------------- */

    "/api/datasets": {
      GET: guarded(async (token, req) => Response.json(await listDatasets(token, intParam(query(req), "limit", 50)))),
    },

    "/api/datasets/:id": {
      GET: guarded<{ params: { id: string } }>(async (token, req) => {
        const dataset = await getDataset(token, req.params.id);
        if (!dataset) return fail("Dataset not found.", 404);

        const params = query(req);
        const offset = Math.max(0, intParam(params, "offset", 0));
        const limit = intParam(params, "limit", DEFAULT_ROW_LIMIT);
        const rows = limit > 0 ? dataset.rows.slice(offset, offset + limit) : dataset.rows.slice(offset);

        return Response.json({
          dataset: { ...dataset, rows: undefined },
          rows,
          offset,
          total: dataset.rows.length,
          truncated: offset + rows.length < dataset.rows.length,
        });
      }),
      DELETE: guarded<{ params: { id: string } }>(async (token, req) =>
        (await deleteDataset(token, req.params.id)) ? Response.json({ ok: true }) : fail("Dataset not found.", 404),
      ),
    },

    "/api/datasets/:id/columns": {
      GET: guarded<{ params: { id: string } }>(async (token, req) => {
        const columns = await datasetColumns(token, req.params.id);
        return columns ? Response.json({ columns }) : fail("Dataset not found.", 404);
      }),
    },

    "/api/datasets/:id/export": {
      GET: guarded<{ params: { id: string } }>(async (token, req) => {
        const dataset = await getDataset(token, req.params.id);
        if (!dataset) return fail("Dataset not found.", 404);
        return exportResponse(dataset.rows, formatParam(query(req)) ?? "json", dataset.name);
      }),
    },

    "/api/datasets/:id/script": {
      GET: guarded<{ params: { id: string } }>(async (token, req) => {
        const dataset = await getDataset(token, req.params.id);
        if (!dataset) return fail("Dataset not found.", 404);

        const templateId = query(req).get("templateId");
        if (!templateId) throw new ApiError('"templateId" is required; see GET /api/script-templates.');

        // A template shared with you works here exactly like one of your own.
        const template = await getScriptTemplate(token, templateId);
        if (!template) return fail("Script template not found.", 404);

        // What the run knew about itself, for the placeholders beyond the rows.
        // A configuration that has since been deleted — or that was never there,
        // for an inline schema — leaves those rendering as `null`.
        const config = dataset.configId ? await getConfig(token, dataset.configId) : null;

        // The dataset goes in as the same JSON the download serves, so a script
        // and an export of the same dataset never disagree.
        const script = renderScriptTemplate(
          template.body,
          scriptTemplateValues({
            dataset,
            config,
            datasetJson: toJson(dataset.rows),
            columns: columnsOf(dataset.rows),
          }),
        );

        return new Response(script, {
          headers: {
            "Content-Type": "text/javascript; charset=utf-8",
            "Content-Disposition": `attachment; filename="${scriptFileName(template.name)}"`,
          },
        });
      }),
    },

    /* -------------------------------- notes ------------------------------ */

    "/api/notes": {
      GET: guarded(async token => Response.json(await listNotes(token))),
      POST: guarded(async (token, req) =>
        Response.json(await createNote(token, readNoteInput(asRecord(await readJson(req)))), { status: 201 }),
      ),
    },

    /**
     * What a note's `[[…]]` references point at, resolved as the caller.
     *
     * A POST rather than a GET on the note itself, because the editor asks
     * about text that has not been saved — and because the references travel
     * better in a body than in a query string forty of them long.
     *
     * A reference naming a field answers with that field's value, shaped for
     * drawing and cut to the caps in src/lib/notes.ts — so quoting a hundred
     * thousand rows in a note costs fifty rows on the wire.
     */
    "/api/notes/references": {
      POST: guarded(async (token, req) => {
        const targets = readReferenceTargets(asRecord(await readJson(req)));
        return Response.json({ references: await resolveNoteReferences(token, targets) });
      }),
    },

    "/api/notes/:id": {
      GET: guarded<{ params: { id: string } }>(async (token, req) => {
        const note = await getNote(token, req.params.id);
        return note ? Response.json(note) : fail("Note not found.", 404);
      }),
      PUT: guarded<{ params: { id: string } }>(async (token, req) => {
        const updated = await updateNote(token, req.params.id, readNoteInput(asRecord(await readJson(req))));
        return updated ? Response.json(updated) : fail("Note not found, or not yours to change.", 404);
      }),
      DELETE: guarded<{ params: { id: string } }>(async (token, req) =>
        (await deleteNote(token, req.params.id))
          ? Response.json({ ok: true })
          : fail("Note not found, or not yours to delete.", 404),
      ),
    },

    /** The note as the Markdown file it is, references and all. */
    "/api/notes/:id/export": {
      GET: guarded<{ params: { id: string } }>(async (token, req) => {
        const note = await getNote(token, req.params.id);
        if (!note) return fail("Note not found.", 404);
        return new Response(noteMarkdown(note.title, note.body), {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="${noteFileName(note.title)}"`,
          },
        });
      }),
    },

    /* -------------------------- script templates ------------------------- */

    "/api/script-templates": {
      GET: guarded(async token => Response.json(await listScriptTemplates(token))),
      POST: guarded(async (token, req) =>
        Response.json(await createScriptTemplate(token, readScriptTemplateInput(asRecord(await readJson(req)))), {
          status: 201,
        }),
      ),
    },

    "/api/script-templates/:id": {
      GET: guarded<{ params: { id: string } }>(async (token, req) => {
        const template = await getScriptTemplate(token, req.params.id);
        return template ? Response.json(template) : fail("Script template not found.", 404);
      }),
      PUT: guarded<{ params: { id: string } }>(async (token, req) => {
        const updated = await updateScriptTemplate(
          token,
          req.params.id,
          readScriptTemplateInput(asRecord(await readJson(req))),
        );
        return updated ? Response.json(updated) : fail("Script template not found, or not yours to change.", 404);
      }),
      DELETE: guarded<{ params: { id: string } }>(async (token, req) =>
        (await deleteScriptTemplate(token, req.params.id))
          ? Response.json({ ok: true })
          : fail("Script template not found, or not yours to delete.", 404),
      ),
    },

    "/api/script-templates/:id/shares": shareRoutes("script-templates"),

    // Unknown API paths must not fall through to the SPA's HTML.
    "/api/*": handler(req => fail(`No such endpoint: ${req.method} ${new URL(req.url).pathname}. See GET /api.`, 404)),

    /**
     * The API reference: the OpenAPI document above, rendered and callable.
     *
     * A page of its own rather than a view inside the app, because it is read
     * by people who have not signed in — the document it renders needs no
     * credential, and neither does this.
     */
    "/docs": docs,

    // Serve the SPA for everything else.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🎲 Dummy Data Generator running at ${server.url}`);
console.log(`   data: ${databaseUrl()} (PocketBase)`);
console.log(`   API:  ${new URL("/api", server.url).href}`);
