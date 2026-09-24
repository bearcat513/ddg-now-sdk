import { describe, expect, test } from "bun:test";
import { generateRows } from "./generate";
import { inferSchema, makeField } from "./infer";
import { toCsv, toJson } from "./export";
import { NOW_QUERY_DEFAULT_LIMIT } from "../lib/types";

describe("inferSchema", () => {
  test("infers types from a JSON sample using names and value shapes", () => {
    const { fields, detected } = inferSchema(
      JSON.stringify({
        id: "0e5b6c1e-1f2a-4c3b-9d4e-5f6a7b8c9d0e",
        first_name: "Ada",
        email: "ada@example.com",
        signup_count: 3,
        is_admin: false,
        created_at: "2024-03-01T10:00:00Z",
      }),
    );

    expect(detected).toBe("json");
    const byName = Object.fromEntries(fields.map(f => [f.name, f.type]));
    expect(byName).toEqual({
      id: "uuid",
      first_name: "firstName",
      email: "email",
      signup_count: "integer",
      is_admin: "boolean",
      created_at: "recentDate",
    });
  });

  test("collects real enum values from an array sample", () => {
    const { fields } = inferSchema(JSON.stringify([{ status: "active" }, { status: "churned" }]));
    expect(fields[0]?.options?.values).toEqual(["active", "churned"]);
  });

  test("flattens nested objects into dot paths", () => {
    const { fields } = inferSchema(JSON.stringify({ address: { city: "Austin", zip: "78701" } }));
    expect(fields.map(f => f.name)).toEqual(["address.city", "address.zip"]);
  });

  test("parses a TypeScript interface including literal unions and optionals", () => {
    const { fields, detected } = inferSchema(`export interface Order {
      id: string;
      total: number;
      status: "pending" | "shipped";
      shippedAt?: Date;
      tags: string[];
      metadata: Record<string, unknown>;
    }`);

    expect(detected).toBe("typescript");
    const byName = Object.fromEntries(fields.map(f => [f.name, f]));
    expect(byName.status?.options?.values).toEqual(["pending", "shipped"]);
    expect(byName.shippedAt?.nullPercent).toBe(15);
    expect(byName.tags?.type).toBe("array");
    // `Record<string, unknown>` must not be split at its internal comma.
    expect(byName.metadata).toBeDefined();
    expect(fields).toHaveLength(6);
  });

  test("parses CREATE TABLE, honoring UNIQUE, NOT NULL and column types", () => {
    const { fields, detected } = inferSchema(`CREATE TABLE employees (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      department VARCHAR(60),
      salary NUMERIC(10,2) NOT NULL,
      PRIMARY KEY (id)
    );`);

    expect(detected).toBe("sql");
    expect(fields.map(f => f.name)).toEqual(["id", "email", "department", "salary"]);
    expect(fields[0]?.type).toBe("autoIncrement");
    expect(fields[1]?.unique).toBe(true);
    expect(fields[2]?.nullPercent).toBe(10); // nullable column
    expect(fields[3]?.type).toBe("price");
  });

  test("rejects input it cannot recognize", () => {
    expect(() => inferSchema("just some prose")).toThrow();
    expect(() => inferSchema("")).toThrow();
  });
});

describe("generateRows", () => {
  test("produces the requested row count with every field present", () => {
    const fields = [makeField("email", "email"), makeField("age", "age")];
    const rows = generateRows({ fields, rowCount: 20, seed: "" });
    expect(rows).toHaveLength(20);
    expect(rows.every(r => typeof r.email === "string" && typeof r.age === "number")).toBe(true);
  });

  test("is reproducible for a given seed and varies without one", () => {
    const fields = [makeField("name", "fullName")];
    const a = generateRows({ fields, rowCount: 5, seed: "abc" });
    const b = generateRows({ fields, rowCount: 5, seed: "abc" });
    const c = generateRows({ fields, rowCount: 5, seed: "xyz" });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  test("respects min/max bounds", () => {
    const fields = [makeField("n", "integer", { options: { min: 5, max: 7 } })];
    const values = generateRows({ fields, rowCount: 50, seed: "s" }).map(r => r.n as number);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(5);
    expect(Math.max(...values)).toBeLessThanOrEqual(7);
  });

  test("honors nullPercent at its extremes", () => {
    const always = generateRows({ fields: [makeField("x", "word", { nullPercent: 100 })], rowCount: 10, seed: "s" });
    const never = generateRows({ fields: [makeField("x", "word", { nullPercent: 0 })], rowCount: 10, seed: "s" });
    expect(always.every(r => r.x === null)).toBe(true);
    expect(never.every(r => r.x !== null)).toBe(true);
  });

  test("keeps unique fields free of duplicates", () => {
    const fields = [makeField("n", "integer", { unique: true, options: { min: 1, max: 60 } })];
    const values = generateRows({ fields, rowCount: 50, seed: "s" }).map(r => r.n);
    expect(new Set(values).size).toBe(50);
  });

  test("picks only from enum values and applies prefix/suffix", () => {
    const fields = [makeField("s", "enum", { options: { values: ["a", "b"], prefix: "<", suffix: ">" } })];
    const values = new Set(generateRows({ fields, rowCount: 30, seed: "s" }).map(r => r.s));
    expect([...values].every(v => v === "<a>" || v === "<b>")).toBe(true);
  });

  test("expands template patterns", () => {
    const fields = [makeField("code", "template", { options: { pattern: "ORD-{{number:10-99}}-{{index}}" } })];
    const rows = generateRows({ fields, rowCount: 3, seed: "s" });
    expect(rows.map(r => r.code)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^ORD-\d{2}-[012]$/)]),
    );
  });

  test("numbers autoIncrement fields sequentially from min", () => {
    const fields = [makeField("id", "autoIncrement", { options: { min: 100 } })];
    expect(generateRows({ fields, rowCount: 3, seed: "s" }).map(r => r.id)).toEqual([100, 101, 102]);
  });
});

describe("now query fields", () => {
  const values = (fields: Parameters<typeof generateRows>[0]["fields"], rowCount = 1, seed = "s") =>
    generateRows({ fields, rowCount, seed }).map(row => row.lookup as Record<string, unknown>);

  test("yields an object carrying the table, query and limit verbatim", () => {
    const fields = [
      makeField("lookup", "nowQuery", { options: { table: "incident", query: "active=true^priority=1", limit: 25 } }),
    ];

    for (const value of values(fields, 3)) {
      // An object, not a pre-encoded string — the JSON exporter nests it as-is.
      expect(typeof value).toBe("object");
      expect(value).toMatchObject({ table: "incident", query: "active=true^priority=1", limit: 25 });
    }
  });

  test("draws a count between 1 and the limit", () => {
    const fields = [makeField("lookup", "nowQuery", { options: { table: "sys_user", limit: 4 } })];
    const counts = values(fields, 200).map(value => value.count as number);

    expect(counts.every(c => Number.isInteger(c) && c >= 1 && c <= 4)).toBe(true);
    // 200 draws over a range of 4 should exercise both ends.
    expect(new Set(counts).size).toBeGreaterThan(1);
  });

  test("falls back to the default limit and empty table / query", () => {
    const [value] = values([makeField("lookup", "nowQuery", { options: {} })]);
    expect(value).toEqual({ table: "", query: "", limit: NOW_QUERY_DEFAULT_LIMIT, count: expect.any(Number) });
    expect(value!.count as number).toBeLessThanOrEqual(NOW_QUERY_DEFAULT_LIMIT);
  });

  test("floors a limit below 1 so the range stays valid", () => {
    for (const limit of [0, -5, 0.5]) {
      const [value] = values([makeField("lookup", "nowQuery", { options: { limit } })]);
      expect(value).toMatchObject({ limit: 1, count: 1 });
    }
  });

  test("replays the same count for the same seed", () => {
    const fields = [makeField("lookup", "nowQuery", { options: { table: "incident", limit: 1000 } })];
    expect(values(fields, 10, "abc")).toEqual(values(fields, 10, "abc"));
    expect(values(fields, 10, "abc")).not.toEqual(values(fields, 10, "xyz"));
  });

  test("exports as nested JSON, and as a compact JSON string in CSV", () => {
    const fields = [makeField("lookup", "nowQuery", { options: { table: "incident", query: "a=1,b=2", limit: 1 } })];
    const rows = generateRows({ fields, rowCount: 1, seed: "s" });
    const payload = { table: "incident", query: "a=1,b=2", limit: 1, count: 1 };

    // JSON: a real object, encoded exactly once.
    expect(JSON.parse(toJson(rows))).toEqual([{ lookup: payload }]);
    expect(toJson(rows)).not.toContain('\\"');

    // CSV has no nesting, so the object collapses to a quoted JSON string.
    expect(toCsv(rows)).toBe(`lookup\n"${JSON.stringify(payload).replace(/"/g, '""')}"`);
  });

  test("keeps a prefix or suffix from mangling the object into [object Object]", () => {
    const fields = [makeField("lookup", "nowQuery", { options: { table: "incident", limit: 1, prefix: ">" } })];
    // A prefix is a request for text, so the object is encoded once and affixed.
    expect(generateRows({ fields, rowCount: 1, seed: "s" })[0]!.lookup).toBe(
      '>{"table":"incident","query":"","limit":1,"count":1}',
    );
  });

  test("does not corrupt a unique field's object when every draw collides", () => {
    // limit 1 means every row is identical, so uniqueness cannot be satisfied.
    const fields = [makeField("lookup", "nowQuery", { unique: true, options: { table: "incident", limit: 1 } })];
    const rows = values(fields, 3);

    expect(rows.every(value => typeof value === "object")).toBe(true);
    expect(rows.every(value => value.count === 1)).toBe(true);
  });
});

describe("exporters", () => {
  const rows = [
    { id: 1, "user.name": "Ada, Lovelace", "user.city": "Austin", tags: ["a", "b"], note: null },
    { id: 2, "user.name": 'He said "hi"', "user.city": "Reno", tags: [], note: "ok" },
  ];

  test("CSV quotes commas and quotes, and blanks nulls", () => {
    const csv = toCsv(rows).split("\n");
    expect(csv[0]).toBe("id,user.name,user.city,tags,note");
    expect(csv[1]).toBe('1,"Ada, Lovelace",Austin,"[""a"",""b""]",');
    expect(csv[2]).toBe('2,"He said ""hi""",Reno,[],ok');
  });

  test("CSV header is the union of all row keys", () => {
    expect(toCsv([{ a: 1 }, { b: 2 }]).split("\n")[0]).toBe("a,b");
  });

  test("JSON restores nesting from dot paths", () => {
    const parsed = JSON.parse(toJson(rows));
    expect(parsed[0]).toEqual({
      id: 1,
      user: { name: "Ada, Lovelace", city: "Austin" },
      tags: ["a", "b"],
      note: null,
    });
  });
});

describe("calculated fields", () => {
  const line = [
    makeField("quantity", "integer", { options: { min: 2, max: 2 } }),
    makeField("unit_price", "price", { options: { min: 10, max: 10, decimals: 2 } }),
    makeField("subtotal", "computed", { options: { expression: "quantity * unit_price", decimals: 2 } }),
  ];

  test("computes values from the other fields of the same row", () => {
    const rows = generateRows({ fields: line, rowCount: 5, seed: "calc" });
    expect(rows.every(r => r.subtotal === (r.quantity as number) * (r.unit_price as number))).toBe(true);
  });

  test("resolves chains regardless of declaration order", () => {
    const fields = [
      makeField("total", "computed", { options: { expression: "subtotal + tax", decimals: 2 } }),
      makeField("tax", "computed", { options: { expression: "subtotal * 0.1", decimals: 2 } }),
      ...line,
    ];
    const [row] = generateRows({ fields, rowCount: 1, seed: "calc" });
    expect(row!.subtotal).toBe(20);
    expect(row!.tax).toBe(2);
    expect(row!.total).toBe(22);
  });

  test("keeps schema order in the output row despite the evaluation order", () => {
    const fields = [
      makeField("total", "computed", { options: { expression: "quantity * 2" } }),
      makeField("quantity", "integer", { options: { min: 1, max: 1 } }),
    ];
    expect(Object.keys(generateRows({ fields, rowCount: 1, seed: "s" })[0]!)).toEqual(["total", "quantity"]);
  });

  test("rejects unknown, non-numeric and self references before generating", () => {
    const attempt = (expression: string, extra = line) =>
      () => generateRows({ fields: [...extra, makeField("calc", "computed", { options: { expression } })], rowCount: 1, seed: "s" });

    expect(attempt("quantity * missing")).toThrow(/missing/);
    expect(attempt("calc + 1")).toThrow(/itself/);
    expect(attempt("quantity *")).toThrow();
    expect(attempt("label * 2", [...line, makeField("label", "word")])).toThrow(/numeric/);
  });

  test("detects circular references between calculated fields", () => {
    expect(() =>
      generateRows({
        fields: [
          makeField("a", "computed", { options: { expression: "b + 1" } }),
          makeField("b", "computed", { options: { expression: "a + 1" } }),
        ],
        rowCount: 1,
        seed: "s",
      }),
    ).toThrow(/loop/);
  });

  test("yields null when a row cannot be computed", () => {
    const fields = [
      makeField("divisor", "integer", { options: { min: 0, max: 0 } }),
      makeField("ratio", "computed", { options: { expression: "100 / divisor" } }),
    ];
    expect(generateRows({ fields, rowCount: 3, seed: "s" }).every(r => r.ratio === null)).toBe(true);
  });
});
