/**
 * A small JavaScript tokenizer, for colouring a script in the editor.
 *
 * It returns tokens rather than markup: the editor renders them as React
 * elements, so a script can never inject anything into the page no matter what
 * it contains. It is deliberately approximate — a regular expression literal
 * reads as division, and nothing here knows what a type is — because its only
 * job is to make a script scannable while it is being written.
 *
 * The placeholder list it colours against is the server's, imported the way
 * `navSearch` imports its types: the editor highlights exactly the tokens the
 * render endpoint will substitute, and there is no second list here to drift.
 */

import { PLACEHOLDERS } from "../../server/lib/scriptTemplate";

export type TokenKind = "plain" | "comment" | "string" | "number" | "keyword" | "literal" | "placeholder";

export type Token = { kind: TokenKind; text: string };

const KEYWORDS = new Set([
  "async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else",
  "export", "extends", "finally", "for", "from", "function", "if", "import", "in", "instanceof", "let", "new",
  "of", "return", "static", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "yield",
]);

/** Values, kept apart from keywords so they can read differently. */
const LITERALS = new Set(["false", "Infinity", "NaN", "null", "true", "undefined"]);

const isIdentifierStart = (char: string) => /[A-Za-z_$]/.test(char);
const isIdentifierPart = (char: string) => /[A-Za-z0-9_$]/.test(char);
const isDigit = (char: string) => char >= "0" && char <= "9";

/** Where a quoted run ends, past any escapes; the end of the source if unclosed. */
function endOfString(source: string, start: number, quote: string): number {
  for (let i = start + 1; i < source.length; i++) {
    const char = source[i]!;
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === quote) return i + 1;
    // Only a template literal may span lines; the other two end at the break,
    // which is what keeps one stray quote from colouring the rest of the file.
    if (char === "\n" && quote !== "`") return i;
  }
  return source.length;
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let plain = "";

  const flush = () => {
    if (plain) tokens.push({ kind: "plain", text: plain });
    plain = "";
  };

  const push = (kind: TokenKind, text: string) => {
    flush();
    tokens.push({ kind, text });
  };

  let i = 0;
  while (i < source.length) {
    const char = source[i]!;
    const next = source[i + 1];

    // Placeholders first: they are what a template is written around, and they
    // are not JavaScript, so nothing else would claim them correctly. Only the
    // known ones — a template literal of one's own stays ordinary code.
    if (char === "$") {
      const token = PLACEHOLDERS.find(entry => source.startsWith(entry.token, i))?.token;
      if (token) {
        push("placeholder", token);
        i += token.length;
        continue;
      }
    }

    if (char === "/" && next === "/") {
      const end = source.indexOf("\n", i);
      push("comment", source.slice(i, end === -1 ? source.length : end));
      i = end === -1 ? source.length : end;
      continue;
    }

    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      push("comment", source.slice(i, end === -1 ? source.length : end + 2));
      i = end === -1 ? source.length : end + 2;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      const end = endOfString(source, i, char);
      push("string", source.slice(i, end));
      i = end;
      continue;
    }

    if (isDigit(char) || (char === "." && next !== undefined && isDigit(next))) {
      let end = i;
      while (end < source.length && /[0-9a-fA-FxXbBoOeE._]/.test(source[end]!)) end++;
      push("number", source.slice(i, end));
      i = end;
      continue;
    }

    if (isIdentifierStart(char)) {
      let end = i;
      while (end < source.length && isIdentifierPart(source[end]!)) end++;
      const word = source.slice(i, end);
      if (KEYWORDS.has(word)) push("keyword", word);
      else if (LITERALS.has(word)) push("literal", word);
      else plain += word;
      i = end;
      continue;
    }

    plain += char;
    i++;
  }

  flush();
  return tokens;
}
