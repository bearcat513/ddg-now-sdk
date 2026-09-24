import { describe, expect, test } from "bun:test";
import { evaluateCondition, parseCondition } from "./formula";

function holds(expression: string, row: Record<string, unknown> = {}): boolean {
  const parsed = parseCondition(expression);
  if (!parsed.ok) throw new Error(parsed.error);
  return evaluateCondition(parsed.node, row);
}

describe("parseCondition", () => {
  test("compares a field with a quoted value", () => {
    expect(holds("status == 'cancelled'", { status: "cancelled" })).toBe(true);
    expect(holds("status == 'cancelled'", { status: "active" })).toBe(false);
    expect(holds('status != "active"', { status: "cancelled" })).toBe(true);
  });

  test("compares numbers numerically, not as text", () => {
    // "9" > "10" as text, so a string compare would get this wrong.
    expect(holds("seats > 9", { seats: 10 })).toBe(true);
    expect(holds("seats >= 10", { seats: 10 })).toBe(true);
    expect(holds("seats < 10", { seats: 10 })).toBe(false);
    expect(holds("seats > 9", { seats: "10" })).toBe(true);
  });

  test("joins clauses with and / or / not, honouring precedence", () => {
    const row = { plan: "pro", seats: 12 };
    expect(holds("plan == 'pro' and seats > 10", row)).toBe(true);
    expect(holds("plan == 'free' and seats > 10", row)).toBe(false);
    expect(holds("plan == 'free' or seats > 10", row)).toBe(true);
    expect(holds("not plan == 'free'", row)).toBe(true);
    // "and" binds tighter than "or".
    expect(holds("plan == 'free' and seats > 100 or seats == 12", row)).toBe(true);
    expect(holds("plan == 'free' and (seats > 100 or seats == 12)", row)).toBe(false);
  });

  test("tests for null explicitly", () => {
    expect(holds("deleted_at is null", { deleted_at: null })).toBe(true);
    expect(holds("deleted_at is not null", { deleted_at: null })).toBe(false);
    expect(holds("deleted_at is not null", { deleted_at: "2024-01-01" })).toBe(true);
    // A missing key reads the same as an explicit null.
    expect(holds("deleted_at is null", {})).toBe(true);
  });

  test("a bare field is a truthiness test", () => {
    expect(holds("is_active", { is_active: true })).toBe(true);
    expect(holds("is_active", { is_active: false })).toBe(false);
    expect(holds("is_active", { is_active: 0 })).toBe(false);
    expect(holds("is_active", { is_active: "" })).toBe(false);
    // Text that arrived from a CSV-shaped source still reads as false.
    expect(holds("is_active", { is_active: "false" })).toBe(false);
    expect(holds("is_active", { is_active: "yes" })).toBe(true);
  });

  test("reads a lone = as equality rather than failing", () => {
    expect(holds("status = 'active'", { status: "active" })).toBe(true);
  });

  test("handles dot paths and bracketed names", () => {
    expect(holds("customer.email is not null", { "customer.email": "a@b.com" })).toBe(true);
    expect(holds("[order total] > 5", { "order total": 9 })).toBe(true);
  });

  test("reports the fields a condition depends on", () => {
    const parsed = parseCondition("plan == 'pro' and seats > 10");
    expect(parsed.ok && parsed.refs.sort()).toEqual(["plan", "seats"]);
  });

  test("rejects an unknown field when the available list is given", () => {
    const parsed = parseCondition("statuz == 'active'", ["status"]);
    expect(parsed.ok).toBe(false);
    expect(parsed.ok === false && parsed.error).toContain("statuz");
  });

  test("rejects malformed input rather than guessing", () => {
    for (const bad of ["", "status ==", "status == 'unclosed", "(status == 'a'", "and status"]) {
      expect(parseCondition(bad).ok).toBe(false);
    }
  });

  test("null comparisons are identity, not a cast to zero", () => {
    // Number(null) is 0, so a naive numeric compare would call this equal.
    expect(holds("count == 0", { count: null })).toBe(false);
    expect(holds("count == null", { count: null })).toBe(true);
  });
});
