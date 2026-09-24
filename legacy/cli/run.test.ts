/**
 * The CLI, end to end, against a stub of the API.
 *
 * A real server needs PocketBase, a container and an account; what these tests
 * are actually about is everything between the argv and the request — which
 * header the credential travels in, which query string a flag becomes, what is
 * printed, and what the exit code says. So the API is stubbed with a few
 * routes that record what arrived, and the CLI is run against it exactly as a
 * terminal would.
 */
import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run, type Io } from "./run";
import { serializeConfigFile } from "../lib/configFile";
import { defaultFieldOptions, type Field } from "../lib/types";

const scratch = await mkdtemp(path.join(tmpdir(), "ddg-cli-run-"));

/** Every request the stub saw, so a test can assert on what was sent. */
type Seen = { method: string; path: string; query: string; headers: Headers; body: string };
let seen: Seen[] = [];

const record = async (req: Request): Promise<Seen> => {
  const url = new URL(req.url);
  const entry = {
    method: req.method,
    path: url.pathname,
    query: url.search,
    headers: req.headers,
    body: req.method === "GET" ? "" : await req.text(),
  };
  seen.push(entry);
  return entry;
};

const CONFIG = {
  id: "cfg_1a2b3c4d",
  name: "Employees",
  description: "",
  fields: [{ id: "f1", name: "email", type: "email", options: {} }],
  mappings: [],
  rowCount: 25,
  seed: "",
  locale: "",
  ownerId: "u1",
  sharedWith: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const ROWS = [{ email: "ada@example.com" }, { email: "bob@example.com" }];

const server = Bun.serve({
  port: 0,
  routes: {
    "/api/auth/me": async req => {
      await record(req);
      return Response.json({
        user: { id: "u1", email: "me@example.com", name: "Me", verified: true, createdAt: "2026-01-01T00:00:00Z" },
      });
    },

    "/api/auth/login": {
      POST: async req => {
        const entry = await record(req);
        const { password } = JSON.parse(entry.body) as { password: string };
        if (password !== "correct-horse") return Response.json({ error: "Wrong email or password." }, { status: 401 });
        return Response.json(
          { user: { email: "me@example.com", name: "Me" } },
          // The shape the real server sends: the token is only ever here.
          { headers: { "Set-Cookie": "ddg_session=tok_abc123; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800" } },
        );
      },
    },

    "/api/configs": async req => {
      await record(req);
      return Response.json([CONFIG]);
    },

    "/api/configs/:id": async req => {
      await record(req);
      return Response.json({ error: "Configuration not found." }, { status: 404 });
    },

    "/api/configs/:id/generate": {
      POST: async req => {
        const entry = await record(req);
        if (new URL(req.url).searchParams.get("format") === "csv") {
          return new Response("email\nada@example.com\nbob@example.com\n", { headers: { "Content-Type": "text/csv" } });
        }
        return Response.json({
          dataset: { id: "ds_1", name: "Employees — 1 Jan", rowCount: 2, fieldCount: 1 },
          rows: ROWS,
          total: 2,
          truncated: false,
        });
      },
    },

    "/api/generate": {
      POST: async req => {
        await record(req);
        return Response.json({
          dataset: { id: "ds_2", name: "From a file", rowCount: 2, fieldCount: 1 },
          rows: ROWS,
          total: 2,
          truncated: false,
        });
      },
    },

    "/api/openapi.json": async req => {
      await record(req);
      return Response.json({ openapi: "3.0.3" });
    },
  },
});

const url = `http://localhost:${server.port}`;

afterAll(async () => {
  await server.stop(true);
  await rm(scratch, { recursive: true, force: true });
});

/* ------------------------------ the harness ------------------------------ */

let printed: string[] = [];
let failed: string[] = [];

/** A run with no ambient environment and its own settings file. */
function io(env: Record<string, string | undefined> = {}): Io {
  return { print: (text = "") => printed.push(text), fail: text => failed.push(text), env };
}

const out = () => printed.join("\n");
const errors = () => failed.join("\n");

/** A fresh settings file per test, so no run can see another's credential. */
let settings = "";
let counter = 0;

beforeEach(() => {
  printed = [];
  failed = [];
  seen = [];
  settings = path.join(scratch, `settings-${counter++}.json`);
});

const cli = (...argv: string[]) => run([...argv, "--url", url, "--config", settings], io());

/* -------------------------------- the tests ------------------------------- */

describe("credentials", () => {
  test("an API key travels in X-API-Key and a token in Authorization", async () => {
    expect(await cli("configs", "list", "--key", "pk_test")).toBe(0);
    expect(seen[0]?.headers.get("X-API-Key")).toBe("pk_test");
    expect(seen[0]?.headers.get("Authorization")).toBeNull();

    expect(await cli("configs", "list", "--token", "eyJhbGciOi.x.y")).toBe(0);
    expect(seen[1]?.headers.get("Authorization")).toBe("eyJhbGciOi.x.y");
    expect(seen[1]?.headers.get("X-API-Key")).toBeNull();
  });

  test("a command that needs one says so before it sends anything", async () => {
    expect(await cli("configs", "list")).toBe(1);
    expect(errors()).toContain("Not signed in");
    expect(seen).toHaveLength(0);
  });

  test("a command that does not need one runs anyway", async () => {
    expect(await cli("openapi", "--out", path.join(scratch, "spec.json"))).toBe(0);
    expect(await Bun.file(path.join(scratch, "spec.json")).json()).toEqual({ openapi: "3.0.3" });
  });

  test("the environment is read when nothing was typed", async () => {
    expect(await run(["configs", "list", "--url", url, "--config", settings], io({ DDG_API_KEY: "pk_env" }))).toBe(0);
    expect(seen[0]?.headers.get("X-API-Key")).toBe("pk_env");
  });
});

describe("login", () => {
  test("it keeps the token from the cookie, and later commands use it", async () => {
    expect(await cli("login", "--email", "me@example.com", "--password", "correct-horse")).toBe(0);
    expect(out()).toContain("me@example.com");

    // Nothing is passed this time: the credential can only have come from the
    // file the login wrote.
    expect(await cli("whoami")).toBe(0);
    expect(seen.at(-1)?.headers.get("Authorization")).toBe("tok_abc123");
    expect(out()).toContain("me@example.com");
  });

  test("a refused password is the server's sentence, and exit 1", async () => {
    expect(await cli("login", "--email", "me@example.com", "--password", "hunter2")).toBe(1);
    expect(errors()).toContain("Wrong email or password.");
  });
});

describe("output", () => {
  test("a list is a table, and --json is the API's own answer", async () => {
    await cli("configs", "list", "--key", "pk_test");
    expect(out()).toContain("Employees");
    expect(out()).toContain("NAME");

    printed = [];
    await cli("configs", "list", "--key", "pk_test", "--json");
    expect(JSON.parse(out())).toEqual([CONFIG]);
  });

  test("an error from the server is printed as a sentence, with exit 1", async () => {
    expect(await cli("configs", "show", "cfg_missing", "--key", "pk_test")).toBe(1);
    expect(errors()).toContain("Configuration not found.");
  });
});

describe("generate", () => {
  test("the overrides become the query string", async () => {
    expect(await cli("generate", CONFIG.id, "--rows", "3", "--seed", "abc", "--key", "pk_test")).toBe(0);
    expect(seen[0]?.path).toBe(`/api/configs/${CONFIG.id}/generate`);
    expect(seen[0]?.query).toContain("rows=3");
    expect(seen[0]?.query).toContain("seed=abc");
    // The rows come back as a table someone can read.
    expect(out()).toContain("ada@example.com");
  });

  test("--format writes the file the server sent, byte for byte", async () => {
    const file = path.join(scratch, "rows.csv");
    expect(await cli("generate", CONFIG.id, "--format", "csv", "--out", file, "--key", "pk_test")).toBe(0);
    expect(seen[0]?.query).toContain("format=csv");
    expect(await Bun.file(file).text()).toBe("email\nada@example.com\nbob@example.com\n");
  });

  test("--no-save asks the server not to keep it", async () => {
    await cli("generate", CONFIG.id, "--no-save", "--key", "pk_test");
    expect(seen[0]?.query).toContain("save=false");
  });

  test("a schema file is parsed here, and posted as an inline schema", async () => {
    const field: Field = { id: "f1", name: "email", type: "email", options: defaultFieldOptions("email") };
    const file = path.join(scratch, "schema.ddg.json");
    await Bun.write(file, serializeConfigFile({ name: "From a file", fields: [field], rowCount: 10 }));

    expect(await cli("generate", "--file", file, "--rows", "2", "--key", "pk_test")).toBe(0);
    expect(seen[0]?.path).toBe("/api/generate");
    const body = JSON.parse(seen[0]!.body) as { rowCount: number; fields: Field[] };
    // The flag overrides what the file said, and the fields survive the trip.
    expect(body.rowCount).toBe(2);
    expect(body.fields[0]?.name).toBe("email");
  });

  test("a file that is not a schema fails here, before a request goes out", async () => {
    const file = path.join(scratch, "not-a-schema.json");
    await Bun.write(file, JSON.stringify({ hello: "world" }));

    expect(await cli("generate", "--file", file, "--key", "pk_test")).toBe(1);
    expect(errors()).toContain("fields");
    expect(seen).toHaveLength(0);
  });

  test("a configuration id and --file together is a usage error", async () => {
    expect(await cli("generate", CONFIG.id, "--file", "x.json", "--key", "pk_test")).toBe(2);
  });
});

describe("dispatch", () => {
  test("help needs no server and no credential", async () => {
    expect(await cli("help")).toBe(0);
    expect(out()).toContain("ddg <command>");

    printed = [];
    expect(await cli("help", "generate")).toBe(0);
    expect(out()).toContain("--format csv|json|sql");
  });

  test("an unknown command and an unknown subcommand both exit 2", async () => {
    expect(await cli("frobnicate")).toBe(2);
    expect(await cli("configs", "frobnicate", "--key", "pk_test")).toBe(2);
    expect(errors()).toContain("Unknown subcommand");
  });

  test("a mistyped flag is refused before anything is sent", async () => {
    expect(await cli("generate", CONFIG.id, "--fromat", "csv", "--key", "pk_test")).toBe(2);
    expect(errors()).toContain("--format");
    expect(seen).toHaveLength(0);
  });

  test("a noun on its own lists", async () => {
    expect(await cli("configs", "--key", "pk_test")).toBe(0);
    expect(seen[0]?.path).toBe("/api/configs");
  });
});
