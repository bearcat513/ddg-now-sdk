import { describe, expect, test } from "bun:test";
import { ACCENT_COLORS } from "./preferences";

/**
 * The accents are declared in TypeScript but painted by CSS, and the two only
 * meet in the browser. These read the stylesheet as text and check that every
 * accent the app offers has a complete palette waiting for it, in both themes —
 * the way fourteen hand-written blocks actually go wrong.
 */

const css = await Bun.file(new URL("../../styles/globals.css", import.meta.url)).text();

/** The tokens a palette has to move for the accent to reach the whole UI. */
const REQUIRED = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-ring",
];

/** The body of the rule whose selector list starts with `selector`. */
function ruleBody(selector: string): string | null {
  const start = css.indexOf(selector);
  if (start === -1) return null;
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return open === -1 || close === -1 ? null : css.slice(open + 1, close);
}

describe("accent palettes", () => {
  for (const accent of ACCENT_COLORS) {
    test(`${accent.id} defines a light and a dark palette`, () => {
      const light = ruleBody(`[data-accent="${accent.id}"]`);
      const dark = ruleBody(`.dark[data-accent="${accent.id}"]`);
      expect(light).not.toBeNull();
      expect(dark).not.toBeNull();

      for (const token of REQUIRED) {
        expect(light).toContain(`${token}:`);
        expect(dark).toContain(`${token}:`);
      }

      // A palette that reads the same in both themes means one of the two was
      // pasted over the other — the mistake this file exists to catch.
      expect(light!.trim()).not.toBe(dark!.trim());
    });
  }

  test("the dark rule also matches a nested element, so swatches theme correctly", () => {
    for (const accent of ACCENT_COLORS) {
      expect(css).toContain(`.dark [data-accent="${accent.id}"]`);
    }
  });

  test("no palette touches the tokens that carry their own meaning", () => {
    // `--accent` is the neutral hover grey in this token set, and
    // `--destructive` has to keep reading as danger whatever the app wears.
    for (const accent of ACCENT_COLORS) {
      for (const selector of [`[data-accent="${accent.id}"]`, `.dark[data-accent="${accent.id}"]`]) {
        const body = ruleBody(selector)!;
        expect(body).not.toContain("--accent:");
        expect(body).not.toContain("--accent-foreground:");
        expect(body).not.toContain("--destructive:");
        expect(body).not.toContain("--background:");
        expect(body).not.toContain("--foreground:");
      }
    }
  });

  test("the HTML shell ships the default accent, so the first paint is right", async () => {
    const html = await Bun.file(new URL("../index.html", import.meta.url)).text();
    expect(html).toContain(`data-accent="blue"`);
  });
});
