/**
 * Per-account preferences: the defaults a new schema, a new field and the
 * preview start out with, plus the two safety-and-noise switches.
 *
 * They are stored as one JSON blob on the account's own `users` record, so
 * they travel with the account and nothing here needs a collection of its
 * own. That blob is whatever was written the day it was written — a preference
 * may be missing, stale, or (since a request body wrote it) nonsense — so
 * every read goes through `normalizePreferences`, which is the single place
 * that decides what a valid preference set looks like. The server normalizes
 * before storing and the UI normalizes before sending, so both agree on the
 * clamped value without a round trip.
 */
import { FIELD_TYPE_SET, type FieldType } from "./types";

export type Theme = "system" | "light" | "dark";
export type ExportFormat = "csv" | "json" | "sql";
export type AccentColor = "blue" | "violet" | "emerald" | "amber" | "rose" | "cyan" | "slate";

/** The foldable lists in the left-hand nav, in the order they are drawn. */
export const NAV_SECTIONS = ["configs", "templates", "notes", "datasets"] as const;
export type NavSection = (typeof NAV_SECTIONS)[number];

const NAV_SECTION_SET = new Set<string>(NAV_SECTIONS);

export type Preferences = {
  /** "system" follows the OS; the other two override it. */
  theme: Theme;
  /** Colours the primary surfaces and focus rings; see styles/globals.css. */
  accentColor: AccentColor;
  /** Rows a new schema asks for. */
  defaultRowCount: number;
  /** Seed a new schema starts with; empty means fresh data every run. */
  defaultSeed: string;
  /** The type "Add field" starts a field as. */
  defaultFieldType: FieldType;
  /** Which export is offered first beside the preview. */
  defaultExportFormat: ExportFormat;
  /** Script template preselected in the preview; empty means the first one. */
  defaultTemplateId: string;
  /** Rows fetched into the preview table. The full dataset is still stored. */
  previewRowLimit: number;
  /** How many recent datasets the sidebar lists. */
  datasetHistoryLimit: number;
  /** Ask before deleting a configuration, template or dataset. */
  confirmDestructive: boolean;
  /** Whether the left-hand nav starts out of the way. */
  sidebarCollapsed: boolean;
  /**
   * Which of the nav's lists are folded shut. Stored as the shut ones rather
   * than the open ones so a section added later starts open, which is what
   * someone who has never touched it expects.
   */
  collapsedNavSections: NavSection[];
  /** How much of the editor the schema pane takes, as a percentage. */
  editorSplitPercent: number;
};

/** Bounds shared by the editor's inputs and the normalizer below. */
export const PREFERENCE_LIMITS = {
  rowCount: { min: 1, max: 100_000 },
  previewRows: { min: 10, max: 1_000 },
  datasetHistory: { min: 5, max: 200 },
  /** Neither pane may be dragged so far that the other stops being usable. */
  editorSplit: { min: 20, max: 80 },
  /** Matches the `seed` column in the migration. */
  seedLength: 200,
} as const;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  accentColor: "blue",
  defaultRowCount: 25,
  defaultSeed: "",
  defaultFieldType: "fullName",
  defaultExportFormat: "csv",
  defaultTemplateId: "",
  previewRowLimit: 100,
  datasetHistoryLimit: 50,
  confirmDestructive: true,
  sidebarCollapsed: false,
  collapsedNavSections: [],
  editorSplitPercent: 50,
};

export const THEMES: Theme[] = ["system", "light", "dark"];

/**
 * The accents offered in Settings, in the order they are shown.
 *
 * The colour itself lives only in CSS — a swatch renders `var(--primary)`
 * under `data-accent`, so there is no second copy here to drift out of step
 * with the palette that actually paints the app.
 */
export const ACCENT_COLORS: { id: AccentColor; label: string }[] = [
  { id: "blue", label: "Blue" },
  { id: "violet", label: "Violet" },
  { id: "emerald", label: "Emerald" },
  { id: "amber", label: "Amber" },
  { id: "rose", label: "Rose" },
  { id: "cyan", label: "Cyan" },
  { id: "slate", label: "Slate" },
];

const ACCENT_IDS = new Set<string>(ACCENT_COLORS.map(accent => accent.id));

/** Record ids are minted by `newId()` in src/server/db.ts: `tpl_1a2b3c4d`. */
const RECORD_ID = /^[a-z0-9_]{3,40}$/;

const clamp = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(Math.max(Math.trunc(value), min), max);

function asNumber(value: unknown, fallback: number, bounds: { min: number; max: number }): number {
  // `Number(null)` and `Number("")` are both 0, which would clamp to the bottom
  // of the range rather than falling back — and a missing preference is meant
  // to read as the default, not as "as small as possible".
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, bounds) : fallback;
}

/**
 * Every unknown key is dropped and every bad value falls back to its default,
 * so a preference set is always complete and always in range — the UI can
 * render it without a guard and the app can read it without one.
 */
export function normalizePreferences(raw: unknown): Preferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...DEFAULT_PREFERENCES };
  const input = raw as Record<string, unknown>;

  const templateId = String(input.defaultTemplateId ?? "").trim();

  return {
    theme: THEMES.includes(input.theme as Theme) ? (input.theme as Theme) : DEFAULT_PREFERENCES.theme,
    accentColor: ACCENT_IDS.has(String(input.accentColor))
      ? (input.accentColor as AccentColor)
      : DEFAULT_PREFERENCES.accentColor,
    defaultRowCount: asNumber(input.defaultRowCount, DEFAULT_PREFERENCES.defaultRowCount, PREFERENCE_LIMITS.rowCount),
    defaultSeed: String(input.defaultSeed ?? "").slice(0, PREFERENCE_LIMITS.seedLength),
    defaultFieldType: FIELD_TYPE_SET.has(String(input.defaultFieldType))
      ? (input.defaultFieldType as FieldType)
      : DEFAULT_PREFERENCES.defaultFieldType,
    defaultExportFormat:
      input.defaultExportFormat === "json" || input.defaultExportFormat === "sql" ? input.defaultExportFormat : "csv",
    // A template that has since been deleted simply falls back to the first
    // one, so a stale id here is harmless — a malformed one is not stored.
    defaultTemplateId: RECORD_ID.test(templateId) ? templateId : "",
    previewRowLimit: asNumber(input.previewRowLimit, DEFAULT_PREFERENCES.previewRowLimit, PREFERENCE_LIMITS.previewRows),
    datasetHistoryLimit: asNumber(
      input.datasetHistoryLimit,
      DEFAULT_PREFERENCES.datasetHistoryLimit,
      PREFERENCE_LIMITS.datasetHistory,
    ),
    confirmDestructive: input.confirmDestructive !== false,
    sidebarCollapsed: input.sidebarCollapsed === true,
    // Unknown names are dropped and duplicates collapsed, so the list is
    // always a clean subset of NAV_SECTIONS whatever was stored.
    collapsedNavSections: Array.isArray(input.collapsedNavSections)
      ? [...new Set(input.collapsedNavSections.filter((id): id is NavSection => NAV_SECTION_SET.has(String(id))))]
      : [],
    editorSplitPercent: asNumber(
      input.editorSplitPercent,
      DEFAULT_PREFERENCES.editorSplitPercent,
      PREFERENCE_LIMITS.editorSplit,
    ),
  };
}
