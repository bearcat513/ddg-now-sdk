import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  Braces,
  ChevronRight,
  Compass,
  Database,
  FileCode2,
  FileStack,
  HardDrive,
  KeyRound,
  Layers,
  LayoutDashboard,
  ListTree,
  Play,
  Plus,
  Shapes,
  Share2,
  StickyNote,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type SessionUser } from "@/lib/api";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import { FIELD_TYPES, type Dataset, type Field, type FieldType, type SchemaConfig } from "@/lib/types";
import type { Note } from "@/lib/notes";
import type { ScriptTemplate } from "@/lib/scriptTemplate";

/** Record counts as `/api/meta` reports them; null where PocketBase went quiet. */
export type Totals = {
  configs: number | null;
  datasets: number | null;
  scriptTemplates: number | null;
  notes: number | null;
};

type Props = {
  me: SessionUser;
  configs: SchemaConfig[];
  datasets: Dataset[];
  templates: ScriptTemplate[];
  notes: Note[];
  /**
   * The server's own counts. The lists above are what the sidebar shows, and
   * the dataset list is cut to the history preference, so a tile that wants a
   * true total has to ask rather than measure.
   */
  totals: Totals | null;
  /** Where the data lives — the same label the sidebar carries. */
  storage: string;
  onNewConfig: () => void;
  onLoadConfig: (config: SchemaConfig) => void;
  onLoadDataset: (dataset: Dataset) => void;
  onNewTemplate: () => void;
  onLoadTemplate: (template: ScriptTemplate) => void;
  /** Opens the editor on its import tab, which is where most schemas start. */
  onImport: () => void;
  onOpenSettings: () => void;
  /** Leaves the dashboard for the editor. */
  onClose: () => void;
  /** Rendered at the start of the header — the sidebar control, when it is away. */
  leading?: ReactNode;
};

/** How far back the activity strip looks. Two weeks fits without scrolling. */
const ACTIVITY_DAYS = 14;

/** A local calendar day, as a key a timestamp can be bucketed into. */
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

type Day = { key: string; date: Date; datasets: number; rows: number };

/**
 * The last fortnight, one bucket per day, oldest first.
 *
 * Bucketing by local calendar key rather than by elapsed milliseconds keeps
 * the columns honest across a daylight-saving shift, where one "day" is 23 or
 * 25 hours long and arithmetic on the difference lands a row in its neighbour.
 */
function activityDays(datasets: Dataset[]): Day[] {
  const first = new Date();
  first.setHours(0, 0, 0, 0);
  first.setDate(first.getDate() - (ACTIVITY_DAYS - 1));

  const days: Day[] = [];
  const byKey = new Map<string, Day>();
  for (let index = 0; index < ACTIVITY_DAYS; index += 1) {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    const day: Day = { key: dayKey(date), date, datasets: 0, rows: 0 };
    days.push(day);
    byKey.set(day.key, day);
  }

  for (const dataset of datasets) {
    const day = byKey.get(dayKey(new Date(dataset.createdAt)));
    if (!day) continue; // Older than the window, or a timestamp we can't read.
    day.datasets += 1;
    day.rows += dataset.rowCount;
  }

  return days;
}

const shortDate = (date: Date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** Which group of generators a field type belongs to, by the editor's own list. */
const FIELD_GROUPS = new Map<FieldType, string>(FIELD_TYPES.map(meta => [meta.type, meta.group]));

/**
 * Every field in a schema, the children of object and array fields included.
 *
 * A nested field is still a column in the output, so leaving the children out
 * would under-count exactly the schemas that took the most work to build.
 */
function* walkFields(fields: Field[]): Generator<Field> {
  for (const field of fields) {
    yield field;
    if (field.options?.fields) yield* walkFields(field.options.fields);
  }
}

type Composition = {
  /** Groups by how much of the account they account for, busiest first. */
  groups: { name: string; count: number }[];
  /** Fields across every configuration, nested ones counted. */
  fields: number;
  /** How many distinct generators are in use, out of the ones on offer. */
  types: number;
  /** The field count of the largest single schema. */
  largest: number;
};

/** What the saved schemas are actually made of, by generator group. */
function composition(configs: SchemaConfig[]): Composition {
  const counts = new Map<string, number>();
  const types = new Set<FieldType>();
  let fields = 0;
  let largest = 0;

  for (const config of configs) {
    let own = 0;
    for (const field of walkFields(config.fields)) {
      own += 1;
      types.add(field.type);
      const group = FIELD_GROUPS.get(field.type) ?? "Other";
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
    fields += own;
    largest = Math.max(largest, own);
  }

  const groups = [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { groups, fields, types: types.size, largest };
}

/** The host of the storage URL, for a footer that has no room for the scheme. */
function hostOf(storage: string): string {
  try {
    return new URL(storage).host;
  } catch {
    return storage;
  }
}

/* ------------------------------ building blocks ----------------------------- */

/** A panel: a captioned heading over whatever it holds. */
function Panel({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-start gap-2.5 border-b bg-muted/30 px-4 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

/**
 * Week-on-week movement, as a chip beside the number it qualifies.
 *
 * A flat week says nothing worth a chip, so it gets none: a row of "0" deltas
 * across the tiles would be noise standing exactly where a real change wants
 * to be noticed.
 */
function Delta({ value, unit }: { value: number; unit: string }) {
  if (value === 0) return null;
  const up = value > 0;
  const label = `${up ? "+" : "−"}${Math.abs(value).toLocaleString()} ${unit} on the week before`;
  return (
    <span
      title={label}
      className={cn(
        "flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-medium tabular-nums",
        up ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
      )}
    >
      {up ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
      {up ? "+" : "−"}
      {Math.abs(value).toLocaleString()}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

/**
 * One number, large enough to read from across the desk.
 *
 * The count is the point, so it carries the weight; the caption under it says
 * what the number is counting and the footnote qualifies it where the figure
 * covers less than the whole account.
 */
function Stat({
  icon,
  label,
  value,
  footnote,
  delta,
}: {
  icon: ReactNode;
  label: string;
  value: number | null;
  footnote: string;
  /** Change over the last seven days, where the figure has a meaningful one. */
  delta?: { value: number; unit: string };
}) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 shadow-sm transition-colors hover:border-primary/30">
      <p className="flex items-center gap-1.5 label-caps">
        <span className="text-primary">{icon}</span>
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums leading-none tracking-tight">
          {value === null ? <span className="text-muted-foreground">—</span> : value.toLocaleString()}
        </span>
        {delta && <Delta value={delta.value} unit={delta.unit} />}
      </p>
      <p className="mt-1.5 truncate text-xs text-muted-foreground" title={footnote}>
        {footnote}
      </p>
    </div>
  );
}

/** A row in one of the recents lists. */
function RecentRow({
  title,
  subtitle,
  badge,
  onSelect,
}: {
  title: string;
  subtitle: string;
  badge?: ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="focus-ring group flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          {title}
          {badge}
        </p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </button>
  );
}

/** The "shared with you" / "shared with N" mark a recents row carries. */
function ShareBadge({ record, mine }: { record: { ownerId: string; sharedWith: string[] }; mine: string }) {
  if (record.ownerId !== mine) {
    return (
      <span
        className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground"
        title="Shared with you"
      >
        <Share2 className="size-2.5" />
        shared
      </span>
    );
  }
  if (!record.sharedWith.length) return null;
  return (
    <span
      className="flex items-center gap-0.5 rounded-full bg-primary/12 px-1.5 py-px text-[10px] font-medium tabular-nums text-primary"
      title={`Shared with ${record.sharedWith.length}`}
    >
      <Users className="size-2.5" />
      {record.sharedWith.length}
    </span>
  );
}

/** One thing you might do next: what it is, and a sentence on why. */
function Action({
  icon,
  label,
  description,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/50"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </button>
  );
}

/** Said where a list has nothing in it yet. */
function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="px-4 py-6 text-center text-xs text-muted-foreground">{children}</p>;
}

/* --------------------------------- activity -------------------------------- */

/** Which figure the strip is drawing. Both are in the table underneath either way. */
type Metric = "datasets" | "rows";

/**
 * Datasets — or rows — generated per day over the last fortnight.
 *
 * One series, so there is no legend to write and no palette to pick: the bars
 * wear the account's own accent, the axis stays recessive, and only the busiest
 * day is labelled — a number over every column would be a table drawn badly.
 * The dashed rule is the daily mean, which is what makes a column legible as
 * "a busy day" rather than merely "a tall one". The same figures are in a
 * screen-reader table underneath, which is also the fallback when the bars are
 * too short to compare by eye.
 */
function ActivityChart({ days, metric }: { days: Day[]; metric: Metric }) {
  const valueOf = (day: Day) => (metric === "rows" ? day.rows : day.datasets);
  const peak = Math.max(...days.map(valueOf));
  const peakIndex = days.findIndex(day => valueOf(day) === peak);
  const total = days.reduce((sum, day) => sum + day.datasets, 0);
  const rows = days.reduce((sum, day) => sum + day.rows, 0);

  // The mean is taken over the whole window rather than over the days that saw
  // a run: "how much do I generate in a day" includes the quiet ones.
  const drawn = days.reduce((sum, day) => sum + valueOf(day), 0);
  const mean = drawn / days.length;
  const active = days.filter(day => day.datasets > 0).length;
  const busiest = days[peakIndex];

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 py-4">
      {total === 0 ? (
        <div className="flex min-h-28 flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-xs text-muted-foreground">
          Nothing generated in the last {ACTIVITY_DAYS} days.
        </div>
      ) : (
        // The strip takes whatever height the panel has spare, so the bars fill
        // the card rather than leaving a band of nothing under the axis.
        <div className="relative flex min-h-28 flex-1 items-end gap-[2px]">
          {mean > 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/35"
              style={{ bottom: `${(mean / peak) * 100}%` }}
            >
              <span className="absolute -top-[7px] right-0 bg-card pl-1 text-[10px] tabular-nums text-muted-foreground/70">
                avg {mean < 10 ? mean.toFixed(1) : Math.round(mean).toLocaleString()}
              </span>
            </span>
          )}
          {days.map((day, index) => {
            const value = valueOf(day);
            const height = peak === 0 ? 0 : (value / peak) * 100;
            const caption = `${shortDate(day.date)}: ${day.datasets} dataset${day.datasets === 1 ? "" : "s"}, ${day.rows.toLocaleString()} rows`;
            return (
              <div key={day.key} className="group relative flex h-full flex-1 flex-col justify-end">
                {/* The hover layer: one reading per column, held above the bar
                    so a short bar's tooltip is not painted over its neighbours.
                    The columns at either end anchor to their own edge instead
                    of centring, which would run the label out of the card. */}
                <span
                  className={cn(
                    "pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-md border bg-popover",
                    "px-2 py-1 text-[11px] text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100",
                    index < 3 ? "left-0" : index > days.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2",
                  )}
                >
                  {caption}
                </span>
                {index === peakIndex && value > 0 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 text-center text-[10px] font-medium tabular-nums text-muted-foreground"
                    style={{ bottom: `calc(${height}% + 3px)` }}
                  >
                    {value.toLocaleString()}
                  </span>
                )}
                {value === 0 ? (
                  <span aria-hidden className="h-0.5 rounded-full bg-border" />
                ) : (
                  <span
                    aria-hidden
                    className="min-h-1.5 rounded-t-[4px] bg-primary/85 transition-colors group-hover:bg-primary"
                    style={{ height: `${height}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
        <span>{shortDate(days[0]!.date)}</span>
        <span className="tabular-nums">
          {total.toLocaleString()} run{total === 1 ? "" : "s"} · {rows.toLocaleString()} rows
        </span>
        <span>Today</span>
      </div>

      {total > 0 && (
        <p className="text-center text-[11px] tabular-nums text-muted-foreground">
          Busiest {shortDate(busiest!.date)} · generated on {active} of the last {ACTIVITY_DAYS} days ·{" "}
          {(rows / total).toLocaleString(undefined, { maximumFractionDigits: 0 })} rows a run
        </p>
      )}

      <table className="sr-only">
        <caption>Datasets generated per day over the last {ACTIVITY_DAYS} days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Datasets</th>
            <th scope="col">Rows</th>
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day.key}>
              <th scope="row">{shortDate(day.date)}</th>
              <td>{day.datasets}</td>
              <td>{day.rows.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The datasets / rows switch that sits in the activity panel's heading. */
function MetricToggle({ metric, onChange }: { metric: Metric; onChange: (metric: Metric) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
      {(["datasets", "rows"] as const).map(option => (
        <button
          key={option}
          type="button"
          aria-pressed={metric === option}
          onClick={() => onChange(option)}
          className={cn(
            "focus-ring rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors",
            metric === option ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- composition ------------------------------- */

/** How many generator groups the breakdown draws before it stops naming them. */
const GROUPS_SHOWN = 6;

/**
 * Which generators the saved schemas lean on, by group.
 *
 * Bars rather than a pie: the question this answers is "which of these is
 * biggest, and by how much", and lengths off a common baseline are the one
 * comparison the eye does accurately.
 */
function CompositionChart({ composition: made }: { composition: Composition }) {
  const shown = made.groups.slice(0, GROUPS_SHOWN);
  const rest = made.groups.slice(GROUPS_SHOWN);
  const restCount = rest.reduce((sum, group) => sum + group.count, 0);
  const peak = shown[0]?.count ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-2 px-4 py-3">
      {shown.map(group => (
        <div key={group.name} className="flex items-center gap-2">
          <span className="w-24 shrink-0 truncate text-xs" title={group.name}>
            {group.name}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              aria-hidden
              className="block h-full rounded-full bg-primary/75"
              style={{ width: `${peak === 0 ? 0 : (group.count / peak) * 100}%` }}
            />
          </span>
          <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {group.count} · {Math.round((group.count / made.fields) * 100)}%
          </span>
        </div>
      ))}
      <p className="mt-auto border-t pt-2 text-[11px] text-muted-foreground">
        {made.types} of {FIELD_TYPES.length} generator types in use
        {restCount > 0 && ` · ${restCount} more field${restCount === 1 ? "" : "s"} across ${rest.length} other group${rest.length === 1 ? "" : "s"}`}
        {made.largest > 0 && ` · largest schema ${made.largest} field${made.largest === 1 ? "" : "s"}`}
      </p>
    </div>
  );
}

/* -------------------------------- dashboard -------------------------------- */

export function Dashboard({
  me,
  configs,
  datasets,
  templates,
  notes,
  totals,
  storage,
  onNewConfig,
  onLoadConfig,
  onLoadDataset,
  onNewTemplate,
  onLoadTemplate,
  onImport,
  onOpenSettings,
  onClose,
  leading,
}: Props) {
  // Asked for here rather than passed down: the key list is the settings
  // page's business, and the dashboard only wants to know how many there are.
  // A failure is silent — a count is not worth an error banner.
  const [keyCount, setKeyCount] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    void api
      .listApiKeys()
      .then(keys => live && setKeyCount(keys.length))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const [metric, setMetric] = useState<Metric>("datasets");

  const days = useMemo(() => activityDays(datasets), [datasets]);
  const made = useMemo(() => composition(configs), [configs]);

  const mine = <T extends { ownerId: string }>(items: T[]) => items.filter(item => item.ownerId === me.id);
  const theirs = <T extends { ownerId: string }>(items: T[]) => items.filter(item => item.ownerId !== me.id);

  const myConfigs = mine(configs);
  const sharedConfigs = theirs(configs);
  const sharedTemplates = theirs(templates);
  const shared = sharedConfigs.length + sharedTemplates.length;

  const rowsHeld = datasets.reduce((sum, dataset) => sum + dataset.rowCount, 0);
  const sharedOut =
    myConfigs.reduce((sum, config) => sum + config.sharedWith.length, 0) +
    mine(templates).reduce((sum, template) => sum + template.sharedWith.length, 0);

  // The fortnight splits down the middle: the week just gone against the one
  // before it, which is the comparison the tiles put beside their numbers.
  const half = Math.floor(days.length / 2);
  const sum = (window: Day[], of: (day: Day) => number) => window.reduce((total, day) => total + of(day), 0);
  const runsDelta = sum(days.slice(half), day => day.datasets) - sum(days.slice(0, half), day => day.datasets);
  const rowsDelta = sum(days.slice(half), day => day.rows) - sum(days.slice(0, half), day => day.rows);

  const configNames = useMemo(
    () => new Map(configs.map(config => [config.id, config.name] as const)),
    [configs],
  );

  const recentConfigs = [...configs]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
  const recentDatasets = datasets.slice(0, 5);
  const recentTemplates = [...templates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

  const firstRun = configs.length === 0 && datasets.length === 0 && templates.length === 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const who = (me.name || me.email).split("@")[0];

  /** What one configuration's row says under its name. */
  const configSubtitle = (config: SchemaConfig) =>
    [
      `${config.fields.length} field${config.fields.length === 1 ? "" : "s"}`,
      `${config.rowCount.toLocaleString()} rows`,
      config.mappings.length ? `${config.mappings.length} linked` : null,
      config.locale,
      config.seed ? "seeded" : null,
      timeAgo(config.updatedAt),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b bg-card/40 px-4 py-3">
        {leading}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <LayoutDashboard className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold leading-tight tracking-tight">
            {greeting}, {who}
          </h1>
          <p className="truncate text-xs text-muted-foreground" title={storage}>
            {storage || "Connecting…"}
          </p>
        </div>
        <Button onClick={onNewConfig} className="shadow-sm">
          <Plus />
          New schema
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close the dashboard" title="Back to the editor">
          <X />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          {firstRun ? (
            <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="flex items-start gap-3 border-b bg-muted/30 px-4 py-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold leading-tight">Nothing here yet — three steps to a dataset</h2>
                  <p className="text-xs text-muted-foreground">
                    Everything you make is kept on your account, and nothing leaves it unless you share it.
                  </p>
                </div>
              </div>
              <ol className="divide-y">
                {[
                  {
                    icon: <Braces className="size-4" />,
                    label: "Paste a structure",
                    description: "JSON, a TypeScript type or a CREATE TABLE — the fields are inferred from it.",
                    onClick: onImport,
                  },
                  {
                    icon: <ListTree className="size-4" />,
                    label: "Shape the schema",
                    description: "Adjust types, ranges and locales, or build the whole thing by hand.",
                    onClick: onNewConfig,
                  },
                  {
                    icon: <Play className="size-4" />,
                    label: "Generate and export",
                    description: "Rows land in the preview, then download them as CSV, JSON or SQL.",
                    onClick: onNewConfig,
                  },
                ].map((step, index) => (
                  <li key={step.label} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={step.onClick}>
                      {step.icon}
                      Start
                    </Button>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Stat
                icon={<ListTree className="size-3.5" />}
                label="Configurations"
                value={totals?.configs ?? configs.length}
                footnote={
                  sharedConfigs.length
                    ? `${myConfigs.length} yours · ${sharedConfigs.length} shared with you`
                    : sharedOut
                      ? `Shared out ${sharedOut} time${sharedOut === 1 ? "" : "s"}`
                      : "Saved schemas you can generate from"
                }
              />
              <Stat
                icon={<FileStack className="size-3.5" />}
                label="Datasets"
                value={totals?.datasets ?? datasets.length}
                delta={{ value: runsDelta, unit: "runs" }}
                footnote={
                  recentDatasets[0] ? `Last run ${timeAgo(recentDatasets[0].createdAt)}` : "Nothing generated yet"
                }
              />
              <Stat
                icon={<Database className="size-3.5" />}
                label="Rows held"
                value={rowsHeld}
                delta={{ value: rowsDelta, unit: "rows" }}
                footnote={
                  datasets.length
                    ? `Across the ${datasets.length} most recent dataset${datasets.length === 1 ? "" : "s"} · ${Math.round(rowsHeld / datasets.length).toLocaleString()} a run`
                    : "Nothing generated yet"
                }
              />
              <Stat
                icon={<Layers className="size-3.5" />}
                label="Fields defined"
                value={made.fields}
                footnote={
                  made.fields
                    ? `${made.types} generator type${made.types === 1 ? "" : "s"} in use · largest schema ${made.largest}`
                    : "No schema has any fields yet"
                }
              />
              <Stat
                icon={<FileCode2 className="size-3.5" />}
                label="Script templates"
                value={totals?.scriptTemplates ?? templates.length}
                footnote={
                  sharedTemplates.length
                    ? `${sharedTemplates.length} shared with you`
                    : "Rendered against any dataset"
                }
              />
              <Stat
                icon={<StickyNote className="size-3.5" />}
                label="Notes"
                value={totals?.notes ?? notes.length}
                footnote={
                  notes[0] ? `Last edited ${timeAgo(notes[0].updatedAt)}` : "Markdown about the rest of this workspace"
                }
              />
              <Stat
                icon={<Share2 className="size-3.5" />}
                label="Sharing"
                value={shared + sharedOut}
                footnote={
                  shared || sharedOut
                    ? `${shared} shared with you · ${sharedOut} shared out`
                    : "Nothing shared either way"
                }
              />
            </div>
          )}

          {/* An account with nothing in it is shown the steps and the ways in,
              and none of the panels that would only say "nothing here" four
              more times over. */}
          <div className={cn("grid gap-4", !firstRun && "lg:grid-cols-[3fr_2fr]")}>
            {!firstRun && (
              <Panel
                icon={<Activity className="size-4" />}
                title="Generation activity"
                description={`${metric === "rows" ? "Rows" : "Datasets"} you generated over the last ${ACTIVITY_DAYS} days`}
                action={<MetricToggle metric={metric} onChange={setMetric} />}
              >
                <ActivityChart days={days} metric={metric} />
              </Panel>
            )}

            <Panel icon={<Compass className="size-4" />} title="Next" description="The usual ways in">
              <div className="divide-y">
                <Action
                  icon={<Braces className="size-4" />}
                  label="Import a structure"
                  description="Infer fields from JSON, TypeScript or SQL"
                  onClick={onImport}
                />
                <Action
                  icon={<Plus className="size-4" />}
                  label="New schema"
                  description="Start from an empty field list"
                  onClick={onNewConfig}
                />
                <Action
                  icon={<FileCode2 className="size-4" />}
                  label="New script template"
                  description="Turn a dataset into a seed script"
                  onClick={onNewTemplate}
                />
                <Action
                  icon={<KeyRound className="size-4" />}
                  label="API keys"
                  description={
                    keyCount === null
                      ? "Generate from your own scripts"
                      : `${keyCount} active · generate from your own scripts`
                  }
                  onClick={onOpenSettings}
                />
              </div>
            </Panel>
          </div>

          {!firstRun && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel
                icon={<ListTree className="size-4" />}
                title="Pick up where you left off"
                description="Most recently edited configurations"
                action={
                  <Button variant="ghost" size="sm" onClick={onNewConfig}>
                    <Plus />
                    New
                  </Button>
                }
              >
                {recentConfigs.length === 0 ? (
                  <EmptyNote>No saved configurations yet.</EmptyNote>
                ) : (
                  <div className="divide-y">
                    {recentConfigs.map(config => (
                      <RecentRow
                        key={config.id}
                        title={config.name}
                        subtitle={configSubtitle(config)}
                        badge={<ShareBadge record={config} mine={me.id} />}
                        onSelect={() => onLoadConfig(config)}
                      />
                    ))}
                  </div>
                )}
              </Panel>

              <Panel
                icon={<FileStack className="size-4" />}
                title="Recent datasets"
                description="Open one to preview, export or script it"
              >
                {recentDatasets.length === 0 ? (
                  <EmptyNote>Generated data will appear here.</EmptyNote>
                ) : (
                  <div className="divide-y">
                    {recentDatasets.map(dataset => (
                      <RecentRow
                        key={dataset.id}
                        title={dataset.name}
                        subtitle={[
                          `${dataset.rowCount.toLocaleString()} rows`,
                          `${dataset.fieldCount} field${dataset.fieldCount === 1 ? "" : "s"}`,
                          // A dataset keeps the id of the schema it came from,
                          // which may since have been deleted or been inline
                          // to begin with — either way there is no name to show.
                          dataset.configId && configNames.has(dataset.configId)
                            ? `from ${configNames.get(dataset.configId)}`
                            : null,
                          timeAgo(dataset.createdAt),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        onSelect={() => onLoadDataset(dataset)}
                      />
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {!firstRun && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel
                icon={<Shapes className="size-4" />}
                title="What your schemas are made of"
                description={`${made.fields.toLocaleString()} field${made.fields === 1 ? "" : "s"} across ${configs.length} configuration${configs.length === 1 ? "" : "s"}`}
              >
                {made.fields === 0 ? (
                  <EmptyNote>Add fields to a schema and their generators will be counted here.</EmptyNote>
                ) : (
                  <CompositionChart composition={made} />
                )}
              </Panel>

              <Panel
                icon={<FileCode2 className="size-4" />}
                title="Script templates"
                description="Rendered against a dataset to give you a seed script"
                action={
                  <Button variant="ghost" size="sm" onClick={onNewTemplate}>
                    <Plus />
                    New
                  </Button>
                }
              >
                {recentTemplates.length === 0 ? (
                  <EmptyNote>No script templates yet.</EmptyNote>
                ) : (
                  <div className="divide-y">
                    {recentTemplates.map(template => {
                      const lines = template.body ? template.body.split("\n").length : 0;
                      return (
                        <RecentRow
                          key={template.id}
                          title={template.name}
                          subtitle={`${lines.toLocaleString()} line${lines === 1 ? "" : "s"} · ${timeAgo(template.updatedAt)}`}
                          badge={<ShareBadge record={template} mine={me.id} />}
                          onSelect={() => onLoadTemplate(template)}
                        />
                      );
                    })}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* The account's own footnotes: where the records live, how long they
              have been yours, and what of them is not only yours. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5" title={storage}>
              <HardDrive className="size-3.5" />
              {hostOf(storage) || "Connecting…"}
            </span>
            <span>
              Account since{" "}
              {new Date(me.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
            {shared > 0 && (
              <span className="flex items-center gap-1.5">
                <Share2 className="size-3.5" />
                {shared} record{shared === 1 ? "" : "s"} shared with you — saving a change to one keeps your own copy.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
