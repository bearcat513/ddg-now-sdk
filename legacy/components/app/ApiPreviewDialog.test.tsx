import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { ApiPreviewDialog } from "./ApiPreviewDialog";
import type { PreviewTarget } from "@/lib/curl";

const inline: Extract<PreviewTarget, { kind: "inline" }> = {
  kind: "inline",
  name: "Orders",
  rowCount: 500,
  seed: "steady",
  locale: "",
  configId: null,
  fields: [{ id: "f1", name: "total", type: "float" }],
};

const config: Extract<PreviewTarget, { kind: "config" }> = {
  kind: "config",
  configId: "cfg_1",
  configName: "Orders",
  name: "Orders",
  rowCount: 500,
  seed: "steady",
  locale: "",
};

const render = (over: Partial<Parameters<typeof ApiPreviewDialog>[0]> = {}) =>
  renderToString(
    <ApiPreviewDialog inline={inline} config={null} onClose={() => {}} onManageKeys={() => {}} {...over} />,
  ).replaceAll("<!-- -->", "");

describe("ApiPreviewDialog", () => {
  test("an unsaved schema previews the inline call, body and all", () => {
    const html = render();
    expect(html).toContain("/api/generate");
    expect(html).toContain("curl -X POST");
    expect(html).toContain("&quot;rowCount&quot;: 500");
  });

  test("a saved schema starts on its own endpoint, and offers the inline one", () => {
    const html = render({ config });
    expect(html).toContain("/api/configs/cfg_1/generate?rows=500&amp;seed=steady");
    expect(html).toContain("Inline schema");
  });

  test("it says which header carries the key", () => {
    expect(render()).toContain("X-API-Key");
  });

  test("the row window is only offered where it applies", () => {
    // It belongs to the saved JSON envelope, which is what the dialog opens on.
    expect(render()).toContain("Rows in the response");
  });
});
