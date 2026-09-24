import { describe, expect, test } from "bun:test";
import { evaluateFormula, parseFormula } from "./formula";

function run(expression: string, row: Record<string, unknown> = {}, decimals?: number) {
  const parsed = parseFormula(expression);
  if (!parsed.ok) throw new Error(parsed.error);
  return evaluateFormula(parsed.node, row, decimals);
}

describe("parseFormula", () => {
  test("respects operator precedence and parentheses", () => {
    expect(run("2 + 3 * 4")).toBe(14);
    expect(run("(2 + 3) * 4")).toBe(20);
    expect(run("10 - 4 - 3")).toBe(3); // left associative
    expect(run("2 ^ 3 ^ 2")).toBe(512); // right associative
    expect(run("-3 + 10")).toBe(7);
    expect(run("10 % 3")).toBe(1);
  });

  test("resolves field references, including dot paths and bracketed names", () => {
    expect(run("quantity * unit_price", { quantity: 3, unit_price: 2.5 })).toBe(7.5);
    expect(run("order.total / 2", { "order.total": 9 })).toBe(4.5);
    expect(run("[line total] + 1", { "line total": 4 })).toBe(5);
  });

  test("supports math helpers", () => {
    expect(run("round(2.345, 2)")).toBe(2.35);
    expect(run("floor(2.9) + ceil(0.1)")).toBe(3);
    expect(run("abs(0 - 5)")).toBe(5);
    expect(run("min(3, 1, 2) + max(3, 1, 2)")).toBe(4);
    expect(run("pow(2, 10)")).toBe(1024);
    expect(run("sqrt(81)")).toBe(9);
  });

  test("validates references against the known field list", () => {
    const ok = parseFormula("a * b", ["a", "b"]);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.refs.sort()).toEqual(["a", "b"]);

    const bad = parseFormula("a * typo", ["a"]);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toContain("typo");
  });

  test("rejects malformed input instead of throwing", () => {
    for (const expression of ["", "1 +", "* 2", "(1 + 2", "1 ~ 2", "nope(1)", "round()"]) {
      expect(parseFormula(expression).ok).toBe(false);
    }
  });

  test("never evaluates arbitrary code", () => {
    expect(parseFormula("process.exit(1)").ok).toBe(false);
    expect(parseFormula("(() => 1)()").ok).toBe(false);
  });
});

describe("evaluateFormula", () => {
  test("treats nulls as zero and coerces booleans and numeric strings", () => {
    expect(run("a + 5", { a: null })).toBe(5);
    expect(run("a + 5", {})).toBe(5);
    expect(run("is_premium * 10", { is_premium: true })).toBe(10);
    expect(run("is_premium * 10", { is_premium: false })).toBe(0);
    expect(run("a * 2", { a: "21" })).toBe(42);
  });

  test("returns null rather than a wrong number", () => {
    expect(run("a / 0", { a: 1 })).toBeNull();
    expect(run("a * 2", { a: "not a number" })).toBeNull();
    expect(run("a * 2", { a: "$12.50" })).toBeNull(); // prefixed values are strings
  });

  test("rounds away floating point noise", () => {
    expect(run("0.1 + 0.2")).toBe(0.3);
    expect(run("10 / 3", {}, 2)).toBe(3.33);
  });
});
