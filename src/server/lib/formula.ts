/**
 * A tiny arithmetic expression parser for calculated fields.
 *
 * Runs on both the server (during generation) and in the UI (for live
 * validation), so it is dependency-free and never uses `eval`. Expressions
 * reference other fields of the same record by name:
 *
 *   quantity * unit_price
 *   round((subtotal - discount) * 1.0825, 2)
 *   [line total] / quantity
 */

export type FormulaNode =
  | { kind: "number"; value: number }
  | { kind: "ref"; field: string }
  | { kind: "unary"; op: "-" | "+"; operand: FormulaNode }
  | { kind: "binary"; op: "+" | "-" | "*" | "/" | "%" | "^"; left: FormulaNode; right: FormulaNode }
  | { kind: "call"; name: FunctionName; args: FormulaNode[] };

export type ParseResult = { ok: true; node: FormulaNode; refs: string[] } | { ok: false; error: string };

const FUNCTIONS = {
  round: (args: number[]) => {
    const [value = 0, digits = 0] = args;
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  },
  floor: (args: number[]) => Math.floor(args[0] ?? 0),
  ceil: (args: number[]) => Math.ceil(args[0] ?? 0),
  abs: (args: number[]) => Math.abs(args[0] ?? 0),
  sqrt: (args: number[]) => Math.sqrt(args[0] ?? 0),
  pow: (args: number[]) => (args[0] ?? 0) ** (args[1] ?? 0),
  min: (args: number[]) => Math.min(...args),
  max: (args: number[]) => Math.max(...args),
} satisfies Record<string, (args: number[]) => number>;

export type FunctionName = keyof typeof FUNCTIONS;

export const FUNCTION_NAMES = Object.keys(FUNCTIONS) as FunctionName[];

/* ------------------------------- tokenizer ------------------------------ */

type Token =
  | { type: "number"; value: number }
  | { type: "ident"; value: string }
  | { type: "op"; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i]!;

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      const match = /^\d*\.?\d+/.exec(input.slice(i));
      if (!match) throw new Error(`Unexpected "${char}"`);
      tokens.push({ type: "number", value: Number(match[0]) });
      i += match[0].length;
      continue;
    }

    // [bracketed name] lets field names contain spaces or dashes.
    if (char === "[") {
      const end = input.indexOf("]", i);
      if (end === -1) throw new Error("Unclosed [ in field reference");
      tokens.push({ type: "ident", value: input.slice(i + 1, end).trim() });
      i = end + 1;
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(input.slice(i))!;
      tokens.push({ type: "ident", value: match[0] });
      i += match[0].length;
      continue;
    }

    if ("+-*/%^(),".includes(char)) {
      tokens.push({ type: "op", value: char });
      i++;
      continue;
    }

    throw new Error(`Unexpected character "${char}"`);
  }

  return tokens;
}

/* -------------------------------- parser -------------------------------- */

class Parser {
  private position = 0;
  // Written out rather than declared as a constructor parameter property:
  // parameter properties need a TypeScript *transform*, and every runtime that
  // reads this source directly — Node's type stripping, the test runner —
  // does erasure only. The compiled output is identical.
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private isOp(value: string): boolean {
    const token = this.peek();
    return token?.type === "op" && token.value === value;
  }

  private eat(value: string): boolean {
    if (!this.isOp(value)) return false;
    this.position++;
    return true;
  }

  private expect(value: string): void {
    if (!this.eat(value)) throw new Error(`Expected "${value}"`);
  }

  parse(): FormulaNode {
    const node = this.expression();
    if (this.position < this.tokens.length) {
      const token = this.peek()!;
      throw new Error(`Unexpected ${token.type === "op" ? `"${token.value}"` : String(token.value)}`);
    }
    return node;
  }

  /** additive */
  private expression(): FormulaNode {
    let left = this.term();
    while (this.isOp("+") || this.isOp("-")) {
      const op = (this.peek() as { value: string }).value as "+" | "-";
      this.position++;
      left = { kind: "binary", op, left, right: this.term() };
    }
    return left;
  }

  /** multiplicative */
  private term(): FormulaNode {
    let left = this.power();
    while (this.isOp("*") || this.isOp("/") || this.isOp("%")) {
      const op = (this.peek() as { value: string }).value as "*" | "/" | "%";
      this.position++;
      left = { kind: "binary", op, left, right: this.power() };
    }
    return left;
  }

  /** exponentiation, right associative */
  private power(): FormulaNode {
    const base = this.unary();
    if (this.eat("^")) {
      return { kind: "binary", op: "^", left: base, right: this.power() };
    }
    return base;
  }

  private unary(): FormulaNode {
    if (this.isOp("-") || this.isOp("+")) {
      const op = (this.peek() as { value: string }).value as "-" | "+";
      this.position++;
      return { kind: "unary", op, operand: this.unary() };
    }
    return this.primary();
  }

  private primary(): FormulaNode {
    const token = this.peek();
    if (!token) throw new Error("Unexpected end of expression");

    if (token.type === "number") {
      this.position++;
      return { kind: "number", value: token.value };
    }

    if (token.type === "ident") {
      this.position++;
      // An identifier followed by "(" is a function call, otherwise a field.
      if (this.isOp("(")) {
        const name = token.value as FunctionName;
        if (!FUNCTION_NAMES.includes(name)) {
          throw new Error(`Unknown function "${token.value}" (available: ${FUNCTION_NAMES.join(", ")})`);
        }
        this.expect("(");
        const args: FormulaNode[] = [];
        if (!this.isOp(")")) {
          do {
            args.push(this.expression());
          } while (this.eat(","));
        }
        this.expect(")");
        if (!args.length) throw new Error(`"${name}()" needs at least one argument`);
        return { kind: "call", name, args };
      }
      return { kind: "ref", field: token.value };
    }

    if (this.eat("(")) {
      const node = this.expression();
      this.expect(")");
      return node;
    }

    throw new Error(`Unexpected "${token.value}"`);
  }
}

function collectRefs(node: FormulaNode, into: Set<string>): void {
  switch (node.kind) {
    case "ref":
      into.add(node.field);
      break;
    case "unary":
      collectRefs(node.operand, into);
      break;
    case "binary":
      collectRefs(node.left, into);
      collectRefs(node.right, into);
      break;
    case "call":
      node.args.forEach(arg => collectRefs(arg, into));
      break;
  }
}

/**
 * Parses an expression. When `available` is supplied, every field reference is
 * checked against it so typos surface before any data is generated.
 */
export function parseFormula(expression: string, available?: Iterable<string>): ParseResult {
  const trimmed = expression.trim();
  if (!trimmed) return { ok: false, error: "Enter an expression, e.g. quantity * unit_price" };

  let node: FormulaNode;
  try {
    node = new Parser(tokenize(trimmed)).parse();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid expression" };
  }

  const refs = new Set<string>();
  collectRefs(node, refs);

  if (available) {
    const known = new Set(available);
    const unknown = [...refs].filter(ref => !known.has(ref));
    if (unknown.length) {
      return {
        ok: false,
        error: `Not a numeric field in this record: ${unknown.map(u => `"${u}"`).join(", ")}`,
      };
    }
  }

  return { ok: true, node, refs: [...refs] };
}

/* ------------------------------- evaluation ------------------------------ */

/** Sentinel meaning "this row cannot be computed" (e.g. a non-numeric input). */
const UNCOMPUTABLE = Symbol("uncomputable");

function toNumber(value: unknown): number | typeof UNCOMPUTABLE {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : UNCOMPUTABLE;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return UNCOMPUTABLE;
}

function evaluate(node: FormulaNode, row: Record<string, unknown>): number | typeof UNCOMPUTABLE {
  switch (node.kind) {
    case "number":
      return node.value;

    case "ref":
      return toNumber(row[node.field]);

    case "unary": {
      const operand = evaluate(node.operand, row);
      if (operand === UNCOMPUTABLE) return UNCOMPUTABLE;
      return node.op === "-" ? -operand : operand;
    }

    case "binary": {
      const left = evaluate(node.left, row);
      const right = evaluate(node.right, row);
      if (left === UNCOMPUTABLE || right === UNCOMPUTABLE) return UNCOMPUTABLE;
      switch (node.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return right === 0 ? UNCOMPUTABLE : left / right;
        case "%":
          return right === 0 ? UNCOMPUTABLE : left % right;
        case "^":
          return left ** right;
      }
    }

    case "call": {
      const args: number[] = [];
      for (const arg of node.args) {
        const value = evaluate(arg, row);
        if (value === UNCOMPUTABLE) return UNCOMPUTABLE;
        args.push(value);
      }
      return FUNCTIONS[node.name](args);
    }
  }
}

/**
 * Evaluates a parsed formula against one row. Returns null when the result
 * cannot be represented as a finite number (divide by zero, non-numeric input).
 */
export function evaluateFormula(node: FormulaNode, row: Record<string, unknown>, decimals?: number): number | null {
  const result = evaluate(node, row);
  if (result === UNCOMPUTABLE || !Number.isFinite(result)) return null;
  // Always round: floating point noise (0.1 + 0.2) has no place in fixture data.
  const digits = typeof decimals === "number" && decimals >= 0 ? Math.min(decimals, 10) : 6;
  const factor = 10 ** digits;
  return Math.round(result * factor) / factor;
}

/* ------------------------------ conditions ------------------------------ */

/**
 * A predicate over the fields of one row, used by a field's `when` option:
 *
 *   status == 'cancelled'
 *   plan != 'free' and seats > 10
 *   not (deleted_at is null)
 *   is_active
 *
 * Deliberately a separate grammar from the arithmetic above: comparisons mix
 * strings and numbers, so they cannot share the numeric-only evaluator.
 */

export type CompareOp = "==" | "!=" | "<" | "<=" | ">" | ">=";

export type OperandNode =
  | { kind: "ref"; field: string }
  | { kind: "literal"; value: string | number | boolean | null };

export type ConditionNode =
  | { kind: "compare"; op: CompareOp; left: OperandNode; right: OperandNode }
  | { kind: "nullTest"; operand: OperandNode; negated: boolean }
  | { kind: "logical"; op: "and" | "or"; left: ConditionNode; right: ConditionNode }
  | { kind: "not"; operand: ConditionNode }
  | { kind: "truthy"; operand: OperandNode };

export type ConditionResult =
  | { ok: true; node: ConditionNode; refs: string[] }
  | { ok: false; error: string };

type CondToken =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "ident"; value: string }
  | { type: "op"; value: string };

const KEYWORDS = new Set(["and", "or", "not", "is", "null", "true", "false"]);

function tokenizeCondition(input: string): CondToken[] {
  const tokens: CondToken[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i]!;

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Quoted literals, so values may contain spaces or operator characters.
    if (char === "'" || char === '"') {
      const end = input.indexOf(char, i + 1);
      if (end === -1) throw new Error(`Unclosed ${char} in a text value`);
      tokens.push({ type: "string", value: input.slice(i + 1, end) });
      i = end + 1;
      continue;
    }

    if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(input[i + 1] ?? ""))) {
      const match = /^\d*\.?\d+/.exec(input.slice(i))!;
      tokens.push({ type: "number", value: Number(match[0]) });
      i += match[0].length;
      continue;
    }

    if (char === "[") {
      const end = input.indexOf("]", i);
      if (end === -1) throw new Error("Unclosed [ in field reference");
      tokens.push({ type: "ident", value: input.slice(i + 1, end).trim() });
      i = end + 1;
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(input.slice(i))!;
      tokens.push({ type: "ident", value: match[0] });
      i += match[0].length;
      continue;
    }

    const two = input.slice(i, i + 2);
    if (["==", "!=", "<=", ">=", "&&", "||"].includes(two)) {
      tokens.push({ type: "op", value: two });
      i += 2;
      continue;
    }

    // A lone "=" is the mistake everyone makes; read it as equality.
    if (char === "=") {
      tokens.push({ type: "op", value: "==" });
      i++;
      continue;
    }

    if ("<>()".includes(char)) {
      tokens.push({ type: "op", value: char });
      i++;
      continue;
    }

    throw new Error(`Unexpected character "${char}"`);
  }

  return tokens;
}

class ConditionParser {
  private position = 0;

  private readonly tokens: CondToken[];

  constructor(tokens: CondToken[]) {
    this.tokens = tokens;
  }

  private peek(): CondToken | undefined {
    return this.tokens[this.position];
  }

  private isOp(value: string): boolean {
    const token = this.peek();
    return token?.type === "op" && token.value === value;
  }

  private isWord(word: string): boolean {
    const token = this.peek();
    return token?.type === "ident" && token.value.toLowerCase() === word;
  }

  private eatWord(word: string): boolean {
    if (!this.isWord(word)) return false;
    this.position++;
    return true;
  }

  parse(): ConditionNode {
    const node = this.or();
    if (this.position < this.tokens.length) {
      const token = this.peek()!;
      throw new Error(`Unexpected "${String(token.value)}"`);
    }
    return node;
  }

  private or(): ConditionNode {
    let left = this.and();
    while (this.isWord("or") || this.isOp("||")) {
      this.position++;
      left = { kind: "logical", op: "or", left, right: this.and() };
    }
    return left;
  }

  private and(): ConditionNode {
    let left = this.unary();
    while (this.isWord("and") || this.isOp("&&")) {
      this.position++;
      left = { kind: "logical", op: "and", left, right: this.unary() };
    }
    return left;
  }

  private unary(): ConditionNode {
    if (this.eatWord("not")) return { kind: "not", operand: this.unary() };
    return this.primary();
  }

  private primary(): ConditionNode {
    if (this.isOp("(")) {
      this.position++;
      const node = this.or();
      if (!this.isOp(")")) throw new Error('Expected ")"');
      this.position++;
      return node;
    }
    return this.comparison();
  }

  private comparison(): ConditionNode {
    const left = this.operand();

    // "x is null" / "x is not null"
    if (this.eatWord("is")) {
      const negated = this.eatWord("not");
      if (!this.eatWord("null")) throw new Error('Expected "null" after "is"');
      return { kind: "nullTest", operand: left, negated };
    }

    const token = this.peek();
    if (token?.type === "op" && ["==", "!=", "<", "<=", ">", ">="].includes(token.value)) {
      this.position++;
      return { kind: "compare", op: token.value as CompareOp, left, right: this.operand() };
    }

    // A bare field on its own is a truthiness test, so "is_active" works.
    return { kind: "truthy", operand: left };
  }

  private operand(): OperandNode {
    const token = this.peek();
    if (!token) throw new Error("Unexpected end of condition");
    this.position++;

    if (token.type === "number") return { kind: "literal", value: token.value };
    if (token.type === "string") return { kind: "literal", value: token.value };
    if (token.type === "ident") {
      const lower = token.value.toLowerCase();
      if (lower === "true") return { kind: "literal", value: true };
      if (lower === "false") return { kind: "literal", value: false };
      if (lower === "null") return { kind: "literal", value: null };
      if (KEYWORDS.has(lower)) throw new Error(`Unexpected "${token.value}"`);
      return { kind: "ref", field: token.value };
    }

    throw new Error(`Unexpected "${token.value}"`);
  }
}

function collectConditionRefs(node: ConditionNode, into: Set<string>): void {
  const operand = (op: OperandNode) => {
    if (op.kind === "ref") into.add(op.field);
  };
  switch (node.kind) {
    case "compare":
      operand(node.left);
      operand(node.right);
      break;
    case "nullTest":
    case "truthy":
      operand(node.operand);
      break;
    case "logical":
      collectConditionRefs(node.left, into);
      collectConditionRefs(node.right, into);
      break;
    case "not":
      collectConditionRefs(node.operand, into);
      break;
  }
}

/**
 * Parses a `when` predicate. When `available` is supplied, every field it names
 * is checked against it, so a typo fails before any row is generated.
 */
export function parseCondition(expression: string, available?: Iterable<string>): ConditionResult {
  const trimmed = expression.trim();
  if (!trimmed) return { ok: false, error: "Enter a condition, e.g. status == 'cancelled'" };

  let node: ConditionNode;
  try {
    node = new ConditionParser(tokenizeCondition(trimmed)).parse();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid condition" };
  }

  const refs = new Set<string>();
  collectConditionRefs(node, refs);

  if (available) {
    const known = new Set(available);
    const unknown = [...refs].filter(ref => !known.has(ref));
    if (unknown.length) {
      return { ok: false, error: `Not a field in this record: ${unknown.map(u => `"${u}"`).join(", ")}` };
    }
  }

  return { ok: true, node, refs: [...refs] };
}

function operandValue(node: OperandNode, row: Record<string, unknown>): unknown {
  return node.kind === "literal" ? node.value : row[node.field];
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined;
}

/** Numbers compare numerically; anything else falls back to text. */
function compareValues(op: CompareOp, left: unknown, right: unknown): boolean {
  if (op === "==" || op === "!=") {
    // An explicit null literal on either side is an identity test, not a cast.
    if (isBlank(left) || isBlank(right)) {
      const equal = isBlank(left) && isBlank(right);
      return op === "==" ? equal : !equal;
    }
  }

  const leftNumber = typeof left === "boolean" ? Number(left) : Number(left);
  const rightNumber = typeof right === "boolean" ? Number(right) : Number(right);
  const numeric =
    !isBlank(left) &&
    !isBlank(right) &&
    left !== "" &&
    right !== "" &&
    Number.isFinite(leftNumber) &&
    Number.isFinite(rightNumber);

  if (numeric) {
    switch (op) {
      case "==":
        return leftNumber === rightNumber;
      case "!=":
        return leftNumber !== rightNumber;
      case "<":
        return leftNumber < rightNumber;
      case "<=":
        return leftNumber <= rightNumber;
      case ">":
        return leftNumber > rightNumber;
      case ">=":
        return leftNumber >= rightNumber;
    }
  }

  const leftText = isBlank(left) ? "" : String(left);
  const rightText = isBlank(right) ? "" : String(right);
  switch (op) {
    case "==":
      return leftText === rightText;
    case "!=":
      return leftText !== rightText;
    case "<":
      return leftText < rightText;
    case "<=":
      return leftText <= rightText;
    case ">":
      return leftText > rightText;
    case ">=":
      return leftText >= rightText;
  }
}

export function evaluateCondition(node: ConditionNode, row: Record<string, unknown>): boolean {
  switch (node.kind) {
    case "compare":
      return compareValues(node.op, operandValue(node.left, row), operandValue(node.right, row));
    case "nullTest": {
      const blank = isBlank(operandValue(node.operand, row));
      return node.negated ? !blank : blank;
    }
    case "logical": {
      const left = evaluateCondition(node.left, row);
      if (node.op === "and") return left && evaluateCondition(node.right, row);
      return left || evaluateCondition(node.right, row);
    }
    case "not":
      return !evaluateCondition(node.operand, row);
    case "truthy": {
      const value = operandValue(node.operand, row);
      if (isBlank(value) || value === false || value === 0 || value === "") return false;
      // "false" and "0" arrive as text from CSV-shaped sources; treat them as false.
      return value !== "false" && value !== "0";
    }
  }
}
