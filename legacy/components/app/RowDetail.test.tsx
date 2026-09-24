import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { RowDetail } from "./RowDetail";
import type { Row } from "@/lib/rows";

const rows: Row[] = [
  {
    id: 1,
    "customer.email": "ada@example.com",
    active: true,
    note: null,
    blank: "",
    summary: "A sentence.\nAnd another line of it.",
    items: [{ sku: "A-1", qty: 2 }],
  },
  { id: 2, "customer.email": "bob@example.com", active: false, note: "second", blank: "x", summary: "s", items: [] },
];

function render(index: number, truncated = false) {
  return renderToString(
    <RowDetail
      rows={rows}
      index={index}
      datasetName="Orders"
      truncated={truncated}
      onNavigate={() => {}}
      onClose={() => {}}
    />,
  ).replaceAll("<!-- -->", "");
}

describe("RowDetail", () => {
  test("shows every column of the record, by its own name", () => {
    const html = render(0);
    for (const column of Object.keys(rows[0]!)) {
      expect(html).toContain(column);
    }
    expect(html).toContain("ada@example.com");
  });

  test("says which record it is, and of how many", () => {
    expect(render(0)).toContain("Record 1");
    expect(render(1)).toContain("of 2");
  });

  test("tells null apart from an empty string", () => {
    const html = render(0);
    expect(html).toContain("null");
    expect(html).toContain("empty string");
  });

  test("renders a nested value as pretty JSON rather than one compact line", () => {
    const html = render(0);
    expect(html).toContain("&quot;sku&quot;: &quot;A-1&quot;");
  });

  test("keeps the line breaks in a multi-line value", () => {
    expect(render(0)).toContain("whitespace-pre-wrap");
  });

  test("offers a copy control for the record and for each field", () => {
    const html = render(0);
    expect(html).toContain("Copy JSON");
    expect(html).toContain('aria-label="Copy customer.email"');
  });

  test("the first record cannot go back and the last cannot go on", () => {
    // The button's classes mention `disabled:` too, so this looks for the
    // attribute itself rather than the word anywhere in the tag.
    const isDisabled = (html: string, label: string) => {
      const tag = html.match(new RegExp(`<button[^>]*aria-label="${label} record"[^>]*>`))?.[0] ?? "";
      return / disabled(=""|>| )/.test(tag);
    };

    expect(isDisabled(render(0), "Previous")).toBe(true);
    expect(isDisabled(render(0), "Next")).toBe(false);
    expect(isDisabled(render(1), "Previous")).toBe(false);
    expect(isDisabled(render(1), "Next")).toBe(true);
  });

  test("says so when the preview is only part of the dataset", () => {
    expect(render(0, true)).toContain("preview");
    expect(render(0, false)).not.toContain("preview");
  });

  test("is a labelled modal dialog", () => {
    const html = render(0);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Record 1 of 2"');
  });

  test("an index with no record renders nothing rather than throwing", () => {
    expect(render(99)).toBe("");
  });
});
