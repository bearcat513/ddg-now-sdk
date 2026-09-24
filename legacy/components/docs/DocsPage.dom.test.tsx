import { GlobalRegistrator } from "@happy-dom/global-registrator";

/** Where this DOM says it is. The page fetches by path, and a relative URL
 *  cannot be resolved against `about:blank`. */
const PAGE_URL = "http://localhost:3000/docs";

// Registered before React is imported, so the page renders against a document
// — unless another .dom test in this process got there first, since registering
// twice throws and `bun test` runs them all together. In that case the document
// exists already and only its address has to be moved here.
if (typeof document === "undefined") {
  GlobalRegistrator.register({ url: PAGE_URL });
} else {
  (window as unknown as { happyDOM?: { setURL?: (url: string) => void } }).happyDOM?.setURL?.(PAGE_URL);
}

// React refuses to batch updates from `act` without this.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DocsPage } from "./DocsPage";
import { buildOpenApiDocument } from "@/server/openapi";

/**
 * The whole page, mounted, with the document arriving over a stubbed fetch.
 *
 * What this is for is the half a server-rendered string cannot reach: the
 * effects run, the document is read, and every card, schema and description in
 * a real document is drawn — which is where a page that renders an OpenAPI
 * document goes wrong, on the one schema that refers to itself.
 */

const document_ = buildOpenApiDocument({ serverUrl: "http://localhost:3000" });

const originalFetch = globalThis.fetch;

/** Every call the page made, so a trial request can be checked for real. */
let calls: { url: string; method: string }[] = [];

/**
 * A `servers` entry that is not this page's origin, for the test below: a
 * proxy that terminated TLS, or a document answered from the cache after the
 * server moved. Reset before each mount.
 */
let staleServer: { url: string }[] | null = null;

/** Defined rather than assigned: the one this DOM installs is not writable. */
function stubFetch() {
  calls = [];
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      calls.push({ url, method: init?.method ?? "GET" });

      if (url.includes("/api/openapi.json")) {
        return Response.json(staleServer ? { ...document_, servers: staleServer } : document_);
      }
      if (url.includes("/api/health")) return Response.json({ ok: true, pocketbase: "up" });
      // Signed out, which is the state a reader who has never used the app is in.
      return Response.json({ error: "Sign in first." }, { status: 401 });
    }) as typeof fetch,
  });
}

/** The first button whose label contains this text. */
const button = (text: string): HTMLButtonElement => {
  const found = [...(host?.querySelectorAll("button") ?? [])].find(element =>
    (element.textContent ?? "").includes(text),
  );
  if (!found) throw new Error(`no button labelled ${text}`);
  return found as HTMLButtonElement;
};

let root: Root | null = null;
let host: HTMLElement | null = null;

async function mount() {
  stubFetch();
  host = window.document.createElement("div");
  window.document.body.append(host);
  await act(async () => {
    root = createRoot(host!);
    root.render(<DocsPage />);
  });
  // A second tick, for the state the fetches set.
  await act(async () => {});
  return host.textContent ?? "";
}

afterEach(() => {
  staleServer = null;
  // Opening a card writes the hash, and the next mount would open that card
  // again — which, clicked, would close it rather than open it.
  history.replaceState(null, "", PAGE_URL);
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

afterEach(() => {
  Object.defineProperty(globalThis, "fetch", { configurable: true, writable: true, value: originalFetch });
});

describe("the reference page", () => {
  test("draws every tag and every endpoint the document declares", async () => {
    const text = await mount();

    for (const tag of document_.tags) {
      expect(text).toContain(String((tag as { name: string }).name));
    }

    for (const path of Object.keys(document_.paths)) {
      expect(text).toContain(path);
    }
  });

  test("renders the document's own description as prose, not as its marks", async () => {
    const text = await mount();
    expect(text).toContain("Authentication");
    expect(text).toContain("X-API-Key");
    expect(text).not.toContain("### Authentication");
  });

  test("lists the models, and says where the calls would go", async () => {
    const text = await mount();
    expect(text).toContain("Models");
    expect(text).toContain("http://localhost:3000");
    expect(text).toContain("Authorize");
  });

  test("calls the endpoint when asked to, and shows what came back", async () => {
    await mount();

    // Open the card, ask for the trial controls, then send it.
    await act(async () => button("/api/health").click());
    await act(async () => button("Try it out").click());
    await act(async () => button("Execute").click());
    await act(async () => {});

    const sent = calls.find(call => call.url.includes("/api/health"));
    expect(sent).toMatchObject({ url: "http://localhost:3000/api/health", method: "GET" });

    const text = host?.textContent ?? "";
    expect(text).toContain("200");
    expect(text).toContain("pocketbase");
    // And the command beside it, for taking the same call elsewhere.
    expect(text).toContain("curl -X GET");
  });

  test("calls this page's own origin, whatever server the document names", async () => {
    // The document naming somewhere unreachable is what a TLS-terminating
    // proxy and a cached document both look like from here, and aiming at it
    // would fail every call in the same unexplained way.
    staleServer = [{ url: "http://gone.invalid:9999" }];
    await mount();

    await act(async () => button("/api/health").click());
    await act(async () => button("Try it out").click());
    await act(async () => button("Execute").click());
    await act(async () => {});

    expect(calls.some(call => call.url.includes("gone.invalid"))).toBe(false);
    expect(calls).toContainEqual({ url: "http://localhost:3000/api/health", method: "GET" });
    expect(host?.textContent ?? "").toContain("200");
  });

  test("opens the endpoint a link names, without being clicked", async () => {
    window.location.hash = "#op-getHealth";
    const text = await mount();
    // The card is expanded: its documented response is on the page.
    expect(text).toContain("The server is up.");
  });
});
