import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { OperationCard } from "./OperationCard";
import { buildOpenApiDocument } from "@/server/openapi";
import { readOperations, type OpenApiDoc, type Operation } from "@/lib/openapiDoc";

/**
 * The card, rendered against the document the server actually serves.
 *
 * Server-rendered, so what is asserted is the first paint — which is also the
 * whole of what a reader who never clicks anything sees.
 */

const doc = buildOpenApiDocument({ serverUrl: "https://data.example.com" }) as unknown as OpenApiDoc;
const operations = readOperations(doc);

const find = (key: string): Operation => operations.find(entry => entry.key === key)!;

const render = (operation: Operation, open: boolean) =>
  renderToString(
    <OperationCard
      doc={doc}
      operation={operation}
      base="https://data.example.com"
      credential={{ kind: "none", value: "" }}
      open={open}
      onToggle={() => {}}
      onNeedsCredential={() => {}}
    />,
  ).replaceAll("<!-- -->", "");

describe("a closed card", () => {
  test("is the one line a list of endpoints needs: method, path, summary", () => {
    const html = render(find("post /api/generate"), false);
    expect(html).toContain("post");
    expect(html).toContain("/api/generate");
    expect(html).toContain('aria-expanded="false"');
    // Nothing below the header has been drawn yet.
    expect(html).not.toContain("Try it out");
  });
});

describe("an open card", () => {
  const html = render(find("post /api/configs/{id}/generate"), true);

  test("draws the parameters the document declares, with their types", () => {
    expect(html).toContain("rows");
    expect(html).toContain("format");
    expect(html).toContain("path");
    expect(html).toContain("query");
  });

  test("offers the call, and says where it would go", () => {
    expect(html).toContain("Try it out");
    expect(html).toContain("Responses");
  });

  test("shows the documented answers, success first", () => {
    expect(html.indexOf("200")).toBeLessThan(html.indexOf("401"));
  });

  test("says whether a credential is needed", () => {
    expect(html).toContain("Needs a credential");
    expect(render(find("get /api/health"), true)).toContain("No credential needed");
  });
});

describe("an operation with a body", () => {
  test("starts the box from an example built out of the schema", () => {
    const html = render(find("post /api/auth/login"), true);
    expect(html).toContain("Request body");
    expect(html).toContain("application/json");
    expect(html).toContain("email");
  });
});
