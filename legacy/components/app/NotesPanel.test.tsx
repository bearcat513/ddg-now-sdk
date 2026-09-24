import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { NotesPanel } from "./NotesPanel";
import { STARTER_NOTE_BODY } from "@/lib/notes";
import type { Note } from "@/lib/notes";
import type { Dataset, SchemaConfig } from "@/lib/types";
import type { ScriptTemplate } from "@/lib/scriptTemplate";

/**
 * The panel as it first paints.
 *
 * The `[[` picker itself is keystrokes and a caret, which is what
 * `activeReferenceQuery` and `insertReference` are unit-tested on in
 * src/lib/notes.test.ts — and what neither this renderer nor happy-dom can
 * honestly simulate. What is checked here is the rest: that it mounts, that
 * the preview resolves references out of the lists it was handed before any
 * server has answered, and that the buttons say what they will do.
 */

const config: SchemaConfig = {
  id: "cfg_1a2b",
  name: "Orders",
  description: "",
  fields: [{ id: "f1", name: "email", type: "email" }],
  mappings: [],
  rowCount: 25,
  seed: "",
  locale: "",
  metadata: {},
  ownerId: "user_a",
  sharedWith: [],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const dataset: Dataset = {
  id: "ds_9f8e",
  configId: "cfg_1a2b",
  name: "Orders · 2026-09-01T00:00:00Z",
  rowCount: 500,
  fieldCount: 2,
  ownerId: "user_a",
  createdAt: "2026-09-01T00:00:00.000Z",
};

const templates: ScriptTemplate[] = [];
const notes: Note[] = [];

function render(body: string, { activeId = null as string | null } = {}) {
  return renderToString(
    <NotesPanel
      title="Demo prep"
      body={body}
      activeId={activeId}
      busy={false}
      onTitleChange={() => {}}
      onBodyChange={() => {}}
      onSave={() => {}}
      onNew={() => {}}
      onExportMarkdown={() => {}}
      configs={[config]}
      templates={templates}
      datasets={[dataset]}
      notes={notes}
      onOpenReference={() => {}}
    />,
  ).replaceAll("<!-- -->", "");
}

describe("the notes panel", () => {
  test("names an unsaved note's button differently from a saved one's", () => {
    expect(render("")).toContain("Save note");
    expect(render("", { activeId: "note_1" })).toContain(">Save<");
  });

  test("previews the note, resolving references from the lists it already has", () => {
    // No server has answered yet, so this is the local fallback doing the work
    // — which is what keeps a just-inserted reference from reading as an id.
    const html = render("Regenerate [[cfg_1a2b]] and check [[ds_9f8e]].");
    // Both chips carry the record's name, and what it is on hover. The raw
    // `[[…]]` is still in the textarea above, which is the point of a preview.
    expect(html).toContain('title="Configuration · 1 field · cfg_1a2b"');
    expect(html).toContain('title="Dataset · 500 rows · ds_9f8e"');
    expect(html).toContain(">Orders<");
  });

  test("a field reference waits for the server rather than guessing at a value", () => {
    // The lists this panel holds can name a record; only the server holds what
    // is inside one, so the chip stays pending until it answers.
    const html = render("Check [[ds_9f8e#rows]].");
    expect(html).toContain("animate-pulse");
    expect(html).not.toContain("<table");
  });

  test("counts the references, and says how to make one when there are none", () => {
    expect(render("Regenerate [[cfg_1a2b]] and [[ds_9f8e]].")).toContain("2 references");
    expect(render("Nothing linked here.")).toContain("Type / for a mark, [[ to reference a record");
  });

  test("offers the note as either file, and says which is which", () => {
    // The PDF is the browser's own print run — src/components/app/NotePrint.tsx
    // — so what this can check is that both ways out are on screen, named, and
    // reachable by anyone driving the app with a screen reader.
    const html = render("");
    expect(html).toContain('aria-label="Save as Markdown"');
    expect(html).toContain('aria-label="Save as PDF"');
    expect(html).toContain("the text exactly as it was written");

    // The sheet is mounted only while a print run is up.
    expect(html).not.toContain("note-print");
  });

  test("offers both menus from the toolbar, for hands that have met neither", () => {
    // The menus themselves are a caret and keystrokes — unit-tested in
    // src/lib/slashCommands.test.ts — so what is checked here is that the way
    // in is on screen, and says what it opens.
    const html = render("");
    expect(html).toContain("Headings, lists, code — or just type /");
    expect(html).toContain("Reference a record — or just type [[");
  });

  test("the starter note explains the one thing that cannot be guessed", () => {
    expect(render(STARTER_NOTE_BODY)).toContain("What this is for");
  });
});
