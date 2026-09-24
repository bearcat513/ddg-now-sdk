import { describe, expect, test } from "bun:test";
import { generateRows } from "./generate";
import { toSql, sqlTableName } from "./export";
import { BUNDLE_COLUMNS, type Field } from "../lib/types";

let counter = 0;
/** A field with an id, so tests can stay declarative about the parts that matter. */
function f(name: string, type: Field["type"], options: Field["options"] = {}): Field {
  return { id: `f${counter++}`, name, type, options };
}

const rows = (fields: Field[], rowCount = 200, extra: Record<string, unknown> = {}) =>
  generateRows({ fields, rowCount, seed: "fixed", ...extra });

describe("weighted choices", () => {
  test("a weighted enum follows its weights", () => {
    const out = rows([f("status", "enum", { values: ["active", "churned"], weights: [9, 1] })], 1000);
    const active = out.filter(row => row.status === "active").length;
    // 900 expected; the band is wide enough that a fair coin could never pass it.
    expect(active).toBeGreaterThan(820);
    expect(active).toBeLessThan(960);
  });

  test("an unweighted enum stays roughly uniform", () => {
    const out = rows([f("status", "enum", { values: ["a", "b"] })], 1000);
    const a = out.filter(row => row.status === "a").length;
    expect(a).toBeGreaterThan(400);
    expect(a).toBeLessThan(600);
  });

  test("weights that are all zero fall back to an even pick rather than failing", () => {
    const out = rows([f("status", "enum", { values: ["a", "b"], weights: [0, 0] })], 20);
    expect(out.every(row => row.status === "a" || row.status === "b")).toBe(true);
  });

  test("built-in pools are weighted, and can be overridden", () => {
    const out = rows([f("status", "httpStatus")], 1000);
    const ok = out.filter(row => row.status === 200).length;
    expect(ok).toBeGreaterThan(550);
    expect(typeof out[0]!.status).toBe("number");

    const custom = rows([f("status", "httpStatus", { values: ["418"] })], 10);
    expect(custom.every(row => row.status === 418)).toBe(true);
  });
});

describe("distributions", () => {
  const percentile = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.floor(values.length * p)]!;

  test("normal centres on the mean", () => {
    const out = rows([f("score", "float", { distribution: "normal", mean: 100, stddev: 15, min: 0, max: 200 })], 2000);
    const values = out.map(row => row.score as number);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    expect(mean).toBeGreaterThan(96);
    expect(mean).toBeLessThan(104);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThanOrEqual(200);
  });

  test("log-normal is right-skewed, with a tail well past the median", () => {
    const out = rows([f("latency", "latencyMs", { distribution: "lognormal", mean: 100, stddev: 1, min: 1 })], 2000);
    const values = out.map(row => row.latency as number);
    const median = percentile(values, 0.5);
    expect(median).toBeGreaterThan(70);
    expect(median).toBeLessThan(140);
    // The point of the shape: p99 is multiples of the median, not a hair above it.
    expect(percentile(values, 0.99)).toBeGreaterThan(median * 4);
  });

  test("pareto puts most rows near the minimum", () => {
    const out = rows([f("qty", "quantity", { distribution: "pareto", min: 1, max: 100, shape: 1.5 })], 2000);
    const values = out.map(row => row.qty as number);
    expect(values.filter(v => v <= 2).length).toBeGreaterThan(1000);
    expect(Math.max(...values)).toBeLessThanOrEqual(100);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(1);
  });

  test("an explicit max caps the tail, and no max leaves it open", () => {
    const capped = rows([f("n", "float", { distribution: "lognormal", mean: 100, stddev: 2, min: 1, max: 150 })], 500);
    expect(Math.max(...capped.map(row => row.n as number))).toBeLessThanOrEqual(150);

    const open = rows([f("n", "float", { distribution: "lognormal", mean: 100, stddev: 2, min: 1 })], 500);
    expect(Math.max(...open.map(row => row.n as number))).toBeGreaterThan(1000);
  });

  test("uniform stays inside its bounds", () => {
    const out = rows([f("n", "integer", { min: 5, max: 9 })], 300);
    expect(out.every(row => (row.n as number) >= 5 && (row.n as number) <= 9)).toBe(true);
  });
});

describe("conditional values", () => {
  test("a field is null on every row where its condition is false", () => {
    const out = rows([
      f("status", "enum", { values: ["active", "cancelled"] }),
      f("cancelled_at", "recentDate", { when: "status == 'cancelled'" }),
    ]);
    for (const row of out) {
      expect(row.cancelled_at === null).toBe(row.status !== "cancelled");
    }
  });

  test("a condition may read a column a bundle spread", () => {
    const out = rows([
      f("customer", "bundle", { bundle: "person" }),
      f("note", "sentence", { when: "customer.email is not null" }),
    ], 20);
    expect(out.every(row => row.note !== null)).toBe(true);
  });

  test("the field a condition reads is generated first, whatever the schema order", () => {
    const out = rows([
      f("cancelled_at", "recentDate", { when: "status == 'cancelled'" }),
      f("status", "enum", { values: ["cancelled"] }),
    ], 20);
    // Were the order not resolved, status would still be null and nothing would match.
    expect(out.every(row => row.cancelled_at !== null)).toBe(true);
  });

  test("a broken condition fails before any row is built", () => {
    expect(() => rows([f("x", "sentence", { when: "nosuchfield == 'a'" })], 5)).toThrow(/nosuchfield/);
    expect(() => rows([f("x", "sentence", { when: "== bad" })], 5)).toThrow(/Condition on "x"/);
  });

  test("a condition cannot reference the field it guards", () => {
    expect(() => rows([f("x", "sentence", { when: "x is null" })], 5)).toThrow(/cannot reference the field itself/);
  });
});

describe("ordered timestamps", () => {
  const at = (value: unknown) => new Date(String(value)).getTime();

  test("`after` keeps a pair of dates the right way round", () => {
    const out = rows([
      f("started_at", "recentDate", { format: "iso" }),
      f("ended_at", "recentDate", { format: "iso", after: "started_at" }),
    ], 300);
    expect(out.every(row => at(row.ended_at) > at(row.started_at))).toBe(true);
  });

  test("`after` works across date formats", () => {
    const out = rows([
      f("started_at", "recentDate", { format: "datetime" }),
      f("ended_at", "recentDate", { format: "datetime", after: "started_at" }),
    ], 100);
    const parse = (value: unknown) => new Date(String(value).replace(" ", "T")).getTime();
    expect(out.every(row => parse(row.ended_at) > parse(row.started_at))).toBe(true);
  });

  test("a sequential timestamp only ever moves forward", () => {
    const out = rows([f("ts", "sequentialDate", { step: 600, jitter: 50, format: "iso" })], 500);
    for (let i = 1; i < out.length; i++) {
      expect(at(out[i]!.ts)).toBeGreaterThan(at(out[i - 1]!.ts));
    }
  });

  test("business hours keeps every timestamp inside Mon-Fri 09:00-17:00", () => {
    const out = rows([f("ts", "sequentialDate", { step: 5400, businessHours: true, format: "iso" })], 200);
    for (const row of out) {
      const date = new Date(String(row.ts));
      expect(date.getDay()).toBeGreaterThan(0);
      expect(date.getDay()).toBeLessThan(6);
      expect(date.getHours()).toBeGreaterThanOrEqual(9);
      expect(date.getHours()).toBeLessThan(17);
    }
  });

  test("a start date anchors the series", () => {
    const out = rows([f("ts", "sequentialDate", { from: "2024-01-01", step: 86_400, format: "date" })], 3);
    expect(out[0]!.ts).toBe("2024-01-01");
    expect(out[1]!.ts).toBe("2024-01-02");
    expect(out[2]!.ts).toBe("2024-01-03");
  });
});

describe("correlated values", () => {
  test("an email built from a name contains that name", () => {
    const out = rows([f("full_name", "fullName"), f("email", "email", { derivesFrom: "full_name" })], 50);
    for (const row of out) {
      const first = String(row.full_name).split(" ")[0]!.toLowerCase();
      expect(String(row.email)).toContain(first.replace(/[^a-z]/g, ""));
    }
  });

  test("a slug built from a title is that title, slugified", () => {
    const out = rows([f("title", "headline"), f("slug", "slug", { derivesFrom: "title" })], 5);
    for (const row of out) {
      expect(row.slug).toBe(
        String(row.title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      );
    }
  });

  test("a person bundle agrees with itself across its columns", () => {
    const out = rows([f("customer", "bundle", { bundle: "person" })], 50);
    // Dots are a path to toHaveProperty, and these column names contain one.
    const columns = Object.keys(out[0]!);
    for (const column of BUNDLE_COLUMNS.person) {
      expect(columns).toContain(`customer.${column}`);
    }
    for (const row of out) {
      const first = String(row["customer.first_name"]).toLowerCase();
      expect(String(row["customer.full_name"]).toLowerCase()).toContain(first);
      expect(String(row["customer.email"])).toContain(first.replace(/[^a-z]/g, ""));
    }
  });

  test("a card bundle's last4 matches its own number", () => {
    const out = rows([f("card", "bundle", { bundle: "card" })], 30);
    for (const row of out) {
      const digits = String(row["card.number"]).replace(/\D/g, "");
      expect(row["card.last4"]).toBe(digits.slice(-4));
      expect(String(row["card.expiry"])).toMatch(/^\d{2}\/\d{2}$/);
    }
  });
});

describe("nested structure", () => {
  test("an object field becomes one flat column per child", () => {
    const out = rows([
      f("address", "object", {
        fields: [f("city", "city"), f("zip", "zipCode")],
      }),
    ], 5);
    expect(Object.keys(out[0]!)).toEqual(["address.city", "address.zip"]);
    expect(out[0]!["address.city"]).toBeTruthy();
  });

  test("an array of objects builds a real object per item", () => {
    const out = rows([
      f("line_items", "array", {
        arrayOf: "object",
        min: 2,
        max: 2,
        fields: [f("sku", "sku"), f("qty", "quantity")],
      }),
    ], 5);
    const items = out[0]!.line_items as Record<string, unknown>[];
    expect(items).toHaveLength(2);
    expect(Object.keys(items[0]!)).toEqual(["sku", "qty"]);
    expect(typeof items[0]!.qty).toBe("number");
  });

  test("objects nest into dot paths all the way down", () => {
    const out = rows([
      f("user", "object", {
        fields: [f("name", "fullName"), f("address", "object", { fields: [f("city", "city")] })],
      }),
    ], 3);
    expect(Object.keys(out[0]!)).toEqual(["user.name", "user.address.city"]);
    expect(typeof out[0]!["user.address.city"]).toBe("string");
  });

  test("a bundle inside an object keeps spreading", () => {
    const out = rows([f("order", "object", { fields: [f("buyer", "bundle", { bundle: "person" })] })], 2);
    expect(Object.keys(out[0]!)).toContain("order.buyer.email");
  });

  test("nesting stops at the depth limit, keeping the levels that fit", () => {
    // Five levels of objects. The deepest is dropped; everything above it still
    // produces its own plain children rather than collapsing to nothing.
    const level5 = f("e", "object", { fields: [f("lost", "word")] });
    const level4 = f("d", "object", { fields: [f("kept", "word"), level5] });
    const out = rows([
      f("a", "object", { fields: [f("b", "object", { fields: [f("c", "object", { fields: [level4] })] })] }),
    ], 2);
    expect(Object.keys(out[0]!)).toEqual(["a.b.c.d.kept"]);
  });

  test("an array item stays a real nested object rather than dot paths", () => {
    const out = rows([
      f("items", "array", {
        arrayOf: "object",
        min: 1,
        max: 1,
        fields: [f("who", "bundle", { bundle: "person" })],
      }),
    ], 2);
    const item = (out[0]!.items as Record<string, unknown>[])[0]!;
    expect(Object.keys(item)).toEqual(["who"]);
    expect(Object.keys(item.who as Record<string, unknown>)).toContain("email");
  });
});

describe("references", () => {
  const pool = { values: ["u1", "u2", "u3"] };

  test("random draws from the pool", () => {
    const out = rows([f("user_id", "reference", { ...pool, refMode: "random" })], 50);
    expect(out.every(row => pool.values.includes(String(row.user_id)))).toBe(true);
  });

  test("cycle walks the pool in order and wraps", () => {
    const out = rows([f("user_id", "reference", { ...pool, refMode: "cycle" })], 7);
    expect(out.map(row => row.user_id)).toEqual(["u1", "u2", "u3", "u1", "u2", "u3", "u1"]);
  });

  test("one-each hands out each value once, then nulls", () => {
    const out = rows([f("user_id", "reference", { ...pool, refMode: "unique" })], 5);
    expect(out.map(row => row.user_id)).toEqual(["u1", "u2", "u3", null, null]);
  });

  test("an unresolved reference is null rather than an error", () => {
    const out = rows([f("user_id", "reference", { refMode: "random" })], 3);
    expect(out.every(row => row.user_id === null)).toBe(true);
  });
});

describe("locales", () => {
  test("a locale changes the names and addresses generated", () => {
    const fields = [f("name", "fullName"), f("city", "city")];
    const english = rows(fields, 5, { locale: "en" });
    const japanese = rows(fields, 5, { locale: "ja" });
    expect(japanese.map(row => row.name)).not.toEqual(english.map(row => row.name));
    // Japanese names are not ASCII, which is the cheapest proof the locale took.
    expect(/^[\x20-\x7E]+$/.test(String(japanese[0]!.name))).toBe(false);
  });

  test("an unknown locale falls back to the default instead of failing", () => {
    const out = rows([f("name", "fullName")], 3, { locale: "not_a_locale" });
    expect(out.every(row => typeof row.name === "string" && row.name.length > 0)).toBe(true);
  });
});

describe("identifiers with check digits", () => {
  const luhnValid = (digits: string) => {
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = Number(digits[i]);
      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      double = !double;
    }
    return sum % 10 === 0;
  };

  const gtinValid = (digits: string) => {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += Number(digits[i]) * ((digits.length - i) % 2 === 0 ? 3 : 1);
    }
    return sum % 10 === 0;
  };

  test("IMEIs pass Luhn", () => {
    const out = rows([f("imei", "imei")], 50);
    for (const row of out) {
      expect(String(row.imei)).toHaveLength(15);
      expect(luhnValid(String(row.imei))).toBe(true);
    }
  });

  test("UPC-A and EAN-13 carry a valid check digit", () => {
    const out = rows([f("upc", "upc"), f("ean", "ean")], 50);
    for (const row of out) {
      expect(String(row.upc)).toHaveLength(12);
      expect(gtinValid(String(row.upc))).toBe(true);
      expect(String(row.ean)).toHaveLength(13);
      expect(gtinValid(String(row.ean))).toBe(true);
    }
  });

  test("an ISIN is two letters, nine characters and a Luhn digit", () => {
    const out = rows([f("isin", "isin")], 30);
    for (const row of out) {
      const isin = String(row.isin);
      expect(isin).toMatch(/^[A-Z]{2}[A-Z0-9]{9}\d$/);
      const expanded = [...isin].map(c => (/[0-9]/.test(c) ? c : String(c.charCodeAt(0) - 55))).join("");
      expect(luhnValid(expanded)).toBe(true);
    }
  });

  test("an SSN only ever uses the permanently unassigned 900-999 range", () => {
    const out = rows([f("ssn", "ssn")], 100);
    for (const row of out) {
      expect(String(row.ssn)).toMatch(/^9\d{2}-\d{2}-\d{4}$/);
    }
  });
});

describe("edge-case strings", () => {
  test("draws from the pool the variant names", () => {
    const out = rows([f("input", "edgeCase", { variant: "injection" })], 40);
    const values = new Set(out.map(row => String(row.input)));
    expect(values.size).toBeGreaterThan(3);
    expect([...values].some(v => v.includes("'") || v.includes("<") || v.includes(".."))).toBe(true);
  });

  test("a custom list overrides the built-in pool", () => {
    const out = rows([f("input", "edgeCase", { values: ["only-this"] })], 10);
    expect(out.every(row => row.input === "only-this")).toBe(true);
  });
});

describe("SQL export", () => {
  test("writes one INSERT with quoted identifiers and escaped literals", () => {
    const sql = toSql([{ id: 1, name: "O'Brien", active: true, note: null }], "My Table");
    expect(sql).toContain('INSERT INTO "my_table" ("id", "name", "active", "note") VALUES');
    expect(sql).toContain("(1, 'O''Brien', TRUE, NULL)");
  });

  test("objects and arrays are stored as JSON text", () => {
    const sql = toSql([{ tags: ["a", "b"], meta: { k: 1 } }], "t");
    expect(sql).toContain(`'["a","b"]'`);
    expect(sql).toContain(`'{"k":1}'`);
  });

  test("dot-path columns keep their names", () => {
    const sql = toSql([{ "address.city": "Austin" }], "t");
    expect(sql).toContain('"address.city"');
  });

  test("batches long runs into several statements", () => {
    const many = Array.from({ length: 1200 }, (_v, i) => ({ id: i }));
    expect(toSql(many, "t").match(/INSERT INTO/g)).toHaveLength(3);
  });

  test("turns a name into a usable table identifier", () => {
    expect(sqlTableName("Employee records")).toBe("employee_records");
    expect(sqlTableName("2024 orders")).toBe("t_2024_orders");
    expect(sqlTableName("!!!")).toBe("t_dummy_data");
  });

  test("an empty result is an empty file, not a broken statement", () => {
    expect(toSql([], "t")).toBe("");
  });
});

describe("scope inside a nested record", () => {
  test("a child may be built from a sibling in the same item", () => {
    const out = rows([
      f("people", "array", {
        arrayOf: "object",
        min: 1,
        max: 1,
        fields: [f("name", "fullName"), f("email", "email", { derivesFrom: "name" })],
      }),
    ], 20);
    for (const row of out) {
      const item = (row.people as Record<string, unknown>[])[0]!;
      const first = String(item.name).split(" ")[0]!.toLowerCase().replace(/[^a-z]/g, "");
      expect(String(item.email)).toContain(first);
    }
  });

  test("a child may also be built from a column of the row around it", () => {
    const out = rows([
      f("owner", "fullName"),
      f("meta", "object", { fields: [f("owner_email", "email", { derivesFrom: "owner" })] }),
    ], 20);
    for (const row of out) {
      const first = String(row.owner).split(" ")[0]!.toLowerCase().replace(/[^a-z]/g, "");
      expect(String(row["meta.owner_email"])).toContain(first);
    }
  });
});
