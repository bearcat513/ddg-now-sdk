import { lazy, Suspense, useCallback, useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Check, Loader2, PenLine, Plus, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";
import { EMPTY_WHITEBOARD_SCENE, type Whiteboard, type WhiteboardSummary } from "../../../server/lib/whiteboard";
import type { CanvasHandle } from "./WhiteboardCanvas";

/**
 * Its own chunk. Excalidraw is several times the size of the rest of the page
 * put together, and most visits never open a board.
 */
const WhiteboardCanvas = lazy(() => import("./WhiteboardCanvas"));

/** How long a board sits unchanged before it saves itself. */
const AUTOSAVE_DELAY_MS = 1500;

export const UNTITLED_WHITEBOARD = "Untitled whiteboard";

/**
 * What the app needs to know before it navigates away: whether there is
 * anything to lose, and whether this panel will save it on its way out.
 */
export type BoardGuard = { dirty: boolean; autosaves: boolean };

type Status = "idle" | "saving" | "saved" | "failed";

type Props = {
  /** The board as it was loaded, or null for a new one. Read on mount only. */
  board: Whiteboard | null;
  dark: boolean;
  /** Rendered at the start of the header — the sidebar control, when it is away. */
  leading?: ReactNode;
  /** The app's message strip, which hangs under the header here as it does in the editor. */
  banner?: ReactNode;
  guard: MutableRefObject<BoardGuard>;
  onNew: () => void;
  /** A save landed. `created` when it made a new record, which is when the URL moves. */
  onSaved: (board: WhiteboardSummary, created: boolean) => void;
  onError: (message: string) => void;
};

/**
 * One whiteboard: a name, a save indicator, and an Excalidraw canvas under it.
 *
 * A board the caller owns saves itself a moment after it stops changing, the
 * way a drawing app is expected to — there is no version of "I drew for ten
 * minutes and closed the tab" that should lose the drawing. Two kinds of board
 * do not, and Save is the button for both: a new one, because an autosave
 * would turn every stray click on a blank canvas into a record; and somebody
 * else's, because the write ACL says it is theirs and saving keeps a copy of
 * your own instead, exactly as it does for a script template.
 *
 * The panel is remounted (by `key`) for every board opened, so the state here
 * is always about one board and never has to be reset in place. Creating a
 * record does *not* remount it: the canvas carries straight on, and only the
 * id underneath it changes.
 */
export function WhiteboardPanel({ board, dark, leading, banner, guard, onNew, onSaved, onError }: Props) {
  const [name, setName] = useState(board?.name ?? UNTITLED_WHITEBOARD);
  const [boardId, setBoardId] = useState<string | null>(board?.id ?? null);
  const [owned, setOwned] = useState(board ? board.canWrite : true);
  const [savedName, setSavedName] = useState(board?.name ?? null);
  const [sceneDirty, setSceneDirty] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const canvas = useRef<CanvasHandle | null>(null);
  const saving = useRef(false);
  /** A save asked for while one was out — run once it lands, with what is then on screen. */
  const again = useRef(false);

  const dirty = sceneDirty || name.trim() !== (savedName ?? "");
  const autosaves = Boolean(boardId) && owned;

  guard.current = { dirty, autosaves };

  // Read by `save`, which is called from timers and listeners that outlive a
  // render; without these it would save the name and id of the render that
  // scheduled it.
  const latest = useRef({ name, boardId, owned });
  latest.current = { name, boardId, owned };

  const save = useCallback(async () => {
    const handle = canvas.current;
    if (!handle) return;
    if (saving.current) {
      again.current = true;
      return;
    }

    const { name: currentName, boardId: id, owned: mine } = latest.current;
    const { scene, fingerprint } = handle.serialize();
    const input = { name: currentName.trim() || UNTITLED_WHITEBOARD, scene };

    saving.current = true;
    setStatus("saving");
    try {
      if (id && mine) {
        onSaved(await api.updateWhiteboard(id, input), false);
      } else {
        const created = await api.createWhiteboard(input);
        setBoardId(created.id);
        setOwned(true);
        onSaved(created, true);
      }
      handle.markSaved(fingerprint);
      setSavedName(input.name);
      setStatus("saved");
    } catch (error) {
      setStatus("failed");
      onError(error instanceof Error ? error.message : "The whiteboard could not be saved.");
    } finally {
      saving.current = false;
      if (again.current) {
        again.current = false;
        void save();
      }
    }
  }, [onSaved, onError]);

  /** Saves a board that saves itself, once it has been still for a moment. */
  useEffect(() => {
    if (!dirty || !autosaves || status === "failed") return;
    const timer = window.setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
    // `name` and `sceneDirty` restart the wait, so a burst of drawing is one save.
  }, [dirty, autosaves, name, sceneDirty, status, save]);

  /** Clears "Saved" a moment after it appears, so it reads as an event. */
  useEffect(() => {
    if (status !== "saved") return;
    const timer = window.setTimeout(() => setStatus("idle"), 1500);
    return () => window.clearTimeout(timer);
  }, [status]);

  /**
   * Leaving with the last edit still inside the autosave delay saves it on the
   * way out, rather than dropping the final stroke someone drew before
   * clicking elsewhere. The canvas's own state outlives the unmount, so the
   * handle still serializes what was on screen.
   */
  const guardRef = useRef(guard.current);
  guardRef.current = guard.current;
  useEffect(
    () => () => {
      if (guardRef.current.dirty && guardRef.current.autosaves) void save();
    },
    [save],
  );

  /** Ctrl/⌘-S saves to the record — in capture, so it is ours before Excalidraw's. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "s" || !(event.metaKey || event.ctrlKey) || event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      void save();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [save]);

  /** The browser's own "leave site?" prompt, while there is something to lose. */
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const onReady = useCallback((handle: CanvasHandle) => {
    canvas.current = handle;
  }, []);

  const statusText =
    status === "saving"
      ? "Saving…"
      : status === "failed"
        ? "Not saved"
        : status === "saved"
          ? "Saved"
          : !boardId
            ? "Not saved yet"
            : !owned
              ? "Read only · Save keeps your own copy"
              : dirty
                ? "Unsaved changes"
                : "All changes saved";

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="relative flex flex-wrap items-center gap-3 border-b bg-card/40 px-4 py-3">
        {leading}

        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <PenLine className="size-4" />
        </span>

        <div className="min-w-48 flex-1">
          <Input
            aria-label="Whiteboard name"
            value={name}
            onChange={event => setName(event.target.value)}
            className="h-9 font-medium"
            maxLength={120}
          />
        </div>

        <p
          role="status"
          className={cn(
            "flex items-center gap-1.5 text-xs",
            status === "failed" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {status === "saving" && <Loader2 className="size-3.5 animate-spin" />}
          {status === "saved" && <Check className="size-3.5 text-emerald-600" />}
          {statusText}
        </p>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onNew}>
            <Plus />
            New board
          </Button>
          {/* Always offered: for a board that saves itself it is "now, please",
              and after a failure it is the retry. */}
          <Button
            onClick={() => void save()}
            disabled={status === "saving" || (autosaves && !dirty && status !== "failed")}
            className="shadow-sm"
            title="Save (Ctrl/⌘-S)"
          >
            <Save />
            {!boardId ? "Save board" : owned ? "Save" : "Save a copy"}
          </Button>
        </div>

        {status === "saving" && (
          <span aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden">
            <span className="block h-full w-full origin-left animate-indeterminate bg-primary" />
          </span>
        )}
      </header>

      {banner}

      {/* Excalidraw sizes itself to its parent, so the parent has to have a
          size of its own rather than one borrowed from its content. */}
      <div className="relative min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading the whiteboard…
            </div>
          }
        >
          <div className="absolute inset-0">
            <WhiteboardCanvas
              scene={board?.scene ?? EMPTY_WHITEBOARD_SCENE}
              dark={dark}
              name={name}
              onReady={onReady}
              onDirtyChange={setSceneDirty}
            />
          </div>
        </Suspense>
      </div>
    </main>
  );
}
