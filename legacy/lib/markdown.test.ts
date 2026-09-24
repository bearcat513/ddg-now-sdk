import { describe, expect, test } from "bun:test";
import { inlineSpans, parseMarkdown } from "./markdown";

describe("inline marks", () => {
  test("reads code, bold and links, and leaves the text between them alone", () => {
    expect(inlineSpans("Send `X-API-Key: pk_…` on **every** call")).toEqual([
      { kind: "text", text: "Send " },
      { kind: "code", text: "X-API-Key: pk_…" },
      { kind: "text", text: " on " },
      { kind: "strong", text: "every" },
      { kind: "text", text: " call" },
    ]);

    expect(inlineSpans("see [the spec](/api/openapi.json)")).toEqual([
      { kind: "text", text: "see " },
      { kind: "link", text: "the spec", href: "/api/openapi.json" },
    ]);
  });

  test("leaves a stray mark as text rather than eating the rest of the line", () => {
    expect(inlineSpans("a * b ** c ` d")).toEqual([{ kind: "text", text: "a * b ** c ` d" }]);
  });

  test("reads a [[reference]] as an id, and leaves a link alone", () => {
    expect(inlineSpans("Regenerate [[cfg_1a2b]] first")).toEqual([
      { kind: "text", text: "Regenerate " },
      { kind: "reference", id: "cfg_1a2b", field: "" },
      { kind: "text", text: " first" },
    ]);

    // Both open with a bracket; only one of them is a reference.
    expect(inlineSpans("[the spec](/api)")).toEqual([{ kind: "link", text: "the spec", href: "/api" }]);
  });

  test("reads the field half of a reference, dots and all", () => {
    expect(inlineSpans("[[ds_9f8e#rows.email]]")).toEqual([
      { kind: "reference", id: "ds_9f8e", field: "rows.email" },
    ]);
  });

  test("a field half that could not be one leaves the whole thing as text", () => {
    expect(inlineSpans("[[ds_9f8e#not a field]]")).toEqual([{ kind: "text", text: "[[ds_9f8e#not a field]]" }]);
  });

  test("leaves brackets that hold no id as the text they are", () => {
    expect(inlineSpans("[[not an id]]")).toEqual([{ kind: "text", text: "[[not an id]]" }]);
  });

  test("keeps markup as text, since spans are rendered as elements", () => {
    expect(inlineSpans("<script>alert(1)</script>")).toEqual([
      { kind: "text", text: "<script>alert(1)</script>" },
    ]);
  });
});

describe("blocks", () => {
  test("reads the shape the document's own description is written in", () => {
    const blocks = parseMarkdown(
      ["### Authentication", "", "Three credentials reach", "the same account:", "", "- `X-API-Key`", "- A cookie"].join(
        "\n",
      ),
    );

    expect(blocks[0]).toMatchObject({ kind: "heading", level: 3 });
    // The source is hard-wrapped; the rendered paragraph is not.
    expect(blocks[1]).toMatchObject({
      kind: "paragraph",
      spans: [{ kind: "text", text: "Three credentials reach the same account:" }],
    });
    expect(blocks[2]).toMatchObject({ kind: "list" });
    expect((blocks[2] as { items: unknown[] }).items).toHaveLength(2);
  });

  test("continues a bullet that wrapped onto an indented line", () => {
    const blocks = parseMarkdown("- Issue one under Settings,\n  or with `POST /api/keys`.");
    expect(blocks).toHaveLength(1);
    const [list] = blocks;
    expect(list?.kind).toBe("list");
    const items = list?.kind === "list" ? list.items : [];
    expect(items).toHaveLength(1);
    expect(items[0]!.map(span => ("text" in span ? span.text : span.id)).join("")).toBe(
      "Issue one under Settings, or with POST /api/keys.",
    );
  });

  test("reads a numbered list as one, and a change of marker as a new list", () => {
    const blocks = parseMarkdown("1. first\n2. second\n\n- bullet");
    expect(blocks).toMatchObject([
      { kind: "list", ordered: true },
      { kind: "list", ordered: false },
    ]);
    expect((blocks[0] as { items: unknown[] }).items).toHaveLength(2);
  });

  test("keeps a fenced block literal, marks and all", () => {
    const blocks = parseMarkdown("```ts\n# not a heading\nconst x = `y`;\n```");
    expect(blocks).toEqual([{ kind: "code", language: "ts", text: "# not a heading\nconst x = `y`;" }]);
  });

  test("a fence nobody closed still keeps what was written in it", () => {
    expect(parseMarkdown("```\nhalf a snippet")).toEqual([{ kind: "code", language: "", text: "half a snippet" }]);
  });

  test("reads a quote, and lets the line after it start a paragraph", () => {
    const blocks = parseMarkdown("> borrowed\n\nmine");
    expect(blocks).toMatchObject([{ kind: "quote" }, { kind: "paragraph" }]);
  });

  test("makes nothing of nothing", () => {
    expect(parseMarkdown("")).toEqual([]);
    expect(parseMarkdown("\n\n  \n")).toEqual([]);
  });
});
