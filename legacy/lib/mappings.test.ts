import { describe, expect, test } from "bun:test";
import {
  danglingMappings,
  describeMapping,
  mappableFields,
  MAPPING_LIMITS,
  newMapping,
  parseMappings,
} from "./mappings";
import type { Field, FieldMapping } from "./types";

/** The parsed mappings, or the error text, so a test reads in one line. */
const parsed = (raw: unknown) => {
  const result = parseMappings(raw);
  return result.ok ? result.mappings : result.error;
};

const mapping = (over: Partial<FieldMapping> = {}): FieldMapping => ({
  id: "m1",
  field: "customer_id",
  fromConfig: "cfg_customers",
  fromField: "id",
  mode: "random",
  ...over,
});

describe("parseMappings", () => {
  test("reads a well-formed mapping through unchanged", () => {
    expect(parsed([mapping()])).toEqual([{ ...mapping(), fromConfigName: undefined }]);
  });

  test("none at all is not an error — most configurations have none", () => {
    expect(parsed(undefined)).toEqual([]);
    expect(parsed(null)).toEqual([]);
    expect(parsed([])).toEqual([]);
  });

  test("something that is not a list is refused", () => {
    expect(parsed({ field: "a" })).toContain("must be an array");
    expect(parsed("customer_id")).toContain("must be an array");
  });

  test("an entry that is not an object is refused by position", () => {
    expect(parsed([mapping(), "nope"])).toContain("Mapping 2");
  });

  test("names are trimmed, so a stray space cannot break the link", () => {
    expect(parsed([mapping({ field: "  customer_id  ", fromField: " id " })])).toMatchObject([
      { field: "customer_id", fromField: "id" },
    ]);
  });

  test("an unknown draw mode falls back to random rather than failing", () => {
    expect(parsed([mapping({ mode: "sideways" as FieldMapping["mode"] })])).toMatchObject([{ mode: "random" }]);
    expect(parsed([mapping({ mode: "cycle" })])).toMatchObject([{ mode: "cycle" }]);
  });

  test("a missing id is minted, so the editor always has a stable key", () => {
    const result = parsed([{ field: "a", fromConfig: "cfg_1", fromField: "id" }]);
    expect(Array.isArray(result) && result[0]!.id).toBeTruthy();
  });

  test("two mappings onto one field are refused — which won would be arbitrary", () => {
    const twice = [mapping({ id: "m1" }), mapping({ id: "m2", fromField: "email" })];
    expect(parsed(twice)).toContain("mapped twice");
  });

  test("a half-filled row is kept: it is someone mid-edit, not a broken file", () => {
    expect(parsed([{ field: "customer_id" }])).toMatchObject([
      { field: "customer_id", fromConfig: "", fromField: "" },
    ]);
  });

  test("two half-filled rows do not collide on the empty field name", () => {
    expect(parsed([{}, {}])).toHaveLength(2);
  });

  test("past the per-configuration limit, the count is named", () => {
    const many = Array.from({ length: MAPPING_LIMITS.perConfig + 1 }, (_, i) => mapping({ id: `m${i}`, field: `f${i}` }));
    expect(parsed(many)).toContain(String(MAPPING_LIMITS.perConfig));
  });
});

describe("danglingMappings", () => {
  const fields: Field[] = [
    { id: "1", name: "customer_id", type: "uuid" },
    { id: "2", name: "total", type: "price" },
  ];

  test("finds a mapping whose field has been renamed away", () => {
    expect(danglingMappings([mapping({ field: "buyer_id" })], fields).map(m => m.field)).toEqual(["buyer_id"]);
  });

  test("a mapping onto a field that is there is not dangling", () => {
    expect(danglingMappings([mapping()], fields)).toEqual([]);
  });

  test("a half-filled row cannot dangle — it points nowhere yet", () => {
    expect(danglingMappings([{ ...newMapping(), field: "buyer_id" }], fields)).toEqual([]);
  });
});

describe("describeMapping", () => {
  test("reads as the sentence the panel draws", () => {
    expect(describeMapping(mapping(), "Customers")).toBe("customer_id ← Customers.id");
  });

  test("falls back to the name carried in the mapping, then to the id", () => {
    expect(describeMapping(mapping({ fromConfigName: "Customers" }))).toBe("customer_id ← Customers.id");
    expect(describeMapping(mapping())).toBe("customer_id ← cfg_customers.id");
  });
});

describe("mappableFields", () => {
  test("offers the schema's own fields", () => {
    expect(
      mappableFields([
        { id: "1", name: "customer_id", type: "uuid" },
        { id: "2", name: "total", type: "price" },
      ]),
    ).toEqual(["customer_id", "total"]);
  });

  test("leaves out a bundle: its columns come from one draw, not six", () => {
    const fields: Field[] = [
      { id: "1", name: "who", type: "bundle", options: { bundle: "person" } },
      { id: "2", name: "plan", type: "enum", options: { values: ["free"] } },
    ];
    expect(mappableFields(fields)).toEqual(["plan"]);
  });

  test("leaves out an object field and an array of objects", () => {
    const fields: Field[] = [
      { id: "1", name: "address", type: "object", options: { fields: [] } },
      { id: "2", name: "lines", type: "array", options: { arrayOf: "object", fields: [] } },
      { id: "3", name: "tags", type: "array", options: { arrayOf: "word" } },
    ];
    expect(mappableFields(fields)).toEqual(["tags"]);
  });

  test("a field with no name yet is not offered", () => {
    expect(mappableFields([{ id: "1", name: "", type: "uuid" }])).toEqual([]);
  });
});
