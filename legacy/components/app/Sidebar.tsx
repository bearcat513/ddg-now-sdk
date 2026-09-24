import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Database,
  Download,
  FileCode2,
  FileStack,
  LayoutDashboard,
  ListTree,
  LogOut,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  Share2,
  StickyNote,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCS_PATH } from "@/components/app/OpenApiExport";
import { searchNav, type Match } from "@/lib/navSearch";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/api";
import type { NavSection } from "@/lib/preferences";
import { noteExcerpt, type Note } from "@/lib/notes";
import type { Dataset, SchemaConfig } from "@/lib/types";
import type { ScriptTemplate } from "@/lib/scriptTemplate";

type Props = {
  configs: SchemaConfig[];
  datasets: Dataset[];
  templates: ScriptTemplate[];
  notes: Note[];
  activeConfigId: string | null;
  activeDatasetId: string | null;
  activeTemplateId: string | null;
  activeNoteId: string | null;
  /** Where the data lives — the PocketBase URL, or why it is not readable. */
  storage: string;
  me: SessionUser;
  onSignOut: () => void;
  onNewConfig: () => void;
  onLoadConfig: (config: SchemaConfig) => void;
  onDeleteConfig: (id: string) => void;
  onShareConfig: (config: SchemaConfig) => void;
  onImportConfig: (file: File) => void;
  onExportConfig: (config: SchemaConfig) => void;
  onLoadDataset: (dataset: Dataset) => void;
  onDeleteDataset: (id: string) => void;
  onNewTemplate: () => void;
  onLoadTemplate: (template: ScriptTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onShareTemplate: (template: ScriptTemplate) => void;
  onNewNote: () => void;
  onLoadNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onExportNote: (note: Note) => void;
  /** Which lists are folded shut, and the control that folds them. */
  collapsedSections: NavSection[];
  onToggleSection: (section: NavSection) => void;
  /** Whether the dashboard is the page on screen. */
  dashboardOpen: boolean;
  onOpenDashboard: () => void;
  /** Whether the settings page is the one on screen. */
  settingsOpen: boolean;
  onOpenSettings: () => void;
  /** Folds the nav away; the main header carries the control that brings it back. */
  onCollapse: () => void;
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
  onShare,
  shareCount = 0,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  /** Why a search turned this row up, when it was not the name that matched. */
  hint?: string;
  onSelect: () => void;
  /** Absent for a record someone else owns — only its owner can delete it. */
  onDelete?: () => void;
  onDownload?: () => void;
  /** What the download is — a configuration is JSON, a note is Markdown. */
  downloadAs?: string;
  onShare?: () => void;
  shareCount?: number;
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
      {active && (
        <span aria-hidden className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary" />
      )}
      <button type="button" onClick={onSelect} className="focus-ring min-w-0 flex-1 rounded-sm text-left">
        <p className={cn("truncate text-sm", active ? "font-semibold" : "font-medium")}>{title}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          {shareCount > 0 && (
            <span className="flex items-center gap-0.5" title={`Shared with ${shareCount}`}>
              <Users className="size-3" />
              {shareCount}
            </span>
          )}
          {shareCount > 0 && <span aria-hidden>·</span>}
          {subtitle}
        </p>
        {/* The row's title does not contain what was typed, so the row says
            what does — otherwise a hit on a field name reads as a stray result. */}
        {hint && (
          <p className="truncate font-mono text-[10px] leading-relaxed text-primary/80" title={hint}>
            {hint}
          </p>
        )}
      </button>
      <div className="flex opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        {onShare && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onShare}
            aria-label={`Share ${title}`}
            title={shareCount > 0 ? `Shared with ${shareCount} — manage` : "Share with someone"}
          >
            <Share2
              className={cn(
                "text-muted-foreground hover:text-foreground",
                shareCount > 0 && "text-primary",
              )}
            />
          </Button>
        )}
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

/** A "Shared with me" heading, shown only when there is something under it. */
function SharedHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex items-center gap-1.5 px-2 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <Share2 className="size-3" />
      {children}
      <span aria-hidden className="ml-1 h-px flex-1 bg-border" />
    </p>
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
  datasets,
  templates,
  notes,
  activeConfigId,
  activeDatasetId,
  activeTemplateId,
  activeNoteId,
  storage,
  me,
  onSignOut,
  onNewConfig,
  onLoadConfig,
  onDeleteConfig,
  onShareConfig,
  onImportConfig,
  onExportConfig,
  onLoadDataset,
  onDeleteDataset,
  onNewTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  onShareTemplate,
  onNewNote,
  onLoadNote,
  onDeleteNote,
  onExportNote,
  collapsedSections,
  onToggleSection,
  dashboardOpen,
  onOpenDashboard,
  settingsOpen,
  onOpenSettings,
  onCollapse,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // null while the meta call is still out; otherwise whether the label App
  // built is a URL that answered rather than one of its two failure lines.
  const reachable = storage ? !/unreachable|unavailable/i.test(storage) : null;

  const results = useMemo(
    () => searchNav(query, { configs, templates, notes, datasets }),
    [query, configs, templates, notes, datasets],
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
      const typing =
        target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      const shortcut = (event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing);
      if (!shortcut) return;
      event.preventDefault();
      searchInput.current?.focus();
      searchInput.current?.select();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Ownership decides what a row may do, so the two groups are split here
  // rather than tested at every button.
  const mine = <T extends { ownerId: string }>(items: Match<T>[]) => items.filter(m => m.item.ownerId === me.id);
  const theirs = <T extends { ownerId: string }>(items: Match<T>[]) => items.filter(m => m.item.ownerId !== me.id);

  const myConfigs = mine(results.configs);
  const sharedConfigs = theirs(results.configs);
  const myTemplates = mine(results.templates);
  const sharedTemplates = theirs(results.templates);

  const configRow = ({ item: config, hint }: Match<SchemaConfig>, owned: boolean) => (
    <ListRow
      key={config.id}
      active={config.id === activeConfigId}
      title={config.name}
      subtitle={`${config.fields.length} fields · ${timeAgo(config.updatedAt)}`}
      hint={hint}
      shareCount={owned ? config.sharedWith.length : 0}
      onSelect={() => onLoadConfig(config)}
      onDelete={owned ? () => onDeleteConfig(config.id) : undefined}
      onDownload={() => onExportConfig(config)}
      onShare={() => onShareConfig(config)}
    />
  );

  const templateRow = ({ item: template, hint }: Match<ScriptTemplate>, owned: boolean) => (
    <ListRow
      key={template.id}
      active={template.id === activeTemplateId}
      title={template.name}
      subtitle={timeAgo(template.updatedAt)}
      hint={hint}
      shareCount={owned ? template.sharedWith.length : 0}
      onSelect={() => onLoadTemplate(template)}
      onDelete={owned ? () => onDeleteTemplate(template.id) : undefined}
      onShare={() => onShareTemplate(template)}
    />
  );

  const noteRow = ({ item: note, hint }: Match<Note>) => (
    <ListRow
      key={note.id}
      active={note.id === activeNoteId}
      title={note.title}
      // The first line of the note, not its timestamp: a list of notes is read
      // to find the one that said a particular thing.
      subtitle={noteExcerpt(note.body) || timeAgo(note.updatedAt)}
      hint={hint}
      onSelect={() => onLoadNote(note)}
      onDelete={() => onDeleteNote(note.id)}
      onDownload={() => onExportNote(note)}
      downloadAs="Markdown"
    />
  );

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
            {/* Green while PocketBase answers, amber once it stops — the
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
          <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
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
            aria-label="Search configurations, script templates and datasets"
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
          {myConfigs.length === 0 ? note("No saved configurations yet.") : myConfigs.map(m => configRow(m, true))}

          {sharedConfigs.length > 0 && (
            <>
              <SharedHeading>Shared with me</SharedHeading>
              {sharedConfigs.map(m => configRow(m, false))}
            </>
          )}
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
            {myTemplates.length === 0
              ? note("No script templates yet.")
              : myTemplates.map(m => templateRow(m, true))}

            {sharedTemplates.length > 0 && (
              <>
                <SharedHeading>Shared with me</SharedHeading>
                {sharedTemplates.map(m => templateRow(m, false))}
              </>
            )}
          </Section>
        </div>

        <div className="border-t">
          <Section
            id="notes"
            icon={<StickyNote className="size-3.5" />}
            label="Notes"
            count={results.notes.length}
            open={isOpen("notes", results.notes.length)}
            onToggle={() => onToggleSection("notes")}
            actions={
              <Button variant="ghost" size="icon-sm" onClick={onNewNote} aria-label="New note" title="New note">
                <Plus />
              </Button>
            }
          >
            {results.notes.length === 0 ? note("No notes yet.") : results.notes.map(noteRow)}
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
              : results.datasets.map(({ item: dataset, hint }) => (
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
        <Avatar label={me.name || me.email} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" title={me.email}>
            {me.name || me.email}
          </p>
          {me.name && <p className="truncate text-[11px] text-muted-foreground">{me.email}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenDashboard}
          aria-label="Dashboard"
          title="What is in this workspace, and what to do next"
        >
          <LayoutDashboard
            className={cn(dashboardOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          />
        </Button>
        {/* A page of its own rather than a view, so it is a link: the middle
            click and the context menu both work, and the reference can be
            kept open in a tab beside the app. */}
        <Button variant="ghost" size="icon-sm" asChild>
          <a href={DOCS_PATH} aria-label="API reference" title="The API behind every action on this page">
            <BookOpen className="text-muted-foreground hover:text-foreground" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Preferences, password and the workspace export"
        >
          <Settings className={cn(settingsOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground")} />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onSignOut} aria-label="Sign out" title="Sign out">
          <LogOut className="text-muted-foreground hover:text-foreground" />
        </Button>
      </div>
    </aside>
  );
}
