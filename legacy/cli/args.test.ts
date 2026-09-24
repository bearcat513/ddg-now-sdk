import { describe, expect, test } from "bun:test";
import { assertKnownFlags, boolFlag, numberFlag, parseArgs, stringFlag, UsageError } from "./args";

describe("parseArgs", () => {
  test("a declared boolean does not swallow the word after it", () => {
    // The bug this rule exists for: `--json` taking "list" as its value would
    // leave the command with nothing to do and no sign that anything was wrong.
    const { positionals, flags } = parseArgs(["list", "--json"], { booleans: ["json"] });
    expect(positionals).toEqual(["list"]);
    expect(flags.json).toBe(true);
  });

  test("a value flag takes the next word, or the one after its equals sign", () => {
    expect(parseArgs(["--out", "rows.csv"]).flags.out).toBe("rows.csv");
    expect(parseArgs(["--out=rows.csv"]).flags.out).toBe("rows.csv");
  });

  test("--no-x turns a default-on flag off", () => {
    expect(parseArgs(["--no-save"], { booleans: ["save"] }).flags.save).toBe(false);
  });

  test("short aliases are the long flag under another name", () => {
    expect(parseArgs(["-o", "out.json"], { aliases: { o: "out" } }).flags.out).toBe("out.json");
  });

  test("a lone dash and a negative number are values, not flags", () => {
    expect(parseArgs(["infer", "-"]).positionals).toEqual(["infer", "-"]);
    expect(parseArgs(["--offset", "-5"]).flags.offset).toBe("-5");
  });

  test("everything after -- is a positional, dashes and all", () => {
    expect(parseArgs(["--", "--not-a-flag"]).positionals).toEqual(["--not-a-flag"]);
  });

  test("a value flag with nothing after it is a usage error", () => {
    expect(() => parseArgs(["--out"])).toThrow(UsageError);
    expect(() => parseArgs(["--out", "--json"], { booleans: ["json"] })).toThrow(UsageError);
  });

  test("a boolean given a value is a usage error rather than a silent string", () => {
    expect(() => parseArgs(["--json=yes"], { booleans: ["json"] })).toThrow(UsageError);
  });
});

describe("assertKnownFlags", () => {
  test("a typo is refused, and the nearest real flag is offered", () => {
    expect(() => assertKnownFlags({ fromat: "csv" }, ["format", "out"])).toThrow(/--fromat.*--format/s);
  });

  test("a declared flag passes", () => {
    expect(() => assertKnownFlags({ format: "csv" }, ["format"])).not.toThrow();
  });
});

describe("reading values", () => {
  test("numbers are whole, and nonsense is a usage error", () => {
    expect(numberFlag({ rows: "250" }, "rows")).toBe(250);
    expect(numberFlag({}, "rows")).toBeUndefined();
    expect(() => numberFlag({ rows: "lots" }, "rows")).toThrow(UsageError);
  });

  test("a boolean flag falls back when it was not given", () => {
    expect(boolFlag({}, "save", true)).toBe(true);
    expect(boolFlag({ save: false }, "save", true)).toBe(false);
    expect(boolFlag({ save: "false" }, "save", true)).toBe(false);
  });

  test("a bare boolean where a value belongs is a usage error", () => {
    expect(() => stringFlag({ out: true }, "out")).toThrow(UsageError);
  });
});
