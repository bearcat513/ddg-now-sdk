import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Database,
  Download,
  FileCode2,
  FileStack,
  ListTree,
  PanelLeftClose,
  PenLine,
  Plus,
  Search,
  Settings2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { searchNav, type Match } from "../../lib/navSearch";
import { countPlaceholders } from "../../../server/lib/scriptTemplate";
import { timeAgo } from "../../lib/timeAgo";
import { cn } from "../../lib/utils";
import type { ConfigSummary } from "../../lib/api";
import type { Dataset } from "../../../server/lib/types";
import type { ScriptTemplate } from "../../../server/lib/scriptTemplate";
import type { WhiteboardSummary } from "../../../server/lib/whiteboard";
import type { NavSection } from "../../../server/lib/preferences";

/**
 * Which lists can be folded shut.
 *
 * Defined with the preferences rather than here, because which ones are shut is
 * a stored preference — a list added to the nav has to be a name the preference
 * column understands, and one definition is what makes that true by
 * construction. Re-exported so the nav's own consumers still read it from the
 * nav.
 */
export type { NavSection };

type Props = {
  configs: ConfigSummary[];
  templates: ScriptTemplate[];
  whiteboards: WhiteboardSummary[];
  datasets: Dataset[];
  activeConfigId: string | null;
  activeTemplateId: string | null;
  /** The board on screen — null unless the whiteboard view is the one showing. */
  activeWhiteboardId: string | null;
  activeDatasetId: string | null;
  /** Where the data lives — the scope, and whether the API answered. */
  storage: string;
  /** The signed-in user, as the platform named them. */
  me: string;
  onNewConfig: () => void;
  onLoadConfig: (config: ConfigSummary) => void;
  onDeleteConfig: (id: string) => void;
  onImportConfig: (file: File) => void;
  onExportConfig: (config: ConfigSummary) => void;
  onNewTemplate: () => void;
  onLoadTemplate: (template: ScriptTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onNewWhiteboard: () => void;
  onLoadWhiteboard: (board: WhiteboardSummary) => void;
  onDeleteWhiteboard: (id: string) => void;
  onLoadDataset: (dataset: Dataset) => void;
  onDeleteDataset: (id: string) => void;
  /** Which lists are folded shut, and the control that folds them. */
  collapsedSections: NavSection[];
  onToggleSection: (section: NavSection) => void;
  /** Folds the nav away; the main header carries the control that brings it back. */
  onCollapse: () => void;
  /** Opens the settings view, which replaces the editor rather than floating over it. */
  onOpenSettings: () => void;
  /** Whether that view is the one on screen, so the control reads as current. */
  settingsOpen: boolean;
};

function ListRow({
  active,
  title,
  subtitle,
  hint,
  onSelect,
  onDelete,
  onDownload,
  downloadAs = "JSON",
}: {
  active: boolean;
  title: string;
  subtitle: string;
  /** Why a search turned this row up, when it was not the name that matched. */
  hint?: string;
  onSelect: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  /** What the download is — a configuration is JSON. */
  downloadAs?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-1 rounded-md px-2 py-1.5 text-left transition-colors",
        // The current record is tinted with the accent rather than the neutral
        // hover grey, so "selected" and "the pointer is here" stop looking alike.
        active ? "bg-primary/10 text-foreground" : "hover:bg-accent/60",
      )}
    >
      {/* A bar down the left edge of the current row. The tint alone is easy to
          miss against a hovered neighbour; an edge is not. */}
      {active && <span aria-hidden className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary" />}
      <button type="button" onClick={onSelect} className="focus-ring min-w-0 flex-1 rounded-sm text-left">
        <p className={cn("truncate text-sm", active ? "font-semibold" : "font-medium")}>{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        {/* The row's title does not contain what was typed, so the row says
            what does — otherwise a hit on a field name reads as a stray result. */}
        {hint && (
          <p className="truncate font-mono text-[10px] leading-relaxed text-primary/80" title={hint}>
            {hint}
          </p>
        )}
      </button>
      <div className="flex opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        {onDownload && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDownload}
            aria-label={`Download ${title} as ${downloadAs}`}
            title={`Download as ${downloadAs}`}
          >
            <Download className="text-muted-foreground hover:text-foreground" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={`Delete ${title}`} title="Delete">
            <Trash2 className="text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * One foldable list: a heading that is itself the control, its count, and
 * whatever actions belong to the group.
 *
 * The chevron rotates rather than swapping glyph, so the heading stays one
 * shape whichever way it is pointing. The count is on the heading precisely
 * because it is readable while the section is shut — a folded list that says
 * nothing about what is inside it is just a lost list.
 */
function Section({
  id,
  icon,
  label,
  count,
  open,
  onToggle,
  actions,
  children,
}: {
  id: NavSection;
  icon: React.ReactNode;
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const panelId = `nav-section-${id}`;
  return (
    <div className="p-2">
      {/* A fixed height, matching the icon buttons some of these carry, so
          every section's heading sits on the same line either way. */}
      <div className="mb-0.5 flex h-8 items-center gap-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="focus-ring -mx-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-1 text-left transition-colors hover:bg-accent/50"
        >
          <ChevronRight
            aria-hidden
            className={cn("size-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
          />
          <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {icon}
            <span className="truncate">{label}</span>
          </span>
          <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-px text-[10px] font-semibold tabular-nums text-muted-foreground">
            {count}
          </span>
        </button>
        {actions && <div className="flex shrink-0">{actions}</div>}
      </div>
      <div id={panelId} hidden={!open}>
        {children}
      </div>
    </div>
  );
}

/**
 * What a template row says under its name.
 *
 * How many times the rows go in, rather than how long the script is: a
 * template with no dataset placeholder renders the run's details and none of
 * its data, which is the one thing about a template worth noticing from the
 * nav.
 */
function templateSubtitle(template: ScriptTemplate): string {
  const uses = countPlaceholders(template.body);
  return `${uses} dataset placeholder${uses === 1 ? "" : "s"} · ${timeAgo(template.updatedAt)}`;
}

/**
 * Whose board it is, under its name. The nav says so because it changes what
 * opening one means: somebody else's board is read, and saving it forks it.
 */
function whiteboardSubtitle(board: WhiteboardSummary): string {
  return `${board.canWrite ? "Yours" : `by ${board.ownerId}`} · ${timeAgo(board.updatedAt)}`;
}

/** Nothing here yet, said quietly rather than as a row of its own. */
function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-1.5 text-xs text-muted-foreground/70">{children}</p>;
}

/** The signed-in account, as the initial of whatever it is called. */
function Avatar({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold uppercase text-primary"
    >
      {label.trim().charAt(0) || "?"}
    </span>
  );
}

export function Sidebar({
  configs,
  templates,
  whiteboards,
  datasets,
  activeConfigId,
  activeTemplateId,
  activeWhiteboardId,
  activeDatasetId,
  storage,
  me,
  onNewConfig,
  onLoadConfig,
  onDeleteConfig,
  onImportConfig,
  onExportConfig,
  onNewTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  onNewWhiteboard,
  onLoadWhiteboard,
  onDeleteWhiteboard,
  onLoadDataset,
  onDeleteDataset,
  collapsedSections,
  onToggleSection,
  onCollapse,
  onOpenSettings,
  settingsOpen,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // null while the first list call is still out; otherwise whether the label
  // App built is a scope that answered rather than a failure line.
  const reachable = storage ? !/unreachable|unavailable/i.test(storage) : null;

  const results = useMemo(
    () => searchNav(query, { configs, templates, whiteboards, datasets }),
    [query, configs, templates, whiteboards, datasets],
  );
  const searching = query.trim().length > 0;

  /**
   * A search is only useful if it can reach a folded list, so while one is
   * running every section that has a hit is opened regardless of preference.
   * Sections with nothing in them stay shut, which is itself the answer to
   * "which list is it in".
   */
  const isOpen = (section: NavSection, matches: number) =>
    searching ? matches > 0 : !collapsedSections.includes(section);

  // ⌘K / Ctrl-K from anywhere, and "/" when the keystroke is not already going
  // into a field — the two shortcuts people try without being told.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      const shortcut = (event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing);
      if (!shortcut) return;
      event.preventDefault();
      searchInput.current?.focus();
      searchInput.current?.select();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /** What a list says when a search has emptied it, rather than a bare gap. */
  const note = (empty: string) => <EmptyNote>{searching ? "No matches here." : empty}</EmptyNote>;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-muted/30">
      <div className="flex items-center gap-2.5 border-b px-3 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Database className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight tracking-tight">Dummy Data</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground" title={storage}>
            {/* Green while the scoped API answers, amber once it stops — the
                storage line is the only place an outage shows up early. */}
            <span
              aria-hidden
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                reachable === null && "animate-pulse bg-muted-foreground/40",
                reachable === true && "bg-emerald-500",
                reachable === false && "bg-amber-500",
              )}
            />
            <span className="truncate">{storage || "Connecting…"}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={onCollapse}
          aria-label="Collapse the sidebar"
          title="Collapse the sidebar"
        >
          <PanelLeftClose className="text-muted-foreground hover:text-foreground" />
        </Button>
      </div>

      <div className="border-b px-2 py-2">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            ref={searchInput}
            type="search"
            role="searchbox"
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key !== "Escape") return;
              // First Escape clears, a second gives the focus back to the page.
              if (query) setQuery("");
              else searchInput.current?.blur();
            }}
            placeholder="Search everything…"
            aria-label="Search configurations, script templates, whiteboards and datasets"
            className={cn(
              "focus-ring h-8 w-full rounded-md border bg-background pl-8 pr-14 text-sm",
              "placeholder:text-muted-foreground/70",
              // Safari draws its own clear button on a search input, which
              // would sit on top of the one below.
              "[&::-webkit-search-cancel-button]:appearance-none",
            )}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                searchInput.current?.focus();
              }}
              aria-label="Clear the search"
              className="focus-ring absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd
              aria-hidden
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-1 py-px font-mono text-[10px] text-muted-foreground/80"
            >
              ⌘K
            </kbd>
          )}
        </div>
        {searching && (
          <p role="status" className="px-1 pt-1.5 text-[11px] text-muted-foreground">
            {results.total === 0
              ? `Nothing matches “${query.trim()}”.`
              : `${results.total} ${results.total === 1 ? "match" : "matches"}`}
          </p>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) onImportConfig(file);
          // Reset so re-picking the same file fires onChange again.
          event.target.value = "";
        }}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Section
          id="configs"
          icon={<ListTree className="size-3.5" />}
          label="Configurations"
          count={results.configs.length}
          open={isOpen("configs", results.configs.length)}
          onToggle={() => onToggleSection("configs")}
          actions={
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => fileInput.current?.click()}
                aria-label="Import configuration from JSON"
                title="Import configuration from JSON"
              >
                <Upload />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onNewConfig}
                aria-label="New configuration"
                title="New configuration"
              >
                <Plus />
              </Button>
            </>
          }
        >
          {results.configs.length === 0
            ? note("No saved configurations yet.")
            : results.configs.map(({ item: config, hint }: Match<ConfigSummary>) => (
                <ListRow
                  key={config.id}
                  active={config.id === activeConfigId}
                  title={config.name}
                  subtitle={`${config.fieldCount} field${config.fieldCount === 1 ? "" : "s"} · ${timeAgo(config.updatedAt)}`}
                  hint={hint}
                  onSelect={() => onLoadConfig(config)}
                  onDelete={() => onDeleteConfig(config.id)}
                  onDownload={() => onExportConfig(config)}
                />
              ))}
        </Section>

        <div className="border-t">
          <Section
            id="templates"
            icon={<FileCode2 className="size-3.5" />}
            label="Script templates"
            count={results.templates.length}
            open={isOpen("templates", results.templates.length)}
            onToggle={() => onToggleSection("templates")}
            actions={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onNewTemplate}
                aria-label="New script template"
                title="New script template"
              >
                <Plus />
              </Button>
            }
          >
            {results.templates.length === 0
              ? note("No script templates yet.")
              : results.templates.map(({ item: template, hint }: Match<ScriptTemplate>) => (
                  <ListRow
                    key={template.id}
                    active={template.id === activeTemplateId}
                    title={template.name}
                    subtitle={templateSubtitle(template)}
                    hint={hint}
                    onSelect={() => onLoadTemplate(template)}
                    onDelete={() => onDeleteTemplate(template.id)}
                  />
                ))}
          </Section>
        </div>

        <div className="border-t">
          <Section
            id="whiteboards"
            icon={<PenLine className="size-3.5" />}
            label="Whiteboards"
            count={results.whiteboards.length}
            open={isOpen("whiteboards", results.whiteboards.length)}
            onToggle={() => onToggleSection("whiteboards")}
            actions={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onNewWhiteboard}
                aria-label="New whiteboard"
                title="New whiteboard"
              >
                <Plus />
              </Button>
            }
          >
            {results.whiteboards.length === 0
              ? note("No whiteboards yet.")
              : results.whiteboards.map(({ item: board, hint }: Match<WhiteboardSummary>) => (
                  <ListRow
                    key={board.id}
                    active={board.id === activeWhiteboardId}
                    title={board.name}
                    subtitle={whiteboardSubtitle(board)}
                    hint={hint}
                    onSelect={() => onLoadWhiteboard(board)}
                    onDelete={board.canWrite ? () => onDeleteWhiteboard(board.id) : undefined}
                  />
                ))}
          </Section>
        </div>

        <div className="border-t">
          <Section
            id="datasets"
            icon={<FileStack className="size-3.5" />}
            label="Recent datasets"
            count={results.datasets.length}
            open={isOpen("datasets", results.datasets.length)}
            onToggle={() => onToggleSection("datasets")}
          >
            {results.datasets.length === 0
              ? note("Generated data will appear here.")
              : results.datasets.map(({ item: dataset, hint }: Match<Dataset>) => (
                  <ListRow
                    key={dataset.id}
                    active={dataset.id === activeDatasetId}
                    title={dataset.name}
                    subtitle={`${dataset.rowCount.toLocaleString()} rows · ${timeAgo(dataset.createdAt)}`}
                    hint={hint}
                    onSelect={() => onLoadDataset(dataset)}
                    onDelete={() => onDeleteDataset(dataset.id)}
                  />
                ))}
          </Section>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t bg-card/40 px-3 py-2">
        <Avatar label={me} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" title={me}>
            {me}
          </p>
          {/* Who you are is the platform's answer, not this app's: there is no
              sign-out here because the session belongs to the instance. */}
          <p className="truncate text-[11px] text-muted-foreground">Signed in to this instance</p>
        </div>
        {/* Beside the name on purpose: the preferences behind it belong to that
            account rather than to this browser, and this is the one corner of
            the page that is already about who you are. */}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          aria-current={settingsOpen ? "page" : undefined}
          title="Settings"
          className={cn(
            "focus-ring shrink-0 rounded-md p-1.5 transition-colors",
            settingsOpen ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Settings2 className="size-4" />
        </button>
      </div>
    </aside>
  );
}
