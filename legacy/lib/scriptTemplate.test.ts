import { describe, expect, test } from "bun:test";
import {
  countPlaceholders,
  DATASET_PLACEHOLDER,
  PLACEHOLDERS,
  renderScriptTemplate,
  scriptFileName,
  scriptTemplateValues,
  STARTER_TEMPLATE_BODY,
  usedPlaceholders,
  type ScriptTemplateContext,
} from "./scriptTemplate";

const dataset = '[\n  { "id": 1 }\n]';

/** Just the rows, which is what most of these are about. */
const rows = { [DATASET_PLACEHOLDER]: dataset };

const context: ScriptTemplateContext = {
  dataset: {
    id: "ds_1",
    name: "Orders · 2026-09-18T14:23:05Z",
    rowCount: 500,
    fieldCount: 3,
    createdAt: "2026-09-18T14:23:05.482Z",
  },
  config: {
    id: "cfg_1",
    name: "Orders",
    seed: "steady",
    locale: "de",
    fields: [{ id: "f1", name: "total", type: "price" }],
  },
  datasetJson: dataset,
  columns: ["id", "customer.email"],
};

describe("renderScriptTemplate", () => {
  test("substitutes the dataset at the placeholder", () => {
    expect(renderScriptTemplate(`const rows = ${DATASET_PLACEHOLDER};`, rows)).toBe(`const rows = ${dataset};`);
  });

  test("substitutes every occurrence", () => {
    const body = `a(${DATASET_PLACEHOLDER}); b(${DATASET_PLACEHOLDER});`;
    expect(renderScriptTemplate(body, { [DATASET_PLACEHOLDER]: "X" })).toBe("a(X); b(X);");
  });

  test("returns the body untouched when there is no placeholder", () => {
    expect(renderScriptTemplate("const rows = [];", rows)).toBe("const rows = [];");
  });

  test("treats $ sequences in the data as literal text", () => {
    // String.replace would expand these into replacement patterns.
    for (const hostile of ["$&", "$'", "$`", "$$", "$1"]) {
      expect(renderScriptTemplate(DATASET_PLACEHOLDER, { [DATASET_PLACEHOLDER]: hostile })).toBe(hostile);
    }
  });

  test("does not substitute a near-miss placeholder", () => {
    expect(renderScriptTemplate("${generated_dataset} ${GENERATED-DATASET}", rows)).toBe(
      "${generated_dataset} ${GENERATED-DATASET}",
    );
  });

  test("a template literal in the script survives", () => {
    const body = "const url = `${base}/api/${id}`;";
    expect(renderScriptTemplate(body, scriptTemplateValues(context))).toBe(body);
  });

  test("handles an empty body and an empty dataset", () => {
    expect(renderScriptTemplate("", rows)).toBe("");
    expect(renderScriptTemplate(DATASET_PLACEHOLDER, { [DATASET_PLACEHOLDER]: "" })).toBe("");
  });

  test("one pass, so data that looks like a placeholder is not substituted into", () => {
    // A generated row can hold any text at all, this included.
    const values = { ...scriptTemplateValues(context), [DATASET_PLACEHOLDER]: '[{ "note": "${ROW_COUNT}" }]' };
    expect(renderScriptTemplate(DATASET_PLACEHOLDER, values)).toBe('[{ "note": "${ROW_COUNT}" }]');
  });
});

describe("scriptTemplateValues", () => {
  const values = scriptTemplateValues(context);

  test("every placeholder has a value, and every value is a JavaScript literal", () => {
    for (const entry of PLACEHOLDERS) {
      expect(values[entry.token]).toBeString();
      // A literal, not bare text: this is what parses back out again.
      expect(() => JSON.parse(values[entry.token]!)).not.toThrow();
    }
  });

  test("the run describes itself", () => {
    expect(values["${DATASET_NAME}"]).toBe('"Orders · 2026-09-18T14:23:05Z"');
    expect(values["${ROW_COUNT}"]).toBe("500");
    expect(values["${FIELD_COUNT}"]).toBe("3");
    expect(values["${COLUMN_NAMES}"]).toBe('["id","customer.email"]');
    expect(values["${GENERATED_AT}"]).toBe('"2026-09-18T14:23:05.482Z"');
  });

  test("the configuration comes through, without the browser's field ids", () => {
    expect(values["${CONFIG_NAME}"]).toBe('"Orders"');
    expect(values["${CONFIG_SEED}"]).toBe('"steady"');
    expect(values["${CONFIG_LOCALE}"]).toBe('"de"');
    expect(JSON.parse(values["${CONFIG_FIELDS}"]!)).toEqual([{ name: "total", type: "price" }]);
  });

  test("an inline schema leaves the configuration as null, which is still a literal", () => {
    const orphan = scriptTemplateValues({ ...context, config: null });
    expect(orphan["${CONFIG_NAME}"]).toBe("null");
    expect(orphan["${CONFIG_FIELDS}"]).toBe("null");
    // The rows are unaffected — that half of a template still renders.
    expect(orphan[DATASET_PLACEHOLDER]).toBe(dataset);
  });

  test("a name that would break a string it lands in is escaped by the literal rule", () => {
    const awkward = scriptTemplateValues({
      ...context,
      dataset: { ...context.dataset, name: 'He said "stop"' },
    });
    expect(awkward["${DATASET_NAME}"]).toBe('"He said \\"stop\\""');
    expect(JSON.parse(awkward["${DATASET_NAME}"]!)).toBe('He said "stop"');
  });
});

describe("countPlaceholders and usedPlaceholders", () => {
  test("counts occurrences of the rows placeholder", () => {
    expect(countPlaceholders("none here")).toBe(0);
    expect(countPlaceholders(DATASET_PLACEHOLDER)).toBe(1);
    expect(countPlaceholders(`${DATASET_PLACEHOLDER}${DATASET_PLACEHOLDER}`)).toBe(2);
  });

  test("reports which placeholders a template carries", () => {
    expect(usedPlaceholders("nothing at all")).toEqual([]);
    expect(usedPlaceholders(`${DATASET_PLACEHOLDER} \${CONFIG_NAME}`).map(entry => entry.name)).toEqual([
      "GENERATED_DATASET",
      "CONFIG_NAME",
    ]);
  });

  test("the starter body carries the rows once, and shows a few of the rest", () => {
    expect(countPlaceholders(STARTER_TEMPLATE_BODY)).toBe(1);
    expect(usedPlaceholders(STARTER_TEMPLATE_BODY).length).toBeGreaterThan(1);
  });

  test("every listed placeholder is spelled the same way in its token", () => {
    for (const entry of PLACEHOLDERS) expect(entry.token).toBe(`\${${entry.name}}`);
  });
});

describe("scriptFileName", () => {
  test("slugifies the template name", () => {
    expect(scriptFileName("Seed incidents")).toBe("seed-incidents.js");
    expect(scriptFileName("  Load: users/roles!  ")).toBe("load-users-roles.js");
  });

  test("falls back when the name has nothing usable", () => {
    expect(scriptFileName("   ")).toBe("script.js");
    expect(scriptFileName("!!!")).toBe("script.js");
  });
});
