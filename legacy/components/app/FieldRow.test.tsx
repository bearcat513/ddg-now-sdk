import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { FieldRow } from "./FieldRow";
import { defaultFieldOptions, FIELD_TYPES, type Dataset, type Field } from "@/lib/types";

/**
 * A render pass over every field type. The editors are mostly conditional
 * markup driven by each type's option list, which is exactly the kind of thing
 * that breaks silently for one type out of two hundred.
 */

const siblings: Field[] = [
  { id: "s1", name: "full_name", type: "fullName" },
  { id: "s2", name: "status", type: "enum", options: { values: ["a", "b"] } },
  { id: "s3", name: "started_at", type: "recentDate" },
  { id: "s4", name: "customer", type: "bundle", options: { bundle: "person" } },
];

const datasets: Dataset[] = [
  { id: "ds1", configId: null, name: "Users", rowCount: 10, fieldCount: 2, ownerId: "o", createdAt: "" },
];

/**
 * Server-rendered markup, with React's text-boundary comments removed so an
 * assertion can match the string a reader would actually see.
 */
function render(field: Field, allFields: Field[] = [...siblings, field], depth = 0) {
  return renderToString(
    <FieldRow
      field={field}
      allFields={allFields}
      datasets={datasets}
      depth={depth}
      expanded
      onToggle={() => {}}
      onChange={() => {}}
      onRemove={() => {}}
      onMove={() => {}}
    />,
  ).replaceAll("<!-- -->", "");
}

describe("FieldRow", () => {
  test("every field type's expanded editor renders", () => {
    const failures: string[] = [];
    for (const meta of FIELD_TYPES) {
      const field: Field = { id: "x", name: "field", type: meta.type, options: defaultFieldOptions(meta.type) };
      try {
        expect(render(field).length).toBeGreaterThan(0);
      } catch (error) {
        failures.push(`${meta.type}: ${(error as Error).message}`);
      }
    }
    expect(failures).toEqual([]);
  });

  test("an object field renders its children, recursively", () => {
    const field: Field = {
      id: "o",
      name: "address",
      type: "object",
      options: {
        fields: [
          { id: "c1", name: "city", type: "city" },
          { id: "c2", name: "inner", type: "object", options: { fields: [{ id: "c3", name: "deep", type: "word" }] } },
        ],
      },
    };
    const html = render(field, [field]);
    expect(html).toContain("city");
    expect(html).toContain("inner");
  });

  test("a bundle names the columns it will occupy", () => {
    const html = render({ id: "b", name: "customer", type: "bundle", options: { bundle: "card" } });
    expect(html).toContain("customer.last4");
  });

  test("weights are shown as the percentages they work out to", () => {
    const html = render({
      id: "e",
      name: "status",
      type: "enum",
      options: { values: ["active", "churned"], weights: [9, 1] },
    });
    expect(html).toContain("90%");
    expect(html).toContain("10%");
  });

  test("a broken condition is reported in the editor", () => {
    const html = render({ id: "w", name: "note", type: "sentence", options: { when: "ghost == 1" } });
    expect(html).toContain("ghost");
  });

  test("a nested child is not offered the options that only apply to a row", () => {
    const child: Field = { id: "c", name: "city", type: "city" };
    expect(render(child, [child], 1)).not.toContain("Only when");
    expect(render(child, [child], 0)).toContain("Only when");
  });
});
