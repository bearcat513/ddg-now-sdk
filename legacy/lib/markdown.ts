/**
 * The Markdown this app reads: the little an OpenAPI document carries, and
 * the rather more a note does.
 *
 * Descriptions in `src/server/openapi.ts` are written as prose with headings,
 * bullets and `code spans` in them, because that is what Postman and Bruno
 * render. The docs page renders the same document, so it has to read the same
 * marks. Notes (src/lib/notes.ts) are written by hand in the app and want a
 * little more: numbered lists, quotes, fenced code, and `[[cfg_…]]` references
 * to other records.
 *
 * Both readers share one parser, and it returns blocks and spans rather than
 * HTML — every mark reaches the page as a React element, so nothing in a
 * description or a note can put markup into the page however it is written.
 *
 * Anything it does not know stays as text. A document is not a place where an
 * unsupported mark should cost the reader the sentence around it.
 */

export type Span =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "link"; text: string; href: string }
  /**
   * `[[cfg_1a2b3c4d]]`, or `[[ds_9f8e#rows]]` — the id, and the field of it
   * being named. Neither is resolved here: the renderer decides what they
   * point at and what that is worth showing.
   */
  | { kind: "reference"; id: string; field: string };

export type Block =
  | { kind: "heading"; level: number; spans: Span[] }
  | { kind: "paragraph"; spans: Span[] }
  | { kind: "list"; ordered: boolean; items: Span[][] }
  | { kind: "quote"; spans: Span[] }
  /** A fenced block. Never parsed for spans: what is inside it is literal. */
  | { kind: "code"; language: string; text: string };

/**
 * `[[reference]]`, `[[reference#field]]`, `code`, **strong**, [text](href) —
 * in one pass, first match wins.
 *
 * A reference is tried before a link because both open with a bracket. Nothing
 * here matches a single `*` or a lone backtick: a stray mark in a hard-wrapped
 * paragraph is far commoner than an intentional one, and eating the rest of
 * the line over it is the worse failure.
 */
const INLINE =
  /\[\[([a-z0-9_]{3,40})(?:#([A-Za-z0-9_.-]{1,120}))?\]\]|`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function inlineSpans(source: string): Span[] {
  const spans: Span[] = [];
  let last = 0;

  for (const match of source.matchAll(INLINE)) {
    const at = match.index;
    if (at > last) spans.push({ kind: "text", text: source.slice(last, at) });

    if (match[1] !== undefined) spans.push({ kind: "reference", id: match[1], field: match[2] ?? "" });
    else if (match[3] !== undefined) spans.push({ kind: "code", text: match[3] });
    else if (match[4] !== undefined) spans.push({ kind: "strong", text: match[4] });
    else spans.push({ kind: "link", text: match[5]!, href: match[6]! });

    last = at + match[0].length;
  }

  if (last < source.length) spans.push({ kind: "text", text: source.slice(last) });
  return spans;
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^\d{1,3}[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const FENCE = /^```\s*([A-Za-z0-9+#-]*)\s*$/;

/**
 * Blocks, in order.
 *
 * Wrapped lines are joined with a space rather than kept apart: a document's
 * own descriptions are hard-wrapped to fit the source file, and a note is
 * wrapped by the editor it was typed into. A line break in either means
 * nothing to a reader of the rendered page — a blank line does.
 */
export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let quote: string[] = [];
  let items: string[] = [];
  let ordered = false;

  /** Set to the language while inside a fence; null while outside one. */
  let fence: string | null = null;
  let fenced: string[] = [];

  const endParagraph = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", spans: inlineSpans(paragraph.join(" ")) });
    paragraph = [];
  };

  const endList = () => {
    if (items.length) blocks.push({ kind: "list", ordered, items: items.map(inlineSpans) });
    items = [];
  };

  const endQuote = () => {
    if (quote.length) blocks.push({ kind: "quote", spans: inlineSpans(quote.join(" ")) });
    quote = [];
  };

  /** Everything open, closed — before a block that cannot sit inside them. */
  const endAll = () => {
    endParagraph();
    endList();
    endQuote();
  };

  for (const raw of source.split("\n")) {
    const line = raw.trim();

    // Inside a fence every line is content, including blank ones and lines
    // that would otherwise be headings or bullets.
    if (fence !== null) {
      if (FENCE.test(line)) {
        blocks.push({ kind: "code", language: fence, text: fenced.join("\n") });
        fence = null;
        fenced = [];
      } else {
        fenced.push(raw);
      }
      continue;
    }

    const opening = FENCE.exec(line);
    if (opening) {
      endAll();
      fence = opening[1] ?? "";
      continue;
    }

    if (!line) {
      endAll();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      endAll();
      blocks.push({ kind: "heading", level: heading[1]!.length, spans: inlineSpans(heading[2]!) });
      continue;
    }

    const quoted = QUOTE.exec(line);
    if (quoted) {
      endParagraph();
      endList();
      quote.push(quoted[1]!);
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet || numbered) {
      endParagraph();
      endQuote();
      // A list that changes marker is a new list, not a continuation.
      const nowOrdered = Boolean(numbered);
      if (items.length && nowOrdered !== ordered) endList();
      ordered = nowOrdered;
      items.push((bullet ?? numbered)![1]!);
      continue;
    }

    // An indented line under a bullet continues it; the same line under
    // nothing starts a paragraph like any other.
    if (items.length && raw.startsWith(" ")) {
      items[items.length - 1] += ` ${line}`;
      continue;
    }

    endList();
    endQuote();
    paragraph.push(line);
  }

  // A fence nobody closed still holds text somebody wrote.
  if (fence !== null) blocks.push({ kind: "code", language: fence, text: fenced.join("\n") });
  endAll();
  return blocks;
}
