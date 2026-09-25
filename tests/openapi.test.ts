/**
 * The OpenAPI document against the routes it describes.
 *
 * The document is written by hand, so the thing worth asserting is that it
 * cannot drift from `src/fluent/rest/api.now.ts`: every route there is
 * described, nothing is described that is not a route, and every `$ref` in it
 * leads somewhere. The Fluent file cannot be imported here — it is compiled by
 * the SDK, not by Node — so its routes are read out of the source.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { buildOpenApiDocument, OPERATIONS, API_ROOT } from '../src/server/lib/openapi.ts'

const source = readFileSync(new URL('../src/fluent/rest/api.now.ts', import.meta.url), 'utf8')

/** `GET /config/{configId}` for every route the Fluent definition declares. */
const declared = [...source.matchAll(/method:\s*'(\w+)',\s*path:\s*'([^']+)'/g)]
    .map((match) => `${match[1]!.toUpperCase()} ${match[2]}`)
    .sort()

const documented = OPERATIONS.map((operation) => `${operation.method.toUpperCase()} ${operation.path}`).sort()

test('the route list could be read out of api.now.ts', () => {
    assert.ok(declared.length >= 20, `only found ${declared.length} routes`)
})

test('every route is documented, and every documented operation is a route', () => {
    assert.deepEqual(documented, declared)
})

test('operationIds are unique', () => {
    const ids = OPERATIONS.map((operation) => operation.operationId)
    assert.equal(new Set(ids).size, ids.length)
})

test('every path parameter in a path is declared on its operation', () => {
    for (const operation of OPERATIONS) {
        const inPath = [...operation.path.matchAll(/\{(\w+)\}/g)].map((match) => match[1])
        const declaredParams = (operation.parameters ?? [])
            .filter((parameter) => parameter.in === 'path')
            .map((parameter) => parameter.name)
        assert.deepEqual(declaredParams.sort(), inPath.sort(), `${operation.method} ${operation.path}`)
    }
})

test('every $ref resolves', () => {
    const doc = buildOpenApiDocument()
    const refs = [...JSON.stringify(doc).matchAll(/"\$ref":"#\/([^"]+)"/g)].map((match) => match[1]!)
    assert.ok(refs.length > 0)

    for (const ref of new Set(refs)) {
        let node: unknown = doc
        for (const segment of ref.split('/')) node = (node as Record<string, unknown>)?.[segment]
        assert.ok(node, `#/${ref} leads nowhere`)
    }
})

test('the server is the instance the document was served from, under the API root', () => {
    const doc = buildOpenApiDocument({ instanceUrl: 'https://dev1234.service-now.com/' })
    assert.equal(doc.servers[0]!.url, `https://dev1234.service-now.com${API_ROOT}`)
})

test('JSON answers are described inside the platform envelope', () => {
    const doc = buildOpenApiDocument()
    const ok = (doc.paths['/config/{configId}'] as any).get.responses['200']
    assert.deepEqual(ok.content['application/json'].schema.required, ['result'])

    // The streamed routes are the exception.
    const exported = (doc.paths['/dataset/{datasetId}/export'] as any).get.responses['200']
    assert.ok(exported.content['text/csv'])
    assert.equal((doc.paths['/openapi'] as any).get.responses['200'].content['application/json'].schema.type, 'object')
})
