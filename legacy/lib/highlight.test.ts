import { describe, expect, test } from "bun:test";
import { tokenize, type Token, type TokenKind } from "./highlight";
import { DATASET_PLACEHOLDER } from "./scriptTemplate";

/** Every token back as text, which must always be the input again. */
const text = (tokens: Token[]) => tokens.map(token => token.text).join("");

const kinds = (source: string, kind: TokenKind) =>
  tokenize(source)
    .filter(token => token.kind === kind)
    .map(token => token.text);

describe("tokenize", () => {
  test("nothing is lost, whatever the source", () => {
    const source = `const a = "x'y"; // note\n/* block */ 12.5 \`t\` ${DATASET_PLACEHOLDER}`;
    expect(text(tokenize(source))).toBe(source);
    expect(text(tokenize(""))).toBe("");
  });

  test("every known placeholder is its own token", () => {
    expect(kinds(`const rows = ${DATASET_PLACEHOLDER};`, "placeholder")).toEqual([DATASET_PLACEHOLDER]);
    expect(kinds("const n = ${ROW_COUNT}, c = ${CONFIG_NAME};", "placeholder")).toEqual([
      "${ROW_COUNT}",
      "${CONFIG_NAME}",
    ]);
  });

  test("a template literal of the script's own is left as code", () => {
    expect(kinds("`${base}/api`", "placeholder")).toEqual([]);
    expect(text(tokenize("`${base}/api`"))).toBe("`${base}/api`");
  });

  test("keywords and values read differently", () => {
    expect(kinds("const done = true;", "keyword")).toEqual(["const"]);
    expect(kinds("const done = true;", "literal")).toEqual(["true"]);
    // A word that merely contains a keyword is not one.
    expect(kinds("constant.iffy = 1;", "keyword")).toEqual([]);
  });

  test("comments run to the end of the line, and blocks to their close", () => {
    expect(kinds("a // one\nb", "comment")).toEqual(["// one"]);
    expect(kinds("a /* two\nlines */ b", "comment")).toEqual(["/* two\nlines */"]);
    // Unterminated, which is what half a typed comment looks like.
    expect(kinds("a /* open", "comment")).toEqual(["/* open"]);
  });

  test("strings keep their escapes, and a stray quote ends at the line", () => {
    expect(kinds(`"a\\"b" + 'c'`, "string")).toEqual([`"a\\"b"`, `'c'`]);
    expect(kinds("`multi\nline`", "string")).toEqual(["`multi\nline`"]);
    // Otherwise one apostrophe would colour the rest of the script.
    expect(kinds("it's fine\nconst x = 1;", "keyword")).toEqual(["const"]);
  });

  test("numbers cover the forms a script actually carries", () => {
    expect(kinds("1 + 2.5 + 0xff + 1e3", "number")).toEqual(["1", "2.5", "0xff", "1e3"]);
  });
});
