/**
 * What a keystroke does in the script editor.
 *
 * Every behaviour here is expressed as one replacement — a range, the text
 * that goes in its place, and where the caret lands — rather than as a new
 * value for the whole box. The editor applies it through the browser's own
 * insert command, which is what keeps undo working: rewriting a textarea's
 * value from React state would throw the native undo stack away, and an editor
 * where ⌘Z does nothing is worse than a plain textarea.
 */

/** Two spaces, the width the rest of this codebase is written at. */
export const INDENT = "  ";

export type TextEdit = {
  /** The range being replaced, in the current value. */
  from: number;
  to: number;
  text: string;
  /** Where the selection lands afterwards, in the new value. */
  caret: number;
  caretEnd?: number;
};

export type KeyContext = {
  key: string;
  shiftKey: boolean;
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

/** Opening character → what closes it. */
const PAIRS: Record<string, string> = { "(": ")", "[": "]", "{": "}", "'": "'", '"': '"', "`": "`" };
const CLOSERS = new Set(Object.values(PAIRS));
/** A quote both opens and closes, so it needs its own check. */
const QUOTES = new Set(["'", '"', "`"]);

const lineStartAt = (value: string, index: number) => value.lastIndexOf("\n", index - 1) + 1;

/** The whitespace a line opens with — what the next line should line up with. */
function indentOf(value: string, index: number): string {
  const start = lineStartAt(value, index);
  return /^[ \t]*/.exec(value.slice(start))![0];
}

/** Tab, and Shift+Tab, over whatever the selection touches. */
function indentEdit(context: KeyContext): TextEdit {
  const { value, selectionStart, selectionEnd, shiftKey } = context;
  const from = lineStartAt(value, selectionStart);
  const block = value.slice(from, selectionEnd);
  const multiline = block.includes("\n");

  // A caret sitting inside one line just moves to the next tab stop; only a
  // selection that spans lines shifts the whole block.
  if (!multiline && selectionStart === selectionEnd && !shiftKey) {
    const column = selectionStart - from;
    const width = INDENT.length - (column % INDENT.length) || INDENT.length;
    const text = " ".repeat(width);
    return { from: selectionStart, to: selectionStart, text, caret: selectionStart + text.length };
  }

  const lines = value.slice(from, selectionEnd).split("\n");
  const shifted = lines.map(line =>
    shiftKey ? line.replace(new RegExp(`^( {1,${INDENT.length}}|\t)`), "") : line.trim() ? INDENT + line : line,
  );
  const text = shifted.join("\n");

  // The first line's own shift tells the caret how far to follow it.
  const firstDelta = shifted[0]!.length - lines[0]!.length;
  return {
    from,
    to: selectionEnd,
    text,
    caret: Math.max(from, selectionStart + firstDelta),
    caretEnd: from + text.length,
  };
}

/** Enter: keep the line's indentation, and open a block out onto its own line. */
function newlineEdit(context: KeyContext): TextEdit {
  const { value, selectionStart, selectionEnd } = context;
  const indent = indentOf(value, selectionStart);
  const before = value[selectionStart - 1];
  const after = value[selectionEnd];

  const opensBlock = before === "{" || before === "[" || before === "(";
  const inner = opensBlock ? indent + INDENT : indent;

  // Between a pair, the closer goes down to a line of its own so the block
  // comes out shaped the way it would have been typed by hand.
  if (opensBlock && after !== undefined && PAIRS[before] === after) {
    const text = `\n${inner}\n${indent}`;
    return { from: selectionStart, to: selectionEnd, text, caret: selectionStart + 1 + inner.length };
  }

  const text = `\n${inner}`;
  return { from: selectionStart, to: selectionEnd, text, caret: selectionStart + text.length };
}

/** An opening character: close it, or wrap what is selected in the pair. */
function openPairEdit(context: KeyContext): TextEdit | null {
  const { key, value, selectionStart, selectionEnd } = context;
  const closer = PAIRS[key]!;

  if (selectionStart !== selectionEnd) {
    const selected = value.slice(selectionStart, selectionEnd);
    return {
      from: selectionStart,
      to: selectionEnd,
      text: `${key}${selected}${closer}`,
      caret: selectionStart + 1,
      caretEnd: selectionStart + 1 + selected.length,
    };
  }

  const after = value[selectionStart];
  // Mid-word, an auto-closed quote is nearly always in the way: `don't` would
  // become `don''t`. Only close where what follows can sit beside a closer.
  if (after !== undefined && /[A-Za-z0-9_$]/.test(after)) return null;
  if (QUOTES.has(key) && /[A-Za-z0-9_$]/.test(value[selectionStart - 1] ?? "")) return null;

  return { from: selectionStart, to: selectionStart, text: key + closer, caret: selectionStart + 1 };
}

/** A closing character typed onto the one already there: step over it. */
function closePairEdit(context: KeyContext): TextEdit | null {
  const { key, value, selectionStart, selectionEnd } = context;
  if (selectionStart !== selectionEnd || value[selectionStart] !== key) return null;
  return { from: selectionStart, to: selectionStart, text: "", caret: selectionStart + 1 };
}

/** Backspace between an empty pair takes both halves. */
function backspaceEdit(context: KeyContext): TextEdit | null {
  const { value, selectionStart, selectionEnd } = context;
  if (selectionStart !== selectionEnd || selectionStart === 0) return null;

  const before = value[selectionStart - 1]!;
  if (PAIRS[before] !== value[selectionStart]) return null;

  return { from: selectionStart - 1, to: selectionStart + 1, text: "", caret: selectionStart - 1 };
}

/**
 * The edit a keystroke asks for, or null to let the browser handle it.
 *
 * Kept as one entry point so the component is a thin shell over rules that can
 * be read and tested on their own.
 */
export function editForKey(context: KeyContext): TextEdit | null {
  const { key } = context;

  if (key === "Tab") return indentEdit(context);
  if (key === "Enter") return newlineEdit(context);
  if (key === "Backspace") return backspaceEdit(context);
  if (key in PAIRS) {
    // A quote is both halves of its own pair: stepping over the closer comes
    // first, or typing the end of a string would nest another empty one.
    if (QUOTES.has(key)) return closePairEdit(context) ?? openPairEdit(context);
    return openPairEdit(context);
  }
  if (CLOSERS.has(key)) return closePairEdit(context);

  return null;
}
