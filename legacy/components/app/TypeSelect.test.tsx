import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { filterFieldTypes, TypeSelect } from "./TypeSelect";
import { FIELD_TYPES, fieldTypeLabel, type FieldType } from "@/lib/types";

/**
 * The popover's list only exists once it is opened, which server rendering
 * cannot do — so these cover the trigger, and the filtering logic is exercised
 * directly below through the same predicate the component uses.
 */
function render(value: FieldType, exclude: FieldType[] = []) {
  return renderToString(<TypeSelect value={value} onChange={() => {}} exclude={exclude} />).replaceAll("<!-- -->", "");
}

describe("TypeSelect", () => {
  test("shows the label of the type currently chosen", () => {
    expect(render("latencyMs")).toContain(fieldTypeLabel("latencyMs"));
    expect(render("fullName")).toContain("Full name");
  });

  test("is a labelled combobox, closed to begin with", () => {
    const html = render("uuid");
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Field type"');
  });
});

describe("filtering the type list", () => {
  const filter = (query: string) => filterFieldTypes(FIELD_TYPES, query).map(meta => meta.type);

  test("an empty query keeps every type", () => {
    expect(filterFieldTypes(FIELD_TYPES, "")).toHaveLength(FIELD_TYPES.length);
    expect(filterFieldTypes(FIELD_TYPES, "   ")).toHaveLength(FIELD_TYPES.length);
  });

  test("matches the label someone can actually see", () => {
    expect(filter("latency")).toEqual(["latencyMs"]);
    expect(filter("full name")).toContain("fullName");
  });

  test("matches the type name from config files and template tokens", () => {
    expect(filter("firstName")).toContain("firstName");
    expect(filter("nowQuery")).toContain("nowQuery");
  });

  test("matches a group, so a whole domain can be browsed", () => {
    const observability = filter("observability");
    expect(observability).toContain("traceId");
    expect(observability).toContain("httpStatus");
    expect(observability.length).toBe(FIELD_TYPES.filter(t => t.group === "Observability").length);
  });

  test("ignores case", () => {
    expect(filter("TRACE ID")).toEqual(filter("trace id"));
    expect(filter("Trace")).toContain("traceId");
  });

  test("every word has to match, in any order", () => {
    expect(filter("date sequential")).toEqual(filter("sequential date"));
    expect(filter("date sequential")).toContain("sequentialDate");
    // The second word narrows rather than widens.
    expect(filter("card").length).toBeGreaterThan(filter("card brand").length);
  });

  test("a query nothing matches comes back empty rather than unfiltered", () => {
    expect(filter("zzzznope")).toEqual([]);
  });

  test("keeps the catalogue's own order, so groups stay together", () => {
    const filtered = filterFieldTypes(FIELD_TYPES, "e");
    const positions = filtered.map(meta => FIELD_TYPES.indexOf(meta));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test("respects a list already narrowed by the caller", () => {
    const withoutObjects = FIELD_TYPES.filter(meta => meta.type !== "object");
    expect(filterFieldTypes(withoutObjects, "object").map(m => m.type)).not.toContain("object");
  });
});
