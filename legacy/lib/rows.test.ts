import { describe, expect, test } from "bun:test";
import { rowToJson, unflatten, valueToText } from "./rows";

describe("unflatten", () => {
  test("turns dot paths into nested objects", () => {
    expect(unflatten({ "address.city": "Austin", "address.zip": "78701", id: 1 })).toEqual({
      address: { city: "Austin", zip: "78701" },
      id: 1,
    });
  });

  test("nests as deep as the path goes", () => {
    expect(unflatten({ "a.b.c.d": 1 })).toEqual({ a: { b: { c: { d: 1 } } } });
  });

  test("leaves arrays and plain values alone", () => {
    const row = { items: [{ sku: "A" }], count: 2, note: null };
    expect(unflatten(row)).toEqual(row);
  });

  test("a scalar already at a path gives way to the object that needs it", () => {
    // "a" then "a.b" can only both exist if the scalar is replaced.
    expect(unflatten({ a: 1, "a.b": 2 })).toEqual({ a: { b: 2 } });
  });
});

describe("rowToJson", () => {
  test("is the pretty-printed, nested record", () => {
    expect(rowToJson({ "customer.email": "a@b.com", id: 1 })).toBe(
      '{\n  "customer": {\n    "email": "a@b.com"\n  },\n  "id": 1\n}',
    );
  });
});

describe("valueToText", () => {
  test("blanks null and undefined, encodes objects, stringifies the rest", () => {
    expect(valueToText(null)).toBe("");
    expect(valueToText(undefined)).toBe("");
    expect(valueToText({ a: 1 })).toBe('{"a":1}');
    expect(valueToText([1, 2])).toBe("[1,2]");
    expect(valueToText(42)).toBe("42");
    expect(valueToText(false)).toBe("false");
    expect(valueToText("text")).toBe("text");
  });
});
