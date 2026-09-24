import { describe, expect, test } from "bun:test";
import {
  datasetName,
  generationStamp,
  MAX_DATASET_NAME_LENGTH,
  UNTITLED_DATASET,
  withoutGenerationStamp,
} from "./datasetName";

const at = new Date("2026-09-18T14:23:05.482Z");

describe("datasetName", () => {
  test("a run is the schema's name and the moment it happened", () => {
    expect(datasetName("Orders", at)).toBe("Orders · 2026-09-18T14:23:05Z");
  });

  test("the stamp is UTC to the second, so two runs sort and compare", () => {
    expect(generationStamp(at)).toBe("2026-09-18T14:23:05Z");
    expect(generationStamp(new Date("2026-09-18T14:23:06Z")) > generationStamp(at)).toBe(true);
  });

  test("a schema with no name still produces one", () => {
    expect(datasetName("   ", at)).toBe(`${UNTITLED_DATASET} · 2026-09-18T14:23:05Z`);
  });

  test("stamping an already-stamped name replaces it rather than stacking", () => {
    const once = datasetName("Orders", at);
    const twice = datasetName(once, new Date("2026-09-19T09:00:00Z"));
    expect(twice).toBe("Orders · 2026-09-19T09:00:00Z");
  });

  test("a long schema name is trimmed to leave the stamp intact", () => {
    const name = datasetName("x".repeat(400), at);
    expect(name.length).toBeLessThanOrEqual(MAX_DATASET_NAME_LENGTH);
    expect(name.endsWith(" · 2026-09-18T14:23:05Z")).toBe(true);
  });

  test("the schema's name comes back out for anywhere the moment is noise", () => {
    expect(withoutGenerationStamp("Orders · 2026-09-18T14:23:05Z")).toBe("Orders");
    // Only this module's own stamp; a name that merely looks dated is left alone.
    expect(withoutGenerationStamp("Q3 2026 orders")).toBe("Q3 2026 orders");
  });
});
