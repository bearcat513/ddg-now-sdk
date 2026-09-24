import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { NoteView } from "./NoteView";
import { referenceKey, type ResolvedField, type ResolvedReference } from "@/lib/notes";

/**
 * What a note looks like once it is read.
 *
 * Rendered to a string rather than driven in a DOM: everything worth checking
 * here is what ends up on the page — that a reference shows the record's
 * current name, that one which did not resolve still says so, and that no
 * amount of angle brackets in somebody's note reaches the page as markup.
 */

const reference = (over: Partial<ResolvedReference> = {}): ResolvedReference => ({
  id: "cfg_1a2b",
  kind: "config",
  label: "Orders",
  detail: "7 fields",
  found: true,
  ...over,
});

const render = (source: string, table: Record<string, ResolvedReference> = {}) =>
  renderToString(<NoteView source={source} resolve={(id, field) => table[referenceKey({ id, field })]} />)
    .replaceAll("<!-- -->", "");

/** A reference that also carries a resolved field. */
const withField = (field: ResolvedField, over: Partial<ResolvedReference> = {}): ResolvedReference => ({
  ...reference(over),
  field,
});

const table = (over: Partial<Extract<ResolvedField, { shape: "table" }>> = {}): ResolvedField => ({
  path: "rows",
  shape: "table",
  columns: ["email", "qty"],
  rows: [
    ["ada@example.com", "2"],
    ["bo@example.com", "5"],
  ],
  total: 2,
  truncated: false,
  hiddenColumns: 0,
  ...over,
});

describe("references", () => {
  test("show the record's current name, not the id that was stored", () => {
    const html = render("Regenerate [[cfg_1a2b]] first.", { cfg_1a2b: reference() });
    expect(html).toContain("Orders");
    expect(html).not.toContain("[[cfg_1a2b]]");
    // The id and what it is stay reachable, for anyone who needs them.
    expect(html).toContain("Configuration · 7 fields · cfg_1a2b");
  });

  test("one that did not resolve is marked rather than dropped", () => {
    const html = render("See [[ds_gone]].", { ds_gone: reference({ id: "ds_gone", label: "ds_gone", found: false }) });
    expect(html).toContain("ds_gone");
    expect(html).toContain("chip-ref-missing");
    // The sentence around it survives either way.
    expect(html).toContain("See ");
  });

  test("an id naming no collection is broken at once, not left spinning", () => {
    // Nothing will ever resolve it — the server drops it before it reads —
    // so waiting on an answer would spin for as long as the note is open.
    const html = render("See [[user_1a2b]].");
    expect(html).toContain("chip-ref-missing");
    expect(html).not.toContain("animate-pulse");
  });

  test("one nothing has answered for yet holds its place", () => {
    const html = render("See [[cfg_pending]].");
    expect(html).toContain("animate-pulse");
  });

  test("is a button only when it resolved — there is nothing to open otherwise", () => {
    const table: Record<string, ResolvedReference> = { cfg_1a2b: reference() };
    const opens = renderToString(<NoteView source="[[cfg_1a2b]]" resolve={id => table[id]} onOpen={() => {}} />);
    expect(opens).toContain("<button");
    // No handler to open it with, so it is text with a tint.
    expect(render("[[cfg_1a2b]]", table)).not.toContain("<button");
  });
});

describe("a reference that names a field", () => {
  test("renders an array as a table of it", () => {
    const html = render("[[ds_9f8e#rows]]", { "ds_9f8e#rows": withField(table(), { id: "ds_9f8e", kind: "dataset" }) });
    expect(html).toContain("<table");
    expect(html).toContain(">email<");
    expect(html).toContain("ada@example.com");
    // Captioned with where it came from and how much of it this is.
    expect(html).toContain("rows");
    expect(html).toContain("2 rows");
  });

  test("says how much of a long array it is showing", () => {
    const html = render("[[ds_9f8e#rows]]", {
      "ds_9f8e#rows": withField(table({ total: 12_000, truncated: true, hiddenColumns: 3 })),
    });
    expect(html).toContain("2 of 12,000");
    expect(html).toContain("3 more columns not shown");
  });

  test("an empty array says so rather than drawing a headerless table", () => {
    const html = render("[[cfg_1a2b#mappings]]", {
      "cfg_1a2b#mappings": withField(table({ path: "mappings", columns: [], rows: [], total: 0 })),
    });
    expect(html).not.toContain("<table");
    expect(html).toContain("Nothing here yet");
  });

  test("a single value reads inline, as part of the sentence", () => {
    const html = render("It generates [[cfg_1a2b#rowCount]] rows.", {
      "cfg_1a2b#rowCount": withField({ path: "rowCount", shape: "value", value: "25" }),
    });
    expect(html).not.toContain("<table");
    expect(html).toContain("chip-ref-value");
    expect(html).toContain(">25<");
  });

  test("a long text field gets a block of its own", () => {
    const html = render("[[tpl_1#body]]", {
      "tpl_1#body": withField({ path: "body", shape: "text", value: "const rows = [];\nrows.forEach(x);" }),
    });
    expect(html).toContain("<pre");
    expect(html).toContain("rows.forEach(x);");
  });

  test("a table splits the paragraph it was written into, keeping the prose", () => {
    const html = render("Before [[ds_9f8e#rows]] after.", { "ds_9f8e#rows": withField(table()) });
    expect(html).toContain("Before");
    expect(html).toContain("after.");
    // A <table> inside a <p> is not valid HTML and React would warn; the
    // paragraph is split around it instead.
    expect(html.indexOf("<table")).toBeGreaterThan(html.indexOf("Before"));
    expect(html.indexOf("after.")).toBeGreaterThan(html.indexOf("</table>"));
  });

  test("inside a list item it stays a chip, since a table cannot live there", () => {
    const html = render("- check [[ds_9f8e#rows]]", { "ds_9f8e#rows": withField(table({ total: 500 })) });
    expect(html).toContain("<li");
    expect(html).not.toContain("<table");
    // The chip still says how much it stands for.
    expect(html).toContain("500");
  });

  test("a field the record does not have is marked, not invented", () => {
    const html = render("[[cfg_1a2b#nope]]", {
      "cfg_1a2b#nope": withField({ path: "nope", shape: "missing" }),
    });
    expect(html).toContain("chip-ref-missing");
    expect(html).toContain('has no field &quot;nope&quot;');
  });
});

describe("the rest of the Markdown", () => {
  test("renders headings, lists, quotes and fenced code", () => {
    const html = render(["## Plan", "", "1. first", "2. second", "", "> borrowed", "", "```ts", "const x = 1;", "```"].join("\n"));
    expect(html).toContain("<h3");
    expect(html).toContain("<ol");
    expect(html).toContain("<blockquote");
    expect(html).toContain("<pre");
    expect(html).toContain("const x = 1;");
  });

  test("a note cannot put markup into the page, however it is written", () => {
    const html = render("<script>alert(1)</script> and <img onerror=x>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("says the preview is empty rather than rendering nothing at all", () => {
    expect(render("   ")).toContain("Nothing written yet");
  });
});
