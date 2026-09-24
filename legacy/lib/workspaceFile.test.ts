import { describe, expect, test } from "bun:test";
import { parseConfigFile } from "./configFile";
import { DEFAULT_PREFERENCES } from "./preferences";
import {
  WORKSPACE_FILE_KIND,
  WORKSPACE_FILE_VERSION,
  buildWorkspaceFile,
  serializeWorkspaceFile,
  workspaceFileName,
} from "./workspaceFile";
import type { Note } from "./notes";
import type { SchemaConfig } from "./types";
import type { ScriptTemplate } from "./scriptTemplate";

const ME = "user_alice";
const THEM = "user_bob";

const config = (overrides: Partial<SchemaConfig> = {}): SchemaConfig => ({
  id: "cfg_1",
  name: "Order lines",
  description: "",
  mappings: [],
  rowCount: 40,
  seed: "abc",
  fields: [
    { id: "1", name: "email", type: "email", unique: true },
    { id: "2", name: "qty", type: "integer", options: { min: 1, max: 9 } },
    { id: "3", name: "total", type: "computed", options: { expression: "qty * 2.5", decimals: 2 } },
  ],
  ownerId: ME,
  sharedWith: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  ...overrides,
});

const template = (overrides: Partial<ScriptTemplate> = {}): ScriptTemplate => ({
  id: "tpl_1",
  name: "Seed incidents",
  body: "const records = ${GENERATED_DATASET};",
  ownerId: ME,
  sharedWith: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  ...overrides,
});

const note = (overrides: Partial<Note> = {}): Note => ({
  id: "note_1",
  title: "Seeding the demo",
  body: "The seed for [[cfg_1]] is wrong above 10k rows.",
  ownerId: ME,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  ...overrides,
});

const input = {
  ownerId: ME,
  email: "alice@example.com",
  configs: [config()],
  templates: [template()],
  notes: [note()],
  preferences: { ...DEFAULT_PREFERENCES, theme: "dark" as const },
};

describe("buildWorkspaceFile", () => {
  test("writes a versioned envelope naming the account it came from", () => {
    const file = buildWorkspaceFile(input);
    expect(file.kind).toBe(WORKSPACE_FILE_KIND);
    expect(file.version).toBe(WORKSPACE_FILE_VERSION);
    expect(file.exportedBy).toBe("alice@example.com");
    expect(file.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(file.preferences.theme).toBe("dark");
  });

  test("every configuration entry is a *.ddg.json document in its own right", () => {
    const [entry] = buildWorkspaceFile(input).configs;

    const parsed = parseConfigFile(entry);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.config.name).toBe("Order lines");
    expect(parsed.config.rowCount).toBe(40);
    expect(parsed.config.seed).toBe("abc");
    expect(parsed.config.fields.map(field => field.name)).toEqual(["email", "qty", "total"]);
    // Ids are minted on import, so they never travel in the file.
    expect(entry!.fields.every(field => !("id" in field))).toBe(true);
  });

  test("carries templates whole, placeholder included", () => {
    const [entry] = buildWorkspaceFile(input).scriptTemplates;
    expect(entry).toEqual({ name: "Seed incidents", body: "const records = ${GENERATED_DATASET};" });
  });

  test("marks what came from somebody else's account, and nothing else", () => {
    const file = buildWorkspaceFile({
      ...input,
      configs: [config(), config({ id: "cfg_2", name: "Theirs", ownerId: THEM })],
      templates: [template(), template({ id: "tpl_2", name: "Theirs", ownerId: THEM })],
    });

    expect(file.configs.map(entry => entry.sharedWithMe)).toEqual([undefined, true]);
    expect(file.scriptTemplates.map(entry => entry.sharedWithMe)).toEqual([undefined, true]);
  });

  test("carries notes with the ids their references are written against", () => {
    // Without the id, `[[cfg_1]]` in the body below would point at nothing on
    // the far side of a restore.
    const [entry] = buildWorkspaceFile(input).notes;
    expect(entry).toEqual({
      id: "note_1",
      title: "Seeding the demo",
      body: "The seed for [[cfg_1]] is wrong above 10k rows.",
    });
  });

  test("an empty account still exports a usable file", () => {
    const file = buildWorkspaceFile({ ...input, configs: [], templates: [], notes: [] });
    expect(file.configs).toEqual([]);
    expect(file.scriptTemplates).toEqual([]);
    expect(file.notes).toEqual([]);
    expect(file.preferences).toBeDefined();
  });

  test("serializes as indented JSON", () => {
    const text = serializeWorkspaceFile(input);
    expect(text).toContain('\n  "kind"');
    expect(JSON.parse(text).configs).toHaveLength(1);
  });

  test("names the file by the day it was taken", () => {
    expect(workspaceFileName(new Date("2026-09-16T12:00:00Z"))).toBe("ddg-workspace-2026-09-16.json");
  });
});
