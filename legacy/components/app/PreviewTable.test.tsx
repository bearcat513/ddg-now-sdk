import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { PreviewTable } from "./PreviewTable";
import type { Dataset } from "@/lib/types";
import type { ScriptTemplate } from "@/lib/scriptTemplate";

const templates: ScriptTemplate[] = [
  {
    id: "tpl_1",
    name: "Seed incidents",
    body: "const rows = ${GENERATED_DATASET};",
    ownerId: "u1",
    sharedWith: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

const dataset: Dataset = {
  id: "ds_1",
  configId: null,
  name: "Orders",
  rowCount: 500,
  fieldCount: 3,
  ownerId: "u1",
  createdAt: "2026-01-01T00:00:00Z",
};

const rows = [
  { id: 1, "customer.email": "ada@example.com", total: 9.99 },
  { id: 2, "customer.email": "bob@example.com", total: 20 },
];

function render(over: Partial<Parameters<typeof PreviewTable>[0]> = {}) {
  return renderToString(
    <PreviewTable
      dataset={dataset}
      rows={rows}
      truncated
      templates={[]}
      preferredFormat="csv"
      preferredTemplateId=""
      {...over}
    />,
  ).replaceAll("<!-- -->", "");
}

describe("PreviewTable", () => {
  test("every row is focusable and labelled as a way into the record", () => {
    const html = render();
    expect(html.match(/<tr[^>]*tabindex="0"/gi)).toHaveLength(rows.length);
    expect(html).toContain('aria-label="Open record 1"');
    expect(html).toContain('aria-label="Open record 2"');
  });

  test("the header says the rows can be clicked", () => {
    expect(render()).toContain("click a row");
  });

  test("it still says where the data went and how much of it is shown", () => {
    const html = render();
    expect(html).toContain("saved to PocketBase");
    expect(html).toContain("showing first 2");
  });

  test("the inspector is closed until a row is chosen", () => {
    expect(render()).not.toContain('role="dialog"');
  });

  test("the toolbar can wrap, so a narrow pane cannot push it off the edge", () => {
    // With a template present every group in the toolbar is on screen.
    const html = render({ templates });
    // Each group wraps within itself; without this a group is one unbreakable
    // item that overflows a pane narrower than it is.
    const wrapping = html.match(/class="[^"]*flex-wrap[^"]*"/g) ?? [];
    expect(wrapping.length).toBeGreaterThanOrEqual(4);
  });

  test("the header sizes its controls against the pane, not the window", () => {
    // The container-query context the compact labels below are measured from.
    expect(render()).toContain("@container");
  });

  test("the format labels can drop away while the controls stay named", () => {
    const html = render({ templates });
    // Labels are gated on the container width...
    expect(html).toContain("@lg:inline");
    // ...so the tooltip and the copy button's aria-label carry the meaning
    // when a narrow pane hides the text.
    expect(html).toContain("Download all rows as CSV");
    expect(html).toContain('aria-label="Copy CSV to clipboard"');
    expect(html).toContain('aria-label="Copy SQL to clipboard"');
    expect(html).toContain('aria-label="Copy the rendered script to clipboard"');
  });

  test("every format is still a real download link", () => {
    const html = render();
    for (const format of ["csv", "json", "sql"]) {
      expect(html).toContain(`/api/datasets/ds_1/export?format=${format}`);
    }
  });

  test("an empty dataset says so instead of rendering a table", () => {
    const html = render({ dataset: null, rows: [] });
    expect(html).toContain("No data yet");
    expect(html).not.toContain("<table");
  });

  test("the pane can be folded away, with data and without", () => {
    expect(render({ onCollapse: () => {} })).toContain('aria-label="Hide the data pane"');
    // The way out has to be in the empty pane too, or a pane opened by hand
    // before anything was generated cannot be put back.
    expect(render({ dataset: null, rows: [], onCollapse: () => {} })).toContain('aria-label="Hide the data pane"');
  });

  test("without a way to fold it, no control pretends there is one", () => {
    expect(render()).not.toContain("Hide the data pane");
  });
});
