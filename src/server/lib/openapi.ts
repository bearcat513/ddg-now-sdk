/**
 * The scripted REST API, written out as an OpenAPI document.
 *
 * The Bun app's `src/server/openapi.ts`, re-aimed at the routes in
 * `src/fluent/rest/api.now.ts`. It is served whole from `GET /openapi`, so
 * Postman, Bruno, Insomnia and the code generators read the same bytes the
 * reference page at `?view=docs` renders — nothing about the API is written
 * down in the page itself.
 *
 * Shared the way `scriptTemplate.ts` is: compiled into the `sys_module` for
 * the handler, and imported by `tests/openapi.test.ts`, which checks that
 * every route the Fluent definition declares is described here and that
 * nothing is described that is not a route. So it must stay Glide-free — the
 * handler passes in the instance URL rather than this file asking for it.
 *
 * Where a bound is enforced elsewhere — preference limits, template and
 * whiteboard lengths, the field-type union — it is imported rather than
 * retyped, so the document cannot promise a limit the server does not keep.
 *
 * Two things differ from the Bun document because the platform differs:
 *
 *   - **The envelope.** A Scripted REST API wraps whatever a handler answers
 *     in `{ "result": … }`. Every JSON response here is described with that
 *     wrapper, because a tool that imports the document should see the bytes
 *     that actually arrive. The file routes (`/export`, `/script`, and this
 *     document) write to the stream directly and are not wrapped.
 *   - **The credentials.** There are no API keys or app sessions any more;
 *     the instance authenticates, and the caller's own ACLs decide.
 *
 * Version 3.0.3 rather than 3.1, as before: every tool that matters reads 3.0.
 */

import { DEFAULT_PREFERENCES, NAV_SECTIONS, PREFERENCE_LIMITS, THEMES } from './preferences.ts'
import { MAX_TEMPLATE_BODY_LENGTH, MAX_TEMPLATE_NAME_LENGTH, PLACEHOLDERS } from './scriptTemplate.ts'
import { MAX_WHITEBOARD_NAME_LENGTH, MAX_WHITEBOARD_SCENE_LENGTH } from './whiteboard.ts'
import { FIELD_TYPES, LOCALES } from './types.ts'

type Json = Record<string, unknown>

export type OpenApiDocument = {
    openapi: string
    info: Json
    servers: Json[]
    tags: Json[]
    security: Json[]
    paths: Record<string, Json>
    components: Json
}

/** The application scope's REST namespace and the API's `serviceId`. */
export const API_ROOT = '/api/x_1040823_ddg_now/ddg'

/** Where the document lives, relative to `API_ROOT`. */
export const OPENAPI_PATH = '/openapi'

/** What a browser saves it as, and what the tools show in their import list. */
export const OPENAPI_FILE_NAME = 'dummy-data-generator.openapi.json'

/** Matches package.json; the document's own version, not the spec's. */
const API_VERSION = '0.0.1'

/** Used when nothing better is known — a spec has to name some server. */
const FALLBACK_INSTANCE_URL = 'https://your-instance.service-now.com'

/* ------------------------------- small pieces ------------------------------ */

const ref = (schema: string) => ({ $ref: `#/components/schemas/${schema}` })
const responseRef = (response: string) => ({ $ref: `#/components/responses/${response}` })
const array = (schema: Json) => ({ type: 'array', items: schema })

/** A handler's answer as it arrives: inside the platform's `result` wrapper. */
const enveloped = (schema: Json): Json => ({
    type: 'object',
    required: ['result'],
    properties: { result: schema },
})

const jsonResponse = (description: string, schema: Json) => ({
    description,
    content: { 'application/json': { schema: enveloped(schema) } },
})

const jsonBody = (description: string, schema: Json, required = true) => ({
    required,
    description,
    content: { 'application/json': { schema } },
})

/** A download: the tools show it as text rather than trying to parse it. */
const fileResponse = (description: string, media: Record<string, Json>) => ({
    description,
    headers: {
        'Content-Disposition': {
            description: '`attachment`, with the filename the download is saved as.',
            schema: { type: 'string' },
        },
    },
    content: Object.fromEntries(Object.entries(media).map(([type, schema]) => [type, { schema }])),
})

/** `16,000,000` — written out, because an engine's `toLocaleString` is not one to rely on. */
const thousands = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const idParam = (name: string, what: string) => ({
    name,
    in: 'path',
    required: true,
    description: `The ${what}'s sys_id.`,
    schema: { type: 'string' },
})

const queryParam = (name: string, description: string, schema: Json, required = false) => ({
    name,
    in: 'query',
    required,
    description,
    schema,
})

/* -------------------------------- operations ------------------------------- */

export type ApiOperation = {
    method: 'get' | 'post' | 'put' | 'delete'
    /** Relative to `API_ROOT`, exactly as the route's `path` in `api.now.ts`. */
    path: string
    tag: string
    /** The route's `name` in `api.now.ts`, camel-cased. */
    operationId: string
    /** One line: what a tool's sidebar shows beside the request. */
    summary: string
    description?: string
    parameters?: Json[]
    requestBody?: Json
    /** Merged over the defaults every operation shares. */
    responses: Record<string, Json>
}

/**
 * Every route, grouped the way the page draws them.
 *
 * The order inside a tag is the order a caller meets them in: read the list,
 * create one, read one, change it, remove it.
 */
export const OPERATIONS: ApiOperation[] = [
    /* ------------------------------ schemas ------------------------------ */
    {
        method: 'post',
        path: '/infer',
        tag: 'Schemas',
        operationId: 'infer',
        summary: 'Paste a JSON sample, TypeScript type or CREATE TABLE; get a field list',
        description:
            'Stores nothing. The fields that come back are what `POST /config` takes, so the usual flow is ' +
            'infer, adjust, then store.',
        requestBody: jsonBody('The structure to read.', ref('InferInput')),
        responses: { '200': jsonResponse('The inferred schema.', ref('InferResult')) },
    },
    {
        method: 'post',
        path: '/preview',
        tag: 'Schemas',
        operationId: 'preview',
        summary: 'Rows from a field list sent inline — nothing stored, no record needed',
        description:
            'What the editor\'s Preview button calls for a schema that has not been saved. At most 100 rows ' +
            'come back. A field drawing its choices from a table or a Script Include reads it with your session.',
        requestBody: jsonBody('The schema to run.', ref('PreviewInput')),
        responses: { '200': jsonResponse('The rows.', ref('Rows')) },
    },

    /* --------------------------- configurations --------------------------- */
    {
        method: 'get',
        path: '/config',
        tag: 'Configurations',
        operationId: 'configs',
        summary: 'Every configuration you can read, with a field count',
        description:
            'The list leaves the fields themselves behind — `fields` is empty — and carries their count and ' +
            'names instead. `GET /config/{configId}` has the schema.',
        responses: {
            '200': jsonResponse('The configurations.', {
                type: 'object',
                properties: { configs: array(ref('ConfigSummary')) },
            }),
        },
    },
    {
        method: 'post',
        path: '/config',
        tag: 'Configurations',
        operationId: 'createConfig',
        summary: 'Store a field list as a new configuration',
        description: 'The configuration and its field rows are written in one call.',
        requestBody: jsonBody('The schema to store.', ref('ConfigInput')),
        responses: {
            '201': jsonResponse('Stored.', {
                type: 'object',
                properties: {
                    configId: { type: 'string', description: 'The new configuration\'s sys_id.' },
                    fieldCount: { type: 'integer' },
                },
            }),
            '403': responseRef('Forbidden'),
        },
    },
    {
        method: 'get',
        path: '/config/{configId}',
        tag: 'Configurations',
        operationId: 'config',
        summary: 'One configuration, its fields and its mappings',
        parameters: [idParam('configId', 'configuration')],
        responses: { '200': jsonResponse('The configuration.', ref('SchemaConfig')), '404': responseRef('NotFound') },
    },
    {
        method: 'put',
        path: '/config/{configId}',
        tag: 'Configurations',
        operationId: 'updateConfig',
        summary: 'Save a configuration — send "fields" to replace the whole schema',
        description:
            'Every property is optional. Leaving `fields` out changes only the settings; sending it replaces ' +
            'every field row, because an edited schema is reordered and retyped too freely to match rows up. ' +
            'An empty `fields` array is not the same as leaving it out.',
        parameters: [idParam('configId', 'configuration')],
        requestBody: jsonBody('The changes.', ref('ConfigUpdate')),
        responses: {
            '200': jsonResponse('What was stored, read back.', {
                type: 'object',
                properties: {
                    config: ref('SchemaConfig'),
                    fieldCount: { type: 'integer', description: 'Present when `fields` was sent.' },
                },
            }),
            '404': responseRef('NotFound'),
        },
    },
    {
        method: 'delete',
        path: '/config/{configId}',
        tag: 'Configurations',
        operationId: 'deleteConfig',
        summary: 'Delete a configuration and its field rows',
        description: 'Datasets generated from it are kept.',
        parameters: [idParam('configId', 'configuration')],
        responses: { '200': jsonResponse('Deleted.', ref('Ok')), '404': responseRef('NotFound') },
    },

    /* ----------------------------- generation ----------------------------- */
    {
        method: 'post',
        path: '/config/{configId}/generate',
        tag: 'Generation',
        operationId: 'generate',
        summary: 'Run a configuration: 200 with a finished dataset, or 202 with one to poll',
        description: [
            'One route, three acts, chosen by the body:',
            '',
            '- **No flags** stores a dataset. A run within the synchronous limit answers 200 and is `complete`;',
            '  a larger one answers 202 `queued`, and a scheduled job generates it. Poll',
            '  `GET /dataset/{datasetId}` until `state` is `complete` or `failed`.',
            '- **`"preview": true`** answers with at most 100 rows and stores nothing.',
            '- **`"table": "incident"`** inserts the rows into that table instead, as you — your create ACLs',
            '  on it decide, and `mapping` renames columns on the way in.',
            '',
            'The row count falls back to the configuration\'s own, and is capped by the',
            '`x_1040823_ddg_now.max_rows` property.',
        ].join('\n'),
        parameters: [idParam('configId', 'configuration')],
        requestBody: jsonBody('How to run it. `{}` runs it as stored.', ref('GenerateInput'), false),
        responses: {
            '200': {
                description: 'A finished run, preview rows, or an insert report — whichever the body asked for.',
                content: {
                    'application/json': {
                        schema: enveloped({
                            oneOf: [ref('GenerateResult'), ref('Rows'), ref('TableInsertResult')],
                        }),
                    },
                },
            },
            '202': jsonResponse('Queued: too large to generate inside the request.', ref('GenerateResult')),
            '404': responseRef('NotFound'),
        },
    },

    /* ------------------------------ datasets ------------------------------ */
    {
        method: 'get',
        path: '/dataset',
        tag: 'Datasets',
        operationId: 'datasets',
        summary: 'Recent datasets, newest first',
        description: 'At most 100. The rows are not included; see `/dataset/{datasetId}/rows`.',
        parameters: [queryParam('config', 'Only the runs of this configuration (its sys_id).', { type: 'string' })],
        responses: {
            '200': jsonResponse('The datasets.', {
                type: 'object',
                properties: { datasets: array(ref('Dataset')) },
            }),
        },
    },
    {
        method: 'get',
        path: '/dataset/{datasetId}',
        tag: 'Datasets',
        operationId: 'dataset',
        summary: 'Dataset metadata and run state',
        description: 'What to poll after a 202 from generate.',
        parameters: [idParam('datasetId', 'dataset')],
        responses: { '200': jsonResponse('The dataset.', ref('Dataset')), '404': responseRef('NotFound') },
    },
    {
        method: 'delete',
        path: '/dataset/{datasetId}',
        tag: 'Datasets',
        operationId: 'deleteDataset',
        summary: 'Delete a run and the rows stored on it',
        parameters: [idParam('datasetId', 'dataset')],
        responses: { '200': jsonResponse('Deleted.', ref('Ok')), '404': responseRef('NotFound') },
    },
    {
        method: 'get',
        path: '/dataset/{datasetId}/rows',
        tag: 'Datasets',
        operationId: 'datasetRows',
        summary: 'A page of the stored rows as JSON, with the column list',
        description:
            'Read from what the run stored, not generated again. Nested dot-path columns come back flat, the ' +
            'way the preview table shows them. `columns` covers every row, not only the ones returned.',
        parameters: [
            idParam('datasetId', 'dataset'),
            queryParam('limit', 'How many rows to return.', { type: 'integer', minimum: 0, default: 200 }),
        ],
        responses: {
            '200': jsonResponse('The window of rows.', ref('RowWindow')),
            '404': responseRef('NotFound'),
            '409': responseRef('NotReady'),
        },
    },
    {
        method: 'get',
        path: '/dataset/{datasetId}/export',
        tag: 'Datasets',
        operationId: 'export',
        summary: 'The rows themselves, as a JSON, CSV or SQL file',
        description:
            'JSON is the stored column, byte for byte. CSV and SQL are serialised from it, with nested ' +
            'columns flattened to dot paths. Not wrapped in `result`: the body is the file.',
        parameters: [
            idParam('datasetId', 'dataset'),
            queryParam('format', 'Which file to serve.', { type: 'string', enum: ['json', 'csv', 'sql'], default: 'json' }),
        ],
        responses: {
            '200': fileResponse('The file.', {
                'application/json': array(ref('Row')),
                'text/csv': { type: 'string' },
                'application/sql': { type: 'string' },
            }),
            '404': responseRef('NotFound'),
            '409': responseRef('NotReady'),
        },
    },
    {
        method: 'get',
        path: '/dataset/{datasetId}/script',
        tag: 'Datasets',
        operationId: 'datasetScript',
        summary: 'A dataset rendered into a script template, served as a .js file',
        description: [
            'Every placeholder in the template is replaced with a JavaScript literal, so a template never',
            'quotes one. The rows go in as the stored JSON, verbatim — the same bytes `/export` serves.',
            '',
            ...PLACEHOLDERS.map((entry) => `- \`${entry.token}\` — ${entry.description}.`),
            '',
            'Configuration placeholders render as `null` when the configuration has since been deleted.',
        ].join('\n'),
        parameters: [
            idParam('datasetId', 'dataset'),
            queryParam('template', 'The script template\'s sys_id. See `GET /template`.', { type: 'string' }, true),
        ],
        responses: {
            '200': fileResponse('The rendered script.', { 'text/javascript': { type: 'string' } }),
            '400': responseRef('BadRequest'),
            '404': responseRef('NotFound'),
            '409': responseRef('NotReady'),
        },
    },

    /* -------------------------- script templates -------------------------- */
    {
        method: 'get',
        path: '/template',
        tag: 'Script templates',
        operationId: 'templates',
        summary: 'Every script template you can read, bodies included',
        description: 'A template is its body, so the list carries it — unlike the configuration list.',
        responses: {
            '200': jsonResponse('The templates.', {
                type: 'object',
                properties: { templates: array(ref('ScriptTemplate')) },
            }),
        },
    },
    {
        method: 'post',
        path: '/template',
        tag: 'Script templates',
        operationId: 'createTemplate',
        summary: 'Store a script template',
        requestBody: jsonBody('The template.', ref('ScriptTemplateInput')),
        responses: { '201': jsonResponse('Stored.', ref('ScriptTemplate')), '403': responseRef('Forbidden') },
    },
    {
        method: 'get',
        path: '/template/{templateId}',
        tag: 'Script templates',
        operationId: 'template',
        summary: 'One script template',
        parameters: [idParam('templateId', 'script template')],
        responses: { '200': jsonResponse('The template.', ref('ScriptTemplate')), '404': responseRef('NotFound') },
    },
    {
        method: 'put',
        path: '/template/{templateId}',
        tag: 'Script templates',
        operationId: 'updateTemplate',
        summary: 'Save an edited template — name and body together',
        description:
            'Both are required: there is no edit of one that is not an edit of the record. A template you ' +
            'cannot write reads as missing; `canWrite` on the record says which those are.',
        parameters: [idParam('templateId', 'script template')],
        requestBody: jsonBody('The template, whole.', ref('ScriptTemplateInput')),
        responses: { '200': jsonResponse('Saved.', ref('ScriptTemplate')), '404': responseRef('NotFound') },
    },
    {
        method: 'delete',
        path: '/template/{templateId}',
        tag: 'Script templates',
        operationId: 'deleteTemplate',
        summary: 'Delete a script template',
        parameters: [idParam('templateId', 'script template')],
        responses: { '200': jsonResponse('Deleted.', ref('Ok')), '404': responseRef('NotFound') },
    },

    /* ----------------------------- whiteboards ---------------------------- */
    {
        method: 'get',
        path: '/whiteboard',
        tag: 'Whiteboards',
        operationId: 'whiteboards',
        summary: 'Every whiteboard you can read, without drawings',
        description: 'A scene can be megabytes, so the list leaves it out.',
        responses: {
            '200': jsonResponse('The whiteboards.', {
                type: 'object',
                properties: { whiteboards: array(ref('WhiteboardSummary')) },
            }),
        },
    },
    {
        method: 'post',
        path: '/whiteboard',
        tag: 'Whiteboards',
        operationId: 'createWhiteboard',
        summary: 'Store a whiteboard — "scene" is an Excalidraw scene, as text or an object',
        requestBody: jsonBody('The board.', ref('WhiteboardInput')),
        responses: { '201': jsonResponse('Stored.', ref('Whiteboard')), '403': responseRef('Forbidden') },
    },
    {
        method: 'get',
        path: '/whiteboard/{whiteboardId}',
        tag: 'Whiteboards',
        operationId: 'whiteboard',
        summary: 'One whiteboard, its Excalidraw scene included',
        parameters: [idParam('whiteboardId', 'whiteboard')],
        responses: { '200': jsonResponse('The board.', ref('Whiteboard')), '404': responseRef('NotFound') },
    },
    {
        method: 'put',
        path: '/whiteboard/{whiteboardId}',
        tag: 'Whiteboards',
        operationId: 'updateWhiteboard',
        summary: 'Save a whiteboard — answers with the summary, not the scene',
        parameters: [idParam('whiteboardId', 'whiteboard')],
        requestBody: jsonBody('The board, whole.', ref('WhiteboardInput')),
        responses: { '200': jsonResponse('Saved.', ref('WhiteboardSummary')), '404': responseRef('NotFound') },
    },
    {
        method: 'delete',
        path: '/whiteboard/{whiteboardId}',
        tag: 'Whiteboards',
        operationId: 'deleteWhiteboard',
        summary: 'Delete a whiteboard',
        parameters: [idParam('whiteboardId', 'whiteboard')],
        responses: { '200': jsonResponse('Deleted.', ref('Ok')), '404': responseRef('NotFound') },
    },

    /* ----------------------------- preferences ---------------------------- */
    {
        method: 'get',
        path: '/preferences',
        tag: 'Preferences',
        operationId: 'preferences',
        summary: 'Your own workspace preferences, or the defaults',
        description: 'Always the caller\'s — there is no way to name a user.',
        responses: {
            '200': jsonResponse('The preferences.', {
                type: 'object',
                properties: { preferences: ref('Preferences') },
            }),
        },
    },
    {
        method: 'put',
        path: '/preferences',
        tag: 'Preferences',
        operationId: 'updatePreferences',
        summary: 'Change some preferences; the reply is what was kept after clamping',
        description:
            'A patch: the body is merged over the stored set, so one key changes one preference. Out-of-range ' +
            'numbers are clamped and unknown values fall back to the default rather than being refused.',
        requestBody: jsonBody('The preferences to change — any subset.', ref('Preferences')),
        responses: {
            '200': jsonResponse('The whole set, as stored.', {
                type: 'object',
                properties: { preferences: ref('Preferences') },
            }),
        },
    },

    /* ------------------------------ discovery ----------------------------- */
    {
        method: 'get',
        path: OPENAPI_PATH,
        tag: 'Discovery',
        operationId: 'openapi',
        summary: 'This API as an OpenAPI 3.0 document, for Postman, Bruno and friends',
        description:
            'Import it by URL to keep it current, or save the file. `servers` names the instance it was ' +
            'fetched from. Not wrapped in `result`: the body is the document.',
        responses: {
            '200': {
                description: 'The document.',
                content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
            },
        },
    },
]

/* --------------------------------- schemas -------------------------------- */

const FIELD_TYPE_NAMES = FIELD_TYPES.map((type) => type.type)

const ROW_COUNT = {
    type: 'integer',
    minimum: PREFERENCE_LIMITS.rowCount.min,
    maximum: PREFERENCE_LIMITS.rowCount.max,
}

/**
 * The preference set, read off the defaults.
 *
 * Taking the keys from the default set means a preference added to the app
 * appears here the day it is added, rather than whenever someone remembers.
 */
function preferencesSchema(): Json {
    const bounded: Record<string, Json> = {
        theme: { enum: THEMES },
        collapsedNavSections: { ...array({ type: 'string', enum: [...NAV_SECTIONS] }) },
        defaultFieldType: { enum: FIELD_TYPE_NAMES },
        defaultExportFormat: { enum: ['csv', 'json', 'sql'] },
        defaultTemplateId: { description: 'A script template sys_id, or empty for the first in the list.' },
        defaultRowCount: { minimum: PREFERENCE_LIMITS.rowCount.min, maximum: PREFERENCE_LIMITS.rowCount.max },
        previewRowLimit: { minimum: PREFERENCE_LIMITS.previewRows.min, maximum: PREFERENCE_LIMITS.previewRows.max },
        editorSplitPercent: {
            minimum: PREFERENCE_LIMITS.editorSplit.min,
            maximum: PREFERENCE_LIMITS.editorSplit.max,
        },
    }

    const properties: Record<string, Json> = {}
    for (const [key, value] of Object.entries(DEFAULT_PREFERENCES)) {
        const type = Array.isArray(value)
            ? 'array'
            : typeof value === 'boolean'
              ? 'boolean'
              : typeof value === 'number'
                ? 'integer'
                : 'string'
        properties[key] = { type, default: value, ...(bounded[key] ?? {}) }
    }

    return {
        type: 'object',
        description: 'Per-user workspace defaults. Anything never set reads as the default shown here.',
        properties,
    }
}

const fieldOptionsSchema: Json = {
    type: 'object',
    description:
        'What a field type accepts. Anything a type does not read is ignored rather than refused, so one ' +
        'options object can be carried across a change of type.',
    additionalProperties: true,
    example: { min: 1, max: 100 },
    properties: {
        min: { type: 'number', description: 'Numeric floor, array length, or lorem word count.' },
        max: { type: 'number', description: 'Numeric ceiling.' },
        decimals: { type: 'integer', description: 'Places on a float or a price.' },
        values: { ...array({ type: 'string' }), description: 'An enum\'s pool of allowed values.' },
        weights: { ...array({ type: 'number' }), description: 'One weight per value, to skew the pick.' },
        valuesFrom: {
            type: 'string',
            enum: ['list', 'scriptInclude', 'table', 'rest'],
            description: 'Where an enum\'s pool comes from.',
        },
        scriptInclude: { type: 'string', description: 'A Script Include exposing `getChoices()`.' },
        choiceTable: { type: 'string', description: 'The table an enum reads its choices from.' },
        choiceQuery: { type: 'string', description: 'An encoded query narrowing that read.' },
        choiceField: { type: 'string', description: 'The column whose values become the pool.' },
        restMessage: { type: 'string', description: 'A REST Message record name for an external source.' },
        restMethod: { type: 'string', description: 'The HTTP method function on that REST Message.' },
        from: { type: 'string', description: 'Lower bound for a date type (ISO-8601).' },
        to: { type: 'string', description: 'Upper bound for a date type (ISO-8601).' },
        format: {
            type: 'string',
            enum: ['iso', 'datetime', 'date', 'time', 'unix'],
            description: 'Date output shape.',
        },
        pattern: { type: 'string', description: 'A template, e.g. "ORD-{{number:1000-9999}}-{{word}}".' },
        prefix: { type: 'string', description: 'Prepended to the stringified value.' },
        suffix: { type: 'string', description: 'Appended to the stringified value.' },
        arrayOf: { type: 'string', enum: FIELD_TYPE_NAMES, description: 'The element type of an array field.' },
        truePercent: { type: 'number', minimum: 0, maximum: 100, description: 'A boolean\'s chance of being true.' },
        expression: { type: 'string', description: 'Arithmetic over other numeric fields, e.g. "quantity * price".' },
        table: { type: 'string', description: 'nowQuery: the table the query counts.' },
        query: { type: 'string', description: 'nowQuery: the encoded query.' },
        distribution: {
            type: 'string',
            enum: ['uniform', 'normal', 'lognormal', 'pareto'],
            description: 'The shape of a numeric draw.',
        },
        mean: { type: 'number', description: 'Normal: the centre. Lognormal: the median, in real units.' },
        stddev: { type: 'number', description: 'Normal: the spread.' },
        shape: { type: 'number', description: 'Pareto: the tail index — smaller is heavier.' },
        derivesFrom: { type: 'string', description: 'The field an email, username, slug or initials is built from.' },
        bundle: {
            type: 'string',
            enum: ['person', 'address', 'card', 'device', 'company'],
            description: 'Which correlated column set a bundle field emits.',
        },
        fields: { ...array(ref('Field')), description: 'Child fields of an object, or of an array of objects.' },
        refDataset: { type: 'string', description: 'The dataset a reference field draws from.' },
        refField: { type: 'string', description: 'The column within that dataset.' },
        refMode: { type: 'string', enum: ['random', 'cycle', 'unique'], description: 'How rows walk the pool.' },
        when: { type: 'string', description: 'A predicate; the value is null on the rows where it is false.' },
        after: { type: 'string', description: 'A date column this value must follow.' },
    },
}

const configSettings: Record<string, Json> = {
    name: { type: 'string' },
    description: { type: 'string' },
    rowCount: { ...ROW_COUNT, description: 'How many rows a run produces when the caller does not say.' },
    seed: { type: 'string', description: 'Same seed and schema produce identical rows. Empty means random.' },
    locale: {
        type: 'string',
        enum: LOCALES.map((locale) => locale.code),
        description: 'Applies to every name, address and phone in the run.',
    },
}

function schemas(): Record<string, Json> {
    return {
        Error: {
            type: 'object',
            description: 'What a handler answers when it refuses, inside `result` like everything else.',
            required: ['error'],
            properties: { error: { type: 'string' } },
        },
        PlatformError: {
            type: 'object',
            description:
                'What the instance answers when it refuses before a handler runs — no credential, an ACL on the ' +
                'API itself. Not wrapped in `result`.',
            properties: {
                error: {
                    type: 'object',
                    properties: { message: { type: 'string' }, detail: { type: 'string' } },
                },
                status: { type: 'string', enum: ['failure'] },
            },
        },
        Ok: {
            type: 'object',
            description: 'What a delete answers with.',
            required: ['ok'],
            properties: { ok: { type: 'boolean', enum: [true] } },
        },
        Row: {
            type: 'object',
            description: 'One generated row: the field names, and their values.',
            additionalProperties: true,
            example: { id: 'b1c9e0a2-4f3e-4d8a-9c1b-7e2f5a6d8c90', email: 'ada@example.com', age: 31 },
        },
        Rows: {
            type: 'object',
            properties: { rows: array(ref('Row')) },
        },

        Field: {
            type: 'object',
            required: ['name', 'type'],
            properties: {
                id: { type: 'string', description: 'Stable per field; any unique string.', example: 'f1' },
                name: {
                    type: 'string',
                    description: 'The column name. A dot path ("user.address.city") nests in JSON.',
                    example: 'email',
                },
                type: { type: 'string', enum: FIELD_TYPE_NAMES, description: 'One of the generator\'s types.' },
                nullPercent: { type: 'number', minimum: 0, maximum: 100, description: 'Chance of a null.' },
                unique: { type: 'boolean', description: 'Best-effort uniqueness across the run.' },
                options: ref('FieldOptions'),
            },
        },
        FieldOptions: fieldOptionsSchema,
        FieldMapping: {
            type: 'object',
            description:
                'A field that draws its values from a column of another configuration\'s newest dataset. ' +
                'Read-only here: mappings are edited on the configuration\'s form.',
            properties: {
                id: { type: 'string' },
                field: { type: 'string', description: 'The field in this schema that receives the values.' },
                fromConfig: { type: 'string', description: 'The configuration the values come from.' },
                fromConfigName: { type: 'string' },
                fromField: { type: 'string', description: 'The column within that configuration\'s data.' },
                mode: { type: 'string', enum: ['random', 'cycle', 'unique'] },
            },
        },

        InferInput: {
            type: 'object',
            required: ['input'],
            properties: {
                input: { type: 'string', description: 'A JSON document, a TypeScript type, or a CREATE TABLE.' },
            },
            example: { input: '{"email": "a@b.com", "age": 31}' },
        },
        InferResult: {
            type: 'object',
            properties: {
                detected: { type: 'string', enum: ['json', 'typescript', 'sql'] },
                notes: { ...array({ type: 'string' }), description: 'What it had to guess at, in plain words.' },
                fields: array(ref('Field')),
            },
        },
        PreviewInput: {
            type: 'object',
            required: ['fields'],
            properties: {
                fields: array(ref('Field')),
                rowCount: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                seed: { type: 'string' },
                locale: configSettings.locale,
            },
            example: { rowCount: 5, fields: [{ id: 'f1', name: 'email', type: 'email' }] },
        },

        SchemaConfig: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                ...configSettings,
                fields: array(ref('Field')),
                mappings: array(ref('FieldMapping')),
                metadata: ref('Metadata'),
                ownerId: { type: 'string', description: 'The user name that created it.' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
            },
        },
        ConfigSummary: {
            allOf: [
                ref('SchemaConfig'),
                {
                    type: 'object',
                    properties: {
                        fieldCount: { type: 'integer' },
                        fieldNames: array({ type: 'string' }),
                    },
                },
            ],
        },
        ConfigInput: {
            type: 'object',
            required: ['name', 'fields'],
            properties: {
                ...configSettings,
                rowCount: { ...ROW_COUNT, default: 100 },
                locale: { ...(configSettings.locale as Json), default: 'en' },
                fields: { ...array(ref('Field')), minItems: 1 },
            },
            example: { name: 'Orders', fields: [{ id: 'f1', name: 'email', type: 'email' }] },
        },
        ConfigUpdate: {
            type: 'object',
            properties: {
                ...configSettings,
                metadata: ref('Metadata'),
                fields: { ...array(ref('Field')), description: 'The whole schema. Leave out to keep it.' },
            },
            example: { name: 'Orders', rowCount: 500, fields: [{ id: 'f1', name: 'email', type: 'email' }] },
        },
        Metadata: {
            type: 'object',
            description: 'Free-form pairs describing what a schema is for. Values are text.',
            additionalProperties: { type: 'string' },
            example: { team: 'billing' },
        },

        GenerateInput: {
            type: 'object',
            properties: {
                rowCount: { ...ROW_COUNT, description: 'Overrides the configuration\'s own count for this run.' },
                preview: { type: 'boolean', description: 'Answer with rows and store nothing.' },
                table: { type: 'string', description: 'Insert into this table instead of storing a dataset.' },
                mapping: {
                    type: 'object',
                    additionalProperties: { type: 'string' },
                    description: 'With `table`: generated column → table column.',
                    example: { summary: 'short_description' },
                },
                skipBusinessRules: {
                    type: 'boolean',
                    default: false,
                    description: 'With `table`: insert without running that table\'s business rules.',
                },
            },
            example: { rowCount: 500 },
        },
        GenerateResult: {
            type: 'object',
            properties: {
                datasetId: { type: 'string' },
                rowCount: { type: 'integer' },
                state: { type: 'string', enum: ['complete', 'queued'] },
            },
        },
        TableInsertResult: {
            type: 'object',
            properties: {
                table: { type: 'string' },
                inserted: { type: 'integer' },
                attempted: { type: 'integer' },
                errors: { ...array({ type: 'string' }), description: 'Why rows were not inserted, one per failure.' },
            },
        },

        Dataset: {
            type: 'object',
            description: 'One generated run. The rows are stored on it as JSON.',
            properties: {
                id: { type: 'string' },
                configId: { type: 'string', nullable: true, description: 'The configuration it came from.' },
                name: { type: 'string', description: 'The schema name plus the run stamp.' },
                rowCount: { type: 'integer' },
                fieldCount: { type: 'integer' },
                ownerId: { type: 'string' },
                state: { type: 'string', enum: ['queued', 'running', 'complete', 'failed'] },
                error: { type: 'string', description: 'Why the run failed, when it did.' },
                createdAt: { type: 'string' },
            },
        },
        RowWindow: {
            type: 'object',
            properties: {
                rows: array(ref('Row')),
                columns: { ...array({ type: 'string' }), description: 'Every column in the dataset.' },
                truncated: { type: 'boolean', description: 'Whether `rows` is only the first part.' },
                total: { type: 'integer' },
            },
        },

        ScriptTemplate: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string', maxLength: MAX_TEMPLATE_NAME_LENGTH },
                body: { type: 'string', maxLength: MAX_TEMPLATE_BODY_LENGTH },
                ownerId: { type: 'string' },
                canWrite: { type: 'boolean', description: 'Whether you may save over it, as the ACL decides.' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
            },
        },
        ScriptTemplateInput: {
            type: 'object',
            required: ['name', 'body'],
            properties: {
                name: { type: 'string', maxLength: MAX_TEMPLATE_NAME_LENGTH },
                body: {
                    type: 'string',
                    maxLength: MAX_TEMPLATE_BODY_LENGTH,
                    description: 'JavaScript with `${PLACEHOLDERS}`. Also accepted as `script`.',
                },
            },
            example: { name: 'Seed incidents', body: 'var records = ${GENERATED_DATASET};' },
        },

        WhiteboardSummary: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string', maxLength: MAX_WHITEBOARD_NAME_LENGTH },
                ownerId: { type: 'string' },
                canWrite: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
            },
        },
        Whiteboard: {
            allOf: [
                ref('WhiteboardSummary'),
                {
                    type: 'object',
                    properties: {
                        scene: { type: 'string', description: 'The `.excalidraw` file\'s text, verbatim.' },
                    },
                },
            ],
        },
        WhiteboardInput: {
            type: 'object',
            required: ['name'],
            properties: {
                name: { type: 'string', maxLength: MAX_WHITEBOARD_NAME_LENGTH },
                scene: {
                    description:
                        `An Excalidraw scene — the text of a \`.excalidraw\` file, or the parsed object. ` +
                        `At most ${thousands(MAX_WHITEBOARD_SCENE_LENGTH)} characters. Left out, ` +
                        'the board is blank.',
                    oneOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }],
                },
            },
            example: { name: 'Orders data model', scene: { type: 'excalidraw', version: 2, elements: [] } },
        },

        Preferences: preferencesSchema(),
    }
}

/* -------------------------------- assembly -------------------------------- */

const TAGS: Json[] = [
    { name: 'Schemas', description: 'Inferring a schema from a sample, and trying one before it is stored.' },
    { name: 'Configurations', description: 'Stored schemas: the fields, and the settings a run uses.' },
    { name: 'Generation', description: 'Running a configuration — into a dataset, a preview, or a real table.' },
    { name: 'Datasets', description: 'What a run produced: its state, its rows, downloads and rendered scripts.' },
    { name: 'Script templates', description: 'JavaScript a dataset is substituted into.' },
    { name: 'Whiteboards', description: 'Excalidraw boards, one record each.' },
    { name: 'Preferences', description: 'Your own workspace defaults, stored on the instance.' },
    { name: 'Discovery', description: 'This document.' },
]

const DESCRIPTION = [
    'Infer a schema from a pasted sample, generate seeded, realistic rows from it, and take them away as',
    'JSON, CSV, SQL or a script. This is the scoped application\'s Scripted REST API — the same routes the',
    'app\'s own page calls.',
    '',
    '### Authentication',
    '',
    'The instance authenticates; this API holds no credentials of its own. Any of these reaches it:',
    '',
    '- **Basic auth** — a user name and password, which is what a script or a CI job usually uses.',
    '- `Authorization: Bearer <token>` — an OAuth access token from an application registry entry.',
    '- `X-UserToken` — the session token (`g_ck`) a signed-in browser page already holds, sent with its',
    '  session cookie. This page\'s own trial calls use it.',
    '',
    '### Access',
    '',
    'Every read and write runs as the caller, through the table ACLs. A record you may not read answers',
    '404 exactly as one that does not exist would, and one you may read but not write answers 404 to a',
    'change — `canWrite` on templates and whiteboards says which is which in advance.',
    '',
    '### Responses',
    '',
    'JSON answers arrive inside the platform\'s envelope, `{ "result": … }`. The file routes — `/export`,',
    '`/script` and `/openapi` — are the exception: their body is the file.',
    '',
    'A refusal from a handler is `{ "result": { "error": string } }` with an honest status: 400 for a',
    'request it could not use, 404 for a missing or unreadable record, 409 for a dataset whose run has not',
    'finished. A refusal from the instance itself — no credential, say — is',
    '`{ "error": { "message", "detail" }, "status": "failure" }`, unwrapped.',
].join('\n')

/**
 * The document itself.
 *
 * `instanceUrl` should be the instance the request arrived on, so a collection
 * imported from it points back at that instance rather than a placeholder.
 */
export function buildOpenApiDocument({ instanceUrl }: { instanceUrl?: string } = {}): OpenApiDocument {
    const paths: Record<string, Json> = {}

    for (const operation of OPERATIONS) {
        const { method, path, tag, operationId, summary, description, parameters, requestBody } = operation

        // Every route can be refused by the instance before it runs, and can
        // fail inside the handler; a route that reads a body can also refuse
        // it. Said once here rather than on every operation. The operation's
        // own list is spread twice on purpose: the first fixes the order, so
        // its success is listed before the failures, and the second lets it
        // override a default.
        const responses: Record<string, Json> = {
            ...operation.responses,
            ...(requestBody ? { '400': responseRef('BadRequest') } : {}),
            '401': responseRef('Unauthorized'),
            '500': responseRef('ServerError'),
            ...operation.responses,
        }

        const item = paths[path] ?? (paths[path] = {})
        item[method] = {
            tags: [tag],
            operationId,
            summary,
            ...(description ? { description } : {}),
            ...(parameters?.length ? { parameters } : {}),
            ...(requestBody ? { requestBody } : {}),
            responses,
        }
    }

    const instance = (instanceUrl || FALLBACK_INSTANCE_URL).replace(/\/+$/, '')

    return {
        openapi: '3.0.3',
        info: {
            title: 'Dummy Data Generator API',
            version: API_VERSION,
            description: DESCRIPTION,
        },
        servers: [{ url: `${instance}${API_ROOT}`, description: 'This instance' }],
        tags: TAGS,
        // Any one of them is enough; a tool shows them as alternatives.
        security: [{ basicAuth: [] }, { bearerAuth: [] }, { sessionToken: [] }],
        paths,
        components: {
            securitySchemes: {
                basicAuth: {
                    type: 'http',
                    scheme: 'basic',
                    description: 'An instance user name and password.',
                },
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    description: 'An OAuth 2.0 access token issued by the instance.',
                },
                sessionToken: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-UserToken',
                    description: 'A signed-in page\'s `g_ck`. Only good alongside that session\'s cookie.',
                },
            },
            responses: {
                BadRequest: jsonResponse('The request could not be used, and says why.', ref('Error')),
                Forbidden: jsonResponse('Your create ACLs refused the record.', ref('Error')),
                NotFound: jsonResponse('No such record — or one that is not yours to reach.', ref('Error')),
                NotReady: jsonResponse('The dataset is still queued or running, or its run failed.', ref('Error')),
                ServerError: jsonResponse('The handler failed; the message is the one it threw.', ref('Error')),
                Unauthorized: {
                    description: 'No credential, or one the instance does not accept.',
                    content: { 'application/json': { schema: ref('PlatformError') } },
                },
            },
            schemas: schemas(),
        },
    }
}
