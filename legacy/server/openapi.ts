/**
 * The API, written out as an OpenAPI document.
 *
 * Postman, Bruno, Insomnia and the code generators all read this, so it is
 * served whole from `GET /api/openapi.json` and the file a browser saves is
 * the same bytes those tools fetch.
 *
 * It is also the only list of endpoints: `GET /api` prints its index rather
 * than keeping a second copy, so a route that is renamed here cannot go on
 * being advertised under its old name there.
 *
 * Version 3.0.3 rather than 3.1: every tool that matters reads 3.0 today, and
 * nothing described here needs what 3.1 added.
 *
 * Where a bound is enforced elsewhere — preference limits, metadata sizes,
 * template lengths — it is imported rather than retyped, so the document
 * cannot promise a limit the server does not keep.
 */
import { MAPPING_LIMITS } from "../lib/mappings";
import { METADATA_LIMITS } from "../lib/metadata";
import { DEFAULT_TELEGRAM_SETTINGS, TELEGRAM_LIMITS } from "../lib/telegram";
import { ACCENT_COLORS, DEFAULT_PREFERENCES, PREFERENCE_LIMITS, THEMES } from "../lib/preferences";
import { DATASET_PLACEHOLDER, MAX_TEMPLATE_BODY_LENGTH, MAX_TEMPLATE_NAME_LENGTH } from "../lib/scriptTemplate";
import {
  MAX_NOTE_BODY_LENGTH,
  MAX_NOTE_REFERENCES,
  MAX_NOTE_TITLE_LENGTH,
  MAX_REFERENCE_COLUMNS,
  MAX_REFERENCE_ROWS,
  REFERENCE_FIELDS,
  type ReferenceKind,
} from "../lib/notes";
import { FIELD_TYPES, LOCALES } from "../lib/types";
import { API_KEY_HEADER, API_KEY_PREFIX, SESSION_COOKIE } from "./session";

type Json = Record<string, unknown>;

export type OpenApiDocument = {
  openapi: string;
  info: Json;
  servers: Json[];
  tags: Json[];
  security: Json[];
  paths: Record<string, Json>;
  components: Json;
};

/** Matches package.json; the document's own version, not the spec's. */
const API_VERSION = "0.1.0";

/** What a browser saves it as, and what the tools show in their import list. */
export const OPENAPI_FILE_NAME = "dummy-data-generator.openapi.json";

/** Where the document lives, for the UI's download link and the index below. */
export const OPENAPI_PATH = "/api/openapi.json";

/** Used when nothing better is known — a spec has to name some server. */
const FALLBACK_SERVER_URL = "http://localhost:3000";

/* ------------------------------- small pieces ------------------------------ */

const ref = (schema: string) => ({ $ref: `#/components/schemas/${schema}` });
const responseRef = (response: string) => ({ $ref: `#/components/responses/${response}` });
const array = (schema: Json) => ({ type: "array", items: schema });

const jsonResponse = (description: string, schema: Json) => ({
  description,
  content: { "application/json": { schema } },
});

const jsonBody = (description: string, schema: Json) => ({
  required: true,
  description,
  content: { "application/json": { schema } },
});

/** A file download: the tools show it as text rather than trying to parse it. */
const fileResponse = (description: string, mediaType: string) => ({
  description,
  headers: {
    "Content-Disposition": {
      description: "`attachment`, with the filename the download is saved as.",
      schema: { type: "string" },
    },
  },
  content: { [mediaType]: { schema: { type: "string" } } },
});

const idParam = (what: string) => ({
  name: "id",
  in: "path",
  required: true,
  description: `The ${what}'s id.`,
  schema: { type: "string" },
});

const queryParam = (name: string, description: string, schema: Json) => ({
  name,
  in: "query",
  required: false,
  description,
  schema,
});

/** The three query parameters both generate endpoints share. */
const generateParams = [
  queryParam(
    "format",
    "Return the rows as a file download instead of the JSON envelope.",
    { type: "string", enum: ["csv", "json", "sql"] },
  ),
  queryParam(
    "save",
    "`false` skips persistence — nothing is stored, and every row comes back inline.",
    { type: "boolean", default: true },
  ),
  queryParam("limit", "Cap the rows returned inline. `0` returns all of them.", {
    type: "integer",
    minimum: 0,
    default: 100,
  }),
];

/** The one 200 that can answer with JSON or with a file, depending on `?format`. */
const generateResponse = {
  description:
    "The generated rows. JSON by default; `?format=` answers with the file instead, " +
    "in which case the body is the CSV, JSON or SQL itself.",
  content: {
    "application/json": { schema: ref("GenerateResult") },
    "text/csv": { schema: { type: "string" } },
    "application/sql": { schema: { type: "string" } },
  },
};

/* -------------------------------- operations ------------------------------- */

type Operation = {
  method: "get" | "post" | "put" | "delete";
  /** OpenAPI-style, with `{id}` where the route table writes `:id`. */
  path: string;
  tag: string;
  operationId: string;
  /** One line. This is also what `GET /api` prints beside the route. */
  summary: string;
  description?: string;
  /** True where no credential is needed at all. */
  anonymous?: boolean;
  parameters?: Json[];
  requestBody?: Json;
  /** Merged over the defaults for this operation's kind. */
  responses: Record<string, Json>;
};

/**
 * Every endpoint, in the order `GET /api` lists them.
 *
 * The summaries are that index: they are written to read as a line in it,
 * which is also what a tool's sidebar shows beside the request.
 */
export const OPERATIONS: Operation[] = [
  /* ------------------------------ discovery ----------------------------- */
  {
    method: "get",
    path: "/api",
    tag: "Discovery",
    operationId: "getApiIndex",
    summary: "This index, the auth options, and the generator's own rules",
    anonymous: true,
    responses: { "200": jsonResponse("The index.", { type: "object", additionalProperties: true }) },
  },
  {
    method: "get",
    path: "/api/health",
    tag: "Discovery",
    operationId: "getHealth",
    summary: "Liveness check for this server",
    description: "Answers whether or not PocketBase is reachable — that is `GET /api/meta`.",
    anonymous: true,
    responses: { "200": jsonResponse("The server is up.", ref("Health")) },
  },
  {
    method: "get",
    path: OPENAPI_PATH,
    tag: "Discovery",
    operationId: "getOpenApiDocument",
    summary: "This API as an OpenAPI 3.0 document, for Postman, Bruno and friends",
    description:
      "Import it by URL to keep it current, or save the file. The `servers` entry names the host it " +
      "was fetched from, so an imported collection points back at this server.",
    anonymous: true,
    responses: { "200": jsonResponse("The document.", { type: "object", additionalProperties: true }) },
  },

  /* -------------------------------- auth -------------------------------- */
  {
    method: "post",
    path: "/api/auth/register",
    tag: "Auth",
    operationId: "register",
    summary: "{ email, password, name? } → create an account and sign in",
    description: "Sign-up is open. The session cookie comes back on the same response.",
    anonymous: true,
    requestBody: jsonBody("The account to create.", ref("RegisterInput")),
    responses: { "201": sessionResponse("The account, now signed in.") },
  },
  {
    method: "post",
    path: "/api/auth/login",
    tag: "Auth",
    operationId: "login",
    summary: "{ email, password } → start a session",
    anonymous: true,
    requestBody: jsonBody("The credentials.", ref("LoginInput")),
    responses: {
      "200": sessionResponse("The signed-in account."),
      "401": jsonResponse("That email and password do not match an account.", ref("Error")),
    },
  },
  {
    method: "post",
    path: "/api/auth/logout",
    tag: "Auth",
    operationId: "logout",
    summary: "End the session",
    description: "Clears the cookie. An API key is unaffected — revoke one with `DELETE /api/keys/{id}`.",
    anonymous: true,
    responses: { "200": jsonResponse("The cookie has been cleared.", ref("Ok")) },
  },
  {
    method: "get",
    path: "/api/auth/me",
    tag: "Auth",
    operationId: "getMe",
    summary: "The signed-in account",
    responses: { "200": jsonResponse("Who this credential belongs to.", ref("SessionEnvelope")) },
  },
  {
    method: "post",
    path: "/api/auth/password",
    tag: "Auth",
    operationId: "changePassword",
    summary: "{ currentPassword, newPassword } → change the password",
    description:
      "Every existing token for the account dies with the old password, so the response carries a " +
      "fresh session — including for the caller that made the change.",
    requestBody: jsonBody("The old password and the new one.", ref("PasswordChangeInput")),
    responses: { "200": sessionResponse("The account, on a new session.") },
  },

  /* ----------------------------- preferences ---------------------------- */
  {
    method: "get",
    path: "/api/preferences",
    tag: "Preferences",
    operationId: "getPreferences",
    summary: "This account's preferences",
    responses: { "200": jsonResponse("The stored set, normalized.", ref("Preferences")) },
  },
  {
    method: "put",
    path: "/api/preferences",
    tag: "Preferences",
    operationId: "replacePreferences",
    summary: "Replace this account's preferences",
    description:
      "A replace, not a merge: anything left out falls back to that preference's default, unknown keys " +
      "are dropped, and out-of-range values are clamped — so a PUT always leaves a usable set.",
    requestBody: jsonBody("The whole preference set.", ref("Preferences")),
    responses: { "200": jsonResponse("The set as it was stored.", ref("Preferences")) },
  },

  /* ---------------------------- notifications --------------------------- */
  {
    method: "get",
    path: "/api/telegram",
    tag: "Notifications",
    operationId: "getTelegramSettings",
    summary: "Where this account is told about its runs, and about what",
    description:
      "The bot token never comes back: `hasOwnBot` says whether one is stored, and `serverBot` whether " +
      "this server brings its own. `botUsername` is Telegram's answer to `getMe`, so an empty one with a " +
      "`botError` beside it means the token no longer opens a bot.",
    responses: { "200": jsonResponse("The settings.", ref("TelegramState")) },
  },
  {
    method: "put",
    path: "/api/telegram",
    tag: "Notifications",
    operationId: "replaceTelegramSettings",
    summary: "Replace the notification settings (`botToken` is write-only)",
    description:
      "Leave `botToken` out to keep the stored one; send `\"\"` to drop it. A token is checked against " +
      "Telegram before it is stored, so a typo is refused here rather than at the run that needed it. " +
      "`chatId` may be set by hand for a group or a channel; pairing is what fills it in otherwise.",
    requestBody: jsonBody("The settings, whole.", ref("TelegramInput")),
    responses: { "200": jsonResponse("The settings as they were stored.", ref("TelegramState")) },
  },
  {
    method: "delete",
    path: "/api/telegram",
    tag: "Notifications",
    operationId: "unlinkTelegram",
    summary: "Forget the chat, the bot token and the settings",
    responses: { "200": jsonResponse("The settings, back to their defaults.", ref("TelegramState")) },
  },
  {
    method: "post",
    path: "/api/telegram/pair",
    tag: "Notifications",
    operationId: "startTelegramPairing",
    summary: "Issue a pairing code to send the bot",
    description:
      "Telegram will not tell a bot which chats exist — a chat has to speak first. `pending.deepLink` " +
      "opens the bot with the code already typed.",
    responses: { "200": jsonResponse("The settings, now carrying a pending code.", ref("TelegramState")) },
  },
  {
    method: "post",
    path: "/api/telegram/pair/confirm",
    tag: "Notifications",
    operationId: "confirmTelegramPairing",
    summary: "Look for the pairing message, and keep the chat it came from",
    description:
      "Only an exact match on the code counts, and only the chat it arrived in is kept. Messages are " +
      "read without consuming them, so two accounts pairing on one bot cannot swallow each other's.",
    responses: { "200": jsonResponse("The settings, now linked to a chat.", ref("TelegramState")) },
  },
  {
    method: "post",
    path: "/api/telegram/test",
    tag: "Notifications",
    operationId: "sendTelegramTest",
    summary: "Send a test message to the linked chat",
    responses: { "200": jsonResponse("It was sent; `lastSentAt` says when.", ref("TelegramState")) },
  },

  /* ------------------------------ api keys ------------------------------ */
  {
    method: "get",
    path: "/api/keys",
    tag: "API keys",
    operationId: "listApiKeys",
    summary: "List your API keys (never the keys themselves)",
    description: "Needs a session: a key cannot list, issue or revoke keys.",
    responses: { "200": jsonResponse("Your keys, newest first.", array(ref("ApiKey"))) },
  },
  {
    method: "post",
    path: "/api/keys",
    tag: "API keys",
    operationId: "createApiKey",
    summary: "{ name?, expiresInDays? } → issue a key; the only response that carries it",
    description:
      "Only the key's SHA-256 is stored, so this response is the one place the secret ever exists. " +
      "Needs a session.",
    requestBody: jsonBody("What to call the key, and when it should expire.", ref("ApiKeyInput")),
    responses: { "201": jsonResponse("The new key, secret included.", ref("IssuedApiKey")) },
  },
  {
    method: "delete",
    path: "/api/keys/{id}",
    tag: "API keys",
    operationId: "deleteApiKey",
    summary: "Revoke a key",
    description: "Takes effect on the next request. Needs a session.",
    parameters: [idParam("key")],
    responses: { "200": jsonResponse("Revoked.", ref("Ok")), "404": responseRef("NotFound") },
  },

  /* --------------------------- workspace export ------------------------- */
  {
    method: "get",
    path: "/api/export",
    tag: "Configurations",
    operationId: "exportWorkspace",
    summary: "Download every configuration and script template as one JSON file",
    description:
      "Includes the ones shared with you, plus your preferences. Datasets stay out — they are data " +
      "rather than configuration, and each has its own download.",
    responses: { "200": jsonResponse("The workspace file.", ref("WorkspaceFile")) },
  },

  /* ------------------------------ discovery ----------------------------- */
  {
    method: "get",
    path: "/api/meta",
    tag: "Discovery",
    operationId: "getMeta",
    summary: "PocketBase URL, reachability and this account's record counts",
    responses: { "200": jsonResponse("Where the data lives, and how much of it there is.", ref("Meta")) },
  },
  {
    method: "get",
    path: "/api/field-types",
    tag: "Discovery",
    operationId: "getFieldTypes",
    summary: "Every field type, its group, and the options it accepts",
    description: "The catalogue the editor is built from — the authority on what may go in `options`.",
    responses: { "200": jsonResponse("The catalogue.", ref("FieldTypeCatalog")) },
  },

  /* ----------------------------- inference ------------------------------ */
  {
    method: "post",
    path: "/api/infer",
    tag: "Schemas",
    operationId: "inferSchema",
    summary: "{ input } → infer fields from JSON / TypeScript / SQL",
    requestBody: jsonBody("The structure to read.", ref("InferInput")),
    responses: { "200": jsonResponse("The fields it found, and what it had to guess at.", ref("InferResult")) },
  },
  {
    method: "post",
    path: "/api/formula/validate",
    tag: "Schemas",
    operationId: "validateFormula",
    summary: "{ expression, fields } → validate a calculated field",
    description: "`fields` takes either whole field objects or bare names; leave it out to skip the name check.",
    requestBody: jsonBody("The expression, and what it may refer to.", ref("FormulaInput")),
    responses: { "200": jsonResponse("Whether it parses, and what it reads.", ref("FormulaValidation")) },
  },
  {
    method: "post",
    path: "/api/enum/preview",
    tag: "Schemas",
    operationId: "previewEnumScript",
    summary: "{ script } → run an enum's choice script and return the values it yields",
    description:
      "The snippet runs server-side in an isolated context that sees only `DDG_SCRIPT_*` environment " +
      "variables. A script that throws or runs long answers 200 with `ok: false`.",
    requestBody: jsonBody("The script body, and optional limits on the run.", ref("EnumPreviewInput")),
    responses: { "200": jsonResponse("What the run produced, or why it failed.", ref("EnumPreviewResult")) },
  },

  /* ------------------------------ configs ------------------------------- */
  {
    method: "get",
    path: "/api/configs",
    tag: "Configurations",
    operationId: "listConfigs",
    summary: "List configurations you own or that are shared with you",
    responses: { "200": jsonResponse("The configurations you can see.", array(ref("SchemaConfig"))) },
  },
  {
    method: "post",
    path: "/api/configs",
    tag: "Configurations",
    operationId: "createConfig",
    summary: "Create a configuration",
    requestBody: jsonBody("The schema to store.", ref("ConfigInput")),
    responses: { "201": jsonResponse("The stored configuration.", ref("SchemaConfig")) },
  },
  {
    method: "get",
    path: "/api/configs/{id}",
    tag: "Configurations",
    operationId: "getConfig",
    summary: "Read one configuration",
    parameters: [idParam("configuration")],
    responses: { "200": jsonResponse("The configuration.", ref("SchemaConfig")), "404": responseRef("NotFound") },
  },
  {
    method: "put",
    path: "/api/configs/{id}",
    tag: "Configurations",
    operationId: "replaceConfig",
    summary: "Replace one configuration (owner only)",
    description: "A configuration shared with you reads as missing here; copy it with `POST /api/configs` instead.",
    parameters: [idParam("configuration")],
    requestBody: jsonBody("The schema, whole.", ref("ConfigInput")),
    responses: { "200": jsonResponse("The updated configuration.", ref("SchemaConfig")), "404": responseRef("NotFound") },
  },
  {
    method: "delete",
    path: "/api/configs/{id}",
    tag: "Configurations",
    operationId: "deleteConfig",
    summary: "Delete one configuration (owner only)",
    description: "Datasets generated from it are kept.",
    parameters: [idParam("configuration")],
    responses: { "200": jsonResponse("Deleted.", ref("Ok")), "404": responseRef("NotFound") },
  },
  {
    method: "get",
    path: "/api/configs/{id}/shares",
    tag: "Sharing",
    operationId: "listConfigShares",
    summary: "Who a configuration is shared with",
    parameters: [idParam("configuration")],
    responses: { "200": jsonResponse("The share list.", ref("Shares")), "404": responseRef("NotFound") },
  },
  {
    method: "post",
    path: "/api/configs/{id}/shares",
    tag: "Sharing",
    operationId: "addConfigShare",
    summary: "{ email } → share it with an account (owner only)",
    parameters: [idParam("configuration")],
    requestBody: jsonBody("Who to share it with.", ref("ShareInput")),
    responses: { "200": jsonResponse("The share list, updated.", ref("Shares")), "404": responseRef("NotFound") },
  },
  {
    method: "delete",
    path: "/api/configs/{id}/shares",
    tag: "Sharing",
    operationId: "removeConfigShare",
    summary: "?email= → stop sharing it (owner, or yourself)",
    parameters: [
      idParam("configuration"),
      { ...queryParam("email", "The account to remove.", { type: "string", format: "email" }), required: true },
    ],
    responses: { "200": jsonResponse("The share list, updated.", ref("Shares")), "404": responseRef("NotFound") },
  },
  {
    method: "get",
    path: "/api/configs/{id}/export",
    tag: "Configurations",
    operationId: "exportConfig",
    summary: "Download a configuration as *.ddg.json",
    description: "The same document `POST /api/configs/import` reads back.",
    parameters: [idParam("configuration")],
    responses: { "200": jsonResponse("The configuration file.", ref("ConfigFile")), "404": responseRef("NotFound") },
  },
  {
    method: "post",
    path: "/api/configs/import",
    tag: "Configurations",
    operationId: "importConfig",
    summary: "Create a configuration from a *.ddg.json body",
    description: "A name already in use is suffixed rather than overwritten, so a re-import never replaces anything.",
    requestBody: jsonBody("A configuration file.", ref("ConfigFile")),
    responses: { "201": jsonResponse("The stored configuration.", ref("SchemaConfig")) },
  },
  {
    method: "get",
    path: "/api/configs/{id}/columns",
    tag: "Configurations",
    operationId: "getConfigColumns",
    summary: "List what a field mapping may draw from this configuration",
    description:
      "The columns of its newest dataset, which is what a mapping onto it will actually read. When it has " +
      "never been generated, `dataset` is null and the columns are the ones its schema says it will produce — " +
      "enough to write the mapping, not enough to resolve it.",
    parameters: [idParam("configuration")],
    responses: {
      "200": jsonResponse("The columns, and the dataset they were read from.", {
        type: "object",
        required: ["columns", "dataset"],
        properties: {
          columns: array({ type: "string" }),
          dataset: { ...ref("Dataset"), nullable: true },
        },
      }),
      "404": responseRef("NotFound"),
    },
  },
  {
    method: "post",
    path: "/api/configs/{id}/generate",
    tag: "Generation",
    operationId: "generateFromConfig",
    summary: "Generate using a stored schema (?rows= ?seed= ?name= ?locale=)",
    description: "Each override falls back to what the configuration stores. No body is needed.",
    parameters: [
      idParam("configuration"),
      queryParam("rows", "How many rows to generate.", {
        type: "integer",
        minimum: PREFERENCE_LIMITS.rowCount.min,
        maximum: PREFERENCE_LIMITS.rowCount.max,
      }),
      queryParam("seed", "Same seed and schema produce identical rows.", { type: "string" }),
      queryParam("name", "Names the stored dataset; the run's timestamp is appended.", { type: "string" }),
      queryParam("locale", "Overrides the schema's locale for this run.", { type: "string" }),
      ...generateParams,
    ],
    responses: { "200": generateResponse, "404": responseRef("NotFound") },
  },
  {
    method: "post",
    path: "/api/generate",
    tag: "Generation",
    operationId: "generate",
    summary: "Generate from an inline schema",
    description: "Nothing has to be saved first: the schema travels in the body.",
    parameters: generateParams,
    requestBody: jsonBody("The schema to run.", ref("GenerateInput")),
    responses: { "200": generateResponse },
  },

  /* ------------------------------ datasets ------------------------------ */
  {
    method: "get",
    path: "/api/datasets",
    tag: "Datasets",
    operationId: "listDatasets",
    summary: "List your generated datasets (?limit=)",
    description: "Newest first. Datasets are never shared — these are yours.",
    parameters: [queryParam("limit", "How many to return.", { type: "integer", minimum: 0, default: 50 })],
    responses: { "200": jsonResponse("Your datasets.", array(ref("Dataset"))) },
  },
  {
    method: "get",
    path: "/api/datasets/{id}",
    tag: "Datasets",
    operationId: "getDataset",
    summary: "Read a dataset's rows (?limit= ?offset=)",
    parameters: [
      idParam("dataset"),
      queryParam("limit", "Rows in this page. `0` returns the rest of them.", {
        type: "integer",
        minimum: 0,
        default: 100,
      }),
      queryParam("offset", "Where the page starts.", { type: "integer", minimum: 0, default: 0 }),
    ],
    responses: { "200": jsonResponse("One page of rows.", ref("DatasetPage")), "404": responseRef("NotFound") },
  },
  {
    method: "delete",
    path: "/api/datasets/{id}",
    tag: "Datasets",
    operationId: "deleteDataset",
    summary: "Delete a dataset",
    parameters: [idParam("dataset")],
    responses: { "200": jsonResponse("Deleted.", ref("Ok")), "404": responseRef("NotFound") },
  },
  {
    method: "get",
    path: "/api/datasets/{id}/columns",
    tag: "Datasets",
    operationId: "getDatasetColumns",
    summary: "List a dataset's column names, for reference fields",
    parameters: [idParam("dataset")],
    responses: {
      "200": jsonResponse("The column names.", {
        type: "object",
        required: ["columns"],
        properties: { columns: array({ type: "string" }) },
      }),
      "404": responseRef("NotFound"),
    },
  },
  {
    method: "get",
    path: "/api/datasets/{id}/export",
    tag: "Datasets",
    operationId: "exportDataset",
    summary: "Download a dataset (?format=csv|json|sql)",
    parameters: [
      idParam("dataset"),
      queryParam("format", "How to serve it. JSON when left out.", {
        type: "string",
        enum: ["csv", "json", "sql"],
        default: "json",
      }),
    ],
    responses: {
      "200": {
        description: "The dataset as a file.",
        content: {
          "application/json": { schema: array(ref("Row")) },
          "text/csv": { schema: { type: "string" } },
          "application/sql": { schema: { type: "string" } },
        },
      },
      "404": responseRef("NotFound"),
    },
  },
  {
    method: "get",
    path: "/api/datasets/{id}/script",
    tag: "Datasets",
    operationId: "renderDatasetScript",
    summary: "Render a dataset into a script template (?templateId=)",
    description: `The rows land where the template writes ${DATASET_PLACEHOLDER}; the response is the script itself.`,
    parameters: [
      idParam("dataset"),
      {
        ...queryParam("templateId", "Which template to render — yours, or one shared with you.", { type: "string" }),
        required: true,
      },
    ],
    responses: { "200": fileResponse("The rendered script.", "text/javascript"), "404": responseRef("NotFound") },
  },

  /* -------------------------------- notes ------------------------------- */
  {
    method: "get",
    path: "/api/notes",
    tag: "Notes",
    operationId: "listNotes",
    summary: "List your notes, most recently edited first",
    responses: { "200": jsonResponse("Your notes.", array(ref("Note"))) },
  },
  {
    method: "post",
    path: "/api/notes",
    tag: "Notes",
    operationId: "createNote",
    summary: "Write a note",
    requestBody: jsonBody("The note to store.", ref("NoteInput")),
    responses: { "201": jsonResponse("The stored note.", ref("Note")) },
  },
  {
    method: "post",
    path: "/api/notes/references",
    tag: "Notes",
    operationId: "resolveNoteReferences",
    summary: "{ refs } → what a note's [[…]] references point at now",
    description:
      "Each ref is what stands between the brackets: `cfg_1a2b` for the record, or `cfg_1a2b#metadata` for " +
      "one field of it. A field path may be dotted, and a segment applied to an array plucks that key from " +
      "every element — `ds_9f8e#rows.email` is one column.\n\n" +
      "Resolved as the caller, so a reference to a record you cannot see comes back as `found: false` " +
      "rather than as somebody else's data. Refs are deduplicated, anything that is not a reference is " +
      "dropped, and the records behind them are read once each however many fields are asked for.\n\n" +
      `A field holding an array or an object comes back as a table of at most ${MAX_REFERENCE_ROWS} rows and ` +
      `${MAX_REFERENCE_COLUMNS} columns, with the untruncated total beside it — so quoting a large dataset in ` +
      "a note costs a page of it, not all of it.",
    requestBody: jsonBody("The references to resolve.", ref("ReferenceInput")),
    responses: { "200": jsonResponse("One entry per ref, in the order given.", ref("ReferenceList")) },
  },
  {
    method: "get",
    path: "/api/notes/{id}",
    tag: "Notes",
    operationId: "getNote",
    summary: "Read one note",
    parameters: [idParam("note")],
    responses: { "200": jsonResponse("The note.", ref("Note")), "404": responseRef("NotFound") },
  },
  {
    method: "put",
    path: "/api/notes/{id}",
    tag: "Notes",
    operationId: "replaceNote",
    summary: "Replace one note",
    parameters: [idParam("note")],
    requestBody: jsonBody("The note, whole.", ref("NoteInput")),
    responses: { "200": jsonResponse("The updated note.", ref("Note")), "404": responseRef("NotFound") },
  },
  {
    method: "delete",
    path: "/api/notes/{id}",
    tag: "Notes",
    operationId: "deleteNote",
    summary: "Delete one note",
    parameters: [idParam("note")],
    responses: { "200": jsonResponse("Deleted.", ref("Ok")), "404": responseRef("NotFound") },
  },
  {
    method: "get",
    path: "/api/notes/{id}/export",
    tag: "Notes",
    operationId: "exportNote",
    summary: "Download one note as Markdown",
    parameters: [idParam("note")],
    responses: { "200": fileResponse("The note as Markdown.", "text/markdown"), "404": responseRef("NotFound") },
  },

  /* -------------------------- script templates -------------------------- */
  {
    method: "get",
    path: "/api/script-templates",
    tag: "Script templates",
    operationId: "listScriptTemplates",
    summary: "List templates you own or that are shared with you",
    responses: { "200": jsonResponse("The templates you can see.", array(ref("ScriptTemplate"))) },
  },
  {
    method: "post",
    path: "/api/script-templates",
    tag: "Script templates",
    operationId: "createScriptTemplate",
    summary: "Create a script template",
    requestBody: jsonBody("The template to store.", ref("ScriptTemplateInput")),
    responses: { "201": jsonResponse("The stored template.", ref("ScriptTemplate")) },
  },
  {
    method: "get",
    path: "/api/script-templates/{id}",
    tag: "Script templates",
    operationId: "getScriptTemplate",
    summary: "Read one script template",
    parameters: [idParam("template")],
    responses: { "200": jsonResponse("The template.", ref("ScriptTemplate")), "404": responseRef("NotFound") },
  },
  {
    method: "put",
    path: "/api/script-templates/{id}",
    tag: "Script templates",
    operationId: "replaceScriptTemplate",
    summary: "Replace one script template (owner only)",
    parameters: [idParam("template")],
    requestBody: jsonBody("The template, whole.", ref("ScriptTemplateInput")),
    responses: { "200": jsonResponse("The updated template.", ref("ScriptTemplate")), "404": responseRef("NotFound") },
  },
  {
    method: "delete",
    path: "/api/script-templates/{id}",
    tag: "Script templates",
    operationId: "deleteScriptTemplate",
    summary: "Delete one script template (owner only)",
    parameters: [idParam("template")],
    responses: { "200": jsonResponse("Deleted.", ref("Ok")), "404": responseRef("NotFound") },
  },
  {
    method: "get",
    path: "/api/script-templates/{id}/shares",
    tag: "Sharing",
    operationId: "listScriptTemplateShares",
    summary: "Who a template is shared with",
    parameters: [idParam("template")],
    responses: { "200": jsonResponse("The share list.", ref("Shares")), "404": responseRef("NotFound") },
  },
  {
    method: "post",
    path: "/api/script-templates/{id}/shares",
    tag: "Sharing",
    operationId: "addScriptTemplateShare",
    summary: "{ email } → share it with an account (owner only)",
    parameters: [idParam("template")],
    requestBody: jsonBody("Who to share it with.", ref("ShareInput")),
    responses: { "200": jsonResponse("The share list, updated.", ref("Shares")), "404": responseRef("NotFound") },
  },
  {
    method: "delete",
    path: "/api/script-templates/{id}/shares",
    tag: "Sharing",
    operationId: "removeScriptTemplateShare",
    summary: "?email= → stop sharing it (owner, or yourself)",
    parameters: [
      idParam("template"),
      { ...queryParam("email", "The account to remove.", { type: "string", format: "email" }), required: true },
    ],
    responses: { "200": jsonResponse("The share list, updated.", ref("Shares")), "404": responseRef("NotFound") },
  },
];

/** The two auth responses that also hand back a cookie. */
function sessionResponse(description: string) {
  return {
    description,
    headers: {
      "Set-Cookie": {
        description: `The session, as an httpOnly \`${SESSION_COOKIE}\` cookie.`,
        schema: { type: "string" },
      },
    },
    content: { "application/json": { schema: ref("SessionEnvelope") } },
  };
}

/* --------------------------------- schemas -------------------------------- */

const FIELD_TYPE_NAMES = FIELD_TYPES.map(type => type.type);

/**
 * The preference set, read off the defaults.
 *
 * Writing the properties out by hand would mean a preference could be added
 * to the account and never appear here; taking the keys from the default set
 * means the document gains it the day the preference does.
 */
function preferencesSchema(): Json {
  const bounded: Record<string, Json> = {
    theme: { enum: THEMES },
    accentColor: { enum: ACCENT_COLORS.map(accent => accent.id) },
    defaultFieldType: { enum: FIELD_TYPE_NAMES },
    defaultExportFormat: { enum: ["csv", "json", "sql"] },
    defaultSeed: { maxLength: PREFERENCE_LIMITS.seedLength },
    defaultRowCount: { minimum: PREFERENCE_LIMITS.rowCount.min, maximum: PREFERENCE_LIMITS.rowCount.max },
    previewRowLimit: { minimum: PREFERENCE_LIMITS.previewRows.min, maximum: PREFERENCE_LIMITS.previewRows.max },
    datasetHistoryLimit: {
      minimum: PREFERENCE_LIMITS.datasetHistory.min,
      maximum: PREFERENCE_LIMITS.datasetHistory.max,
    },
    editorSplitPercent: { minimum: PREFERENCE_LIMITS.editorSplit.min, maximum: PREFERENCE_LIMITS.editorSplit.max },
  };

  const properties: Record<string, Json> = {};
  for (const [key, value] of Object.entries(DEFAULT_PREFERENCES)) {
    const type = typeof value === "boolean" ? "boolean" : typeof value === "number" ? "integer" : "string";
    properties[key] = { type, default: value, ...(bounded[key] ?? {}) };
  }

  return {
    type: "object",
    description: "Per-account defaults. Anything left out of a PUT falls back to the default shown here.",
    properties,
  };
}

const metadataSchema: Json = {
  type: "object",
  description:
    `Free-form pairs describing what a schema is for. ${METADATA_LIMITS.pairs} pairs at most, ` +
    `keys up to ${METADATA_LIMITS.key} characters and values up to ${METADATA_LIMITS.value}. Values are text.`,
  additionalProperties: { type: "string" },
  example: { team: "billing", ticket: "DDG-412" },
};

const fieldMappingSchema: Json = {
  type: "object",
  description:
    "One cross-configuration link: a field in this schema draws its values from a column of another " +
    "configuration's newest dataset. Resolved at generation time, so regenerating the source is enough to " +
    "refresh everything mapped to it. A configuration that has never been generated makes the run fail with " +
    "409 rather than producing rows that line up with nothing.",
  required: ["field", "fromConfig", "fromField"],
  example: { field: "customer_id", fromConfig: "cfg_1a2b3c4d", fromField: "id", mode: "random" },
  properties: {
    id: { type: "string", description: "Stable per mapping. Minted for you when left out." },
    field: { type: "string", description: "The field in this schema that receives the values." },
    fromConfig: { type: "string", description: "The configuration id the values come from." },
    fromConfigName: {
      type: "string",
      description: "That configuration's name, carried so an exported file still says what it pointed at.",
    },
    fromField: { type: "string", description: "The column within that configuration's data." },
    mode: {
      type: "string",
      enum: ["random", "cycle", "unique"],
      default: "random",
      description:
        "`random` draws freely (many-to-one), `cycle` walks the pool in order, `unique` gives each row its " +
        "own value and leaves later rows null once the pool runs out (one-to-one).",
    },
  },
};

const fieldOptionsSchema: Json = {
  type: "object",
  description:
    "What a field type accepts. Every type's own list is in `GET /api/field-types`; anything not listed " +
    "for a type is ignored rather than refused.",
  additionalProperties: true,
  // An example, because a generator asked to invent one from these properties
  // has to invent a value for `pattern` too — and a JSON Schema faker reads
  // that name as the keyword it also is, and gives up on the whole schema.
  example: { min: 1, max: 100 },
  properties: {
    min: { type: "number", description: "Numeric floor, array length, or lorem word count." },
    max: { type: "number", description: "Numeric ceiling. Left out on a skewed draw, the tail is kept." },
    decimals: { type: "integer", description: "Places on a float or a price." },
    values: { ...array({ type: "string" }), description: "An enum's pool of allowed values." },
    weights: { ...array({ type: "number" }), description: "One weight per value, to skew the pick." },
    valuesFrom: { type: "string", enum: ["list", "script"], description: "Where an enum's pool comes from." },
    script: { type: "string", description: "An async function body returning the enum's choices." },
    from: { type: "string", description: "Lower bound for a date type (ISO-8601)." },
    to: { type: "string", description: "Upper bound for a date type (ISO-8601)." },
    format: { type: "string", enum: ["iso", "datetime", "date", "time", "unix"], description: "Date output shape." },
    pattern: { type: "string", description: 'A template, e.g. "ORD-{{number:1000-9999}}-{{word}}".' },
    prefix: { type: "string", description: "Prepended to the stringified value." },
    suffix: { type: "string", description: "Appended to the stringified value." },
    arrayOf: { type: "string", enum: FIELD_TYPE_NAMES, description: "The element type of an array field." },
    truePercent: { type: "number", minimum: 0, maximum: 100, description: "A boolean's chance of being true." },
    expression: { type: "string", description: 'Arithmetic over other numeric fields, e.g. "quantity * price".' },
    distribution: {
      type: "string",
      enum: ["uniform", "normal", "lognormal", "pareto"],
      description: "The shape of a numeric draw.",
    },
    mean: { type: "number", description: "Normal: the centre. Lognormal: the median, in real units." },
    stddev: { type: "number", description: "Normal: the spread." },
    shape: { type: "number", description: "Pareto: the tail index — smaller is heavier." },
    derivesFrom: { type: "string", description: "The field an email, username, slug or initials is built from." },
    bundle: {
      type: "string",
      enum: ["person", "address", "card", "device", "company"],
      description: "Which correlated column set a bundle field emits.",
    },
    fields: { ...array(ref("Field")), description: "Child fields of an object, or of an array of objects." },
    refDataset: { type: "string", description: "The dataset a reference field draws from." },
    refField: { type: "string", description: "The column within that dataset." },
    refMode: { type: "string", enum: ["random", "cycle", "unique"], description: "How rows walk the pool." },
    when: { type: "string", description: "A predicate; the value is null on the rows where it is false." },
    after: { type: "string", description: "A date column this value must follow." },
  },
};

const fieldSchema: Json = {
  type: "object",
  required: ["name", "type"],
  properties: {
    id: { type: "string", description: "Stable per field. Generated for you when absent." },
    name: { type: "string", description: "The column name, as it appears in every export." },
    type: { type: "string", enum: FIELD_TYPE_NAMES, description: "One of the catalogue's types." },
    options: ref("FieldOptions"),
  },
};

/** Shared by `Note` and `NoteInput`: the same text, described once. */
const noteBodySchema: Json = {
  type: "string",
  maxLength: MAX_NOTE_BODY_LENGTH,
  description: [
    "Markdown. `[[cfg_…]]`, `[[ds_…]]`, `[[tpl_…]]` and `[[note_…]]` reference other records by id, and",
    "render as whatever those records are called at the time they are read.",
    "",
    "`[[id#field]]` names one field of the record instead, and renders its current value — an array or an",
    "object as a table, anything else inline. What each kind offers:",
    "",
    ...Object.entries(REFERENCE_FIELDS).map(
      ([kind, specs]) => `- **${kind}**: ${specs.map(spec => `\`${spec.path}\``).join(", ")}`,
    ),
    "",
    "A path may go deeper than that list, and a segment applied to an array plucks it from every element:",
    "`[[ds_…#rows.email]]` is one column of the generated rows.",
  ].join("\n"),
  example: "The seed for [[cfg_1a2b3c4d]] is wrong above 10k rows: [[ds_9f8e7d6c#rows]]",
};

const REFERENCE_KINDS: ReferenceKind[] = ["config", "dataset", "script-template", "note"];

const ownedRecord = {
  ownerId: { type: "string", description: "The account that owns it — compare with your own id." },
  sharedWith: {
    ...array({ type: "string", format: "email" }),
    description: "Accounts it is shared with, read-only. Populated for the owner only.",
  },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" },
};

const configProperties: Record<string, Json> = {
  name: { type: "string" },
  description: { type: "string" },
  fields: array(ref("Field")),
  mappings: {
    ...array(ref("FieldMapping")),
    description:
      `Fields here that draw from another configuration. ${MAPPING_LIMITS.perConfig} at most, and a field may ` +
      "be mapped only once.",
  },
  rowCount: {
    type: "integer",
    minimum: PREFERENCE_LIMITS.rowCount.min,
    maximum: PREFERENCE_LIMITS.rowCount.max,
    description: "How many rows a run of this schema produces by default.",
  },
  seed: { type: "string", description: "Same seed and schema produce identical rows. Empty means random." },
  locale: { type: "string", description: "Applies to every name, address and phone in the run.", example: "de" },
  metadata: ref("Metadata"),
};

function schemas(): Record<string, Json> {
  return {
    Error: {
      type: "object",
      description: "Every failure answers with this shape.",
      required: ["error"],
      properties: { error: { type: "string" } },
    },
    Ok: {
      type: "object",
      description: "What a delete answers with.",
      required: ["ok"],
      properties: { ok: { type: "boolean", enum: [true] } },
    },
    Row: {
      type: "object",
      description: "One generated row: the field names you asked for, and their values.",
      additionalProperties: true,
    },
    Note: {
      type: "object",
      description:
        "Markdown about the rest of the workspace. Notes are private to their owner — there is no sharing.",
      properties: {
        id: { type: "string", example: "note_1a2b3c4d" },
        title: { type: "string", maxLength: MAX_NOTE_TITLE_LENGTH },
        body: noteBodySchema,
        ownerId: { type: "string", description: "Always your own account." },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
    NoteInput: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string", minLength: 1, maxLength: MAX_NOTE_TITLE_LENGTH },
        body: noteBodySchema,
      },
    },
    ReferenceInput: {
      type: "object",
      required: ["refs"],
      properties: {
        refs: {
          ...array({ type: "string" }),
          maxItems: MAX_NOTE_REFERENCES,
          description: "References, exactly as they appear inside the `[[…]]` of a note body.",
          example: ["cfg_1a2b3c4d", "ds_9f8e7d6c#rows", "ds_9f8e7d6c#rows.email"],
        },
      },
    },
    ReferenceField: {
      type: "object",
      description:
        "The named field, shaped for drawing. `shape` says which of the other properties are present: " +
        "`value` and `text` carry `value`; `table` carries `columns` and `rows`; `missing` carries neither, " +
        "and means the record resolved but has no such path.",
      required: ["path", "shape"],
      properties: {
        path: { type: "string", description: "What was asked for, after the `#`.", example: "rows.email" },
        shape: { type: "string", enum: ["value", "text", "table", "missing"] },
        value: { type: "string", description: "The whole value, as text. `value` and `text` only." },
        columns: array({ type: "string" }),
        rows: {
          ...array(array({ type: "string" })),
          description: "Row-major, aligned to `columns`, each cell already cut to length.",
        },
        total: { type: "integer", description: "Rows before the cap — what the table is a window on." },
        truncated: { type: "boolean" },
        hiddenColumns: { type: "integer", description: "Columns the cap left out." },
      },
    },
    Reference: {
      type: "object",
      description: "One reference, as the reader's own credentials resolve it.",
      properties: {
        id: { type: "string" },
        kind: { type: "string", enum: REFERENCE_KINDS },
        label: { type: "string", description: "The record's current name — or the id, when it did not resolve." },
        detail: { type: "string", description: "A line under the name: field count, row count, and so on." },
        found: { type: "boolean", description: "False where the record is gone, or was never yours to read." },
        field: ref("ReferenceField"),
      },
    },
    ReferenceList: {
      type: "object",
      required: ["references"],
      properties: { references: array(ref("Reference")) },
    },
    Metadata: metadataSchema,
    FieldMapping: fieldMappingSchema,
    Field: fieldSchema,
    FieldOptions: fieldOptionsSchema,
    Preferences: preferencesSchema(),

    SessionUser: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string", format: "email" },
        name: { type: "string" },
        verified: { type: "boolean" },
        createdAt: { type: "string", format: "date-time" },
        preferences: ref("Preferences"),
      },
    },
    SessionEnvelope: {
      type: "object",
      description: "The account. The token itself never appears in a body — it rides in the cookie.",
      required: ["user"],
      properties: { user: ref("SessionUser") },
    },
    RegisterInput: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8 },
        name: { type: "string" },
      },
    },
    LoginInput: {
      type: "object",
      required: ["email", "password"],
      properties: { email: { type: "string", format: "email" }, password: { type: "string" } },
    },
    PasswordChangeInput: {
      type: "object",
      required: ["currentPassword", "newPassword"],
      properties: { currentPassword: { type: "string" }, newPassword: { type: "string", minLength: 8 } },
    },

    TelegramEvents: {
      type: "object",
      description: "Which runs are worth a message.",
      properties: {
        generated: { type: "boolean", default: DEFAULT_TELEGRAM_SETTINGS.events.generated, description: "A run finished." },
        failed: { type: "boolean", default: DEFAULT_TELEGRAM_SETTINGS.events.failed, description: "A run was refused or threw." },
      },
    },
    TelegramInput: {
      type: "object",
      properties: {
        enabled: { type: "boolean", default: DEFAULT_TELEGRAM_SETTINGS.enabled },
        events: ref("TelegramEvents"),
        minRows: {
          type: "integer",
          minimum: TELEGRAM_LIMITS.minRows.min,
          maximum: TELEGRAM_LIMITS.minRows.max,
          default: DEFAULT_TELEGRAM_SETTINGS.minRows,
          description: "Runs smaller than this say nothing — a 25-row preview is not news.",
        },
        apiKeyOnly: {
          type: "boolean",
          default: DEFAULT_TELEGRAM_SETTINGS.apiKeyOnly,
          description: "Stay quiet for runs made from the editor, where the result is already on screen.",
        },
        chatId: {
          type: "string",
          description: "A user or group id, or a channel as `@name`. Pairing fills this in for you.",
        },
        chatLabel: { type: "string", description: "What to call that chat on the settings page." },
        botToken: {
          type: "string",
          description:
            "Write-only, and never returned. Left out, the stored token is kept; `\"\"` drops it and falls " +
            "back to the server's bot, where there is one.",
        },
      },
      example: { enabled: true, apiKeyOnly: true, minRows: 1000, events: { generated: true, failed: true } },
    },
    TelegramState: {
      type: "object",
      description: "The settings as they are stored — everything except the credential.",
      properties: {
        enabled: { type: "boolean" },
        chatId: { type: "string" },
        chatLabel: { type: "string" },
        events: ref("TelegramEvents"),
        minRows: { type: "integer" },
        apiKeyOnly: { type: "boolean" },
        hasOwnBot: { type: "boolean", description: "Whether this account stores a bot token of its own." },
        serverBot: { type: "boolean", description: "Whether this server brings one, so an account needs none." },
        botUsername: { type: "string", description: "Who the bot is, as Telegram answers." },
        botError: { type: "string", description: "Why the bot could not be asked, when it could not." },
        verifiedAt: { type: "string", description: "When the chat was linked. Empty until it is." },
        lastSentAt: { type: "string", description: "When a message last went out." },
        lastError: { type: "string", description: "Why the last one did not." },
        pending: {
          type: "object",
          nullable: true,
          description: "A pairing code still waiting for its message.",
          properties: {
            code: { type: "string" },
            expiresAt: { type: "string", format: "date-time" },
            deepLink: { type: "string", description: "Opens the bot with the code already typed." },
          },
        },
      },
    },
    ApiKey: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        expiresAt: { type: "string", description: "Empty when the key never expires." },
        lastUsedAt: { type: "string", description: "Empty until first use." },
      },
    },
    IssuedApiKey: {
      allOf: [
        ref("ApiKey"),
        {
          type: "object",
          required: ["key"],
          properties: {
            key: {
              type: "string",
              description: `The secret, shown once and never again. Send it as \`${API_KEY_HEADER}\`.`,
              example: `${API_KEY_PREFIX}…`,
            },
          },
        },
      ],
    },
    ApiKeyInput: {
      type: "object",
      properties: {
        name: { type: "string", description: "What the key is for — shown in the key list." },
        expiresInDays: { type: "integer", minimum: 0, description: "Left out, the key never expires." },
      },
    },

    SchemaConfig: {
      type: "object",
      description: "A stored schema.",
      properties: { id: { type: "string" }, ...configProperties, ...ownedRecord },
    },
    ConfigInput: {
      type: "object",
      required: ["name", "fields"],
      properties: configProperties,
      example: {
        name: "Customers",
        description: "",
        rowCount: 500,
        seed: "release-testing",
        locale: "",
        metadata: { team: "billing" },
        fields: [
          { name: "id", type: "uuid" },
          { name: "email", type: "email" },
        ],
      },
    },
    ConfigFile: {
      type: "object",
      description: "A configuration on disk: the `*.ddg.json` document, field ids stripped.",
      required: ["kind", "name", "fields"],
      properties: {
        kind: { type: "string", enum: ["dummy-data-generator/config"] },
        version: { type: "integer" },
        ...configProperties,
        fields: {
          ...array(ref("Field")),
          description: "Fields without their ids — new ones are generated on import.",
        },
        exportedAt: { type: "string", format: "date-time" },
      },
    },
    WorkspaceFile: {
      type: "object",
      description: "Every configuration and script template this account can see, plus its preferences.",
      properties: {
        kind: { type: "string", enum: ["dummy-data-generator/workspace"] },
        version: { type: "integer" },
        exportedAt: { type: "string", format: "date-time" },
        exportedBy: { type: "string", format: "email" },
        preferences: ref("Preferences"),
        configs: {
          ...array({
            allOf: [
              ref("ConfigFile"),
              { type: "object", properties: { sharedWithMe: { type: "boolean", enum: [true] } } },
            ],
          }),
          description: "Each entry is itself a valid *.ddg.json document, importable on its own.",
        },
        scriptTemplates: array({
          type: "object",
          properties: {
            name: { type: "string" },
            body: { type: "string" },
            sharedWithMe: { type: "boolean", enum: [true] },
          },
        }),
      },
    },

    GenerateInput: {
      type: "object",
      required: ["fields"],
      description: "An inline schema. At least one named field is required.",
      // Imported collections send this verbatim, so it is a call that works
      // rather than a shape to be filled in.
      example: {
        name: "Customers",
        rowCount: 25,
        seed: "",
        locale: "",
        fields: [
          { name: "id", type: "uuid" },
          { name: "full_name", type: "fullName" },
          { name: "email", type: "email", options: { derivesFrom: "full_name" } },
          { name: "signed_up", type: "pastDate" },
          { name: "plan", type: "enum", options: { values: ["free", "pro", "team"], weights: [6, 3, 1] } },
        ],
      },
      properties: {
        fields: array(ref("Field")),
        mappings: {
          ...array(ref("FieldMapping")),
          description: "Cross-configuration links to resolve before the first row. Usually left out.",
        },
        rowCount: {
          type: "integer",
          minimum: PREFERENCE_LIMITS.rowCount.min,
          maximum: PREFERENCE_LIMITS.rowCount.max,
          default: 25,
        },
        seed: { type: "string" },
        locale: { type: "string" },
        name: { type: "string", description: "Names the stored dataset; the run's timestamp is appended." },
        configId: {
          type: "string",
          nullable: true,
          description: "Files the dataset under a stored configuration, where the schema came from one.",
        },
      },
    },
    GenerateResult: {
      type: "object",
      properties: {
        dataset: { ...ref("Dataset"), nullable: true, description: "Null when `?save=false`." },
        rows: { ...array(ref("Row")), description: "The rows, capped by `?limit=`." },
        total: { type: "integer", description: "How many rows the run produced." },
        truncated: { type: "boolean", description: "Whether `rows` is short of `total`." },
      },
    },
    Dataset: {
      type: "object",
      description: "One generated run. Datasets are never shared.",
      properties: {
        id: { type: "string" },
        configId: { type: "string", nullable: true, description: "The schema it came from, when it came from one." },
        name: { type: "string", description: 'Schema name plus the run stamp: "Orders · 2026-09-18T14:23:05Z".' },
        rowCount: { type: "integer" },
        fieldCount: { type: "integer" },
        ownerId: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    DatasetPage: {
      type: "object",
      properties: {
        dataset: ref("Dataset"),
        rows: array(ref("Row")),
        offset: { type: "integer" },
        total: { type: "integer" },
        truncated: { type: "boolean" },
      },
    },

    ScriptTemplate: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string", maxLength: MAX_TEMPLATE_NAME_LENGTH },
        body: { type: "string", maxLength: MAX_TEMPLATE_BODY_LENGTH },
        ...ownedRecord,
      },
    },
    ScriptTemplateInput: {
      type: "object",
      required: ["name", "body"],
      example: {
        name: "Postgres seed",
        body: `const rows = ${DATASET_PLACEHOLDER};\nconsole.log(\`\${rows.length} rows\`);`,
      },
      properties: {
        name: { type: "string", maxLength: MAX_TEMPLATE_NAME_LENGTH },
        body: {
          type: "string",
          maxLength: MAX_TEMPLATE_BODY_LENGTH,
          description: `JavaScript. The dataset is substituted in where it writes ${DATASET_PLACEHOLDER}.`,
        },
      },
    },

    Shares: {
      type: "object",
      properties: {
        owner: { type: "string", format: "email", description: "Who shared it with you, when it is not yours." },
        sharedWith: { ...array({ type: "string", format: "email" }), description: "Populated for the owner only." },
        canShare: { type: "boolean", description: "Whether this account may change that list." },
      },
    },
    ShareInput: {
      type: "object",
      required: ["email"],
      properties: { email: { type: "string", format: "email", description: "An account that already exists." } },
      example: { email: "teammate@example.com" },
    },

    InferInput: {
      type: "object",
      required: ["input"],
      properties: {
        input: { type: "string", description: "A JSON document, a TypeScript type, or a CREATE TABLE statement." },
      },
    },
    InferResult: {
      type: "object",
      properties: {
        fields: array(ref("Field")),
        notes: { ...array({ type: "string" }), description: "What it had to guess at, in plain words." },
        detected: { type: "string", enum: ["json", "typescript", "sql"] },
      },
    },
    FormulaInput: {
      type: "object",
      required: ["expression"],
      properties: {
        expression: { type: "string", example: "quantity * unit_price" },
        fields: {
          type: "array",
          items: { oneOf: [{ type: "string" }, ref("Field")] },
          description: "Field objects or bare names. Left out, the names in the expression are not checked.",
        },
      },
    },
    FormulaValidation: {
      type: "object",
      required: ["valid"],
      properties: {
        valid: { type: "boolean" },
        references: { ...array({ type: "string" }), description: "The fields it reads, when it parses." },
        error: { type: "string", description: "Why it does not parse." },
      },
    },
    EnumPreviewInput: {
      type: "object",
      required: ["script"],
      properties: {
        script: { type: "string", description: "An async function body that returns an array." },
        timeoutMs: { type: "integer", description: "How long the run may take." },
        maxValues: { type: "integer", description: "How many values to keep." },
      },
    },
    EnumPreviewResult: {
      type: "object",
      required: ["ok"],
      description: "A script that throws still answers 200 — with `ok: false` and the reason.",
      properties: {
        ok: { type: "boolean" },
        values: array({ type: "string" }),
        count: { type: "integer" },
        returned: { type: "integer" },
        truncated: { type: "boolean" },
        durationMs: { type: "integer" },
        logs: { ...array({ type: "string" }), description: "Whatever the snippet logged, in order." },
        error: { type: "string" },
      },
    },

    Meta: {
      type: "object",
      properties: {
        url: { type: "string", description: "Where PocketBase is, as this server reaches it." },
        reachable: { type: "boolean" },
        configs: { type: "integer", nullable: true, description: "Null when PocketBase could not be counted." },
        datasets: { type: "integer", nullable: true },
        scriptTemplates: { type: "integer", nullable: true },
        notes: { type: "integer", nullable: true },
      },
    },
    Health: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok"] },
        uptime: { type: "integer", description: "Seconds since this process started." },
        env: { type: "string" },
      },
    },
    FieldTypeCatalog: {
      type: "object",
      description: "Everything the editor knows about field types — the authority on what `options` accepts.",
      properties: {
        groups: array({ type: "string" }),
        types: array({
          type: "object",
          properties: {
            type: { type: "string", enum: FIELD_TYPE_NAMES },
            label: { type: "string" },
            group: { type: "string" },
            opts: { ...array({ type: "string" }), description: "The option keys this type reads." },
          },
        }),
        formulaFunctions: { ...array({ type: "string" }), description: "What a calculated field may call." },
        locales: {
          ...array({
            type: "object",
            properties: { code: { type: "string" }, label: { type: "string" } },
          }),
          description: `${LOCALES.length} locales, each usable as a schema's \`locale\`.`,
        },
        bundles: array({
          type: "object",
          properties: {
            kind: { type: "string" },
            label: { type: "string" },
            columns: array({ type: "string" }),
          },
        }),
        edgeCaseVariants: array({ type: "string" }),
      },
    },
  };
}

/* -------------------------------- assembly -------------------------------- */

const TAGS: Json[] = [
  { name: "Discovery", description: "What this server is, and whether it and its database are up." },
  { name: "Auth", description: "Register, sign in, sign out, change a password." },
  { name: "API keys", description: "Long-lived credentials for scripts. Issuing one needs a session." },
  { name: "Preferences", description: "Per-account defaults, stored on the account rather than the browser." },
  { name: "Notifications", description: "Telegram: where a run's result is sent, and which runs are worth sending." },
  { name: "Schemas", description: "Inferring a schema, and checking the parts of one before it runs." },
  { name: "Configurations", description: "Stored schemas, their files, and the workspace export." },
  { name: "Generation", description: "Running a schema — inline, or a stored one." },
  { name: "Datasets", description: "What a run produced: rows, columns, downloads and rendered scripts." },
  { name: "Script templates", description: "JavaScript a dataset is substituted into." },
  { name: "Notes", description: "Markdown about the workspace, with live references to the records in it." },
  { name: "Sharing", description: "Letting another account read a configuration or a template." },
];

const DESCRIPTION = [
  "Generate realistic fake data from a schema you describe, and take it away as JSON, CSV or SQL.",
  "",
  "### Authentication",
  "",
  "Three credentials reach the same account, and every endpoint takes any of them:",
  "",
  `- \`${API_KEY_HEADER}: ${API_KEY_PREFIX}…\` — an API key, which is what a script should use.`,
  "  Issue one under Settings → API keys, or with `POST /api/keys`.",
  "- `Authorization: <token>` — a PocketBase user token, sent raw, with no `Bearer` prefix.",
  `- The \`${SESSION_COOKIE}\` cookie, which \`POST /api/auth/login\` sets.`,
  "",
  "`GET /api`, `GET /api/health`, `GET /api/openapi.json` and the three sign-in routes need no",
  "credential; everything else does.",
  "Issuing and revoking API keys needs a real session, so a leaked key cannot mint its own replacement.",
  "",
  "### Errors",
  "",
  "Every failure answers with `{ \"error\": string }` and an honest status: 400 for a bad request,",
  "401 for a missing or spent credential, 404 for a record that does not exist — or that exists and",
  "is not yours, which this API declines to tell apart.",
  "",
  "### Access",
  "",
  "PocketBase's own collection rules decide what a credential reaches; this server holds none of its",
  "own. A configuration or template shared with you is readable and runnable but not editable —",
  "saving a change keeps your own copy.",
].join("\n");

/** `{id}` is what OpenAPI writes; `:id` is what the route table and `GET /api` write. */
const toRouteSyntax = (path: string) => path.replace(/\{(\w+)\}/g, ":$1");

/**
 * The endpoint list `GET /api` prints, derived from the operations above.
 *
 * Keeping it here rather than in the route table is what stops the two from
 * disagreeing: there is one list, and both readers are given it.
 */
export function endpointIndex(): Record<string, string> {
  const index: Record<string, string> = {};
  for (const operation of OPERATIONS) {
    index[`${operation.method.toUpperCase().padEnd(6)} ${toRouteSyntax(operation.path)}`] = operation.summary;
  }
  return index;
}

/**
 * The document itself.
 *
 * `serverUrl` should be the origin the request arrived on, so a collection
 * imported from a running server points back at that server rather than at
 * whatever host this file happened to name.
 */
export function buildOpenApiDocument({ serverUrl }: { serverUrl?: string } = {}): OpenApiDocument {
  const paths: Record<string, Json> = {};

  for (const operation of OPERATIONS) {
    const { method, path, tag, operationId, summary, description, anonymous, parameters, requestBody } = operation;

    // Every guarded route can answer 401, and every route that reads a body or
    // a query parameter can answer 400 — said once here rather than on forty
    // operations that would each have to remember. The operation's own list is
    // spread twice on purpose: the first fixes the order, so its 200 is listed
    // before the failures, and the second lets it override a default it
    // disagrees with — sign-in's 401 is not "no credential", it is the wrong one.
    const responses: Record<string, Json> = {
      ...operation.responses,
      "400": responseRef("BadRequest"),
      ...(anonymous ? {} : { "401": responseRef("Unauthorized") }),
      ...operation.responses,
    };

    (paths[path] ??= {})[method] = {
      tags: [tag],
      operationId,
      summary,
      ...(description ? { description } : {}),
      ...(anonymous ? { security: [] } : {}),
      ...(parameters?.length ? { parameters } : {}),
      ...(requestBody ? { requestBody } : {}),
      responses,
    };
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Dummy Data Generator API",
      version: API_VERSION,
      description: DESCRIPTION,
    },
    servers: [{ url: serverUrl ?? FALLBACK_SERVER_URL, description: "This server" }],
    tags: TAGS,
    // Any one of the three is enough; a tool shows them as alternatives.
    security: [{ apiKey: [] }, { userToken: [] }, { sessionCookie: [] }],
    paths,
    components: {
      securitySchemes: {
        apiKey: {
          type: "apiKey",
          in: "header",
          name: API_KEY_HEADER,
          description: `A key from \`POST /api/keys\`, which begins \`${API_KEY_PREFIX}\`.`,
        },
        userToken: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "A PocketBase user token, sent raw — no `Bearer` prefix.",
        },
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: SESSION_COOKIE,
          description: "Set by `POST /api/auth/login`. httpOnly, so only a browser sends it.",
        },
      },
      responses: {
        BadRequest: jsonResponse("The request could not be read, or was refused by name.", ref("Error")),
        Unauthorized: jsonResponse("No credential, or one that is no longer good.", ref("Error")),
        NotFound: jsonResponse("No such record — or one that is not yours to reach.", ref("Error")),
      },
      schemas: schemas(),
    },
  };
}
