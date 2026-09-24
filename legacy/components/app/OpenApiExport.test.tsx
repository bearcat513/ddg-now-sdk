import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { OpenApiExport, specUrl } from "./OpenApiExport";
import { api } from "@/lib/api";

const html = renderToString(<OpenApiExport />).replaceAll("<!-- -->", "");

describe("the OpenAPI export", () => {
  test("offers the document as a file, named so a tool can tell what it is", () => {
    expect(html).toContain(`href="${api.openApiUrl}"`);
    expect(html).toContain(`download="${api.openApiFileName}"`);
    expect(api.openApiFileName).toMatch(/\.json$/);
  });

  test("offers the same document as a link to import from", () => {
    // Server-rendered here, so this is the fallback path: no window to make it
    // absolute against, and the value is still the URL rather than empty.
    expect(html).toContain(`value="${api.openApiUrl}"`);
    expect(html).toContain("readOnly");
  });

  test("makes the link absolute where there is an origin to make it against", () => {
    expect(specUrl("https://data.example.com")).toBe("https://data.example.com/api/openapi.json");
  });

  test("falls back to the path rather than throwing where there is not", () => {
    // Server-rendered, or a page on about:blank — neither resolves, and a
    // settings page that throws over a link is worse than a relative one.
    for (const origin of [undefined, "", "about:blank"]) {
      expect(specUrl(origin)).toBe(api.openApiUrl);
    }
  });

  test("says how the two tools people actually use take it", () => {
    expect(html).toContain("Postman");
    expect(html).toContain("Bruno");
    // And what to set, since the document itself carries no credential.
    expect(html).toContain("X-API-Key");
  });
});
