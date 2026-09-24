import { useImperativeHandle, useMemo, useRef, type KeyboardEvent, type Ref } from "react";
import { editForKey, type TextEdit } from "@/lib/codeEdit";
import { tokenize, type TokenKind } from "@/lib/highlight";
import { cn } from "@/lib/utils";

/** What the editor lets its owner do from the outside. */
export type CodeEditorHandle = {
  /** Puts text in at the caret, replacing the selection, and keeps focus. */
  insert: (text: string) => void;
};

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Named for screen readers, since the box carries no visible label of its own. */
  label: string;
  className?: string;
  ref?: Ref<CodeEditorHandle>;
};

/**
 * Both layers are laid over each other, so every one of these has to be
 * identical or the caret drifts away from the text under it. Nothing here may
 * change a glyph's width — no italics, no weight — for the same reason.
 */
const LAYER = "font-mono text-xs leading-5 p-3";

const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: "",
  comment: "text-muted-foreground/70",
  string: "text-emerald-600 dark:text-emerald-400",
  number: "text-blue-600 dark:text-blue-400",
  keyword: "text-violet-600 dark:text-violet-400",
  literal: "text-orange-600 dark:text-orange-400",
  placeholder: "rounded bg-primary/15 text-primary",
};

/**
 * Applies one edit through the browser's own insert command.
 *
 * `execCommand` is deprecated and still the only way to put text into a
 * textarea without clearing its undo history — assigning to `value` would make
 * ⌘Z undo everything typed since the page loaded. Where it is unavailable the
 * fallback writes the value directly and hands the same string to React, which
 * then re-renders over a DOM node that already agrees with it.
 */
function applyEdit(element: HTMLTextAreaElement, edit: TextEdit, onChange: (value: string) => void) {
  element.setSelectionRange(edit.from, edit.to);

  let inserted = false;
  try {
    inserted = document.execCommand("insertText", false, edit.text);
  } catch {
    inserted = false;
  }

  if (!inserted) {
    element.value = `${element.value.slice(0, edit.from)}${edit.text}${element.value.slice(edit.to)}`;
    onChange(element.value);
  }

  element.setSelectionRange(edit.caret, edit.caretEnd ?? edit.caret);
}

/**
 * A plain-text code box: line numbers, JavaScript colouring, and the handful of
 * habits that make a script bearable to type — indentation that follows the
 * line above, brackets and quotes that close themselves, Tab over a selected
 * block.
 *
 * It is a textarea with a coloured copy of the text painted underneath, rather
 * than an editor component: a textarea already has selection, undo, find,
 * spell-check off, IME and every platform's own text shortcuts, and none of
 * that needed rebuilding to make a twenty-line script easier to write.
 */
export function CodeEditor({ id, value, onChange, label, className, ref }: Props) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const highlight = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  /** Set by Escape, so the next Tab moves focus instead of indenting. */
  const releaseTab = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      insert(text: string) {
        const element = textarea.current;
        if (!element) return;
        // Focus first: an insertion from a button belongs where the caret was
        // last, and the caret is only visible if the box has it back.
        element.focus();
        const { selectionStart, selectionEnd } = element;
        applyEdit(
          element,
          { from: selectionStart, to: selectionEnd, text, caret: selectionStart + text.length },
          onChange,
        );
      },
    }),
    [onChange],
  );

  const tokens = useMemo(() => tokenize(value), [value]);
  const lineCount = useMemo(() => value.split("\n").length, [value]);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const element = event.currentTarget;

    // Tab is the editor's own key, which would otherwise trap anyone moving
    // through the page by keyboard: Escape hands the next one back.
    if (event.key === "Escape") {
      releaseTab.current = true;
      return;
    }
    if (event.key === "Tab" && releaseTab.current) {
      releaseTab.current = false;
      return;
    }
    releaseTab.current = false;

    // Undo, redo, select-all and every other platform shortcut stay the
    // browser's; only bare typing is ours.
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    // Mid-composition, Enter belongs to the input method: it is what accepts
    // the candidate, and taking it would make this box unusable for anyone
    // typing through an IME.
    if (event.nativeEvent.isComposing) return;

    const edit = editForKey({
      key: event.key,
      shiftKey: event.shiftKey,
      value: element.value,
      selectionStart: element.selectionStart,
      selectionEnd: element.selectionEnd,
    });
    if (!edit) return;

    event.preventDefault();
    applyEdit(element, edit, onChange);
  }

  /** The painted copy and the numbers follow the box that is actually scrolling. */
  function syncScroll() {
    const element = textarea.current;
    if (!element) return;
    if (highlight.current) {
      highlight.current.scrollTop = element.scrollTop;
      highlight.current.scrollLeft = element.scrollLeft;
    }
    if (gutter.current) gutter.current.scrollTop = element.scrollTop;
  }

  return (
    <div
      className={cn(
        "relative flex min-h-0 overflow-hidden rounded-md border bg-transparent dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        className,
      )}
    >
      <div
        ref={gutter}
        aria-hidden
        className={cn(
          LAYER,
          "select-none overflow-hidden border-r pr-2 pl-2 text-right text-muted-foreground/50",
        )}
      >
        {Array.from({ length: lineCount }, (_, index) => (
          <div key={index}>{index + 1}</div>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <pre ref={highlight} aria-hidden className={cn(LAYER, "pointer-events-none absolute inset-0 overflow-hidden")}>
          {tokens.map((token, index) => (
            <span key={index} className={TOKEN_CLASS[token.kind]}>
              {token.text}
            </span>
          ))}
          {/* A trailing break, so the last line keeps its height while empty. */}
          {"\n"}
        </pre>

        <textarea
          id={id}
          ref={textarea}
          aria-label={label}
          value={value}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          onChange={event => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
          className={cn(
            LAYER,
            "absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent",
            // The colours come from the layer underneath; only the caret and
            // the selection are the textarea's own.
            "text-transparent caret-foreground outline-none",
          )}
        />
      </div>
    </div>
  );
}
