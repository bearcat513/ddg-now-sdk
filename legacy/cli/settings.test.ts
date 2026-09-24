import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DEFAULT_URL, readSettings, resolve, settingsPath, writeSettings } from "./settings";

const scratch = await mkdtemp(path.join(tmpdir(), "ddg-cli-"));
afterAll(() => rm(scratch, { recursive: true, force: true }));

describe("settingsPath", () => {
  test("XDG wins, then ~/.config, and DDG_CONFIG beats both", () => {
    expect(settingsPath({ XDG_CONFIG_HOME: "/xdg" }, "/home/me")).toBe("/xdg/ddg/config.json");
    expect(settingsPath({}, "/home/me")).toBe("/home/me/.config/ddg/config.json");
    expect(settingsPath({ DDG_CONFIG: "/tmp/other.json", XDG_CONFIG_HOME: "/xdg" }, "/home/me")).toBe(
      "/tmp/other.json",
    );
  });
});

describe("the settings file", () => {
  test("it round-trips, and is readable only by its owner", async () => {
    const file = path.join(scratch, "nested", "config.json");
    await writeSettings(file, { url: "http://localhost:3000", credential: "pk_secret", email: "me@example.com" });

    expect(await readSettings(file)).toMatchObject({ credential: "pk_secret", email: "me@example.com" });
    // It holds a credential: nobody else on the machine should be able to read it.
    expect((await stat(file)).mode & 0o777).toBe(0o600);
  });

  test("a missing or mangled file reads as nothing stored", async () => {
    expect(await readSettings(path.join(scratch, "absent.json"))).toEqual({});

    const broken = path.join(scratch, "broken.json");
    await Bun.write(broken, "not json at all");
    expect(await readSettings(broken)).toEqual({});
  });
});

describe("resolve", () => {
  const stored = { url: "http://stored:3000", credential: "pk_stored" };

  test("a flag beats the environment, which beats the file", () => {
    expect(resolve({ key: "pk_flag" }, { DDG_API_KEY: "pk_env" }, stored)).toMatchObject({
      credential: { kind: "key", value: "pk_flag" },
      source: "flag",
    });
    expect(resolve({}, { DDG_API_KEY: "pk_env" }, stored)).toMatchObject({
      credential: { kind: "key", value: "pk_env" },
      source: "env",
    });
    expect(resolve({}, {}, stored)).toMatchObject({ credential: { kind: "key", value: "pk_stored" }, source: "file" });
    expect(resolve({}, {}, {})).toMatchObject({ credential: null, source: "none" });
  });

  test("the prefix decides which header a credential travels in", () => {
    // `pk_` is an API key; anything else is a PocketBase token, which is a JWT
    // and can never start with an underscore.
    expect(resolve({ key: "pk_abc" }, {}, {}).credential?.kind).toBe("key");
    expect(resolve({ token: "eyJhbGciOi.x.y" }, {}, {}).credential?.kind).toBe("token");
  });

  test("the address falls back to localhost, and a trailing slash never doubles", () => {
    expect(resolve({}, {}, {}).url).toBe(DEFAULT_URL);
    expect(resolve({ url: "http://example.com/" }, {}, {}).url).toBe("http://example.com");
    expect(resolve({}, { DDG_URL: "http://env:3000" }, stored).url).toBe("http://env:3000");
  });
});
