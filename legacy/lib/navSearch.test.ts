import { describe, expect, test } from "bun:test";
import { searchNav } from "./navSearch";
import type { Dataset, SchemaConfig } from "./types";
import type { Note } from "./notes";
import type { ScriptTemplate } from "./scriptTemplate";

const config = (over: Partial<SchemaConfig> = {}): SchemaConfig => ({
  id: "cfg_1",
  name: "Customers",
  description: "",
  fields: [{ id: "f1", name: "email", type: "email" }],
  mappings: [],
  rowCount: 25,
  ownerId: "user_a",
  sharedWith: [],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  ...over,
});

const template = (over: Partial<ScriptTemplate> = {}): ScriptTemplate => ({
  id: "tpl_1",
  name: "Seed script",
  body: "-- nothing here",
  ownerId: "user_a",
  sharedWith: [],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  ...over,
});

const dataset = (over: Partial<Dataset> = {}): Dataset => ({
  id: "ds_1",
  configId: "cfg_1",
  name: "Customers · 2026-09-01T00:00:00Z",
  rowCount: 100,
  fieldCount: 2,
  ownerId: "user_a",
  createdAt: "2026-09-01T00:00:00.000Z",
  ...over,
});

const note = (over: Partial<Note> = {}): Note => ({
  id: "note_1",
  title: "Release checklist",
  body: "Regenerate [[cfg_1]] before the demo.",
  ownerId: "user_a",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  ...over,
});

const lists = (over: Partial<Parameters<typeof searchNav>[1]> = {}) => ({
  configs: [config()],
  templates: [template()],
  notes: [note()],
  datasets: [dataset()],
  ...over,
});

describe("searchNav", () => {
  test("an empty query passes everything through, hintless", () => {
    const results = searchNav("", lists());
    expect(results.total).toBe(4);
    expect(results.configs[0]!.hint).toBeUndefined();
  });

  test("whitespace alone is still no query", () => {
    expect(searchNav("   ", lists()).total).toBe(4);
  });

  test("matches a name, case-insensitively, and says nothing extra about it", () => {
    const results = searchNav("cUsTo", lists());
    expect(results.configs.map(m => m.item.id)).toEqual(["cfg_1"]);
    expect(results.configs[0]!.hint).toBeUndefined();
  });

  test("a hit on a field name says which field, since the title will not", () => {
    const results = searchNav("email", lists());
    expect(results.configs[0]!.hint).toBe("field: email");
  });

  test("reaches the children of an object field, by their full path", () => {
    const nested = config({
      fields: [
        {
          id: "f1",
          name: "address",
          type: "object",
          options: { fields: [{ id: "f2", name: "postcode", type: "zipCode" }] },
        },
      ],
    });
    expect(searchNav("postcode", lists({ configs: [nested] })).configs[0]!.hint).toBe("field: address.postcode");
  });

  test("finds a schema by the type someone picked, under the label they saw", () => {
    const results = searchNav("Full name", lists({ configs: [config({ fields: [{ id: "f1", name: "who", type: "fullName" }] })] }));
    expect(results.configs[0]!.hint).toBe("Full name: who");
  });

  test("finds a schema by its metadata, and shows the pair", () => {
    const tagged = config({ metadata: { ticket: "DDG-412" } });
    expect(searchNav("ddg-412", lists({ configs: [tagged] })).configs[0]!.hint).toBe("ticket: DDG-412");
  });

  test("finds a schema by what it borrows from another one", () => {
    const linked = config({
      name: "Orders",
      mappings: [
        { id: "m1", field: "customer_id", fromConfig: "cfg_1", fromConfigName: "Customers", fromField: "id", mode: "random" },
      ],
    });
    expect(searchNav("customer_id", lists({ configs: [linked] })).configs[0]!.hint).toBe(
      "mapping: customer_id ← Customers.id",
    );
  });

  test("searches a template's body, and answers with the line around the hit", () => {
    const script = template({ name: "Loader", body: "INSERT INTO customers (id, email) VALUES" });
    const hint = searchNav("customers", lists({ templates: [script] })).templates[0]!.hint;
    expect(hint).toContain("INSERT INTO customers");
    // Short enough to fit inside the padding, so there is nothing to elide.
    expect(hint).not.toContain("…");
  });

  test("a hit deep in a long body comes back elided at both ends", () => {
    const script = template({ name: "Loader", body: `${"x".repeat(200)} customers ${"y".repeat(200)}` });
    const hint = searchNav("customers", lists({ templates: [script] })).templates[0]!.hint!;
    expect(hint).toContain("customers");
    expect(hint.startsWith("…")).toBe(true);
    expect(hint.endsWith("…")).toBe(true);
    expect(hint.length).toBeLessThan(100);
  });

  test("a body hit is collapsed to one line, whatever the script's indentation", () => {
    const script = template({ name: "Loader", body: "function run() {\n\n      const target = 42;\n}" });
    expect(searchNav("target", lists({ templates: [script] })).templates[0]!.hint).not.toContain("\n");
  });

  test("notes match on their title, and on what was written in them", () => {
    expect(searchNav("checklist", lists()).notes[0]!.hint).toBeUndefined();
    expect(searchNav("demo", lists()).notes[0]!.hint).toBe("…te [[cfg_1]] before the demo.");
  });

  test("a note can be found by the record it references", () => {
    // How "what did I write about this configuration" is asked.
    const results = searchNav("cfg_1", lists());
    expect(results.notes).toHaveLength(1);
    expect(results.notes[0]!.hint).toContain("cfg_1");
  });

  test("datasets match on their name only", () => {
    expect(searchNav("customers", lists()).datasets).toHaveLength(1);
    expect(searchNav("100", lists()).datasets).toHaveLength(0);
  });

  test("name matches sort ahead of the ones found deeper in", () => {
    const byField = config({ id: "cfg_2", name: "Orders", fields: [{ id: "f1", name: "invoice", type: "uuid" }] });
    const byName = config({ id: "cfg_3", name: "Invoices" });
    const results = searchNav("invoice", lists({ configs: [byField, byName] }));
    expect(results.configs.map(m => m.item.id)).toEqual(["cfg_3", "cfg_2"]);
  });

  test("nothing matching is an empty result rather than everything", () => {
    const results = searchNav("zzzz", lists());
    expect(results.total).toBe(0);
    expect(results.configs).toEqual([]);
  });

  test("the total counts every list together", () => {
    expect(searchNav("customers", lists()).total).toBe(2);
  });
});
