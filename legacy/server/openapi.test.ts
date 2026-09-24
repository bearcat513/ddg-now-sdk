/**
 * The document is what tools read, so these check its shape rather than its
 * prose: that every reference resolves, that the credentials are described,
 * and that the index `GET /api` prints is the same list of endpoints.
 *
 * `api.test.ts` takes the other half — that every operation named here is a
 * route the server actually answers on.
 */
import { describe, expect, test } from "bun:test";
import { buildOpenApiDocument, endpointIndex, OPENAPI_PATH, OPERATIONS } from "./openapi";
import { DEFAULT_PREFERENCES } from "../lib/preferences";
import { FIELD_TYPES } from "../lib/types";

const document = buildOpenApiDocument({ serverUrl: "http://localhost:3000" });

/** Every operation object in the document, with the route it sits on. */
const operations = Object.entries(document.paths).flatMap(([path, methods]) =>
  Object.entries(methods as Record<string, any>).map(([method, operation]) => ({ path, method, operation })),
);

/** Every `$ref` anywhere in the document. */
function refsIn(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach(entry => refsIn(entry, found));
  else if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (key === "$ref" && typeof nested === "string") found.push(nested);
      else refsIn(nested, found);
    }
  }
  return found;
}

describe("the document", () => {
  test("is OpenAPI 3.0, which is the version every tool reads", () => {
    expect(document.openapi).toBe("3.0.3");
    expect(document.info).toMatchObject({ title: "Dummy Data Generator API" });
  });

  test("points at the server it was fetched from", () => {
    expect(document.servers[0]).toMatchObject({ url: "http://localhost:3000" });
    // Without one it still has to name something a tool can call.
    expect(String((buildOpenApiDocument().servers[0] as any).url)).toMatch(/^https?:\/\//);
  });

  test("describes all three ways in", () => {
    const schemes = (document.components as any).securitySchemes;
    expect(schemes.apiKey).toMatchObject({ type: "apiKey", in: "header", name: "X-API-Key" });
    expect(schemes.userToken).toMatchObject({ in: "header", name: "Authorization" });
    expect(schemes.sessionCookie).toMatchObject({ in: "cookie", name: "ddg_session" });
    // Any one of them is enough, so they are alternatives rather than a set.
    expect(document.security).toHaveLength(3);
  });

  test("resolves every reference it makes", () => {
    const defined = new Set([
      ...Object.keys((document.components as any).schemas).map(name => `#/components/schemas/${name}`),
      ...Object.keys((document.components as any).responses).map(name => `#/components/responses/${name}`),
    ]);
    const missing = [...new Set(refsIn(document))].filter(reference => !defined.has(reference));
    expect(missing).toEqual([]);
  });

  test("defines no schema nothing points at", () => {
    const used = new Set(refsIn(document));
    const orphans = Object.keys((document.components as any).schemas).filter(
      name => !used.has(`#/components/schemas/${name}`),
    );
    expect(orphans).toEqual([]);
  });
});

describe("every operation", () => {
  test("has a unique operationId — tools name generated methods after it", () => {
    const ids = operations.map(({ operation }) => operation.operationId);
    expect(ids.filter(Boolean)).toHaveLength(operations.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("is tagged, summarised, and answers something on success", () => {
    for (const { path, method, operation } of operations) {
      const where = `${method.toUpperCase()} ${path}`;
      expect(operation.tags?.length, where).toBeGreaterThan(0);
      expect(operation.summary, where).toBeTruthy();
      const success = Object.keys(operation.responses).filter(status => status.startsWith("2"));
      expect(success.length, where).toBe(1);
    }
  });

  test("documents the failures a caller will actually hit", () => {
    for (const { path, method, operation } of operations) {
      const where = `${method.toUpperCase()} ${path}`;
      expect(operation.responses["400"], where).toBeDefined();
      // Anything guarded refuses an anonymous caller; an open route may still
      // answer 401 on its own terms, as sign-in does for a wrong password.
      const anonymous = Array.isArray(operation.security) && operation.security.length === 0;
      if (!anonymous) expect(operation.responses["401"], where).toBeDefined();
    }
  });

  test("leaves open exactly the routes you need before you have a credential", () => {
    const open = operations
      .filter(({ operation }) => Array.isArray(operation.security) && operation.security.length === 0)
      .map(({ method, path }) => `${method.toUpperCase()} ${path}`);
    expect(open.sort()).toEqual(
      [
        "GET /api",
        "GET /api/health",
        `GET ${OPENAPI_PATH}`,
        "POST /api/auth/register",
        "POST /api/auth/login",
        "POST /api/auth/logout",
      ].sort(),
    );
  });

  test("writes its path the way OpenAPI does, not the way the router does", () => {
    for (const { path } of operations) {
      expect(path.startsWith("/api")).toBe(true);
      expect(path).not.toContain(":");
    }
  });

  test("declares every path parameter it uses", () => {
    for (const { path, method, operation } of operations) {
      const templated = [...path.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
      const declared = (operation.parameters ?? [])
        .filter((parameter: any) => parameter.in === "path")
        .map((parameter: any) => parameter.name);
      expect(declared.sort(), `${method.toUpperCase()} ${path}`).toEqual(templated.sort());
    }
  });

  test("marks a required query parameter as required", () => {
    // `?templateId=` and `?email=` are refused when missing, so a tool should
    // be asking for them rather than sending the request without.
    const script = (document.paths["/api/datasets/{id}/script"] as any).get;
    const templateId = script.parameters.find((parameter: any) => parameter.name === "templateId");
    expect(templateId.required).toBe(true);

    const unshare = (document.paths["/api/configs/{id}/shares"] as any).delete;
    expect(unshare.parameters.find((parameter: any) => parameter.name === "email").required).toBe(true);
  });
});

describe("the schemas", () => {
  test("offer every field type the generator has", () => {
    const field = (document.components as any).schemas.Field;
    expect(field.properties.type.enum).toEqual(FIELD_TYPES.map(type => type.type));
  });

  test("carry every preference, with the default the server would apply", () => {
    const preferences = (document.components as any).schemas.Preferences;
    expect(Object.keys(preferences.properties).sort()).toEqual(Object.keys(DEFAULT_PREFERENCES).sort());
    for (const [key, value] of Object.entries(DEFAULT_PREFERENCES)) {
      expect(preferences.properties[key].default, key).toEqual(value);
    }
  });

  test("say a generated dataset can be absent rather than pretending otherwise", () => {
    const result = (document.components as any).schemas.GenerateResult;
    expect(result.properties.dataset.nullable).toBe(true);
  });
});

describe("the index GET /api prints", () => {
  test("is the same list of endpoints, so the two cannot drift", () => {
    const index = endpointIndex();
    expect(Object.keys(index)).toHaveLength(OPERATIONS.length);
    expect(index["GET    /api/openapi.json"]).toContain("OpenAPI");
    expect(index["DELETE /api/configs/:id"]).toBe("Delete one configuration (owner only)");
  });

  test("writes paths the way the router does", () => {
    for (const line of Object.keys(endpointIndex())) {
      const [method = "", path = ""] = line.split(/\s+/);
      expect(["GET", "POST", "PUT", "DELETE"]).toContain(method);
      expect(path).not.toContain("{");
    }
  });
});
