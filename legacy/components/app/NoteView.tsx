import { Fragment } from "react";
import { FileCode2, FileStack, ListTree, StickyNote, TriangleAlert } from "lucide-react";
import { parseMarkdown, type Block, type Span } from "@/lib/markdown";
import {
  missingReference,
  referenceKey,
  referenceKind,
  REFERENCE_LABELS,
  type ReferenceKind,
  type ResolvedField,
  type ResolvedReference,
} from "@/lib/notes";
import { cn } from "@/lib/utils";

/**
 * A note, rendered.
 *
 * Spans arrive already parsed, so every mark lands as a React element and
 * nothing written in a note can reach the page as markup — the same guarantee
 * the docs page relies on, for text that is far more freely written.
 *
 * A `[[…]]` reference is drawn as a chip carrying whatever the record is
 * called *now*, because that is the whole point of storing the id rather than
 * the name. One that did not resolve is still drawn, marked, and still
 * clickable-looking nowhere: a note that mentions a deleted dataset should say
 * so, not quietly drop the sentence's subject.
 *
 * A reference that names a field shows that field's value instead of the
 * record's name. Where the value is a table — an array, an object — it cannot
 * sit inside a sentence, so a paragraph is split around it and the table is
 * drawn between the halves. Inside a heading, a list item or a quote there is
 * nowhere to put a table, so it stays a chip that says how much it stands for.
 */

const KIND_ICONS: Record<ReferenceKind, React.ComponentType<{ className?: string }>> = {
  config: ListTree,
  dataset: FileStack,
  "script-template": FileCode2,
  note: StickyNote,
};

type Resolve = (id: string, field: string) => ResolvedReference | undefined;
type OpenReference = (reference: ResolvedReference) => void;

/**
 * What a reference resolved to, or null while nothing has answered yet.
 *
 * An id whose prefix names no collection is answered here rather than waited
 * on: nothing will ever resolve it — the server drops it before it reads
 * anything — so a chip left pending would spin for as long as the note is
 * open. `[[not_a_record]]` is a broken reference, and says so at once.
 */
function look(resolve: Resolve, id: string, field: string): ResolvedReference | undefined {
  if (!referenceKind(id)) return missingReference({ id, field });
  return resolve(id, field);
}

/** Whether a resolved reference wants a block of its own. */
const isBlockValue = (reference: ResolvedReference | undefined): boolean =>
  reference?.field?.shape === "table" || reference?.field?.shape === "text";

/* -------------------------------- the chip ------------------------------- */

function ReferenceChip({
  reference,
  field,
  onOpen,
}: {
  reference: ResolvedReference | undefined;
  /** The field asked for, which is known even before anything resolves it. */
  field: string;
  onOpen?: OpenReference;
}) {
  // Nothing has come back for this reference yet — the resolver is still out.
  // Shown as a mark rather than as an empty chip, so the line keeps its width
  // and does not jump when the answer lands.
  if (!reference) {
    return <span className="chip-ref animate-pulse font-mono">…</span>;
  }

  const resolvedField = reference.field;

  // A scalar reads as what it is: the point of `[[cfg_1#rowCount]]` in a
  // sentence is the number, not a chip saying a number is available.
  if (resolvedField?.shape === "value") {
    return (
      <span className="chip-ref-value" title={`${reference.label} · ${resolvedField.path}`}>
        {resolvedField.value || "—"}
      </span>
    );
  }

  const Icon = reference.found ? KIND_ICONS[reference.kind] : TriangleAlert;
  const broken = !reference.found || resolvedField?.shape === "missing";

  const label = field ? `${reference.label} › ${field}` : reference.label;
  const title = broken
    ? resolvedField?.shape === "missing"
      ? `${reference.label} has no field "${field}"`
      : `${reference.id} — deleted, or never yours to read`
    : `${REFERENCE_LABELS[reference.kind]} · ${reference.detail} · ${reference.id}`;

  const content = (
    <>
      <Icon className="size-3 shrink-0" />
      <span className="truncate">{label}</span>
      {/* Standing in for a table that had nowhere to go — say how big it is. */}
      {resolvedField?.shape === "table" && (
        <span className="shrink-0 opacity-70">
          ({resolvedField.total.toLocaleString()})
        </span>
      )}
    </>
  );

  if (broken || !onOpen) {
    return (
      <span className={cn("chip-ref", broken && "chip-ref-missing")} title={title}>
        {content}
      </span>
    );
  }

  return (
    <button type="button" onClick={() => onOpen(reference)} className="chip-ref chip-ref-open" title={title}>
      {content}
    </button>
  );
}

/* ------------------------------- the blocks ------------------------------ */

/** A field's value, drawn as the block it needs. */
function FieldBlock({
  reference,
  field,
  onOpen,
}: {
  reference: ResolvedReference;
  field: ResolvedField;
  onOpen?: OpenReference;
}) {
  const Icon = KIND_ICONS[reference.kind];

  /** Says what is being quoted, and gets you to the record it came from. */
  const caption = (extra?: string) => (
    <figcaption className="flex items-center gap-1.5 px-0.5 pb-1 text-[11px] text-muted-foreground">
      <Icon className="size-3 shrink-0" />
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(reference)}
          className="focus-ring rounded font-medium text-foreground underline decoration-dotted underline-offset-2 hover:decoration-solid"
        >
          {reference.label}
        </button>
      ) : (
        <span className="font-medium text-foreground">{reference.label}</span>
      )}
      <span aria-hidden>›</span>
      <span className="font-mono">{field.path}</span>
      {extra && <span className="ml-auto tabular-nums">{extra}</span>}
    </figcaption>
  );

  if (field.shape === "text") {
    return (
      <figure className="my-3">
        {caption()}
        <pre className="overflow-x-auto rounded-md border bg-muted/40 p-2.5 font-mono text-xs leading-relaxed">
          <code>{field.value}</code>
        </pre>
      </figure>
    );
  }

  if (field.shape !== "table") return null;

  const shown = field.rows.length;
  const summary =
    field.total === 0
      ? "empty"
      : field.truncated
        ? `${shown} of ${field.total.toLocaleString()}`
        : `${field.total.toLocaleString()} ${field.total === 1 ? "row" : "rows"}`;

  return (
    <figure className="my-3">
      {caption(summary)}
      {field.total === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground/70">
          Nothing here yet.
        </p>
      ) : (
        // Its own scroller: a wide table is the one thing in a note allowed to
        // be wider than the note, and nothing else should move with it.
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b bg-muted/40">
                {field.columns.map(column => (
                  <th
                    key={column}
                    scope="col"
                    className="whitespace-nowrap px-2.5 py-1.5 text-left font-medium text-muted-foreground"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {field.rows.map((row, index) => (
                <tr key={index} className="border-b last:border-b-0 hover:bg-accent/30">
                  {row.map((value, column) => (
                    <td key={column} className="max-w-64 truncate px-2.5 py-1 align-top" title={value}>
                      {value || <span className="text-muted-foreground/40">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(field.truncated || field.hiddenColumns > 0) && (
        <p className="px-0.5 pt-1 text-[11px] text-muted-foreground/70">
          {field.truncated && `Showing the first ${shown}. `}
          {field.hiddenColumns > 0 &&
            `${field.hiddenColumns} more column${field.hiddenColumns === 1 ? "" : "s"} not shown. `}
          Open the record for all of it.
        </p>
      )}
    </figure>
  );
}

/* -------------------------------- the spans ------------------------------ */

function Spans({ spans, resolve, onOpen }: { spans: Span[]; resolve: Resolve; onOpen?: OpenReference }) {
  return (
    <>
      {spans.map((span, index) => (
        <Fragment key={index}>
          {span.kind === "code" ? (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{span.text}</code>
          ) : span.kind === "strong" ? (
            <strong className="font-semibold text-foreground">{span.text}</strong>
          ) : span.kind === "reference" ? (
            <ReferenceChip reference={look(resolve, span.id, span.field)} field={span.field} onOpen={onOpen} />
          ) : span.kind === "link" ? (
            <a
              href={span.href}
              target="_blank"
              className="text-primary underline underline-offset-2 hover:no-underline"
              rel="noreferrer noopener"
            >
              {span.text}
            </a>
          ) : (
            span.text
          )}
        </Fragment>
      ))}
    </>
  );
}

/**
 * A paragraph, split around any reference that has to be a block.
 *
 * The spans either side stay paragraphs, so prose written around a table reads
 * as prose written around a table. A paragraph with nothing but the reference
 * in it produces the table alone, which is the way most of them are written.
 */
function Paragraph({ spans, resolve, onOpen }: { spans: Span[]; resolve: Resolve; onOpen?: OpenReference }) {
  const parts: React.ReactNode[] = [];
  let run: Span[] = [];

  const flush = () => {
    // Whitespace either side of a block is not a paragraph, it is the gap the
    // block already leaves.
    if (run.some(span => span.kind !== "text" || span.text.trim())) {
      parts.push(
        <p key={`p${parts.length}`} className="my-2 leading-relaxed first:mt-0 last:mb-0">
          <Spans spans={run} resolve={resolve} onOpen={onOpen} />
        </p>,
      );
    }
    run = [];
  };

  for (const span of spans) {
    if (span.kind !== "reference") {
      run.push(span);
      continue;
    }

    const reference = look(resolve, span.id, span.field);
    if (!isBlockValue(reference)) {
      run.push(span);
      continue;
    }

    flush();
    parts.push(
      <FieldBlock key={`b${parts.length}`} reference={reference!} field={reference!.field!} onOpen={onOpen} />,
    );
  }

  flush();
  return <>{parts}</>;
}

/** Headings run h2–h4: a note sits inside the editor, under the page's own. */
const HEADING_CLASS = ["text-base", "text-sm", "text-sm"] as const;

function Blocks({ blocks, resolve, onOpen }: { blocks: Block[]; resolve: Resolve; onOpen?: OpenReference }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          const Tag = `h${Math.min(block.level + 1, 6)}` as "h2";
          return (
            <Tag
              key={index}
              className={cn(
                "mt-4 mb-1.5 font-semibold text-foreground first:mt-0",
                HEADING_CLASS[Math.min(block.level, 3) - 1],
              )}
            >
              <Spans spans={block.spans} resolve={resolve} onOpen={onOpen} />
            </Tag>
          );
        }

        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={index}
              className={cn(
                "my-2 space-y-1 pl-5 marker:text-muted-foreground/60",
                block.ordered ? "list-decimal" : "list-disc",
              )}
            >
              {block.items.map((item, position) => (
                <li key={position}>
                  <Spans spans={item} resolve={resolve} onOpen={onOpen} />
                </li>
              ))}
            </List>
          );
        }

        if (block.kind === "quote") {
          return (
            <blockquote key={index} className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground">
              <Spans spans={block.spans} resolve={resolve} onOpen={onOpen} />
            </blockquote>
          );
        }

        if (block.kind === "code") {
          return (
            <pre
              key={index}
              className="my-2 overflow-x-auto rounded-md border bg-muted/40 p-2.5 font-mono text-xs leading-relaxed"
            >
              <code>{block.text}</code>
            </pre>
          );
        }

        return <Paragraph key={index} spans={block.spans} resolve={resolve} onOpen={onOpen} />;
      })}
    </>
  );
}

export function NoteView({
  source,
  resolve,
  onOpen,
  className,
}: {
  source: string;
  /** What a reference points at, as far as this reader is allowed to know. */
  resolve: Resolve;
  /** Opens the referenced record. Absent where a chip should not be a control. */
  onOpen?: OpenReference;
  className?: string;
}) {
  if (!source.trim()) {
    return (
      <p className={cn("text-sm italic text-muted-foreground/60", className)}>
        Nothing written yet — the preview fills in as you type.
      </p>
    );
  }

  return (
    <div className={cn("text-sm text-foreground", className)}>
      <Blocks blocks={parseMarkdown(source)} resolve={resolve} onOpen={onOpen} />
    </div>
  );
}

/** The key a resolver's table is keyed by — exported so callers agree on it. */
export const viewReferenceKey = (id: string, field: string) => referenceKey({ id, field });
