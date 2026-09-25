/**
 * The phase-two go/no-go: does the ported generator still produce correct,
 * reproducible values once faker is gone?
 *
 * The porting plan put this first for a reason. If seeded reproducibility does
 * not hold, every downstream assumption about fixtures changes — so it is
 * worth knowing in week one rather than week five.
 *
 * These run on Node, against the module source directly. They cannot run the
 * Glide-dependent layers (`db`, `choices`, `run`), which is fine: those are
 * thin, and everything with real logic in it — the PRNG, the distributions,
 * the check digits, the ordering, the formula and condition evaluators — is
 * pure and testable here.
 *
 *   npm test
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import { Random, hashSeed, randomFor } from '../src/server/generate/random.ts'
import { generateRows, generateInto } from '../src/server/generate/generate.ts'
import { inferSchema } from '../src/server/infer/infer.ts'
import { toCsv, toJson, toSql, sqlTableName } from '../src/server/export/export.ts'
import { flatten, unflatten } from '../src/server/lib/rows.ts'
import { parseFormula, evaluateFormula, parseCondition, evaluateCondition } from '../src/server/lib/formula.ts'
import { defaultFieldOptions, FIELD_TYPES, type Field, type FieldType } from '../src/server/lib/types.ts'

const field = (name: string, type: FieldType, options: Record<string, unknown> = {}): Field => ({
    id: `f_${name}`,
    name,
    type,
    options: options as Field['options'],
})

/* ------------------------------- the PRNG -------------------------------- */

test('a seeded stream replays exactly', () => {
    const a = new Random('en')
    const b = new Random('en')
    a.seed(hashSeed('tuesday'))
    b.seed(hashSeed('tuesday'))

    const drawA = Array.from({ length: 50 }, () => a.number.int({ min: 0, max: 1_000_000 }))
    const drawB = Array.from({ length: 50 }, () => b.number.int({ min: 0, max: 1_000_000 }))
    assert.deepEqual(drawA, drawB)
})

test('different seeds diverge', () => {
    const a = new Random('en')
    const b = new Random('en')
    a.seed(hashSeed('tuesday'))
    b.seed(hashSeed('wednesday'))
    assert.notDeepEqual(
        Array.from({ length: 20 }, () => a.number.int({ min: 0, max: 1_000_000 })),
        Array.from({ length: 20 }, () => b.number.int({ min: 0, max: 1_000_000 })),
    )
})

test('hashSeed is stable and 32-bit', () => {
    assert.equal(hashSeed('tuesday'), hashSeed('tuesday'))
    assert.notEqual(hashSeed('tuesday'), hashSeed('Tuesday'))
    for (const text of ['', 'a', 'a much longer seed than that one']) {
        const value = hashSeed(text)
        assert.ok(Number.isInteger(value) && value >= 0 && value < 2 ** 32, `${text} -> ${value}`)
    }
})

test('number.int stays inside its bounds, inclusive of both ends', () => {
    const r = new Random('en')
    r.seed(1)
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) {
        const value = r.number.int({ min: 3, max: 7 })
        assert.ok(value >= 3 && value <= 7, `out of range: ${value}`)
        seen.add(value)
    }
    assert.deepEqual([...seen].sort(), [3, 4, 5, 6, 7])
})

test('string helpers honour length and casing', () => {
    const r = new Random('en')
    r.seed(2)
    assert.match(r.string.numeric({ length: 8, allowLeadingZeros: true }), /^[0-9]{8}$/)
    assert.match(r.string.alpha({ length: 5, casing: 'upper' }), /^[A-Z]{5}$/)
    assert.match(r.string.alphanumeric({ length: 12, casing: 'lower' }), /^[a-z0-9]{12}$/)
    assert.match(r.string.hexadecimal({ length: 32, casing: 'lower', prefix: '' }), /^[0-9a-f]{32}$/)
    assert.match(r.string.uuid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)

    // A range length resolves inside the range.
    for (let i = 0; i < 100; i++) {
        const value = r.string.alpha({ length: { min: 1, max: 5 }, casing: 'upper' })
        assert.ok(value.length >= 1 && value.length <= 5)
    }
})

test('allowLeadingZeros: false never produces one', () => {
    const r = new Random('en')
    r.seed(3)
    for (let i = 0; i < 300; i++) {
        assert.notEqual(r.string.numeric({ length: 6, allowLeadingZeros: false }).charAt(0), '0')
    }
})

test('weightedArrayElement respects the weights', () => {
    const r = new Random('en')
    r.seed(4)
    let heavy = 0
    for (let i = 0; i < 4000; i++) {
        if (r.helpers.weightedArrayElement([{ value: 'a', weight: 9 }, { value: 'b', weight: 1 }]) === 'a') heavy++
    }
    // 90% expected; a wide band, because this is testing that weights are read
    // at all rather than pinning the PRNG's exact distribution.
    assert.ok(heavy > 3400 && heavy < 3800, `heavy=${heavy}`)
})

test('arrayElements returns distinct entries and never more than the pool', () => {
    const r = new Random('en')
    r.seed(5)
    const pool = ['a', 'b', 'c', 'd']
    const picked = r.helpers.arrayElements(pool, 3)
    assert.equal(picked.length, 3)
    assert.equal(new Set(picked).size, 3)
    assert.equal(r.helpers.arrayElements(pool, 99).length, 4)
})

/* ---------------------------- the value layer ---------------------------- */

test('the same seed generates byte-identical rows', () => {
    const fields = [
        field('id', 'uuid'),
        field('name', 'fullName'),
        field('email', 'email', { derivesFrom: 'name' }),
        field('amount', 'price', { min: 1, max: 500, decimals: 2 }),
        field('status', 'enum', { values: ['new', 'open', 'closed'], weights: [5, 3, 2] }),
        field('city', 'city'),
        field('card', 'creditCardNumber'),
    ]
    const config = { fields, rowCount: 25, seed: 'fixture-1', locale: 'en' }

    assert.equal(JSON.stringify(generateRows(config)), JSON.stringify(generateRows(config)))
})

test('an unseeded run does not repeat itself', () => {
    const config = { fields: [field('id', 'uuid')], rowCount: 5, locale: 'en' }
    assert.notEqual(JSON.stringify(generateRows(config)), JSON.stringify(generateRows(config)))
})

test('every field type produces a value without throwing', () => {
    // The real risk in a 1,500-line switch is a case that reaches a helper
    // which no longer exists. This walks all ~215 of them.
    //
    // A few types are meaningless without an option and correctly refuse
    // without one — a calculated field with no formula is a user error, not a
    // generator bug — so those get the minimum that makes them well-formed.
    const REQUIRED: Partial<Record<FieldType, Record<string, unknown>>> = {
        computed: { expression: '1 + 1' },
        enum: { values: ['a', 'b'] },
        reference: { values: ['x', 'y'] },
        template: { pattern: 'ORD-{{digits:4}}' },
        array: { arrayOf: 'word' },
        object: { fields: [{ id: 'c', name: 'child', type: 'word' }] },
    }

    const failures: string[] = []
    for (const meta of FIELD_TYPES) {
        try {
            const rows = generateRows({
                fields: [field('value', meta.type, { ...defaultFieldOptions(meta.type), ...(REQUIRED[meta.type] ?? {}) })],
                rowCount: 3,
                seed: 'coverage',
                locale: 'en',
            })
            assert.equal(rows.length, 3)
            // `bundle` and `object` spread into dot-path columns rather than
            // occupying one, so they are checked by a column they produced.
            const spread = Object.keys(rows[0]!).find((key) => key.startsWith('value.'))
            const value = spread ? rows[0]![spread] : rows[0]!['value']
            if (value === null || value === undefined) failures.push(`${meta.type}: ${value}`)
        } catch (error) {
            failures.push(`${meta.type}: ${(error as Error).message}`)
        }
    }
    assert.deepEqual(failures, [])
})

test('check digits are real', () => {
    const luhnValid = (digits: string) => {
        let sum = 0
        let double = false
        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = Number(digits[i])
            if (double) {
                digit *= 2
                if (digit > 9) digit -= 9
            }
            sum += digit
            double = !double
        }
        return sum % 10 === 0
    }

    const rows = generateRows({
        fields: [field('imei', 'imei'), field('card', 'creditCardNumber'), field('upc', 'upc'), field('ean', 'ean')],
        rowCount: 40,
        seed: 'check-digits',
        locale: 'en',
    })

    for (const row of rows) {
        assert.ok(luhnValid(String(row['imei'])), `imei ${row['imei']}`)
        assert.ok(luhnValid(String(row['card']).replace(/\D/g, '')), `card ${row['card']}`)

        for (const key of ['upc', 'ean']) {
            const digits = String(row[key])
            let sum = 0
            for (let i = 0; i < digits.length - 1; i++) {
                sum += Number(digits[i]) * ((digits.length - 1 - i) % 2 === 1 ? 3 : 1)
            }
            assert.equal(Number(digits[digits.length - 1]), (10 - (sum % 10)) % 10, `${key} ${digits}`)
        }
    }
})

test('numeric options are honoured', () => {
    const rows = generateRows({
        fields: [field('n', 'integer', { min: 10, max: 20 }), field('f', 'float', { min: 0, max: 1, decimals: 3 })],
        rowCount: 200,
        seed: 'bounds',
        locale: 'en',
    })
    for (const row of rows) {
        const n = row['n'] as number
        assert.ok(Number.isInteger(n) && n >= 10 && n <= 20, `integer ${n}`)
        const f = row['f'] as number
        assert.ok(f >= 0 && f <= 1, `float ${f}`)
        assert.ok(String(f).split('.')[1]?.length ?? 0 <= 3, `decimals ${f}`)
    }
})

test('the skewed distributions stay above min and are not uniform', () => {
    const rows = generateRows({
        fields: [field('v', 'float', { distribution: 'lognormal', mean: 100, stddev: 1, min: 1, decimals: 2 })],
        rowCount: 500,
        seed: 'lognormal',
        locale: 'en',
    })
    const values = rows.map((row) => row['v'] as number)
    assert.ok(Math.min(...values) >= 1)
    // A log-normal's mean sits well above its median; a uniform draw would not.
    const sorted = [...values].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]!
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    assert.ok(mean > median, `mean ${mean} should exceed median ${median}`)
})

test('nullPercent of 100 blanks the column, 0 never does', () => {
    const rows = generateRows({
        fields: [
            { id: 'a', name: 'always', type: 'uuid', nullPercent: 0 },
            { id: 'b', name: 'never', type: 'uuid', nullPercent: 100 },
        ],
        rowCount: 50,
        seed: 'nulls',
        locale: 'en',
    })
    assert.ok(rows.every((row) => row['always'] !== null))
    assert.ok(rows.every((row) => row['never'] === null))
})

test('unique fields do not repeat', () => {
    const rows = generateRows({
        fields: [{ id: 'u', name: 'code', type: 'integer', unique: true, options: { min: 1, max: 60 } }],
        rowCount: 50,
        seed: 'unique',
        locale: 'en',
    })
    const values = rows.map((row) => String(row['code']))
    assert.equal(new Set(values).size, values.length)
})

test('a bundle spreads into dot-path columns', () => {
    const rows = generateRows({
        fields: [field('who', 'bundle', { bundle: 'person' })],
        rowCount: 2,
        seed: 'bundle',
        locale: 'en',
    })
    const row = rows[0]!
    for (const column of ['first_name', 'last_name', 'full_name', 'email', 'username', 'phone']) {
        assert.ok(row[`who.${column}`], `missing who.${column}`)
    }
    // The correlated parts agree with each other.
    assert.equal(row['who.full_name'], `${row['who.first_name']} ${row['who.last_name']}`)
})

test('derivesFrom uses the field it names', () => {
    const rows = generateRows({
        fields: [field('name', 'fullName'), field('email', 'email', { derivesFrom: 'name' })],
        rowCount: 10,
        seed: 'derive',
        locale: 'en',
    })
    for (const row of rows) {
        const first = String(row['name']).split(' ')[0]!.toLowerCase()
        assert.ok(String(row['email']).includes(first), `${row['email']} should be built from ${row['name']}`)
    }
})

test('a computed field runs after the fields it reads', () => {
    const rows = generateRows({
        fields: [
            field('total', 'computed', { expression: 'qty * price', decimals: 2 }),
            field('qty', 'integer', { min: 1, max: 5 }),
            field('price', 'float', { min: 1, max: 10, decimals: 2 }),
        ],
        rowCount: 20,
        seed: 'computed',
        locale: 'en',
    })
    for (const row of rows) {
        const expected = Math.round((row['qty'] as number) * (row['price'] as number) * 100) / 100
        assert.equal(row['total'], expected)
    }
})

test('a circular dependency is refused rather than hanging', () => {
    assert.throws(
        () =>
            generateRows({
                fields: [
                    field('a', 'computed', { expression: 'b + 1' }),
                    field('b', 'computed', { expression: 'a + 1' }),
                ],
                rowCount: 1,
                locale: 'en',
            }),
        /loop|reference/i,
    )
})

test('sequentialDate is strictly increasing', () => {
    const rows = generateRows({
        fields: [field('at', 'sequentialDate', { step: 60, jitter: 50, format: 'unix' })],
        rowCount: 40,
        seed: 'sequence',
        locale: 'en',
    })
    const times = rows.map((row) => row['at'] as number)
    for (let i = 1; i < times.length; i++) {
        assert.ok(times[i]! > times[i - 1]!, `row ${i}: ${times[i]} not after ${times[i - 1]}`)
    }
})

test('a when predicate blanks the field when it fails', () => {
    const rows = generateRows({
        fields: [field('n', 'integer', { min: 0, max: 10 }), field('big', 'uuid', { when: 'n > 5' })],
        rowCount: 60,
        seed: 'when',
        locale: 'en',
    })
    for (const row of rows) {
        if ((row['n'] as number) > 5) assert.ok(row['big'], 'should have a value')
        else assert.equal(row['big'], null)
    }
})

test('a dynamic enum with no resolver refuses rather than generating nonsense', () => {
    assert.throws(
        () =>
            generateRows({
                fields: [field('state', 'enum', { valuesFrom: 'scriptInclude', scriptInclude: 'Whatever' })],
                rowCount: 1,
                locale: 'en',
            }),
        /resolveChoiceScripts|choices/i,
    )
})

/* --------------------------- streaming and caps -------------------------- */

test('generateInto streams one row at a time and honours the cap', () => {
    const seen: number[] = []
    const produced = generateInto(
        { fields: [field('id', 'uuid')], rowCount: 5000, seed: 'stream', locale: 'en' },
        (_row, index) => void seen.push(index),
        100,
    )
    assert.equal(produced, 100)
    assert.equal(seen.length, 100)
    assert.deepEqual(seen.slice(0, 3), [0, 1, 2])
})

test('a sink that returns false stops the run', () => {
    let count = 0
    const produced = generateInto(
        { fields: [field('id', 'uuid')], rowCount: 1000, seed: 'stop', locale: 'en' },
        () => {
            count++
            return count < 10
        },
    )
    assert.equal(count, 10)
    assert.equal(produced, 10)
})

test('generateRows and generateInto agree for the same seed', () => {
    const config = { fields: [field('id', 'uuid'), field('n', 'integer')], rowCount: 20, seed: 'agree', locale: 'en' }
    const streamed: unknown[] = []
    generateInto(config, (row) => void streamed.push(row))
    assert.deepEqual(streamed, generateRows(config))
})

/* -------------------------------- inference ------------------------------ */

test('inferSchema reads a JSON sample', () => {
    const result = inferSchema('{"email":"a@b.com","age":31,"active":true,"createdAt":"2026-01-01T00:00:00Z"}')
    assert.equal(result.detected, 'json')
    const byName = Object.fromEntries(result.fields.map((f) => [f.name, f.type]))
    assert.equal(byName['email'], 'email')
    assert.equal(byName['age'], 'age')
    assert.equal(byName['active'], 'boolean')
})

test('inferSchema reads a CREATE TABLE statement', () => {
    const result = inferSchema(`
        CREATE TABLE orders (
            id UUID PRIMARY KEY,
            customer_email VARCHAR(255),
            quantity INTEGER,
            total DECIMAL(10,2),
            placed_at TIMESTAMP
        );
    `)
    assert.equal(result.detected, 'sql')
    const names = result.fields.map((f) => f.name)
    assert.ok(names.includes('customer_email'))
    assert.ok(names.includes('quantity'))
})

test('inferSchema reads a TypeScript interface', () => {
    const result = inferSchema('interface User { id: string; age: number; active: boolean }')
    assert.equal(result.detected, 'typescript')
    assert.equal(result.fields.length, 3)
})

test('an inferred schema generates without further editing', () => {
    const { fields } = inferSchema('{"id":"8f14e45f-ceea-467a-9a3e-4b26f9c26f1a","city":"Portland","n":7}')
    const rows = generateRows({ fields, rowCount: 5, seed: 'roundtrip', locale: 'en' })
    assert.equal(rows.length, 5)
    for (const row of rows) for (const f of fields) assert.notEqual(row[f.name], undefined)
})

/* --------------------------------- export -------------------------------- */

test('CSV uses the union of keys and quotes what needs it', () => {
    const csv = toCsv([
        { a: 1, b: 'plain' },
        { a: 2, c: 'has, comma' },
    ])
    const [header, ...lines] = csv.split('\n')
    assert.equal(header, 'a,b,c')
    assert.ok(lines[1]!.includes('"has, comma"'))
})

test('JSON export re-nests dot paths, and flatten undoes it', () => {
    const rows = [{ 'address.city': 'Portland', 'address.zip': '97205', id: 1 }]
    const parsed = JSON.parse(toJson(rows)) as Record<string, any>[]
    assert.deepEqual(parsed[0]!['address'], { city: 'Portland', zip: '97205' })
    assert.deepEqual(flatten(parsed[0]!), rows[0])
    assert.deepEqual(unflatten(rows[0]!), parsed[0])
})

test('SQL export quotes identifiers and escapes literals', () => {
    const sql = toSql([{ name: "O'Brien", n: 1 }], 'Employee records')
    assert.ok(sql.includes('INSERT INTO "employee_records"'))
    assert.ok(sql.includes("'O''Brien'"))
})

test('sqlTableName never starts with a digit', () => {
    assert.equal(sqlTableName('2024 orders'), 't_2024_orders')
    assert.equal(sqlTableName(''), 't_dummy_data')
})

/* ---------------------------- formula and condition ---------------------- */

test('the formula parser refuses an unknown reference', () => {
    const parsed = parseFormula('qty * nope', ['qty'])
    assert.equal(parsed.ok, false)
})

test('the formula evaluator does the arithmetic', () => {
    const parsed = parseFormula('(a + b) * 2', ['a', 'b'])
    assert.equal(parsed.ok, true)
    if (parsed.ok) assert.equal(evaluateFormula(parsed.node, { a: 3, b: 4 }, 0), 14)
})

test('the condition evaluator compares', () => {
    const parsed = parseCondition('n > 5', new Set(['n']))
    assert.equal(parsed.ok, true)
    if (parsed.ok) {
        assert.equal(evaluateCondition(parsed.node, { n: 9 }), true)
        assert.equal(evaluateCondition(parsed.node, { n: 2 }), false)
    }
})

/* --------------------------------- locale -------------------------------- */

test('an unknown locale falls back rather than failing the run', () => {
    const rows = generateRows({
        fields: [field('name', 'firstName')],
        rowCount: 3,
        seed: 'locale',
        locale: 'kl_GL',
    })
    assert.ok(rows.every((row) => typeof row['name'] === 'string' && row['name']))
    assert.equal(randomFor('kl_GL').data, randomFor('en').data)
})
