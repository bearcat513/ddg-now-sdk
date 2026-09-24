/**
 * The two halves of sending that do not need a database: whether an event is
 * one this account asked for, and what happens at the Telegram end when it is.
 *
 * `fetch` is stubbed rather than reached — these assert the request that would
 * go out and the sentence that comes back from each way it can fail, which is
 * what `last_error` shows on the settings page.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { botIdentity, sendMessage, shouldNotify } from "./telegram";
import { ApiError } from "./http";
import { DEFAULT_TELEGRAM_SETTINGS, type GenerationEvent, type TelegramSettings } from "../lib/telegram";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** The last request the stub was handed, for asserting on. */
let sent: { url: string; body: Record<string, unknown> } | null = null;

function stubTelegram(response: unknown, status = 200) {
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    sent = { url: String(url), body: JSON.parse(String(init?.body ?? "{}")) };
    return new Response(JSON.stringify(response), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
}

const settings = (over: Partial<TelegramSettings> = {}): TelegramSettings => ({
  ...DEFAULT_TELEGRAM_SETTINGS,
  enabled: true,
  chatId: "123456789",
  ...over,
});

const generated = (over: Partial<Extract<GenerationEvent, { kind: "generated" }>> = {}): GenerationEvent => ({
  kind: "generated",
  name: "Customers",
  rows: 5_000,
  fields: 4,
  configName: "Customers",
  seed: "",
  durationMs: 900,
  viaApiKey: true,
  datasetId: "ds_1",
  ...over,
});

const failed = (viaApiKey = true): GenerationEvent => ({
  kind: "failed",
  name: "Customers",
  reason: "reference dataset not found",
  viaApiKey,
});

describe("whether to send at all", () => {
  test("says nothing while notifications are off, whatever else is set", () => {
    expect(shouldNotify(settings({ enabled: false }), generated())).toBe(false);
  });

  test("says nothing with no chat to send to", () => {
    expect(shouldNotify(settings({ chatId: "" }), generated())).toBe(false);
  });

  test("sends a finished run to an account that asked for finished runs", () => {
    expect(shouldNotify(settings(), generated())).toBe(true);
    expect(shouldNotify(settings({ events: { generated: false, failed: true } }), generated())).toBe(false);
  });

  test("sends a failure separately from a success", () => {
    expect(shouldNotify(settings({ events: { generated: false, failed: true } }), failed())).toBe(true);
    expect(shouldNotify(settings({ events: { generated: true, failed: false } }), failed())).toBe(false);
  });

  test("stays quiet for a run made in the editor when that is the preference", () => {
    // The default: the rows are already on screen, so the message is noise.
    expect(shouldNotify(settings(), generated({ viaApiKey: false }))).toBe(false);
    expect(shouldNotify(settings({ apiKeyOnly: false }), generated({ viaApiKey: false }))).toBe(true);
  });

  test("keeps a failure quiet under the same rule — a browser shows its own errors", () => {
    expect(shouldNotify(settings(), failed(false))).toBe(false);
  });

  test("holds the row floor against a run that is too small to be news", () => {
    const quiet = settings({ minRows: 10_000 });
    expect(shouldNotify(quiet, generated({ rows: 9_999 }))).toBe(false);
    expect(shouldNotify(quiet, generated({ rows: 10_000 }))).toBe(true);
    // A failure is news at any size — there are no rows to measure.
    expect(shouldNotify(quiet, failed())).toBe(true);
  });
});

describe("the call to Telegram", () => {
  test("posts the message to the bot's own endpoint", async () => {
    stubTelegram({ ok: true, result: {} });
    await sendMessage("123456:secret", "-100123", "<b>hi</b>");

    expect(sent?.url).toBe("https://api.telegram.org/bot123456:secret/sendMessage");
    expect(sent?.body).toMatchObject({
      chat_id: "-100123",
      text: "<b>hi</b>",
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  });

  test("reads the bot's own name back, which is what proves a token works", async () => {
    stubTelegram({ ok: true, result: { username: "ddg_notify_bot", first_name: "DDG" } });
    expect(await botIdentity("123456:secret")).toEqual({ username: "ddg_notify_bot", name: "DDG" });
  });

  test("passes Telegram's own wording on, since the status alone says nothing", async () => {
    stubTelegram({ ok: false, description: "Forbidden: bot was blocked by the user" }, 403);
    const failure = await sendMessage("123456:secret", "1", "hi").catch(error => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).message).toContain("bot was blocked by the user");
  });

  test("treats a refused token as something the caller can fix", async () => {
    // 401 from Telegram is a bad bot token, which is a 400 here: this server
    // is fine, and the caller's own session is not the thing at fault.
    stubTelegram({ ok: false, description: "Unauthorized" }, 401);
    const failure = (await sendMessage("123456:wrong", "1", "hi").catch(error => error)) as ApiError;
    expect(failure.status).toBe(400);
  });

  test("says so plainly when Telegram cannot be reached", async () => {
    globalThis.fetch = (async () => {
      throw new TypeError("Unable to connect");
    }) as unknown as typeof fetch;

    const failure = (await sendMessage("123456:secret", "1", "hi").catch(error => error)) as ApiError;
    expect(failure.message).toBe("Could not reach Telegram.");
    expect(failure.status).toBe(502);
  });

  test("and when it answers too slowly to wait for", async () => {
    globalThis.fetch = (async () => {
      const timeout = new Error("The operation timed out.");
      timeout.name = "TimeoutError";
      throw timeout;
    }) as unknown as typeof fetch;

    const failure = (await sendMessage("123456:secret", "1", "hi").catch(error => error)) as ApiError;
    expect(failure.message).toBe("Telegram did not answer in time.");
  });

  test("does not mistake a 200 carrying ok:false for success", async () => {
    // Telegram answers 200 with `ok: false` more often than it 4xxs.
    stubTelegram({ ok: false, description: "chat not found" });
    expect(sendMessage("123456:secret", "1", "hi")).rejects.toThrow("chat not found");
  });
});
