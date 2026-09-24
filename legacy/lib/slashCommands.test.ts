import { describe, expect, test } from "bun:test";
import { parseMarkdown } from "./markdown";
import {
  activeSlashQuery,
  insertSlashCommand,
  matchSlashCommands,
  SLASH_COMMANDS,
  type SlashCommand,
  type SlashQuery,
} from "./slashCommands";

const command = (name: string): SlashCommand => {
  const found = SLASH_COMMANDS.find(entry => entry.name === name);
  if (!found) throw new Error(`no such command: ${name}`);
  return found;
};

/** Types `/query` at the end of `before`, the way the editor would see it. */
function take(name: string, before: string, after = "", query = "") {
  const value = `${before}/${query}${after}`;
  const caret = before.length + 1 + query.length;
  const active = activeSlashQuery(value, caret);
  if (!active) throw new Error(`no menu open in ${JSON.stringify(value)}`);
  return insertSlashCommand(value, active, caret, command(name));
}

describe("what the menu offers", () => {
  test("every command writes a mark the parser reads back", () => {
    // The list's one rule: nothing on it lands in the preview as literal
    // punctuation, which is what an unsupported mark would do.
    for (const entry of SLASH_COMMANDS) {
      if (entry.action.kind === "reference") continue;
      // Written into a line with words in it: an empty `# ` is a heading of
      // nothing, and the parser is right to leave it as the text it is.
      const blocks = parseMarkdown(take(entry.name, "some words ").value);
      const marked =
        blocks.some(block => block.kind !== "paragraph") ||
        blocks.some(block => block.kind === "paragraph" && block.spans.some(span => span.kind !== "text"));
      expect({ command: entry.name, marked }).toEqual({ command: entry.name, marked: true });
    }
  });

  test("an empty query is the whole list, in the order it is written", () => {
    expect(matchSlashCommands("")).toEqual(SLASH_COMMANDS);
    expect(matchSlashCommands("   ")).toEqual(SLASH_COMMANDS);
  });

  test("matches the label, the name and the keywords", () => {
    expect(matchSlashCommands("head").map(entry => entry.name)).toEqual([
      "heading-1",
      "heading-2",
      "heading-3",
    ]);
    expect(matchSlashCommands("h2").map(entry => entry.name)).toEqual(["heading-2"]);
    expect(matchSlashCommands("blockquote").map(entry => entry.name)).toEqual(["quote"]);

    // "ol" begins the list's keyword and sits inside "bold" — both are
    // offered, and the one begun is offered first.
    expect(matchSlashCommands("ol").map(entry => entry.name)).toEqual(["numbered-list", "bold"]);
  });

  test("a word begun beats a word merely containing", () => {
    // "co" opens "code block" and "code"; it only sits inside "unordered".
    const names = matchSlashCommands("co").map(entry => entry.name);
    expect(names.slice(0, 2)).toEqual(["code-block", "code"]);
  });

  test("a query nothing answers offers nothing", () => {
    expect(matchSlashCommands("italic")).toEqual([]);
  });
});

describe("when the menu opens", () => {
  test("on a slash that opens a word", () => {
    expect(activeSlashQuery("/", 1)).toEqual({ start: 0, query: "" });
    expect(activeSlashQuery("Notes\n/he", 9)).toEqual({ start: 6, query: "he" });
    expect(activeSlashQuery("see /code block", 15)).toEqual({ start: 4, query: "code block" });
  });

  test("never mid-word, which is where the slashes in prose live", () => {
    expect(activeSlashQuery("https://example.com", 19)).toBeNull();
    expect(activeSlashQuery("and/or", 6)).toBeNull();
    expect(activeSlashQuery("120 rows/second", 15)).toBeNull();
  });

  test("closes once the query stops looking like a command name", () => {
    expect(activeSlashQuery("/he*", 4)).toBeNull();
    expect(activeSlashQuery("/heading\nand on", 15)).toBeNull();
    expect(activeSlashQuery(`/${"x".repeat(40)}`, 41)).toBeNull();
  });

  test("not inside a fence, where a slash is just a slash", () => {
    const body = "```\nls /usr";
    expect(activeSlashQuery(body, body.length)).toBeNull();

    // …and opens again once that fence has been closed.
    const closed = "```\nls\n```\n/he";
    expect(activeSlashQuery(closed, closed.length)).toEqual({ start: 11, query: "he" });
  });

  test("the caret behind the slash is not typing it", () => {
    expect(activeSlashQuery("/heading", 0)).toBeNull();
  });
});

describe("taking a command", () => {
  test("a line command marks the line and drops what was typed", () => {
    expect(take("heading-2", "")).toEqual({ value: "## ", caret: 3 });
    expect(take("bullet-list", "", "", "bul")).toEqual({ value: "- ", caret: 2 });
  });

  test("it marks the line the caret is on, keeping the rest of the note", () => {
    expect(take("quote", "# Title\n\n", "\nafter", "quote")).toEqual({
      value: "# Title\n\n> \nafter",
      caret: 11,
    });
  });

  test("a line already written becomes the marked version of itself", () => {
    // The words stay; the caret lands after them, ready to carry on.
    expect(take("bullet-list", "the first point ", "", "bul")).toEqual({
      value: "- the first point ",
      caret: 18,
    });
  });

  test("one mark replaces another rather than stacking on it", () => {
    expect(take("heading-3", "## Section ", "", "h3")).toEqual({ value: "### Section ", caret: 12 });
    expect(take("numbered-list", "- point ", "", "ol")).toEqual({ value: "1. point ", caret: 9 });
  });

  test("a wrap leaves its placeholder selected", () => {
    const edit = take("bold", "very ", " indeed", "bold");
    expect(edit.value).toBe("very **bold text** indeed");
    expect(edit.value.slice(edit.caret, edit.end)).toBe("bold text");
  });

  test("a link is written whole, with the words to say picked out", () => {
    const edit = take("link", "see ", "", "link");
    expect(edit.value).toBe("see [text](https://)");
    expect(edit.value.slice(edit.caret, edit.end)).toBe("text");
  });

  test("a fence gets the lines it needs, either side", () => {
    const edit = take("code-block", "Run this: ", " and read it", "code");
    expect(edit.value).toBe("Run this: \n```\ncode\n```\n and read it");
    expect(edit.value.slice(edit.caret, edit.end)).toBe("code");

    // A fence that already starts its own line gains no blank one.
    expect(take("code-block", "Run this:\n", "", "code").value).toBe("Run this:\n```\ncode\n```");
  });

  test("the fence it writes parses as one block, not as loose text", () => {
    const blocks = parseMarkdown(take("code-block", "Run this: ", " and read it", "code").value);
    expect(blocks.map(block => block.kind)).toEqual(["paragraph", "code", "paragraph"]);
  });

  test("a reference opens the brackets and stops there", () => {
    // The `[[` picker owns everything after this point.
    const edit = take("reference", "Compare ", " with the run", "ref");
    expect(edit.value).toBe("Compare [[ with the run");
    expect(edit.caret).toBe(10);
    expect(edit.end).toBeUndefined();
  });

  test("the caret it reports is the caret the editor can set", () => {
    for (const entry of SLASH_COMMANDS) {
      const edit = take(entry.name, "note ", " end", "q");
      expect(edit.caret).toBeLessThanOrEqual(edit.value.length);
      expect(edit.end ?? edit.caret).toBeLessThanOrEqual(edit.value.length);
    }
  });
});

describe("the two menus together", () => {
  test("a slash inside half-typed brackets is not a command", () => {
    // `[[` is still being typed; the record picker owns the caret.
    const value = "[[orders/";
    const active: SlashQuery | null = activeSlashQuery(value, value.length);
    expect(active).toBeNull();
  });
});
