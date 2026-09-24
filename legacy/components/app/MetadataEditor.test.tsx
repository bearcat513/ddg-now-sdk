import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { MetadataEditor } from "./MetadataEditor";
import { METADATA_LIMITS, type MetadataPair } from "@/lib/metadata";

const pairs: MetadataPair[] = [
  { key: "team", value: "billing" },
  { key: "ticket", value: "DDG-412" },
];

const render = (over: Partial<Parameters<typeof MetadataEditor>[0]> = {}) =>
  renderToString(
    <MetadataEditor pairs={pairs} onChange={() => {}} open onToggle={() => {}} {...over} />,
  ).replaceAll("<!-- -->", "");

describe("MetadataEditor", () => {
  test("collapsed, it still says how much is there", () => {
    const html = render({ open: false });
    expect(html).toContain("2 pairs");
    expect(html).toContain('aria-expanded="false"');
    // Nothing else is rendered, so the schema list keeps the room.
    expect(html).not.toContain('aria-label="Metadata key 1"');
  });

  test("a schema with none says so rather than showing an empty grid", () => {
    expect(render({ pairs: [], open: false })).toContain("none yet");
  });

  test("open, every pair is an editable row that can be removed", () => {
    const html = render();
    expect(html).toContain('aria-label="Metadata key 1"');
    expect(html).toContain('aria-label="Metadata value 2"');
    expect(html).toContain('aria-label="Remove metadata pair 2"');
    expect(html).toContain('value="DDG-412"');
  });

  test("a repeated key is marked, since only the last of them is stored", () => {
    const html = render({ pairs: [...pairs, { key: "team", value: "growth" }] });
    // The first "team" is the one that loses.
    expect(html.split('aria-label="Metadata key')[1]).toContain('aria-invalid="true"');
  });

  test("the row limit closes the Add button rather than failing on save", () => {
    const full = Array.from({ length: METADATA_LIMITS.pairs }, (_, i) => ({ key: `k${i}`, value: "v" }));
    expect(render({ pairs: full })).toContain("disabled");
  });

  test("it names where the pairs end up, which is the point of keeping them", () => {
    expect(render()).toContain("CONFIG_METADATA");
  });
});
