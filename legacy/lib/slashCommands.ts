/**
 * The `/` menu: the marks a note can be written with, offered by name.
 *
 * Notes are Markdown in a textarea, and the syntax is the part nobody
 * remembers — which fence opens a code block, whether a quote wants a space
 * after the caret. So the editor takes the other route every Markdown editor
 * takes: type `/`, say what you want, and the mark is written for you.
 *
 * Two rules decide what is on the list:
 *
 * - Only marks src/lib/markdown.ts actually renders. A menu that offers a
 *   table or an italic would be offering to write text that arrives in the
 *   preview as literal pipes and asterisks, which is worse than not offering
 *   it at all. Adding a mark to the parser is what adds it here.
 * - `[[` is on it too. It is this app's own mark rather than Markdown's, and
 *   the `/` menu is where someone who has never met it will look.
 *
 * Everything here is pure — the editor holds the caret, this decides what the
 * text becomes — so the whole of it is unit-testable without a DOM.
 */

/** What taking a command does to the text. */
export type SlashAction =
  /** Marks the caret's line: `## `, `- `, `> `. Replaces the mark it had. */
  | { kind: "line"; prefix: string }
  /**
   * Writes `before`, a placeholder, and `after`, with the placeholder left
   * selected so the first keystroke replaces it.
   *
   * `ownLine` is for marks that cannot share a line with prose — a fence is
   * only a fence when it starts one.
   */
  | { kind: "wrap"; before: string; placeholder: string; after: string; ownLine?: boolean }
  /** Opens `[[` and stands aside: the reference picker takes it from there. */
  | { kind: "reference" };

export type SlashCommand = {
  /** Stable name — the key the editor hangs an icon off. */
  name: string;
  label: string;
  hint: string;
  /** Words the query may match beyond the label: `h2`, `ul`, `blockquote`. */
  keywords: string[];
  /** The mark itself, shown down the right of the row. */
  token: string;
  action: SlashAction;
};

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: "heading-1",
    label: "Heading 1",
    hint: "The note's own title",
    keywords: ["h1", "title", "heading"],
    token: "#",
    action: { kind: "line", prefix: "# " },
  },
  {
    name: "heading-2",
    label: "Heading 2",
    hint: "A section",
    keywords: ["h2", "section", "heading"],
    token: "##",
    action: { kind: "line", prefix: "## " },
  },
  {
    name: "heading-3",
    label: "Heading 3",
    hint: "A subsection",
    keywords: ["h3", "subsection", "heading"],
    token: "###",
    action: { kind: "line", prefix: "### " },
  },
  {
    name: "bullet-list",
    label: "Bulleted list",
    hint: "One point per line",
    keywords: ["ul", "unordered", "bullet", "list", "-"],
    token: "-",
    action: { kind: "line", prefix: "- " },
  },
  {
    name: "numbered-list",
    label: "Numbered list",
    hint: "Steps, in order",
    keywords: ["ol", "ordered", "number", "list", "steps"],
    token: "1.",
    action: { kind: "line", prefix: "1. " },
  },
  {
    name: "quote",
    label: "Quote",
    hint: "Someone else's words",
    keywords: ["blockquote", "citation", ">"],
    token: ">",
    action: { kind: "line", prefix: "> " },
  },
  {
    name: "code-block",
    label: "Code block",
    hint: "A fenced block, kept literal",
    keywords: ["fence", "pre", "snippet", "```"],
    token: "```",
    action: { kind: "wrap", before: "```\n", placeholder: "code", after: "\n```", ownLine: true },
  },
  {
    name: "bold",
    label: "Bold",
    hint: "Emphasis inside a sentence",
    keywords: ["strong", "emphasis", "**"],
    token: "**",
    action: { kind: "wrap", before: "**", placeholder: "bold text", after: "**" },
  },
  {
    name: "code",
    label: "Inline code",
    hint: "A field name, an id, a flag",
    keywords: ["monospace", "backtick", "`"],
    token: "`",
    action: { kind: "wrap", before: "`", placeholder: "code", after: "`" },
  },
  {
    name: "link",
    label: "Link",
    hint: "Out to somewhere else",
    keywords: ["url", "href", "anchor"],
    token: "[](…)",
    action: { kind: "wrap", before: "[", placeholder: "text", after: "](https://)" },
  },
  {
    name: "reference",
    label: "Reference a record",
    hint: "A configuration, dataset, template or note",
    keywords: ["[[", "mention", "link", "config", "dataset", "note"],
    token: "[[]]",
    action: { kind: "reference" },
  },
];

/**
 * The commands a query offers, best first.
 *
 * A match on the front of a word beats one in the middle of it, so `co` leads
 * with "Code block" rather than with whatever merely contains "co" — and an
 * empty query is the whole list, in the order it is written above.
 */
export function matchSlashCommands(query: string): SlashCommand[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return SLASH_COMMANDS;

  const scored: { command: SlashCommand; score: number }[] = [];

  for (const command of SLASH_COMMANDS) {
    const words = [command.label.toLowerCase(), command.name, ...command.keywords];
    if (words.some(word => word.startsWith(needle))) scored.push({ command, score: 0 });
    else if (words.some(word => word.includes(needle))) scored.push({ command, score: 1 });
  }

  return scored.sort((a, b) => a.score - b.score).map(entry => entry.command);
}

/* ------------------------------- the query ------------------------------- */

/**
 * How far back from the caret an open `/` is looked for.
 *
 * What is being typed is a command name; anything longer than the longest of
 * them plus a little is a sentence with a slash somewhere in it.
 */
const MAX_SLASH_QUERY_LENGTH = 24;

/** A half-typed command under the caret: where the `/` is, and what follows. */
export type SlashQuery = { start: number; query: string };

/** Only letters, digits and the spaces inside a label like "code block". */
const SLASH_QUERY = /^[A-Za-z0-9 ]*$/;

/** Lines that open or close a fence, for deciding whether an offset is inside one. */
const FENCE_LINE = /^\s*```/;

/**
 * Whether an offset sits inside a fenced block, where a `/` is just a slash.
 *
 * Counted from the top of the note rather than guessed at: someone pasting a
 * path or a regex into a code block is the likeliest way to meet this menu by
 * accident, and it is the one place a mark would be written into text that is
 * meant to stay literal.
 */
function insideFence(value: string, at: number): boolean {
  let open = false;
  for (const line of value.slice(0, at).split("\n")) {
    if (FENCE_LINE.test(line)) open = !open;
  }
  return open;
}

/**
 * The `/…` being typed at `caret`, if there is one.
 *
 * The slash has to open a word — the start of the note, or after a space or a
 * newline — which is what keeps `https://`, `and/or` and `rows/second` from
 * opening a menu over prose that was going fine without one.
 */
export function activeSlashQuery(value: string, caret: number): SlashQuery | null {
  const from = Math.max(0, caret - MAX_SLASH_QUERY_LENGTH - 1);
  const window = value.slice(from, caret);

  const opened = window.lastIndexOf("/");
  if (opened === -1) return null;

  const query = window.slice(opened + 1);
  if (!SLASH_QUERY.test(query)) return null;

  const start = from + opened;
  const before = start === 0 ? "" : value[start - 1]!;
  if (before && !/\s/.test(before)) return null;

  if (insideFence(value, start)) return null;

  return { start, query };
}

/* -------------------------------- the edit ------------------------------- */

/**
 * The text after a command has been written into it.
 *
 * `end` is where a placeholder finishes, so the editor can leave it selected —
 * `**bold text**` with the words picked out is one keystroke from the words
 * that were meant.
 */
export type SlashEdit = { value: string; caret: number; end?: number };

/** One leading mark of any kind, which a line command replaces rather than stacks. */
const LINE_MARK = /^\s*(?:#{1,6}\s+|[-*]\s+|\d{1,3}[.)]\s+|>\s?)/;

/**
 * Takes a command: the typed `/…` goes, and the mark takes its place.
 *
 * A line command marks the whole line the caret is on, so `- ` typed halfway
 * through a written line turns that line into the bullet it was going to be
 * rewritten as anyway.
 */
export function insertSlashCommand(
  value: string,
  active: SlashQuery,
  caret: number,
  command: SlashCommand,
): SlashEdit {
  const head = value.slice(0, active.start);
  const tail = value.slice(caret);
  const action = command.action;

  if (action.kind === "reference") {
    return { value: `${head}[[${tail}`, caret: active.start + 2 };
  }

  if (action.kind === "line") {
    const text = head + tail;
    const lineStart = head.lastIndexOf("\n") + 1;
    const lineBreak = text.indexOf("\n", lineStart);
    const lineEnd = lineBreak === -1 ? text.length : lineBreak;

    const line = text.slice(lineStart, lineEnd).replace(LINE_MARK, "");
    const marked = action.prefix + line;

    return {
      value: `${text.slice(0, lineStart)}${marked}${text.slice(lineEnd)}`,
      caret: lineStart + marked.length,
    };
  }

  // A fence opens a line and closes one. Where the caret was mid-line, or
  // where prose follows it, the missing newlines are written in — an
  // unterminated fence swallows the rest of the note.
  const lead = action.ownLine && head && !head.endsWith("\n") ? "\n" : "";
  const trail = action.ownLine && tail && !tail.startsWith("\n") ? "\n" : "";

  const opening = lead + action.before;
  const start = head.length + opening.length;

  return {
    value: `${head}${opening}${action.placeholder}${action.after}${trail}${tail}`,
    caret: start,
    end: start + action.placeholder.length,
  };
}
