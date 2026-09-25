/**
 * Reading an OpenAPI document, for the reference page at `?view=docs`.
 *
 * `src/server/lib/openapi.ts` writes the document; this reads one back. It is
 * deliberately the reverse direction and nothing more — no knowledge of this
 * particular API lives here, so the page renders whatever `GET /openapi`
 * serves and a new route appears on it without anything here being touched.
 *
 * Copied from the Bun app's `lib/openapiDoc.ts`. What changed is the
 * credential: there were API keys and user tokens to choose between there, and
 * here there is only the instance session the page is already running under,
 * which `lib/api.ts` attaches when a trial call goes out. So nothing here
 * models a credential, and the cURL command beside a call names Basic auth
 * instead — the page's session token is no use outside the browser.
 *
 * Kept pure and away from React: every rule worth getting right — a `$ref`
 * that points at itself, a path whose parameter is still empty, what a schema
 * looks like as an example — is a function that can be asserted directly.
 */

export type Schema = Record<string, unknown>;

export type Method = "get" | "post" | "put" | "patch" | "delete";

/** The order a path's operations are drawn in, and what counts as one. */
export const METHODS: Method[] = ["get", "post", "put", "patch", "delete"];

export type OpenApiDoc = {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string };
  servers?: { url?: string; description?: string }[];
  tags?: { name?: string; description?: string }[];
  security?: unknown[];
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, Schema>;
    responses?: Record<string, Schema>;
    securitySchemes?: Record<string, Schema>;
  };
};

export type Parameter = {
  name: string;
  /** `path`, `query`, `header` or `cookie`. */
  in: string;
  required: boolean;
  description: string;
  schema: Schema;
};

export type Body = {
  description: string;
  required: boolean;
  mediaType: string;
  schema: Schema;
};

export type ResponseMedia = { mediaType: string; schema: Schema };

export type ApiResponse = {
  status: string;
  description: string;
  media: ResponseMedia[];
};

export type Operation = {
  /** `get /api/configs` — unique, and stable across renders and reloads. */
  key: string;
  method: Method;
  path: string;
  operationId: string;
  summary: string;
  description: string;
  tag: string;
  parameters: Parameter[];
  body: Body | null;
  responses: ApiResponse[];
};

export type TagGroup = { name: string; description: string; operations: Operation[] };

/** Values typed into the parameter boxes, by parameter name. */
export type ParamValues = Record<string, string>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

/* --------------------------------- refs ---------------------------------- */

/** The name a `$ref` ends in — `Config` for `#/components/schemas/Config`. */
export function refName(node: unknown): string | null {
  const ref = asRecord(node).$ref;
  return typeof ref === "string" ? (ref.split("/").pop() ?? null) : null;
}

/** Walks a `#/a/b` pointer through the document. */
function pointer(doc: OpenApiDoc, ref: string): unknown {
  if (!ref.startsWith("#/")) return undefined;
  let node: unknown = doc;
  for (const segment of ref.slice(2).split("/")) {
    const key = segment.replaceAll("~1", "/").replaceAll("~0", "~");
    node = asRecord(node)[key];
    if (node === undefined) return undefined;
  }
  return node;
}

/**
 * A node with its `$ref` followed, however many hops that takes.
 *
 * A reference that leads nowhere, or back to itself, resolves to an empty
 * object rather than throwing: a page that renders most of a document is more
 * use than a blank one, and a document that has drifted is exactly when
 * someone opens this page.
 */
export function resolve(doc: OpenApiDoc, node: unknown): Record<string, unknown> {
  const seen = new Set<string>();
  let current = asRecord(node);

  while (typeof current.$ref === "string") {
    const ref = current.$ref;
    if (seen.has(ref)) return {};
    seen.add(ref);
    current = asRecord(pointer(doc, ref));
  }

  return current;
}

/* ------------------------------- operations ------------------------------- */

function readParameters(doc: OpenApiDoc, raw: unknown): Parameter[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(entry => {
    const node = resolve(doc, entry);
    return {
      name: asString(node.name),
      in: asString(node.in) || "query",
      required: node.required === true,
      description: asString(node.description),
      schema: asRecord(node.schema),
    };
  });
}

/** The first media type of a `content` map, which is the one to show first. */
function firstMedia(content: unknown): { mediaType: string; schema: Schema } | null {
  const [entry] = Object.entries(asRecord(content));
  return entry ? { mediaType: entry[0], schema: asRecord(asRecord(entry[1]).schema) } : null;
}

function readBody(doc: OpenApiDoc, raw: unknown): Body | null {
  if (!raw) return null;
  const node = resolve(doc, raw);
  const media = firstMedia(node.content);
  if (!media) return null;
  return {
    description: asString(node.description),
    required: node.required === true,
    mediaType: media.mediaType,
    schema: media.schema,
  };
}

/** 2xx first, then the failures in numeric order, with `default` last. */
const statusOrder = (status: string) => (status === "default" ? 1000 : Number(status) || 0);

function readResponses(doc: OpenApiDoc, raw: unknown): ApiResponse[] {
  return Object.entries(asRecord(raw))
    .sort(([a], [b]) => statusOrder(a) - statusOrder(b))
    .map(([status, entry]) => {
      const node = resolve(doc, entry);
      return {
        status,
        description: asString(node.description),
        media: Object.entries(asRecord(node.content)).map(([mediaType, value]) => ({
          mediaType,
          schema: asRecord(asRecord(value).schema),
        })),
      };
    });
}

/** Every operation in the document, in the order it was written. */
export function readOperations(doc: OpenApiDoc): Operation[] {
  const operations: Operation[] = [];

  for (const [path, item] of Object.entries(asRecord(doc.paths))) {
    const methods = asRecord(item);
    for (const method of METHODS) {
      const raw = methods[method];
      if (!raw) continue;
      const node = asRecord(raw);
      const tags = node.tags;

      operations.push({
        key: `${method} ${path}`,
        method,
        path,
        operationId: asString(node.operationId),
        summary: asString(node.summary),
        description: asString(node.description),
        tag: (Array.isArray(tags) ? asString(tags[0]) : "") || "Other",
        parameters: readParameters(doc, node.parameters),
        body: readBody(doc, node.requestBody),
        responses: readResponses(doc, node.responses),
      });
    }
  }

  return operations;
}

/**
 * The operations grouped under the document's own tags, in the document's own
 * order — a tag the document declares but never uses is dropped, and one used
 * without being declared still gets a section rather than disappearing.
 */
export function groupByTag(doc: OpenApiDoc, operations: Operation[]): TagGroup[] {
  const declared = (doc.tags ?? []).map(tag => ({
    name: asString(tag.name),
    description: asString(tag.description),
  }));

  const names = [
    ...declared.map(tag => tag.name),
    ...operations.map(operation => operation.tag).filter(name => !declared.some(tag => tag.name === name)),
  ];

  return [...new Set(names)]
    .map(name => ({
      name,
      description: declared.find(tag => tag.name === name)?.description ?? "",
      operations: operations.filter(operation => operation.tag === name),
    }))
    .filter(group => group.operations.length > 0);
}

/**
 * Where an operation sits on the page, for a link and for the browser's own
 * back button. The operationId where there is one — it is already unique and
 * already stable — and the method and path where there is not.
 */
export function anchorId(operation: Operation): string {
  const name = operation.operationId || `${operation.method}-${operation.path}`;
  return `op-${name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

/**
 * Filtering, on everything a reader might type: a path, a word from the
 * summary, a method, a tag, an operationId. Every term has to match something,
 * so terms narrow rather than widen.
 */
export function matches(operation: Operation, search: string): boolean {
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;

  const haystack = [
    operation.method,
    operation.path,
    operation.summary,
    operation.description,
    operation.operationId,
    operation.tag,
  ]
    .join(" ")
    .toLowerCase();

  return terms.every(term => haystack.includes(term));
}

/* -------------------------------- schemas -------------------------------- */

/** What a value of this schema is called, in as few words as it takes. */
export function typeLabel(doc: OpenApiDoc, schema: unknown): string {
  const named = refName(schema);
  const node = resolve(doc, schema);

  if (node.type === "array") return `${typeLabel(doc, node.items)}[]`;
  if (named) return named;

  const alternatives = node.oneOf ?? node.anyOf;
  if (Array.isArray(alternatives) && alternatives.length) {
    return alternatives.map(entry => typeLabel(doc, entry)).join(" | ");
  }
  if (Array.isArray(node.allOf) && node.allOf.length) return "object";

  const type = asString(node.type);
  if (Array.isArray(node.enum)) return `${type || "string"} · enum`;
  if (!type) return node.properties ? "object" : "any";
  return asString(node.format) ? `${type} · ${asString(node.format)}` : type;
}

/** The bounds and defaults worth printing beside a parameter or a property. */
export function constraints(schema: Schema): string[] {
  const notes: string[] = [];
  const say = (key: string, label: string) => {
    if (schema[key] !== undefined) notes.push(`${label} ${String(schema[key])}`);
  };

  say("default", "default");
  say("minimum", "min");
  say("maximum", "max");
  say("minLength", "min length");
  say("maxLength", "max length");
  say("minItems", "min items");
  say("maxItems", "max items");

  return notes;
}

/** A stand-in value for a string, chosen by its format where it has one. */
function stringExample(format: string): string {
  switch (format) {
    case "date-time":
      return new Date().toISOString().replace(/\.\d+Z$/, "Z");
    case "date":
      return new Date().toISOString().slice(0, 10);
    case "email":
      return "you@example.com";
    case "password":
      return "••••••••";
    default:
      return "string";
  }
}

/**
 * A schema as a value someone can edit and send.
 *
 * `example` and `default` win where the document gives them, because they are
 * the author saying what a real value looks like. Recursion stops at a schema
 * that contains itself — a field whose options hold fields, say — rather than
 * unrolling until the stack gives out.
 */
export function exampleFor(doc: OpenApiDoc, schema: unknown, seen: string[] = []): unknown {
  const named = refName(schema);
  if (named && seen.includes(named)) return null;

  const node = resolve(doc, schema);
  const deeper = named ? [...seen, named] : seen;

  if (node.example !== undefined) return node.example;
  if (node.default !== undefined) return node.default;
  if (Array.isArray(node.enum) && node.enum.length) return node.enum[0];

  if (Array.isArray(node.allOf)) {
    return node.allOf.reduce<Record<string, unknown>>(
      (merged, entry) => Object.assign(merged, asRecord(exampleFor(doc, entry, deeper))),
      {},
    );
  }

  const alternatives = node.oneOf ?? node.anyOf;
  if (Array.isArray(alternatives) && alternatives.length) return exampleFor(doc, alternatives[0], deeper);

  if (node.type === "array") return [exampleFor(doc, node.items, deeper)];

  if (node.properties || node.type === "object") {
    const object: Record<string, unknown> = {};
    for (const [name, property] of Object.entries(asRecord(node.properties))) {
      object[name] = exampleFor(doc, property, deeper);
    }
    return object;
  }

  if (node.type === "integer" || node.type === "number") return node.minimum ?? 0;
  if (node.type === "boolean") return true;
  if (node.type === "string") return stringExample(asString(node.format));
  return null;
}

/** The body box's starting text: the example, pretty-printed, or empty. */
export function exampleBody(doc: OpenApiDoc, body: Body | null): string {
  if (!body) return "";
  const example = exampleFor(doc, body.schema);
  return example === null || example === undefined ? "" : `${JSON.stringify(example, null, 2)}\n`;
}

/* -------------------------------- requests -------------------------------- */

/** The server the document names, with any trailing slash taken off. */
export function serverUrl(doc: OpenApiDoc, fallback: string): string {
  const named = asString(doc.servers?.[0]?.url);
  return (named || fallback).replace(/\/+$/, "");
}

/** `{id}` filled in where a value was typed, left in place where it was not. */
export function fillPath(path: string, values: ParamValues): string {
  return path.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = values[name]?.trim();
    return value ? encodeURIComponent(value) : whole;
  });
}

/** `?a=1&b=2` from the query parameters that were given a value. */
export function queryString(parameters: Parameter[], values: ParamValues): string {
  const search = new URLSearchParams();
  for (const parameter of parameters) {
    if (parameter.in !== "query") continue;
    const value = values[parameter.name]?.trim();
    if (value) search.set(parameter.name, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Where the trial request goes: server, path with its holes filled, query. */
export function requestUrl(base: string, operation: Operation, values: ParamValues): string {
  return `${base.replace(/\/+$/, "")}${fillPath(operation.path, values)}${queryString(operation.parameters, values)}`;
}

export type TrialRequest = {
  method: string;
  /** Absolute, so the cURL command works from anywhere. */
  url: string;
  headers: { name: string; value: string }[];
  /** Absent where nothing is sent. */
  body?: string;
};

/**
 * The request the Execute button will send.
 *
 * The session header is not listed: `lib/api.ts` adds it on the way out, and
 * it is no use to anyone reading the request anywhere but in this tab.
 */
export function buildRequest(
  operation: Operation,
  { base, values, body }: { base: string; values: ParamValues; body: string },
): TrialRequest {
  const headers: { name: string; value: string }[] = [{ name: "Accept", value: "application/json" }];
  const sends = body.trim().length > 0 && operation.method !== "get";

  if (sends) headers.push({ name: "Content-Type", value: operation.body?.mediaType ?? "application/json" });

  // A header parameter with a value typed into it is part of the request too.
  for (const parameter of operation.parameters) {
    if (parameter.in !== "header") continue;
    const value = values[parameter.name]?.trim();
    if (value) headers.push({ name: parameter.name, value });
  }

  return {
    method: operation.method.toUpperCase(),
    url: requestUrl(base, operation, values),
    headers,
    ...(sends ? { body } : {}),
  };
}

/** The shell variables the cURL command reads the instance credentials from. */
export const USER_VARIABLE = "SN_USER";
export const PASSWORD_VARIABLE = "SN_PASSWORD";

/**
 * Wraps a value in single quotes for the shell, closing and reopening around
 * each apostrophe so a generated name cannot end the quoted run early.
 */
export function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/**
 * The same request as a cURL command, one flag per line.
 *
 * Authenticated with Basic auth read from shell variables rather than written
 * out, so the command can be pasted into a README or a ticket without carrying
 * a password into it. The credential is the one argument double-quoted,
 * because it is the one place a shell expansion is wanted.
 */
export function trialCurl(request: TrialRequest): string {
  const lines = [
    `curl -X ${request.method} ${shellQuote(request.url)}`,
    `  -u "$${USER_VARIABLE}:$${PASSWORD_VARIABLE}"`,
    ...request.headers.map(header => `  -H ${shellQuote(`${header.name}: ${header.value}`)}`),
  ];
  if (request.body !== undefined) lines.push(`  -d ${shellQuote(request.body)}`);
  return lines.join(" \\\n");
}

/** The whole snippet: the variables to export, then the request. */
export function trialScript(request: TrialRequest): string {
  return [`export ${USER_VARIABLE}=… ${PASSWORD_VARIABLE}=…`, "", trialCurl(request)].join("\n");
}
