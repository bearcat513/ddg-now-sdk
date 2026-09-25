/**
 * Inferred schema → Fluent table definition.
 *
 * This is the half that makes the port worth doing. DDG already turns a pasted
 * JSON sample, TypeScript interface or `CREATE TABLE` statement into a typed
 * field list; on ServiceNow that field list has an obvious second destination
 * — a `Table()` definition you commit and install. Paste a DDL statement, get
 * a real scoped table.
 *
 * **Runs locally, never on the instance.** It emits `.now.ts` source, which
 * the build then compiles. Nothing about it belongs in a Script Include.
 *
 *   node tools/codegen.mjs --name orders --from ./sample.json
 *   node tools/codegen.mjs --name orders --from ./schema.sql --write
 *
 * Without `--write` it prints the emitted source and, when a file already
 * exists at the target path, a diff of what would change. That default is not
 * politeness — see the hazard note on `--write` below.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname } from 'node:path'
/** The inference layer, compiled on the fly so there is one copy of it. */
async function loadInfer() {
    // The module is TypeScript; `--experimental-strip-types` covers it on
    // Node 22+, which is the same floor the SDK itself requires.
    return await import('../src/server/infer/infer.ts')
}

const SCOPE = JSON.parse(readFileSync(new URL('../now.config.json', import.meta.url), 'utf8')).scope

/** ServiceNow caps a table name at 30 characters *including* the prefix. */
const MAX_TABLE_NAME = 30
const MAX_COLUMN_NAME = 80

/**
 * `FieldType` → column type.
 *
 * ~195 generators collapse onto about a dozen columns. Anything not listed
 * falls through to `StringColumn`, which is the right default: a generator
 * this table does not know about still produces text.
 */
const COLUMN_FOR = {
    // whole numbers
    integer: 'IntegerColumn',
    age: 'IntegerColumn',
    quantity: 'IntegerColumn',
    seatCount: 'IntegerColumn',
    port: 'IntegerColumn',
    asn: 'IntegerColumn',
    autoIncrement: 'IntegerColumn',
    httpStatus: 'IntegerColumn',
    batteryLevel: 'IntegerColumn',
    readingTime: 'IntegerColumn',
    fileSizeBytes: 'IntegerColumn',
    latencyMs: 'IntegerColumn',

    // decimals
    float: 'DecimalColumn',
    price: 'DecimalColumn',
    latitude: 'DecimalColumn',
    longitude: 'DecimalColumn',
    transactionAmount: 'DecimalColumn',
    discountPercent: 'DecimalColumn',
    computed: 'DecimalColumn',

    boolean: 'BooleanColumn',

    // dates — `date` vs `datetime` is decided per field from options.format
    date: 'DateTimeColumn',
    pastDate: 'DateTimeColumn',
    futureDate: 'DateTimeColumn',
    recentDate: 'DateTimeColumn',
    sequentialDate: 'DateTimeColumn',
    glideDateTime: 'DateTimeColumn',
    birthDate: 'DateColumn',

    email: 'EmailColumn',

    url: 'UrlColumn',
    avatarUrl: 'UrlColumn',
    imageUrl: 'UrlColumn',

    // structured values
    object: 'JsonColumn',
    bundle: 'JsonColumn',
    array: 'JsonColumn',
    nowQuery: 'JsonColumn',
    embedding: 'JsonColumn',

    // long text
    paragraph: 'MultiLineTextColumn',
    markdown: 'MultiLineTextColumn',
    bio: 'MultiLineTextColumn',
    stackTrace: 'MultiLineTextColumn',
    productDescription: 'MultiLineTextColumn',
    htmlFragment: 'MultiLineTextColumn',
    journalEntry: 'MultiLineTextColumn',
}

/**
 * DDG field names are free-form and nest as dot paths (`address.city`).
 * ServiceNow column names are lowercase letters, digits and underscores only.
 */
function columnName(name) {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, MAX_COLUMN_NAME)
}

/**
 * Snake-casing collapses distinct names: `address.city` and `address_city`
 * both become `address_city`. Reported rather than silently de-duplicated,
 * because losing a column to a name collision is not a detail.
 */
function resolveNames(fields, notes) {
    const used = new Map()
    return fields.map((field) => {
        let column = columnName(field.name) || 'column'
        if (/^[0-9]/.test(column)) column = `c_${column}`
        if (used.has(column)) {
            const next = used.get(column) + 1
            used.set(column, next)
            const suffixed = `${column}_${next}`.slice(0, MAX_COLUMN_NAME)
            notes.push(`"${field.name}" collided with "${used.keys().next().value}" as "${column}"; emitted as "${suffixed}".`)
            column = suffixed
        } else {
            used.set(column, 1)
            if (column !== field.name) notes.push(`"${field.name}" → ${column}`)
        }
        return { ...field, column }
    })
}

function tableName(base, notes) {
    const prefix = `${SCOPE}_`
    const budget = MAX_TABLE_NAME - prefix.length
    if (budget < 1) throw new Error(`Scope "${SCOPE}" leaves no room for a table name.`)
    let suffix = columnName(base)
    if (suffix.length > budget) {
        const truncated = suffix.slice(0, budget).replace(/_+$/, '')
        notes.push(`Table name "${suffix}" is ${suffix.length} characters but only ${budget} fit after "${prefix}"; emitted as "${truncated}".`)
        suffix = truncated
    }
    if (!/[a-z0-9]$/.test(suffix)) suffix = `${suffix}x`.replace(/_x$/, 'x')
    return `${prefix}${suffix}`
}

/** The column type for one field, with the date/datetime split applied. */
function columnType(field) {
    if (field.type === 'enum' && field.options?.values?.length) return 'ChoiceColumn'
    const format = field.options?.format
    if (format === 'date' && COLUMN_FOR[field.type] === 'DateTimeColumn') return 'DateColumn'
    if (format === 'unix' && COLUMN_FOR[field.type] === 'DateTimeColumn') return 'IntegerColumn'
    return COLUMN_FOR[field.type] ?? 'StringColumn'
}

function columnArgs(field, type) {
    const args = [`label: ${JSON.stringify(field.name)}`]
    const options = field.options ?? {}

    if (type === 'IntegerColumn' || type === 'DecimalColumn') {
        if (typeof options.min === 'number') args.push(`min: ${options.min}`)
        if (typeof options.max === 'number') args.push(`max: ${options.max}`)
    }
    if (type === 'ChoiceColumn') {
        const choices = (options.values ?? [])
            .filter(Boolean)
            .map((value) => `            ${JSON.stringify(columnName(String(value)) || 'value')}: ${JSON.stringify(String(value))},`)
            .join('\n')
        args.push(`choices: {\n${choices}\n        }`)
    }
    if (type === 'StringColumn') {
        // maxLength from what the samples actually held, floored at something
        // a real value will fit in and capped below the single-line threshold.
        const observed = Math.max(40, Math.min(options.max ?? 0, 254))
        args.push(`maxLength: ${observed || 254}`)
    }
    // `unique` on a DDG field means "the generator should not repeat this
    // value", which is a uniqueness constraint, not a mandatory one. It is
    // emitted as a unique index on the table rather than misread here.
    return args
}

function emitTable(table, fields, notes) {
    const resolved = resolveNames(fields, notes)
    const used = new Set()

    const lines = resolved.map((field) => {
        const type = columnType(field)
        used.add(type)
        const args = columnArgs(field, type)
        return `        ${field.column}: ${type}({ ${args.join(', ')} }),`
    })

    // Unused imports from '@servicenow/sdk/core' are a build error, not a lint
    // warning, so only the types actually used are imported.
    const imports = ['Table', ...[...used].sort()].join(', ')

    const unique = resolved.filter((field) => field.unique)
    const indexes = unique.length
        ? `    index: [\n${unique
              .map((field) => {
                  // Index names are capped too; the column end is the part
                  // that distinguishes one from another, so that is the end kept.
                  const indexName = `ddg_${field.column}`.slice(0, 30)
                  return `        { name: '${indexName}', unique: true, element: '${field.column}' },`
              })
              .join('\n')}\n    ],\n`
        : ''

    return `// @fluent-disable-sync-for-file
//
// GENERATED by tools/codegen.mjs — regenerate rather than editing by hand.
// A \`transform\` pull and a \`codegen\` run would otherwise fight over this
// file, each convinced it is authoritative.
${notes.length ? `//\n// Generation notes:\n${notes.map((n) => `//   - ${n}`).join('\n')}\n` : ''}
import '@servicenow/sdk/global'
import { ${imports} } from '@servicenow/sdk/core'

export const ${table} = Table({
    name: '${table}',
    label: '${table.slice(SCOPE.length + 1).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}',
    allowWebServiceAccess: true,
    schema: {
${lines.join('\n')}
    },
${indexes}})
`
}

/* --------------------------------- CLI ---------------------------------- */

function arg(name, fallback) {
    const index = process.argv.indexOf(`--${name}`)
    if (index === -1) return fallback
    const value = process.argv[index + 1]
    return value && !value.startsWith('--') ? value : true
}

const name = arg('name')
const from = arg('from')
const write = arg('write', false) === true
const out = arg('out', name ? `src/fluent/tables/generated/${columnName(String(name))}.now.ts` : null)

if (!name || !from) {
    console.error('usage: node tools/codegen.mjs --name <table> --from <file> [--out <path>] [--write]')
    process.exit(1)
}

const { inferSchema } = await loadInfer()
const input = readFileSync(String(from), 'utf8')
const inferred = inferSchema(input)

if (!inferred.fields.length) {
    console.error(`Nothing recognisable in ${from}.`)
    process.exit(1)
}

const notes = [...inferred.notes]
const table = tableName(String(name), notes)
const source = emitTable(table, inferred.fields, notes)

if (!write) {
    console.log(source)
    if (existsSync(String(out))) {
        console.error(`\n--- ${out} would change: ---`)
        try {
            writeFileSync('/tmp/.ddg-codegen-candidate', source)
            execFileSync('diff', ['-u', String(out), '/tmp/.ddg-codegen-candidate'], { stdio: 'inherit' })
        } catch {
            // `diff` exits non-zero when files differ; the output already went
            // to stdout, so there is nothing to handle.
        }
    }
    console.error(
        `\nNot written. Re-run with --write once the diff looks right.\n` +
            `\nWhy the extra step: every record Fluent defines has its identity in keys.ts,\n` +
            `and a keys.ts entry with no matching Fluent code is read as an intentional\n` +
            `delete — it ships a delete record that removes the column from every instance\n` +
            `the app is installed on, including through future upgrades. Overwriting a\n` +
            `table definition wholesale can therefore drop production columns without\n` +
            `anyone reviewing a diff. Never run this unattended in CI against a file that\n` +
            `has already been installed.`,
    )
    process.exit(0)
}

mkdirSync(dirname(String(out)), { recursive: true })
writeFileSync(String(out), source)
console.log(`wrote ${out}`)
for (const note of notes) console.log(`  - ${note}`)
