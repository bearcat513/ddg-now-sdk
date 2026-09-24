/**
 * Per-account preferences, and the single definition of what a valid set is.
 *
 * The Bun app kept this in `lib/preferences.ts`, shared between its server and
 * its browser bundle, and the reason it was shared is the reason it is shared
 * here: the endpoint that stores a preference set and the panel that edits one
 * have to agree on the bounds without a round trip, or the UI clamps to one
 * number and the server stores another. So this lives under `src/server`,
 * where the record layer and the REST handler can reach it, and the client
 * imports it the way `TypeSelect` already imports `FIELD_TYPES` from here.
 *
 * It is deliberately Glide-free and side-effect-free. It is compiled into a
 * `sys_module` like everything else under `src/server`, *and* bundled into the
 * page — anything platform-specific in here would break the second of those.
 *
 * `normalizePreferences` is the only way anything reads a stored set. Every
 * unknown key is dropped and every bad value falls back to its default, so a
 * preference set is always complete and always in range: the panel renders one
 * without a guard, and the app reads one without a guard. That matters more
 * here than it did on PocketBase, because a preference row is a real record on
 * a real table — an admin can open it in a form and type anything into it.
 */

import { FIELD_TYPE_SET, type FieldType } from './types.ts'
import type { ExportFormat } from '../export/export.ts'

export type Theme = 'system' | 'light' | 'dark'

export const THEMES: Theme[] = ['system', 'light', 'dark']

/** The foldable lists in the left-hand nav, in the order they are drawn. */
export const NAV_SECTIONS = ['configs', 'datasets'] as const

export type NavSection = (typeof NAV_SECTIONS)[number]

const NAV_SECTION_SET = new Set<string>(NAV_SECTIONS)

export type Preferences = {
    /** "system" follows the OS, live; the other two override it. */
    theme: Theme
    /** Whether the left-hand nav starts out of the way. */
    sidebarCollapsed: boolean
    /**
     * Which of the nav's lists are folded shut. Stored as the shut ones rather
     * than the open ones so a section added later starts open, which is what
     * someone who has never touched it expects.
     */
    collapsedNavSections: NavSection[]
    /** The pane divider, as a percentage of the editor's width. */
    editorSplitPercent: number
    /** Rows a new configuration asks for. */
    defaultRowCount: number
    /** The type "Add field" starts a field as. */
    defaultFieldType: FieldType
    /** Which download is offered first in the data pane. */
    defaultExportFormat: ExportFormat
    /** How many rows are pulled into the preview table at a time. */
    previewRowLimit: number
}

/** Bounds shared by the panel's inputs and the normalizer below. */
export const PREFERENCE_LIMITS = {
    rowCount: { min: 1, max: 100_000 },
    previewRows: { min: 10, max: 1_000 },
    /** Neither pane may be dragged so far that the other stops being usable. */
    editorSplit: { min: 20, max: 80 },
} as const

export const DEFAULT_PREFERENCES: Preferences = {
    theme: 'system',
    sidebarCollapsed: false,
    collapsedNavSections: [],
    editorSplitPercent: 50,
    defaultRowCount: 25,
    defaultFieldType: 'word',
    defaultExportFormat: 'csv',
    previewRowLimit: 200,
}

function clamp(value: unknown, fallback: number, bounds: { min: number; max: number }): number {
    // `Number(null)` and `Number('')` are both 0, which would clamp to the
    // bottom of the range rather than falling back — and a preference that was
    // never set reads as its default, not as "as small as possible".
    if (value === null || value === undefined || value === '') return fallback
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(Math.max(Math.round(parsed), bounds.min), bounds.max)
}

/**
 * A true/false preference, however the value reached us.
 *
 * The page sends a real boolean. A `BooleanColumn` read through `getValue`
 * sends a *string*, and which string is not something to assume: the platform
 * stores true/false fields as 0 and 1 and hands back `"1"` or `"0"` as readily
 * as `"true"`. Accepting all of them is the difference between a collapsed
 * sidebar that is remembered and one that silently is not, and anything else —
 * absent, empty, nonsense — is false, which is what an unset preference means.
 */
function readBoolean(value: unknown): boolean {
    return value === true || value === 1 || value === 'true' || value === '1'
}

/**
 * The folded sections, from either shape the value arrives in.
 *
 * The page sends an array. The column stores a comma-separated list, because a
 * two-element set of known names reads and filters in a platform list view
 * where a JSON array does not. Accepting both means the record layer hands the
 * column straight over without a parsing step of its own, and a value typed
 * into the form by hand is still understood.
 */
function readNavSections(value: unknown): NavSection[] {
    const parts = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
    const names = parts.map((part) => String(part).trim()).filter((part) => NAV_SECTION_SET.has(part))
    // Unknown names are dropped and duplicates collapsed, so the list is
    // always a clean subset of NAV_SECTIONS whatever was stored.
    return [...new Set(names)] as NavSection[]
}

export function normalizePreferences(raw: unknown): Preferences {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_PREFERENCES }
    const input = raw as Record<string, unknown>

    return {
        theme: input.theme === 'light' || input.theme === 'dark' ? input.theme : 'system',
        sidebarCollapsed: readBoolean(input.sidebarCollapsed),
        collapsedNavSections: readNavSections(input.collapsedNavSections),
        editorSplitPercent: clamp(
            input.editorSplitPercent,
            DEFAULT_PREFERENCES.editorSplitPercent,
            PREFERENCE_LIMITS.editorSplit,
        ),
        defaultRowCount: clamp(input.defaultRowCount, DEFAULT_PREFERENCES.defaultRowCount, PREFERENCE_LIMITS.rowCount),
        // Validated against the same union the generator switches on, so a
        // stale type left over from a renamed generator falls back rather than
        // reaching `generate.ts` as a type it has no case for.
        defaultFieldType: FIELD_TYPE_SET.has(String(input.defaultFieldType))
            ? (input.defaultFieldType as FieldType)
            : DEFAULT_PREFERENCES.defaultFieldType,
        defaultExportFormat:
            input.defaultExportFormat === 'json' || input.defaultExportFormat === 'sql'
                ? input.defaultExportFormat
                : 'csv',
        previewRowLimit: clamp(
            input.previewRowLimit,
            DEFAULT_PREFERENCES.previewRowLimit,
            PREFERENCE_LIMITS.previewRows,
        ),
    }
}
