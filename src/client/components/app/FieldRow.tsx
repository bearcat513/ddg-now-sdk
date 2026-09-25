import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Link2, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TypeSelect } from "./TypeSelect";
import { api } from "../../lib/api";
import { FUNCTION_NAMES, parseCondition, parseFormula } from "../../../server/lib/formula";
import { cn } from "../../lib/utils";
import {
  BUNDLE_COLUMNS,
  BUNDLE_LABELS,
  childFields,
  DATE_FIELD_TYPES,
  defaultFieldOptions,
  EDGE_CASE_VARIANTS,
  FIELD_TYPES,
  isLinkableOption,
  isNumericField,
  LINKABLE_OPTIONS,
  linkedFieldNames,
  MAX_FIELD_DEPTH,
  NOW_CHOICE_FIELD_TYPES,
  NOW_CHOICE_VARIANTS,
  NOW_QUERY_DEFAULT_LIMIT,
  SPREADING_FIELD_TYPES,
  type BundleKind,
  type Dataset,
  type Field,
  type FieldOptions,
  type FieldType,
  type LinkableOption,
} from "../../../server/lib/types";

type Props = {
  field: Field;
  /** Every field in the schema, so calculated fields can reference the others. */
  allFields: Field[];
  /** Stored datasets a reference field can draw its pool from. */
  datasets?: Dataset[];
  expanded: boolean;
  onToggle: () => void;
  onChange: (field: Field) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  /**
   * Nesting level. Children of an object field are editors in their own right,
   * but the options that only make sense against the row being built — `when`,
   * uniqueness, references — are left to the top level.
   */
  depth?: number;
};

function OptionField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="label-caps">{label}</Label>
      {children}
    </div>
  );
}

/**
 * An option that can be typed in or taken from another field of the same row.
 *
 * The link button swaps the input for a field picker; pressing it again drops
 * the link and the typed-in value comes back, untouched. A field that has been
 * renamed or removed since it was linked stays selected, flagged, rather than
 * being unlinked behind the user's back — the generator refuses it by name.
 */
function LinkableOptionField({
  label,
  linked,
  candidates,
  onLink,
  children,
}: {
  label: string;
  /** The field this option is linked to, if any. */
  linked: string | undefined;
  /** The fields whose value this option can take. */
  candidates: string[];
  onLink: (name: string | undefined) => void;
  children: React.ReactNode;
}) {
  const [picking, setPicking] = useState(false);
  const active = Boolean(linked) || picking;
  const missing = linked !== undefined && !candidates.includes(linked);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-1">
        <Label className="label-caps">{label}</Label>
        <button
          type="button"
          disabled={!active && candidates.length === 0}
          onClick={() => {
            if (active) onLink(undefined);
            setPicking(!active);
          }}
          aria-pressed={active}
          aria-label={active ? `Type ${label} in` : `Take ${label} from another field`}
          title={
            active
              ? "Type a value in instead"
              : candidates.length
                ? "Take this from another field in the same row"
                : "No field in this schema has a value this option can use"
          }
          className={cn(
            "focus-ring rounded p-0.5 transition-colors disabled:opacity-30",
            active ? "text-primary" : "text-muted-foreground/60 hover:text-foreground",
          )}
        >
          <Link2 className="size-3.5" />
        </button>
      </div>

      {active ? (
        <Select value={linked ?? ""} onValueChange={value => onLink(value || undefined)}>
          <SelectTrigger className={cn("w-full font-mono text-xs", missing && "border-destructive")} size="sm">
            <SelectValue placeholder="Choose a field" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {missing && (
              <SelectItem value={linked!} className="font-mono text-xs text-destructive">
                {linked} (missing)
              </SelectItem>
            )}
            {candidates.map(name => (
              <SelectItem key={name} value={name} className="font-mono text-xs">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * The `values` editor for an enum: a hand-typed list, or one of the three
 * places the platform will read a pool from at generation time.
 *
 * The Bun app had a fourth option here — a JavaScript snippet with `fetch` in
 * scope, run in a `node:vm` sandbox, with a Run button that executed it. None
 * of that exists on the platform and none of it was ported: there is no `vm`,
 * `new Function()` is disallowed, and a snippet would have run with the
 * application's own privileges against a system of record. `choices.ts`
 * explains the three replacements; each one draws the authorisation boundary
 * somewhere the platform already enforces it, which is why there is no Run
 * button any more. Nothing the editor can name here is something the caller
 * could not already read.
 */
function EnumChoices({
  opts,
  setOption,
}: {
  opts: FieldOptions;
  setOption: <K extends keyof FieldOptions>(key: K, value: FieldOptions[K]) => void;
}) {
  const source = opts.valuesFrom ?? "list";

  return (
    <div className="col-span-2 flex flex-col gap-2 sm:col-span-4">
      <OptionField label="Choices from">
        <Select
          value={source}
          onValueChange={value => setOption("valuesFrom", value === "list" ? undefined : (value as FieldOptions["valuesFrom"]))}
        >
          <SelectTrigger className="w-56" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">Static list</SelectItem>
            <SelectItem value="table">A table on this instance</SelectItem>
            <SelectItem value="scriptInclude">A Script Include</SelectItem>
            <SelectItem value="rest">A REST Message</SelectItem>
          </SelectContent>
        </Select>
      </OptionField>

      {source === "list" && (
        <>
          <OptionField label="Values (comma separated)">
            <Input
              className="h-8"
              placeholder="active, pending, archived"
              value={opts.values?.join(", ") ?? ""}
              onChange={e =>
                setOption(
                  "values",
                  e.target.value
                    .split(",")
                    .map(v => v.trim())
                    .filter(Boolean),
                )
              }
            />
          </OptionField>
          <p className="text-[11px] text-muted-foreground/70">
            The pool every row draws from. Pair it with weights below to make one choice commoner than another.
          </p>
        </>
      )}

      {source === "table" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <OptionField label="Table">
              <Input
                className="h-8 font-mono text-xs"
                placeholder="incident"
                spellCheck={false}
                value={opts.choiceTable ?? ""}
                onChange={e => setOption("choiceTable", e.target.value || undefined)}
              />
            </OptionField>
            <OptionField label="Column">
              <Input
                className="h-8 font-mono text-xs"
                placeholder="state"
                spellCheck={false}
                value={opts.choiceField ?? ""}
                onChange={e => setOption("choiceField", e.target.value || undefined)}
              />
            </OptionField>
            <div className="col-span-2">
              <OptionField label="Query">
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="active=true^priority=1"
                  spellCheck={false}
                  value={opts.choiceQuery ?? ""}
                  onChange={e => setOption("choiceQuery", e.target.value || undefined)}
                />
              </OptionField>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            Read once per generation with your own session, so the pool is exactly the rows you could see in a list
            view of that table.
          </p>
        </>
      )}

      {source === "scriptInclude" && (
        <>
          <OptionField label="Script Include">
            <Input
              className="h-8 font-mono text-xs"
              placeholder="MyChoiceSource"
              spellCheck={false}
              value={opts.scriptInclude ?? ""}
              onChange={e => setOption("scriptInclude", e.target.value || undefined)}
            />
          </OptionField>
          <p className="text-[11px] text-muted-foreground/70">
            The name of a Script Include with a <span className="font-mono">getChoices()</span> method returning an
            array. It is resolved by the <span className="font-mono">DdgGenerator</span> bridge, so a run started
            from somewhere without that bridge reports this field rather than quietly generating an empty pool.
          </p>
        </>
      )}

      {source === "rest" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2">
              <OptionField label="REST Message">
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="Statuses API"
                  spellCheck={false}
                  value={opts.restMessage ?? ""}
                  onChange={e => setOption("restMessage", e.target.value || undefined)}
                />
              </OptionField>
            </div>
            <OptionField label="Method">
              <Input
                className="h-8 font-mono text-xs"
                placeholder="get"
                spellCheck={false}
                value={opts.restMethod ?? ""}
                onChange={e => setOption("restMethod", e.target.value || undefined)}
              />
            </OptionField>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            The record name of a REST Message and the HTTP method function on it. Credentials, logging and MID server
            routing all stay with that record, which is the reason this replaced the snippet that used to fetch here.
          </p>
        </>
      )}
    </div>
  );
}

/** A plain comma-separated list, for the types whose pool is not scriptable. */
function SimpleValues({
  opts,
  setOption,
  placeholder,
  hint,
}: {
  opts: FieldOptions;
  setOption: <K extends keyof FieldOptions>(key: K, value: FieldOptions[K]) => void;
  placeholder: string;
  hint: string;
}) {
  return (
    <div className="col-span-2 sm:col-span-4">
      <OptionField label="Values (comma separated)">
        <Input
          className="h-8"
          placeholder={placeholder}
          value={opts.values?.join(", ") ?? ""}
          onChange={e =>
            setOption(
              "values",
              e.target.value
                .split(",")
                .map(v => v.trim())
                .filter(Boolean),
            )
          }
        />
      </OptionField>
      <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p>
    </div>
  );
}

/**
 * Relative weights for a pool of choices. Real status columns are nowhere near
 * uniform, and the live percentages are the point: you can see the shape you
 * are asking for before generating a row of it.
 */
function WeightsEditor({
  opts,
  setOption,
}: {
  opts: FieldOptions;
  setOption: <K extends keyof FieldOptions>(key: K, value: FieldOptions[K]) => void;
}) {
  const values = opts.values?.filter(Boolean) ?? [];
  const weights = opts.weights ?? [];
  const total = values.reduce((sum, _value, index) => sum + Math.max(0, weights[index] ?? 1), 0);

  return (
    <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-4">
      <OptionField label="Weights (comma separated)">
        <Input
          className="h-8"
          placeholder="9, 1"
          value={weights.join(", ")}
          onChange={e => {
            const parsed = e.target.value
              .split(",")
              .map(part => Number(part.trim()))
              .filter(n => Number.isFinite(n));
            setOption("weights", parsed.length ? parsed : undefined);
          }}
        />
      </OptionField>

      {values.length > 0 && weights.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="rounded border bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {value} <span className="text-foreground">{total > 0 ? Math.round((Math.max(0, weights[index] ?? 1) / total) * 100) : 0}%</span>
            </span>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/70">
        One number per value, in the same order. Leave it empty and every choice is equally likely — which is almost
        never what real data looks like.
      </p>
    </div>
  );
}

const DISTRIBUTION_HINTS: Record<string, string> = {
  uniform: "Every value in the range is equally likely.",
  normal: "Bell curve around the mean — heights, scores, ages.",
  lognormal: "Right-skewed with a long tail — latency, order value, file size.",
  pareto: "Heavy-tailed: most rows near the minimum, a few far above it — quantities, seats.",
};

/** The shape of a numeric draw, and the parameters the chosen shape needs. */
function DistributionEditor({
  opts,
  setOption,
  numberOption,
}: {
  opts: FieldOptions;
  setOption: <K extends keyof FieldOptions>(key: K, value: FieldOptions[K]) => void;
  numberOption: (key: keyof FieldOptions, label: string, placeholder?: string) => React.ReactNode;
}) {
  const distribution = opts.distribution ?? "uniform";

  return (
    <>
      <OptionField label="Distribution">
        <Select
          value={distribution}
          onValueChange={value =>
            setOption("distribution", value === "uniform" ? undefined : (value as FieldOptions["distribution"]))
          }
        >
          <SelectTrigger className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uniform">Uniform</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="lognormal">Log-normal</SelectItem>
            <SelectItem value="pareto">Pareto</SelectItem>
          </SelectContent>
        </Select>
      </OptionField>

      {(distribution === "normal" || distribution === "lognormal") && (
        <>
          {numberOption("mean", distribution === "lognormal" ? "Median" : "Mean")}
          {numberOption("stddev", distribution === "lognormal" ? "Sigma" : "Std dev")}
        </>
      )}
      {distribution === "pareto" && numberOption("shape", "Tail index", "1.5")}

      <p className="col-span-2 text-[11px] text-muted-foreground/70 sm:col-span-4">
        {DISTRIBUTION_HINTS[distribution]}
        {distribution !== "uniform" && " Min still floors the draw; leave Max empty to keep the tail."}
      </p>
    </>
  );
}

/** Points a field at a column of a dataset that was already generated. */
function ReferencePicker({
  opts,
  setOption,
  datasets,
}: {
  opts: FieldOptions;
  setOption: <K extends keyof FieldOptions>(key: K, value: FieldOptions[K]) => void;
  datasets: Dataset[];
}) {
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const datasetId = opts.refDataset ?? "";

  useEffect(() => {
    if (!datasetId) {
      setColumns([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .datasetColumns(datasetId)
      .then(result => {
        if (!cancelled) setColumns(result.columns);
      })
      .catch(reason => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not read that dataset.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // Cancelled on a fast re-pick, so a slow response cannot overwrite a newer one.
    return () => {
      cancelled = true;
    };
  }, [datasetId]);

  return (
    <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-4 sm:grid-cols-4">
      <OptionField label="Dataset">
        <Select
          value={datasetId || "none"}
          onValueChange={value => {
            setOption("refDataset", value === "none" ? undefined : value);
            setOption("refField", undefined);
          }}
        >
          <SelectTrigger className="w-full" size="sm">
            <SelectValue placeholder="Pick a dataset" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="none">None</SelectItem>
            {datasets.map(dataset => (
              <SelectItem key={dataset.id} value={dataset.id}>
                {dataset.name} ({dataset.rowCount.toLocaleString()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </OptionField>

      <OptionField label="Column">
        <Select
          value={opts.refField ?? "none"}
          onValueChange={value => setOption("refField", value === "none" ? undefined : value)}
          disabled={!columns.length}
        >
          <SelectTrigger className="w-full" size="sm">
            <SelectValue placeholder={loading ? "Loading…" : "Pick a column"} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="none">None</SelectItem>
            {columns.map(column => (
              <SelectItem key={column} value={column}>
                {column}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </OptionField>

      <OptionField label="Draw">
        <Select
          value={opts.refMode ?? "random"}
          onValueChange={value => setOption("refMode", value as FieldOptions["refMode"])}
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

      {error && <p className="col-span-2 text-[11px] text-destructive sm:col-span-4">{error}</p>}
      <p className="col-span-2 text-[11px] text-muted-foreground/70 sm:col-span-4">
        The pool is read at generation time, so it always reflects what that dataset holds now.{" "}
        <span className="font-mono">One each</span> leaves later rows null once the pool runs out.
      </p>
    </div>
  );
}

/** Field names are bare identifiers unless they need bracket quoting. */
function referenceToken(name: string): string {
  return /^[A-Za-z_][A-Za-z0-9_.]*$/.test(name) ? name : `[${name}]`;
}

export function FieldRow({
  field,
  allFields,
  datasets = [],
  expanded,
  onToggle,
  onChange,
  onRemove,
  onMove,
  depth = 0,
}: Props) {
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const meta = FIELD_TYPES.find(t => t.type === field.type);
  const opts = field.options ?? {};
  const nested = depth > 0;

  const setOption = <K extends keyof FieldOptions>(key: K, value: FieldOptions[K]) =>
    onChange({ ...field, options: { ...opts, [key]: value } });

  /** Child fields of an object, or of an array of objects. */
  const children = childFields(field);
  const canNest = depth < MAX_FIELD_DEPTH - 1;

  const setChildren = (next: Field[]) => setOption("fields", next);

  const addChild = () =>
    setChildren([
      ...children,
      { id: crypto.randomUUID(), name: `field_${children.length + 1}`, type: "word", options: {} },
    ]);
  const updateChild = (index: number, next: Field) =>
    setChildren(children.map((child, i) => (i === index ? next : child)));
  const removeChild = (index: number) => setChildren(children.filter((_child, i) => i !== index));
  const moveChild = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= children.length) return;
    const next = [...children];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    setChildren(next);
  };

  // Every other named field, for the pickers that reference one.
  const siblings = allFields.filter(f => f.id !== field.id && f.name.trim());
  const dateSiblings = siblings.filter(f => DATE_FIELD_TYPES.has(f.type));

  // Columns a `when` predicate may compare, bundles and objects included.
  const comparable = useMemo(() => {
    const names: string[] = [];
    for (const other of allFields) {
      if (other.id === field.id || !other.name.trim()) continue;
      if (other.type === "bundle") {
        for (const column of BUNDLE_COLUMNS[other.options?.bundle ?? "person"]) names.push(`${other.name}.${column}`);
      } else if (SPREADING_FIELD_TYPES.has(other.type)) {
        for (const child of childFields(other)) if (child.name.trim()) names.push(`${other.name}.${child.name}`);
      } else {
        names.push(other.name);
      }
    }
    return names;
  }, [allFields, field.id]);

  const condition = useMemo(
    () => (opts.when?.trim() ? parseCondition(opts.when, comparable) : null),
    [opts.when, comparable],
  );

  // Fields a formula may read: numbers, plus booleans (which coerce to 1 / 0).
  const referenceable = useMemo(
    () => allFields.filter(f => f.id !== field.id && f.name.trim() && (isNumericField(f) || f.type === "boolean")),
    [allFields, field.id],
  );

  const formula = useMemo(
    () => (field.type === "computed" ? parseFormula(opts.expression ?? "", referenceable.map(f => f.name)) : null),
    [field.type, opts.expression, referenceable],
  );

  // Options that may come from another field's value in the same row. Not in
  // nested records, which are built in schema order with no dependency sort,
  // and not for a sequential timestamp, whose start is one series' start
  // rather than a per-row bound.
  const canLink = !nested && field.type !== "sequentialDate";

  const linkCandidates = {
    number: siblings.filter(f => isNumericField(f) || f.type === "boolean").map(f => f.name),
    date: dateSiblings.map(f => f.name),
  };

  const setLink = (key: LinkableOption, name: string | undefined) => {
    const next = { ...opts.links };
    if (name) next[key] = name;
    else delete next[key];
    setOption("links", Object.keys(next).length ? next : undefined);
  };

  /** Wraps an option's input so it can be linked, where that option allows it. */
  const linkable = (key: keyof FieldOptions, label: string, input: React.ReactNode) =>
    canLink && isLinkableOption(key) ? (
      <LinkableOptionField
        key={key}
        label={label}
        linked={opts.links?.[key]}
        candidates={linkCandidates[LINKABLE_OPTIONS[key]]}
        onLink={name => setLink(key, name)}
      >
        {input}
      </LinkableOptionField>
    ) : (
      <OptionField key={key} label={label}>
        {input}
      </OptionField>
    );

  const numberOption = (key: keyof FieldOptions, label: string, placeholder?: string) =>
    linkable(
      key,
      label,
      <Input
        type="number"
        className="h-8"
        placeholder={placeholder}
        value={(opts[key] as number | undefined) ?? ""}
        onChange={e => setOption(key, (e.target.value === "" ? undefined : Number(e.target.value)) as never)}
      />,
    );

  // Names a template's `{{field:…}}` tokens point at that the schema lacks.
  const missingTemplateFields =
    field.type === "template" ? linkedFieldNames({ pattern: opts.pattern }).filter(name => !comparable.includes(name)) : [];

  return (
    <div
      className={cn(
        "group/field rounded-lg border bg-card transition-shadow",
        // Open, the row is where the work is: it keeps the shadow rather than
        // waiting for a pointer that has moved down into its options.
        expanded ? "shadow-sm" : "hover:shadow-sm",
      )}
    >
      <div className="flex items-center gap-2 p-2">
        {/* Both arrows inside one target column; they are 14px glyphs, and
            without a padded hit area they are a miss more often than a hit. */}
        <div className="flex flex-col text-muted-foreground/60">
          <button
            type="button"
            onClick={() => onMove(-1)}
            className="focus-ring rounded px-0.5 leading-none transition-colors hover:text-foreground"
            aria-label="Move field up"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            className="focus-ring rounded px-0.5 leading-none transition-colors hover:text-foreground"
            aria-label="Move field down"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>

        <GripVertical className="size-4 shrink-0 text-muted-foreground/30" />

        <Input
          className="h-8 flex-1 font-mono text-sm"
          placeholder="field_name"
          value={field.name}
          onChange={e => onChange({ ...field, name: e.target.value })}
        />

        <TypeSelect
          value={field.type}
          onChange={type => onChange({ ...field, type, options: defaultFieldOptions(type) })}
          className="w-48"
        />

        <Button
          variant={expanded ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label="Field options"
          title="Field options"
        >
          <Settings2 className={cn("transition-transform", expanded && "rotate-90")} />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove field">
          <Trash2 className="text-muted-foreground hover:text-destructive" />
        </Button>
      </div>

      {expanded && (
        <div className="grid grid-cols-2 gap-3 rounded-b-lg border-t bg-muted/40 p-3 sm:grid-cols-4 animate-in fade-in-0 duration-150">
          {meta?.opts.includes("expression") && (
            <div className="col-span-2 flex flex-col gap-2 sm:col-span-4">
              <OptionField label="Expression">
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="quantity * unit_price"
                  spellCheck={false}
                  value={opts.expression ?? ""}
                  onChange={e => setOption("expression", e.target.value)}
                />
              </OptionField>

              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Insert field:</span>
                {referenceable.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground/70">
                    no numeric fields in this schema yet
                  </span>
                ) : (
                  referenceable.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      title={`${f.name} (${f.type})`}
                      onClick={() => {
                        const current = opts.expression ?? "";
                        const separator = current && !/[\s(+\-*/%^,]$/.test(current) ? " " : "";
                        setOption("expression", current + separator + referenceToken(f.name));
                      }}
                      className="chip"
                    >
                      {f.name}
                    </button>
                  ))
                )}
              </div>

              {formula && !formula.ok ? (
                <p className="text-[11px] text-destructive">{formula.error}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground/70">
                  Operators + - * / % ^ and {FUNCTION_NAMES.map(fn => `${fn}()`).join(", ")}
                </p>
              )}
            </div>
          )}

          {meta?.opts.includes("min") && numberOption("min", field.type === "array" ? "Min items" : "Min")}
          {meta?.opts.includes("max") && numberOption("max", field.type === "array" ? "Max items" : "Max")}
          {meta?.opts.includes("decimals") && numberOption("decimals", "Decimals")}
          {meta?.opts.includes("truePercent") && numberOption("truePercent", "% true")}

          {meta?.opts.includes("values") &&
            (field.type === "enum" ? (
              <EnumChoices opts={opts} setOption={setOption} />
            ) : (
              <SimpleValues
                opts={opts}
                setOption={setOption}
                placeholder={field.type === "oauthScopes" ? "read:users, write:users" : "leave empty for the built-in pool"}
                hint={
                  field.type === "oauthScopes"
                    ? "The pool each row picks a few scopes from."
                    : "Leave it empty to use the built-in, realistically weighted pool."
                }
              />
            ))}

          {meta?.opts.includes("weights") && <WeightsEditor opts={opts} setOption={setOption} />}

          {meta?.opts.includes("distribution") && (
            <DistributionEditor opts={opts} setOption={setOption} numberOption={numberOption} />
          )}

          {meta?.opts.includes("bundle") && (
            <div className="col-span-2 sm:col-span-4">
              <OptionField label="Bundle">
                <Select
                  value={opts.bundle ?? "person"}
                  onValueChange={value => setOption("bundle", value as BundleKind)}
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BUNDLE_LABELS).map(([kind, label]) => (
                      <SelectItem key={kind} value={kind}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </OptionField>
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                One coherent draw across{" "}
                <span className="font-mono">
                  {BUNDLE_COLUMNS[opts.bundle ?? "person"].map(column => `${field.name || "field"}.${column}`).join(", ")}
                </span>{" "}
                — the email matches the name, the state matches its abbreviation.
              </p>
            </div>
          )}

          {meta?.opts.includes("refDataset") && (
            <ReferencePicker opts={opts} setOption={setOption} datasets={datasets} />
          )}

          {meta?.opts.includes("derivesFrom") && (
            <OptionField label="Built from">
              <Select
                value={opts.derivesFrom ?? "none"}
                onValueChange={value => setOption("derivesFrom", value === "none" ? undefined : value)}
              >
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">Nothing (independent)</SelectItem>
                  {siblings.map(other => (
                    <SelectItem key={other.id} value={other.name}>
                      {other.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OptionField>
          )}

          {meta?.opts.includes("after") && (
            <OptionField label="Must follow">
              <Select
                value={opts.after ?? "none"}
                onValueChange={value => setOption("after", value === "none" ? undefined : value)}
              >
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">Nothing</SelectItem>
                  {dateSiblings.map(other => (
                    <SelectItem key={other.id} value={other.name}>
                      {other.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OptionField>
          )}

          {meta?.opts.includes("step") && (
            <>
              {numberOption("step", "Step (seconds)", "3600")}
              {numberOption("jitter", "Jitter %", "25")}
              <OptionField label="Business hours">
                <label className="flex h-8 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={Boolean(opts.businessHours)}
                    onChange={e => setOption("businessHours", e.target.checked || undefined)}
                  />
                  <span className="text-muted-foreground">Mon-Fri, 9-5</span>
                </label>
              </OptionField>
              <p className="col-span-2 text-[11px] text-muted-foreground/70 sm:col-span-4">
                Each row lands after the one before it. With no start date the series ends around now.
              </p>
            </>
          )}

          {meta?.opts.includes("dimensions") && numberOption("dimensions", "Dimensions", "8")}

          {meta?.opts.includes("variant") && (
            <OptionField label="Variant">
              {field.type === "edgeCase" ? (
                <Select value={opts.variant ?? "all"} onValueChange={value => setOption("variant", value)}>
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDGE_CASE_VARIANTS.map(variant => (
                      <SelectItem key={variant} value={variant}>
                        {variant === "all" ? "All of them" : variant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : NOW_CHOICE_FIELD_TYPES.has(field.type) ? (
                <Select value={opts.variant ?? "value"} onValueChange={value => setOption("variant", value)}>
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOW_CHOICE_VARIANTS.map(variant => (
                      <SelectItem key={variant} value={variant}>
                        {variant === "value" ? "Stored value" : "Display label"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder={
                    field.type === "glideDuration"
                      ? "glide | human"
                      : field.type === "apiKey"
                      ? "sk_live"
                      : field.type === "nowRecordNumber"
                        ? "INC"
                        : field.type === "passwordHash"
                          ? "bcrypt | argon2 | sha256"
                          : field.type === "cryptoAddress"
                            ? "bitcoin | ethereum"
                            : "ups | fedex | usps | dhl"
                  }
                  value={opts.variant ?? ""}
                  onChange={e => setOption("variant", e.target.value || undefined)}
                />
              )}
            </OptionField>
          )}

          {meta?.opts.includes("pattern") && (
            <div className="col-span-2 flex flex-col gap-2 sm:col-span-4">
              <OptionField label="Pattern">
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="ORD-{{number:1000-9999}}-{{field:customer_id}}"
                  spellCheck={false}
                  value={opts.pattern ?? ""}
                  onChange={e => setOption("pattern", e.target.value)}
                />
              </OptionField>

              {!nested && comparable.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">Insert field:</span>
                  {comparable.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setOption("pattern", `${opts.pattern ?? ""}{{field:${name}}}`)}
                      className="chip"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {missingTemplateFields.length > 0 ? (
                <p className="text-[11px] text-destructive">
                  Not a field in this schema: {missingTemplateFields.join(", ")}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground/70">
                  <span className="font-mono">{"{{field:name}}"}</span> puts in that row's value of another field;
                  a null one leaves nothing.
                </p>
              )}
            </div>
          )}

          {meta?.opts.includes("table") && (
            <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-4 sm:grid-cols-4">
              <OptionField label="Table">
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="incident"
                  spellCheck={false}
                  value={opts.table ?? ""}
                  onChange={e => setOption("table", e.target.value)}
                />
              </OptionField>

              <div className="col-span-1 sm:col-span-2">
                <OptionField label="Query">
                  <Input
                    className="h-8 font-mono text-xs"
                    placeholder="active=true^priority=1"
                    spellCheck={false}
                    value={opts.query ?? ""}
                    onChange={e => setOption("query", e.target.value)}
                  />
                </OptionField>
              </div>

              {numberOption("limit", "Limit", String(NOW_QUERY_DEFAULT_LIMIT))}

              <p className="col-span-2 text-[11px] text-muted-foreground/70 sm:col-span-4">
                Emits <span className="font-mono">{"{ table, query, limit, count }"}</span>, where{" "}
                <span className="font-mono">count</span> is a random integer from 1 to the limit. JSON exports nest it
                as an object; CSV holds it as a compact JSON string.
              </p>
            </div>
          )}

          {meta?.opts.includes("from") &&
            linkable(
              "from",
              "From",
              <Input
                type="date"
                className="h-8"
                value={opts.from?.slice(0, 10) ?? ""}
                onChange={e => setOption("from", e.target.value)}
              />,
            )}
          {meta?.opts.includes("to") &&
            linkable(
              "to",
              "To",
              <Input
                type="date"
                className="h-8"
                value={opts.to?.slice(0, 10) ?? ""}
                onChange={e => setOption("to", e.target.value)}
              />,
            )}
          {opts.links && Object.keys(opts.links).length > 0 && (
            <p className="col-span-2 text-[11px] text-muted-foreground/70 sm:col-span-4">
              A linked option takes each row's value of that field. Where the field is null, the typed-in value
              applies.
            </p>
          )}

          {meta?.opts.includes("format") && (
            <OptionField label="Format">
              <Select value={opts.format ?? "iso"} onValueChange={v => setOption("format", v as FieldOptions["format"])}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iso">ISO 8601</SelectItem>
                  <SelectItem value="datetime">YYYY-MM-DD HH:mm:ss</SelectItem>
                  <SelectItem value="date">YYYY-MM-DD</SelectItem>
                  <SelectItem value="time">HH:mm:ss</SelectItem>
                  <SelectItem value="unix">Unix seconds</SelectItem>
                </SelectContent>
              </Select>
            </OptionField>
          )}

          {meta?.opts.includes("arrayOf") && (
            <OptionField label="Array of">
              <TypeSelect
                value={opts.arrayOf ?? "word"}
                onChange={type => setOption("arrayOf", type)}
                className="w-full"
                exclude={["computed", "array", "reference"]}
              />
            </OptionField>
          )}

          {meta?.opts.includes("fields") && (field.type === "object" || opts.arrayOf === "object") && (
            <div className="col-span-2 flex flex-col gap-2 sm:col-span-4">
              <div className="flex items-center justify-between">
                <Label className="label-caps">
                  {field.type === "object" ? "Columns" : "Item fields"}
                </Label>
                {canNest ? (
                  <Button variant="secondary" size="sm" className="h-7" onClick={addChild}>
                    <Plus />
                    Add field
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground/70">Nesting limit reached</span>
                )}
              </div>

              {children.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/70">
                  No fields yet.{" "}
                  {field.type === "object"
                    ? "Each one becomes its own column, named field.child — flat in CSV, nested in JSON."
                    : "Each array item is an object built from these fields."}
                </p>
              ) : (
                <div className="flex flex-col gap-2 border-l-2 border-primary/20 pl-2.5">
                  {children.map((child, index) => (
                    <FieldRow
                      key={child.id}
                      field={child}
                      allFields={children}
                      datasets={datasets}
                      depth={depth + 1}
                      expanded={expandedChild === child.id}
                      onToggle={() => setExpandedChild(current => (current === child.id ? null : child.id))}
                      onChange={next => updateChild(index, next)}
                      onRemove={() => removeChild(index)}
                      onMove={direction => moveChild(index, direction)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!nested && (
            <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-4">
              <OptionField label="Only when">
                <Input
                  className="h-8 font-mono text-xs"
                  spellCheck={false}
                  placeholder="status == 'cancelled'"
                  value={opts.when ?? ""}
                  onChange={e => setOption("when", e.target.value || undefined)}
                />
              </OptionField>

              {opts.when && comparable.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">Insert field:</span>
                  {comparable.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        const current = opts.when ?? "";
                        const separator = current && !/[\s(]$/.test(current) ? " " : "";
                        setOption("when", current + separator + referenceToken(name));
                      }}
                      className="chip"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {condition && !condition.ok ? (
                <p className="text-[11px] text-destructive">{condition.error}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground/70">
                  Leave it empty and the field always has a value. Otherwise it is null on every row where the
                  condition is false — how a <span className="font-mono">cancelled_at</span> only fills in for
                  cancelled orders. Use == != &lt; &lt;= &gt; &gt;= with and / or / not, and{" "}
                  <span className="font-mono">is null</span>.
                </p>
              )}
            </div>
          )}

          <OptionField label="% null">
            <Input
              type="number"
              min={0}
              max={100}
              className="h-8"
              placeholder="0"
              value={field.nullPercent ?? ""}
              onChange={e =>
                onChange({ ...field, nullPercent: e.target.value === "" ? undefined : Number(e.target.value) })
              }
            />
          </OptionField>

          <OptionField label="Prefix">
            <Input
              className="h-8"
              value={opts.prefix ?? ""}
              onChange={e => setOption("prefix", e.target.value || undefined)}
            />
          </OptionField>

          <OptionField label="Suffix">
            <Input
              className="h-8"
              value={opts.suffix ?? ""}
              onChange={e => setOption("suffix", e.target.value || undefined)}
            />
          </OptionField>

          {!nested && !SPREADING_FIELD_TYPES.has(field.type) && (
            <OptionField label="Unique">
              <label className="flex h-8 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={Boolean(field.unique)}
                  onChange={e => onChange({ ...field, unique: e.target.checked })}
                />
                <span className="text-muted-foreground">No duplicates</span>
              </label>
            </OptionField>
          )}
        </div>
      )}
    </div>
  );
}
