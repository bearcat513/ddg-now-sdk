/**
 * The scripted REST handlers.
 *
 * Twenty-one routes, not thirty-six. The Bun server's route list carried auth,
 * sessions, API keys, sharing, notes and Telegram, none of which came across.
 * What is left is this application's actual subject — schemas, runs, the rows
 * they produce, and the scripts those rows are dropped into:
 *
 *   POST   /infer                      paste a structure, get a field list
 *   POST   /preview                    rows from a schema that has no record yet
 *   GET    /config                     every configuration the caller can read
 *   POST   /config                     store an inferred field list as a schema
 *   GET    /config/{configId}          one configuration, fields included
 *   PUT    /config/{configId}          save the schema editor's whole state
 *   DELETE /config/{configId}          remove it, and its field rows
 *   POST   /config/{configId}/generate run a generation, get a dataset id
 *   GET    /dataset                    recent datasets
 *   GET    /dataset/{datasetId}        metadata and run state
 *   GET    /dataset/{datasetId}/rows   a page of generated rows, as JSON
 *   GET    /dataset/{datasetId}/export the rows themselves, as a file
 *   DELETE /dataset/{datasetId}        remove a run
 *   GET    /preferences                the caller's own workspace preferences
 *   PUT    /preferences                change some of them
 *   GET    /template                   every script template the caller can read
 *   POST   /template                   store one
 *   GET    /template/{templateId}      one template, body included
 *   PUT    /template/{templateId}      save an edited body
 *   DELETE /template/{templateId}      remove it
 *   GET    /dataset/{datasetId}/script a dataset rendered into a template
 *
 * They are also the UI Page's entire data layer. That is a deliberate change
 * of direction: the page used to reach records through the platform's own list
 * and form components, and now renders the Bun application's UI instead, which
 * means one typed client over these routes exactly as `lib/api.ts` was one
 * typed client over the Bun server's. The endpoints a pipeline would call and
 * the endpoints the page calls are therefore the same endpoints, which is what
 * keeps the two honest about each other.
 *
 * Route handlers are one of the Fluent APIs that accept function imports, so
 * these are typed modules rather than script strings — which is what lets them
 * share `run.ts` with the scheduled job and the UI Action. They are written as
 * `export function` declarations rather than `const` bindings because that is
 * what the Fluent build can resolve a `script:` reference to.
 *
 * None of them check permissions. That is not an omission: every read and
 * write underneath goes through `GlideRecordSecure`, so the caller's own ACLs
 * decide, exactly as PocketBase's collection rules did for the Bun version.
 * A handler that re-implemented the check here would be a second, weaker copy.
 */

import { inferSchema } from '../infer/infer.ts'
import {
    createConfig,
    deleteConfig,
    deleteDataset,
    getConfig,
    getDataset,
    listConfigs,
    listDatasets,
    readDatasetRows,
    replaceFields,
    summariseFields,
    updateConfig,
} from '../db/db.ts'
import { previewInline, previewRows, runToDataset, runToTable } from '../run.ts'
import { exportFile, serialize, type ExportFormat } from '../export/export.ts'
import { flatten } from '../lib/rows.ts'
import { FIELD_TYPE_SET, type Field } from '../lib/types.ts'
import { fail, guarded, json, param, readBody, type RestRequest, type RestResponse } from './http.ts'
import { getPreferences, writePreferences } from '../db/preferences.ts'
import {
    createTemplate,
    deleteTemplate,
    getTemplate,
    listTemplates,
    updateTemplate,
    validateTemplate,
    type TemplateInput,
} from '../db/templates.ts'
import { renderScriptTemplate, scriptFileName, scriptTemplateValues } from '../lib/scriptTemplate.ts'

/* --------------------------------- /infer -------------------------------- */

/**
 * Turns a pasted JSON sample, TypeScript interface or `CREATE TABLE` into a
 * field list. The whole inference layer ported unchanged — it never imported
 * anything outside the repo — so this endpoint answers exactly as the Bun one
 * did for the same input.
 */
export function inferHandler(request: RestRequest, response: RestResponse): void {
    guarded('infer', response, () => {
        const body = readBody(request)
        const input = typeof body.input === 'string' ? body.input : ''
        if (!input.trim()) return fail(response, 400, 'Send { "input": "<JSON, TypeScript or DDL>" }.')

        const result = inferSchema(input)
        json(response, 200, { detected: result.detected, notes: result.notes, fields: result.fields })
    })
}

/* -------------------------------- /preview ------------------------------- */

/**
 * Rows from a field list, straight out of the request body.
 *
 * The editor's Preview button is the caller: it runs the schema on screen
 * before there is a record to run against. `/config/{id}/generate` with
 * `"preview": true` does the same thing for a stored configuration, and this
 * is the arm for one that has not been saved — which is the state a schema
 * spends most of its life in while someone is still working on it.
 *
 * Nothing is stored and nothing is read, so the endpoint is as privileged as
 * the body it was handed: it generates from fields the caller just sent. The
 * exception is a field drawing its choices from a table or a Script Include,
 * which `resolveChoiceScripts` reads with the caller's own session.
 */
export function previewHandler(request: RestRequest, response: RestResponse): void {
    guarded('preview', response, () => {
        const body = readBody(request)
        const fields = Array.isArray(body.fields) ? (body.fields as Field[]) : []
        if (!fields.length) return fail(response, 400, 'Send at least one field.')

        const invalid = fields.filter((f) => !f?.name || !FIELD_TYPE_SET.has(f.type))
        if (invalid.length) {
            return fail(response, 400, `Unknown field type(s): ${invalid.map((f) => f?.type).join(', ')}`)
        }

        const rows = previewInline({
            fields,
            rowCount: typeof body.rowCount === 'number' ? body.rowCount : undefined,
            seed: typeof body.seed === 'string' ? body.seed : undefined,
            locale: typeof body.locale === 'string' ? body.locale : undefined,
        })
        json(response, 200, { rows })
    })
}

/* -------------------------------- /config -------------------------------- */

/**
 * Reads configurations: the whole list, or one with its fields.
 *
 * One handler for both because the path parameter is the only difference, and
 * the platform routes `/config` and `/config/{configId}` to whichever script
 * each route names — splitting them would be two functions that differ by an
 * `if`.
 *
 * The list carries a field count and the field *names*, but not the fields.
 * The navigation list needs to say how big a schema is and its search box
 * matches on column names; neither needs types, options or ordering, and
 * fetching every child row in full to render a subtitle is the cost the child
 * table was meant to avoid. `summariseFields` produces both in one secure
 * pass over the field table.
 */
export function configHandler(request: RestRequest, response: RestResponse): void {
    guarded('config', response, () => {
        const configId = request.pathParams?.configId
        if (configId) {
            const config = getConfig(configId)
            if (!config) return fail(response, 404, 'No such configuration, or you may not read it.')
            return json(response, 200, config)
        }

        const configs = listConfigs()
        const summaries = summariseFields()
        json(response, 200, {
            configs: configs.map((config) => {
                const summary = summaries[config.id]
                return { ...config, fieldCount: summary?.count ?? 0, fieldNames: summary?.names ?? [] }
            }),
        })
    })
}

/**
 * Saves the schema editor's state.
 *
 * The whole field list comes with it, and `replaceFields` writes it wholesale
 * — the editor reorders, retypes and deletes rows freely, so which stored row
 * corresponds to which edited one is not a question the server can answer.
 * Sending the list only when it is present is what keeps a rename of the
 * configuration from being able to wipe its schema: `undefined` means "not
 * part of this edit", which is different from an empty array.
 */
export function updateConfigHandler(request: RestRequest, response: RestResponse): void {
    guarded('update-config', response, () => {
        const configId = request.pathParams?.configId
        if (!configId) return fail(response, 400, 'No configuration id in the path.')

        const body = readBody(request)
        const fields = Array.isArray(body.fields) ? (body.fields as Field[]) : null

        if (fields) {
            const invalid = fields.filter((f) => !f?.name || !FIELD_TYPE_SET.has(f.type))
            if (invalid.length) {
                return fail(response, 400, `Unknown field type(s): ${invalid.map((f) => f?.type).join(', ')}`)
            }
        }

        const updated = updateConfig(configId, {
            name: typeof body.name === 'string' ? body.name.trim() : undefined,
            description: typeof body.description === 'string' ? body.description : undefined,
            rowCount: typeof body.rowCount === 'number' ? body.rowCount : undefined,
            seed: typeof body.seed === 'string' ? body.seed : undefined,
            locale: typeof body.locale === 'string' ? body.locale : undefined,
            metadata: (body.metadata as Record<string, string> | undefined) ?? undefined,
        })
        if (!updated) return fail(response, 404, 'No such configuration, or you may not write to it.')

        const fieldCount = fields ? replaceFields(configId, fields) : undefined

        // Read it back rather than echoing the request: the caller's next
        // render should show what was stored, including anything a business
        // rule changed on the way in.
        json(response, 200, { config: getConfig(configId), fieldCount })
    })
}

export function deleteConfigHandler(request: RestRequest, response: RestResponse): void {
    guarded('delete-config', response, () => {
        const configId = request.pathParams?.configId
        if (!configId) return fail(response, 400, 'No configuration id in the path.')
        if (!deleteConfig(configId)) {
            return fail(response, 404, 'No such configuration, or you may not delete it.')
        }
        json(response, 200, { ok: true })
    })
}

/**
 * Creates a configuration and its fields in one call.
 *
 * This is what completes the paste-and-infer flow: `/infer` hands back a field
 * list, the caller edits it, and this stores it. Doing it in one request
 * rather than a create followed by N child inserts matters because the field
 * rows have no meaning without their parent — a half-written schema is not a
 * state worth being able to reach over HTTP.
 */
export function createConfigHandler(request: RestRequest, response: RestResponse): void {
    guarded('create-config', response, () => {
        const body = readBody(request)
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        if (!name) return fail(response, 400, 'A configuration needs a name.')

        const fields = Array.isArray(body.fields) ? (body.fields as Field[]) : []
        if (!fields.length) return fail(response, 400, 'Send at least one field.')

        const invalid = fields.filter((f) => !f?.name || !FIELD_TYPE_SET.has(f.type))
        if (invalid.length) {
            return fail(response, 400, `Unknown field type(s): ${invalid.map((f) => f?.type).join(', ')}`)
        }

        const configId = createConfig(
            {
                name,
                description: typeof body.description === 'string' ? body.description : '',
                rowCount: typeof body.rowCount === 'number' ? body.rowCount : 100,
                seed: typeof body.seed === 'string' ? body.seed : '',
                locale: typeof body.locale === 'string' ? body.locale : 'en',
            },
            fields,
        )
        if (!configId) return fail(response, 403, 'Could not create the configuration — check your create access.')

        json(response, 201, { configId, fieldCount: fields.length })
    })
}

/* ---------------------------- /config/{id}/generate ---------------------- */

/**
 * Runs a generation.
 *
 * Answers 200 with a finished dataset for a small run and 202 with a dataset
 * to poll for a large one — the caller gets a record id either way, so a
 * script can treat both the same and just wait on `state`.
 *
 * `table` switches to target-table mode, which writes outside this app's
 * scope. It stays a distinct branch rather than a quiet flag because it is a
 * genuinely different act, and the write it performs is the caller's own.
 */
export function generateHandler(request: RestRequest, response: RestResponse): void {
    guarded('generate', response, () => {
        const configId = request.pathParams?.configId
        if (!configId) return fail(response, 400, 'No configuration id in the path.')

        const body = readBody(request)
        const rowCount = typeof body.rowCount === 'number' ? body.rowCount : undefined

        // A preview never stores anything, so it is its own answer rather than
        // a dataset record someone has to clean up afterwards.
        if (body.preview === true) {
            const rows = previewRows(configId, rowCount ?? 10)
            if (!rows) return fail(response, 404, 'No such configuration, or you may not read it.')
            return json(response, 200, { rows })
        }

        if (typeof body.table === 'string' && body.table.trim()) {
            const outcome = runToTable(configId, body.table.trim(), {
                rowCount,
                mapping: body.mapping as Record<string, string> | undefined,
                skipBusinessRules: body.skipBusinessRules === true,
            })
            if (!outcome.ok) return fail(response, 400, outcome.error)
            return json(response, 200, {
                table: body.table,
                inserted: outcome.report.inserted,
                attempted: outcome.report.attempted,
                errors: outcome.report.errors,
            })
        }

        // No `format` here: a run is stored as JSON and nothing else. What the
        // caller wants it as is a question for `/export`, which answers it
        // from the stored rows without generating them again.
        const outcome = runToDataset(configId, { rowCount })
        if (!outcome.ok) return fail(response, 400, outcome.error)

        json(response, outcome.state === 'queued' ? 202 : 200, {
            datasetId: outcome.datasetId,
            rowCount: outcome.rowCount,
            state: outcome.state,
        })
    })
}

/* ------------------------------ /dataset/{id} ---------------------------- */

export function datasetHandler(request: RestRequest, response: RestResponse): void {
    guarded('dataset', response, () => {
        const datasetId = request.pathParams?.datasetId
        if (!datasetId) {
            // No id: the caller wants the list, optionally narrowed to one config.
            return json(response, 200, { datasets: listDatasets(param(request, 'config')) })
        }

        const dataset = getDataset(datasetId)
        if (!dataset) return fail(response, 404, 'No such dataset, or you may not read it.')
        json(response, 200, dataset)
    })
}

export function deleteDatasetHandler(request: RestRequest, response: RestResponse): void {
    guarded('delete-dataset', response, () => {
        const datasetId = request.pathParams?.datasetId
        if (!datasetId) return fail(response, 400, 'No dataset id in the path.')
        if (!deleteDataset(datasetId)) {
            return fail(response, 404, 'No such dataset, or you may not delete it.')
        }
        json(response, 200, { ok: true })
    })
}

/* ---------------------------- /dataset/{id}/rows ------------------------- */

/** How many rows the preview asks for when the caller does not say. */
const DEFAULT_ROW_WINDOW = 200

/**
 * A page of a stored run's rows, as data rather than as a download.
 *
 * This is what fills the preview table when a dataset is opened from the
 * navigation list, and what gives the reference picker the column names of the
 * pool it is about to point at. It answers from the stored `rows_json`, so it
 * reflects what was actually written rather than re-running the generator —
 * reproducible or not, a second run is a different act from reading the first
 * one.
 *
 * That the stored form is JSON is what makes this endpoint possible at all:
 * CSV and SQL are lossy about types, so parsing either back into rows would
 * hand the table strings where the generator produced numbers, booleans and
 * nulls. The export endpoint serialises into whichever of those the caller
 * wants, so nothing is lost by storing the richer form.
 */
export function datasetRowsHandler(request: RestRequest, response: RestResponse): void {
    guarded('dataset-rows', response, () => {
        const datasetId = request.pathParams?.datasetId
        if (!datasetId) return fail(response, 400, 'No dataset id in the path.')

        const dataset = getDataset(datasetId)
        if (!dataset) return fail(response, 404, 'No such dataset, or you may not read it.')
        if (dataset.state !== 'complete') {
            return fail(response, 409, `Dataset is ${dataset.state}${dataset.error ? `: ${dataset.error}` : ''}.`)
        }

        const stored = readDatasetRows(datasetId)
        if (!stored) return fail(response, 404, 'That dataset has no rows stored on it.')

        // The JSON nests dot paths on the way in; the table and the row
        // inspector both work in the generator's flat column space.
        const all = (JSON.parse(stored) as Record<string, unknown>[]).map((row) => flatten(row))

        const asked = Number(param(request, 'limit'))
        const limit = Number.isFinite(asked) && asked >= 0 ? asked : DEFAULT_ROW_WINDOW
        const rows = all.slice(0, limit)

        json(response, 200, {
            rows,
            // Taken from every row rather than the first: a field with a `when`
            // condition is absent from the rows where it did not apply.
            columns: [...new Set(all.flatMap((row) => Object.keys(row)))],
            truncated: rows.length < all.length,
            total: all.length,
        })
    })
}

/* --------------------------- /dataset/{id}/export ------------------------ */

/**
 * The rows themselves.
 *
 * JSON is the stored form, so asking for JSON — the default — streams the
 * column back untouched, byte for byte. CSV and SQL are made here, from the
 * same string, so an export can never disagree with what the preview table
 * showed or with what a rendered script carries.
 */
export function exportHandler(request: RestRequest, response: RestResponse): void {
    guarded('export', response, () => {
        const datasetId = request.pathParams?.datasetId
        if (!datasetId) return fail(response, 400, 'No dataset id in the path.')

        const dataset = getDataset(datasetId)
        if (!dataset) return fail(response, 404, 'No such dataset, or you may not read it.')
        if (dataset.state !== 'complete') {
            return fail(response, 409, `Dataset is ${dataset.state}${dataset.error ? `: ${dataset.error}` : ''}.`)
        }

        const stored = readDatasetRows(datasetId)
        if (!stored) return fail(response, 404, 'That dataset has no rows stored on it.')

        const asked = (param(request, 'format') ?? '').toLowerCase()
        const wanted: ExportFormat = asked === 'csv' || asked === 'sql' ? asked : 'json'

        if (wanted === 'json') {
            const file = exportFile(dataset.name, 'json')
            response.setStatus(200)
            response.setContentType(file.contentType)
            response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`)
            response.getStreamWriter().writeString(stored)
            return
        }

        // The stored JSON nested the dot paths on the way in, so serialising to
        // a flat format has to undo that first, or every nested column would
        // arrive as a single JSON cell.
        const rows = (JSON.parse(stored) as Record<string, unknown>[]).map((row) => flatten(row))
        const file = serialize(rows, wanted, dataset.name)
        response.setStatus(200)
        response.setContentType(file.contentType)
        response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`)
        response.getStreamWriter().writeString(file.body)
    })
}

/* ------------------------------ /preferences ----------------------------- */

/**
 * How the caller likes the workspace arranged.
 *
 * The Bun app had no endpoint for this: preferences rode down on the session
 * object, because the session was the app's own to build. Here the session
 * belongs to the instance and carries nothing of ours, so the page asks for
 * them like anything else — which is why this route exists and its Bun
 * counterpart did not.
 *
 * There is no id in the path and no way to name a user. The row is always the
 * caller's own, decided by `gs.getUserID()` underneath rather than by anything
 * in the request, so there is no version of this route that reads or writes
 * somebody else's preferences.
 */
export function preferencesHandler(_request: RestRequest, response: RestResponse): void {
    guarded('preferences', response, () => {
        json(response, 200, { preferences: getPreferences() })
    })
}

/**
 * Saves a preference patch and answers with the stored set.
 *
 * The body is merged over what is stored, so sending one preference changes one
 * preference. The answer is what was actually kept rather than what was sent —
 * out-of-range values are clamped on the way in, and the panel takes the reply
 * as the truth so its inputs show the stored number rather than the typed one.
 */
export function updatePreferencesHandler(request: RestRequest, response: RestResponse): void {
    guarded('update-preferences', response, () => {
        json(response, 200, { preferences: writePreferences(readBody(request)) })
    })
}

/* -------------------------------- /template ------------------------------ */

/**
 * The template body a request is asking to store, or a sentence saying why it
 * cannot be. Shared by create and update, which take the same body.
 */
function readTemplateInput(request: RestRequest): { input: TemplateInput } | { error: string } {
    const body = readBody(request)
    const input: TemplateInput = {
        name: typeof body.name === 'string' ? body.name : '',
        // `body` is what the page and the Bun API both called it; `script` is
        // what the column is called. Either spelling is accepted, because a
        // pipeline reading the table and then posting back should not have to
        // rename the field it just read.
        body: typeof body.body === 'string' ? body.body : typeof body.script === 'string' ? body.script : '',
    }
    const error = validateTemplate(input)
    return error ? { error } : { input }
}

/**
 * Reads templates: the whole list, or one of them.
 *
 * Both arms carry the body, unlike the configuration list — see
 * `listTemplates` for why a template is its body and a schema is not.
 */
export function templateHandler(request: RestRequest, response: RestResponse): void {
    guarded('template', response, () => {
        const templateId = request.pathParams?.templateId
        if (templateId) {
            const template = getTemplate(templateId)
            if (!template) return fail(response, 404, 'No such script template, or you may not read it.')
            return json(response, 200, template)
        }
        json(response, 200, { templates: listTemplates() })
    })
}

export function createTemplateHandler(request: RestRequest, response: RestResponse): void {
    guarded('create-template', response, () => {
        const read = readTemplateInput(request)
        if ('error' in read) return fail(response, 400, read.error)

        const template = createTemplate(read.input)
        if (!template) return fail(response, 403, 'Could not save the script template — check your create access.')
        json(response, 201, template)
    })
}

/**
 * Saves an edited template.
 *
 * Name and body together, always: a template is a name and a script, and there
 * is no edit of one that is not an edit of the record. That is the opposite
 * call from `updateConfigHandler`, which treats an absent `fields` as "not
 * part of this edit" — but a configuration has a schema that a rename must not
 * be able to wipe, and a template has nothing to lose that way.
 */
export function updateTemplateHandler(request: RestRequest, response: RestResponse): void {
    guarded('update-template', response, () => {
        const templateId = request.pathParams?.templateId
        if (!templateId) return fail(response, 400, 'No template id in the path.')

        const read = readTemplateInput(request)
        if ('error' in read) return fail(response, 400, read.error)

        const template = updateTemplate(templateId, read.input)
        if (!template) return fail(response, 404, 'No such script template, or it is not yours to change.')
        json(response, 200, template)
    })
}

export function deleteTemplateHandler(request: RestRequest, response: RestResponse): void {
    guarded('delete-template', response, () => {
        const templateId = request.pathParams?.templateId
        if (!templateId) return fail(response, 400, 'No template id in the path.')
        if (!deleteTemplate(templateId)) {
            return fail(response, 404, 'No such script template, or it is not yours to delete.')
        }
        json(response, 200, { ok: true })
    })
}

/* --------------------------- /dataset/{id}/script ------------------------ */

/**
 * A dataset rendered into a template: the point of the whole feature.
 *
 * The rows go in as the *stored column, byte for byte* — not as rows this
 * handler re-serialised — so a script and a download of the same dataset can
 * never disagree about what was generated. The parse below is only for the
 * column list, which is a placeholder of its own.
 *
 * Which template is a query parameter rather than a second path segment,
 * because the dataset is what this route is about: the same run is dropped
 * into several scripts without being generated again, which is exactly what
 * the picker beside the preview table does.
 *
 * It answers as a file, like `/export`, and for the same reason — what comes
 * back is a script somebody is about to run, not a payload to be unwrapped.
 */
export function datasetScriptHandler(request: RestRequest, response: RestResponse): void {
    guarded('dataset-script', response, () => {
        const datasetId = request.pathParams?.datasetId
        if (!datasetId) return fail(response, 400, 'No dataset id in the path.')

        const templateId = param(request, 'template')
        if (!templateId) return fail(response, 400, 'Name a template with ?template=<sys_id>; see GET /template.')

        const dataset = getDataset(datasetId)
        if (!dataset) return fail(response, 404, 'No such dataset, or you may not read it.')
        if (dataset.state !== 'complete') {
            return fail(response, 409, `Dataset is ${dataset.state}${dataset.error ? `: ${dataset.error}` : ''}.`)
        }

        const template = getTemplate(templateId)
        if (!template) return fail(response, 404, 'No such script template, or you may not read it.')

        const stored = readDatasetRows(datasetId)
        if (!stored) return fail(response, 404, 'That dataset has no rows stored on it.')

        // Flattened, because the columns a script is told about are the
        // generator's flat column space — the same names `/rows` reports.
        const rows = (JSON.parse(stored) as Record<string, unknown>[]).map((row) => flatten(row))

        // A configuration that has since been deleted leaves every
        // configuration placeholder rendering as `null`, which is still a
        // literal the script can test.
        const config = dataset.configId ? getConfig(dataset.configId) : null

        const script = renderScriptTemplate(
            template.body,
            scriptTemplateValues({
                dataset: {
                    id: dataset.id,
                    name: dataset.name,
                    rowCount: dataset.rowCount,
                    fieldCount: dataset.fieldCount,
                    createdAt: dataset.createdAt,
                },
                config: config
                    ? {
                          id: config.id,
                          name: config.name,
                          seed: config.seed,
                          locale: config.locale,
                          fields: config.fields,
                          metadata: config.metadata,
                      }
                    : null,
                datasetJson: stored,
                columns: [...new Set(rows.flatMap((row) => Object.keys(row)))],
            }),
        )

        response.setStatus(200)
        response.setContentType('text/javascript')
        response.setHeader('Content-Disposition', `attachment; filename="${scriptFileName(template.name)}"`)
        response.getStreamWriter().writeString(script)
    })
}
