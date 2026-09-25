import { useState } from "react";
import { ChevronDown, Loader2, Play, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { CodeBlock } from "./CodeBlock";
import { Markdown } from "./Markdown";
import { MethodBadge } from "./MethodBadge";
import { SchemaView } from "./SchemaView";
import { api } from "../../lib/api";
import {
  anchorId,
  buildRequest,
  constraints,
  exampleBody,
  exampleFor,
  requestUrl,
  trialScript,
  typeLabel,
  type ApiResponse,
  type OpenApiDoc,
  type Operation,
  type ParamValues,
  type Parameter,
} from "../../lib/openapiDoc";
import { cn } from "../../lib/utils";

/**
 * One endpoint: what it takes, what it answers with, and a way to call it.
 *
 * Copied from the Bun app's docs card. The call is the point: everything above
 * it is the document rendered, and the panel at the bottom is the request
 * actually going out from this browser. What changed is who it goes out as —
 * there is no credential box any more, because the page is already signed in
 * to the instance and `api.trial` carries that session. A call made here is
 * made as you, with your ACLs, exactly as the rest of the page's calls are.
 */

type Props = {
  doc: OpenApiDoc;
  operation: Operation;
  base: string;
  open: boolean;
  onToggle: () => void;
};

/** What came back from a trial call, or why nothing did. */
type Result =
  | {
      kind: "sent";
      status: number;
      statusText: string;
      ms: number;
      headers: [string, string][];
      body: string;
      /** Pretty-printed rather than raw, so it is coloured as code. */
      json: boolean;
    }
  | { kind: "failed"; message: string };

/** A parameter's own default, so the boxes start where the server would. */
function initialValues(parameters: Parameter[]): ParamValues {
  const values: ParamValues = {};
  for (const parameter of parameters) {
    const fallback = parameter.schema.default;
    if (fallback !== undefined && fallback !== null) values[parameter.name] = String(fallback);
  }
  return values;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="label-caps">{title}</h4>
      {children}
    </section>
  );
}

function ParameterRow({
  doc,
  parameter,
  trying,
  value,
  onChange,
}: {
  doc: OpenApiDoc;
  parameter: Parameter;
  trying: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = parameter.schema.enum;
  const notes = constraints(parameter.schema);
  const id = `param-${parameter.in}-${parameter.name}`;

  return (
    <div className="grid gap-2 border-t py-2.5 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
      <div className="space-y-0.5">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <label htmlFor={id} className="font-mono text-xs font-medium text-foreground">
            {parameter.name}
          </label>
          {parameter.required && <span className="text-[11px] font-medium text-destructive">*</span>}
          <span className="text-[11px] text-muted-foreground/80">{parameter.in}</span>
        </div>
        <p className="font-mono text-[11px] text-primary/80">{typeLabel(doc, parameter.schema)}</p>
        {notes.length > 0 && <p className="text-[11px] text-muted-foreground/80">{notes.join(" · ")}</p>}
      </div>

      <div className="space-y-1.5">
        {parameter.description && <Markdown source={parameter.description} className="text-xs" />}

        {Array.isArray(options) && (
          <p className="font-mono text-[11px] text-muted-foreground">{options.map(String).join(" | ")}</p>
        )}

        {trying && (
          <Input
            id={id}
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder={Array.isArray(options) ? options.map(String).join(" | ") : typeLabel(doc, parameter.schema)}
            className="h-8 font-mono text-xs"
          />
        )}
      </div>
    </div>
  );
}

/** A documented response: its example, or the shape behind it. */
function ResponseRow({ doc, response }: { doc: OpenApiDoc; response: ApiResponse }) {
  const [showSchema, setShowSchema] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);

  const media = response.media[mediaIndex] ?? response.media[0];
  const status = Number(response.status);
  const tone =
    status >= 200 && status < 300
      ? "text-emerald-700 dark:text-emerald-400"
      : status >= 500
        ? "text-red-700 dark:text-red-400"
        : status >= 400
          ? "text-amber-700 dark:text-amber-400"
          : "text-muted-foreground";

  const example = media ? exampleFor(doc, media.schema) : undefined;

  return (
    <div className="space-y-2 border-t py-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cn("font-mono text-xs font-semibold", tone)}>{response.status}</span>
        <p className="flex-1 text-xs text-muted-foreground">{response.description}</p>

        {media && (
          <div className="flex items-center gap-1">
            {response.media.length > 1 &&
              response.media.map((entry, index) => (
                <button
                  key={entry.mediaType}
                  type="button"
                  onClick={() => setMediaIndex(index)}
                  aria-pressed={index === mediaIndex}
                  className={cn(
                    "focus-ring rounded px-1.5 py-0.5 font-mono text-[11px]",
                    index === mediaIndex ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {entry.mediaType}
                </button>
              ))}
            <button
              type="button"
              onClick={() => setShowSchema(!showSchema)}
              className="focus-ring rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {showSchema ? "Example" : "Schema"}
            </button>
          </div>
        )}
      </div>

      {media &&
        (showSchema ? (
          <div className="rounded-lg border bg-background/60 p-3">
            <SchemaView doc={doc} schema={media.schema} />
          </div>
        ) : (
          <CodeBlock
            code={
              media.mediaType === "application/json"
                ? JSON.stringify(example, null, 2)
                : String(example ?? media.mediaType)
            }
            label="the example response"
          />
        ))}
    </div>
  );
}

export function OperationCard({ doc, operation, base, open, onToggle }: Props) {
  const [trying, setTrying] = useState(false);
  const [values, setValues] = useState<ParamValues>(() => initialValues(operation.parameters));
  const [body, setBody] = useState(() => exampleBody(doc, operation.body));
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [showBodySchema, setShowBodySchema] = useState(false);

  const request = buildRequest(operation, { base, values, body });
  const missing = operation.parameters.filter(
    parameter => parameter.required && !values[parameter.name]?.trim(),
  );
  const changes = operation.method !== "get";

  async function execute() {
    setSending(true);
    setResult(null);

    try {
      const response = await api.trial(request);

      let printed = response.body;
      let json = false;
      try {
        printed = JSON.stringify(JSON.parse(response.body), null, 2);
        json = true;
      } catch {
        // A CSV, SQL or script download, or an empty body — shown as it arrived.
      }

      setResult({ kind: "sent", ...response, body: printed, json });
    } catch (error) {
      setResult({
        kind: "failed",
        message: error instanceof Error ? error.message : "The request could not be sent.",
      });
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setValues(initialValues(operation.parameters));
    setBody(exampleBody(doc, operation.body));
    setResult(null);
  }

  const command = trialScript(request);

  return (
    <article id={anchorId(operation)} className="scroll-mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="focus-ring flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
      >
        <MethodBadge method={operation.method} />
        <span className="font-mono text-xs font-medium break-all text-foreground">{operation.path}</span>
        <span className="hidden flex-1 truncate text-xs text-muted-foreground sm:block">{operation.summary}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-5 border-t px-4 py-4">
          <p className="text-xs text-muted-foreground sm:hidden">{operation.summary}</p>
          {operation.description && <Markdown source={operation.description} className="text-xs" />}

          {operation.parameters.length > 0 && (
            <Section title="Parameters">
              <div className="rounded-lg border px-3 py-2">
                {operation.parameters.map(parameter => (
                  <ParameterRow
                    key={`${parameter.in}-${parameter.name}`}
                    doc={doc}
                    parameter={parameter}
                    trying={trying}
                    value={values[parameter.name] ?? ""}
                    onChange={value => setValues({ ...values, [parameter.name]: value })}
                  />
                ))}
              </div>
            </Section>
          )}

          {operation.body && (
            <Section title={`Request body${operation.body.required ? " · required" : ""}`}>
              {operation.body.description && <Markdown source={operation.body.description} className="text-xs" />}

              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">{operation.body.mediaType}</span>
                <button
                  type="button"
                  onClick={() => setShowBodySchema(!showBodySchema)}
                  className="focus-ring rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {showBodySchema ? "Example" : "Schema"}
                </button>
              </div>

              {showBodySchema ? (
                <div className="rounded-lg border bg-background/60 p-3">
                  <SchemaView doc={doc} schema={operation.body.schema} />
                </div>
              ) : trying ? (
                <Textarea
                  value={body}
                  onChange={event => setBody(event.target.value)}
                  spellCheck={false}
                  aria-label="Request body"
                  className="min-h-40 font-mono text-xs"
                />
              ) : (
                <CodeBlock code={body || "{}"} label="the example body" />
              )}
            </Section>
          )}

          {/* ------------------------------ trying ----------------------------- */}

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            {trying ? (
              <>
                <Button size="sm" onClick={execute} disabled={sending}>
                  {sending ? <Loader2 className="animate-spin" /> : <Play />}
                  {sending ? "Sending" : "Execute"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTrying(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="ghost" onClick={reset}>
                  <RotateCcw />
                  Reset
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setTrying(true)}>
                <Play />
                Try it out
              </Button>
            )}

            {trying && missing.length > 0 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Still needs {missing.map(parameter => parameter.name).join(", ")}.
              </p>
            )}
            {trying && changes && (
              <p className="text-[11px] text-muted-foreground">
                Runs as you, on this instance — it changes real records.
              </p>
            )}
          </div>

          {trying && (
            <Section title="Request">
              <p className="font-mono text-xs break-all text-muted-foreground">
                {request.method} {requestUrl(base, operation, values)}
              </p>
              <CodeBlock code={command} plain label="the cURL command" />
            </Section>
          )}

          {result && (
            <Section title="Response">
              {result.kind === "failed" ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {result.message}
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline gap-x-3 text-xs">
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        result.status < 300
                          ? "text-emerald-700 dark:text-emerald-400"
                          : result.status < 500
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-red-700 dark:text-red-400",
                      )}
                    >
                      {result.status} {result.statusText}
                    </span>
                    <span className="text-muted-foreground">{result.ms} ms</span>
                  </div>

                  <CodeBlock code={result.body || "(no body)"} plain={!result.json} label="the response" />

                  <details className="text-xs">
                    <summary className="focus-ring cursor-pointer rounded text-muted-foreground hover:text-foreground">
                      Response headers
                    </summary>
                    <CodeBlock
                      className="mt-2"
                      plain
                      code={result.headers.map(([name, value]) => `${name}: ${value}`).join("\n")}
                      label="the response headers"
                    />
                  </details>
                </>
              )}
            </Section>
          )}

          {operation.responses.length > 0 && (
            <Section title="Responses">
              <div className="rounded-lg border px-3 py-2">
                {operation.responses.map(response => (
                  <ResponseRow key={response.status} doc={doc} response={response} />
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </article>
  );
}
