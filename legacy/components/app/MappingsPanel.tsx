import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type ConfigColumns } from "@/lib/api";
import { mappableFields, newMapping, MAPPING_LIMITS } from "@/lib/mappings";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import type { Field, FieldMapping, SchemaConfig } from "@/lib/types";

type Props = {
  mappings: FieldMapping[];
  onChange: (mappings: FieldMapping[]) => void;
  /** The schema being edited — the near side of every mapping. */
  fields: Field[];
  /** Everything this account can see; the one being edited is filtered out. */
  configs: SchemaConfig[];
  activeConfigId: string | null;
  /** A schema someone else owns is shown but not edited. */
  readOnly?: boolean;
};

/** What one source configuration offers, once it has been asked. */
type Far = { state: "loading" } | { state: "ready"; value: ConfigColumns } | { state: "error"; message: string };

function OptionField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label className="label-caps">{label}</Label>
      {children}
    </div>
  );
}

/**
 * The cross-configuration links on one schema.
 *
 * A mapping is read left to right as a sentence — "customer_id comes from
 * Customers.id, one row each" — so the controls are laid out in that order
 * with the arrow between them, rather than as a form of four equal fields.
 *
 * Nothing here resolves anything: the far side is only inspected to offer real
 * column names and to say, before a run rather than during one, whether the
 * configuration being pointed at has any data yet.
 */
export function MappingsPanel({ mappings, onChange, fields, configs, activeConfigId, readOnly = false }: Props) {
  // Keyed by configuration id. Shared across rows, so two mappings onto the
  // same source cost one request between them.
  const [far, setFar] = useState<Record<string, Far>>({});
  // Read inside the loader without making it a dependency — it is what the
  // loader writes, and depending on it would re-run the effect forever.
  const farRef = useRef(far);
  farRef.current = far;

  // Only whole fields: a bundle's columns come from one draw and cannot have
  // one of them borrowed without the rest describing somebody else.
  const near = mappableFields(fields);
  // Mapping onto itself would ask a run to read its own output.
  const sources = configs.filter(config => config.id !== activeConfigId);

  const load = useCallback((configId: string) => {
    if (!configId || farRef.current[configId]) return;
    setFar(current => ({ ...current, [configId]: { state: "loading" } }));
    api
      .configColumns(configId)
      .then(value => setFar(current => ({ ...current, [configId]: { state: "ready", value } })))
      .catch(error =>
        setFar(current => ({
          ...current,
          [configId]: { state: "error", message: error instanceof Error ? error.message : "Could not read it." },
        })),
      );
  }, []);

  // Rows arrive already pointed somewhere when a saved schema is opened, so
  // the far sides are fetched on the way in rather than only on a change.
  useEffect(() => {
    for (const mapping of mappings) if (mapping.fromConfig) load(mapping.fromConfig);
  }, [mappings, load]);

  const patch = (id: string, changes: Partial<FieldMapping>) =>
    onChange(mappings.map(mapping => (mapping.id === id ? { ...mapping, ...changes } : mapping)));

  const remove = (id: string) => onChange(mappings.filter(mapping => mapping.id !== id));

  const full = mappings.length >= MAPPING_LIMITS.perConfig;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5 rounded-lg border bg-muted/20 px-3 py-2.5">
        <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          A mapping makes a field here borrow its values from another schema, so the two line up the way real tables
          do. The pool is read from whatever that configuration <em>most recently generated</em> — regenerate the
          source and everything mapped to it follows, with no mapping to re-point.
        </p>
      </div>

      {mappings.map(mapping => {
        const source = far[mapping.fromConfig];
        const columns = source?.state === "ready" ? source.value.columns : [];
        const dataset = source?.state === "ready" ? source.value.dataset : null;
        // A field can be renamed with this panel closed; say so rather than
        // letting the next run be the thing that mentions it.
        const dangling = Boolean(mapping.field) && !near.includes(mapping.field);
        const missingSource = Boolean(mapping.fromConfig) && !sources.some(c => c.id === mapping.fromConfig);

        return (
          <div
            key={mapping.id}
            className={cn(
              "rounded-lg border bg-card/40 p-3",
              (dangling || missingSource) && "border-amber-500/50 bg-amber-500/5",
            )}
          >
            {/* Sized against the pane, not the window: the split handle makes
                this column anything from a third of the screen to most of it,
                and a viewport breakpoint cannot see that. */}
            <div className="@container">
              <div
                className={cn(
                  "grid items-end gap-x-3 gap-y-3",
                  "grid-cols-1 @xs:grid-cols-2",
                  "@3xl:grid-cols-[minmax(7rem,1fr)_auto_minmax(8rem,1fr)_minmax(7rem,1fr)_auto]",
                )}
              >
                <OptionField label="This field">
                  <Select
                    value={mapping.field || "none"}
                    onValueChange={value => patch(mapping.id, { field: value === "none" ? "" : value })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-full" size="sm">
                      <SelectValue placeholder="Pick a field" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="none">None</SelectItem>
                      {/* A field renamed out from under the mapping is still
                          offered, so the row keeps its selection while it is
                          being corrected rather than silently resetting. */}
                      {dangling && <SelectItem value={mapping.field}>{mapping.field} (missing)</SelectItem>}
                      {near.map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </OptionField>

                {/* Only meaningful once the row reads left to right. */}
                <span aria-hidden className="hidden pb-2 text-muted-foreground @3xl:block">
                  <ArrowLeft className="size-4" />
                </span>

                <OptionField label="From configuration">
                  <Select
                    value={mapping.fromConfig || "none"}
                    onValueChange={value => {
                      const fromConfig = value === "none" ? "" : value;
                      patch(mapping.id, {
                        fromConfig,
                        fromConfigName: sources.find(c => c.id === fromConfig)?.name,
                        // The old column name almost certainly means nothing in
                        // the new source, so it goes rather than lingering.
                        fromField: "",
                      });
                      if (fromConfig) load(fromConfig);
                    }}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-full" size="sm">
                      <SelectValue placeholder="Pick a configuration" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="none">None</SelectItem>
                      {missingSource && (
                        <SelectItem value={mapping.fromConfig}>
                          {mapping.fromConfigName || mapping.fromConfig} (not here)
                        </SelectItem>
                      )}
                      {sources.map(config => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </OptionField>

                <OptionField label="Its column">
                  <Select
                    value={mapping.fromField || "none"}
                    onValueChange={value => patch(mapping.id, { fromField: value === "none" ? "" : value })}
                    disabled={readOnly || !columns.length}
                  >
                    <SelectTrigger className="w-full" size="sm">
                      <SelectValue placeholder={source?.state === "loading" ? "Loading…" : "Pick a column"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="none">None</SelectItem>
                      {mapping.fromField && !columns.includes(mapping.fromField) && (
                        <SelectItem value={mapping.fromField}>{mapping.fromField} (not in that data)</SelectItem>
                      )}
                      {columns.map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </OptionField>

                <div className="flex items-end gap-2">
                  <OptionField label="Draw" className="min-w-0 flex-1 @3xl:w-36 @3xl:flex-none">
                    <Select
                      value={mapping.mode}
                      onValueChange={value => patch(mapping.id, { mode: value as FieldMapping["mode"] })}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">Random (many-to-one)</SelectItem>
                        <SelectItem value="cycle">Cycle in order</SelectItem>
                        <SelectItem value="unique">One each (one-to-one)</SelectItem>
                      </SelectContent>
                    </Select>
                  </OptionField>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="mb-0.5 shrink-0"
                      onClick={() => remove(mapping.id)}
                      aria-label={`Remove the mapping for ${mapping.field || "this field"}`}
                      title="Remove this mapping"
                    >
                      <Trash2 className="text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Status
              dangling={dangling ? mapping.field : null}
              missingSource={missingSource ? mapping.fromConfigName || mapping.fromConfig : null}
              source={source}
              dataset={dataset}
            />
          </div>
        );
      })}

      {!mappings.length && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
          <Link2 className="size-7 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">No field mappings</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sources.length
                ? "Every field here generates on its own. Add a mapping to borrow one from another schema."
                : "Save a second configuration first — a mapping needs somewhere to draw from."}
            </p>
          </div>
        </div>
      )}

      {!readOnly && (
        <Button
          variant="outline"
          className="mt-1 self-start"
          onClick={() => onChange([...mappings, newMapping()])}
          disabled={full || !sources.length}
          title={full ? `A configuration may hold ${MAPPING_LIMITS.perConfig} mappings.` : undefined}
        >
          <Plus />
          Add mapping
        </Button>
      )}
    </div>
  );
}

/** The line under one row: what it will resolve to, or why it will not. */
function Status({
  dangling,
  missingSource,
  source,
  dataset,
}: {
  dangling: string | null;
  missingSource: string | null;
  source: Far | undefined;
  dataset: ConfigColumns["dataset"];
}) {
  const warn = (text: string) => (
    <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-600 dark:text-amber-500">
      <AlertTriangle className="mt-px size-3 shrink-0" />
      {text}
    </p>
  );

  if (dangling) return warn(`This schema has no field called "${dangling}" — pick another, or remove the mapping.`);
  if (missingSource) {
    return warn(
      `"${missingSource}" is not a configuration you can see. It may have been deleted, or this schema may have ` +
        "been imported from somewhere else — point the mapping at a configuration here.",
    );
  }
  if (source?.state === "error") return warn(source.message);
  if (source?.state === "loading") {
    return (
      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Reading that configuration…
      </p>
    );
  }
  if (!source) return null;

  if (!dataset) {
    return warn(
      "That configuration has never been generated, so there is nothing to draw from yet. The columns above come " +
        "from its schema; generate it once and this mapping resolves.",
    );
  }

  return (
    <p className="mt-2.5 text-[11px] text-muted-foreground">
      Resolves to <span className="font-medium text-foreground">{dataset.name}</span> —{" "}
      {dataset.rowCount.toLocaleString()} rows, {timeAgo(dataset.createdAt)}.
    </p>
  );
}
