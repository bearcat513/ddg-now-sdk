import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { CodeEditor } from "./CodeEditor";
import { ScriptTemplatePanel } from "./ScriptTemplatePanel";
import { DATASET_PLACEHOLDER, STARTER_TEMPLATE_BODY } from "@/lib/scriptTemplate";

const render = (value: string) =>
  renderToString(<CodeEditor value={value} onChange={() => {}} label="Script" />).replaceAll("<!-- -->", "");

describe("CodeEditor", () => {
  test("the script is painted as coloured tokens, not as markup", () => {
    const html = render(`const rows = ${DATASET_PLACEHOLDER};`);
    expect(html).toContain("text-violet-600"); // const
    expect(html).toContain("bg-primary/15"); // the placeholder
  });

  test("a script that looks like markup stays text", () => {
    const html = render(`const a = "<img src=x onerror=alert(1)>";`);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  test("the gutter numbers every line, including the last empty one", () => {
    const html = render("a\nb\n");
    expect(html.match(/<div>\d+<\/div>/g)).toEqual(["<div>1</div>", "<div>2</div>", "<div>3</div>"]);
  });

  test("the box is a real textarea, so selection, undo and IME still work", () => {
    const html = render("a");
    expect(html).toContain("<textarea");
    expect(html).toContain('aria-label="Script"');
    // Colour comes from the layer underneath; wrapping would misalign the two.
    expect(html).toContain("text-transparent");
    expect(html).toContain('wrap="off"');
  });
});

test("the script template panel edits its body in the code editor", () => {
  const html = renderToString(
    <ScriptTemplatePanel
      name="Seed incidents"
      body={STARTER_TEMPLATE_BODY}
      activeId={null}
      owned
      busy={false}
      onNameChange={() => {}}
      onBodyChange={() => {}}
      onSave={() => {}}
      onNew={() => {}}
    />,
  ).replaceAll("<!-- -->", "");

  expect(html).toContain('aria-label="Script template body"');
  expect(html).toContain("Esc then Tab leaves the editor");
});
