import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { SettingsPanel } from "./SettingsPanel";
import { ACCENT_COLORS, DEFAULT_PREFERENCES, type Preferences } from "@/lib/preferences";

const me = { id: "u1", email: "you@example.com", name: "You", createdAt: "2026-01-01T00:00:00Z", preferences: DEFAULT_PREFERENCES };

function render(preferences: Preferences) {
  return renderToString(
    <SettingsPanel
      me={me as never}
      preferences={preferences}
      saveState="idle"
      templates={[]}
      counts={{ configs: 0, templates: 0 }}
      storage="http://localhost:8091"
      onChange={() => {}}
      onReset={() => {}}
      onAccountUpdated={() => {}}
      onClose={() => {}}
    />,
  ).replaceAll("<!-- -->", "");
}

describe("the accent picker", () => {
  test("offers a labelled swatch for every accent", () => {
    const html = render(DEFAULT_PREFERENCES);
    for (const accent of ACCENT_COLORS) {
      expect(html).toContain(`data-accent="${accent.id}"`);
      expect(html).toContain(`aria-label="${accent.label}"`);
    }
  });

  test("each swatch paints itself from the palette rather than a copy of it", () => {
    // If a swatch ever hard-codes a colour, this is what notices.
    const html = render(DEFAULT_PREFERENCES);
    expect(html.match(/background:var\(--primary\)/g)?.length).toBe(ACCENT_COLORS.length);
  });

  test("the chosen accent is the one marked selected", () => {
    const html = render({ ...DEFAULT_PREFERENCES, accentColor: "rose" });
    const selected = [...html.matchAll(/aria-checked="true"[^>]*aria-label="([^"]+)"/g)].map(m => m[1]);
    expect(selected).toEqual(["Rose"]);
  });

  test("the swatches are a radio group, so a keyboard can reach them", () => {
    const html = render(DEFAULT_PREFERENCES);
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/role="radio"/g)).toHaveLength(ACCENT_COLORS.length);
  });
});
