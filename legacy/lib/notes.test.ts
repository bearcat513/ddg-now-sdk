import { describe, expect, test } from "bun:test";
import {
  activeReferenceQuery,
  insertReference,
  noteExcerpt,
  noteFileName,
  noteMarkdown,
  noteReferences,
  openReferenceFields,
  parseReferenceTarget,
  referenceKind,
  referenceStage,
  referenceToken,
} from "./notes";

describe("reference ids", () => {
  test("reads the collection off the prefix the app mints ids with", () => {
    expect(referenceKind("cfg_1a2b3c4d")).toBe("config");
    expect(referenceKind("ds_1a2b3c4d")).toBe("dataset");
    expect(referenceKind("tpl_1a2b3c4d")).toBe("script-template");
    expect(referenceKind("note_1a2b3c4d")).toBe("note");
  });

  test("an id with no prefix it knows points at nothing", () => {
    // Better a chip that says "not found" than one resolved against whichever
    // collection happened to be tried first.
    expect(referenceKind("user_1a2b")).toBeNull();
    expect(referenceKind("nonsense")).toBeNull();
  });

  test("writes a reference the way the parser reads one", () => {
    expect(referenceToken("cfg_1")).toBe("[[cfg_1]]");
    expect(referenceToken("ds_1", "rows")).toBe("[[ds_1#rows]]");
  });

  test("reads the two halves back apart", () => {
    expect(parseReferenceTarget("cfg_1")).toEqual({ id: "cfg_1", field: "" });
    expect(parseReferenceTarget("ds_1#rows.email")).toEqual({ id: "ds_1", field: "rows.email" });
  });

  test("refuses a target whose id or field could not be one", () => {
    expect(parseReferenceTarget("user_1#name")).toBeNull();
    expect(parseReferenceTarget("ds_1#not a field")).toBeNull();
  });
});

describe("what a note references", () => {
  test("finds every reference, once each, in the order they appear", () => {
    const body = "Compare [[cfg_orders]] with [[ds_run1]], then [[cfg_orders]] again.";
    expect(noteReferences(body)).toEqual([
      { id: "cfg_orders", field: "" },
      { id: "ds_run1", field: "" },
    ]);
  });

  test("a record and a field of it are two references, not one", () => {
    // Both are wanted, and they render differently — but the resolver reads
    // the dataset once for the pair.
    expect(noteReferences("[[ds_1]] holds [[ds_1#rows]] · [[ds_1#rows]]")).toEqual([
      { id: "ds_1", field: "" },
      { id: "ds_1", field: "rows" },
    ]);
  });

  test("ignores brackets that are not references", () => {
    expect(noteReferences("[[Not an id]] and [a link](/x) and [[USER_1]]")).toEqual([]);
  });

  test("a body with nothing in it references nothing", () => {
    expect(noteReferences("")).toEqual([]);
  });
});

describe("which half the picker is offering", () => {
  test("records until the brackets hold an id and a hash", () => {
    expect(referenceStage("ord")).toEqual({ stage: "record", query: "ord" });
    expect(referenceStage("cfg_1a2b#ro")).toEqual({
      stage: "field",
      id: "cfg_1a2b",
      kind: "config",
      query: "ro",
    });
  });

  test("a hash after something that is not an id is still a record query", () => {
    // Otherwise typing a name with a # in it would strand the picker on the
    // fields of nothing, with no way back.
    expect(referenceStage("my notes#x")).toMatchObject({ stage: "record" });
  });
});

describe("the [[ picker", () => {
  const caretAfter = (text: string) => text.length;

  test("finds the reference being typed under the caret", () => {
    const value = "Regenerate [[ord";
    expect(activeReferenceQuery(value, caretAfter(value))).toEqual({ start: 11, query: "ord" });
  });

  test("an empty query is still a query — the picker opens on the brackets", () => {
    expect(activeReferenceQuery("Regenerate [[", 13)).toEqual({ start: 11, query: "" });
  });

  test("a finished reference does not reopen the picker behind it", () => {
    expect(activeReferenceQuery("Regenerate [[cfg_1]]", 20)).toBeNull();
  });

  test("takes the nearest unclosed brackets, not the first ones on the line", () => {
    const value = "[[cfg_1]] and [[cu";
    expect(activeReferenceQuery(value, caretAfter(value))).toEqual({ start: 14, query: "cu" });
  });

  test("a newline ends it: a reference is not written across two lines", () => {
    const value = "[[orders\nand more";
    expect(activeReferenceQuery(value, caretAfter(value))).toBeNull();
  });

  test("nothing under the caret is nothing at all", () => {
    expect(activeReferenceQuery("plain prose", 5)).toBeNull();
  });

  test("replaces what was typed with the finished reference, caret after it", () => {
    const value = "Regenerate [[ord tomorrow";
    const active = activeReferenceQuery(value, 16)!;
    expect(insertReference(value, active, 16, "cfg_orders")).toEqual({
      value: "Regenerate [[cfg_orders]] tomorrow",
      caret: 25,
    });
  });

  test("drilling in leaves the caret inside the brackets, picker still open", () => {
    const value = "See [[ord";
    const opened = openReferenceFields(value, activeReferenceQuery(value, 9)!, 9, "ds_9f8e");
    expect(opened).toEqual({ value: "See [[ds_9f8e#]]", caret: 14 });

    // And the picker reads that as "the fields of ds_9f8e".
    expect(referenceStage(activeReferenceQuery(opened.value, opened.caret)!.query)).toMatchObject({
      stage: "field",
      id: "ds_9f8e",
    });
  });

  test("picking the field closes the brackets that were already open", () => {
    const value = "See [[ds_9f8e#]]";
    const active = activeReferenceQuery(value, 14)!;
    // Without consuming them the note would end up with `]]]]`.
    expect(insertReference(value, active, 14, "ds_9f8e", "rows")).toEqual({
      value: "See [[ds_9f8e#rows]]",
      caret: 20,
    });
  });
});

describe("presenting a note", () => {
  test("takes the first line of prose, without its markup", () => {
    expect(noteExcerpt("## Heading\n\n- The seed for [[cfg_1]] is wrong")).toBe("Heading");
    expect(noteExcerpt("\n\n- The **seed** for [[cfg_1]] is wrong")).toBe("The seed for cfg_1 is wrong");
  });

  test("elides a long first line rather than letting it run", () => {
    expect(noteExcerpt("x".repeat(200), 20)).toBe(`${"x".repeat(19)}…`);
  });

  test("an empty note excerpts to nothing, which the caller can test", () => {
    expect(noteExcerpt("")).toBe("");
    expect(noteExcerpt("```\n\n```")).toBe("");
  });

  test("names the download after the note", () => {
    expect(noteFileName("Why the demo seed is wrong")).toBe("why-the-demo-seed-is-wrong.md");
    expect(noteFileName("  ")).toBe("note.md");
  });
});

describe("the note as a file", () => {
  test("the title is the file's top heading, the body is untouched", () => {
    expect(noteMarkdown("Demo prep", "## Seeding\n\n- [[cfg_1]]")).toBe(
      "# Demo prep\n\n## Seeding\n\n- [[cfg_1]]\n",
    );
  });

  test("ends in exactly one newline, whatever the editor left behind", () => {
    expect(noteMarkdown("Demo prep", "One line.\n\n\n")).toBe("# Demo prep\n\nOne line.\n");
    expect(noteMarkdown("Demo prep", "")).toBe("# Demo prep\n");
  });

  test("a note saved before it was named is still a readable file", () => {
    expect(noteMarkdown("  ", "Body.")).toBe("# Untitled note\n\nBody.\n");
  });
});
