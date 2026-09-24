import { describe, expect, test } from "bun:test";
import {
  API_KEY_HEADER,
  buildRequest,
  DEFAULT_PREVIEW_OPTIONS,
  inlineBody,
  shellQuote,
  toCurl,
  toCurlScript,
  type PreviewOptions,
  type PreviewTarget,
} from "./curl";
import type { Field } from "./types";

const fields: Field[] = [
  { id: "f1", name: "id", type: "uuid" },
  {
    id: "f2",
    name: "customer",
    type: "object",
    options: { fields: [{ id: "f3", name: "email", type: "email" }] },
  },
];

const inline: Extract<PreviewTarget, { kind: "inline" }> = {
  kind: "inline",
  name: "Orders",
  rowCount: 500,
  seed: "steady",
  locale: "de",
  configId: null,
  fields,
};

const stored: Extract<PreviewTarget, { kind: "config" }> = {
  kind: "config",
  configId: "cfg_1",
  configName: "Orders",
  name: "Orders",
  rowCount: 500,
  seed: "",
  locale: "",
};

const options = (over: Partial<PreviewOptions> = {}): PreviewOptions => ({
  ...DEFAULT_PREVIEW_OPTIONS,
  baseUrl: "http://localhost:3000",
  ...over,
});

describe("inlineBody", () => {
  test("carries what the editor holds, without the browser's field ids", () => {
    const body = inlineBody(inline);
    expect(body).toMatchObject({ name: "Orders", rowCount: 500, seed: "steady", locale: "de" });
    expect(body.fields[0]).toEqual({ name: "id", type: "uuid", options: undefined });
    // Nested fields are stripped too, or the command would carry ids one level down.
    expect(body.fields[1]?.options?.fields?.[0]).toEqual({
      name: "email",
      type: "email",
      options: undefined,
    } as unknown as Field);
  });

  test("configId only rides along when the schema has one", () => {
    expect(inlineBody(inline).configId).toBeUndefined();
    expect(inlineBody({ ...inline, configId: "cfg_1" }).configId).toBe("cfg_1");
  });
});

describe("buildRequest", () => {
  test("an inline schema POSTs its body to /api/generate", () => {
    const request = buildRequest(inline, options());
    expect(request.url).toBe("http://localhost:3000/api/generate");
    expect(request.headers).toEqual([
      { name: "Content-Type", value: "application/json" },
      { name: API_KEY_HEADER, value: "$DDG_API_KEY" },
    ]);
    expect(JSON.parse(request.body!)).toMatchObject({ rowCount: 500 });
  });

  test("a stored schema needs no body, and overrides ride in the query", () => {
    const request = buildRequest({ ...stored, seed: "steady", locale: "de" }, options());
    expect(request.body).toBeUndefined();
    expect(request.path).toBe("/api/configs/cfg_1/generate?rows=500&seed=steady&locale=de");
  });

  test("the name is only overridden where it departs from the stored one", () => {
    expect(buildRequest(stored, options()).path).toBe("/api/configs/cfg_1/generate?rows=500");
    expect(buildRequest({ ...stored, name: "Tuesday run" }, options()).path).toBe(
      "/api/configs/cfg_1/generate?rows=500&name=Tuesday+run",
    );
  });

  test("a format and an unsaved run show up as query options", () => {
    expect(buildRequest(inline, options({ format: "csv" })).path).toBe("/api/generate?format=csv");
    expect(buildRequest(inline, options({ save: false })).path).toBe("/api/generate?save=false");
  });

  test("the row window is only sent where it can change the answer", () => {
    // The default needs no saying, and neither download nor unsaved run windows rows.
    expect(buildRequest(inline, options({ limit: 100 })).path).toBe("/api/generate");
    expect(buildRequest(inline, options({ limit: 0 })).path).toBe("/api/generate?limit=0");
    expect(buildRequest(inline, options({ limit: 5, format: "csv" })).path).toBe("/api/generate?format=csv");
    expect(buildRequest(inline, options({ limit: 5, save: false })).path).toBe("/api/generate?save=false");
  });

  test("a trailing slash on the origin does not double up", () => {
    expect(buildRequest(inline, options({ baseUrl: "https://ddg.example.com/" })).url).toBe(
      "https://ddg.example.com/api/generate",
    );
  });
});

describe("toCurl", () => {
  test("the command is one runnable line per flag", () => {
    const command = toCurl(buildRequest(stored, options()));
    expect(command).toBe(
      [
        "curl -X POST 'http://localhost:3000/api/configs/cfg_1/generate?rows=500' \\",
        `  -H "${API_KEY_HEADER}: $DDG_API_KEY"`,
      ].join("\n"),
    );
  });

  test("the key header stays double-quoted, so the shell expands it", () => {
    const command = toCurl(buildRequest(inline, options()));
    expect(command).toContain(`-H "${API_KEY_HEADER}: $DDG_API_KEY"`);
    expect(command).toContain("-H 'Content-Type: application/json'");
  });

  test("an apostrophe in the data cannot end the quoted body", () => {
    const command = toCurl(
      buildRequest({ ...inline, name: "O'Brien's orders" }, options()),
    );
    expect(command).toContain(`O'\\''Brien'\\''s orders`);
    // Every quote in the command still pairs up.
    expect((command.match(/'/g) ?? []).length % 2).toBe(0);
  });

  test("the copied snippet says where the key comes from", () => {
    expect(toCurlScript(buildRequest(inline, options())).split("\n")[0]).toBe("export DDG_API_KEY=pk_…");
  });
});

describe("shellQuote", () => {
  test("wraps plainly, and closes around each apostrophe", () => {
    expect(shellQuote("plain")).toBe("'plain'");
    expect(shellQuote("it's")).toBe(`'it'\\''s'`);
  });
});
