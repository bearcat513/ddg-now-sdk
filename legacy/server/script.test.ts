import { describe, expect, test } from "bun:test";
import { generateRows, resolveChoiceScripts } from "./generate";
import { makeField } from "./infer";
import { runChoiceScript } from "./script";

const scriptField = (name: string, script: string) =>
  makeField(name, "enum", { options: { valuesFrom: "script" as const, script } });

describe("runChoiceScript", () => {
  test("returns the array a snippet produces", async () => {
    const result = await runChoiceScript(`return ["active", "archived"];`);
    expect(result).toMatchObject({ ok: true, values: ["active", "archived"], returned: 2, truncated: false });
  });

  test("awaits a fetch and reshapes the response", async () => {
    using server = Bun.serve({
      port: 0,
      fetch: () => Response.json([{ name: "alpha" }, { name: "beta" }]),
    });

    const result = await runChoiceScript(
      `const r = await fetch("${server.url}"); return (await r.json()).map(x => x.name);`,
    );
    expect(result).toMatchObject({ ok: true, values: ["alpha", "beta"] });
  });

  test("stringifies numbers and drops blanks and duplicates", async () => {
    const result = await runChoiceScript(`return [1, 2, 2, "", "two", "two"];`);
    expect(result).toMatchObject({ ok: true, values: ["1", "2", "two"], returned: 6 });
  });

  test("unwraps a common { data: [...] } envelope", async () => {
    const result = await runChoiceScript(`return { data: ["a", "b"] };`);
    expect(result).toMatchObject({ ok: true, values: ["a", "b"] });
  });

  test("caps the pool and flags the truncation", async () => {
    const result = await runChoiceScript(`return Array.from({ length: 50 }, (_, i) => i);`, { maxValues: 10 });
    expect(result).toMatchObject({ ok: true, truncated: true, returned: 50 });
    expect(result.ok && result.values).toHaveLength(10);
  });

  test("captures console output", async () => {
    const result = await runChoiceScript(`console.log("fetched", 3); return ["a"];`);
    expect(result.logs).toEqual(["fetched 3"]);
  });

  test.each([
    ["an empty script", ``, /empty/i],
    ["a syntax error", `return [;`, /unexpected|expected/i],
    ["a thrown error", `throw new Error("upstream is down");`, /upstream is down/],
    ["a non-array return", `return "active";`, /must return an array/i],
    ["no return at all", `const x = 1;`, /must return an array/i],
    ["an empty array", `return [];`, /no usable choices/i],
    ["objects instead of strings", `return [{ name: "a" }];`, /map it to a string/i],
  ])("rejects %s", async (_label, source, pattern) => {
    const result = await runChoiceScript(source);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(pattern);
  });

  test("stops a runaway loop at the timeout", async () => {
    const result = await runChoiceScript(`while (true) {}`, { timeoutMs: 200 });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/timed out/i);
  });

  test("times out a snippet that never settles", async () => {
    const result = await runChoiceScript(`await new Promise(() => {}); return ["a"];`, { timeoutMs: 200 });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/timed out/i);
  });

  test("hides globals the sandbox does not expose", async () => {
    const result = await runChoiceScript(`return [typeof process, typeof require, typeof Bun];`);
    expect(result).toMatchObject({ ok: true, values: ["undefined"] });
  });

  test("exposes environment variables through `env`", async () => {
    process.env.DDG_SCRIPT_TEST_TOKEN = "s3cret";
    const result = await runChoiceScript(`return [env.DDG_SCRIPT_TEST_TOKEN];`);
    delete process.env.DDG_SCRIPT_TEST_TOKEN;
    expect(result).toMatchObject({ ok: true, values: ["s3cret"] });
  });
});

describe("resolveChoiceScripts", () => {
  test("folds script results into options.values", async () => {
    const fields = await resolveChoiceScripts([scriptField("status", `return ["open", "closed"];`)]);
    expect(fields[0]?.options?.values).toEqual(["open", "closed"]);
  });

  test("leaves schemas without scripts untouched", async () => {
    const fields = [makeField("s", "enum", { options: { values: ["a"] } })];
    expect(await resolveChoiceScripts(fields)).toBe(fields);
  });

  test("runs an identical script once and shares the result", async () => {
    let calls = 0;
    using server = Bun.serve({
      port: 0,
      fetch: () => {
        calls++;
        return Response.json(["x", "y"]);
      },
    });

    const script = `const r = await fetch("${server.url}"); return r.json();`;
    const fields = await resolveChoiceScripts([scriptField("a", script), scriptField("b", script)]);

    expect(calls).toBe(1);
    expect(fields[0]?.options?.values).toEqual(["x", "y"]);
    expect(fields[1]?.options?.values).toEqual(["x", "y"]);
  });

  test("names the offending field when a script fails", async () => {
    await expect(resolveChoiceScripts([scriptField("status", `throw new Error("nope");`)])).rejects.toThrow(
      /Enum field "status": nope/,
    );
  });

  test("generated rows draw only from the fetched choices", async () => {
    const fields = await resolveChoiceScripts([scriptField("status", `return ["open", "closed"];`)]);
    const rows = generateRows({ fields, rowCount: 25, seed: "s" });
    expect(new Set(rows.map(r => r.status))).toEqual(new Set(["open", "closed"]));
  });

  test("generateRows refuses a script enum that was never resolved", () => {
    const fields = [scriptField("status", `return ["open"];`)];
    expect(() => generateRows({ fields, rowCount: 1, seed: "s" })).toThrow(/resolveChoiceScripts/);
  });
});
