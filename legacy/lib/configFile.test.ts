import { describe, expect, test } from "bun:test";
import {
  CONFIG_FILE_KIND,
  CONFIG_FILE_VERSION,
  buildConfigFile,
  configFileName,
  parseConfigFile,
  serializeConfigFile,
} from "./configFile";
import type { Field } from "./types";

const fields: Field[] = [
  { id: "1", name: "email", type: "email", unique: true },
  { id: "2", name: "status", type: "enum", nullPercent: 10, options: { values: ["a", "b"] } },
  { id: "3", name: "qty", type: "integer", options: { min: 1, max: 9 } },
  { id: "4", name: "total", type: "computed", options: { expression: "qty * 2.5", decimals: 2 } },
  { id: "5", name: "empty_opts", type: "city", options: {} },
  { id: "6", name: "lookup", type: "nowQuery", options: { table: "incident", query: "active=true", limit: 25 } },
];

const config = { name: "Order lines", description: "notes", rowCount: 40, seed: "abc", fields };

describe("buildConfigFile", () => {
  test("writes a versioned envelope without internal ids", () => {
    const file = buildConfigFile(config);
    expect(file.kind).toBe(CONFIG_FILE_KIND);
    expect(file.version).toBe(CONFIG_FILE_VERSION);
    expect(file.fields.every(f => !("id" in f))).toBe(true);
    expect(file.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("omits empty option objects", () => {
    const file = buildConfigFile(config);
    expect(file.fields.find(f => f.name === "empty_opts")?.options).toBeUndefined();
    expect(file.fields.find(f => f.name === "qty")?.options).toEqual({ min: 1, max: 9 });
  });

  test("derives a safe filename", () => {
    expect(configFileName("Order lines")).toBe("order-lines.ddg.json");
    expect(configFileName("  Users / Accounts!  ")).toBe("users-accounts.ddg.json");
    expect(configFileName("***")).toBe("configuration.ddg.json");
  });
});

describe("round trip", () => {
  test("survives serialize → parse with every setting intact", () => {
    const parsed = parseConfigFile(JSON.parse(serializeConfigFile(config)));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.config.name).toBe("Order lines");
    expect(parsed.config.description).toBe("notes");
    expect(parsed.config.rowCount).toBe(40);
    expect(parsed.config.seed).toBe("abc");
    expect(parsed.config.fields.map(f => ({ ...f, id: undefined }))).toEqual(
      fields.map(f => ({
        ...f,
        id: undefined,
        options: f.options && Object.keys(f.options).length ? f.options : undefined,
      })),
    );
    // Fresh ids, not the ones from the source config.
    expect(parsed.config.fields.every(f => f.id && !["1", "2", "3", "4", "5", "6"].includes(f.id))).toBe(true);
  });
});

describe("metadata", () => {
  test("travels with the configuration, through the file and back", () => {
    const withPairs = { ...config, metadata: { team: "billing", ticket: "DDG-412" } };
    const parsed = parseConfigFile(JSON.parse(serializeConfigFile(withPairs)));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.config.metadata).toEqual({ team: "billing", ticket: "DDG-412" });
  });

  test("a file written before metadata existed simply carries none", () => {
    const file = JSON.parse(serializeConfigFile(config));
    delete file.metadata;
    const parsed = parseConfigFile(file);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.config.metadata).toEqual({});
  });

  test("metadata of the wrong shape is refused, rather than dropped in silence", () => {
    const file = { ...JSON.parse(serializeConfigFile(config)), metadata: { owners: ["ada"] } };
    const parsed = parseConfigFile(file);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toContain('"owners"');
  });
});

describe("parseConfigFile", () => {
  const reject = (raw: unknown, pattern: RegExp) => {
    const result = parseConfigFile(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(pattern);
  };

  test("rejects structurally invalid files", () => {
    reject([{ name: "a", type: "email" }], /top level/);
    reject("nope", /top level/);
    reject({ kind: "other/thing", fields: [] }, /Not a /);
    reject({ version: 99, fields: [{ name: "a", type: "email" }] }, /version 99/);
    reject({ name: "x" }, /no "fields" array/);
    reject({ fields: [] }, /no fields/);
    reject({ fields: [{ name: "a", type: "email" }, "nope"] }, /Field 2 is not an object/);
  });

  test("rejects invalid fields", () => {
    reject({ fields: [{ type: "email" }] }, /missing a name/);
    reject({ fields: [{ name: "a", type: "telepathy" }] }, /Unknown field type/);
    reject({ fields: [{ name: "a", type: "email" }, { name: "a", type: "city" }] }, /Duplicate field name/);
    reject({ fields: [{ name: "a".repeat(300), type: "email" }] }, /longer than/);
    reject({ fields: Array.from({ length: 501 }, (_, i) => ({ name: `f${i}`, type: "email" })) }, /Too many fields/);
  });

  test("rejects calculated fields whose formula cannot resolve", () => {
    reject({ fields: [{ name: "t", type: "computed", options: { expression: "missing * 2" } }] }, /missing/);
    reject(
      {
        fields: [
          { name: "label", type: "word" },
          { name: "t", type: "computed", options: { expression: "label * 2" } },
        ],
      },
      /numeric/,
    );
  });

  test("accepts a hand-written file with no kind or version", () => {
    const result = parseConfigFile({ name: "Minimal", fields: [{ name: "a", type: "email" }] });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.config.rowCount).toBe(25);
  });

  test("strips unknown option keys and coerces or clamps the rest", () => {
    const result = parseConfigFile({
      fields: [
        {
          name: "a",
          type: "integer",
          nullPercent: 500,
          unique: "yes",
          options: { min: "5", max: 9, format: "bogus", values: [1, "ok"], arrayOf: "nonsense", evil: "x" },
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [field] = result.config.fields;
    expect(field!.nullPercent).toBe(100); // clamped
    expect(field!.unique).toBeUndefined(); // only a real boolean counts
    expect(field!.options).toEqual({ min: 5, max: 9, values: ["ok"] });
  });

  test("falls back to sane defaults for a missing name and row count", () => {
    const result = parseConfigFile({ fields: [{ name: "a", type: "email" }], rowCount: 9_999_999 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.name).toBe("Imported schema");
      expect(result.config.rowCount).toBe(100_000);
    }
  });
});

describe("the options added for correlated, shaped and structured fields", () => {
  const field = (name: string, type: Field["type"], options: Field["options"]): Field => ({
    id: crypto.randomUUID(),
    name,
    type,
    options,
  });

  test("a round trip keeps every new option", () => {
    const fields: Field[] = [
      field("status", "enum", { values: ["a", "b"], weights: [9, 1] }),
      field("latency", "latencyMs", { distribution: "lognormal", mean: 120, stddev: 0.9, min: 1 }),
      field("qty", "quantity", { distribution: "pareto", shape: 1.4, min: 1 }),
      field("email", "email", { derivesFrom: "full_name" }),
      field("customer", "bundle", { bundle: "company" }),
      field("ts", "sequentialDate", { step: 900, jitter: 30, businessHours: true, format: "iso" }),
      field("ended_at", "recentDate", { after: "ts" }),
      field("cancelled_at", "recentDate", { when: "status == 'a'" }),
      field("user_id", "reference", { refDataset: "ds_1", refField: "id", refMode: "cycle" }),
      field("input", "edgeCase", { variant: "injection" }),
      field("vector", "embedding", { dimensions: 16, decimals: 3 }),
    ];

    const parsed = parseConfigFile(JSON.parse(serializeConfigFile({ name: "S", fields, rowCount: 10 })));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const byName = Object.fromEntries(parsed.config.fields.map(f => [f.name, f.options]));
    expect(byName.status).toEqual({ values: ["a", "b"], weights: [9, 1] });
    expect(byName.latency).toEqual({ distribution: "lognormal", mean: 120, stddev: 0.9, min: 1 });
    expect(byName.qty).toEqual({ distribution: "pareto", shape: 1.4, min: 1 });
    expect(byName.email).toEqual({ derivesFrom: "full_name" });
    expect(byName.customer).toEqual({ bundle: "company" });
    expect(byName.ts).toEqual({ step: 900, jitter: 30, businessHours: true, format: "iso" });
    expect(byName.ended_at).toEqual({ after: "ts" });
    expect(byName.cancelled_at).toEqual({ when: "status == 'a'" });
    expect(byName.user_id).toEqual({ refDataset: "ds_1", refField: "id", refMode: "cycle" });
    expect(byName.input).toEqual({ variant: "injection" });
    expect(byName.vector).toEqual({ dimensions: 16, decimals: 3 });
  });

  test("nested child fields survive, with fresh ids", () => {
    const child = field("city", "city", {});
    const fields = [field("address", "object", { fields: [child] })];

    const file = JSON.parse(serializeConfigFile({ name: "S", fields, rowCount: 5 }));
    // Ids are stripped on the way out, at every level.
    expect(file.fields[0].options.fields[0]).not.toHaveProperty("id");

    const parsed = parseConfigFile(file);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const children = parsed.config.fields[0]?.options?.fields ?? [];
    expect(children.map(f => f.name)).toEqual(["city"]);
    expect(children[0]!.id).not.toBe(child.id);
  });

  test("the locale travels with the schema", () => {
    const file = JSON.parse(
      serializeConfigFile({ name: "S", fields: [field("n", "fullName", {})], rowCount: 5, locale: "de" }),
    );
    const parsed = parseConfigFile(file);
    expect(parsed.ok && parsed.config.locale).toBe("de");
  });

  test("a broken condition is caught on import, not at the first generate", () => {
    const file = JSON.parse(
      serializeConfigFile({ name: "S", fields: [field("x", "sentence", { when: "nosuch == 'a'" })], rowCount: 5 }),
    );
    const parsed = parseConfigFile(file);
    expect(parsed.ok).toBe(false);
    expect(parsed.ok === false && parsed.error).toContain("nosuch");
  });

  test("a condition on a nested child is dropped, since only the row has one", () => {
    const parsed = parseConfigFile({
      kind: "dummy-data-generator/config",
      version: 2,
      name: "S",
      rowCount: 5,
      fields: [{ name: "address", type: "object", options: { fields: [{ name: "city", type: "city", options: { when: "x == 1" } }] } }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.config.fields[0]?.options?.fields?.[0]?.options?.when).toBeUndefined();
  });

  test("unrecognized option keys are still dropped", () => {
    const parsed = parseConfigFile({
      kind: "dummy-data-generator/config",
      version: 2,
      name: "S",
      rowCount: 5,
      fields: [{ name: "x", type: "integer", options: { min: 1, nonsense: "drop me" } }],
    });
    expect(parsed.ok && parsed.config.fields[0]?.options).toEqual({ min: 1 });
  });

  test("a file from a future version is refused", () => {
    const parsed = parseConfigFile({
      kind: "dummy-data-generator/config",
      version: CONFIG_FILE_VERSION + 1,
      name: "S",
      rowCount: 5,
      fields: [{ name: "x", type: "integer" }],
    });
    expect(parsed.ok).toBe(false);
  });
});

describe("nesting limits", () => {
  const nest = (depth: number): Record<string, unknown> =>
    depth === 0
      ? { name: `leaf`, type: "word" }
      : { name: `level${depth}`, type: "object", options: { fields: [nest(depth - 1)] } };

  test("a schema at the limit imports", () => {
    const parsed = parseConfigFile({
      kind: CONFIG_FILE_KIND,
      version: CONFIG_FILE_VERSION,
      name: "Deep",
      rowCount: 5,
      fields: [nest(3)],
    });
    expect(parsed.ok).toBe(true);
  });

  test("a schema past the limit is refused by name, not silently flattened", () => {
    const parsed = parseConfigFile({
      kind: CONFIG_FILE_KIND,
      version: CONFIG_FILE_VERSION,
      name: "Too deep",
      rowCount: 5,
      fields: [nest(4)],
    });
    expect(parsed.ok).toBe(false);
    expect(parsed.ok === false && parsed.error).toContain("level4");
  });
});
