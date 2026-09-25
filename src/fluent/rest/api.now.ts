import '@servicenow/sdk/global'
import { RestApi } from '@servicenow/sdk/core'
import {
    configHandler,
    createConfigHandler,
    createTemplateHandler,
    datasetHandler,
    datasetRowsHandler,
    datasetScriptHandler,
    deleteConfigHandler,
    deleteDatasetHandler,
    deleteTemplateHandler,
    exportHandler,
    generateHandler,
    inferHandler,
    preferencesHandler,
    previewHandler,
    templateHandler,
    updateConfigHandler,
    updatePreferencesHandler,
    updateTemplateHandler,
    whiteboardHandler,
    createWhiteboardHandler,
    updateWhiteboardHandler,
    deleteWhiteboardHandler,
} from '../../server/rest/handlers'

/**
 * The scripted REST API.
 *
 * `src/index.ts` had 36 routes. Most of those served features that did not come
 * across at all — auth, sessions, API keys, sharing, notes, Telegram — and what
 * is left is the surface this application actually has: schemas, runs, the rows
 * they produce, and the script templates those rows are rendered into.
 *
 * It is one surface for two callers. A CI pipeline and the UI Page use the
 * same routes, which is deliberate: the page renders the Bun application's own
 * React UI rather than platform list and form components, so it needs real
 * read and write endpoints, and giving it a private set would mean two paths
 * to the same records drifting apart.
 *
 * Route handlers are one of the Fluent APIs that accept **function imports**,
 * so each `script` below is a typed module rather than a string. That is what
 * lets the endpoints share `run.ts` with the scheduled job and the Script
 * Include bridge instead of each growing its own copy of the same logic.
 *
 * The endpoints land at `/api/x_1040823_ddg_now/ddg/...` — `namespace`
 * defaults to the application scope.
 */
RestApi({
    $id: Now.ID['ddg-api'],
    name: 'Dummy Data Generator',
    serviceId: 'ddg',
    consumes: 'application/json',
    produces: 'application/json',
    shortDescription: 'Infer schemas from pasted structures and generate realistic test data.',
    routes: [
        {
            $id: Now.ID['ddg-api-infer'],
            name: 'infer',
            method: 'POST',
            path: '/infer',
            script: inferHandler,
            shortDescription: 'Paste a JSON sample, TypeScript interface or CREATE TABLE; get a field list.',
            requestExample: '{ "input": "{\\"email\\": \\"a@b.com\\", \\"age\\": 31}" }',
        },
        {
            $id: Now.ID['ddg-api-preview'],
            name: 'preview',
            method: 'POST',
            path: '/preview',
            script: previewHandler,
            shortDescription: 'Rows from a field list sent inline. Stores nothing and needs no configuration record.',
            requestExample: '{ "rowCount": 5, "fields": [{ "id": "f1", "name": "email", "type": "email" }] }',
        },
        {
            $id: Now.ID['ddg-api-config-list'],
            name: 'configs',
            method: 'GET',
            path: '/config',
            script: configHandler,
            shortDescription: 'Every schema configuration the caller can read, with a field count.',
        },
        {
            $id: Now.ID['ddg-api-create-config'],
            name: 'create-config',
            method: 'POST',
            path: '/config',
            script: createConfigHandler,
            shortDescription: 'Store an inferred field list as a new schema configuration.',
            requestExample: '{ "name": "Orders", "fields": [{ "id": "f1", "name": "email", "type": "email" }] }',
        },
        {
            $id: Now.ID['ddg-api-config'],
            name: 'config',
            method: 'GET',
            path: '/config/{configId}',
            script: configHandler,
            shortDescription: 'One configuration, its fields and its mappings.',
        },
        {
            $id: Now.ID['ddg-api-update-config'],
            name: 'update-config',
            method: 'PUT',
            path: '/config/{configId}',
            script: updateConfigHandler,
            shortDescription:
                'Save a configuration. Send "fields" to replace the whole schema; leave it out to change only the settings.',
            requestExample: '{ "name": "Orders", "rowCount": 500, "fields": [{ "id": "f1", "name": "email", "type": "email" }] }',
        },
        {
            $id: Now.ID['ddg-api-delete-config'],
            name: 'delete-config',
            method: 'DELETE',
            path: '/config/{configId}',
            script: deleteConfigHandler,
            shortDescription: 'Delete a configuration and its field rows.',
        },
        {
            $id: Now.ID['ddg-api-generate'],
            name: 'generate',
            method: 'POST',
            path: '/config/{configId}/generate',
            script: generateHandler,
            shortDescription:
                'Run a generation. Answers 200 with a finished dataset, or 202 with one to poll. Pass "table" to write into a real table instead, or "preview": true for rows without a dataset.',
            parameters: [
                {
                    $id: Now.ID['ddg-api-generate-config-id'],
                    name: 'configId',
                    required: true,
                    shortDescription: 'sys_id of the schema configuration to run.',
                },
            ],
        },
        {
            $id: Now.ID['ddg-api-dataset'],
            name: 'dataset',
            method: 'GET',
            path: '/dataset/{datasetId}',
            script: datasetHandler,
            shortDescription: 'Dataset metadata and run state.',
        },
        {
            $id: Now.ID['ddg-api-dataset-list'],
            name: 'datasets',
            method: 'GET',
            path: '/dataset',
            script: datasetHandler,
            shortDescription: 'Recent datasets, optionally narrowed with ?config=<sys_id>.',
        },
        {
            $id: Now.ID['ddg-api-delete-dataset'],
            name: 'delete-dataset',
            method: 'DELETE',
            path: '/dataset/{datasetId}',
            script: deleteDatasetHandler,
            shortDescription: 'Delete a run and the rows attached to it.',
        },
        {
            $id: Now.ID['ddg-api-dataset-rows'],
            name: 'dataset-rows',
            method: 'GET',
            path: '/dataset/{datasetId}/rows',
            script: datasetRowsHandler,
            shortDescription:
                'A page of the stored rows as JSON, with the column list. Only for a dataset stored as JSON; ?limit= sizes the window.',
        },
        {
            $id: Now.ID['ddg-api-preferences'],
            name: 'preferences',
            method: 'GET',
            path: '/preferences',
            script: preferencesHandler,
            shortDescription:
                "The caller's own workspace preferences, or the defaults if they have never changed one. Always the caller's — there is no way to name a user.",
        },
        {
            $id: Now.ID['ddg-api-update-preferences'],
            name: 'update-preferences',
            method: 'PUT',
            path: '/preferences',
            script: updatePreferencesHandler,
            shortDescription:
                'Change some preferences. The body is merged over the stored set, and the reply is what was kept after clamping.',
            requestExample: '{ "theme": "dark", "defaultRowCount": 250 }',
        },
        {
            $id: Now.ID['ddg-api-template-list'],
            name: 'templates',
            method: 'GET',
            path: '/template',
            script: templateHandler,
            shortDescription:
                'Every script template the caller can read, bodies included — a template is its body.',
        },
        {
            $id: Now.ID['ddg-api-create-template'],
            name: 'create-template',
            method: 'POST',
            path: '/template',
            script: createTemplateHandler,
            shortDescription: 'Store a script template.',
            requestExample: '{ "name": "Seed incidents", "body": "var records = ${GENERATED_DATASET};" }',
        },
        {
            $id: Now.ID['ddg-api-template'],
            name: 'template',
            method: 'GET',
            path: '/template/{templateId}',
            script: templateHandler,
            shortDescription: 'One script template.',
        },
        {
            $id: Now.ID['ddg-api-update-template'],
            name: 'update-template',
            method: 'PUT',
            path: '/template/{templateId}',
            script: updateTemplateHandler,
            shortDescription: 'Save an edited template. Name and body together; both are the record.',
        },
        {
            $id: Now.ID['ddg-api-delete-template'],
            name: 'delete-template',
            method: 'DELETE',
            path: '/template/{templateId}',
            script: deleteTemplateHandler,
            shortDescription: 'Delete a script template.',
        },
        {
            $id: Now.ID['ddg-api-whiteboard-list'],
            name: 'whiteboards',
            method: 'GET',
            path: '/whiteboard',
            script: whiteboardHandler,
            shortDescription: 'Every whiteboard the caller can read, without drawings.',
        },
        {
            $id: Now.ID['ddg-api-create-whiteboard'],
            name: 'create-whiteboard',
            method: 'POST',
            path: '/whiteboard',
            script: createWhiteboardHandler,
            shortDescription: 'Store a whiteboard. "scene" is an Excalidraw scene, as text or as an object.',
            requestExample: '{ "name": "Orders data model", "scene": { "type": "excalidraw", "version": 2, "elements": [] } }',
        },
        {
            $id: Now.ID['ddg-api-whiteboard'],
            name: 'whiteboard',
            method: 'GET',
            path: '/whiteboard/{whiteboardId}',
            script: whiteboardHandler,
            shortDescription: 'One whiteboard, its Excalidraw scene included.',
        },
        {
            $id: Now.ID['ddg-api-update-whiteboard'],
            name: 'update-whiteboard',
            method: 'PUT',
            path: '/whiteboard/{whiteboardId}',
            script: updateWhiteboardHandler,
            shortDescription: 'Save a whiteboard. Name and scene together; answers with the summary, not the scene.',
        },
        {
            $id: Now.ID['ddg-api-delete-whiteboard'],
            name: 'delete-whiteboard',
            method: 'DELETE',
            path: '/whiteboard/{whiteboardId}',
            script: deleteWhiteboardHandler,
            shortDescription: 'Delete a whiteboard.',
        },
        {
            $id: Now.ID['ddg-api-dataset-script'],
            name: 'dataset-script',
            method: 'GET',
            path: '/dataset/{datasetId}/script',
            script: datasetScriptHandler,
            shortDescription:
                'A dataset rendered into a script template, served as a .js file. ?template=<sys_id> names the template.',
            parameters: [
                {
                    $id: Now.ID['ddg-api-dataset-script-dataset-id'],
                    name: 'datasetId',
                    required: true,
                    shortDescription: 'sys_id of the dataset whose rows go into the script.',
                },
            ],
        },
        {
            $id: Now.ID['ddg-api-export'],
            name: 'export',
            method: 'GET',
            path: '/dataset/{datasetId}/export',
            script: exportHandler,
            shortDescription:
                'The rows themselves, as a file. JSON by default, straight from the stored column; ?format=csv or ?format=sql serialises from it.',
        },
    ],
})
