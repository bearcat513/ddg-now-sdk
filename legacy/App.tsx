import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Braces,
  Database,
  Download,
  FileCode2,
  Info,
  ListTree,
  Link2,
  Loader2,
  PanelLeft,
  PanelRightOpen,
  Play,
  Plus,
  Save,
  Share2,
  StickyNote,
  Terminal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiPreviewDialog } from "@/components/app/ApiPreviewDialog";
import { AuthPanel } from "@/components/app/AuthPanel";
import { Dashboard, type Totals } from "@/components/app/Dashboard";
import { FieldRow } from "@/components/app/FieldRow";
import { ImportPanel } from "@/components/app/ImportPanel";
import { MappingsPanel } from "@/components/app/MappingsPanel";
import { MetadataEditor } from "@/components/app/MetadataEditor";
import { NotesPanel } from "@/components/app/NotesPanel";
import { PreviewTable } from "@/components/app/PreviewTable";
import { ScriptTemplatePanel } from "@/components/app/ScriptTemplatePanel";
import { SettingsPanel, type SaveState } from "@/components/app/SettingsPanel";
import { ShareDialog } from "@/components/app/ShareDialog";
import { Sidebar } from "@/components/app/Sidebar";
import { SplitHandle } from "@/components/app/SplitHandle";
import { api, isUnauthorized, type Shareable, type SessionUser } from "@/lib/api";
import { configFileName, serializeConfigFile } from "@/lib/configFile";
import { fromPairs, toPairs, type MetadataPair } from "@/lib/metadata";
import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
  PREFERENCE_LIMITS,
  type NavSection,
  type Preferences,
} from "@/lib/preferences";
import { STARTER_NOTE_BODY, noteFileName, noteMarkdown, type Note, type ResolvedReference } from "@/lib/notes";
import { STARTER_TEMPLATE_BODY, type ScriptTemplate } from "@/lib/scriptTemplate";
import { cn } from "@/lib/utils";
import {
  defaultFieldOptions,
  LOCALES,
  type Dataset,
  type Field,
  type FieldMapping,
  type FieldType,
  type SchemaConfig,
} from "@/lib/types";
import "./index.css";

type Banner = { kind: "error" | "info"; lines: string[] } | null;

type Tab = "schema" | "import" | "mappings" | "scripts" | "notes";

/** The tabs in the order they are drawn — what the arrow keys walk. */
const TABS: Tab[] = ["import", "schema", "mappings", "scripts", "notes"];

/** The editor, or one of the two pages that stand over it. */
type View = "dashboard" | "editor" | "settings";

/** The record whose share list is open, if any. */
type Sharing = { kind: Shareable; id: string; title: string } | null;

/** How long the app sits on a preference change before writing it. */
const PREFERENCE_SAVE_DELAY_MS = 500;

const newField = (type: FieldType): Field => ({
  id: crypto.randomUUID(),
  name: "",
  type,
  options: defaultFieldOptions(type),
});

export function App() {
  // undefined while the session is still being checked, null when signed out.
  const [me, setMe] = useState<SessionUser | null | undefined>(undefined);
  const [sharing, setSharing] = useState<Sharing>(null);
  /** Whether the cURL preview of the current generate call is open. */
  const [apiPreview, setApiPreview] = useState(false);

  const [configs, setConfigs] = useState<SchemaConfig[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [storage, setStorage] = useState("");
  /** The server's own record counts, for the dashboard. Null until it answers. */
  const [totals, setTotals] = useState<Totals | null>(null);

  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [name, setName] = useState("Untitled schema");
  const [rowCount, setRowCount] = useState(25);
  const [seed, setSeed] = useState("");
  /** Empty means faker's default (English); it travels with the schema. */
  const [locale, setLocale] = useState("");
  /** Metadata as rows, so a key can be renamed without the row moving. */
  const [metadata, setMetadata] = useState<MetadataPair[]>([]);
  const [metadataOpen, setMetadataOpen] = useState(false);
  /** Measured while dragging, to turn a pointer position into a percentage. */
  const editorPanes = useRef<HTMLDivElement>(null);
  const [fields, setFields] = useState<Field[]>([]);
  /** Fields here that draw from another configuration. Saved with the schema. */
  const [mappings, setMappings] = useState<FieldMapping[]>([]);

  const [tab, setTab] = useState<Tab>("import");

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState(STARTER_TEMPLATE_BODY);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState(STARTER_NOTE_BODY);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [truncated, setTruncated] = useState(false);
  /**
   * Whether the data pane is unfolded. The editor is the workspace and the
   * data is what comes out of it, so the pane stays a rail until there is a
   * dataset to look at — generating one, or opening one from the nav, swings
   * it open, and dropping the dataset folds it back. It is deliberately not a
   * preference: "open" describes what is on screen now, not how this account
   * likes its windows.
   */
  const [dataPaneOpen, setDataPaneOpen] = useState(false);

  useEffect(() => setDataPaneOpen(dataset !== null), [dataset]);

  // The dashboard is where a session starts: it says what is already here
  // before asking anyone to fill in a schema.
  const [view, setView] = useState<View>("dashboard");
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [preferenceSave, setPreferenceSave] = useState<SaveState>("idle");
  const preferenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read by callbacks that must not be rebuilt every time a preference
  // changes — `refreshLists` is a dependency of half the effects below.
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  const refreshLists = useCallback(async () => {
    const [nextConfigs, nextDatasets, nextTemplates, nextNotes] = await Promise.all([
      api.listConfigs(),
      api.listDatasets(preferencesRef.current.datasetHistoryLimit),
      api.listScriptTemplates(),
      api.listNotes(),
    ]);
    setConfigs(nextConfigs);
    setDatasets(nextDatasets);
    setTemplates(nextTemplates);
    setNotes(nextNotes);
  }, []);

  /** Everything this account can see, loaded once a session is known good. */
  const loadWorkspace = useCallback(async () => {
    await refreshLists();
    // The storage label doubles as an outage signal: PocketBase is a separate
    // service, and "unreachable" explains every other error on the page.
    try {
      const meta = await api.meta();
      setStorage(meta.reachable ? meta.url : `${meta.url} · unreachable`);
      setTotals({
        configs: meta.configs,
        datasets: meta.datasets,
        scriptTemplates: meta.scriptTemplates,
        notes: meta.notes,
      });
    } catch {
      setStorage("PocketBase unavailable");
      setTotals(null);
    }
  }, [refreshLists]);

  useEffect(() => {
    void api
      .me()
      .then(({ user }) => setMe(user))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (me) void loadWorkspace().catch(error => fail(error));
  }, [me, loadWorkspace]);

  /**
   * Preferences ride along on the session, so they are here before the first
   * paint. The editor only takes its defaults from them once per sign-in: a
   * password change hands back a fresh session, and that must not overwrite a
   * schema someone is in the middle of.
   */
  const editorSeeded = useRef(false);
  useEffect(() => {
    if (!me) {
      editorSeeded.current = false;
      return;
    }
    setPreferences(me.preferences);
    if (editorSeeded.current) return;
    editorSeeded.current = true;
    setRowCount(me.preferences.defaultRowCount);
    setSeed(me.preferences.defaultSeed);
  }, [me]);

  /** The theme is a class on <html>; "system" follows the OS, live. */
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = preferences.theme === "dark" || (preferences.theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preferences.theme]);

  /**
   * The accent sits on the same element as the theme class, because each
   * palette has a light and a dark half and the dark rule is written as
   * `.dark[data-accent=…]` — one element carrying both.
   */
  useEffect(() => {
    document.documentElement.dataset.accent = preferences.accentColor;
  }, [preferences.accentColor]);

  // A pending save would otherwise fire into a page that is going away.
  useEffect(() => () => clearTimeout(preferenceTimer.current ?? undefined), []);

  /* ----------------------------- preferences ---------------------------- */

  /**
   * Preferences save themselves, a beat after the last change, so the page
   * needs no Save button for them. Normalizing here rather than trusting the
   * response keeps the controls from jumping: the server applies the same
   * clamps to the same object and has nothing left to correct.
   */
  function applyPreferences(next: Preferences) {
    setPreferences(next);
    setPreferenceSave("saving");
    clearTimeout(preferenceTimer.current ?? undefined);
    preferenceTimer.current = setTimeout(() => {
      void api
        .savePreferences(next)
        .then(() => setPreferenceSave("saved"))
        .catch(error => {
          setPreferenceSave("idle");
          fail(error);
        });
    }, PREFERENCE_SAVE_DELAY_MS);
  }

  const updatePreferences = (patch: Partial<Preferences>) =>
    applyPreferences(normalizePreferences({ ...preferences, ...patch }));

  const resetPreferences = () => applyPreferences({ ...DEFAULT_PREFERENCES });

  /** Folds one of the nav's lists, and remembers it for the next session. */
  const toggleNavSection = (section: NavSection) =>
    updatePreferences({
      collapsedNavSections: preferences.collapsedNavSections.includes(section)
        ? preferences.collapsedNavSections.filter(id => id !== section)
        : [...preferences.collapsedNavSections, section],
    });

  /** Guards a delete, unless the account has asked not to be asked. */
  const confirmed = (message: string) => !preferences.confirmDestructive || window.confirm(message);

  /**
   * Shows what went wrong — or drops back to the sign-in screen when the
   * session is the thing that went wrong.
   */
  function fail(error: unknown) {
    if (isUnauthorized(error)) {
      setMe(null);
      return;
    }
    setBanner({ kind: "error", lines: [error instanceof Error ? error.message : "Something went wrong."] });
  }

  async function signOut() {
    try {
      await api.logout();
    } catch {
      // The cookie is being dropped either way.
    }
    setMe(null);
    setConfigs([]);
    setDatasets([]);
    setTemplates([]);
    setNotes([]);
    setDataset(null);
    setPreviewRows([]);
    setSharing(null);
    setApiPreview(false);
    setTotals(null);
    setPreferences(DEFAULT_PREFERENCES);
    setMetadata([]);
    startNewConfig();
    // After the editor has been emptied, since emptying it is what puts the
    // editor on screen — the next sign-in should land on the dashboard.
    setView("dashboard");
  }

  /* ------------------------------- schema ------------------------------- */

  const updateField = (index: number, field: Field) =>
    setFields(current => current.map((f, i) => (i === index ? field : f)));

  const removeField = (index: number) => setFields(current => current.filter((_, i) => i !== index));

  const moveField = (index: number, direction: -1 | 1) =>
    setFields(current => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved!);
      return next;
    });

  function startNewConfig() {
    setView("editor");
    setActiveConfigId(null);
    setName("Untitled schema");
    setRowCount(preferences.defaultRowCount);
    setSeed(preferences.defaultSeed);
    setLocale("");
    setMetadata([]);
    setMetadataOpen(false);
    setFields([]);
    setMappings([]);
    setTab("import");
    setBanner(null);
  }

  function loadConfig(config: SchemaConfig) {
    setView("editor");
    setActiveConfigId(config.id);
    setName(config.name);
    setRowCount(config.rowCount);
    setSeed(config.seed ?? "");
    setLocale(config.locale ?? "");
    const pairs = toPairs(config.metadata);
    setMetadata(pairs);
    // Open it where there is something to see, so metadata on a schema someone
    // else wrote is not hidden behind a collapsed heading.
    setMetadataOpen(pairs.length > 0);
    setFields(config.fields);
    setMappings(config.mappings ?? []);
    setTab("schema");
    setBanner(
      config.ownerId === me?.id
        ? null
        : {
            kind: "info",
            lines: [
              `"${config.name}" was shared with you. Generate from it freely — saving a change keeps your own copy.`,
            ],
          },
    );
  }

  /* ------------------------------- actions ------------------------------ */

  async function generate() {
    setBusy(true);
    setBanner(null);
    try {
      const result = await api.generate(
        { fields, mappings, rowCount, seed, locale, name, configId: activeConfigId },
        preferences.previewRowLimit,
      );
      setDataset(result.dataset);
      setPreviewRows(result.rows);
      setTruncated(result.truncated);
      await refreshLists();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  async function saveConfig(asNew = false) {
    setBusy(true);
    try {
      const payload = {
        name,
        description: "",
        fields,
        mappings,
        rowCount,
        seed,
        locale,
        metadata: fromPairs(metadata),
      };
      // A configuration shared with you is read-only, so saving it keeps your
      // own copy instead of failing.
      const update = activeConfigId && !asNew && activeConfigIsMine;
      const saved = update ? await api.updateConfig(activeConfigId, payload) : await api.createConfig(payload);
      setActiveConfigId(saved.id);
      setBanner({ kind: "info", lines: [`Saved "${saved.name}".`] });
      await refreshLists();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  /**
   * Hands the browser a file without a round trip to the server.
   *
   * The type is named by the caller rather than guessed at from the name: it
   * is what the browser offers the file to the operating system as, and a
   * Markdown note saved as JSON is a note some editors will not open.
   */
  function downloadText(text: string, filename: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    // Firefox only follows anchors that are in the document, and revoking the
    // URL synchronously can cancel the download, so defer the cleanup.
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  /** Exports exactly what is on screen, saved or not. */
  function exportCurrent() {
    downloadText(
      serializeConfigFile({
        name,
        description: "",
        fields,
        mappings,
        rowCount,
        seed,
        locale,
        metadata: fromPairs(metadata),
      }),
      configFileName(name),
      "application/json",
    );
  }

  async function importConfig(file: File) {
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(`"${file.name}" is not valid JSON.`);
      }

      const saved = await api.importConfig(parsed);
      await refreshLists();
      loadConfig(saved);
      setBanner({
        kind: "info",
        lines: [`Imported "${saved.name}" — ${saved.fields.length} fields from ${file.name}.`],
      });
    } catch (error) {
      fail(error);
    }
  }

  /* --------------------------- script templates -------------------------- */

  function startNewTemplate() {
    setView("editor");
    setActiveTemplateId(null);
    setTemplateName("");
    setTemplateBody(STARTER_TEMPLATE_BODY);
    setTab("scripts");
    setBanner(null);
  }

  function loadTemplate(template: ScriptTemplate) {
    setView("editor");
    setActiveTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateBody(template.body);
    setTab("scripts");
    setBanner(
      template.ownerId === me?.id
        ? null
        : {
            kind: "info",
            lines: [`"${template.name}" was shared with you. Saving a change keeps your own copy.`],
          },
    );
  }

  async function saveTemplate() {
    setBusy(true);
    try {
      const payload = { name: templateName.trim(), body: templateBody };
      // Same as configurations: editing someone else's template forks it.
      const saved =
        activeTemplateId && activeTemplateIsMine
          ? await api.updateScriptTemplate(activeTemplateId, payload)
          : await api.createScriptTemplate(payload);
      setActiveTemplateId(saved.id);
      setBanner({ kind: "info", lines: [`Saved script template "${saved.name}".`] });
      await refreshLists();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  async function removeTemplate(id: string) {
    const template = templates.find(t => t.id === id);
    if (!confirmed(`Delete the script template "${template?.name ?? id}"? This cannot be undone.`)) return;

    try {
      await api.deleteScriptTemplate(id);
      if (id === activeTemplateId) startNewTemplate();
      await refreshLists();
    } catch (error) {
      fail(error);
    }
  }

  /* -------------------------------- notes ------------------------------- */

  function startNewNote() {
    setView("editor");
    setActiveNoteId(null);
    setNoteTitle("");
    setNoteBody(STARTER_NOTE_BODY);
    setTab("notes");
    setBanner(null);
  }

  function loadNote(note: Note) {
    setView("editor");
    setActiveNoteId(note.id);
    setNoteTitle(note.title);
    setNoteBody(note.body);
    setTab("notes");
    setBanner(null);
  }

  async function saveNote() {
    setBusy(true);
    try {
      const payload = { title: noteTitle.trim(), body: noteBody };
      const saved = activeNoteId ? await api.updateNote(activeNoteId, payload) : await api.createNote(payload);
      setActiveNoteId(saved.id);
      setBanner({ kind: "info", lines: [`Saved "${saved.title}".`] });
      await refreshLists();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  async function removeNote(id: string) {
    const note = notes.find(entry => entry.id === id);
    if (!confirmed(`Delete the note "${note?.title ?? id}"? This cannot be undone.`)) return;

    try {
      await api.deleteNote(id);
      if (id === activeNoteId) startNewNote();
      await refreshLists();
    } catch (error) {
      fail(error);
    }
  }

  /**
   * Follows a `[[…]]` chip to the record it names.
   *
   * The dataset arm loads its rows, so clicking a dataset in a note lands on
   * the same preview the sidebar would have opened — a reference is a way
   * through the workspace, not just a label.
   */
  function openReference(reference: ResolvedReference) {
    if (reference.kind === "config") {
      const config = configs.find(entry => entry.id === reference.id);
      if (config) loadConfig(config);
      return;
    }
    if (reference.kind === "script-template") {
      const template = templates.find(entry => entry.id === reference.id);
      if (template) loadTemplate(template);
      return;
    }
    if (reference.kind === "note") {
      const note = notes.find(entry => entry.id === reference.id);
      if (note) loadNote(note);
      return;
    }

    void openDatasetById(reference.id);
  }

  async function removeConfig(id: string) {
    const config = configs.find(c => c.id === id);
    if (
      !confirmed(
        `Delete the configuration "${config?.name ?? id}"? Datasets generated from it are kept. This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await api.deleteConfig(id);
      if (id === activeConfigId) setActiveConfigId(null);
      await refreshLists();
    } catch (error) {
      fail(error);
    }
  }

  /** By id, since a note can name a dataset older than the sidebar's list. */
  async function openDatasetById(id: string) {
    setView("editor");
    try {
      const result = await api.getDataset(id, preferences.previewRowLimit);
      setDataset(result.dataset);
      setPreviewRows(result.rows);
      setTruncated(result.truncated);
    } catch (error) {
      fail(error);
    }
  }

  async function removeDataset(id: string) {
    const target = datasets.find(d => d.id === id);
    if (
      !confirmed(
        `Delete the dataset "${target?.name ?? id}"${
          target ? ` and its ${target.rowCount.toLocaleString()} rows` : ""
        }? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await api.deleteDataset(id);
      if (dataset?.id === id) {
        setDataset(null);
        setPreviewRows([]);
      }
      await refreshLists();
    } catch (error) {
      fail(error);
    }
  }

  /* --------------------------------- UI --------------------------------- */

  // A record is "mine" unless it came from someone else's account. Anything
  // unsaved counts as mine, since it has no owner yet.
  const activeConfig = configs.find(config => config.id === activeConfigId) ?? null;
  const activeConfigIsMine = !activeConfig || activeConfig.ownerId === me?.id;
  const activeTemplate = templates.find(template => template.id === activeTemplateId) ?? null;
  const activeTemplateIsMine = !activeTemplate || activeTemplate.ownerId === me?.id;

  /** Brings the nav back. Only shown when it is away, so it never duplicates
   *  the collapse button that lives in the sidebar's own header. */
  const expandSidebarButton = preferences.sidebarCollapsed && (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0"
      onClick={() => updatePreferences({ sidebarCollapsed: false })}
      aria-label="Show the sidebar"
      title="Show the sidebar"
    >
      <PanelLeft />
    </Button>
  );

  /**
   * One tab. The count rides in a pill rather than in parentheses: it is a
   * number that changes while you work, and a pill lets the eye find it
   * without re-reading the label it is attached to.
   *
   * Only the selected tab is reachable by Tab; the arrows move between them,
   * which is what a tablist is expected to do and what its role promises.
   */
  const tabButton = (key: Tab, icon: React.ReactNode, label: string, count?: number) => {
    const current = tab === key;
    return (
      <button
        type="button"
        role="tab"
        id={`tab-${key}`}
        aria-selected={current}
        aria-controls={`panel-${key}`}
        tabIndex={current ? 0 : -1}
        onClick={() => setTab(key)}
        className={cn(
          "focus-ring relative flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium",
          "transition-colors after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full",
          "after:transition-colors",
          current
            ? "text-foreground after:bg-primary"
            : "text-muted-foreground after:bg-transparent hover:bg-accent/40 hover:text-foreground",
        )}
      >
        {icon}
        {label}
        {count !== undefined && (
          <span
            className={cn(
              "rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums transition-colors",
              current ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  /** One strip for whatever the last action had to say — shown in both views. */
  const bannerNode = banner && (
    <div
      role={banner.kind === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 border-b px-4 py-2.5 text-xs",
        // It arrives from under the header it hangs off, so a message that
        // appears while you are looking elsewhere still catches the eye.
        "animate-in fade-in-0 slide-in-from-top-1 duration-200",
        // A tinted left edge, rather than a wash across the whole strip: the
        // colour still classifies the message without shouting over the page.
        banner.kind === "error"
          ? "border-l-2 border-l-destructive bg-destructive/8 text-destructive"
          : "border-l-2 border-l-primary/50 bg-muted/40 text-muted-foreground",
      )}
    >
      {banner.kind === "error" ? (
        <AlertCircle className="mt-px size-3.5 shrink-0" />
      ) : (
        <Info className="mt-px size-3.5 shrink-0" />
      )}
      <div className="flex-1 space-y-0.5 leading-relaxed">
        {banner.lines.map(line => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setBanner(null)}
        aria-label="Dismiss"
        className="focus-ring -m-1 shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );

  // Still asking the server who we are: a quiet mark rather than the sign-in
  // form, which would flash at someone who is already signed in — and rather
  // than nothing at all, which on a slow connection reads as a broken page.
  if (me === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Database className="size-6 animate-pulse text-muted-foreground/40" aria-label="Loading" />
      </div>
    );
  }

  if (me === null) return <AuthPanel onSignedIn={setMe} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {!preferences.sidebarCollapsed && (
        <Sidebar
          configs={configs}
          datasets={datasets}
          templates={templates}
          notes={notes}
          activeConfigId={activeConfigId}
          activeDatasetId={dataset?.id ?? null}
          activeTemplateId={activeTemplateId}
          activeNoteId={activeNoteId}
          storage={storage}
          me={me}
          onSignOut={signOut}
          onNewConfig={startNewConfig}
          onLoadConfig={loadConfig}
          onDeleteConfig={removeConfig}
          onShareConfig={config => setSharing({ kind: "configs", id: config.id, title: config.name })}
          onImportConfig={importConfig}
          onExportConfig={config =>
            downloadText(serializeConfigFile(config), configFileName(config.name), "application/json")
          }
          onLoadDataset={dataset => void openDatasetById(dataset.id)}
          onDeleteDataset={removeDataset}
          onNewTemplate={startNewTemplate}
          onLoadTemplate={loadTemplate}
          onDeleteTemplate={removeTemplate}
          onShareTemplate={template =>
            setSharing({ kind: "script-templates", id: template.id, title: template.name })
          }
          onNewNote={startNewNote}
          onLoadNote={loadNote}
          onDeleteNote={removeNote}
          onExportNote={note =>
            downloadText(noteMarkdown(note.title, note.body), noteFileName(note.title), "text/markdown;charset=utf-8")
          }
          collapsedSections={preferences.collapsedNavSections}
          onToggleSection={toggleNavSection}
          dashboardOpen={view === "dashboard"}
          onOpenDashboard={() => setView("dashboard")}
          settingsOpen={view === "settings"}
          onOpenSettings={() => setView("settings")}
          onCollapse={() => updatePreferences({ sidebarCollapsed: true })}
        />
      )}

      {sharing && (
        <ShareDialog
          kind={sharing.kind}
          id={sharing.id}
          title={sharing.title}
          viewerEmail={me.email}
          onClose={() => setSharing(null)}
          onChanged={() => void refreshLists().catch(fail)}
        />
      )}

      {apiPreview && (
        <ApiPreviewDialog
          inline={{
            kind: "inline",
            name,
            rowCount,
            seed,
            locale,
            configId: activeConfigId,
            fields,
          }}
          config={
            activeConfig && {
              kind: "config",
              configId: activeConfig.id,
              configName: activeConfig.name,
              name,
              rowCount,
              seed,
              locale,
            }
          }
          onClose={() => setApiPreview(false)}
          onManageKeys={() => {
            setApiPreview(false);
            setView("settings");
          }}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        {view === "settings" ? (
          <>
            {bannerNode}
            <SettingsPanel
              me={me}
              preferences={preferences}
              saveState={preferenceSave}
              templates={templates}
              counts={{ configs: configs.length, templates: templates.length }}
              storage={storage}
              onChange={updatePreferences}
              onReset={resetPreferences}
              onAccountUpdated={setMe}
              leading={expandSidebarButton}
              onClose={() => {
                setView("editor");
                // The sidebar's dataset list is cut to the preference that may
                // just have changed, so it is re-read on the way out.
                void refreshLists().catch(fail);
              }}
            />
          </>
        ) : view === "dashboard" ? (
          <>
            {bannerNode}
            <Dashboard
              me={me}
              configs={configs}
              datasets={datasets}
              templates={templates}
              notes={notes}
              totals={totals}
              storage={storage}
              onNewConfig={startNewConfig}
              onLoadConfig={loadConfig}
              onLoadDataset={dataset => void openDatasetById(dataset.id)}
              onNewTemplate={startNewTemplate}
              onLoadTemplate={loadTemplate}
              onImport={() => {
                setView("editor");
                setTab("import");
              }}
              onOpenSettings={() => setView("settings")}
              onClose={() => setView("editor")}
              leading={expandSidebarButton}
            />
          </>
        ) : (
          <>
            <header className="relative flex flex-wrap items-end gap-3 border-b bg-card/40 px-4 py-3">
              {expandSidebarButton}

              <div className="min-w-48 flex-1">
                <Label htmlFor="schema-name" className="label-caps mb-1">
                  Schema name
                </Label>
                <Input
                  id="schema-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-9 font-medium"
                />
              </div>

              <div className="w-24">
                <Label htmlFor="row-count" className="label-caps mb-1">
                  Rows
                </Label>
                <Input
                  id="row-count"
                  type="number"
                  min={1}
                  max={100000}
                  value={rowCount}
                  onChange={e => setRowCount(Number(e.target.value))}
                  className="h-9"
                />
              </div>

              <div className="w-32">
                <Label htmlFor="seed" className="label-caps mb-1">
                  Seed
                </Label>
                <Input
                  id="seed"
                  value={seed}
                  placeholder="random"
                  onChange={e => setSeed(e.target.value)}
                  className="h-9"
                  title="Same seed + same schema produces identical data"
                />
              </div>

              <div className="w-40">
                <Label htmlFor="locale" className="label-caps mb-1">
                  Locale
                </Label>
                <Select value={locale || "default"} onValueChange={value => setLocale(value === "default" ? "" : value)}>
                  <SelectTrigger
                    id="locale"
                    className="h-9 w-full"
                    title="Names, addresses and phone numbers are drawn from this locale"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="default">Default (English)</SelectItem>
                    {LOCALES.map(entry => (
                      <SelectItem key={entry.code} value={entry.code}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Two groups with a rule between them: everything that acts on
                  the schema itself, then the one control that runs it. */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={exportCurrent}
                  disabled={!fields.length}
                  aria-label="Download this schema as JSON"
                  title="Download this schema as JSON"
                >
                  <Download />
                </Button>
                {activeConfig && activeConfigIsMine && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSharing({ kind: "configs", id: activeConfig.id, title: activeConfig.name })}
                    aria-label="Share this configuration"
                    title={
                      activeConfig.sharedWith.length
                        ? `Shared with ${activeConfig.sharedWith.length} — manage`
                        : "Share this configuration"
                    }
                  >
                    <Share2 className={cn(activeConfig.sharedWith.length > 0 && "text-primary")} />
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => saveConfig(false)}
                  disabled={busy || !fields.length}
                  title={activeConfigIsMine ? undefined : "This one was shared with you — saving keeps your own copy"}
                >
                  <Save />
                  {!activeConfigIsMine ? "Save my copy" : activeConfigId ? "Save" : "Save config"}
                </Button>
                {activeConfigId && activeConfigIsMine && (
                  <Button variant="outline" onClick={() => saveConfig(true)} disabled={busy} title="Save as a new config">
                    Duplicate
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setApiPreview(true)}
                  disabled={!fields.length}
                  aria-label="API preview"
                  title="See this generation as an API request"
                >
                  <Terminal />
                </Button>

                <span aria-hidden className="mx-1 h-6 w-px bg-border" />

                <Button onClick={generate} disabled={busy || !fields.length} className="shadow-sm">
                  {busy ? <Loader2 className="animate-spin" /> : <Play />}
                  {busy ? "Working…" : "Generate"}
                </Button>
              </div>

              {/* Sits on the header's own bottom border while a run is out. */}
              {busy && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden"
                >
                  <span className="block h-full w-full origin-left animate-indeterminate bg-primary" />
                </span>
              )}
            </header>

            {bannerNode}

            <div
              ref={editorPanes}
              className="flex min-h-0 flex-1 flex-col lg:flex-row"
              // Read by the schema pane below; the divider writes it as it drags.
              style={{ ["--split" as string]: `${preferences.editorSplitPercent}%` }}
            >
              <section
                className={cn(
                  "flex min-h-0 min-w-0 flex-1 flex-col",
                  // With the data pane folded away the editor has the window to
                  // itself; open, it keeps to its share of the split.
                  dataPaneOpen && "border-b lg:w-[var(--split)] lg:flex-none lg:border-b-0",
                )}
              >
                <div
                  role="tablist"
                  aria-label="Editor panes"
                  className="flex items-center gap-1 border-b px-2"
                  onKeyDown={event => {
                    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
                    if (!step) return;
                    event.preventDefault();
                    const next = TABS[(TABS.indexOf(tab) + step + TABS.length) % TABS.length]!;
                    setTab(next);
                    // Selection follows focus here, so focus has to follow it back.
                    document.getElementById(`tab-${next}`)?.focus();
                  }}
                >
                  {tabButton("import", <Braces className="size-4" />, "Import structure")}
                  {tabButton("schema", <ListTree className="size-4" />, "Schema", fields.length)}
                  {tabButton("mappings", <Link2 className="size-4" />, "Mappings", mappings.length)}
                  {tabButton("scripts", <FileCode2 className="size-4" />, "Scripts", templates.length)}
                  {tabButton("notes", <StickyNote className="size-4" />, "Notes", notes.length)}
                </div>

                <div
                  role="tabpanel"
                  id={`panel-${tab}`}
                  aria-labelledby={`tab-${tab}`}
                  className="min-h-0 flex-1 overflow-auto p-4"
                >
                  {tab === "mappings" ? (
                    <MappingsPanel
                      mappings={mappings}
                      onChange={setMappings}
                      fields={fields}
                      configs={configs}
                      activeConfigId={activeConfigId}
                      readOnly={!activeConfigIsMine}
                    />
                  ) : tab === "scripts" ? (
                    <ScriptTemplatePanel
                      name={templateName}
                      body={templateBody}
                      activeId={activeTemplateId}
                      owned={activeTemplateIsMine}
                      busy={busy}
                      onNameChange={setTemplateName}
                      onBodyChange={setTemplateBody}
                      onSave={saveTemplate}
                      onNew={startNewTemplate}
                    />
                  ) : tab === "notes" ? (
                    <NotesPanel
                      title={noteTitle}
                      body={noteBody}
                      activeId={activeNoteId}
                      busy={busy}
                      onTitleChange={setNoteTitle}
                      onBodyChange={setNoteBody}
                      onSave={saveNote}
                      onNew={startNewNote}
                      onExportMarkdown={() =>
                        downloadText(
                          noteMarkdown(noteTitle, noteBody),
                          noteFileName(noteTitle),
                          "text/markdown;charset=utf-8",
                        )
                      }
                      configs={configs}
                      templates={templates}
                      datasets={datasets}
                      notes={notes}
                      onOpenReference={openReference}
                    />
                  ) : tab === "import" ? (
                    <ImportPanel
                      onInferred={(inferred, notes, detected) => {
                        setFields(inferred);
                        setTab("schema");
                        setBanner({
                          kind: "info",
                          lines: [`Detected ${detected} — inferred ${inferred.length} fields.`, ...notes],
                        });
                      }}
                      onError={message => setBanner({ kind: "error", lines: [message] })}
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <MetadataEditor
                        pairs={metadata}
                        onChange={setMetadata}
                        open={metadataOpen}
                        onToggle={() => setMetadataOpen(current => !current)}
                      />

                      {fields.map((field, index) => (
                        <FieldRow
                          key={field.id}
                          field={field}
                          allFields={fields}
                          datasets={datasets}
                          expanded={expandedField === field.id}
                          onToggle={() => setExpandedField(current => (current === field.id ? null : field.id))}
                          onChange={next => updateField(index, next)}
                          onRemove={() => removeField(index)}
                          onMove={direction => moveField(index, direction)}
                        />
                      ))}

                      {!fields.length && (
                        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
                          <ListTree className="size-7 text-muted-foreground/40" />
                          <div>
                            <p className="text-sm font-medium">No fields yet</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Paste a structure under{" "}
                              <button
                                type="button"
                                onClick={() => setTab("import")}
                                className="focus-ring rounded font-medium text-foreground underline underline-offset-2"
                              >
                                Import structure
                              </button>
                              , or build the schema a field at a time.
                            </p>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        className="mt-1 self-start"
                        onClick={() => {
                          const field = newField(preferences.defaultFieldType);
                          setFields(current => [...current, field]);
                          setExpandedField(field.id);
                        }}
                      >
                        <Plus />
                        Add field
                      </Button>
                    </div>
                  )}
                </div>
              </section>

              {dataPaneOpen ? (
                <>
                  <SplitHandle
                    value={preferences.editorSplitPercent}
                    min={PREFERENCE_LIMITS.editorSplit.min}
                    max={PREFERENCE_LIMITS.editorSplit.max}
                    defaultValue={DEFAULT_PREFERENCES.editorSplitPercent}
                    containerRef={editorPanes}
                    onChange={editorSplitPercent => updatePreferences({ editorSplitPercent })}
                  />

                  <section id="data-pane" className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <PreviewTable
                      dataset={dataset}
                      rows={previewRows}
                      truncated={truncated}
                      templates={templates}
                      preferredFormat={preferences.defaultExportFormat}
                      preferredTemplateId={preferences.defaultTemplateId}
                      onCollapse={() => setDataPaneOpen(false)}
                      onError={message => setBanner({ kind: "error", lines: [message] })}
                    />
                  </section>
                </>
              ) : (
                /* The folded pane: a strip along the bottom on a narrow window,
                   a rail down the right on a wide one — still naming what is
                   inside it, so the data is put away rather than gone. */
                <button
                  type="button"
                  aria-expanded={false}
                  onClick={() => setDataPaneOpen(true)}
                  // The visible label is the dataset's name, so the control
                  // says for itself what clicking it does.
                  aria-label={dataset ? `Show the data pane — ${dataset.name}` : "Show the data pane"}
                  title={dataset ? `Show "${dataset.name}"` : "Show the data pane"}
                  className={cn(
                    "focus-ring flex shrink-0 items-center justify-center gap-2 border-t bg-card/40 px-3 py-2",
                    "text-xs font-medium text-muted-foreground transition-colors",
                    "hover:bg-accent/40 hover:text-foreground",
                    "lg:w-10 lg:flex-col lg:border-l lg:border-t-0 lg:px-0 lg:py-3",
                  )}
                >
                  <PanelRightOpen className="size-4 shrink-0" />
                  <span className="truncate lg:max-h-64 lg:[writing-mode:vertical-rl]">
                    {dataset ? dataset.name : "Data"}
                  </span>
                  {dataset && (
                    <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-semibold tabular-nums">
                      {dataset.rowCount.toLocaleString()}
                    </span>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
