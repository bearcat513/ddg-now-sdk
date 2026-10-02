import { useState, type FormEvent } from "react";
import { AlertTriangle, ChevronRight, DatabaseZap, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { api, type TableInsertResult } from "../../lib/api";
import { cn } from "../../lib/utils";
import type { Dataset } from "../../../server/lib/types";

type Props = {
  dataset: Dataset;
  /** The generated columns, flat — what a mapping is written against. */
  columns: string[];
  onError?: (message: string) => void;
};

/** What the platform accepts as a table name, so a typo fails here rather than as a 400. */
const TABLE_NAME = /^[a-z0-9_]+$/i;

/** More than this and the report would be a wall; the rest are counted instead. */
const SHOWN_ERRORS = 5;

/**
 * The data pane's Create records button: the dataset on screen, written into a
 * real table as records.
 *
 * It writes the stored run — the rows this pane is showing, not a fresh draw —
 * so what lands in the table is what was looked at. Columns keep their own name
 * unless one is typed against them, and a column the table has no field for is
 * skipped and named in the report rather than failing the write.
 *
 * The server decides who may: it needs `table_writer`, and the caller's create
 * ACLs on the table. The page cannot know either in advance, so the button is
 * always offered and the refusal, when there is one, is the server's message.
 */
export function InsertRecordsPopover({ dataset, columns, onError }: Props) {
  const [table, setTable] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [skipBusinessRules, setSkipBusinessRules] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TableInsertResult | null>(null);

  const name = table.trim();
  const valid = TABLE_NAME.test(name);
  const mapped = Object.values(mapping).filter(column => column.trim()).length;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setResult(null);
    try {
      setResult(await api.insertDataset(dataset.id, name, { mapping, skipBusinessRules }));
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "The records could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const count = dataset.rowCount.toLocaleString();

  return (
    // A report belongs to the write that made it, so reopening starts clean.
    <Popover onOpenChange={open => !open && setResult(null)}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title={`Create ${count} records in a table from this dataset`}>
          <DatabaseZap />
          <span className="hidden @lg:inline">Create records</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="flex max-h-[min(36rem,80vh)] w-96 flex-col gap-4 overflow-y-auto p-4">
        <form onSubmit={event => void submit(event)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="insert-records-table">Table</Label>
            <Input
              id="insert-records-table"
              autoFocus
              placeholder="incident"
              spellCheck={false}
              autoComplete="off"
              value={table}
              onChange={event => {
                setTable(event.target.value);
                setResult(null);
              }}
              className="h-8 font-mono"
            />
            <p className={cn("text-xs", name && !valid ? "text-destructive" : "text-muted-foreground")}>
              {name && !valid
                ? "A table name is letters, digits and underscores."
                : `Each of the ${count} rows becomes one record, as you — your create access on the table decides.`}
            </p>
          </div>

          <details className="group rounded-md border">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium">
              <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-open:rotate-90" />
              Columns
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {mapped ? `${mapped} renamed` : "same names"}
              </span>
            </summary>
            <div className="flex flex-col gap-1.5 border-t px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Leave a field blank to write the column under its own name.
              </p>
              {columns.map(column => (
                <div key={column} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <span className="truncate font-mono text-xs" title={column}>
                    {column}
                  </span>
                  <span aria-hidden className="text-xs text-muted-foreground">
                    →
                  </span>
                  <Input
                    aria-label={`Table field for ${column}`}
                    placeholder={column}
                    spellCheck={false}
                    autoComplete="off"
                    value={mapping[column] ?? ""}
                    onChange={event => setMapping(current => ({ ...current, [column]: event.target.value }))}
                    className="h-7 font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          </details>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              checked={skipBusinessRules}
              onChange={event => setSkipBusinessRules(event.target.checked)}
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Skip business rules</span>
              <span className="text-xs text-muted-foreground">
                Faster, but the table's own rules and workflows will not run on these records.
              </span>
            </span>
          </label>

          <Button type="submit" size="sm" disabled={!valid || busy}>
            {busy ? <Loader2 className="animate-spin" /> : <DatabaseZap />}
            {busy ? "Creating…" : `Create ${count} records`}
          </Button>
        </form>

        {result && <InsertReport result={result} />}
      </PopoverContent>
    </Popover>
  );
}

function InsertReport({ result }: { result: TableInsertResult }) {
  const failed = result.attempted - result.inserted;
  return (
    <div role="status" className="flex flex-col gap-2 border-t pt-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-sm">
          Created <span className="font-medium">{result.inserted.toLocaleString()}</span> of{" "}
          {result.attempted.toLocaleString()} in <span className="font-mono">{result.table}</span>
        </span>
        {result.inserted > 0 && (
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <a href={api.tableListUrl(result.table)} target="_blank" rel="noreferrer" title="Open the table's list">
              <ExternalLink />
              Open
            </a>
          </Button>
        )}
      </div>

      {result.ignoredColumns.length > 0 && (
        <p className="text-muted-foreground">
          Not written — no such field: <span className="font-mono">{result.ignoredColumns.join(", ")}</span>
        </p>
      )}

      {result.errors.length > 0 && (
        <div className="flex flex-col gap-1 text-destructive">
          <p className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="size-3.5" />
            {failed > 0 ? `${failed.toLocaleString()} rows were not created` : "Problems"}
          </p>
          <ul className="list-inside list-disc">
            {result.errors.slice(0, SHOWN_ERRORS).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          {result.errors.length > SHOWN_ERRORS && <p>…and {result.errors.length - SHOWN_ERRORS} more.</p>}
        </div>
      )}
    </div>
  );
}
