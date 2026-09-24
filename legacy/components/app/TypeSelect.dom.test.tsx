import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Registered before React is imported, so the hook renders against a document
// — unless another .dom test in this process got there first, since registering
// twice throws and `bun test` runs them all together.
if (typeof document === "undefined") GlobalRegistrator.register();

// React refuses to batch updates from `act` without this.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useTypeSearch } from "./TypeSelect";
import type { FieldType } from "@/lib/types";

/**
 * The picker's state, across real React renders.
 *
 * It drives the hook rather than the markup: the popover's portal does not
 * mount outside a browser, and React's synthetic events do not fire under this
 * DOM, so a simulated keystroke would prove nothing. What is left is what
 * matters — this picker's one real bug was a memo whose identity changed on
 * every render, which made an effect clear the search box after each
 * keystroke, and a test that re-renders is what catches that.
 *
 * The harness passes `exclude` as a fresh literal every render, exactly as the
 * schema editor does, because that was the trigger.
 */

let root: Root | null = null;
let host: HTMLElement | null = null;
let picker: ReturnType<typeof useTypeSearch>;

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

function Harness({ value, exclude }: { value: FieldType; exclude?: FieldType[] }) {
  // A literal, re-created on every render — the shape that caused the bug.
  picker = useTypeSearch(value, exclude ?? []);
  return (
    <ul>
      {picker.grouped.map(({ group, types }) => (
        <li key={group} data-group={group}>
          {types.map(meta => (
            <span key={meta.type} data-option={meta.type}>
              {meta.label}
            </span>
          ))}
        </li>
      ))}
    </ul>
  );
}

function mount(value: FieldType = "fullName", exclude?: FieldType[]) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root!.render(<Harness value={value} exclude={exclude} />));
}

/** What the list is actually showing, read back out of the DOM. */
const options = () => [...document.querySelectorAll<HTMLElement>("[data-option]")].map(el => el.dataset.option!);
const groups = () => [...document.querySelectorAll<HTMLElement>("[data-group]")].map(el => el.dataset.group!);

const open = () => act(() => picker.changeOpen(true));
const close = () => act(() => picker.changeOpen(false));

/** One character at a time, so every keystroke gets its own render. */
function type(text: string) {
  for (const character of text) {
    act(() => picker.search(picker.query + character));
  }
}

describe("the type picker's search", () => {
  test("opens clean, on the full list", () => {
    mount();
    open();
    expect(picker.query).toBe("");
    expect(options().length).toBeGreaterThan(150);
  });

  test("keeps what is typed, and narrows the list to it", () => {
    mount();
    open();
    type("latency");

    // The regression: this came back "" after every keystroke, and the list
    // never narrowed, because an effect re-ran on each render.
    expect(picker.query).toBe("latency");
    expect(options()).toEqual(["latencyMs"]);
  });

  test("holds up over a long run of keystrokes", () => {
    mount();
    open();
    type("stack");
    expect(picker.query).toBe("stack");
    expect(options()).toEqual(["stackTrace"]);
  });

  test("each word narrows further, in any order", () => {
    mount();
    open();
    type("date");
    const afterOne = options().length;
    expect(afterOne).toBeGreaterThan(1);
    type(" sequential");
    expect(options()).toEqual(["sequentialDate"]);
  });

  test("finds a type by its group", () => {
    mount();
    open();
    type("observability");
    expect(options()).toContain("traceId");
    expect(groups()).toEqual(["Observability"]);
  });

  test("finds a type by the name config files use", () => {
    mount();
    open();
    type("httpStatus");
    expect(options()).toEqual(["httpStatus"]);
  });

  test("a query nothing matches empties the list rather than ignoring it", () => {
    mount();
    open();
    type("zzzznope");
    expect(options()).toEqual([]);
    expect(groups()).toEqual([]);
  });

  test("the highlight returns to the top when the list changes under it", () => {
    mount();
    open();
    // Opening lands on the type already chosen, so this starts partway down.
    const start = picker.activeIndex;
    act(() => picker.move(1));
    act(() => picker.move(1));
    expect(picker.activeIndex).toBe(start + 2);

    type("traceparent");
    // Left alone, the highlight could point past the end of a shorter list.
    expect(picker.activeIndex).toBe(0);
    expect(picker.active?.type).toBe("traceparent");
  });

  test("the arrows walk the matches, and wrap", () => {
    mount();
    open();
    // "trace" reaches stackTrace too — its type name carries the word.
    type("trace");
    expect(options()).toEqual(["traceId", "traceparent", "stackTrace"]);

    act(() => picker.move(1));
    expect(picker.active?.type).toBe("traceparent");
    act(() => picker.move(1));
    expect(picker.active?.type).toBe("stackTrace");
    act(() => picker.move(1));
    expect(picker.active?.type).toBe("traceId");
    act(() => picker.move(-1));
    expect(picker.active?.type).toBe("stackTrace");
  });

  test("moving through an empty list does nothing rather than throwing", () => {
    mount();
    open();
    type("zzzznope");
    act(() => picker.move(1));
    expect(picker.active).toBeNull();
  });

  test("reopening starts clean, on the type currently chosen", () => {
    mount("latencyMs");
    open();
    type("trace");
    expect(picker.query).toBe("trace");

    close();
    open();
    expect(picker.query).toBe("");
    expect(options().length).toBeGreaterThan(150);
    expect(picker.active?.type).toBe("latencyMs");
  });

  test("an excluded type is never offered, searched for or not", () => {
    mount("fullName", ["computed", "array", "reference"]);
    open();
    expect(options()).not.toContain("computed");
    expect(options()).not.toContain("reference");
    type("reference");
    expect(options()).toEqual([]);
  });
});
