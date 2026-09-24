import { describe, expect, test } from "bun:test";
import { editForKey, INDENT, type TextEdit } from "./codeEdit";

/** Applies an edit the way the editor does, so a test reads as before → after. */
function press(key: string, before: string, options: { shiftKey?: boolean } = {}): string {
  // "|" marks the caret, and a second one the end of a selection.
  const selectionStart = before.indexOf("|");
  const rest = before.replace("|", "");
  const second = rest.indexOf("|");
  const selectionEnd = second === -1 ? selectionStart : second;
  const value = rest.replace("|", "");

  const edit = editForKey({ key, shiftKey: Boolean(options.shiftKey), value, selectionStart, selectionEnd });
  if (!edit) return before;

  const next = value.slice(0, edit.from) + edit.text + value.slice(edit.to);
  return mark(next, edit);
}

/** Puts the caret markers back, so the result says where the cursor landed. */
function mark(value: string, edit: TextEdit): string {
  const end = edit.caretEnd ?? edit.caret;
  return end === edit.caret
    ? `${value.slice(0, edit.caret)}|${value.slice(edit.caret)}`
    : `${value.slice(0, edit.caret)}|${value.slice(edit.caret, end)}|${value.slice(end)}`;
}

describe("Tab", () => {
  test("a caret moves to the next tab stop", () => {
    expect(press("Tab", "|const")).toBe(`${INDENT}|const`);
    // From column 1, only one space is needed to reach the stop.
    expect(press("Tab", "c|onst")).toBe("c |onst");
  });

  test("a selection across lines shifts every line it touches", () => {
    expect(press("Tab", "|a\nb|\nc")).toBe(`${INDENT}|a\n${INDENT}b|\nc`);
  });

  test("Shift+Tab takes one level back off", () => {
    expect(press("Tab", "|    a\n    b|", { shiftKey: true })).toBe("|  a\n  b|");
    // Nothing to remove is not an error; the line simply stays put.
    expect(press("Tab", "|a|", { shiftKey: true })).toBe("|a|");
  });

  test("a blank line inside a block is left alone rather than padded", () => {
    expect(press("Tab", "|a\n\nb|")).toBe(`${INDENT}|a\n\n${INDENT}b|`);
  });
});

describe("Enter", () => {
  test("the new line starts where the last one did", () => {
    expect(press("Enter", "    const a = 1;|")).toBe("    const a = 1;\n    |");
  });

  test("an opened block indents, and its closer drops to its own line", () => {
    expect(press("Enter", "if (x) {|}")).toBe(`if (x) {\n${INDENT}|\n}`);
    // Opened but not closed: just the deeper line.
    expect(press("Enter", "if (x) {|")).toBe(`if (x) {\n${INDENT}|`);
  });
});

describe("brackets and quotes", () => {
  test("an opener closes itself", () => {
    expect(press("(", "call|")).toBe("call(|)");
    expect(press("{", "|")).toBe("{|}");
  });

  test("a selection is wrapped rather than replaced", () => {
    expect(press("'", "const a = |x|;")).toBe("const a = '|x|';");
  });

  test("typing the closer steps over the one already there", () => {
    expect(press(")", "call(|)")).toBe("call()|");
    expect(press("'", "'a|'")).toBe("'a'|");
  });

  test("a quote mid-word is left to the browser, or it would split the word", () => {
    // "don|t" — auto-closing here is how `don''t` happens.
    expect(press("'", "don|t")).toBe("don|t");
  });

  test("backspace between an empty pair takes both halves", () => {
    expect(press("Backspace", "call(|)")).toBe("call|");
    // With something between them, only the browser's own delete applies.
    expect(press("Backspace", "call(a|)")).toBe("call(a|)");
  });
});

test("an ordinary keystroke is the browser's to handle", () => {
  expect(editForKey({ key: "a", shiftKey: false, value: "", selectionStart: 0, selectionEnd: 0 })).toBeNull();
});
