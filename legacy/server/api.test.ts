/**
 * End-to-end tests against a real Bun.serve process talking to a real
 * PocketBase, so the route table, query-parameter handling, status codes,
 * the storage layer and the access rules are all exercised for real.
 *
 * The PocketBase is a throwaway container on its own port and its own empty
 * volume (see ./testPocketBase.ts). Without Docker, everything that needs an
 * account skips, and the handful of anonymous routes still run.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, startTestPocketBase } from "./testPocketBase";
import { OPERATIONS } from "./openapi";
import { DEFAULT_PREFERENCES, PREFERENCE_LIMITS } from "../lib/preferences";
import { TELEGRAM_LIMITS } from "../lib/telegram";
import { WORKSPACE_FILE_KIND, WORKSPACE_FILE_VERSION } from "../lib/workspaceFile";

const PORT = 3100 + Math.floor(Math.random() * 400);
const BASE = `http://localhost:${PORT}`;

const PASSWORD = "test-password-123";
/** Unique per run, so re-runs against one PocketBase never collide. */
const suffix = Math.random().toString(36).slice(2, 8);
const ALICE = `alice-${suffix}@example.com`;
const BOB = `bob-${suffix}@example.com`;
/** A third account, so the notification test's own Bob is nobody else's. */
const BOB_TELEGRAM = `bob-telegram-${suffix}@example.com`;

// Top-level await: the container has to exist before the describes below
// decide whether to register their account-backed tests or skip them.
const pocketbase = await startTestPocketBase();
if (!pocketbase.available) {
  console.warn(
    `\n[test] skipping every test that needs an account: ${pocketbase.reason}.\n` +
      "[test] start Docker, or point PB_TEST_URL at a PocketBase built from docker/, to run them.\n",
  );
}

/** A test that needs somewhere to store records — which is nearly all of them. */
const signedIn = pocketbase.available ? test : test.skip;

let server: ReturnType<typeof Bun.spawn>;

/** Alice's session. Every request below is hers unless it says otherwise. */
let cookie = "";

async function api(path: string, init?: RequestInit & { cookie?: string }) {
  const session = init?.cookie ?? cookie;
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(session ? { cookie: session } : {}),
    },
  });
}

const json = async (path: string, init?: RequestInit & { cookie?: string }) =>
  (await api(path, init)).json() as Promise<any>;

/** Registers an account and returns the session cookie it was handed. */
async function register(email: string): Promise<string> {
  const response = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (response.status !== 201) throw new Error(`could not register ${email}: ${await response.text()}`);
  return (response.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
}

const SIMPLE_FIELDS = [
  { id: "a", name: "n", type: "autoIncrement" },
  { id: "b", name: "email", type: "email" },
];

beforeAll(async () => {
  server = Bun.spawn(["bun", "src/index.ts"], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "production",
      POCKETBASE_URL: pocketbase.url,
      PB_ADMIN_EMAIL: TEST_ADMIN_EMAIL,
      PB_ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
      // The one shape of variable a user's snippet is meant to see.
      DDG_SCRIPT_DEMO_TOKEN: "visible-to-snippets",
      // No server-wide bot: whether one is configured changes what the
      // notification settings answer, and a developer's own environment
      // must not decide that for the tests.
      TELEGRAM_BOT_TOKEN: "",
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  // /api/health answers whether or not PocketBase is up, which is what makes
  // the anonymous tests runnable without Docker.
  let listening = false;
  for (let attempt = 0; attempt < 100 && !listening; attempt++) {
    try {
      listening = (await fetch(`${BASE}/api/health`)).ok;
    } catch {
      // not listening yet
    }
    if (!listening) await Bun.sleep(50);
  }
  if (!listening) throw new Error("server did not start");

  if (pocketbase.available) cookie = await register(ALICE);
});

afterAll(async () => {
  server?.kill();
  await pocketbase.stop();
});

describe("discovery", () => {
  test("GET /api lists every endpoint", async () => {
    const body = await json("/api");
    expect(Object.keys(body.endpoints).length).toBeGreaterThan(10);
    expect(body.generateOptions).toBeDefined();
    expect(body.auth).toContain("/api/auth/login");
  });

  test("GET /api/health answers regardless of PocketBase", async () => {
    expect(await json("/api/health")).toMatchObject({ status: "ok" });
  });

  test("GET /api/openapi.json serves a document pointing back at this server", async () => {
    const response = await api("/api/openapi.json");
    expect(response.headers.get("content-type")).toContain("application/json");

    const document = await response.json();
    expect(document.openapi).toBe("3.0.3");
    expect(document.servers[0].url).toBe(BASE);
    // The one a tool is most likely to be imported for.
    expect(document.paths["/api/generate"].post.operationId).toBe("generate");
  });

  test("every endpoint the document describes is a route this server answers", async () => {
    // The spec is what Postman and Bruno build their requests from, so a path
    // in it that 404s here would be a broken request in someone's collection.
    // Anonymously: a guarded route refuses before it looks anything up, and a
    // refusal proves the route exists — only "no such endpoint" does not.
    const missing: string[] = [];
    for (const operation of OPERATIONS) {
      const path = operation.path.replace("{id}", "does-not-exist");
      const response = await fetch(`${BASE}${path}`, { method: operation.method.toUpperCase() });
      const body = await response.text();
      if (response.status === 404 && body.includes("No such endpoint")) {
        missing.push(`${operation.method.toUpperCase()} ${path}`);
      }
    }
    expect(missing).toEqual([]);
  });

  signedIn("GET /api/meta reports the database in use", async () => {
    const body = await json("/api/meta");
    expect(body.url).toBe(pocketbase.url);
    expect(body.reachable).toBe(true);
    expect(typeof body.configs).toBe("number");
  });

  signedIn("GET /api/field-types exposes the catalog the UI uses", async () => {
    const body = await json("/api/field-types");
    expect(body.types.length).toBeGreaterThan(50);
    expect(body.types.find((t: any) => t.type === "computed").opts).toContain("expression");
    expect(body.formulaFunctions).toContain("round");
  });
});

describe("telegram notifications", () => {
  // Nothing here reaches Telegram: a bot token is refused on its shape before
  // it would be checked, and a settings read with no bot configured has
  // nothing to ask about.
  signedIn("start out off, with nothing configured", async () => {
    const body = await json("/api/telegram");
    expect(body).toMatchObject({
      enabled: false,
      chatId: "",
      hasOwnBot: false,
      serverBot: false,
      events: { generated: true, failed: true },
    });
  });

  signedIn("never hand the bot token back, under any name", async () => {
    const body = await json("/api/telegram");
    expect(Object.keys(body)).not.toContain("botToken");
    expect(Object.keys(body)).not.toContain("bot_token");
    expect(JSON.stringify(body)).not.toContain("bot_token");
  });

  signedIn("store what is sent, and normalize what is not usable", async () => {
    const saved = await json("/api/telegram", {
      method: "PUT",
      body: JSON.stringify({
        enabled: true,
        chatId: "-1001234567890",
        chatLabel: "Release bots",
        minRows: 10_000_000,
        apiKeyOnly: false,
        events: { generated: false, failed: true },
      }),
    });

    expect(saved).toMatchObject({
      enabled: true,
      chatId: "-1001234567890",
      chatLabel: "Release bots",
      apiKeyOnly: false,
      events: { generated: false, failed: true },
    });
    // Clamped, not refused.
    expect(saved.minRows).toBe(TELEGRAM_LIMITS.minRows.max);

    // And read back the same on the next request.
    expect(await json("/api/telegram")).toMatchObject({ chatId: "-1001234567890", enabled: true });
  });

  signedIn("refuse a chat id that could only fail later", async () => {
    const response = await api("/api/telegram", {
      method: "PUT",
      body: JSON.stringify({ chatId: "https://t.me/someone" }),
    });
    expect(response.status).toBe(400);
  });

  signedIn("refuse a bot token on its shape, before asking Telegram anything", async () => {
    const response = await api("/api/telegram", {
      method: "PUT",
      body: JSON.stringify({ botToken: "not-a-bot-token" }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("BotFather");
  });

  signedIn("will not start a pairing with no bot to pair with", async () => {
    const response = await api("/api/telegram/pair", { method: "POST" });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("bot token");
  });

  signedIn("will not send a test with no bot to send it through", async () => {
    const response = await api("/api/telegram/test", { method: "POST" });
    expect(response.status).toBe(400);
  });

  signedIn("unlink puts it all back", async () => {
    await json("/api/telegram", { method: "PUT", body: JSON.stringify({ enabled: true, chatId: "123456789" }) });
    expect(await json("/api/telegram", { method: "DELETE" })).toMatchObject({
      enabled: false,
      chatId: "",
      chatLabel: "",
      hasOwnBot: false,
    });
  });

  signedIn("are one account's own — Bob cannot see Alice's", async () => {
    await json("/api/telegram", { method: "PUT", body: JSON.stringify({ enabled: true, chatId: "555000111" }) });

    const bob = await register(BOB_TELEGRAM);
    const theirs = await json("/api/telegram", { cookie: bob });
    expect(theirs.chatId).toBe("");
    expect(theirs.enabled).toBe(false);
  });
});

describe("accounts", () => {
  test("the data endpoints refuse an anonymous caller", async () => {
    for (const [path, init] of [
      ["/api/configs", undefined],
      ["/api/datasets", undefined],
      ["/api/script-templates", undefined],
      ["/api/meta", undefined],
      ["/api/preferences", undefined],
      ["/api/export", undefined],
      ["/api/generate", { method: "POST", body: JSON.stringify({ fields: SIMPLE_FIELDS }) }],
      ["/api/enum/preview", { method: "POST", body: JSON.stringify({ script: "return [1];" }) }],
    ] as const) {
      const response = await fetch(`${BASE}${path}`, {
        ...init,
        headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      });
      expect([path, response.status]).toEqual([path, 401]);
    }
  });

  test("GET /api/auth/me is 401 without a session", async () => {
    expect((await fetch(`${BASE}/api/auth/me`)).status).toBe(401);
  });

  signedIn("register issues an httpOnly session cookie and never returns the token", async () => {
    const email = `new-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const response = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: PASSWORD, name: "New Person" }),
    });

    expect(response.status).toBe(201);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("ddg_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");

    const body = await response.json();
    expect(body.user).toMatchObject({ email, name: "New Person" });
    expect(JSON.stringify(body)).not.toContain("eyJ"); // no JWT anywhere in the body
  });

  signedIn("register rejects a weak password and a duplicate address", async () => {
    const weak = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `weak-${suffix}@example.com`, password: "short" }),
    });
    expect(weak.status).toBe(400);
    expect((await weak.json()).error).toMatch(/at least 8/);

    const duplicate = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ALICE, password: PASSWORD }),
    });
    expect(duplicate.status).toBeGreaterThanOrEqual(400);
  });

  signedIn("login rejects a wrong password without saying which half was wrong", async () => {
    const response = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ALICE, password: "not-the-password" }),
    });
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("That email and password do not match an account.");
  });

  signedIn("login, me and logout round-trip", async () => {
    const login = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ALICE, password: PASSWORD }),
    });
    expect(login.status).toBe(200);
    const session = (login.headers.get("set-cookie") ?? "").split(";")[0]!;

    expect((await json("/api/auth/me", { cookie: session })).user.email).toBe(ALICE);

    const logout = await api("/api/auth/logout", { method: "POST", cookie: session });
    expect(logout.status).toBe(200);
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  signedIn("a garbage session is refused, not honoured", async () => {
    expect((await api("/api/configs", { cookie: "ddg_session=not-a-real-token" })).status).toBe(401);
  });
});

describe("inference and formulas", () => {
  signedIn("POST /api/infer parses SQL", async () => {
    const body = await json("/api/infer", {
      method: "POST",
      body: JSON.stringify({ input: "CREATE TABLE t (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE)" }),
    });
    expect(body.detected).toBe("sql");
    expect(body.fields.map((f: any) => f.type)).toEqual(["autoIncrement", "email"]);
  });

  signedIn("POST /api/infer rejects a non-string input", async () => {
    const response = await api("/api/infer", { method: "POST", body: JSON.stringify({ input: 42 }) });
    expect(response.status).toBe(400);
  });

  signedIn("POST /api/formula/validate reports both outcomes", async () => {
    expect(
      await json("/api/formula/validate", {
        method: "POST",
        body: JSON.stringify({ expression: "a * b", fields: ["a", "b"] }),
      }),
    ).toEqual({ valid: true, references: ["a", "b"] });

    const bad = await json("/api/formula/validate", {
      method: "POST",
      body: JSON.stringify({ expression: "a * missing", fields: ["a"] }),
    });
    expect(bad.valid).toBe(false);
    expect(bad.error).toContain("missing");
  });

  signedIn("POST /api/formula/validate filters non-numeric fields out of scope", async () => {
    const body = await json("/api/formula/validate", {
      method: "POST",
      body: JSON.stringify({
        expression: "label * 2",
        fields: [{ name: "label", type: "word" }, { name: "qty", type: "integer" }],
      }),
    });
    expect(body.valid).toBe(false);
  });
});

describe("script-backed enums", () => {
  /** A stand-in for the external source a user's snippet would really call. */
  let upstream: ReturnType<typeof Bun.serve>;

  beforeAll(() => {
    upstream = Bun.serve({ port: 0, fetch: () => Response.json([{ code: "gold" }, { code: "silver" }]) });
  });
  afterAll(() => upstream?.stop(true));

  const fetchScript = () => `const r = await fetch("${upstream.url}"); return (await r.json()).map(x => x.code);`;

  const enumField = (script: string) => ({
    id: "tier",
    name: "tier",
    type: "enum",
    options: { valuesFrom: "script", script },
  });

  signedIn("POST /api/enum/preview runs a snippet and returns its choices", async () => {
    const body = await json("/api/enum/preview", {
      method: "POST",
      body: JSON.stringify({ script: fetchScript() }),
    });
    expect(body).toMatchObject({ ok: true, values: ["gold", "silver"], count: 2, truncated: false });
    expect(typeof body.durationMs).toBe("number");
  });

  signedIn("a snippet sees DDG_SCRIPT_* variables and nothing else", async () => {
    const body = await json("/api/enum/preview", {
      method: "POST",
      body: JSON.stringify({
        script:
          "return [`demo=${env.DDG_SCRIPT_DEMO_TOKEN}`, `admin=${env.PB_ADMIN_PASSWORD}`, " +
          "`path=${env.PATH}`, `keys=${Object.keys(env).join(\",\")}`];",
      }),
    });

    // The variable put there for snippets is readable; the server's own
    // secrets and the rest of its environment are not in scope at all.
    expect(body.values).toEqual([
      "demo=visible-to-snippets",
      "admin=undefined",
      "path=undefined",
      "keys=DDG_SCRIPT_DEMO_TOKEN",
    ]);
  });

  signedIn("POST /api/enum/preview reports a failing snippet without a 500", async () => {
    const response = await api("/api/enum/preview", {
      method: "POST",
      body: JSON.stringify({ script: "return 42;" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: false, error: expect.stringMatching(/must return an array/i) });
  });

  signedIn("POST /api/enum/preview rejects a missing script", async () => {
    const response = await api("/api/enum/preview", { method: "POST", body: JSON.stringify({}) });
    expect(response.status).toBe(400);
  });

  signedIn("POST /api/generate draws rows from the fetched choices", async () => {
    const body = await json("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({ name: "Tiers", rowCount: 20, seed: "s", fields: [enumField(fetchScript())] }),
    });
    expect(new Set(body.rows.map((r: any) => r.tier))).toEqual(new Set(["gold", "silver"]));
  });

  signedIn("POST /api/generate surfaces a broken script as a 400 naming the field", async () => {
    const response = await api("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({ rowCount: 5, fields: [enumField(`throw new Error("upstream is down");`)] }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/Enum field "tier": upstream is down/);
  });

  signedIn("a stored configuration re-fetches its choices on every generate", async () => {
    let calls = 0;
    using counting = Bun.serve({
      port: 0,
      fetch: () => Response.json([`call-${++calls}`]),
    });

    const created = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name: "Dynamic tiers",
        rowCount: 2,
        fields: [enumField(`const r = await fetch("${counting.url}"); return r.json();`)],
      }),
    });

    const first = await json(`/api/configs/${created.id}/generate?save=false`, { method: "POST" });
    const second = await json(`/api/configs/${created.id}/generate?save=false`, { method: "POST" });

    expect(first.rows[0].tier).toBe("call-1");
    expect(second.rows[0].tier).toBe("call-2");
  });

  signedIn("a script-backed enum survives export and re-import", async () => {
    const created = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({ name: "Portable tiers", rowCount: 3, fields: [enumField(fetchScript())] }),
    });

    const file = await (await api(`/api/configs/${created.id}/export`)).json();
    expect(file.fields[0].options).toMatchObject({ valuesFrom: "script" });

    const imported = await json("/api/configs/import", { method: "POST", body: JSON.stringify(file) });
    expect(imported.fields[0].options.script).toBe(fetchScript());
    expect(imported.fields[0].options.valuesFrom).toBe("script");
  });

  signedIn("importing a script-backed enum with no script is rejected", async () => {
    const response = await api("/api/configs/import", {
      method: "POST",
      body: JSON.stringify({
        kind: "dummy-data-generator/config",
        version: 1,
        name: "Broken",
        rowCount: 1,
        fields: [{ name: "tier", type: "enum", options: { valuesFrom: "script" } }],
      }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/set to use a script but has none/);
  });
});

describe("configuration lifecycle", () => {
  let id = "";

  signedIn("POST /api/configs creates one, owned by the caller", async () => {
    const response = await api("/api/configs", {
      method: "POST",
      body: JSON.stringify({ name: "Users", rowCount: 5, seed: "s", fields: SIMPLE_FIELDS }),
    });
    expect(response.status).toBe(201);
    const body = await response.json();
    id = body.id;
    expect(body.fields).toHaveLength(2);
    expect(body.ownerId).toBe((await json("/api/auth/me")).user.id);
    expect(body.sharedWith).toEqual([]);
  });

  signedIn("GET /api/configs/:id reads it back", async () => {
    expect((await json(`/api/configs/${id}`)).name).toBe("Users");
  });

  signedIn("PUT /api/configs/:id replaces it", async () => {
    const body = await json(`/api/configs/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Users v2", rowCount: 9, seed: "", fields: SIMPLE_FIELDS }),
    });
    expect(body.name).toBe("Users v2");
    expect(body.rowCount).toBe(9);
  });

  signedIn("POST /api/configs requires a name and fields", async () => {
    expect((await api("/api/configs", { method: "POST", body: JSON.stringify({ fields: SIMPLE_FIELDS }) })).status).toBe(400);
    expect((await api("/api/configs", { method: "POST", body: JSON.stringify({ name: "x", fields: [] }) })).status).toBe(400);
  });

  signedIn("export → import round-trips through HTTP", async () => {
    const response = await api(`/api/configs/${id}/export`);
    expect(response.headers.get("content-disposition")).toContain("users-v2.ddg.json");

    const file = await response.json();
    const imported = await api("/api/configs/import", { method: "POST", body: JSON.stringify(file) });
    expect(imported.status).toBe(201);
    // Same name already exists, so the copy is suffixed.
    expect((await imported.json()).name).toBe("Users v2 (2)");
  });

  signedIn("POST /api/configs/:id/generate uses the stored schema", async () => {
    const body = await json(`/api/configs/${id}/generate`, { method: "POST" });
    expect(body.total).toBe(9); // the stored rowCount
    expect(body.dataset.configId).toBe(id);
  });

  signedIn("POST /api/configs/:id/generate honors overrides", async () => {
    const body = await json(`/api/configs/${id}/generate?rows=3&name=Override&save=false`, { method: "POST" });
    expect(body.total).toBe(3);
    expect(body.dataset).toBeNull();
    expect(body.rows).toHaveLength(3); // unsaved runs return everything
  });

  signedIn("a configuration stores metadata, and hands it back", async () => {
    const created = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name: "Labelled",
        rowCount: 2,
        fields: SIMPLE_FIELDS,
        metadata: { team: "billing", ticket: "DDG-412", rows: 500 },
      }),
    });
    // A number sent by hand reads back as the text it was meant to be.
    expect(created.metadata).toEqual({ team: "billing", ticket: "DDG-412", rows: "500" });
    expect((await json(`/api/configs/${created.id}`)).metadata).toEqual(created.metadata);

    // A PUT replaces the set, like every other part of a configuration.
    const updated = await json(`/api/configs/${created.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Labelled", rowCount: 2, fields: SIMPLE_FIELDS, metadata: { team: "growth" } }),
    });
    expect(updated.metadata).toEqual({ team: "growth" });

    // And leaving it out clears it, rather than quietly keeping the old pairs.
    const cleared = await json(`/api/configs/${created.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Labelled", rowCount: 2, fields: SIMPLE_FIELDS }),
    });
    expect(cleared.metadata).toEqual({});

    // The export carries it, so an import elsewhere brings it along.
    const exported = await (await api(`/api/configs/${created.id}/export`)).text();
    expect(JSON.parse(exported).metadata).toEqual({});
  });

  signedIn("metadata that is not a set of text pairs is refused by name", async () => {
    const response = await api("/api/configs", {
      method: "POST",
      body: JSON.stringify({ name: "Bad", rowCount: 2, fields: SIMPLE_FIELDS, metadata: { owners: ["ada"] } }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain('"owners"');
  });

  signedIn("DELETE /api/configs/:id removes it", async () => {
    expect((await api(`/api/configs/${id}`, { method: "DELETE" })).status).toBe(200);
    expect((await api(`/api/configs/${id}`)).status).toBe(404);
    expect((await api(`/api/configs/${id}/generate`, { method: "POST" })).status).toBe(404);
  });
});

describe("one account cannot reach another's records", () => {
  let bob = "";
  let aliceConfig = "";
  let aliceTemplate = "";
  let aliceDataset = "";

  beforeAll(async () => {
    if (!pocketbase.available) return;
    bob = await register(BOB);

    aliceConfig = (
      await json("/api/configs", {
        method: "POST",
        body: JSON.stringify({ name: "Alice's schema", rowCount: 3, fields: SIMPLE_FIELDS }),
      })
    ).id;

    aliceTemplate = (
      await json("/api/script-templates", {
        method: "POST",
        body: JSON.stringify({ name: "Alice's template", body: "const rows = ${GENERATED_DATASET};" }),
      })
    ).id;

    aliceDataset = (
      await json("/api/generate", {
        method: "POST",
        body: JSON.stringify({ name: "Alice's data", rowCount: 2, fields: SIMPLE_FIELDS }),
      })
    ).dataset.id;
  });

  signedIn("Bob's lists do not contain Alice's records", async () => {
    expect((await json("/api/configs", { cookie: bob })).map((c: any) => c.id)).not.toContain(aliceConfig);
    expect((await json("/api/datasets", { cookie: bob })).map((d: any) => d.id)).not.toContain(aliceDataset);
    expect((await json("/api/script-templates", { cookie: bob })).map((t: any) => t.id)).not.toContain(aliceTemplate);
  });

  signedIn("Bob cannot read, change or delete them", async () => {
    for (const [method, path] of [
      ["GET", `/api/configs/${aliceConfig}`],
      ["GET", `/api/configs/${aliceConfig}/export`],
      ["DELETE", `/api/configs/${aliceConfig}`],
      ["POST", `/api/configs/${aliceConfig}/generate`],
      ["GET", `/api/datasets/${aliceDataset}`],
      ["GET", `/api/datasets/${aliceDataset}/export`],
      ["DELETE", `/api/datasets/${aliceDataset}`],
      ["GET", `/api/script-templates/${aliceTemplate}`],
      ["DELETE", `/api/script-templates/${aliceTemplate}`],
    ] as const) {
      const response = await api(path, { method, cookie: bob });
      expect([path, response.status]).toEqual([path, 404]);
    }

    const replaced = await api(`/api/configs/${aliceConfig}`, {
      method: "PUT",
      cookie: bob,
      body: JSON.stringify({ name: "Bob's now", rowCount: 1, fields: SIMPLE_FIELDS }),
    });
    expect(replaced.status).toBe(404);

    // …and none of that changed anything.
    expect((await json(`/api/configs/${aliceConfig}`)).name).toBe("Alice's schema");
  });

  signedIn("Bob cannot see Alice's records in his counts", async () => {
    const meta = await json("/api/meta", { cookie: bob });
    expect(meta.configs).toBe(0);
    expect(meta.datasets).toBe(0);
  });
});

describe("sharing", () => {
  let bob = "";
  let bobId = "";
  let config = "";
  let template = "";

  beforeAll(async () => {
    if (!pocketbase.available) return;
    bob = await register(`carol-${suffix}@example.com`);
    bobId = (await json("/api/auth/me", { cookie: bob })).user.id;

    config = (
      await json("/api/configs", {
        method: "POST",
        body: JSON.stringify({ name: "Shared schema", rowCount: 4, seed: "s", fields: SIMPLE_FIELDS }),
      })
    ).id;

    template = (
      await json("/api/script-templates", {
        method: "POST",
        body: JSON.stringify({ name: "Shared template", body: "const rows = ${GENERATED_DATASET};" }),
      })
    ).id;
  });

  const carol = () => `carol-${suffix}@example.com`;

  signedIn("an unshared record lists no recipients", async () => {
    expect(await json(`/api/configs/${config}/shares`)).toMatchObject({ sharedWith: [], canShare: true });
  });

  signedIn("sharing with an unknown address fails loudly", async () => {
    const response = await api(`/api/configs/${config}/shares`, {
      method: "POST",
      body: JSON.stringify({ email: "nobody-here@example.com" }),
    });
    expect(response.status).toBe(404);
    expect((await response.json()).error).toMatch(/No account is registered/);
  });

  signedIn("sharing a configuration lets the recipient read and generate, but not write", async () => {
    const shared = await json(`/api/configs/${config}/shares`, {
      method: "POST",
      body: JSON.stringify({ email: carol().toUpperCase() }), // addresses are case-insensitive
    });
    expect(shared.sharedWith).toEqual([carol()]);

    // It shows up on the recipient's list, marked with the owner's id.
    const list = await json("/api/configs", { cookie: bob });
    const theirs = list.find((c: any) => c.id === config);
    expect(theirs.name).toBe("Shared schema");
    expect(theirs.ownerId).not.toBe(bobId);

    // Reading and generating are allowed…
    expect((await api(`/api/configs/${config}`, { cookie: bob })).status).toBe(200);
    expect((await api(`/api/configs/${config}/export`, { cookie: bob })).status).toBe(200);
    const generated = await json(`/api/configs/${config}/generate`, { method: "POST", cookie: bob });
    expect(generated.total).toBe(4);

    // …and the data generated from it belongs to the recipient, not the owner.
    expect((await json("/api/datasets", { cookie: bob })).map((d: any) => d.id)).toContain(generated.dataset.id);
    expect((await json("/api/datasets")).map((d: any) => d.id)).not.toContain(generated.dataset.id);

    // Writing is not.
    const overwrite = await api(`/api/configs/${config}`, {
      method: "PUT",
      cookie: bob,
      body: JSON.stringify({ name: "Taken over", rowCount: 1, fields: SIMPLE_FIELDS }),
    });
    expect(overwrite.status).toBe(404);
    expect((await api(`/api/configs/${config}`, { method: "DELETE", cookie: bob })).status).toBe(404);
    expect((await json(`/api/configs/${config}`)).name).toBe("Shared schema");
  });

  signedIn("a recipient sees who shared it, and not the rest of the guest list", async () => {
    const view = await json(`/api/configs/${config}/shares`, { cookie: bob });
    expect(view).toMatchObject({ owner: ALICE, canShare: false, sharedWith: [] });
  });

  signedIn("a recipient cannot re-share it", async () => {
    const response = await api(`/api/configs/${config}/shares`, {
      method: "POST",
      cookie: bob,
      body: JSON.stringify({ email: BOB }),
    });
    expect(response.status).toBe(403);
  });

  signedIn("a shared script template renders a dataset the recipient owns", async () => {
    await json(`/api/script-templates/${template}/shares`, {
      method: "POST",
      body: JSON.stringify({ email: carol() }),
    });

    const generated = await json("/api/generate", {
      method: "POST",
      cookie: bob,
      body: JSON.stringify({ name: "Carol's rows", rowCount: 2, seed: "s", fields: SIMPLE_FIELDS }),
    });

    const response = await api(`/api/datasets/${generated.dataset.id}/script?templateId=${template}`, { cookie: bob });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("const rows = [");
  });

  signedIn("unsharing takes it away again", async () => {
    const after = await json(`/api/configs/${config}/shares?email=${encodeURIComponent(carol())}`, {
      method: "DELETE",
    });
    expect(after.sharedWith).toEqual([]);
    expect((await api(`/api/configs/${config}`, { cookie: bob })).status).toBe(404);
    expect((await json("/api/configs", { cookie: bob })).map((c: any) => c.id)).not.toContain(config);
  });

  signedIn("a recipient can remove a share from their own list", async () => {
    await json(`/api/script-templates/${template}/shares`, {
      method: "POST",
      body: JSON.stringify({ email: carol() }),
    });
    expect((await json("/api/script-templates", { cookie: bob })).map((t: any) => t.id)).toContain(template);

    const left = await api(`/api/script-templates/${template}/shares?email=${encodeURIComponent(carol())}`, {
      method: "DELETE",
      cookie: bob,
    });
    expect(left.status).toBe(200);
    expect((await json("/api/script-templates", { cookie: bob })).map((t: any) => t.id)).not.toContain(template);

    // The owner still has it, now shared with nobody.
    expect(await json(`/api/script-templates/${template}/shares`)).toMatchObject({ sharedWith: [] });
  });

  signedIn("sharing endpoints refuse a record you cannot see", async () => {
    expect((await api(`/api/configs/${config}/shares`, { cookie: bob })).status).toBe(404);
    expect((await api("/api/configs/cfg_nope/shares")).status).toBe(404);
  });
});

describe("generation and export", () => {
  signedIn("POST /api/generate persists and returns a capped preview", async () => {
    const body = await json("/api/generate", {
      method: "POST",
      body: JSON.stringify({ name: "Big", rowCount: 150, seed: "s", fields: SIMPLE_FIELDS }),
    });
    expect(body.total).toBe(150);
    expect(body.rows).toHaveLength(100);
    expect(body.truncated).toBe(true);
  });

  signedIn("a stored dataset is named for the schema and the run that made it", async () => {
    const first = await json("/api/generate", {
      method: "POST",
      body: JSON.stringify({ name: "Orders", rowCount: 1, fields: SIMPLE_FIELDS }),
    });
    expect(first.dataset.name).toMatch(/^Orders · \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // The same schema again is a second entry, told apart by its stamp — and
    // echoing a stamped name back does not stack a second one onto it.
    const second = await json("/api/generate", {
      method: "POST",
      body: JSON.stringify({ name: first.dataset.name, rowCount: 1, fields: SIMPLE_FIELDS }),
    });
    expect(second.dataset.name).toMatch(/^Orders · \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(second.dataset.id).not.toBe(first.dataset.id);
  });

  signedIn("?format=csv returns a downloadable file", async () => {
    const response = await api("/api/generate?format=csv&save=false", {
      method: "POST",
      body: JSON.stringify({ name: "Sheet", rowCount: 2, fields: SIMPLE_FIELDS }),
    });
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("Sheet.csv");
    expect((await response.text()).split("\n")[0]).toBe("n,email");
  });

  signedIn("?save=false leaves no dataset behind", async () => {
    const before = (await json("/api/datasets?limit=1000")).length;
    await api("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({ name: "Ephemeral", rowCount: 3, fields: SIMPLE_FIELDS }),
    });
    expect((await json("/api/datasets?limit=1000")).length).toBe(before);
  });

  signedIn("calculated fields work over HTTP, and bad ones 400", async () => {
    const fields = [
      { id: "q", name: "qty", type: "integer", options: { min: 2, max: 2 } },
      { id: "t", name: "total", type: "computed", options: { expression: "qty * 10", decimals: 2 } },
    ];
    const body = await json("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({ name: "Calc", rowCount: 2, fields }),
    });
    expect(body.rows.every((r: any) => r.total === 20)).toBe(true);

    const broken = await api("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({
        name: "Calc",
        rowCount: 1,
        fields: [{ id: "t", name: "total", type: "computed", options: { expression: "nope * 2" } }],
      }),
    });
    expect(broken.status).toBe(400);
    expect((await broken.json()).error).toContain("nope");
  });

  signedIn("datasets page with ?limit and ?offset", async () => {
    const created = await json("/api/generate", {
      method: "POST",
      body: JSON.stringify({ name: "Paged", rowCount: 50, seed: "s", fields: SIMPLE_FIELDS }),
    });
    const id = created.dataset.id;

    const page = await json(`/api/datasets/${id}?limit=5&offset=10`);
    expect(page.rows).toHaveLength(5);
    expect(page.rows[0].n).toBe(11);
    expect(page.total).toBe(50);

    const all = await json(`/api/datasets/${id}?limit=0`);
    expect(all.rows).toHaveLength(50);
    expect(all.truncated).toBe(false);

    expect((await api(`/api/datasets/${id}`, { method: "DELETE" })).status).toBe(200);
    expect((await api(`/api/datasets/${id}`)).status).toBe(404);
  });
});

describe("locales, references and SQL over HTTP", () => {
  signedIn("a configuration remembers its locale", async () => {
    const created = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({ name: "German", rowCount: 3, locale: "de", fields: SIMPLE_FIELDS }),
    });
    expect(created.locale).toBe("de");
    expect((await json(`/api/configs/${created.id}`)).locale).toBe("de");

    // And it is what generation actually uses, unless the call overrides it.
    const generated = await json(`/api/configs/${created.id}/generate?save=false`, { method: "POST" });
    expect(generated.rows).toHaveLength(3);
  });

  signedIn("?format=sql returns INSERT statements", async () => {
    const response = await api("/api/generate?format=sql&save=false", {
      method: "POST",
      body: JSON.stringify({ name: "Order rows", rowCount: 2, fields: SIMPLE_FIELDS }),
    });
    expect(response.headers.get("content-type")).toContain("application/sql");
    expect(response.headers.get("content-disposition")).toContain("Order-rows.sql");
    const text = await response.text();
    expect(text).toContain('INSERT INTO "order_rows" ("n", "email") VALUES');
  });

  signedIn("a stored dataset's SQL seeds the schema's table, not the run's", async () => {
    const created = await json("/api/generate", {
      method: "POST",
      body: JSON.stringify({ name: "Order rows", rowCount: 2, fields: SIMPLE_FIELDS }),
    });

    const response = await api(`/api/datasets/${created.dataset.id}/export?format=sql`);
    const text = await response.text();
    // The file is named for the run, so two exports never overwrite each other.
    expect(response.headers.get("content-disposition")).toContain("Order-rows-");
    // The table is not, or every run would land somewhere new.
    expect(text).toContain('INSERT INTO "order_rows" (');
  });

  signedIn("an unknown format is refused by name", async () => {
    const response = await api("/api/generate?format=parquet&save=false", {
      method: "POST",
      body: JSON.stringify({ name: "X", rowCount: 1, fields: SIMPLE_FIELDS }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("parquet");
  });

  signedIn("a reference field draws from a stored dataset's column", async () => {
    const parents = await json("/api/generate", {
      method: "POST",
      body: JSON.stringify({
        name: "Users",
        rowCount: 4,
        fields: [{ id: "u", name: "id", type: "autoIncrement", options: { min: 1 } }],
      }),
    });
    const datasetId = parents.dataset.id;

    // The column list is what the editor's picker offers.
    expect((await json(`/api/datasets/${datasetId}/columns`)).columns).toEqual(["id"]);

    const children = await json("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({
        name: "Orders",
        rowCount: 6,
        fields: [
          { id: "o", name: "order_id", type: "autoIncrement" },
          { id: "r", name: "user_id", type: "reference", options: { refDataset: datasetId, refField: "id", refMode: "cycle" } },
        ],
      }),
    });
    // The source column holds numbers, so the foreign key is a number too.
    expect(children.rows.map((row: any) => row.user_id)).toEqual([1, 2, 3, 4, 1, 2]);
  });

  signedIn("a reference to a dataset that is not yours 404s", async () => {
    const response = await api("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({
        name: "Orders",
        rowCount: 1,
        fields: [
          { id: "r", name: "user_id", type: "reference", options: { refDataset: "ds_nope", refField: "id" } },
        ],
      }),
    });
    expect(response.status).toBe(404);
    expect((await response.json()).error).toContain("ds_nope");
  });

  signedIn("a condition that names nothing is a 400, not a silent null column", async () => {
    const response = await api("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({
        name: "X",
        rowCount: 1,
        fields: [{ id: "a", name: "note", type: "sentence", options: { when: "ghost == 1" } }],
      }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("ghost");
  });

  signedIn("GET /api/field-types carries the locale and bundle catalogs", async () => {
    const body = await json("/api/field-types");
    expect(body.types.length).toBeGreaterThan(150);
    expect(body.locales.some((l: any) => l.code === "de")).toBe(true);
    expect(body.bundles.find((b: any) => b.kind === "person").columns).toContain("email");
    expect(body.edgeCaseVariants).toContain("injection");
  });
});

describe("field mappings between configurations", () => {
  /** A configuration, generated once so a mapping onto it can resolve. */
  async function seeded(name: string, rows: number) {
    const config = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name,
        rowCount: rows,
        fields: [{ id: "u", name: "id", type: "autoIncrement", options: { min: 1 } }],
      }),
    });
    await json(`/api/configs/${config.id}/generate`, { method: "POST" });
    return config;
  }

  signedIn("a mapping is stored with the configuration and comes back with it", async () => {
    const source = await seeded("Mapping source", 3);
    const orders = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name: "Mapped orders",
        rowCount: 2,
        fields: [{ id: "o", name: "user_id", type: "uuid" }],
        mappings: [
          { field: "user_id", fromConfig: source.id, fromConfigName: source.name, fromField: "id", mode: "cycle" },
        ],
      }),
    });

    expect(orders.mappings).toHaveLength(1);
    expect(orders.mappings[0]).toMatchObject({ field: "user_id", fromField: "id", mode: "cycle" });
    // An id is minted where the caller sent none, so the editor has a key.
    expect(orders.mappings[0].id).toBeTruthy();
    expect((await json(`/api/configs/${orders.id}`)).mappings).toHaveLength(1);
  });

  signedIn("generating from the stored schema draws the mapped column from the source", async () => {
    const source = await seeded("Cycle source", 4);
    const orders = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name: "Cycle orders",
        rowCount: 6,
        // Declared a uuid: the mapping is what decides where the values come
        // from, whatever the field would otherwise have generated.
        fields: [{ id: "o", name: "user_id", type: "uuid" }],
        mappings: [{ field: "user_id", fromConfig: source.id, fromField: "id", mode: "cycle" }],
      }),
    });

    const run = await json(`/api/configs/${orders.id}/generate?save=false`, { method: "POST" });
    expect(run.rows.map((row: any) => row.user_id)).toEqual([1, 2, 3, 4, 1, 2]);
  });

  signedIn("the pool follows the source: regenerating it changes what resolves", async () => {
    const source = await seeded("Moving source", 2);
    const body = {
      name: "Follower",
      rowCount: 3,
      fields: [{ id: "o", name: "user_id", type: "uuid" }],
      mappings: [{ field: "user_id", fromConfig: source.id, fromField: "id", mode: "cycle" }],
    };
    const first = await json("/api/generate?save=false", { method: "POST", body: JSON.stringify(body) });
    expect(first.rows.map((row: any) => row.user_id)).toEqual([1, 2, 1]);

    // A later, longer run of the source becomes the newest dataset, and the
    // mapping picks it up with nothing re-pointed.
    await json(`/api/configs/${source.id}/generate?rows=5`, { method: "POST" });
    const second = await json("/api/generate?save=false", { method: "POST", body: JSON.stringify(body) });
    expect(second.rows.map((row: any) => row.user_id)).toEqual([1, 2, 3]);
  });

  signedIn("a mapping beats a reference field pointing somewhere else", async () => {
    const source = await seeded("Winning source", 3);
    const other = await json("/api/generate", {
      method: "POST",
      body: JSON.stringify({
        name: "Losing source",
        rowCount: 2,
        fields: [{ id: "u", name: "id", type: "autoIncrement", options: { min: 100 } }],
      }),
    });

    const run = await json("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({
        name: "Contested",
        rowCount: 3,
        fields: [
          {
            id: "o",
            name: "user_id",
            type: "reference",
            options: { refDataset: other.dataset.id, refField: "id", refMode: "cycle" },
          },
        ],
        mappings: [{ field: "user_id", fromConfig: source.id, fromField: "id", mode: "cycle" }],
      }),
    });
    expect(run.rows.map((row: any) => row.user_id)).toEqual([1, 2, 3]);
  });

  signedIn("a mapping onto a configuration with no data yet fails the run with 409", async () => {
    const empty = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name: "Never generated",
        rowCount: 2,
        fields: [{ id: "u", name: "id", type: "uuid" }],
      }),
    });

    const response = await api("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({
        name: "Hopeful",
        rowCount: 1,
        fields: [{ id: "o", name: "user_id", type: "uuid" }],
        mappings: [{ field: "user_id", fromConfig: empty.id, fromConfigName: empty.name, fromField: "id" }],
      }),
    });
    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("Never generated");
  });

  signedIn("a mapping onto a field the schema does not have is a 400", async () => {
    const source = await seeded("Dangling source", 2);
    const response = await api("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({
        name: "Dangling",
        rowCount: 1,
        fields: [{ id: "o", name: "user_id", type: "uuid" }],
        mappings: [{ field: "buyer_id", fromConfig: source.id, fromField: "id" }],
      }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("buyer_id");
  });

  signedIn("a mapping onto a column that holds nothing says which column", async () => {
    const source = await seeded("Thin source", 2);
    const response = await api("/api/generate?save=false", {
      method: "POST",
      body: JSON.stringify({
        name: "Thin",
        rowCount: 1,
        fields: [{ id: "o", name: "user_id", type: "uuid" }],
        mappings: [{ field: "user_id", fromConfig: source.id, fromField: "ghost" }],
      }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("ghost");
  });

  signedIn("two mappings onto one field are refused when the configuration is saved", async () => {
    const source = await seeded("Twice source", 2);
    const response = await api("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name: "Twice",
        rowCount: 1,
        fields: [{ id: "o", name: "user_id", type: "uuid" }],
        mappings: [
          { field: "user_id", fromConfig: source.id, fromField: "id" },
          { field: "user_id", fromConfig: source.id, fromField: "id", mode: "cycle" },
        ],
      }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("mapped twice");
  });

  signedIn("GET /api/configs/:id/columns reads the newest dataset's columns", async () => {
    const source = await seeded("Columns source", 2);
    const body = await json(`/api/configs/${source.id}/columns`);
    expect(body.columns).toEqual(["id"]);
    expect(body.dataset).toMatchObject({ rowCount: 2 });
  });

  signedIn("a configuration never generated answers with its schema's columns and no dataset", async () => {
    const config = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name: "Ungenerated columns",
        rowCount: 1,
        fields: [
          { id: "a", name: "id", type: "uuid" },
          { id: "b", name: "who", type: "bundle", options: { bundle: "person" } },
        ],
      }),
    });
    const body = await json(`/api/configs/${config.id}/columns`);
    expect(body.dataset).toBeNull();
    // A bundle spreads, so the columns are the ones the rows will carry.
    expect(body.columns).toContain("who.email");
    expect(body.columns).toContain("id");
  });

  signedIn("columns of a configuration that is not yours 404s", async () => {
    const response = await api("/api/configs/cfg_nope/columns");
    expect(response.status).toBe(404);
  });

  signedIn("an exported configuration carries its mappings, and re-imports with them", async () => {
    const source = await seeded("Export source", 2);
    const orders = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name: `Exported mappings ${suffix}`,
        rowCount: 2,
        fields: [{ id: "o", name: "user_id", type: "uuid" }],
        mappings: [
          { field: "user_id", fromConfig: source.id, fromConfigName: source.name, fromField: "id", mode: "unique" },
        ],
      }),
    });

    const file = await json(`/api/configs/${orders.id}/export`);
    expect(file.mappings).toHaveLength(1);
    expect(file.mappings[0]).toMatchObject({ fromConfigName: source.name, mode: "unique" });

    const reimported = await json("/api/configs/import", { method: "POST", body: JSON.stringify(file) });
    expect(reimported.mappings[0]).toMatchObject({ field: "user_id", fromField: "id", mode: "unique" });
  });

  signedIn("an imported file whose mapping names an absent field is refused", async () => {
    const response = await api("/api/configs/import", {
      method: "POST",
      body: JSON.stringify({
        kind: "dummy-data-generator/config",
        name: "Bad import",
        fields: [{ name: "user_id", type: "uuid" }],
        mappings: [{ field: "buyer_id", fromConfig: "cfg_x", fromField: "id" }],
      }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("buyer_id");
  });
});

describe("script templates", () => {
  const PLACEHOLDER = "${GENERATED_DATASET}";

  /** A saved template plus a saved dataset — what rendering needs. */
  async function fixture(body: string, name = `tpl-${Math.random().toString(36).slice(2, 8)}`) {
    const template = await json("/api/script-templates", { method: "POST", body: JSON.stringify({ name, body }) });
    const generated = await json("/api/generate", {
      method: "POST",
      body: JSON.stringify({ name: "Script source", rowCount: 2, seed: "s", fields: SIMPLE_FIELDS }),
    });
    return { template, datasetId: generated.dataset.id as string };
  }

  signedIn("supports the full CRUD lifecycle", async () => {
    const created = await json("/api/script-templates", {
      method: "POST",
      body: JSON.stringify({ name: "Seed incidents", body: `const rows = ${PLACEHOLDER};` }),
    });
    expect(created.id).toStartWith("tpl_");
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect((await json(`/api/script-templates/${created.id}`)).name).toBe("Seed incidents");
    expect((await json("/api/script-templates")).some((t: any) => t.id === created.id)).toBe(true);

    const updated = await json(`/api/script-templates/${created.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Renamed", body: "// empty" }),
    });
    expect([updated.name, updated.body]).toEqual(["Renamed", "// empty"]);

    expect(await json(`/api/script-templates/${created.id}`, { method: "DELETE" })).toEqual({ ok: true });
    expect((await api(`/api/script-templates/${created.id}`)).status).toBe(404);
  });

  signedIn("renders a dataset into the template at the placeholder", async () => {
    const { template, datasetId } = await fixture(`const rows = ${PLACEHOLDER};\nrows.forEach(console.log);`);

    const response = await api(`/api/datasets/${datasetId}/script?templateId=${template.id}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/javascript");
    expect(response.headers.get("content-disposition")).toContain(".js");

    const script = await response.text();
    expect(script).not.toContain(PLACEHOLDER);
    expect(script.endsWith("rows.forEach(console.log);")).toBe(true);

    // The substituted text is exactly the JSON export of the same dataset.
    const exported = await (await api(`/api/datasets/${datasetId}/export?format=json`)).text();
    expect(script).toBe(`const rows = ${exported};\nrows.forEach(console.log);`);
    expect(JSON.parse(exported)).toHaveLength(2);
  });

  signedIn("a template can reach the run and the configuration behind it", async () => {
    const config = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({ name: "Ledger", rowCount: 4, seed: "steady", locale: "de", fields: SIMPLE_FIELDS }),
    });
    const generated = await json(`/api/configs/${config.id}/generate`, { method: "POST" });

    const template = await json("/api/script-templates", {
      method: "POST",
      body: JSON.stringify({
        name: `about-${Math.random().toString(36).slice(2, 8)}`,
        body: [
          "const about = {",
          "  dataset: ${DATASET_NAME},",
          "  id: ${DATASET_ID},",
          "  rows: ${ROW_COUNT},",
          "  fields: ${FIELD_COUNT},",
          "  columns: ${COLUMN_NAMES},",
          "  at: ${GENERATED_AT},",
          "  config: ${CONFIG_NAME},",
          "  seed: ${CONFIG_SEED},",
          "  locale: ${CONFIG_LOCALE},",
          "  schema: ${CONFIG_FIELDS},",
          "};",
        ].join("\n"),
      }),
    });

    const script = await (
      await api(`/api/datasets/${generated.dataset.id}/script?templateId=${template.id}`)
    ).text();

    // Every placeholder resolved, and what came back is a literal in each case.
    expect(script).not.toContain("${");
    expect(script).toContain(`dataset: ${JSON.stringify(generated.dataset.name)},`);
    expect(script).toContain(`id: "${generated.dataset.id}",`);
    expect(script).toContain("rows: 4,");
    expect(script).toContain("fields: 2,");
    // Sorted, not in schema order: a stored dataset comes back through
    // PocketBase with its keys sorted (see lib/rows.ts).
    expect(script).toContain('columns: ["email","n"],');
    expect(script).toContain('config: "Ledger",');
    expect(script).toContain('seed: "steady",');
    expect(script).toContain('locale: "de",');
    expect(script).toContain('schema: [{"name":"n","type":"autoIncrement"},{"name":"email","type":"email"}],');
  });

  signedIn("a template can read the configuration's metadata", async () => {
    const config = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name: "Tagged",
        rowCount: 2,
        fields: SIMPLE_FIELDS,
        metadata: { team: "billing", env: "staging" },
      }),
    });
    const generated = await json(`/api/configs/${config.id}/generate`, { method: "POST" });

    const template = await json("/api/script-templates", {
      method: "POST",
      body: JSON.stringify({
        name: `meta-${Math.random().toString(36).slice(2, 8)}`,
        body: "const meta = ${CONFIG_METADATA};",
      }),
    });

    const script = await (
      await api(`/api/datasets/${generated.dataset.id}/script?templateId=${template.id}`)
    ).text();
    // Key-sorted, not in the order they were typed: a json column comes back
    // from PocketBase with its keys sorted (the same thing ${COLUMN_NAMES} sees).
    expect(script).toBe('const meta = {"env":"staging","team":"billing"};');
  });

  signedIn("a dataset with no configuration renders those placeholders as null", async () => {
    const { template, datasetId } = await fixture("const config = ${CONFIG_NAME}; const rows = ${ROW_COUNT};");
    const script = await (await api(`/api/datasets/${datasetId}/script?templateId=${template.id}`)).text();
    // Inline schemas have no configuration to name, and null is still a literal.
    expect(script).toBe("const config = null; const rows = 2;");
  });

  signedIn("reports a missing template, dataset or templateId", async () => {
    const { template, datasetId } = await fixture(PLACEHOLDER);

    const missingParam = await api(`/api/datasets/${datasetId}/script`);
    expect(missingParam.status).toBe(400);
    expect((await missingParam.json()).error).toMatch(/templateId/);

    expect((await api(`/api/datasets/${datasetId}/script?templateId=tpl_nope`)).status).toBe(404);
    expect((await api(`/api/datasets/ds_nope/script?templateId=${template.id}`)).status).toBe(404);
  });

  signedIn("requires a name", async () => {
    const response = await api("/api/script-templates", { method: "POST", body: JSON.stringify({ body: "x" }) });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/name is required/);
  });

  signedIn("counts templates in /api/meta", async () => {
    expect((await json("/api/meta")).scriptTemplates).toBeGreaterThan(0);
  });
});

describe("notes", () => {
  signedIn("supports the full CRUD lifecycle", async () => {
    const created = await json("/api/notes", {
      method: "POST",
      body: JSON.stringify({ title: "Demo prep", body: "Nothing yet." }),
    });
    expect(created.id).toStartWith("note_");
    expect(created.ownerId).toBeTruthy();
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect((await json(`/api/notes/${created.id}`)).title).toBe("Demo prep");
    expect((await json("/api/notes")).some((n: any) => n.id === created.id)).toBe(true);

    const updated = await json(`/api/notes/${created.id}`, {
      method: "PUT",
      body: JSON.stringify({ title: "Demo prep (revised)", body: "## Later" }),
    });
    expect([updated.title, updated.body]).toEqual(["Demo prep (revised)", "## Later"]);

    expect(await json(`/api/notes/${created.id}`, { method: "DELETE" })).toEqual({ ok: true });
    expect((await api(`/api/notes/${created.id}`)).status).toBe(404);
  });

  signedIn("requires a title", async () => {
    const response = await api("/api/notes", { method: "POST", body: JSON.stringify({ body: "orphan" }) });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/title is required/);
  });

  signedIn("resolves what a note's references point at, by their current names", async () => {
    const config = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({ name: "Referenced", rowCount: 2, fields: SIMPLE_FIELDS }),
    });
    const generated = await json(`/api/configs/${config.id}/generate`, { method: "POST" });
    const template = await json("/api/script-templates", {
      method: "POST",
      body: JSON.stringify({ name: "Referenced template", body: "// one\n// two" }),
    });

    const { references } = await json("/api/notes/references", {
      method: "POST",
      body: JSON.stringify({ refs: [config.id, generated.dataset.id, template.id] }),
    });

    expect(references.map((r: any) => [r.kind, r.label, r.found])).toEqual([
      ["config", "Referenced", true],
      ["dataset", generated.dataset.name, true],
      ["script-template", "Referenced template", true],
    ]);
    expect(references[0].detail).toBe("2 fields");

    // The name is read at resolve time, which is the reason a note stores the
    // id and not the name: renaming the schema renames every mention of it.
    await json(`/api/configs/${config.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Renamed", rowCount: 2, fields: SIMPLE_FIELDS }),
    });
    const after = await json("/api/notes/references", {
      method: "POST",
      body: JSON.stringify({ refs: [config.id] }),
    });
    expect(after.references[0].label).toBe("Renamed");
  });

  signedIn("says so when a reference points at nothing it can reach", async () => {
    const { references } = await json("/api/notes/references", {
      method: "POST",
      body: JSON.stringify({ refs: ["cfg_gone", "user_1a2b", "not an id"] }),
    });

    // Only the first is a reference at all: `user_1a2b` names no collection a
    // note can point at, and the third is not an id. Both are dropped before
    // anything is read — the page marks them broken without asking.
    expect(references.map((r: any) => [r.id, r.found])).toEqual([["cfg_gone", false]]);
    expect(references[0].label).toBe("cfg_gone");
  });

  signedIn("refuses more references than a note is allowed to resolve at once", async () => {
    const response = await api("/api/notes/references", {
      method: "POST",
      body: JSON.stringify({ refs: Array.from({ length: 61 }, (_, index) => `cfg_${index}`) }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/at most 60/i);
  });

  signedIn("resolves a field of a referenced record, and tables what is an array", async () => {
    const config = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({
        name: "Fielded",
        rowCount: 3,
        seed: "steady",
        fields: SIMPLE_FIELDS,
        metadata: { team: "billing" },
      }),
    });
    const generated = await json(`/api/configs/${config.id}/generate`, { method: "POST" });

    const { references } = await json("/api/notes/references", {
      method: "POST",
      body: JSON.stringify({
        refs: [`${config.id}#rowCount`, `${config.id}#fields`, `${config.id}#metadata`, `${generated.dataset.id}#rows`],
      }),
    });
    const [rowCount, fields, metadata, rows] = references;

    // A scalar reads inline; everything else is a table of strings.
    expect(rowCount.field).toEqual({ path: "rowCount", shape: "value", value: "3" });

    expect(fields.field.shape).toBe("table");
    expect(fields.field.columns).toContain("name");
    expect(fields.field.columns).toContain("type");
    expect(fields.field.total).toBe(2);

    // An object is a table of what it holds.
    expect(metadata.field).toMatchObject({ shape: "table", columns: ["key", "value"], rows: [["team", "billing"]] });

    expect(rows.field.shape).toBe("table");
    expect(rows.field.columns.sort()).toEqual(["email", "n"]);
    expect(rows.field.rows).toHaveLength(3);
    expect(rows.field.total).toBe(3);
    expect(rows.field.truncated).toBe(false);
  });

  signedIn("plucks one column out of the rows with a dotted path", async () => {
    const generated = await json("/api/generate", {
      method: "POST",
      body: JSON.stringify({ name: "Plucked", rowCount: 4, seed: "s", fields: SIMPLE_FIELDS }),
    });

    const { references } = await json("/api/notes/references", {
      method: "POST",
      body: JSON.stringify({ refs: [`${generated.dataset.id}#rows.email`] }),
    });

    // One column, named for what was asked for, one cell a row.
    expect(references[0].field.columns).toEqual(["email"]);
    expect(references[0].field.rows).toHaveLength(4);
    expect(references[0].field.rows[0][0]).toContain("@");
  });

  signedIn("shows a window on a long array, and says how long it really is", async () => {
    const generated = await json("/api/generate", {
      method: "POST",
      body: JSON.stringify({ name: "Long", rowCount: 200, seed: "s", fields: SIMPLE_FIELDS }),
    });

    const { references } = await json("/api/notes/references", {
      method: "POST",
      body: JSON.stringify({ refs: [`${generated.dataset.id}#rows`] }),
    });

    // The note quotes a page of it; the dataset's own export has all of it.
    expect(references[0].field.rows).toHaveLength(50);
    expect(references[0].field.total).toBe(200);
    expect(references[0].field.truncated).toBe(true);
  });

  signedIn("a field the record does not have resolves as missing, not as an error", async () => {
    const config = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({ name: "Sparse", rowCount: 2, fields: SIMPLE_FIELDS }),
    });

    const { references } = await json("/api/notes/references", {
      method: "POST",
      body: JSON.stringify({ refs: [`${config.id}#nope`, `${config.id}#__proto__`, `${config.id}#ownerId`] }),
    });

    // The last two matter: a note may not climb the prototype chain, and may
    // not reach a property the field list does not offer.
    expect(references.map((r: any) => r.field.shape)).toEqual(["missing", "missing", "missing"]);
    // The record itself still resolved — only the path inside it did not.
    expect(references[0].found).toBe(true);
  });

  signedIn("a field of a record that is not yours stays as unreachable as the record", async () => {
    const bob = await register(`fields-${suffix}@example.com`);
    const mine = await json("/api/configs", {
      method: "POST",
      body: JSON.stringify({ name: "Alice's fields", rowCount: 2, fields: SIMPLE_FIELDS }),
    });

    const { references } = await json("/api/notes/references", {
      method: "POST",
      cookie: bob,
      body: JSON.stringify({ refs: [`${mine.id}#fields`] }),
    });
    expect(references[0]).toMatchObject({ found: false, label: mine.id });
    expect(JSON.stringify(references)).not.toContain("Alice's fields");
  });

  signedIn("downloads a note as Markdown", async () => {
    const note = await json("/api/notes", {
      method: "POST",
      body: JSON.stringify({ title: "Seeding notes", body: "See [[cfg_1a2b]]." }),
    });

    const response = await api(`/api/notes/${note.id}/export`);
    expect(response.headers.get("content-type")).toContain("text/markdown");
    expect(response.headers.get("content-disposition")).toContain("seeding-notes.md");
    // References travel as written: the file is the note, not a rendering of it.
    expect(await response.text()).toBe("# Seeding notes\n\nSee [[cfg_1a2b]].\n");
  });

  signedIn("keeps one account's notes away from another, and out of its counts", async () => {
    const bob = await register(`notes-${suffix}@example.com`);
    const mine = await json("/api/notes", {
      method: "POST",
      body: JSON.stringify({ title: "Private", body: "Mine alone." }),
    });

    expect((await json("/api/notes", { cookie: bob })).map((n: any) => n.id)).not.toContain(mine.id);
    for (const [method, path] of [
      ["GET", `/api/notes/${mine.id}`],
      ["GET", `/api/notes/${mine.id}/export`],
      ["DELETE", `/api/notes/${mine.id}`],
    ] as const) {
      expect([path, (await api(path, { method, cookie: bob })).status]).toEqual([path, 404]);
    }

    // Not even by name: a reference resolved as Bob finds nothing.
    const { references } = await json("/api/notes/references", {
      method: "POST",
      cookie: bob,
      body: JSON.stringify({ refs: [mine.id] }),
    });
    expect(references[0]).toMatchObject({ found: false, label: mine.id });

    expect((await json("/api/meta", { cookie: bob })).notes).toBe(0);
    expect((await json("/api/meta")).notes).toBeGreaterThan(0);
  });
});

describe("preferences", () => {
  /** Its own account, so the defaults are untouched when the test starts. */
  let session = "";

  beforeAll(async () => {
    if (!pocketbase.available) return;
    session = await register(`prefs-${suffix}@example.com`);
  });

  signedIn("a fresh account starts on the defaults", async () => {
    const preferences = await json("/api/preferences", { cookie: session });
    expect(preferences).toEqual(DEFAULT_PREFERENCES);
  });

  signedIn("the session carries them, so the first paint has them", async () => {
    const { user } = await json("/api/auth/me", { cookie: session });
    expect(user.preferences).toEqual(DEFAULT_PREFERENCES);
  });

  signedIn("a PUT replaces them and they survive the round trip", async () => {
    const wanted = { ...DEFAULT_PREFERENCES, theme: "dark", defaultRowCount: 500, defaultSeed: "ci" };

    const saved = await json("/api/preferences", { method: "PUT", cookie: session, body: JSON.stringify(wanted) });
    expect(saved).toEqual(wanted);
    expect(await json("/api/preferences", { cookie: session })).toEqual(wanted);

    // …and the next sign-in hands them straight back with the account.
    const { user } = await json("/api/auth/me", { cookie: session });
    expect(user.preferences).toEqual(wanted);
  });

  signedIn("the accent colour survives the round trip, and a bad one does not stick", async () => {
    const wanted = { ...DEFAULT_PREFERENCES, accentColor: "violet" };
    expect(await json("/api/preferences", { method: "PUT", cookie: session, body: JSON.stringify(wanted) })).toEqual(
      wanted,
    );

    const { user } = await json("/api/auth/me", { cookie: session });
    expect(user.preferences.accentColor).toBe("violet");

    const rejected = await json("/api/preferences", {
      method: "PUT",
      cookie: session,
      body: JSON.stringify({ ...DEFAULT_PREFERENCES, accentColor: "chartreuse" }),
    });
    expect(rejected.accentColor).toBe(DEFAULT_PREFERENCES.accentColor);
  });

  signedIn("a body full of nonsense is clamped rather than stored", async () => {
    const saved = await json("/api/preferences", {
      method: "PUT",
      cookie: session,
      body: JSON.stringify({
        theme: "chartreuse",
        defaultRowCount: 10_000_000,
        defaultFieldType: "telepathy",
        defaultTemplateId: "../../etc/passwd",
        somethingElse: "dropped",
      }),
    });

    expect(saved).toEqual({ ...DEFAULT_PREFERENCES, defaultRowCount: PREFERENCE_LIMITS.rowCount.max });
    expect(saved.somethingElse).toBeUndefined();
  });

  signedIn("one account's preferences are invisible to another", async () => {
    await json("/api/preferences", {
      method: "PUT",
      cookie: session,
      body: JSON.stringify({ ...DEFAULT_PREFERENCES, theme: "light", defaultSeed: "only-mine" }),
    });

    // Alice's are still hers, and still the defaults.
    expect(await json("/api/preferences")).toEqual(DEFAULT_PREFERENCES);
  });
});

describe("api keys", () => {
  /** Its own account, so the key list starts empty and the listings are exact. */
  let session = "";
  let key = "";
  let keyId = "";
  let ownConfig = "";
  /** One of Alice's, to prove a key reaches its owner's records and no others. */
  let othersConfig = "";

  const EMAIL = `keys-${suffix}@example.com`;

  /** A request carrying a key where every other test carries a cookie. */
  const withKey = (path: string, init: RequestInit & { key?: string } = {}) =>
    fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        "X-API-Key": init.key ?? key,
      },
    });

  const issue = (body: Record<string, unknown> = {}, cookie = session) =>
    api("/api/keys", { method: "POST", cookie, body: JSON.stringify(body) });

  beforeAll(async () => {
    if (!pocketbase.available) return;
    session = await register(EMAIL);

    ownConfig = (
      await json("/api/configs", {
        method: "POST",
        cookie: session,
        body: JSON.stringify({ name: "The key holder's schema", rowCount: 3, fields: SIMPLE_FIELDS }),
      })
    ).id;

    othersConfig = (
      await json("/api/configs", {
        method: "POST",
        body: JSON.stringify({ name: "Not the key holder's", rowCount: 3, fields: SIMPLE_FIELDS }),
      })
    ).id;

    const issued = await (await issue({ name: "ci" })).json();
    key = issued.key;
    keyId = issued.id;
  });

  signedIn("issuing hands the key over once, and nothing ever repeats it", async () => {
    expect(key).toStartWith("pk_");
    expect(key.length).toBe("pk_".length + 40);

    const listed = await json("/api/keys", { cookie: session });
    const mine = listed.find((k: any) => k.id === keyId);

    expect(mine).toBeDefined();
    expect(mine.name).toBe("ci");
    expect(mine.createdAt).not.toBe("");
    // Left out of the request, so it never expires.
    expect(mine.expiresAt).toBe("");
    // The secret was in the issuing response and is in no other, ever — the
    // field is hidden in the collection, so not even its owner can read it back.
    expect(listed.every((k: any) => k.key === undefined)).toBe(true);
  });

  signedIn("a key reaches exactly what its owner reaches, and nothing else", async () => {
    const { user } = await (await withKey("/api/auth/me")).json();
    expect(user.email).toBe(EMAIL);

    const ids = (await (await withKey("/api/configs")).json()).map((c: any) => c.id);
    expect(ids).toContain(ownConfig);
    expect(ids).not.toContain(othersConfig);

    expect((await withKey(`/api/configs/${othersConfig}`)).status).toBe(404);
  });

  signedIn("a key works against PocketBase's own API too", async () => {
    // The middleware is global, so a script can skip this server entirely and
    // still be held to the same collection rules.
    const response = await fetch(`${pocketbase.url}/api/collections/configs/records`, {
      headers: { "X-API-Key": key },
    });
    expect(response.status).toBe(200);
    expect((await response.json()).items.map((c: any) => c.id)).toEqual([ownConfig]);
  });

  signedIn("a key is refused the one thing its owner can do: managing keys", async () => {
    expect((await withKey("/api/keys")).status).toBe(403);
    expect((await withKey("/api/keys", { method: "POST", body: JSON.stringify({ name: "second" }) })).status).toBe(403);
    expect((await withKey(`/api/keys/${keyId}`, { method: "DELETE" })).status).toBe(403);

    // …including straight at PocketBase, where the hook refuses it too.
    const direct = await fetch(`${pocketbase.url}/api/ddg/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: JSON.stringify({ name: "minted by a key" }),
    });
    expect(direct.status).toBe(403);
  });

  signedIn("a key that was never issued is refused rather than ignored", async () => {
    expect((await withKey("/api/configs", { key: `pk_${"0".repeat(40)}` })).status).toBe(401);
  });

  signedIn("using a key records that it was used", async () => {
    // Every call above went through the middleware, which writes the field on
    // first use and then at most every few minutes.
    const mine = (await json("/api/keys", { cookie: session })).find((k: any) => k.id === keyId);
    expect(mine.lastUsedAt).not.toBe("");
  });

  signedIn("an expiry is recorded, and a key past it stops working", async () => {
    const issued = await (await issue({ name: "short-lived", expiresInDays: 30 })).json();
    expect(new Date(issued.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect((await withKey("/api/auth/me", { key: issued.key })).status).toBe(200);

    // Nothing but a superuser may write to the collection — which is the point,
    // so ageing the key takes the admin token the harness already has.
    const auth = await fetch(`${pocketbase.url}/api/collections/_superusers/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
    });
    const { token } = (await auth.json()) as { token: string };

    const aged = await fetch(`${pocketbase.url}/api/collections/api_keys/records/${issued.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ expires: "2020-01-01 00:00:00.000Z" }),
    });
    expect(aged.status).toBe(200);

    expect((await withKey("/api/auth/me", { key: issued.key })).status).toBe(401);
  });

  signedIn("a name that is too long, or an expiry that runs backwards, is refused", async () => {
    expect((await issue({ name: "x".repeat(101) })).status).toBe(400);
    expect((await issue({ expiresInDays: -1 })).status).toBe(400);
    expect((await issue({ expiresInDays: "next tuesday" })).status).toBe(400);
  });

  signedIn("one account cannot revoke another's key", async () => {
    // Alice's cookie is the default here, and this key is not hers.
    expect((await api(`/api/keys/${keyId}`, { method: "DELETE" })).status).toBe(404);
    expect((await withKey("/api/auth/me")).status).toBe(200);
  });

  signedIn("there is a cap, so a runaway script cannot fill the table", async () => {
    const other = await register(`capped-${suffix}@example.com`);

    // 25, from MAX_KEYS in docker/pb_hooks/lib/apiKeys.js.
    for (let issued = 1; issued < 25; issued++) {
      expect((await issue({ name: `k${issued}` }, other)).status).toBe(201);
    }
    expect((await issue({ name: "k25" }, other)).status).toBe(201);

    const refused = await issue({ name: "one too many" }, other);
    expect(refused.status).toBe(400);
    expect((await refused.json()).error).toContain("Revoke one");
  });

  signedIn("revoking takes effect on the next request", async () => {
    expect((await api(`/api/keys/${keyId}`, { method: "DELETE", cookie: session })).status).toBe(200);

    expect((await withKey("/api/auth/me")).status).toBe(401);
    expect((await json("/api/keys", { cookie: session })).map((k: any) => k.id)).not.toContain(keyId);

    // …and revoking it a second time is a 404, not a second success.
    expect((await api(`/api/keys/${keyId}`, { method: "DELETE", cookie: session })).status).toBe(404);
  });
});

describe("workspace export", () => {
  signedIn("bundles every configuration, template and note, plus the preferences", async () => {
    const session = await register(`export-${suffix}@example.com`);

    await json("/api/configs", {
      method: "POST",
      cookie: session,
      body: JSON.stringify({ name: "Exported schema", rowCount: 7, seed: "s", fields: SIMPLE_FIELDS }),
    });
    await json("/api/script-templates", {
      method: "POST",
      cookie: session,
      body: JSON.stringify({ name: "Exported template", body: "const rows = ${GENERATED_DATASET};" }),
    });
    const note = await json("/api/notes", {
      method: "POST",
      cookie: session,
      body: JSON.stringify({ title: "Exported note", body: "About [[cfg_somewhere]]." }),
    });
    await json("/api/preferences", {
      method: "PUT",
      cookie: session,
      body: JSON.stringify({ ...DEFAULT_PREFERENCES, theme: "dark" }),
    });

    const response = await api("/api/export", { cookie: session });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toMatch(/attachment; filename="ddg-workspace-\d{4}-\d{2}-\d{2}\.json"/);

    const file = await response.json();
    expect(file.kind).toBe(WORKSPACE_FILE_KIND);
    expect(file.version).toBe(WORKSPACE_FILE_VERSION);
    expect(file.preferences.theme).toBe("dark");
    expect(file.configs.map((c: any) => c.name)).toEqual(["Exported schema"]);
    expect(file.scriptTemplates).toEqual([
      { name: "Exported template", body: "const rows = ${GENERATED_DATASET};" },
    ]);
    // Notes keep their ids: a `[[…]]` reference is written against one, so an
    // export that dropped them would restore a workspace of broken sentences.
    expect(file.notes).toEqual([{ id: note.id, title: "Exported note", body: "About [[cfg_somewhere]]." }]);

    // An entry is a *.ddg.json document, so it imports on its own.
    const reimported = await api("/api/configs/import", {
      method: "POST",
      cookie: session,
      body: JSON.stringify(file.configs[0]),
    });
    expect(reimported.status).toBe(201);
    expect((await reimported.json()).name).toBe("Exported schema (2)");
  });

  signedIn("holds nothing from another account, and no dataset rows", async () => {
    const session = await register(`empty-${suffix}@example.com`);

    // Alice has records by now; this account has none but its own dataset.
    await json("/api/generate", {
      method: "POST",
      cookie: session,
      body: JSON.stringify({ name: "Private data", rowCount: 2, fields: SIMPLE_FIELDS }),
    });

    const file = await json("/api/export", { cookie: session });
    expect(file.configs).toEqual([]);
    expect(file.scriptTemplates).toEqual([]);
    expect(file.notes).toEqual([]);
    expect(JSON.stringify(file)).not.toContain("Private data");
  });
});

describe("error handling", () => {
  test("unknown API paths return JSON, never the SPA shell", async () => {
    const response = await api("/api/nope");
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect((await response.json()).error).toContain("No such endpoint");
  });

  signedIn("malformed bodies and params are reported clearly", async () => {
    const cases: [string, RequestInit, RegExp][] = [
      ["/api/generate", { method: "POST", body: "{oops" }, /valid JSON/],
      ["/api/generate", { method: "POST", body: JSON.stringify({ fields: "x" }) }, /must be an array/],
      ["/api/generate?format=xml", { method: "POST", body: JSON.stringify({ fields: SIMPLE_FIELDS }) }, /csv.*json/],
      ["/api/generate?limit=abc", { method: "POST", body: JSON.stringify({ fields: SIMPLE_FIELDS }) }, /must be a number/],
      ["/api/configs/import", { method: "POST", body: JSON.stringify({ fields: [] }) }, /no fields/],
    ];
    for (const [path, init, pattern] of cases) {
      const response = await api(path, init);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toMatch(pattern);
    }
  });

  test("the SPA is still served for non-API routes", async () => {
    const response = await fetch(`${BASE}/some/client/route`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });
});
