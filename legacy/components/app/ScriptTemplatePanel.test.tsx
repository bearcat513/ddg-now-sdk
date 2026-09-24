import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { ScriptTemplatePanel } from "./ScriptTemplatePanel";
import { DATASET_PLACEHOLDER, PLACEHOLDERS, STARTER_TEMPLATE_BODY } from "@/lib/scriptTemplate";

const render = (body: string) =>
  renderToString(
    <ScriptTemplatePanel
      name="Seed incidents"
      body={body}
      activeId={null}
      owned
      busy={false}
      onNameChange={() => {}}
      onBodyChange={() => {}}
      onSave={() => {}}
      onNew={() => {}}
    />,
  ).replaceAll("<!-- -->", "");

describe("the placeholder palette", () => {
  test("offers every placeholder, grouped by what it draws from", () => {
    const html = render(STARTER_TEMPLATE_BODY);
    for (const entry of PLACEHOLDERS) expect(html).toContain(`>${entry.name}</button>`);
    expect(html).toContain("Dataset");
    expect(html).toContain("Configuration");
  });

  test("each one says what it renders as, since that is the surprising part", () => {
    expect(render(STARTER_TEMPLATE_BODY)).toContain("renders as 500");
  });
});

describe("what the panel warns about", () => {
  test("a template with no placeholders at all would render to itself", () => {
    expect(render("const rows = [];")).toContain("No placeholders in this script");
  });

  test("details but no rows is its own warning", () => {
    const html = render("const config = ${CONFIG_NAME};");
    expect(html).toContain("but none of its rows");
    expect(html).not.toContain("No placeholders in this script");
  });

  test("the rows placeholder is counted, so a template can say how often", () => {
    expect(render(`${DATASET_PLACEHOLDER}${DATASET_PLACEHOLDER}`)).toContain("2 times");
  });
});
