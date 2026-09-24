import { describe, expect, test } from "bun:test";
import { ACCENT_COLORS, DEFAULT_PREFERENCES, PREFERENCE_LIMITS, normalizePreferences } from "./preferences";

describe("normalizePreferences", () => {
  test("answers with the defaults for an account that has none", () => {
    for (const nothing of [undefined, null, "", 0, [], "not an object"]) {
      expect(normalizePreferences(nothing)).toEqual(DEFAULT_PREFERENCES);
    }
  });

  test("keeps a complete, valid set as it is", () => {
    const stored = {
      theme: "dark",
      accentColor: "emerald",
      defaultRowCount: 500,
      defaultSeed: "ci",
      defaultFieldType: "email",
      defaultExportFormat: "json",
      defaultTemplateId: "tpl_abc123",
      previewRowLimit: 250,
      datasetHistoryLimit: 10,
      confirmDestructive: false,
      sidebarCollapsed: true,
      collapsedNavSections: ["datasets"],
      editorSplitPercent: 35,
    };
    expect(normalizePreferences(stored)).toEqual(stored as never);
  });

  test("fills in whatever a partial set is missing", () => {
    expect(normalizePreferences({ theme: "light" })).toEqual({ ...DEFAULT_PREFERENCES, theme: "light" });
  });

  test("drops keys it does not know", () => {
    const normalized = normalizePreferences({ theme: "dark", surprise: { nested: true } });
    expect(normalized).toEqual({ ...DEFAULT_PREFERENCES, theme: "dark" });
    expect("surprise" in normalized).toBe(false);
  });

  test("clamps numbers into range and truncates fractions", () => {
    const tiny = normalizePreferences({ defaultRowCount: 0, previewRowLimit: -5, datasetHistoryLimit: 1 });
    expect(tiny.defaultRowCount).toBe(PREFERENCE_LIMITS.rowCount.min);
    expect(tiny.previewRowLimit).toBe(PREFERENCE_LIMITS.previewRows.min);
    expect(tiny.datasetHistoryLimit).toBe(PREFERENCE_LIMITS.datasetHistory.min);

    const huge = normalizePreferences({ defaultRowCount: 10_000_000, previewRowLimit: 99_999, datasetHistoryLimit: 900 });
    expect(huge.defaultRowCount).toBe(PREFERENCE_LIMITS.rowCount.max);
    expect(huge.previewRowLimit).toBe(PREFERENCE_LIMITS.previewRows.max);
    expect(huge.datasetHistoryLimit).toBe(PREFERENCE_LIMITS.datasetHistory.max);

    expect(normalizePreferences({ defaultRowCount: 42.9 }).defaultRowCount).toBe(42);
    expect(normalizePreferences({ defaultRowCount: "80" }).defaultRowCount).toBe(80);
    expect(normalizePreferences({ defaultRowCount: "many" }).defaultRowCount).toBe(
      DEFAULT_PREFERENCES.defaultRowCount,
    );
  });

  test("falls back on a value outside the set it allows", () => {
    expect(normalizePreferences({ theme: "solarized" }).theme).toBe(DEFAULT_PREFERENCES.theme);
    expect(normalizePreferences({ defaultExportFormat: "xml" }).defaultExportFormat).toBe("csv");
    expect(normalizePreferences({ defaultFieldType: "telepathy" }).defaultFieldType).toBe(
      DEFAULT_PREFERENCES.defaultFieldType,
    );
    expect(normalizePreferences({ defaultFieldType: "nowQuery" }).defaultFieldType).toBe("nowQuery");
  });

  test("only stores a template id that could be one", () => {
    expect(normalizePreferences({ defaultTemplateId: " tpl_abc123 " }).defaultTemplateId).toBe("tpl_abc123");
    expect(normalizePreferences({ defaultTemplateId: "../../etc/passwd" }).defaultTemplateId).toBe("");
    expect(normalizePreferences({ defaultTemplateId: 12 }).defaultTemplateId).toBe("");
  });

  test("caps the seed at the length the schema column allows", () => {
    const long = "x".repeat(PREFERENCE_LIMITS.seedLength + 50);
    expect(normalizePreferences({ defaultSeed: long }).defaultSeed).toHaveLength(PREFERENCE_LIMITS.seedLength);
  });

  test("treats the confirm-before-deleting switch as on unless it is explicitly off", () => {
    expect(normalizePreferences({}).confirmDestructive).toBe(true);
    expect(normalizePreferences({ confirmDestructive: "no" }).confirmDestructive).toBe(true);
    expect(normalizePreferences({ confirmDestructive: false }).confirmDestructive).toBe(false);
  });

  test("is idempotent, so the server has nothing left to correct", () => {
    const once = normalizePreferences({ defaultRowCount: 1e9, theme: "nope", defaultSeed: "s" });
    expect(normalizePreferences(once)).toEqual(once);
  });
});

describe("the accent colour", () => {
  test("defaults to blue", () => {
    expect(normalizePreferences({}).accentColor).toBe("blue");
    expect(DEFAULT_PREFERENCES.accentColor).toBe("blue");
  });

  test("keeps any accent the app actually offers", () => {
    for (const accent of ACCENT_COLORS) {
      expect(normalizePreferences({ accentColor: accent.id }).accentColor).toBe(accent.id);
    }
  });

  test("falls back to the default for anything else", () => {
    for (const bad of ["puce", "", null, 7, { id: "blue" }, "BLUE"]) {
      expect(normalizePreferences({ accentColor: bad }).accentColor).toBe(DEFAULT_PREFERENCES.accentColor);
    }
  });

  test("offers seven accents, each named once", () => {
    expect(ACCENT_COLORS).toHaveLength(7);
    expect(new Set(ACCENT_COLORS.map(a => a.id)).size).toBe(7);
    expect(new Set(ACCENT_COLORS.map(a => a.label)).size).toBe(7);
  });
});

describe("the layout preferences", () => {
  test("the sidebar starts open and the panes start even", () => {
    expect(DEFAULT_PREFERENCES.sidebarCollapsed).toBe(false);
    expect(DEFAULT_PREFERENCES.editorSplitPercent).toBe(50);
  });

  test("only an explicit true collapses the sidebar", () => {
    expect(normalizePreferences({ sidebarCollapsed: true }).sidebarCollapsed).toBe(true);
    for (const notTrue of ["true", 1, undefined, null, "yes"]) {
      expect(normalizePreferences({ sidebarCollapsed: notTrue }).sidebarCollapsed).toBe(false);
    }
  });

  test("the split is clamped so neither pane can be dragged out of existence", () => {
    const { min, max } = PREFERENCE_LIMITS.editorSplit;
    expect(normalizePreferences({ editorSplitPercent: 0 }).editorSplitPercent).toBe(min);
    expect(normalizePreferences({ editorSplitPercent: 100 }).editorSplitPercent).toBe(max);
    expect(normalizePreferences({ editorSplitPercent: -40 }).editorSplitPercent).toBe(min);
    expect(normalizePreferences({ editorSplitPercent: 33 }).editorSplitPercent).toBe(33);
  });

  test("a split that is not a number falls back to even panes", () => {
    for (const bad of ["wide", null, undefined, {}]) {
      expect(normalizePreferences({ editorSplitPercent: bad }).editorSplitPercent).toBe(
        DEFAULT_PREFERENCES.editorSplitPercent,
      );
    }
  });
});

describe("a numeric preference that is present but empty", () => {
  test("reads as the default rather than clamping to the bottom of its range", () => {
    // Number(null) and Number("") are both 0, which would silently become the
    // minimum — a preview of 10 rows where the default is 100.
    for (const blank of [null, undefined, ""]) {
      const preferences = normalizePreferences({ previewRowLimit: blank, defaultRowCount: blank });
      expect(preferences.previewRowLimit).toBe(DEFAULT_PREFERENCES.previewRowLimit);
      expect(preferences.defaultRowCount).toBe(DEFAULT_PREFERENCES.defaultRowCount);
    }
  });

  test("but a real zero still clamps, because it was actually asked for", () => {
    expect(normalizePreferences({ previewRowLimit: 0 }).previewRowLimit).toBe(PREFERENCE_LIMITS.previewRows.min);
  });
});
