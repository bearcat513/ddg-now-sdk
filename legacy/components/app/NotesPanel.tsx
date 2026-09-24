import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  ChevronRight,
  Code,
  Columns2,
  Eye,
  FileCode2,
  FileDown,
  FileStack,
  Heading1,
  Heading2,
  Heading3,
  Link,
  List,
  ListOrdered,
  ListTree,
  Pencil,
  Plus,
  Printer,
  Save,
  Slash,
  SquareCode,
  StickyNote,
  Table2,
  TextQuote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotePrintSheet, usePrintNote } from "@/components/app/NotePrint";
import { NoteView } from "@/components/app/NoteView";
import { api } from "@/lib/api";
import {
  activeReferenceQuery,
  insertReference,
  noteReferences,
  openReferenceFields,
  REFERENCE_FIELDS,
  REFERENCE_LABELS,
  referenceKey,
  referenceStage,
  referenceToken,
  type FieldShape,
  type Note,
  type ReferenceKind,
  type ReferenceQuery,
  type ResolvedReference,
} from "@/lib/notes";
import {
  activeSlashQuery,
  insertSlashCommand,
  matchSlashCommands,
  type SlashQuery,
} from "@/lib/slashCommands";
import { cn } from "@/lib/utils";
import type { Dataset, SchemaConfig } from "@/lib/types";
import type { ScriptTemplate } from "@/lib/scriptTemplate";

type Props = {
  title: string;
  body: string;
  /** null while the note on screen has never been saved. */
  activeId: string | null;
  busy: boolean;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onSave: () => void;
  onNew: () => void;
  /** Saves what is on screen as a Markdown file, whether it is saved or not. */
  onExportMarkdown: () => void;
  /** What the nav is holding — what the `[[` picker offers, and how a
   *  reference is named before the server has answered for it. */
  configs: SchemaConfig[];
  templates: ScriptTemplate[];
  datasets: Dataset[];
  notes: Note[];
  /** Leaves the note for the record a chip names. */
  onOpenReference: (reference: ResolvedReference) => void;
};

/** Which panes are on screen. Split stacks them, since this pane is narrow. */
type View = "write" | "split" | "preview";

/** How long the editor sits on a change before asking what it now references. */
const RESOLVE_DELAY_MS = 400;

/** Offers past this are noise: the query is what narrows the list, not scrolling. */
const MAX_SUGGESTIONS = 8;

const KIND_ICONS: Record<ReferenceKind, React.ComponentType<{ className?: string }>> = {
  config: ListTree,
  dataset: FileStack,
  "script-template": FileCode2,
  note: StickyNote,
};

/** Which mark each command writes, for the row that offers it. */
const COMMAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "heading-1": Heading1,
  "heading-2": Heading2,
  "heading-3": Heading3,
  "bullet-list": List,
  "numbered-list": ListOrdered,
  quote: TextQuote,
  "code-block": SquareCode,
  bold: Bold,
  code: Code,
  link: Link,
  reference: StickyNote,
};

/** One record the picker can offer. */
type Suggestion = { id: string; kind: ReferenceKind; label: string; detail: string };

/** What a field offer renders as, shown before it is picked. */
const SHAPE_LABELS: Record<FieldShape, string> = { value: "value", text: "text", table: "table" };

export function NotesPanel({
  title,
  body,
  activeId,
  busy,
  onTitleChange,
  onBodyChange,
  onSave,
  onNew,
  onExportMarkdown,
  configs,
  templates,
  datasets,
  notes,
  onOpenReference,
}: Props) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [view, setView] = useState<View>("split");

  /** The print run behind "PDF", and the stamp on the sheet while it is up. */
  const { printedOn, print } = usePrintNote(title.trim() || "Untitled note");

  /** The `[[…` under the caret, and which offer is highlighted. */
  const [active, setActive] = useState<ReferenceQuery | null>(null);
  /** The `/…` under the caret — the other thing typing can open. */
  const [slash, setSlash] = useState<SlashQuery | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  /**
   * Where a menu Escape closed began, so the keyup that follows the Escape —
   * and every keystroke after it into the same `[[` or `/` — does not simply
   * open it again. Cleared by moving off it, which is all "reopen" means here.
   */
  const dismissed = useRef<{ reference: number | null; slash: number | null }>({
    reference: null,
    slash: null,
  });

  /**
   * What the server last said these references point at, keyed by the whole
   * reference — `ds_9f8e#rows` is a different answer from `ds_9f8e`.
   *
   * It outranks the lists below because it is the only thing that knows about
   * a record that has been deleted, or one that was never this account's —
   * and the only thing at all that holds a field's value.
   */
  const [resolved, setResolved] = useState<Map<string, ResolvedReference>>(new Map());

  const everything = useMemo<Suggestion[]>(
    () => [
      ...configs.map(config => ({
        id: config.id,
        kind: "config" as const,
        label: config.name,
        detail: `${config.fields.length} field${config.fields.length === 1 ? "" : "s"}`,
      })),
      ...datasets.map(dataset => ({
        id: dataset.id,
        kind: "dataset" as const,
        label: dataset.name,
        detail: `${dataset.rowCount.toLocaleString()} rows`,
      })),
      ...templates.map(template => ({
        id: template.id,
        kind: "script-template" as const,
        label: template.name,
        detail: "Script template",
      })),
      ...notes.map(note => ({ id: note.id, kind: "note" as const, label: note.title, detail: "Note" })),
    ],
    [configs, datasets, templates, notes],
  );

  const byId = useMemo(() => new Map(everything.map(item => [item.id, item])), [everything]);

  /**
   * What a chip shows: the server's answer when there is one, and otherwise
   * the lists the page is already holding — so a reference inserted a moment
   * ago is named at once rather than after a round trip.
   *
   * The fallback only ever names the record. A field's value is the server's
   * to know, so a field reference stays pending until it answers.
   */
  const resolve = useCallback(
    (id: string, field: string): ResolvedReference | undefined => {
      const answered = resolved.get(referenceKey({ id, field }));
      if (answered) return answered;
      if (field) return undefined;
      const local = byId.get(id);
      return local ? { ...local, found: true } : undefined;
    },
    [resolved, byId],
  );

  const referenced = useMemo(() => noteReferences(body), [body]);
  /** A stable key for "the same set of references", so an effect can use it. */
  const referencedKey = referenced.map(referenceKey).join(",");

  useEffect(() => {
    if (!referencedKey) {
      setResolved(new Map());
      return;
    }

    let live = true;
    const timer = setTimeout(() => {
      void api
        .resolveNoteReferences(referencedKey.split(","))
        .then(({ references }) => {
          if (!live) return;
          setResolved(
            new Map(
              references.map(reference => [
                referenceKey({ id: reference.id, field: reference.field?.path ?? "" }),
                reference,
              ]),
            ),
          );
        })
        // A failed lookup leaves the chips on whatever the lists say, which is
        // a better note than one full of question marks.
        .catch(() => {});
    }, RESOLVE_DELAY_MS);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [referencedKey]);

  /* ------------------------------ the picker ----------------------------- */

  /** Records, or the fields of one — whichever the brackets are asking for. */
  const stage = active ? referenceStage(active.query) : null;

  const records = useMemo(() => {
    if (stage?.stage !== "record") return [];
    const needle = stage.query.trim().toLowerCase();
    const matches = needle
      ? everything.filter(item => item.label.toLowerCase().includes(needle) || item.id.includes(needle))
      : everything;
    return matches.slice(0, MAX_SUGGESTIONS);
  }, [stage, everything]);

  const fields = useMemo(() => {
    if (stage?.stage !== "field") return [];
    const needle = stage.query.trim().toLowerCase();
    return REFERENCE_FIELDS[stage.kind].filter(spec => spec.path.toLowerCase().includes(needle));
  }, [stage]);

  const commands = useMemo(() => (slash ? matchSlashCommands(slash.query) : []), [slash]);

  const referenceOffers = stage?.stage === "field" ? fields.length : records.length;

  /**
   * Which menu is on screen, where both could be.
   *
   * `[[` wins: it is the more specific of the two — a slash inside a record
   * name is part of the name — and it is the one the caret is inside of.
   */
  const menu: "reference" | "slash" | null =
    active && referenceOffers ? "reference" : slash && commands.length ? "slash" : null;

  const offers = menu === "slash" ? commands.length : menu === "reference" ? referenceOffers : 0;

  // A query that has narrowed past the highlighted row would otherwise insert
  // whatever slid into its place.
  useEffect(() => setHighlighted(0), [active?.query, slash?.query]);

  /** Re-reads the caret after anything that could have moved it. */
  const syncMenus = () => {
    const element = textarea.current;
    if (!element) return;
    readMenus(element.value, element.selectionStart);
  };

  /** What the text and the caret say is open — minus anything Escape closed. */
  function readMenus(value: string, caret: number) {
    const reference = activeReferenceQuery(value, caret);
    const command = activeSlashQuery(value, caret);
    setActive(reference && reference.start === dismissed.current.reference ? null : reference);
    setSlash(command && command.start === dismissed.current.slash ? null : command);
  }

  /**
   * Applies an edit and puts the caret where it left it.
   *
   * An edit may hand back a range rather than a point — `**bold text**` with
   * the words selected — so the first thing typed replaces the placeholder
   * instead of landing next to it.
   */
  function apply(edit: { value: string; caret: number; end?: number }, keepOpen: boolean) {
    const element = textarea.current;
    if (!element) return;

    onBodyChange(edit.value);
    setSlash(null);
    if (!keepOpen) setActive(null);
    dismissed.current = { reference: null, slash: null };

    // After React has painted the new value — setting the range against the
    // old one would put the caret in the wrong place, or lose it entirely.
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(edit.caret, edit.end ?? edit.caret);
      if (keepOpen) setActive(activeReferenceQuery(edit.value, edit.caret));
    });
  }

  /** Takes the offer whole: the record itself, or the field. */
  function choose(index: number) {
    const element = textarea.current;
    if (!element || !active || !stage) return;

    if (stage.stage === "field") {
      const spec = fields[index];
      if (spec) apply(insertReference(element.value, active, element.selectionStart, stage.id, spec.path), false);
      return;
    }

    const suggestion = records[index];
    if (suggestion) apply(insertReference(element.value, active, element.selectionStart, suggestion.id), false);
  }

  /**
   * Writes the mark a command stands for.
   *
   * The reference command is the one that leaves a menu behind it: it opens
   * `[[` and the record picker carries on from the same caret.
   */
  function chooseCommand(index: number) {
    const element = textarea.current;
    if (!element || !slash) return;

    const command = commands[index];
    if (!command) return;

    apply(
      insertSlashCommand(element.value, slash, element.selectionStart, command),
      command.action.kind === "reference",
    );
  }

  /** Drills into a record's fields instead of taking the record. */
  function drill(index: number) {
    const element = textarea.current;
    if (!element || !active || stage?.stage !== "record") return;

    const suggestion = records[index];
    if (suggestion) apply(openReferenceFields(element.value, active, element.selectionStart, suggestion.id), true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    /** Takes the highlighted offer of whichever menu is open. */
    const accept = (index: number) => (menu === "slash" ? chooseCommand(index) : choose(index));

    if (!menu || !offers) {
      // ⌘Enter saves from inside the editor, which is where the hands are.
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && title.trim()) {
        event.preventDefault();
        onSave();
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlighted(current => (current + step + offers) % offers);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      accept(highlighted);
      return;
    }

    // Tab refines rather than accepts: on a record it opens that record's
    // fields, and on a field there is nothing left to refine, so it takes it.
    if (event.key === "Tab") {
      event.preventDefault();
      if (menu === "reference" && stage?.stage === "record") drill(highlighted);
      else accept(highlighted);
      return;
    }

    if (event.key === "Escape") {
      // Closes the menu without closing anything else — the brackets, or the
      // slash, stay, so either can still be typed out by hand.
      event.preventDefault();
      dismissed.current = { reference: active?.start ?? null, slash: slash?.start ?? null };
      setActive(null);
      setSlash(null);
    }
  }

  /** Opens a menu from the toolbar, for anyone who has not met `[[` or `/`. */
  function startMenu(opener: "[[" | "/") {
    const element = textarea.current;
    if (!element) return;
    element.focus();

    const at = element.selectionStart;
    const before = element.value.slice(0, at);
    // A `/` only opens a menu at the start of a word, so one typed against a
    // word gets the space it needs — the toolbar means it, wherever the caret.
    const gap = opener === "/" && before && !/\s$/.test(before) ? " " : "";
    const head = before + gap + opener;

    const next = `${head}${element.value.slice(element.selectionEnd)}`;
    if (opener === "[[") {
      apply({ value: next, caret: head.length }, true);
      return;
    }

    onBodyChange(next);
    dismissed.current = { reference: null, slash: null };
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(head.length, head.length);
      readMenus(next, head.length);
    });
  }

  const missing = referenced.filter(target => {
    const reference = resolve(target.id, target.field);
    return reference && (!reference.found || reference.field?.shape === "missing");
  }).length;

  const viewButton = (key: View, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setView(key)}
      aria-pressed={view === key}
      title={label}
      aria-label={label}
      className={cn(
        "focus-ring flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
        view === key ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
    </button>
  );

  /** One row of the picker, whichever stage it is on. */
  const offerRow = (
    key: string,
    index: number,
    icon: React.ReactNode,
    label: string,
    detail: string,
    trailing: React.ReactNode,
    onPick: () => void,
    onDrill?: () => void,
  ) => (
    <li key={key} className="flex items-stretch">
      <button
        type="button"
        role="option"
        aria-selected={index === highlighted}
        // The textarea keeps focus, so the caret never leaves the sentence
        // being written.
        onMouseDown={event => event.preventDefault()}
        onMouseEnter={() => setHighlighted(index)}
        onClick={onPick}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors",
          index === highlighted ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
        )}
      >
        <span className="shrink-0 text-muted-foreground">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">{label}</span>
          <span className="block truncate text-[10px] text-muted-foreground">{detail}</span>
        </span>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">{trailing}</span>
      </button>
      {onDrill && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Pick a field of ${label}`}
          title="Reference one field of this record"
          onMouseDown={event => event.preventDefault()}
          onClick={onDrill}
          className="focus-ring flex shrink-0 items-center rounded-sm px-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="size-3.5" />
        </button>
      )}
    </li>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="@container flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor="note-title" className="label-caps mb-1">
            Note title
          </Label>
          <Input
            id="note-title"
            className="h-8"
            placeholder="Why the demo seed is wrong"
            value={title}
            onChange={event => onTitleChange(event.target.value)}
          />
        </div>

        <div className="flex items-center overflow-hidden rounded-md border bg-card shadow-xs">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none"
            onClick={onExportMarkdown}
            title="Save as a Markdown file — the text exactly as it was written"
            aria-label="Save as Markdown"
          >
            <FileDown />
            {/* The icons carry it in a narrow pane, so the row stays on one
                line; the titles still name both files. */}
            <span className="hidden @lg:inline">Markdown</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none border-l"
            onClick={print}
            title="Print the rendered note — where “Save as PDF” lives"
            aria-label="Save as PDF"
          >
            <Printer />
            <span className="hidden @lg:inline">PDF</span>
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={onNew} title="Start a new note">
          <Plus />
          New
        </Button>
        <Button size="sm" onClick={onSave} disabled={busy || !title.trim()} title="Save this note (⌘Enter)">
          <Save />
          {activeId ? "Save" : "Save note"}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => startMenu("/")} title="Headings, lists, code — or just type /">
            <Slash />
            Insert
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startMenu("[[")}
            title="Reference a record — or just type [["
          >
            <StickyNote />
            Reference
          </Button>
          <span className="truncate text-[11px] text-muted-foreground/70">
            {referenced.length === 0
              ? "Type / for a mark, [[ to reference a record"
              : `${referenced.length} reference${referenced.length === 1 ? "" : "s"}`}
            {missing > 0 && <span className="text-destructive"> · {missing} unresolved</span>}
          </span>
        </div>

        <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
          {viewButton("write", <Pencil className="size-3.5" />, "Write")}
          {viewButton("split", <Columns2 className="size-3.5" />, "Write and preview")}
          {viewButton("preview", <Eye className="size-3.5" />, "Preview")}
        </div>
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col gap-2", view === "split" && "min-h-96")}>
        {view !== "preview" && (
          <div className={cn("relative flex min-h-0", view === "split" ? "flex-[3]" : "flex-1")}>
            <textarea
              ref={textarea}
              id="note-body"
              aria-label="Note body, in Markdown"
              value={body}
              spellCheck
              placeholder="# Heading&#10;&#10;Type / for headings, lists and code — or [[ to reference a record."
              onChange={event => {
                onBodyChange(event.target.value);
                // Read from the element rather than from `body`: this handler
                // runs before React has re-rendered with the new value.
                readMenus(event.target.value, event.target.selectionStart);
              }}
              onKeyUp={syncMenus}
              onClick={syncMenus}
              onBlur={() => {
                // Deferred, so a click on an offer lands before the list goes.
                setTimeout(() => {
                  setActive(null);
                  setSlash(null);
                }, 150);
              }}
              onKeyDown={onKeyDown}
              className={cn(
                "min-h-40 w-full resize-none rounded-md border bg-transparent p-3 font-mono text-xs leading-relaxed",
                "outline-none transition-[color,box-shadow] placeholder:text-muted-foreground/60",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30",
              )}
            />

            {menu && offers > 0 && (
              <div
                className={cn(
                  "absolute inset-x-0 bottom-1 z-10 mx-1 overflow-hidden rounded-md border bg-popover shadow-lg",
                )}
              >
                {menu === "slash" && (
                  <p className="border-b bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
                    {"Marks the preview renders — nothing here arrives as punctuation"}
                  </p>
                )}

                {menu === "reference" && stage?.stage === "field" && (
                  <p className="border-b bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
                    A field of <span className="font-medium text-foreground">{byId.get(stage.id)?.label ?? stage.id}</span>
                    {" — an array renders as a table"}
                  </p>
                )}

                <ul
                  role="listbox"
                  aria-label={menu === "slash" ? "What to insert" : "What to reference"}
                  className="max-h-56 overflow-y-auto p-1"
                >
                  {menu === "slash"
                    ? commands.map((command, index) => {
                        const Icon = COMMAND_ICONS[command.name] ?? Pencil;
                        return offerRow(
                          command.name,
                          index,
                          <Icon className="size-3.5" />,
                          command.label,
                          command.hint,
                          command.token,
                          () => chooseCommand(index),
                        );
                      })
                    : stage?.stage === "field"
                      ? fields.map((spec, index) =>
                          offerRow(
                            spec.path,
                            index,
                            spec.shape === "table" ? <Table2 className="size-3.5" /> : <Pencil className="size-3.5" />,
                            spec.label,
                            spec.hint,
                            SHAPE_LABELS[spec.shape],
                            () => choose(index),
                          ),
                        )
                      : records.map((suggestion, index) => {
                          const Icon = KIND_ICONS[suggestion.kind];
                          return offerRow(
                            suggestion.id,
                            index,
                            <Icon className="size-3.5" />,
                            suggestion.label,
                            `${REFERENCE_LABELS[suggestion.kind]} · ${suggestion.detail}`,
                            referenceToken(suggestion.id),
                            () => choose(index),
                            () => drill(index),
                          );
                        })}
                </ul>

                <p className="flex items-center gap-2 border-t bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
                  <span>
                    <kbd className="font-sans font-medium">↵</kbd> insert
                  </span>
                  {menu === "reference" && stage?.stage === "record" && (
                    <span>
                      <kbd className="font-sans font-medium">⇥</kbd> pick a field
                    </span>
                  )}
                  <span>
                    <kbd className="font-sans font-medium">esc</kbd> close
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {view !== "write" && (
          <div
            className={cn(
              "min-h-0 overflow-auto rounded-md border bg-card/30 p-3",
              view === "split" ? "flex-[2]" : "flex-1",
            )}
          >
            <NoteView source={body} resolve={resolve} onOpen={onOpenReference} />
          </div>
        )}
      </div>

      {/* Outside the app's root, so printing has no panes to undo — and only
          while a print run is up, so the note is rendered twice for as long as
          the dialog is and no longer. */}
      {printedOn !== null &&
        createPortal(
          <NotePrintSheet title={title} body={body} printedOn={printedOn} resolve={resolve} />,
          document.body,
        )}

      <p className="text-[11px] text-muted-foreground/70">
        <span className="font-medium">Markdown</span> saves the text as it was written;{" "}
        <span className="font-medium">PDF</span> prints the rendered note, chips and quoted tables and all — the
        preview, on paper.{" "}
        <span className="font-mono">/</span> writes a mark — heading, list, quote, code — and only ever one the
        preview renders.{" "}
        References store the record's id, not its name — rename a configuration and every note that mentions it
        follows. Add <span className="font-mono">#field</span> to quote one field instead: an array or an object
        renders as a table, anything else reads inline.
      </p>
    </div>
  );
}
