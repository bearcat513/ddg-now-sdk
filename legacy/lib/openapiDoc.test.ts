import { describe, expect, test } from "bun:test";
import { buildOpenApiDocument } from "../server/openapi";
import { API_KEY_HEADER, API_KEY_VARIABLE } from "./curl";
import {
  anchorId,
  buildRequest,
  exampleBody,
  exampleFor,
  fillPath,
  groupByTag,
  matches,
  queryString,
  readOperations,
  requestUrl,
  resolve,
  serverChoices,
  serverUrl,
  credentialVariable,
  trialCurl,
  typeLabel,
  TOKEN_VARIABLE,
  type OpenApiDoc,
  type Operation,
} from "./openapiDoc";

/**
 * The reference page renders the document the server serves, so these read
 * that document rather than a fixture: what the page has to survive is the
 * real one — self-referential schemas, `$ref`s into `components.responses`,
 * operations that need no credential.
 */
const doc = buildOpenApiDocument({ serverUrl: "https://data.example.com" }) as unknown as OpenApiDoc;
const operations = readOperations(doc);

const find = (key: string): Operation => {
  const operation = operations.find(entry => entry.key === key);
  if (!operation) throw new Error(`no such operation: ${key}`);
  return operation;
};

describe("reading the document", () => {
  test("finds every operation the document declares", () => {
    const declared = Object.values(doc.paths ?? {}).flatMap(item =>
      Object.keys(item as Record<string, unknown>).length,
    );
    expect(operations.length).toBe(declared.reduce((total, count) => total + count, 0));
    expect(operations.length).toBeGreaterThan(20);
  });

  test("keeps what each operation needs to be drawn", () => {
    const login = find("post /api/auth/login");
    expect(login.tag).toBe("Auth");
    expect(login.operationId).toBe("login");
    expect(login.summary).toContain("session");
    expect(login.body?.mediaType).toBe("application/json");
    expect(login.responses.map(response => response.status)).toContain("401");
  });

  test("marks the operations that need no credential, and only those", () => {
    expect(find("get /api/health").anonymous).toBe(true);
    expect(find("post /api/auth/login").anonymous).toBe(true);
    expect(find("get /api/configs").anonymous).toBe(false);
  });

  test("resolves a response that is only a reference to a shared one", () => {
    // Every guarded operation's 401 is `$ref: components/responses/Unauthorized`.
    const unauthorized = find("get /api/configs").responses.find(response => response.status === "401");
    expect(unauthorized?.description).toContain("credential");
    expect(unauthorized?.media[0]?.mediaType).toBe("application/json");
  });

  test("orders responses with the success first and the failures after it", () => {
    const statuses = find("post /api/auth/login").responses.map(response => response.status);
    expect(statuses[0]).toBe("200");
    expect(statuses.slice(1).every(status => Number(status) >= 400)).toBe(true);
  });

  test("groups under the document's own tags, in the document's own order", () => {
    const groups = groupByTag(doc, operations);
    expect(groups.map(group => group.name).slice(0, 2)).toEqual(["Discovery", "Auth"]);
    expect(groups.every(group => group.operations.length > 0)).toBe(true);
    // Nothing is lost on the way into a group, and nothing is counted twice.
    expect(groups.reduce((total, group) => total + group.operations.length, 0)).toBe(operations.length);
  });
});

describe("references", () => {
  test("follows one, however many hops it takes", () => {
    expect(resolve(doc, { $ref: "#/components/schemas/Error" })).toMatchObject({ type: "object" });
  });

  test("gives up quietly on one that leads nowhere", () => {
    expect(resolve(doc, { $ref: "#/components/schemas/NotAThing" })).toEqual({});
    expect(resolve(doc, { $ref: "https://example.com/other.json#/X" })).toEqual({});
  });

  test("gives up on one that points at itself, rather than spinning", () => {
    const circular: OpenApiDoc = {
      components: { schemas: { Loop: { $ref: "#/components/schemas/Loop" } } },
    };
    expect(resolve(circular, { $ref: "#/components/schemas/Loop" })).toEqual({});
  });
});

describe("examples", () => {
  test("builds a body from the schema, taking the document's own defaults", () => {
    const body = JSON.parse(exampleBody(doc, find("put /api/preferences").body));
    expect(body).toMatchObject({ theme: expect.any(String), defaultRowCount: expect.any(Number) });
  });

  test("stops at a schema that contains itself", () => {
    // A field's options hold fields, which hold options: unrolled, this never
    // returns. The inner one comes back null instead.
    const field = exampleFor(doc, { $ref: "#/components/schemas/Field" });
    expect(field).toMatchObject({ name: expect.any(String) });
    expect(JSON.stringify(field)).toBeTruthy();
  });

  test("prefers an enum's first value, and a declared default over both", () => {
    expect(exampleFor(doc, { type: "string", enum: ["csv", "json"] })).toBe("csv");
    expect(exampleFor(doc, { type: "integer", default: 25, minimum: 1 })).toBe(25);
    expect(exampleFor(doc, { type: "boolean" })).toBe(true);
  });

  test("has nothing to put in the box for an operation with no body", () => {
    expect(exampleBody(doc, find("get /api/configs").body)).toBe("");
  });
});

describe("labels", () => {
  test("names a referenced schema, and an array of one", () => {
    expect(typeLabel(doc, { $ref: "#/components/schemas/Config" })).toBe("Config");
    expect(typeLabel(doc, { type: "array", items: { $ref: "#/components/schemas/Config" } })).toBe("Config[]");
  });

  test("says when a plain type is a closed set of values", () => {
    expect(typeLabel(doc, { type: "string", enum: ["csv", "json"] })).toBe("string · enum");
    expect(typeLabel(doc, { type: "integer" })).toBe("integer");
  });
});

describe("the trial request", () => {
  test("fills a path parameter, and leaves an empty one visible", () => {
    expect(fillPath("/api/configs/{id}", { id: "abc 123" })).toBe("/api/configs/abc%20123");
    expect(fillPath("/api/configs/{id}", {})).toBe("/api/configs/{id}");
  });

  test("sends only the query parameters that were given a value", () => {
    const generate = find("post /api/generate");
    expect(queryString(generate.parameters, { format: "csv", limit: "" })).toBe("?format=csv");
    expect(queryString(generate.parameters, {})).toBe("");
  });

  test("goes to this page's own origin first, and offers the document's too", () => {
    // Identical in the ordinary case: the document names the origin it was
    // served from, so there is one server and nothing to choose between.
    expect(serverChoices(doc, "https://data.example.com")).toEqual(["https://data.example.com"]);

    // And where they differ — a proxy that terminated TLS, a document answered
    // from the cache — the page's own origin leads, because it is the one a
    // call from this page can actually reach.
    expect(serverChoices(doc, "https://data.example.com:8443/")).toEqual([
      "https://data.example.com:8443",
      "https://data.example.com",
    ]);
  });

  test("goes to the server the document names", () => {
    expect(serverUrl(doc, "http://localhost:3000")).toBe("https://data.example.com");
    expect(serverUrl({}, "http://localhost:3000/")).toBe("http://localhost:3000");
    expect(requestUrl("https://data.example.com/", find("get /api/configs/{id}"), { id: "42" })).toBe(
      "https://data.example.com/api/configs/42",
    );
  });

  test("carries the credential in the header that credential uses", () => {
    const request = buildRequest(find("get /api/configs"), {
      base: "https://data.example.com",
      values: {},
      body: "",
      credential: { kind: "apiKey", value: "pk_secret" },
    });

    expect(request.method).toBe("GET");
    expect(request.headers).toContainEqual({ name: API_KEY_HEADER, value: "pk_secret" });
    // Nothing to send, so nothing claims to be sent.
    expect(request.body).toBeUndefined();
    expect(request.headers.some(header => header.name === "Content-Type")).toBe(false);
  });

  test("sends a body on the methods that take one, with its own media type", () => {
    const request = buildRequest(find("post /api/auth/login"), {
      base: "https://data.example.com",
      values: {},
      body: '{"email":"you@example.com"}',
      credential: { kind: "none", value: "" },
    });

    expect(request.body).toBe('{"email":"you@example.com"}');
    expect(request.headers).toContainEqual({ name: "Content-Type", value: "application/json" });
  });

  test("names the variable a user token would be read from, not the key's", () => {
    const request = buildRequest(find("get /api/configs"), {
      base: "https://data.example.com",
      values: {},
      body: "",
      credential: { kind: "token", value: "a-pocketbase-token" },
    });

    expect(request.headers).toContainEqual({ name: "Authorization", value: "a-pocketbase-token" });
    expect(credentialVariable(request)).toBe(TOKEN_VARIABLE);
    expect(trialCurl(request)).not.toContain("a-pocketbase-token");
  });

  test("writes the key as a shell variable in the command beside it", () => {
    const request = buildRequest(find("get /api/configs"), {
      base: "https://data.example.com",
      values: {},
      body: "",
      credential: { kind: "apiKey", value: "pk_secret" },
    });

    const command = trialCurl(request);
    expect(command).not.toContain("pk_secret");
    expect(command).toContain(`$${API_KEY_VARIABLE}`);
    expect(command).toContain("curl -X GET 'https://data.example.com/api/configs'");
  });
});

describe("finding an endpoint", () => {
  test("matches a path, a word, a method or a tag, and narrows on each term", () => {
    const generate = find("post /api/generate");
    expect(matches(generate, "")).toBe(true);
    expect(matches(generate, "generate")).toBe(true);
    expect(matches(generate, "POST generate")).toBe(true);
    expect(matches(generate, "generate telegram")).toBe(false);
  });

  test("gives every operation a unique anchor to be linked by", () => {
    const anchors = operations.map(anchorId);
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(anchorId(find("get /api/configs/{id}"))).toMatch(/^op-[A-Za-z0-9-]+$/);
  });
});
