/**
 * The API preview: the request the editor would send, written out as a cURL
 * command someone can paste into a terminal or a CI job.
 *
 * Kept pure and away from React so the command can be asserted exactly. The
 * request is modelled first and rendered second, because the dialog shows the
 * method and URL on their own before showing the whole command.
 */

import { toPortableField, type PortableField } from "./configFile";
import type { Field } from "./types";

/** The header an API key travels in. Matches API_KEY_HEADER on the server. */
export const API_KEY_HEADER = "X-API-Key";

/** The shell variable the copied command reads the key from. */
export const API_KEY_VARIABLE = "DDG_API_KEY";

/** Empty means the JSON envelope; the rest are file downloads. */
export type PreviewFormat = "" | "csv" | "json" | "sql";

/** The two ways to generate: from the schema on screen, or from a stored one. */
export type PreviewTarget =
  | {
      kind: "inline";
      name: string;
      rowCount: number;
      seed: string;
      locale: string;
      /** Ties the dataset to a configuration, exactly as the editor does. */
      configId: string | null;
      fields: Field[];
    }
  | {
      kind: "config";
      configId: string;
      /** What the configuration is called on the server, to know what to override. */
      configName: string;
      name: string;
      rowCount: number;
      seed: string;
      locale: string;
    };

export type PreviewOptions = {
  format: PreviewFormat;
  /** `false` adds `?save=false`: nothing is persisted and every row comes back. */
  save: boolean;
  /** Rows returned inline. 0 means "all", which the server spells as `limit=0`. */
  limit: number;
  /** Where the server is reachable, without a trailing slash. */
  baseUrl: string;
};

/**
 * What `toCurl` needs of a request, and no more.
 *
 * Named because the docs page composes requests of its own — any method, any
 * path in the document — and they are curled by this same function rather than
 * by a second one that would quote the shell slightly differently.
 */
export type CurlRequest = {
  method: string;
  /** Absolute, so the command works from anywhere. */
  url: string;
  headers: { name: string; value: string }[];
  /** Pretty-printed JSON where there is a body; absent where there is none. */
  body?: string;
};

export type PreviewRequest = CurlRequest & {
  method: "POST";
  path: string;
};

export const DEFAULT_PREVIEW_OPTIONS: PreviewOptions = {
  format: "",
  save: true,
  limit: 100,
  baseUrl: "",
};

/** What `?format=` does to the response, in one line, for the dialog. */
export const FORMAT_LABELS: Record<PreviewFormat, string> = {
  "": "JSON envelope",
  json: "JSON file",
  csv: "CSV file",
  sql: "SQL inserts",
};

/**
 * The body of an inline generate call: the same shape the editor POSTs, with
 * field ids stripped — they are the browser's bookkeeping, and the server
 * assigns its own.
 */
export function inlineBody(target: Extract<PreviewTarget, { kind: "inline" }>): {
  fields: PortableField[];
  rowCount: number;
  seed: string;
  locale: string;
  name: string;
  configId?: string;
} {
  return {
    name: target.name,
    rowCount: target.rowCount,
    seed: target.seed,
    locale: target.locale,
    fields: target.fields.map(toPortableField),
    ...(target.configId ? { configId: target.configId } : {}),
  };
}

/** `?a=1&b=2`, or nothing at all when no option departs from the default. */
function queryString(pairs: [string, string][]): string {
  if (!pairs.length) return "";
  const search = new URLSearchParams(pairs);
  return `?${search}`;
}

/** The generate options every target shares. */
function optionParams(options: PreviewOptions): [string, string][] {
  const pairs: [string, string][] = [];
  if (options.format) pairs.push(["format", options.format]);
  if (!options.save) pairs.push(["save", "false"]);
  // A file download carries every row already, and an unsaved run returns them
  // all, so the row window is only worth sending when it can change something.
  if (options.save && !options.format && options.limit !== DEFAULT_PREVIEW_OPTIONS.limit) {
    pairs.push(["limit", String(options.limit)]);
  }
  return pairs;
}

export function buildRequest(target: PreviewTarget, options: PreviewOptions): PreviewRequest {
  const base = options.baseUrl.replace(/\/+$/, "");

  if (target.kind === "inline") {
    const path = `/api/generate${queryString(optionParams(options))}`;
    return {
      method: "POST",
      path,
      url: `${base}${path}`,
      headers: [
        { name: "Content-Type", value: "application/json" },
        { name: API_KEY_HEADER, value: `$${API_KEY_VARIABLE}` },
      ],
      body: JSON.stringify(inlineBody(target), null, 2),
    };
  }

  // A stored schema carries its own row count, seed, locale and name; the
  // query string only has to say where the editor now disagrees with it.
  const overrides: [string, string][] = [["rows", String(target.rowCount)]];
  if (target.seed) overrides.push(["seed", target.seed]);
  if (target.locale) overrides.push(["locale", target.locale]);
  if (target.name && target.name !== target.configName) overrides.push(["name", target.name]);

  const path = `/api/configs/${encodeURIComponent(target.configId)}/generate${queryString([
    ...overrides,
    ...optionParams(options),
  ])}`;

  return {
    method: "POST",
    path,
    url: `${base}${path}`,
    headers: [{ name: API_KEY_HEADER, value: `$${API_KEY_VARIABLE}` }],
  };
}

/**
 * Wraps a value in single quotes for the shell.
 *
 * Generated names and enum values can contain an apostrophe, which would end
 * the quoted run and leave a command that does something else entirely, so the
 * usual `'\''` dance closes and reopens around each one.
 */
export function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/**
 * The request as a cURL command, one flag per line.
 *
 * The key header is double-quoted, alone among the arguments, because it is
 * the one place a shell expansion is wanted rather than escaped.
 */
export function toCurl(request: CurlRequest): string {
  const lines = [`curl -X ${request.method} ${shellQuote(request.url)}`];

  for (const header of request.headers) {
    const literal = `${header.name}: ${header.value}`;
    lines.push(header.value.startsWith("$") ? `  -H "${literal}"` : `  -H ${shellQuote(literal)}`);
  }

  if (request.body !== undefined) lines.push(`  -d ${shellQuote(request.body)}`);

  return lines.join(" \\\n");
}

/** The whole snippet: export the key, then run the request. */
export function toCurlScript(request: PreviewRequest): string {
  return [`export ${API_KEY_VARIABLE}=pk_…`, "", toCurl(request)].join("\n");
}
