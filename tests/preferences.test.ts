/**
 * The preference normalizer.
 *
 * Worth its own file because of where it sits: the REST handler and the settings
 * panel both go through this one function, so it is what makes the number the UI
 * shows and the number the row holds the same number. Anything it gets wrong is
 * wrong in two places at once.
 *
 * The cases below are mostly about a stored set being *untrusted*. On PocketBase
 * the blob had at least been written by the app; here the row is a real record
 * on a real table, so the values can also have come from a request body or from
 * an admin typing into a form.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import {
    DEFAULT_PREFERENCES,
    NAV_SECTIONS,
    normalizePreferences,
    PREFERENCE_LIMITS,
} from '../src/server/lib/preferences.ts'

test('nothing stored is the full set of defaults', () => {
    assert.deepEqual(normalizePreferences(undefined), DEFAULT_PREFERENCES)
    assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES)
    assert.deepEqual(normalizePreferences({}), DEFAULT_PREFERENCES)
    // Not an object at all — a column that held something unexpected.
    assert.deepEqual(normalizePreferences('dark'), DEFAULT_PREFERENCES)
    assert.deepEqual(normalizePreferences([1, 2]), DEFAULT_PREFERENCES)
})

test('a normalized set is always complete', () => {
    const keys = Object.keys(DEFAULT_PREFERENCES).sort()
    assert.deepEqual(Object.keys(normalizePreferences({ theme: 'dark' })).sort(), keys)
})

test('unknown keys are dropped rather than carried', () => {
    const result = normalizePreferences({ theme: 'dark', accentColor: 'violet' })
    assert.equal(result.theme, 'dark')
    // The accent picker did not come across; a set written by the Bun app must
    // not smuggle it back in.
    assert.equal('accentColor' in result, false)
})

test('the default template has to look like a sys_id', () => {
    // A PocketBase id from an exported Bun preference set is not one, and
    // neither is anything an admin might type into the form by hand.
    assert.equal(normalizePreferences({ defaultTemplateId: 'tpl_1' }).defaultTemplateId, '')
    assert.equal(normalizePreferences({ defaultTemplateId: 'a'.repeat(32) }).defaultTemplateId, 'a'.repeat(32))
    // Not checked against the templates that exist: the picker falls back, so
    // a sys_id that no longer resolves is harmless rather than invalid.
    assert.equal(normalizePreferences({ defaultTemplateId: '0'.repeat(32) }).defaultTemplateId, '0'.repeat(32))
})

test('numbers are clamped into range, not rejected', () => {
    assert.equal(normalizePreferences({ previewRowLimit: 50_000 }).previewRowLimit, PREFERENCE_LIMITS.previewRows.max)
    assert.equal(normalizePreferences({ previewRowLimit: 1 }).previewRowLimit, PREFERENCE_LIMITS.previewRows.min)
    assert.equal(normalizePreferences({ editorSplitPercent: 99 }).editorSplitPercent, PREFERENCE_LIMITS.editorSplit.max)
    assert.equal(normalizePreferences({ defaultRowCount: 0 }).defaultRowCount, PREFERENCE_LIMITS.rowCount.min)
})

test('a number the platform handed back as a string is still a number', () => {
    // Every `getValue` returns a string, so this is the normal path, not an edge.
    const result = normalizePreferences({ defaultRowCount: '250', editorSplitPercent: '35' })
    assert.equal(result.defaultRowCount, 250)
    assert.equal(result.editorSplitPercent, 35)
})

test('a missing number is its default rather than the bottom of its range', () => {
    // `Number('')` and `Number(null)` are both 0, which would clamp to the
    // minimum — the bug this guards is a blank column reading as "1 row".
    for (const empty of ['', null, undefined]) {
        assert.equal(normalizePreferences({ defaultRowCount: empty }).defaultRowCount, DEFAULT_PREFERENCES.defaultRowCount)
    }
    assert.equal(normalizePreferences({ previewRowLimit: 'lots' }).previewRowLimit, DEFAULT_PREFERENCES.previewRowLimit)
})

test('booleans survive the round trip through a true/false column', () => {
    // The page sends a real boolean; `getValue` on a BooleanColumn sends a
    // string, and the platform stores true/false as 1 and 0 — so "1" has to read
    // as true or a collapsed sidebar is silently forgotten on every reload.
    for (const truthy of [true, 1, 'true', '1']) {
        assert.equal(normalizePreferences({ sidebarCollapsed: truthy }).sidebarCollapsed, true, String(truthy))
    }
    for (const falsy of [false, 0, 'false', '0', '', null, undefined]) {
        assert.equal(normalizePreferences({ sidebarCollapsed: falsy }).sidebarCollapsed, false, String(falsy))
    }
})

test('the folded nav sections read from an array or from the column', () => {
    // The page sends an array; the column stores a comma-separated list.
    assert.deepEqual(normalizePreferences({ collapsedNavSections: ['datasets'] }).collapsedNavSections, ['datasets'])
    assert.deepEqual(normalizePreferences({ collapsedNavSections: 'configs,datasets' }).collapsedNavSections, [
        'configs',
        'datasets',
    ])
    // Whitespace from a hand-edited field, and the empty column.
    assert.deepEqual(normalizePreferences({ collapsedNavSections: ' datasets , configs ' }).collapsedNavSections, [
        'datasets',
        'configs',
    ])
    assert.deepEqual(normalizePreferences({ collapsedNavSections: '' }).collapsedNavSections, [])
})

test('unknown nav sections are dropped and duplicates collapsed', () => {
    // "notes" was a list in the Bun app's nav and is not one here.
    const result = normalizePreferences({
        collapsedNavSections: ['configs', 'templates', 'notes', 'configs'],
    })
    assert.deepEqual(result.collapsedNavSections, ['configs', 'templates'])
    assert.ok(result.collapsedNavSections.every((section) => NAV_SECTIONS.includes(section)))
})

test('a theme or export format that is not one of the offered values falls back', () => {
    assert.equal(normalizePreferences({ theme: 'midnight' }).theme, 'system')
    assert.equal(normalizePreferences({ theme: 'light' }).theme, 'light')
    assert.equal(normalizePreferences({ defaultExportFormat: 'xml' }).defaultExportFormat, 'csv')
    assert.equal(normalizePreferences({ defaultExportFormat: 'sql' }).defaultExportFormat, 'sql')
})

test('the default field type is validated against the generator’s own union', () => {
    // A type renamed out of `FieldType` must not reach `generate.ts`, which
    // switches on it and has no case for a name it no longer knows.
    assert.equal(normalizePreferences({ defaultFieldType: 'email' }).defaultFieldType, 'email')
    assert.equal(
        normalizePreferences({ defaultFieldType: 'somethingRemoved' }).defaultFieldType,
        DEFAULT_PREFERENCES.defaultFieldType,
    )
})

test('normalizing is idempotent, which is what lets both sides do it', () => {
    // The page normalizes optimistically and the server normalizes before
    // storing. If a second pass could change a value, those two would disagree.
    const messy = {
        theme: 'dark',
        previewRowLimit: 99_999,
        defaultRowCount: '17',
        collapsedNavSections: 'datasets,nope',
        sidebarCollapsed: 'true',
    }
    const once = normalizePreferences(messy)
    assert.deepEqual(normalizePreferences(once), once)
})
