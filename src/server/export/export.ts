/**
 * Serializers for generated rows. Rows are stored flat with dot-path keys;
 * JSON export restores nesting, CSV and SQL keep the flat header.
 *
 * The three serializers are the Bun app's, unchanged — they were already pure
 * functions over an array of rows. What did not come across is
 * `exportResponse()`, which built a `Response` with a `Content-Disposition`
 * header. There is no `Response` on the platform and nothing to download from:
 * rows land as a `GlideSysAttachment` on the dataset record, which is already
 * a file the platform will serve. See `writeDatasetAttachment` below.
 */

import { withoutGenerationStamp } from '../lib/datasetName.ts'
import { unflatten, type Row } from '../lib/rows.ts'

export type ExportFormat = 'json' | 'csv' | 'sql'

export function toJson(rows: Row[]): string {
    return JSON.stringify(rows.map(unflatten), null, 2)
}

function csvCell(value: unknown): string {
    if (value === null || value === undefined) return ''
    const text = Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: Row[]): string {
    if (!rows.length) return ''
    // Union of keys so a null-heavy first row can't truncate the header.
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    const lines = [headers.map(csvCell).join(',')]
    for (const row of rows) {
        lines.push(headers.map((header) => csvCell(row[header])).join(','))
    }
    return lines.join('\n')
}

/* ---------------------------------- SQL --------------------------------- */

/** Rows per INSERT statement — small enough for any client's statement limit. */
const SQL_BATCH = 500

/** Double-quoted, with embedded quotes doubled: valid in Postgres and SQLite. */
function sqlIdentifier(name: string): string {
    return `"${name.replace(/"/g, '""')}"`
}

function sqlLiteral(value: unknown): string {
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
    return `'${text.replace(/'/g, "''")}'`
}

/** "Employee records" -> "employee_records" */
export function sqlTableName(name: string): string {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60)
    // A leading digit is not a valid unquoted identifier anywhere.
    return /^[0-9]/.test(slug) || !slug ? `t_${slug || 'dummy_data'}` : slug
}

/**
 * INSERT statements for one table. Columns keep their dot-path names, quoted,
 * so the output lines up with the CSV header rather than silently renaming.
 */
export function toSql(rows: Row[], tableName: string): string {
    if (!rows.length) return ''
    const table = sqlIdentifier(sqlTableName(tableName))
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    const columns = headers.map(sqlIdentifier).join(', ')

    const statements: string[] = []
    for (let start = 0; start < rows.length; start += SQL_BATCH) {
        const batch = rows.slice(start, start + SQL_BATCH)
        const values = batch.map((row) => `  (${headers.map((header) => sqlLiteral(row[header])).join(', ')})`).join(',\n')
        statements.push(`INSERT INTO ${table} (${columns}) VALUES\n${values};`)
    }
    return `${statements.join('\n\n')}\n`
}

/* ------------------------------- packaging ------------------------------ */

export type SerializedExport = { fileName: string; contentType: string; body: string }

/** The media type and file name the platform should serve this export as. */
export function serialize(rows: Row[], format: ExportFormat, baseName: string): SerializedExport {
    const safeName = baseName.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'dummy-data'

    if (format === 'csv') {
        return { fileName: `${safeName}.csv`, contentType: 'text/csv; charset=utf-8', body: toCsv(rows) }
    }
    if (format === 'sql') {
        // The file keeps the run's timestamp; the table it seeds does not, or
        // every export of the same schema would land in a table of its own.
        return {
            fileName: `${safeName}.sql`,
            contentType: 'application/sql; charset=utf-8',
            body: toSql(rows, withoutGenerationStamp(baseName)),
        }
    }
    return { fileName: `${safeName}.json`, contentType: 'application/json; charset=utf-8', body: toJson(rows) }
}
