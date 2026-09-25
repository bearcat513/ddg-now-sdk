import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Braces,
  Download,
  FileCode2,
  Info,
  ListTree,
  Loader2,
  PanelLeft,
  PanelRightOpen,
  Play,
  Plus,
  Save,
  X,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { FieldRow } from "./components/app/FieldRow";
import { ImportPanel } from "./components/app/ImportPanel";
import { MetadataEditor } from "./components/app/MetadataEditor";
import { PreviewTable } from "./components/app/PreviewTable";
import { ScriptTemplatePanel } from "./components/app/ScriptTemplatePanel";
import { SettingsPanel, type SaveState } from "./components/app/SettingsPanel";
import { Sidebar, type NavSection } from "./components/app/Sidebar";
import { SplitHandle } from "./components/app/SplitHandle";
import { WhiteboardPanel, type BoardGuard } from "./components/app/WhiteboardPanel";
import { api, type ConfigSummary } from "./lib/api";
import { configFileName, parseConfigFile, serializeConfigFile } from "./lib/configFile";
import { fromPairs, toPairs, type MetadataPair } from "./lib/metadata";
import {
  getStateFromUrl,
  pathFor,
  setLocation,
  TABS,
  titleFor,
  type Tab,
  type View,
  type WorkspaceState,
} from "./lib/navigation";
import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
  PREFERENCE_LIMITS,
  type Preferences,
} from "../server/lib/preferences";
import { cn } from "./lib/utils";
import {
  STARTER_TEMPLATE_BODY,
  type ScriptTemplate,
} from "../server/lib/scriptTemplate";
import {
  defaultFieldOptions,
  LOCALES,
  type Dataset,
  type Field,
  type FieldType,
  type SchemaConfig,
} from "../server/lib/types";
import type { Whiteboard, WhiteboardSummary } from "../server/lib/whiteboard";

type Banner = { kind: "error" | "info"; lines: string[] } | null;

const newField = (type: FieldType): Field => ({
  id: crypto.randomUUID(),
  name: "",
  type,
  options: defaultFieldOptions(type),
});

/**
 * The workspace: a nav down the left, the schema editor in the middle, and
 * whatever the last run produced on the right.
 *
 * This is the Bun application's `App.tsx` with the parts that had no server
 * behind them any more taken out. Gone: the sign-in screen and session check
 * (the platform has already decided who this is), the share dialog, the API
 * key preview, the dashboard and the settings page, and the mappings and notes
 * tabs. What is left is the three tabs this app is actually about, and they
 * are the ones that carried the design work — paste a structure, edit the
 * fields it inferred, run it, look at the rows, drop them into a script.
 *
 * What is new is the URL. On the platform this page is reached through the
 * navigator and lives in a breadcrumb, so which configuration is open is in
 * `?config=`, not only in React state.
 */
export function App() {
  const [configs, setConfigs] = useState<ConfigSummary[]>([]);
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [whiteboards, setWhiteboards] = useState<WhiteboardSummary[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [storage, setStorage] = useState("");

  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [name, setName] = useState("Untitled schema");
  const [rowCount, setRowCount] = useState(DEFAULT_PREFERENCES.defaultRowCount);
  const [seed, setSeed] = useState("");
  /** Empty means the bundled default (English); it travels with the schema. */
  const [locale, setLocale] = useState("");
  /** Metadata as rows, so a key can be renamed without the row moving. */
  const [metadata, setMetadata] = useState<MetadataPair[]>([]);
  const [metadataOpen, setMetadataOpen] = useState(false);
  /** Measured while dragging, to turn a pointer position into a percentage. */
  const editorPanes = useRef<HTMLDivElement>(null);
  const [fields, setFields] = useState<Field[]>([]);

  /**
   * The script template on screen.
   *
   * Held apart from the schema, because it is not part of one: the same
   * template renders whichever dataset it is pointed at, and opening one does
   * not close the configuration someone was editing.
   */
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState(STARTER_TEMPLATE_BODY);

  /**
   * The whiteboard view's board.
   *
   * `board` is what was *loaded* — the panel reads it once, on mount — and
   * `boardSession` is the panel's key, bumped whenever a different board is
   * opened or a new one started. Saving a new board changes `activeBoardId`
   * but not the session, so the canvas carries on rather than reloading the
   * drawing it just sent. `boardGuard` is the panel's answer to "is there
   * anything unsaved", read before navigating away from it.
   */
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [board, setBoard] = useState<Whiteboard | null>(null);
  const [boardSession, setBoardSession] = useState(0);
  const [boardLoading, setBoardLoading] = useState(false);
  const boardGuard = useRef<BoardGuard>({ dirty: false, autosaves: false });

  const [tab, setTab] = useState<Tab>(() => getStateFromUrl().tab);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [truncated, setTruncated] = useState(false);
  /**
   * Whether the data pane is unfolded. The editor is the workspace and the
   * data is what comes out of it, so the pane stays a rail until there is
   * something to look at — generating rows, or opening a dataset from the nav,
   * swings it open, and dropping them folds it back. It is deliberately not a
   * preference: "open" describes what is on screen now, not how this browser
   * likes its windows.
   */
  const [dataPaneOpen, setDataPaneOpen] = useState(false);

  useEffect(() => setDataPaneOpen(previewRows.length > 0), [previewRows]);

  /**
   * Preferences, once the account's own have arrived.
   *
   * They start as the defaults rather than as a stored value, because the store
   * is now a table: there is nothing to read synchronously before the first
   * paint. `loadWorkspace` fetches them alongside the lists. The visible cost is
   * that a page set to "dark" for an account whose OS is light paints light for
   * one frame — the defaults follow the OS, which is the closest guess
   * available, and the alternative was caching them in this browser, which is
   * the thing the table replaced.
   */
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);

  /** What the header's indicator shows about the last save. */
  const [saveState, setSaveState] = useState<SaveState>("idle");

  /** Which of the two things the main pane is showing. */
  const [view, setView] = useState<View>(() => getStateFromUrl().view);

  // Read by callbacks that must not be rebuilt every time a preference
  // changes — `refreshLists` is a dependency of half the effects below.
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  /**
   * Shows what went wrong.
   *
   * There is no unauthorized arm here. The Bun version dropped to a sign-in
   * screen on a 401 because the session was the app's to hold; here the
   * session is the instance's, and a 403 means an ACL said no — which is a
   * message to read, not a reason to log anyone out.
   */
  const fail = useCallback((error: unknown) => {
    setBanner({ kind: "error", lines: [error instanceof Error ? error.message : "Something went wrong."] });
  }, []);

  /* ------------------------------- loading ------------------------------- */

  const refreshLists = useCallback(async () => {
    const [nextConfigs, nextTemplates, nextWhiteboards, nextDatasets] = await Promise.all([
      api.listConfigs(),
      api.listTemplates(),
      api.listWhiteboards(),
      api.listDatasets(),
    ]);
    setConfigs(nextConfigs);
    setTemplates(nextTemplates);
    setWhiteboards(nextWhiteboards);
    setDatasets(nextDatasets);
  }, []);

  /**
   * The account's preferences.
   *
   * Fetched with the lists rather than after them: it is one more round trip
   * that the page is already waiting on others for, and the theme should settle
   * as early as it can.
   */
  const refreshPreferences = useCallback(async () => {
    setPreferences(await api.getPreferences());
  }, []);

  /** Everything this account can see, plus whether the API answered at all. */
  const loadWorkspace = useCallback(async () => {
    try {
      await Promise.all([refreshLists(), refreshPreferences()]);
      setStorage("x_1040823_ddg_now");
    } catch (error) {
      // The storage label doubles as an outage signal, the way the PocketBase
      // URL did: "unavailable" explains every other error on the page.
      setStorage("Scoped API unavailable");
      throw error;
    }
  }, [refreshLists, refreshPreferences]);

  useEffect(() => {
    void loadWorkspace().catch(fail);
  }, [loadWorkspace, fail]);

  /* ------------------------------ preferences ---------------------------- */

  /**
   * Preferences save themselves as they change, and now that is a request.
   *
   * The screen moves first and the write follows. Collapsing the nav or dragging
   * the divider has to feel immediate, and waiting for a round trip to redraw
   * would make the whole page feel attached to the network — so the local set is
   * normalized with the same function the server uses, applied at once, and sent
   * after. Because both sides normalize with that one function, the optimistic
   * value and the stored one agree without a round trip to find out.
   *
   * Only the patch is sent, not the whole set. That keeps two saves racing from
   * being able to undo each other: two patches merge on the server in whatever
   * order they arrive, where two full sets would each carry a stale copy of what
   * the other changed.
   *
   * The reply is still applied, because it is the authority on what was kept —
   * the server clamps, and a value it refused should not sit on screen looking
   * accepted. A failure says so in the indicator and puts the stored set back,
   * rather than leaving the page showing a preference that is not saved.
   */
  const updatePreferences = useCallback(
    (patch: Partial<Preferences>) => {
      setPreferences(current => normalizePreferences({ ...current, ...patch }));
      setSaveState("saving");
      void api
        .savePreferences(patch)
        .then(stored => {
          setPreferences(stored);
          setSaveState("saved");
        })
        .catch(error => {
          setSaveState("failed");
          fail(error);
          // Whatever is actually stored, so the page stops claiming otherwise.
          void refreshPreferences().catch(() => setPreferences(DEFAULT_PREFERENCES));
        });
    },
    [fail, refreshPreferences],
  );

  /** Clears "Saved" a moment after it appears, so it reads as an event. */
  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 1500);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  /**
   * Puts every preference back to what it ships as.
   *
   * Sent as a whole set rather than by deleting the row: a reset is a change
   * like any other, and the row stays the one the account already has.
   */
  const resetPreferences = useCallback(
    () => updatePreferences(DEFAULT_PREFERENCES),
    [updatePreferences],
  );

  /** Folds one of the nav's lists, and remembers it for the next session. */
  const toggleNavSection = (section: NavSection) =>
    updatePreferences({
      collapsedNavSections: preferences.collapsedNavSections.includes(section)
        ? preferences.collapsedNavSections.filter(id => id !== section)
        : [...preferences.collapsedNavSections, section],
    });

  /** Whether the page is dark right now, for the one child that themes itself. */
  const [dark, setDark] = useState(false);

  /**
   * The theme is a class on `<html>`; "system" follows the OS, live.
   *
   * The instance has a theme of its own and this page cannot read it from
   * inside the frame, so the OS preference is the closest honest signal — the
   * same one Polaris itself falls back to.
   */
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = preferences.theme === "dark" || (preferences.theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
      // Excalidraw draws its own canvas and cannot read a class off <html>.
      setDark(dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preferences.theme]);

  /* ------------------------------- the URL ------------------------------- */

  /**
   * The query string the restore effect below has already acted on.
   *
   * Every push writes it too, which is what keeps the two directions from
   * chasing each other: a handler that opens a configuration sets the state
   * *and* the address bar, and without this the effect would see a URL it had
   * not restored and fetch the same record a second time.
   */
  const restoredFrom = useRef<string | null>(null);

  /**
   * The template in the address bar, for the pushes that are not about one.
   *
   * A ref rather than a dependency, so `publishLocation` stays the stable
   * callback half the effects below are built on: opening a schema or a
   * dataset leaves `?template=` exactly as it was, the way `?config=` rides
   * through a dataset push.
   */
  const activeTemplateRef = useRef<string | null>(null);
  activeTemplateRef.current = activeTemplateId;

  /** The same, for the board — only written to the URL while its view is up. */
  const activeBoardRef = useRef<string | null>(null);
  activeBoardRef.current = activeBoardId;

  /** Writes the current state to the address bar, and to the Polaris frame. */
  const publishLocation = useCallback(
    (
      state: Omit<WorkspaceState, "view" | "templateId" | "boardId"> & {
        view?: View;
        templateId?: string | null;
        boardId?: string | null;
      },
      label?: string,
    ) => {
      // Everything that pushes except the settings and whiteboard controls is
      // an editor action, so leaving `view` out means the editor — which is
      // also what makes opening a schema from the nav close settings on its
      // way past.
      const full: WorkspaceState = {
        view: "editor",
        templateId: activeTemplateRef.current,
        boardId: activeBoardRef.current,
        ...state,
      };
      const path = pathFor(full);
      setView(full.view);
      setLocation(path, titleFor(full, label));
      restoredFrom.current = new URL(path, window.location.origin).search;
    },
    [],
  );


  /* ------------------------------- schema -------------------------------- */

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

  const startNewConfig = useCallback(() => {
    setActiveConfigId(null);
    setName("Untitled schema");
    setRowCount(preferencesRef.current.defaultRowCount);
    setSeed("");
    setLocale("");
    setMetadata([]);
    setMetadataOpen(false);
    setFields([]);
    setTab("import");
    setBanner(null);
    publishLocation({ configId: null, datasetId: null, tab: "import" });
  }, [publishLocation]);

  /** Puts a fetched configuration into the editor. */
  const applyConfig = useCallback((config: SchemaConfig) => {
    setActiveConfigId(config.id);
    setName(config.name);
    setRowCount(config.rowCount);
    setSeed(config.seed ?? "");
    setLocale(config.locale === "en" ? "" : (config.locale ?? ""));
    const pairs = toPairs(config.metadata);
    setMetadata(pairs);
    // Open it where there is something to see, so metadata on a schema someone
    // else wrote is not hidden behind a collapsed heading.
    setMetadataOpen(pairs.length > 0);
    setFields(config.fields);
    setTab("schema");
  }, []);

  /**
   * Opens a configuration by id.
   *
   * The nav's rows carry a summary rather than a schema — the list endpoint
   * sends a field count, not the fields — so opening one is a fetch. That is
   * the shape change the child table brought with it: the Bun app's list came
   * back with every schema inline because they were one JSON column each.
   */
  const openConfig = useCallback(
    async (id: string, { push = true }: { push?: boolean } = {}) => {
      try {
        const config = await api.getConfig(id);
        applyConfig(config);
        setBanner(null);
        if (push) publishLocation({ configId: id, datasetId: null, tab: "schema" }, config.name);
      } catch (error) {
        fail(error);
      }
    },
    [applyConfig, publishLocation, fail],
  );

  /** By id, since a URL can name a dataset older than the nav's list. */
  const openDatasetById = useCallback(
    async (id: string, { push = true }: { push?: boolean } = {}) => {
      try {
        const [record, window_] = await Promise.all([
          api.getDataset(id),
          api.datasetRows(id, preferencesRef.current.previewRowLimit),
        ]);
        setDataset(record);
        setPreviewRows(window_.rows);
        setTruncated(window_.truncated);
        if (push) publishLocation({ configId: activeConfigId, datasetId: id, tab });
      } catch (error) {
        fail(error);
      }
    },
    [activeConfigId, tab, publishLocation, fail],
  );

  /* --------------------------- script templates -------------------------- */

  /** Puts a template into the scripts pane and makes it the URL's. */
  const applyTemplate = useCallback(
    (template: ScriptTemplate, { push = true }: { push?: boolean } = {}) => {
      setActiveTemplateId(template.id);
      setTemplateName(template.name);
      setTemplateBody(template.body);
      setTab("scripts");
      if (push) {
        publishLocation(
          { configId: activeConfigId, datasetId: dataset?.id ?? null, templateId: template.id, tab: "scripts" },
          template.name,
        );
      }
      // Said once, on open, rather than as a warning beside Save: it changes
      // what the button will do, and that is worth knowing before typing.
      setBanner(
        template.canWrite
          ? null
          : {
              kind: "info",
              lines: [`"${template.name}" is somebody else's. Saving a change keeps your own copy.`],
            },
      );
    },
    [activeConfigId, dataset, publishLocation],
  );

  /**
   * By id, since a URL can name a template the nav's list has not loaded yet —
   * and the endpoint answers with the body either way.
   */
  const openTemplateById = useCallback(
    async (id: string, { push = true }: { push?: boolean } = {}) => {
      try {
        applyTemplate(await api.getTemplate(id), { push });
      } catch (error) {
        fail(error);
      }
    },
    [applyTemplate, fail],
  );

  /** An empty template, on the starter body so the placeholders are visible. */
  const startNewTemplate = useCallback(() => {
    setActiveTemplateId(null);
    setTemplateName("");
    setTemplateBody(STARTER_TEMPLATE_BODY);
    setTab("scripts");
    setBanner(null);
    publishLocation({ configId: activeConfigId, datasetId: dataset?.id ?? null, templateId: null, tab: "scripts" });
  }, [activeConfigId, dataset, publishLocation]);

  /**
   * Saves the template on screen.
   *
   * Editing someone else's forks it, exactly as the Bun version did — except
   * that whether it is someone else's is the ACL's answer, carried on the
   * record as `canWrite`, rather than a comparison this page makes.
   */
  async function saveTemplate() {
    setBusy(true);
    try {
      const payload = { name: templateName.trim(), body: templateBody };
      const saved =
        activeTemplateId && templateIsMine
          ? await api.updateTemplate(activeTemplateId, payload)
          : await api.createTemplate(payload);

      setActiveTemplateId(saved.id);
      setBanner({ kind: "info", lines: [`Saved script template "${saved.name}".`] });
      publishLocation(
        { configId: activeConfigId, datasetId: dataset?.id ?? null, templateId: saved.id, tab: "scripts" },
        saved.name,
      );
      await refreshLists();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  async function removeTemplate(id: string) {
    const template = templates.find(entry => entry.id === id);
    if (!window.confirm(`Delete the script template "${template?.name ?? id}"? This cannot be undone.`)) return;

    try {
      await api.deleteTemplate(id);
      if (id === activeTemplateId) startNewTemplate();
      await refreshLists();
    } catch (error) {
      fail(error);
    }
  }

  /* ------------------------------ whiteboards ---------------------------- */

  /**
   * Whether it is all right to take the whiteboard off screen.
   *
   * A board that saves itself saves its last edit on the way out, so only a
   * new or forked one has anything to lose — and that is worth one question
   * rather than a silent discard.
   */
  const confirmLeaveBoard = useCallback(() => {
    if (view !== "whiteboard") return true;
    const { dirty, autosaves } = boardGuard.current;
    if (!dirty || autosaves) return true;
    return window.confirm("This whiteboard has unsaved changes. Leave it anyway?");
  }, [view]);

  /** Puts the panel on a board — or on a blank one — as a fresh mount. */
  const showBoard = useCallback((next: Whiteboard | null) => {
    setBoard(next);
    setActiveBoardId(next?.id ?? null);
    setBoardSession(session => session + 1);
    setBanner(
      next && !next.canWrite
        ? { kind: "info", lines: [`"${next.name}" is somebody else's. Saving a change keeps your own copy.`] }
        : null,
    );
  }, []);

  /** By id, since a URL can name a board the nav's list has not loaded yet. */
  const openBoardById = useCallback(
    async (id: string, { push = true }: { push?: boolean } = {}) => {
      setBoardLoading(true);
      try {
        const loaded = await api.getWhiteboard(id);
        showBoard(loaded);
        if (push) {
          publishLocation(
            { configId: activeConfigId, datasetId: dataset?.id ?? null, tab, view: "whiteboard", boardId: id },
            loaded.name,
          );
        }
      } catch (error) {
        fail(error);
      } finally {
        setBoardLoading(false);
      }
    },
    [activeConfigId, dataset, tab, publishLocation, showBoard, fail],
  );

  const startNewBoard = useCallback(
    ({ push = true }: { push?: boolean } = {}) => {
      showBoard(null);
      if (push) {
        publishLocation({ configId: activeConfigId, datasetId: dataset?.id ?? null, tab, view: "whiteboard", boardId: null });
      }
    },
    [activeConfigId, dataset, tab, publishLocation, showBoard],
  );

  /**
   * A save landed. The nav's list is patched in place rather than refetched —
   * a board saves itself every few seconds while it is drawn on, and reloading
   * every list on each of those would be most of what this page sends.
   */
  const onBoardSaved = useCallback(
    (saved: WhiteboardSummary, created: boolean) => {
      const summary: WhiteboardSummary = {
        id: saved.id,
        name: saved.name,
        ownerId: saved.ownerId,
        canWrite: saved.canWrite,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
      setWhiteboards(current => [summary, ...current.filter(entry => entry.id !== saved.id)]);
      if (!created) return;
      setActiveBoardId(saved.id);
      setBanner(null);
      publishLocation(
        { configId: activeConfigId, datasetId: dataset?.id ?? null, tab, view: "whiteboard", boardId: saved.id },
        saved.name,
      );
    },
    [activeConfigId, dataset, tab, publishLocation],
  );

  async function removeBoard(id: string) {
    const target = whiteboards.find(entry => entry.id === id);
    if (!window.confirm(`Delete the whiteboard "${target?.name ?? id}"? This cannot be undone.`)) return;

    try {
      await api.deleteWhiteboard(id);
      setWhiteboards(current => current.filter(entry => entry.id !== id));
      // Nothing is left to save, so the guard must not try on the way out.
      if (id === activeBoardId) {
        boardGuard.current = { dirty: false, autosaves: false };
        startNewBoard();
      }
    } catch (error) {
      fail(error);
    }
  }

  /**
   * Restores whatever the URL asks for — on first paint, and again whenever
   * the back button rewrites it.
   *
   * It runs once per distinct URL rather than on every state change, which is
   * what keeps it from fighting the handlers that push: those set the state
   * and the address bar together and stamp `restoredFrom` as they go, so this
   * only has work to do when something outside React moved the address bar
   * first — which in practice means the back button.
   */
  useEffect(() => {
    const restore = () => {
      const search = window.location.search;
      if (restoredFrom.current === search) return;
      restoredFrom.current = search;

      const state = getStateFromUrl();
      setTab(state.tab);
      setView(state.view);
      if (state.configId) void openConfig(state.configId, { push: false });
      if (state.datasetId) void openDatasetById(state.datasetId, { push: false });
      if (state.templateId) void openTemplateById(state.templateId, { push: false });
      if (state.view === "whiteboard") {
        if (state.boardId) void openBoardById(state.boardId, { push: false });
        else startNewBoard({ push: false });
      }
      document.title = titleFor(state);
    };

    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
    // These are stable enough for this to run on mount and on every
    // back/forward, which is exactly when it should.
  }, [openConfig, openDatasetById, openTemplateById, openBoardById, startNewBoard]);

  const changeTab = (next: Tab) => {
    setTab(next);
    // The scripts pane is about the template, so that is the name the title
    // and the breadcrumb take while it is in front.
    publishLocation(
      { configId: activeConfigId, datasetId: dataset?.id ?? null, tab: next },
      next === "scripts" ? templateName.trim() || undefined : name,
    );
  };

  /**
   * Settings, and back again.
   *
   * Both go through `publishLocation` rather than setting `view` directly, so
   * the address bar, the document title and the Polaris breadcrumb move with the
   * pane — the same treatment opening a schema gets. `configId` and `datasetId`
   * ride along untouched, which is what makes closing land back on the schema
   * that was open.
   */
  const showSettings = (next: View) =>
    publishLocation({ configId: activeConfigId, datasetId: dataset?.id ?? null, tab, view: next }, name);

  /* ------------------------------- actions ------------------------------- */

  /**
   * Runs the generator and shows what came out.
   *
   * A run needs a stored configuration, because the endpoint takes a
   * configuration id — the Bun server would generate from a schema posted
   * inline, and that route has no equivalent here. So an unsaved schema is
   * saved first rather than refused: pressing Generate means "run this", and
   * needing a record for it to run against is the platform's business, not the
   * person's.
   */
  async function generate() {
    setBusy(true);
    setBanner(null);
    try {
      const configId = await persist({ quiet: true });
      if (!configId) return;

      const result = await api.generate(configId, rowCount);
      if (result.state === "queued") {
        setBanner({
          kind: "info",
          lines: [
            `${result.rowCount.toLocaleString()} rows is past the synchronous limit, so the run was queued.`,
            "It will appear under Recent datasets once the scheduled job has drained it.",
          ],
        });
        await refreshLists();
        return;
      }

      const window_ = await api.datasetRows(result.datasetId, preferencesRef.current.previewRowLimit);
      const record = await api.getDataset(result.datasetId);
      setDataset(record);
      setPreviewRows(window_.rows);
      setTruncated(window_.truncated);
      publishLocation({ configId, datasetId: result.datasetId, tab }, name);
      await refreshLists();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  /**
   * Rows without a record: the "what would this give me" button.
   *
   * It posts the fields inline rather than running a stored configuration, so
   * pressing it saves nothing — which is the whole point of a button that sits
   * next to Save. The dataset is cleared alongside the rows because these came
   * from nowhere: leaving the last run's name over them would offer a download
   * of rows that are not the ones on screen.
   */
  async function preview() {
    setBusy(true);
    setBanner(null);
    try {
      const result = await api.previewInline({
        fields,
        rowCount: Math.min(rowCount, preferencesRef.current.previewRowLimit),
        seed,
        locale: locale || "en",
      });
      setDataset(null);
      setPreviewRows(result.rows);
      setTruncated(false);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  /**
   * Writes the editor to a record and answers with its id.
   *
   * One function for create and update, because from the editor's side they
   * are the same act — whether there is a row already is not something the
   * person pressing Save is thinking about.
   */
  async function persist({ quiet = false }: { quiet?: boolean } = {}): Promise<string | null> {
    if (!fields.length) {
      setBanner({ kind: "error", lines: ["A configuration needs at least one field."] });
      return null;
    }

    const payload = {
      name: name.trim() || "Untitled schema",
      description: "",
      rowCount,
      seed,
      locale: locale || "en",
      metadata: fromPairs(metadata),
      fields,
    };

    if (activeConfigId) {
      await api.updateConfig(activeConfigId, payload);
      if (!quiet) setBanner({ kind: "info", lines: [`Saved "${payload.name}".`] });
      await refreshLists();
      return activeConfigId;
    }

    const created = await api.createConfig(payload);
    setActiveConfigId(created.configId);
    publishLocation({ configId: created.configId, datasetId: dataset?.id ?? null, tab }, payload.name);
    if (!quiet) setBanner({ kind: "info", lines: [`Saved "${payload.name}".`] });
    await refreshLists();
    return created.configId;
  }

  async function saveConfig() {
    setBusy(true);
    try {
      await persist();
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
   * is what the browser offers the file to the operating system as.
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
        rowCount,
        seed,
        locale,
        metadata: fromPairs(metadata),
        fields,
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

      const result = parseConfigFile(parsed);
      if (!result.ok) throw new Error(result.error);

      const created = await api.createConfig(result.config);
      await refreshLists();
      await openConfig(created.configId);
      setBanner({
        kind: "info",
        lines: [`Imported "${result.config.name}" — ${created.fieldCount} fields from ${file.name}.`],
      });
    } catch (error) {
      fail(error);
    }
  }

  async function removeConfig(id: string) {
    const config = configs.find(c => c.id === id);
    if (
      !window.confirm(
        `Delete the configuration "${config?.name ?? id}"? Datasets generated from it are kept. This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await api.deleteConfig(id);
      if (id === activeConfigId) startNewConfig();
      await refreshLists();
    } catch (error) {
      fail(error);
    }
  }

  async function removeDataset(id: string) {
    const target = datasets.find(d => d.id === id);
    if (
      !window.confirm(
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

  /* --------------------------------- UI ---------------------------------- */

  /**
   * Whether Save will edit the template on screen or fork it.
   *
   * An unsaved one is always yours; a stored one is whatever the write ACL
   * said when the record came down.
   */
  const activeTemplate = templates.find(template => template.id === activeTemplateId) ?? null;
  const templateIsMine = !activeTemplate || activeTemplate.canWrite;

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
        onClick={() => changeTab(key)}
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

  /** One strip for whatever the last action had to say. */
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

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      {!preferences.sidebarCollapsed && (
        <Sidebar
          configs={configs}
          templates={templates}
          whiteboards={whiteboards}
          datasets={datasets}
          activeConfigId={activeConfigId}
          activeTemplateId={activeTemplateId}
          activeWhiteboardId={view === "whiteboard" ? activeBoardId : null}
          activeDatasetId={dataset?.id ?? null}
          storage={storage}
          me={window.NOW?.user?.displayName ?? "You"}
          onNewConfig={() => confirmLeaveBoard() && startNewConfig()}
          onLoadConfig={config => confirmLeaveBoard() && void openConfig(config.id)}
          onDeleteConfig={removeConfig}
          onImportConfig={importConfig}
          onExportConfig={config =>
            // The nav's rows carry no fields, so exporting one from here has
            // to fetch it — the file is the schema, not the summary.
            void api
              .getConfig(config.id)
              .then(full =>
                downloadText(serializeConfigFile(full), configFileName(full.name), "application/json"),
              )
              .catch(fail)
          }
          onNewTemplate={() => confirmLeaveBoard() && startNewTemplate()}
          onLoadTemplate={template => confirmLeaveBoard() && applyTemplate(template)}
          onDeleteTemplate={removeTemplate}
          onNewWhiteboard={() => confirmLeaveBoard() && startNewBoard()}
          onLoadWhiteboard={entry => confirmLeaveBoard() && void openBoardById(entry.id)}
          onDeleteWhiteboard={id => void removeBoard(id)}
          onLoadDataset={record => confirmLeaveBoard() && void openDatasetById(record.id)}
          onDeleteDataset={removeDataset}
          collapsedSections={preferences.collapsedNavSections}
          onToggleSection={toggleNavSection}
          onCollapse={() => updatePreferences({ sidebarCollapsed: true })}
          onOpenSettings={() => confirmLeaveBoard() && showSettings("settings")}
          settingsOpen={view === "settings"}
        />
      )}

      {/* Settings replaces the editor rather than floating over it: it is a
          view with its own URL, and the nav stays put so leaving is one click
          on the schema you want back. */}
      {view === "settings" ? (
        <SettingsPanel
          preferences={preferences}
          saveState={saveState}
          templates={templates}
          storage={storage}
          onChange={updatePreferences}
          onReset={resetPreferences}
          onClose={() => showSettings("editor")}
          leading={expandSidebarButton}
        />
      ) : view === "whiteboard" ? (
        boardLoading ? (
          <main className="flex min-w-0 flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Opening the whiteboard…
          </main>
        ) : (
          <WhiteboardPanel
              key={boardSession}
              board={board}
              dark={dark}
              leading={expandSidebarButton}
              banner={bannerNode}
              guard={boardGuard}
              onNew={() => confirmLeaveBoard() && startNewBoard()}
              onSaved={onBoardSaved}
              onError={message => setBanner({ kind: "error", lines: [message] })}
            />
        )
      ) : (
      <main className="flex min-w-0 flex-1 flex-col">
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
              min={PREFERENCE_LIMITS.rowCount.min}
              max={PREFERENCE_LIMITS.rowCount.max}
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
              the schema itself, then the controls that run it. */}
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
            <Button variant="outline" onClick={saveConfig} disabled={busy || !fields.length}>
              <Save />
              {activeConfigId ? "Save" : "Save config"}
            </Button>

            <span aria-hidden className="mx-1 h-6 w-px bg-border" />

            <Button
              variant="outline"
              onClick={preview}
              disabled={busy || !fields.length}
              title="Generate rows without storing them"
            >
              Preview
            </Button>
            <Button onClick={generate} disabled={busy || !fields.length} className="shadow-sm">
              {busy ? <Loader2 className="animate-spin" /> : <Play />}
              {busy ? "Working…" : "Generate"}
            </Button>
          </div>

          {/* Sits on the header's own bottom border while a run is out. */}
          {busy && (
            <span aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden">
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
                changeTab(next);
                // Selection follows focus here, so focus has to follow it back.
                document.getElementById(`tab-${next}`)?.focus();
              }}
            >
              {tabButton("import", <Braces className="size-4" />, "Import structure")}
              {tabButton("schema", <ListTree className="size-4" />, "Schema", fields.length)}
              {tabButton("scripts", <FileCode2 className="size-4" />, "Scripts", templates.length)}
            </div>

            <div
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              className="min-h-0 flex-1 overflow-auto p-4"
            >
              {tab === "scripts" ? (
                <ScriptTemplatePanel
                  name={templateName}
                  body={templateBody}
                  activeId={activeTemplateId}
                  owned={templateIsMine}
                  busy={busy}
                  onNameChange={setTemplateName}
                  onBodyChange={setTemplateBody}
                  onSave={() => void saveTemplate()}
                  onNew={startNewTemplate}
                />
              ) : tab === "import" ? (
                <ImportPanel
                  onInferred={(inferred, notes, detected) => {
                    setFields(inferred);
                    changeTab("schema");
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
                            onClick={() => changeTab("import")}
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
                  preferredFormat={preferences.defaultExportFormat}
                  templates={templates}
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
              // The visible label is the dataset's name, so the control says
              // for itself what clicking it does.
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
      </main>
      )}
    </div>
  );
}

export default App;
