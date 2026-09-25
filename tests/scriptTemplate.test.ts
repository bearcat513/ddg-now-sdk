/**
 * Script template rendering.
 *
 * The property worth testing here is the one the whole feature rests on: a
 * substitution is a *literal*, and it happens exactly once. A generated row
 * can hold any text at all — including something shaped like a placeholder, or
 * a `$&` that `String.replace` would treat as a pattern — and either mistake
 * corrupts the data silently rather than failing.
 *
 * Ported from the Bun app's `lib/scriptTemplate.test.ts`, with `bun:test`
 * swapped for `node:test`: the module it covers is pure, so the cases came
 * across unchanged.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import {
    countPlaceholders,
    DATASET_PLACEHOLDER,
    PLACEHOLDERS,
    renderScriptTemplate,
    scriptFileName,
    scriptTemplateValues,
    STARTER_TEMPLATE_BODY,
    usedPlaceholders,
    type ScriptTemplateContext,
} from '../src/server/lib/scriptTemplate.ts'

const dataset = '[\n  { "id": 1 }\n]'

/** Just the rows, which is what most of these are about. */
const rows = { [DATASET_PLACEHOLDER]: dataset }

const context: ScriptTemplateContext = {
    dataset: {
        id: 'ds_1',
        name: 'Orders · 2026-09-18 14:23:05',
        rowCount: 500,
        fieldCount: 3,
        createdAt: '2026-09-18 14:23:05',
    },
    config: {
        id: 'cfg_1',
        name: 'Orders',
        seed: 'steady',
        locale: 'de',
        fields: [{ id: 'f1', name: 'total', type: 'price' }],
    },
    datasetJson: dataset,
    columns: ['id', 'customer.email'],
}

test('substitutes the dataset at the placeholder', () => {
    assert.equal(renderScriptTemplate(`const rows = ${DATASET_PLACEHOLDER};`, rows), `const rows = ${dataset};`)
})

test('substitutes every occurrence', () => {
    const body = `a(${DATASET_PLACEHOLDER}); b(${DATASET_PLACEHOLDER});`
    assert.equal(renderScriptTemplate(body, { [DATASET_PLACEHOLDER]: 'X' }), 'a(X); b(X);')
})

test('a body with no placeholder comes back untouched', () => {
    assert.equal(renderScriptTemplate('const rows = [];', rows), 'const rows = [];')
})

test('$ sequences in the data are literal text', () => {
    // String.replace would expand each of these into a replacement pattern.
    for (const hostile of ['$&', "$'", '$`', '$$', '$1']) {
        assert.equal(renderScriptTemplate(DATASET_PLACEHOLDER, { [DATASET_PLACEHOLDER]: hostile }), hostile)
    }
})

test('a near-miss placeholder is left alone', () => {
    assert.equal(
        renderScriptTemplate('${generated_dataset} ${GENERATED-DATASET}', rows),
        '${generated_dataset} ${GENERATED-DATASET}',
    )
})

test('a template literal in the script survives', () => {
    const body = 'const url = `${base}/api/${id}`;'
    assert.equal(renderScriptTemplate(body, scriptTemplateValues(context)), body)
})

test('an empty body and an empty dataset are both fine', () => {
    assert.equal(renderScriptTemplate('', rows), '')
    assert.equal(renderScriptTemplate(DATASET_PLACEHOLDER, { [DATASET_PLACEHOLDER]: '' }), '')
})

test('one pass, so data that looks like a placeholder is not substituted into', () => {
    const values = { ...scriptTemplateValues(context), [DATASET_PLACEHOLDER]: '[{ "note": "${ROW_COUNT}" }]' }
    assert.equal(renderScriptTemplate(DATASET_PLACEHOLDER, values), '[{ "note": "${ROW_COUNT}" }]')
})

test('every placeholder has a value, and every value is a JavaScript literal', () => {
    const values = scriptTemplateValues(context)
    for (const entry of PLACEHOLDERS) {
        assert.equal(typeof values[entry.token], 'string')
        // A literal, not bare text: this is what parses back out again.
        assert.doesNotThrow(() => JSON.parse(values[entry.token]!))
    }
})

test('the run describes itself', () => {
    const values = scriptTemplateValues(context)
    assert.equal(values['${DATASET_NAME}'], '"Orders · 2026-09-18 14:23:05"')
    assert.equal(values['${ROW_COUNT}'], '500')
    assert.equal(values['${FIELD_COUNT}'], '3')
    assert.equal(values['${COLUMN_NAMES}'], '["id","customer.email"]')
    assert.equal(values['${GENERATED_AT}'], '"2026-09-18 14:23:05"')
})

test("the configuration comes through, without the editor's field ids", () => {
    const values = scriptTemplateValues(context)
    assert.equal(values['${CONFIG_NAME}'], '"Orders"')
    assert.equal(values['${CONFIG_SEED}'], '"steady"')
    assert.equal(values['${CONFIG_LOCALE}'], '"de"')
    assert.deepEqual(JSON.parse(values['${CONFIG_FIELDS}']!), [{ name: 'total', type: 'price' }])
})

test('a deleted configuration leaves nulls, which are still literals', () => {
    const orphan = scriptTemplateValues({ ...context, config: null })
    assert.equal(orphan['${CONFIG_NAME}'], 'null')
    assert.equal(orphan['${CONFIG_FIELDS}'], 'null')
    // The rows are unaffected — that half of a template still renders.
    assert.equal(orphan[DATASET_PLACEHOLDER], dataset)
})

test('a name that would break the string it lands in is escaped by the literal rule', () => {
    const awkward = scriptTemplateValues({ ...context, dataset: { ...context.dataset, name: 'He said "stop"' } })
    assert.equal(awkward['${DATASET_NAME}'], '"He said \\"stop\\""')
    assert.equal(JSON.parse(awkward['${DATASET_NAME}']!), 'He said "stop"')
})

test('counts occurrences of the rows placeholder', () => {
    assert.equal(countPlaceholders('none here'), 0)
    assert.equal(countPlaceholders(DATASET_PLACEHOLDER), 1)
    assert.equal(countPlaceholders(`${DATASET_PLACEHOLDER}${DATASET_PLACEHOLDER}`), 2)
})

test('reports which placeholders a template carries, in the listed order', () => {
    assert.deepEqual(usedPlaceholders('nothing at all'), [])
    assert.deepEqual(
        usedPlaceholders(`${DATASET_PLACEHOLDER} \${CONFIG_NAME}`).map((entry) => entry.name),
        ['GENERATED_DATASET', 'CONFIG_NAME'],
    )
})

test('the starter body carries the rows once, and shows a few of the rest', () => {
    assert.equal(countPlaceholders(STARTER_TEMPLATE_BODY), 1)
    assert.ok(usedPlaceholders(STARTER_TEMPLATE_BODY).length > 1)
})

test('every listed placeholder is spelled the same way in its token', () => {
    for (const entry of PLACEHOLDERS) assert.equal(entry.token, `\${${entry.name}}`)
})

test('slugifies the template name into a file name', () => {
    assert.equal(scriptFileName('Seed incidents'), 'seed-incidents.js')
    assert.equal(scriptFileName('  Load: users/roles!  '), 'load-users-roles.js')
})

test('a name with nothing usable falls back', () => {
    assert.equal(scriptFileName('   '), 'script.js')
    assert.equal(scriptFileName('!!!'), 'script.js')
})
