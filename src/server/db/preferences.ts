/**
 * The preference row, read and written as one preference set.
 *
 * Kept out of `db.ts` deliberately. That file is the record layer for the
 * application's *subject* — schemas, their fields, and the datasets a run
 * produces, all of which reference each other. A preference row references
 * none of them and nothing references it; it is a second, unrelated store that
 * happens to live on the same instance, and folding it into a 500-line file
 * about configurations would only make both harder to read.
 *
 * It follows the same rule as everything beside it: `GlideRecordSecure` on
 * every read and write, so the caller's own ACLs decide. Nothing here elevates.
 * That is not a formality for this table — the whole point of the ACLs on it is
 * that one person cannot read another's row, and a plain `GlideRecord` would
 * quietly hand over every row on the table.
 *
 * There is no "create the row on first read". Reading returns the defaults when
 * there is nothing stored, and a row appears the first time someone actually
 * changes something. A GET that writes a record is a surprise, and it would
 * mean opening the page granted a write it did not need.
 */

import { GlideRecordSecure, gs } from '@servicenow/glide'
import { DEFAULT_PREFERENCES, normalizePreferences, type Preferences } from '../lib/preferences.ts'
import { PREF_TABLE } from './tables.ts'

/**
 * The caller's own row, or null.
 *
 * Ordered so that if a second row ever did exist — the unique index on `user`
 * is what stops it, but an index is a constraint and not a proof — the same one
 * is always read and always written, rather than whichever the query happened
 * to return first.
 */
function ownRow(): GlideRecordSecure<typeof PREF_TABLE> | null {
    const gr = new GlideRecordSecure(PREF_TABLE)
    gr.addQuery('user', gs.getUserID())
    gr.orderBy('sys_created_on')
    gr.setLimit(1)
    gr.query()
    return gr.next() ? gr : null
}

/** The columns as the shape `normalizePreferences` reads. */
function readRow(gr: GlideRecordSecure<typeof PREF_TABLE>): Preferences {
    return normalizePreferences({
        theme: gr.getValue('theme'),
        sidebarCollapsed: gr.getValue('sidebar_collapsed'),
        // A comma-separated string; the normalizer takes this form as readily
        // as the array the page sends.
        collapsedNavSections: gr.getValue('collapsed_nav_sections'),
        editorSplitPercent: gr.getValue('editor_split_percent'),
        defaultRowCount: gr.getValue('default_row_count'),
        defaultFieldType: gr.getValue('default_field_type'),
        defaultExportFormat: gr.getValue('default_export_format'),
        defaultTemplateId: gr.getValue('default_template'),
        previewRowLimit: gr.getValue('preview_row_limit'),
    })
}

function writeRow(gr: GlideRecordSecure<typeof PREF_TABLE>, preferences: Preferences): void {
    gr.setValue('theme', preferences.theme)
    gr.setValue('sidebar_collapsed', String(preferences.sidebarCollapsed))
    gr.setValue('collapsed_nav_sections', preferences.collapsedNavSections.join(','))
    gr.setValue('editor_split_percent', String(preferences.editorSplitPercent))
    gr.setValue('default_row_count', String(preferences.defaultRowCount))
    gr.setValue('default_field_type', preferences.defaultFieldType)
    gr.setValue('default_export_format', preferences.defaultExportFormat)
    gr.setValue('default_template', preferences.defaultTemplateId)
    gr.setValue('preview_row_limit', String(preferences.previewRowLimit))
}

/** What this account prefers, or the defaults if it has never said. */
export function getPreferences(): Preferences {
    const gr = ownRow()
    return gr ? readRow(gr) : { ...DEFAULT_PREFERENCES }
}

/**
 * Merges a patch into the stored set and answers with the result.
 *
 * A patch rather than a replacement, and the merge is here rather than in the
 * client, because `/preferences` is a public route like every other one: a
 * script sending `{"theme": "dark"}` means "make it dark", not "make it dark
 * and put everything else back to how it ships". The page sends a whole set
 * anyway, so it costs it nothing.
 *
 * The answer is the stored set read back through the normalizer, so the caller
 * learns what was actually kept — a `previewRowLimit` of 50,000 comes back as
 * 1,000, and the panel's input snaps to it rather than showing a number the
 * server rejected.
 */
export function writePreferences(patch: Record<string, unknown>): Preferences {
    const existing = ownRow()
    const merged = normalizePreferences({ ...(existing ? readRow(existing) : DEFAULT_PREFERENCES), ...patch })

    if (existing) {
        writeRow(existing, merged)
        if (!existing.update()) throw new Error('Your preferences could not be saved.')
        return merged
    }

    const gr = new GlideRecordSecure(PREF_TABLE)
    gr.initialize()
    // Set even though `set-preference-owner` overwrites it: the column is
    // mandatory, and an insert that relies on a business rule to satisfy a
    // mandatory field is one refactor away from failing.
    gr.setValue('user', gs.getUserID())
    writeRow(gr, merged)
    if (!gr.insert()) throw new Error('Your preferences could not be saved.')
    return merged
}
