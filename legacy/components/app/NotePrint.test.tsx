import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { NotePrintSheet } from "./NotePrint";
import { missingReference, type ResolvedReference } from "@/lib/notes";

/**
 * The printable sheet.
 *
 * The print *run* is a browser dialog and a class on `<html>`, which no test
 * here can honestly drive. What is checked is the thing that goes into the
 * dialog: that the sheet is the rendered note rather than its source, that it
 * carries the title and the date the PDF will be read under, and that a chip
 * on paper is a name rather than a button nobody can press.
 */

const resolve = (id: string): ResolvedReference | undefined =>
  id === "cfg_1a2b"
    ? { id, kind: "config", label: "Orders", detail: "3 fields", found: true }
    : missingReference({ id, field: "" });

const render = (title: string, body: string) =>
  renderToString(
    <NotePrintSheet title={title} body={body} printedOn="1 October 2026" resolve={resolve} />,
  ).replaceAll("<!-- -->", "");

describe("the printed sheet", () => {
  test("is the rendered note, not its Markdown", () => {
    const html = render("Demo prep", "## Seeding\n\n- Regenerate [[cfg_1a2b]]\n- Check `rowCount`");
    expect(html).toContain("<h3");
    expect(html).toContain("<li>");
    expect(html).toContain("<code");
    expect(html).not.toContain("## Seeding");
    expect(html).not.toContain("[[cfg_1a2b]]");
  });

  test("names the note and the day it was printed", () => {
    const html = render("Demo prep", "Anything.");
    expect(html).toContain("Demo prep");
    expect(html).toContain("1 October 2026");
  });

  test("an untitled note still has a title on paper", () => {
    // It is about to become a file, and a page with no heading is a page
    // nobody can file.
    expect(render("   ", "Anything.")).toContain("Untitled note");
  });

  test("a chip is a name, never a control", () => {
    const html = render("Demo prep", "Regenerate [[cfg_1a2b]] first.");
    expect(html).toContain("Orders");
    expect(html).not.toContain("<button");
  });

  test("a reference that resolved to nothing still prints, and admits it", () => {
    const html = render("Demo prep", "Regenerate [[cfg_gone]] first.");
    expect(html).toContain("chip-ref-missing");
    expect(html).toContain("Regenerate");
  });

  test("carries the class the print stylesheet hangs the page off", () => {
    expect(render("Demo prep", "Anything.")).toContain("note-print");
  });
});
