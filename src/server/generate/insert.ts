/**
 * Writing generated rows into a real table.
 *
 * This mode did not exist in the Bun app, which only ever wrote to its own
 * dataset store — and it is the more valuable of the two here. Populating
 * `incident`, or a scoped app's own tables, with realistically-shaped test
 * data is the thing people actually want from a data generator on a platform;
 * `sysId`, `sysClassName`, `nowRecordNumber` and `journalEntry` already exist
 * as field types precisely because of it.
 *
 * It is kept as its own role-gated operation rather than a flag on the dataset
 * path, because it is a genuinely different act: these writes leave the app's
 * scope and land in a system of record.
 */

import { GlideRecord, GlideRecordSecure, gs } from '@servicenow/glide'
import type { Row } from '../lib/rows.ts'

export type InsertOptions = {
    /** Dot-path column in the row → column on the target table. */
    mapping?: Record<string, string>
    /**
     * Skip business rules and workflow on the insert.
     *
     * Row-at-a-time `insert()` is the honest baseline and it is not fast. This
     * is the first lever, and it is off by default: suppressing a target
     * table's own rules is a decision about that table, not about this app.
     */
    skipBusinessRules?: boolean
    /** Stop after this many failures rather than grinding through the run. */
    maxErrors?: number
}

export type InsertReport = {
    inserted: number
    attempted: number
    errors: string[]
}

/** Values that have no meaningful `setValue` form. */
function toCell(value: unknown): string | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

/**
 * Inserts rows into `table`, one GlideRecord at a time.
 *
 * Checked once up front rather than per row: whether the table exists, whether
 * the caller may create in it, and which of the row's columns the table
 * actually has. A run of ten thousand rows should not re-derive the same
 * answer ten thousand times, and a column that does not exist should fail the
 * run before the first insert rather than silently dropping a value on each.
 */
export function insertRows(table: string, rows: Row[], options: InsertOptions = {}): InsertReport {
    const report: InsertReport = { inserted: 0, attempted: 0, errors: [] }
    if (!rows.length) return report

    const probe = new GlideRecordSecure(table)
    if (!probe.isValid()) {
        report.errors.push(`No such table "${table}".`)
        return report
    }
    probe.initialize()
    if (!probe.canCreate()) {
        report.errors.push(`Not permitted to create records in "${table}".`)
        return report
    }

    // Resolve the column mapping once, against the real dictionary.
    const mapping = options.mapping ?? {}
    const columns: [string, string][] = []
    const unknown: string[] = []
    for (const key of Object.keys(rows[0] ?? {})) {
        const column = mapping[key] ?? key
        if (probe.isValidField(column)) columns.push([key, column])
        else unknown.push(`${key} → ${column}`)
    }
    if (!columns.length) {
        report.errors.push(`None of the generated columns exist on "${table}". Unmapped: ${unknown.join(', ')}`)
        return report
    }
    if (unknown.length) {
        gs.warn(`[ddg] ${table}: ignoring columns with no match — ${unknown.join(', ')}`)
    }

    const maxErrors = options.maxErrors ?? 25

    for (const row of rows) {
        report.attempted++
        try {
            // Plain GlideRecord for the write: the secure probe above has
            // already established that this caller may create here, and
            // `setWorkflow` is only available on the unsecured class.
            const gr = new GlideRecord(table)
            gr.initialize()
            if (options.skipBusinessRules) gr.setWorkflow(false)

            for (const [key, column] of columns) {
                const cell = toCell(row[key])
                if (cell !== null) gr.setValue(column, cell)
            }

            if (gr.insert()) report.inserted++
            else report.errors.push(`Row ${report.attempted} was rejected on insert.`)
        } catch (error) {
            report.errors.push(`Row ${report.attempted}: ${(error as Error).message}`)
        }

        if (report.errors.length >= maxErrors) {
            report.errors.push(`Stopped after ${maxErrors} failures.`)
            break
        }
    }

    gs.info(`[ddg] inserted ${report.inserted} of ${report.attempted} into ${table}`)
    return report
}
