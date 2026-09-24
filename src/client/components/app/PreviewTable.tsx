import { useEffect, useState } from "react";
import { Check, Copy, Database, Download, FileJson, Maximize2, PanelRightClose, Table2 } from "lucide-react";
import { Button } from "../ui/button";
import { RowDetail } from "./RowDetail";
import { api, type ExportFormat } from "../../lib/api";
import { copyToClipboard } from "../../lib/clipboard";
import { valueToText } from "../../../server/lib/rows";
import { cn } from "../../lib/utils";
import type { Dataset } from "../../../server/lib/types";

type Props = {
  dataset: Dataset | null;
  rows: Record<string, unknown>[];
  truncated: boolean;
  /** The format offered first. CSV, unless someone has picked otherwise. */
  preferredFormat: ExportFormat;
  /** Folds the pane away. Absent when the pane cannot be collapsed. */
  onCollapse?: () => void;
  onError?: (message: string) => void;
};

function renderCell(value: unknown) {
  if (value === null || value === undefined) {
    return <span className="italic text-muted-foreground/60">null</span>;
  }
  if (typeof value === "boolean") {
    return <span className={value ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>{String(value)}</span>;
  }
  if (typeof value === "number") return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
  // Arrays and objects (a `nowQuery` result) both read best as compact JSON.
  if (typeof value === "object") return <span className="text-violet-600 dark:text-violet-400">{valueToText(value)}</span>;
  return String(value);
}

/** Shared copy-to-clipboard state: in-flight flag plus a transient tick. */
function useCopyAction(onError?: (message: string) => void) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async (load: () => Promise<string>, fallbackMessage: string) => {
    setCopied(false);
    setCopying(true);
    try {
      await copyToClipboard(await load());
      setCopied(true);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setCopying(false);
    }
  };

  return { copied, copying, copy };
}

/**
 * Download and copy share one source of truth: both pull the stored rows from
 * the export endpoint, so the clipboard holds every row rather than the
 * truncated preview window.
 *
 * All three formats come off one stored file. The run writes JSON and the
 * export endpoint re-serialises it into CSV or SQL on request — which is why
 * asking for a format here never means generating the dataset again.
 */
function ExportButtons({
  dataset,
  preferredFormat,
  onError,
}: {
  dataset: Dataset;
  preferredFormat: ExportFormat;
  onError?: (message: string) => void;
}) {
  const [target, setTarget] = useState<ExportFormat | null>(null);
  const { copied, copying, copy } = useCopyAction(onError);

  async function copyFormat(format: ExportFormat) {
    setTarget(format);
    await copy(() => api.exportText(dataset.id, format), `Could not copy the ${format.toUpperCase()}.`);
  }

  const group = (format: ExportFormat, icon: React.ReactNode, label: string) => (
    <div key={format} className="flex items-center overflow-hidden rounded-md border bg-card shadow-xs">
      <Button
        variant={format === preferredFormat ? "secondary" : "ghost"}
        size="sm"
        asChild
        className="rounded-none"
      >
        <a href={api.exportUrl(dataset.id, format)} download title={`Download all rows as ${label}`}>
          {icon}
          {/* Below a certain pane width the icon carries it alone, so the
              toolbar stays on one line instead of running off the edge. The
              title attribute still names the format. */}
          <span className="hidden @lg:inline">{label}</span>
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-none border-l"
        onClick={() => copyFormat(format)}
        disabled={copying}
        aria-label={`Copy ${label} to clipboard`}
        title={`Copy all ${dataset.rowCount.toLocaleString()} rows as ${label}`}
      >
        {copied && target === format ? (
          <Check className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className={cn(copying && target === format && "animate-pulse")} />
        )}
      </Button>
    </div>
  );

  const groups: Record<ExportFormat, React.ReactNode> = {
    csv: group("csv", <Download />, "CSV"),
    json: group("json", <FileJson />, "JSON"),
    sql: group("sql", <Database />, "SQL"),
  };
  // The preferred format leads; the other two keep their usual order behind it.
  const order: ExportFormat[] = [
    preferredFormat,
    ...(["csv", "json", "sql"] as ExportFormat[]).filter(f => f !== preferredFormat),
  ];

  return <div className="flex flex-wrap items-center gap-2">{order.map(format => groups[format])}</div>;
}

export function PreviewTable({ dataset, rows, truncated, preferredFormat, onCollapse, onError }: Props) {
  /** Index of the record the inspector is showing, or null when it is closed. */
  const [openRow, setOpenRow] = useState<number | null>(null);

  // A fresh generation replaces the rows under the panel, so close it rather
  // than leave it showing record 40 of a dataset that no longer has one.
  useEffect(() => setOpenRow(null), [dataset?.id]);

  /** The way out of the pane, in the same corner whether or not it has data. */
  const collapseButton = onCollapse && (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onCollapse}
      aria-label="Hide the data pane"
      title="Hide the data pane"
    >
      <PanelRightClose />
    </Button>
  );

  if (!rows.length) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
        {collapseButton && <div className="absolute right-2 top-2">{collapseButton}</div>}
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/50">
          <Table2 className="size-7" />
        </span>
        <div className="max-w-xs">
          <p className="text-sm font-medium">No data yet</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Define a schema and hit <span className="font-medium text-foreground">Generate</span> to preview rows
            here.
          </p>
        </div>
      </div>
    );
  }

  const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
  /** A preview run has no record behind it; a generation does. */
  const title = dataset?.name ?? "Preview";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="@container flex flex-wrap items-center justify-between gap-3 border-b bg-card/40 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {dataset ? (
              <>
                <span className="font-medium text-foreground/70">{dataset.rowCount.toLocaleString()}</span> rows ×{" "}
                <span className="font-medium text-foreground/70">{dataset.fieldCount}</span> fields
                {truncated && ` — showing first ${rows.length}`} · saved as a dataset · click a row for the whole
                record
              </>
            ) : (
              <>
                <span className="font-medium text-foreground/70">{rows.length}</span> rows, generated but not
                stored · click a row for the whole record
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Only a stored run has a file to serve. A preview lives in this
              tab and nowhere else, which is the point of it. */}
          {dataset && <ExportButtons dataset={dataset} preferredFormat={preferredFormat} onError={onError} />}
          {collapseButton}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          {/* The header floats over rows that scroll under it, so it carries
              its own background — and its rule is an inset shadow on each
              cell rather than a border, which a collapsed table lets scroll
              away from a sticky row. */}
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur [&_th]:shadow-[inset_0_-1px_0_0_var(--color-border)]">
            <tr>
              <th className="w-10 px-3 py-2 text-right font-medium text-muted-foreground">#</th>
              {headers.map(header => (
                <th
                  key={header}
                  className="whitespace-nowrap px-3 py-2 text-left font-mono text-[11px] font-semibold tracking-tight"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                // The row is the control: a cell is too small a target, and the
                // whole record is what the panel is about.
                tabIndex={0}
                aria-label={`Open record ${index + 1}`}
                className={cn(
                  "group cursor-pointer border-b transition-colors last:border-b-0",
                  // Banded, because an eye tracking one field across forty
                  // columns needs something to stay on.
                  "even:bg-muted/25",
                  "hover:bg-primary/8 focus-visible:bg-primary/8 focus-visible:outline-none",
                )}
                onClick={() => {
                  // Selecting text inside a cell should not also open the panel.
                  if (window.getSelection()?.toString()) return;
                  setOpenRow(index);
                }}
                onKeyDown={event => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  setOpenRow(index);
                }}
              >
                <td className="relative px-3 py-1.5 text-right tabular-nums text-muted-foreground/60">
                  {/* Marks the hovered row down its whole height, so a wide
                      table still says which one is under the pointer. */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-0.5 scale-y-0 bg-primary transition-transform group-hover:scale-y-100 group-focus-visible:scale-y-100"
                  />
                  <span className="group-hover:hidden group-focus-visible:hidden">{index + 1}</span>
                  <Maximize2
                    className="ml-auto hidden size-3 text-primary group-hover:block group-focus-visible:block"
                    aria-hidden
                  />
                </td>
                {headers.map(header => (
                  <td key={header} className="max-w-xs truncate px-3 py-1.5 font-mono" title={valueToText(row[header])}>
                    {renderCell(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openRow !== null && rows[openRow] && (
        <RowDetail
          rows={rows}
          index={openRow}
          datasetName={title}
          truncated={truncated}
          onNavigate={setOpenRow}
          onClose={() => setOpenRow(null)}
          onError={onError}
        />
      )}
    </div>
  );
}
