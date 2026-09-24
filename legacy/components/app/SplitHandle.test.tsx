import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { createRef } from "react";
import { SplitHandle } from "./SplitHandle";

function render(value: number) {
  return renderToString(
    <SplitHandle
      value={value}
      min={20}
      max={80}
      defaultValue={50}
      containerRef={createRef<HTMLDivElement>()}
      onChange={() => {}}
    />,
  ).replaceAll("<!-- -->", "");
}

describe("SplitHandle", () => {
  test("is a labelled separator carrying its current and allowed sizes", () => {
    const html = render(35);
    expect(html).toContain('role="separator"');
    expect(html).toContain('aria-orientation="vertical"');
    expect(html).toContain('aria-valuenow="35"');
    expect(html).toContain('aria-valuemin="20"');
    expect(html).toContain('aria-valuemax="80"');
    expect(html).toContain('aria-label="Resize the schema and preview panes"');
  });

  test("is reachable by keyboard", () => {
    expect(render(50)).toContain('tabindex="0"');
  });

  test("rounds a dragged fraction for the assistive-technology value", () => {
    expect(render(33.3333)).toContain('aria-valuenow="33"');
  });

  test("is hidden where the panes stack instead of sitting side by side", () => {
    // Below `lg` the two panes are rows, and there is no vertical line to drag.
    expect(render(50)).toContain("hidden");
    expect(render(50)).toContain("lg:block");
  });
});
