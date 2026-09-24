/**
 * The upgrade path from the single-tenant version.
 *
 * Records made before accounts existed have no owner, so no rule matches them
 * and nobody can see them. The first account to register inherits them
 * (docker/pb_hooks/setup/adopt.js). This test is here because that hook runs
 * inside PocketBase's own JavaScript VM, where a handler body cannot see its
 * file's scope — a mistake that registers perfectly and only shows up against
 * a database that actually has something to adopt.
 *
 * It needs a PocketBase of its own: adoption happens once, for the first
 * account, and the main API suite has already registered several.
 */
import { afterAll, beforeAll, expect, test } from "bun:test";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, startTestPocketBase } from "./testPocketBase";

const PORT = 3600 + Math.floor(Math.random() * 300);
const BASE = `http://localhost:${PORT}`;

const pocketbase = await startTestPocketBase();
const withDb = pocketbase.available ? test : test.skip;

let server: ReturnType<typeof Bun.spawn>;

/** Writes a record with no owner, the way the pre-accounts version did. */
async function seedOrphan(): Promise<string> {
  const auth = await fetch(`${pocketbase.url}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
  });
  const { token } = (await auth.json()) as { token: string };

  const created = await fetch(`${pocketbase.url}/api/collections/configs/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({
      id: "cfg_legacy01",
      name: "From before accounts",
      schema: [{ id: "a", name: "email", type: "email" }],
      rowCount: 5,
      // No owner: exactly what the old single-tenant server wrote.
    }),
  });
  expect(created.status).toBe(200);
  return "cfg_legacy01";
}

beforeAll(async () => {
  if (!pocketbase.available) return;

  server = Bun.spawn(["bun", "src/index.ts"], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "production",
      POCKETBASE_URL: pocketbase.url,
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${BASE}/api/health`)).ok) return;
    } catch {
      // not listening yet
    }
    await Bun.sleep(50);
  }
  throw new Error("server did not start");
});

afterAll(async () => {
  server?.kill();
  await pocketbase.stop();
});

withDb("the first account inherits the records that predate accounts", async () => {
  const orphan = await seedOrphan();

  const first = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "first@example.com", password: "test-password-123" }),
  });
  expect(first.status).toBe(201);
  const firstCookie = (first.headers.get("set-cookie") ?? "").split(";")[0]!;

  const mine = (await (await fetch(`${BASE}/api/configs`, { headers: { cookie: firstCookie } })).json()) as any[];
  expect(mine.map(config => config.id)).toContain(orphan);
  expect(mine.find(config => config.id === orphan).name).toBe("From before accounts");

  // And the second account inherits nothing.
  const second = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "second@example.com", password: "test-password-123" }),
  });
  const secondCookie = (second.headers.get("set-cookie") ?? "").split(";")[0]!;

  const theirs = (await (await fetch(`${BASE}/api/configs`, { headers: { cookie: secondCookie } })).json()) as any[];
  expect(theirs).toEqual([]);
});
