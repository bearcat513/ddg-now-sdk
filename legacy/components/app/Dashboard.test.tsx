import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { Dashboard, type Totals } from "./Dashboard";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import type { Note } from "@/lib/notes";
import type { Dataset, SchemaConfig } from "@/lib/types";
import type { ScriptTemplate } from "@/lib/scriptTemplate";

const me = {
  id: "u1",
  email: "you@example.com",
  name: "You",
  verified: true,
  createdAt: "2026-01-01T00:00:00Z",
  preferences: DEFAULT_PREFERENCES,
};

/** An ISO timestamp `days` ago, at noon, so no rounding lands it in yesterday. */
function daysAgo(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const config = (over: Partial<SchemaConfig> = {}): SchemaConfig => ({
  id: "c1",
  name: "Customers",
  description: "",
  fields: [{ id: "f1", name: "id", type: "uuid", options: {} }],
  mappings: [],
  rowCount: 25,
  ownerId: me.id,
  sharedWith: [],
  createdAt: daysAgo(3),
  updatedAt: daysAgo(3),
  ...over,
});

const dataset = (over: Partial<Dataset> = {}): Dataset => ({
  id: "d1",
  configId: "c1",
  name: "Customers",
  rowCount: 100,
  fieldCount: 3,
  ownerId: me.id,
  createdAt: daysAgo(0),
  ...over,
});

const template = (over: Partial<ScriptTemplate> = {}): ScriptTemplate => ({
  id: "t1",
  name: "Seed script",
  body: "",
  ownerId: me.id,
  sharedWith: [],
  createdAt: daysAgo(5),
  updatedAt: daysAgo(5),
  ...over,
});

function render({
  configs = [] as SchemaConfig[],
  datasets = [] as Dataset[],
  templates = [] as ScriptTemplate[],
  notes = [] as Note[],
  totals = null as Totals | null,
} = {}) {
  return renderToString(
    <Dashboard
      me={me}
      configs={configs}
      datasets={datasets}
      templates={templates}
      notes={notes}
      totals={totals}
      storage="http://localhost:8091"
      onNewConfig={() => {}}
      onLoadConfig={() => {}}
      onLoadDataset={() => {}}
      onNewTemplate={() => {}}
      onLoadTemplate={() => {}}
      onImport={() => {}}
      onOpenSettings={() => {}}
      onClose={() => {}}
    />,
  ).replaceAll("<!-- -->", "");
}

describe("the stat tiles", () => {
  test("count what the server says it holds, not what the sidebar was sent", () => {
    // The dataset list is cut to the history preference, so measuring it would
    // under-report an account with more datasets than the sidebar lists.
    const html = render({
      configs: [config()],
      datasets: [dataset()],
      totals: { configs: 12, datasets: 480, scriptTemplates: 3, notes: 5 },
    });
    expect(html).toContain(">12<");
    expect(html).toContain(">480<");
    expect(html).toContain(">3<");
  });

  test("fall back to the lists when PocketBase could not be counted", () => {
    const html = render({ configs: [config(), config({ id: "c2" })], datasets: [dataset()], totals: null });
    expect(html).toContain("Configurations");
    expect(html).toContain(">2<");
  });

  test("say how much of the account the row total actually covers", () => {
    const html = render({
      configs: [config()],
      datasets: [dataset({ rowCount: 1000 }), dataset({ id: "d2", rowCount: 500 })],
    });
    expect(html).toContain("1,500");
    expect(html).toContain("Across the 2 most recent datasets");
    // And what one run is worth on average, which is what makes the total legible.
    expect(html).toContain("750 a run");
  });

  test("count the fields of every schema, nested ones included", () => {
    const html = render({
      configs: [
        config({
          fields: [
            { id: "f1", name: "id", type: "uuid", options: {} },
            {
              id: "f2",
              name: "address",
              type: "object",
              options: {
                fields: [
                  { id: "f3", name: "city", type: "city", options: {} },
                  { id: "f4", name: "zip", type: "zipCode", options: {} },
                ],
              },
            },
          ],
        }),
      ],
    });
    expect(html).toContain("Fields defined");
    expect(html).toContain(">4<");
    expect(html).toContain("4 generator types in use");
  });

  test("put a week-on-week delta beside the figures that move", () => {
    const html = render({
      configs: [config()],
      // Three runs this week against one in the week before it.
      datasets: [
        dataset(),
        dataset({ id: "d2", createdAt: daysAgo(1) }),
        dataset({ id: "d3", createdAt: daysAgo(2) }),
        dataset({ id: "d4", createdAt: daysAgo(9) }),
      ],
    });
    expect(html).toContain("+2 runs on the week before");
  });

  test("count what is shared in both directions", () => {
    const html = render({
      configs: [config({ sharedWith: ["a@example.com"] }), config({ id: "c2", ownerId: "someone-else" })],
    });
    expect(html).toContain("Sharing");
    expect(html).toContain("1 shared with you · 1 shared out");
  });
});

describe("the schema breakdown", () => {
  test("groups the fields by the generator group they come from", () => {
    const html = render({
      configs: [
        config({
          fields: [
            { id: "f1", name: "first", type: "firstName", options: {} },
            { id: "f2", name: "last", type: "lastName", options: {} },
            { id: "f3", name: "city", type: "city", options: {} },
          ],
        }),
      ],
    });
    expect(html).toContain("What your schemas are made of");
    expect(html).toContain("3 fields across 1 configuration");
    expect(html).toContain("Person");
    expect(html).toContain("Location");
    // Two of three fields are Person generators.
    expect(html).toContain("2 · 67%");
  });

  test("says so rather than drawing an empty breakdown", () => {
    const html = render({ configs: [config({ fields: [] })], datasets: [dataset()] });
    expect(html).toContain("Add fields to a schema and their generators will be counted here.");
  });
});

describe("the script templates panel", () => {
  test("lists the most recently edited templates, newest first", () => {
    const html = render({
      configs: [config()],
      templates: [
        template({ id: "t1", name: "Older seed", updatedAt: daysAgo(4) }),
        template({ id: "t2", name: "Newer seed", body: "a\nb\nc", updatedAt: daysAgo(1) }),
      ],
    });
    expect(html.indexOf("Newer seed")).toBeLessThan(html.indexOf("Older seed"));
    expect(html).toContain("3 lines");
  });

  test("says so rather than showing an empty list", () => {
    const html = render({ configs: [config()] });
    expect(html).toContain("No script templates yet.");
  });
});

describe("the activity strip", () => {
  test("buckets datasets by the day they were generated", () => {
    const html = render({
      configs: [config()],
      datasets: [dataset(), dataset({ id: "d2" }), dataset({ id: "d3", createdAt: daysAgo(2), rowCount: 40 })],
    });
    // Two today and one two days ago — the caption counts the runs and rows.
    expect(html).toContain("3 runs");
    expect(html).toContain("240 rows");
  });

  test("leaves anything older than the window out of it", () => {
    const html = render({ configs: [config()], datasets: [dataset({ createdAt: daysAgo(30) })] });
    expect(html).toContain("Nothing generated in the last 14 days.");
  });

  test("carries the same figures as a table, so the bars are never the only copy", () => {
    const html = render({ configs: [config()], datasets: [dataset()] });
    expect(html).toContain("Datasets generated per day over the last 14 days");
    expect(html).toContain('class="sr-only"');
  });
});

describe("the recents", () => {
  test("put the most recently edited configuration first, and stop at five", () => {
    const configs = Array.from({ length: 7 }, (_, index) =>
      config({ id: `c${index}`, name: `Schema ${index}`, updatedAt: daysAgo(index) }),
    );
    const html = render({ configs });
    expect(html.indexOf("Schema 0")).toBeLessThan(html.indexOf("Schema 1"));
    expect(html).not.toContain("Schema 5");
    expect(html).not.toContain("Schema 6");
  });

  test("mark a configuration that belongs to someone else", () => {
    const html = render({ configs: [config({ ownerId: "someone-else" })] });
    expect(html).toContain("shared");
    expect(html).toContain("1 record shared with you");
  });

  test("count the accounts a configuration of yours is shared with", () => {
    const html = render({ configs: [config({ sharedWith: ["a@example.com", "b@example.com"] })] });
    expect(html).toContain("Shared out 2 times");
  });

  test("say so rather than showing an empty list", () => {
    const html = render({ configs: [config()] });
    expect(html).toContain("Generated data will appear here.");
  });

  test("say what else is worth knowing about a configuration at a glance", () => {
    const html = render({
      configs: [
        config({
          locale: "de_DE",
          seed: "42",
          mappings: [
            { id: "m1", field: "city", fromConfig: "c9", fromField: "city", mode: "random" },
          ],
        }),
      ],
    });
    expect(html).toContain("1 linked");
    expect(html).toContain("de_DE");
    expect(html).toContain("seeded");
  });

  test("name the configuration a dataset was generated from, when it still exists", () => {
    const html = render({ configs: [config()], datasets: [dataset(), dataset({ id: "d2", configId: "gone" })] });
    expect(html).toContain("from Customers");
    expect(html).not.toContain("from gone");
  });
});

describe("a brand-new account", () => {
  test("is shown the three steps instead of a grid of zeroes", () => {
    const html = render();
    expect(html).toContain("three steps to a dataset");
    expect(html).toContain("Paste a structure");
    expect(html).not.toContain("Rows held");
  });

  test("is spared the panels that would only say \"nothing here\" again", () => {
    const html = render();
    expect(html).not.toContain("Generation activity");
    expect(html).not.toContain("Most recently edited configurations");
    // The ways in stay, since they are the point of the page.
    expect(html).toContain("Import a structure");
  });

  test("stops being shown them as soon as anything exists", () => {
    const html = render({ templates: [template()] });
    expect(html).not.toContain("three steps to a dataset");
    expect(html).toContain("Rows held");
    expect(html).toContain("Generation activity");
  });
});
