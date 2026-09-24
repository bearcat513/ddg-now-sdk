import { describe, expect, test } from "bun:test";
import { fromPairs, METADATA_LIMITS, parseMetadata, readMetadata, sameMetadata, toPairs } from "./metadata";

/** The result's metadata, or the error text, so a test reads in one line. */
const parsed = (raw: unknown) => {
  const result = parseMetadata(raw);
  return result.ok ? result.metadata : result.error;
};

describe("parseMetadata", () => {
  test("takes an object of strings, and trims the keys", () => {
    expect(parsed({ team: "billing", " ticket ": "DDG-412" })).toEqual({ team: "billing", ticket: "DDG-412" });
  });

  test("none at all is not an error — most callers know nothing about metadata", () => {
    expect(parsed(undefined)).toEqual({});
    expect(parsed(null)).toEqual({});
    expect(parsed({})).toEqual({});
  });

  test("a number or a boolean is read as the text it was meant to be", () => {
    expect(parsed({ rows: 500, live: true })).toEqual({ rows: "500", live: "true" });
  });

  test("a value that is not text at all is refused by name", () => {
    expect(parsed({ owners: ["ada"] })).toContain('"owners"');
    expect(parsed({ nested: { a: 1 } })).toContain('"nested"');
  });

  test("an array or a string is not a set of pairs", () => {
    expect(parsed([{ key: "a" }])).toContain("key/value pairs");
    expect(parsed("team=billing")).toContain("key/value pairs");
  });

  test("a blank key has nothing to store under", () => {
    expect(parsed({ "   ": "billing" })).toContain("blank");
  });

  test("the limits are refused with the number that broke them", () => {
    const many = Object.fromEntries(Array.from({ length: METADATA_LIMITS.pairs + 1 }, (_, i) => [`k${i}`, "v"]));
    expect(parsed(many)).toContain(String(METADATA_LIMITS.pairs + 1));
    expect(parsed({ ["k".repeat(METADATA_LIMITS.key + 1)]: "v" })).toContain(String(METADATA_LIMITS.key));
    expect(parsed({ k: "v".repeat(METADATA_LIMITS.value + 1) })).toContain(String(METADATA_LIMITS.value));
  });
});

describe("readMetadata", () => {
  test("reads back what was stored, and shrugs at anything else", () => {
    expect(readMetadata({ team: "billing" })).toEqual({ team: "billing" });
    // A configuration saved before metadata existed, and a row that somehow
    // holds something else: neither should fail the request it arrived in.
    expect(readMetadata(undefined)).toEqual({});
    expect(readMetadata("nonsense")).toEqual({});
  });
});

describe("editor rows", () => {
  test("round-trip through the editor keeps every pair", () => {
    const metadata = { team: "billing", ticket: "DDG-412" };
    expect(fromPairs(toPairs(metadata))).toEqual(metadata);
    // Rows follow the object as given; what comes back from storage is
    // key-sorted, which is the store's doing rather than this module's.
    expect(toPairs(metadata).map(pair => pair.key)).toEqual(["team", "ticket"]);
  });

  test("a row still being typed is kept on screen and dropped on the way out", () => {
    expect(fromPairs([{ key: "", value: "typing" }, { key: "team", value: "billing" }])).toEqual({ team: "billing" });
    expect(fromPairs([{ key: "  team  ", value: "billing" }])).toEqual({ team: "billing" });
  });

  test("a repeated key keeps the last, as an object literal would", () => {
    expect(fromPairs([{ key: "team", value: "a" }, { key: "team", value: "b" }])).toEqual({ team: "b" });
  });

  test("an empty set survives the trip", () => {
    expect(toPairs(undefined)).toEqual([]);
    expect(fromPairs([])).toEqual({});
  });
});

test("sameMetadata compares pairs, not key order", () => {
  expect(sameMetadata({ a: "1", b: "2" }, { b: "2", a: "1" })).toBe(true);
  expect(sameMetadata({ a: "1" }, { a: "2" })).toBe(false);
  expect(sameMetadata({ a: "1" }, { a: "1", b: "2" })).toBe(false);
});
