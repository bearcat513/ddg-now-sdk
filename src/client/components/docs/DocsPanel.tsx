import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, BookOpen, ChevronDown, Download, Loader2, Search, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CodeBlock } from "./CodeBlock";
import { Markdown } from "./Markdown";
import { MethodBadge } from "./MethodBadge";
import { OperationCard } from "./OperationCard";
import { SchemaView } from "./SchemaView";
import { api } from "../../lib/api";
import { anchorId, groupByTag, matches, readOperations, type OpenApiDoc, type Schema } from "../../lib/openapiDoc";
import { cn } from "../../lib/utils";

/**
 * The API reference: the document at `GET /openapi`, rendered, and callable.
 *
 * The Bun app's `/docs` page, moved inside the workspace as the `?view=docs`
 * view. It was its own entry point there because it was read by people who
 * were not signed in; here nobody reaches the page without an instance
 * session, so it is a view like settings, with the nav beside it.
 *
 * It reads the same bytes Postman would — nothing about this API is written
 * down here — so a route added to `src/server/lib/openapi.ts` appears on this
 * page with nothing else to change, and a page that disagreed with the
 * document would be a bug in the document.
 *
 * What it dropped is the credential box. Every trial call here goes out on the
 * session the page already has, so there is nothing to paste, and the cURL
 * command beside each call names Basic auth for use anywhere else.
 */

type Props = {
  onClose: () => void;
  /** Rendered at the start of the header — the sidebar control, when it is away. */
  leading?: ReactNode;
};

const tagAnchor = (name: string) => `tag-${name.replace(/\s+/g, "-").toLowerCase()}`;

/** Scrolls to a section without writing a hash: the page's URL is its query. */
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" });

/** One `components.schemas` entry, opened on demand. */
function Model({ doc, name, schema }: { doc: OpenApiDoc; name: string; schema: Schema }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
      >
        <span className="font-mono text-xs font-medium">{name}</span>
        <span className="flex-1 truncate text-xs text-muted-foreground">
          {typeof schema.description === "string" ? schema.description : ""}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t px-4 py-3">
          <SchemaView doc={doc} schema={schema} seen={[name]} />
        </div>
      )}
    </div>
  );
}

export function DocsPanel({ onClose, leading }: Props) {
  const [doc, setDoc] = useState<OpenApiDoc | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  /** Which operations are expanded, by anchor. */
  const [open, setOpen] = useState<string[]>([]);
  const searchBox = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .openApiDocument()
      .then(setDoc)
      .catch(reason => setError(reason instanceof Error ? reason.message : "The document could not be read."));
  }, []);

  /** `/` focuses the filter, the way every reference page people already use does. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (event.key === "/" && !typing && !target?.isContentEditable) {
        event.preventDefault();
        searchBox.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const operations = useMemo(() => (doc ? readOperations(doc) : []), [doc]);
  const groups = useMemo(() => (doc ? groupByTag(doc, operations) : []), [doc, operations]);

  const filtered = useMemo(
    () =>
      groups
        .map(group => ({ ...group, operations: group.operations.filter(operation => matches(operation, search)) }))
        .filter(group => group.operations.length > 0),
    [groups, search],
  );

  const base = api.apiBaseUrl();
  const schemas = Object.entries(doc?.components?.schemas ?? {});

  function toggle(anchor: string) {
    setOpen(current => (current.includes(anchor) ? current.filter(entry => entry !== anchor) : [...current, anchor]));
  }

  /** The document already on screen, saved — the same bytes `GET /openapi` served. */
  function download() {
    if (!doc) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = api.openApiFileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b bg-card/40 px-4 py-3">
        {leading}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <BookOpen className="size-4" />
        </span>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-sm font-semibold leading-tight tracking-tight">
            {doc?.info?.title ?? "API reference"}
            {doc?.info?.version && (
              <span className="rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-normal text-muted-foreground">
                v{doc.info.version}
              </span>
            )}
          </h1>
          <p className="truncate font-mono text-[11px] text-muted-foreground">{base}</p>
        </div>

        <div className="relative ml-auto min-w-44 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchBox}
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Filter endpoints  /"
            aria-label="Filter endpoints"
            className="h-8 pl-8 text-xs"
          />
        </div>

        <Button variant="ghost" size="sm" onClick={download} disabled={!doc}>
          <Download />
          <span className="hidden sm:inline">Spec</span>
        </Button>

        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close the API reference" title="Back to the editor">
          <X />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-16 text-center">
            <AlertCircle className="size-6 text-destructive" />
            <h2 className="text-sm font-semibold">The API document could not be loaded</h2>
            <p className="text-xs text-muted-foreground">
              {error} It is served from <span className="font-mono">{base}/openapi</span> — if that fails, the app's
              REST API is probably not installed on this instance, or its ACL refused you.
            </p>
          </div>
        ) : !doc ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Reading the API document…
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
            {/* ------------------------------ contents ----------------------------- */}
            <nav className="hidden lg:block" aria-label="Sections">
              <div className="sticky top-0 space-y-4">
                <div className="space-y-1">
                  {filtered.map(group => (
                    <button
                      key={group.name}
                      type="button"
                      onClick={() => scrollTo(tagAnchor(group.name))}
                      className="focus-ring flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {group.name}
                      <span className="text-[11px] text-muted-foreground/70">{group.operations.length}</span>
                    </button>
                  ))}
                </div>

                {schemas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => scrollTo("models")}
                    className="focus-ring flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Models
                    <span className="text-[11px] text-muted-foreground/70">{schemas.length}</span>
                  </button>
                )}
              </div>
            </nav>

            <main className="min-w-0 space-y-6">
              {doc.info?.description && (
                <section className="rounded-xl border bg-card p-4 shadow-sm">
                  <Markdown source={doc.info.description} />
                  <div className="mt-3 border-t pt-3">
                    <p className="label-caps mb-1">Import it instead</p>
                    <CodeBlock code={`${base}/openapi`} plain label="the document's URL" />
                  </div>
                </section>
              )}

              {filtered.length === 0 && (
                <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Nothing matches “{search}”.
                </p>
              )}

              {filtered.map(group => (
                <section key={group.name} id={tagAnchor(group.name)} className="scroll-mt-4 space-y-2">
                  <div>
                    <h2 className="text-sm font-semibold">{group.name}</h2>
                    {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                  </div>

                  <div className="space-y-2">
                    {group.operations.map(operation => (
                      <OperationCard
                        key={operation.key}
                        doc={doc}
                        operation={operation}
                        base={base}
                        open={open.includes(anchorId(operation))}
                        onToggle={() => toggle(anchorId(operation))}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {schemas.length > 0 && (
                <section id="models" className="scroll-mt-4 space-y-2">
                  <div>
                    <h2 className="text-sm font-semibold">Models</h2>
                    <p className="text-xs text-muted-foreground">
                      The shapes the endpoints above send and answer with, as the document declares them.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {schemas.map(([name, schema]) => (
                      <Model key={name} doc={doc} name={name} schema={schema} />
                    ))}
                  </div>
                </section>
              )}

              <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-4 text-[11px] text-muted-foreground">
                <span>
                  {operations.length} endpoints, rendered from <span className="font-mono">GET /openapi</span>.
                </span>
                <span className="flex items-center gap-1">
                  <MethodBadge method="get" className="w-auto px-1" /> is safe to try;
                </span>
                <span>anything else changes records on this instance.</span>
              </footer>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
