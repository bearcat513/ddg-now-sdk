import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { rowToJson, valueToText, type Row } from "@/lib/rows";
import { cn } from "@/lib/utils";

type Props = {
  rows: Row[];
  /** Index into `rows` of the record on show. */
  index: number;
  /** Name of the dataset these rows came from. */
  datasetName: string;
  /** True when `rows` is only the first page of a larger dataset. */
  truncated: boolean;
  onNavigate: (index: number) => void;
  onClose: () => void;
  onError?: (message: string) => void;
};

/** A string worth giving its own block: long, or carrying its own line breaks. */
function isBlockText(value: unknown): value is string {
  return typeof value === "string" && (value.includes("\n") || value.length > 80);
}

/**
 * One value, at full length.
 *
 * The table truncates every cell to a line, which is fine for an ID and
 * useless for a stack trace, a markdown block or an array of line items —
 * so this is the one place that renders a value whole. The type colours match
 * the table's, so a number reads as a number in both.
 */
function DetailValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="italic text-muted-foreground/60">null</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span className={value ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>{String(value)}</span>
    );
  }
  if (typeof value === "number") {
    return <span className="text-blue-600 dark:text-blue-400 tabular-nums">{value}</span>;
  }
  if (typeof value === "object") {
    // Pretty-printed rather than the table's compact form: an array of objects
    // is the whole reason someone opened this panel.
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-violet-600 dark:text-violet-400">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  if (value === "") {
    // An empty string and a null look identical otherwise, and an edge-case
    // field exists precisely to tell them apart.
    return <span className="italic text-muted-foreground/60">empty string</span>;
  }
  if (isBlockText(value)) {
    return <p className="whitespace-pre-wrap break-words">{value}</p>;
  }
  // Everything above has been narrowed away; whatever is left is short text.
  return <span className="break-words">{String(value)}</span>;
}

/** Copies one value, and ticks for a moment to say it worked. */
function CopyValue({ text, label, onError }: { text: string; label: string; onError?: (message: string) => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await copyToClipboard(text);
          setCopied(true);
        } catch (error) {
          onError?.(error instanceof Error ? error.message : "Could not copy that value.");
        }
      }}
    >
      {copied ? <Check className="text-emerald-600 dark:text-emerald-400" /> : <Copy />}
    </Button>
  );
}

/**
 * The full record behind one preview row.
 *
 * It reads from the rows already on screen rather than fetching: the preview
 * window is in memory, so stepping through records is instant and works
 * offline of the API. When the preview is only the first page of a larger
 * dataset, the header says so — the panel can only reach what was fetched.
 */
export function RowDetail({ rows, index, datasetName, truncated, onNavigate, onClose, onError }: Props) {
  const row = rows[index];
  const [copiedRow, setCopiedRow] = useState(false);

  const hasPrevious = index > 0;
  const hasNext = index < rows.length - 1;

  useEffect(() => {
    if (!copiedRow) return;
    const timer = setTimeout(() => setCopiedRow(false), 1500);
    return () => clearTimeout(timer);
  }, [copiedRow]);

  // Escape closes; the arrow keys walk the records without reaching for the
  // mouse, which is the point of having next and previous at all.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        if (index < rows.length - 1) {
          event.preventDefault();
          onNavigate(index + 1);
        }
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        if (index > 0) {
          event.preventDefault();
          onNavigate(index - 1);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, rows.length, onNavigate, onClose]);

  if (!row) return null;

  const entries = Object.entries(row);

  async function copyRow() {
    try {
      await copyToClipboard(rowToJson(row!));
      setCopiedRow(true);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Could not copy the record.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
      onClick={event => event.target === event.currentTarget && onClose()}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col border-l bg-background shadow-xl animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={`Record ${index + 1} of ${rows.length}`}
      >
        <header className="flex items-start gap-2 border-b bg-muted/30 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold leading-tight">
              Record {(index + 1).toLocaleString()}{" "}
              <span className="font-normal text-muted-foreground">of {rows.length.toLocaleString()}</span>
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {datasetName} · {entries.length} field{entries.length === 1 ? "" : "s"}
              {truncated && " · of the rows fetched into the preview"}
            </p>
          </div>

          <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={copyRow}>
            {copiedRow ? <Check className="text-emerald-600 dark:text-emerald-400" /> : <Copy />}
            {copiedRow ? "Copied" : "Copy JSON"}
          </Button>

          <div className="flex shrink-0 items-center overflow-hidden rounded-md border">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-none"
              disabled={!hasPrevious}
              onClick={() => onNavigate(index - 1)}
              aria-label="Previous record"
              title="Previous record (↑)"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-none border-l"
              disabled={!hasNext}
              onClick={() => onNavigate(index + 1)}
              aria-label="Next record"
              title="Next record (↓)"
            >
              <ChevronRight />
            </Button>
          </div>

          <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          <dl className="divide-y">
            {entries.map(([column, value]) => (
              <div
                key={column}
                className="group grid grid-cols-1 gap-x-3 gap-y-1 px-4 py-2.5 hover:bg-muted/40 sm:grid-cols-[minmax(7rem,13rem)_1fr]"
              >
                <dt className="break-words pt-0.5 font-mono text-[11px] text-muted-foreground">{column}</dt>
                <dd className="flex min-w-0 items-start gap-1 font-mono text-xs">
                  <div className={cn("min-w-0 flex-1", typeof value === "object" && value !== null && "overflow-hidden")}>
                    <DetailValue value={value} />
                  </div>
                  <CopyValue
                    text={typeof value === "object" && value !== null ? JSON.stringify(value, null, 2) : valueToText(value)}
                    label={`Copy ${column}`}
                    onError={onError}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
