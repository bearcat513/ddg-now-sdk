import { describe, expect, test } from "bun:test";
import {
  DEFAULT_TELEGRAM_SETTINGS,
  escapeHtml,
  isBotToken,
  isChatId,
  normalizeTelegramSettings,
  notificationText,
  TELEGRAM_LIMITS,
  testMessageText,
  type GenerationEvent,
} from "./telegram";

const generated = (over: Partial<Extract<GenerationEvent, { kind: "generated" }>> = {}): GenerationEvent => ({
  kind: "generated",
  name: "Customers · 2026-09-19T09:00:00Z",
  rows: 25_000,
  fields: 9,
  configName: "Customers",
  seed: "ci",
  durationMs: 1234,
  viaApiKey: true,
  datasetId: "ds_abc123",
  ...over,
});

describe("a bot token", () => {
  test("is recognised in the shape BotFather issues", () => {
    expect(isBotToken("123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw")).toBe(true);
    expect(isBotToken("  123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw  ")).toBe(true);
  });

  test("and anything else is refused before it is stored", () => {
    for (const wrong of ["", "not-a-token", "123:short", "abc:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"]) {
      expect(isBotToken(wrong)).toBe(false);
    }
  });
});

describe("a chat id", () => {
  test("is a user, a group, or a channel by name", () => {
    expect(isChatId("123456789")).toBe(true);
    expect(isChatId("-1001234567890")).toBe(true); // a supergroup
    expect(isChatId("@release_bots")).toBe(true);
  });

  test("and nothing else", () => {
    for (const wrong of ["", "me", "@sh", "12 34", "https://t.me/x"]) expect(isChatId(wrong)).toBe(false);
  });
});

describe("normalizing what was stored or sent", () => {
  test("fills in a set nobody has saved yet", () => {
    expect(normalizeTelegramSettings(undefined)).toEqual(DEFAULT_TELEGRAM_SETTINGS);
    expect(normalizeTelegramSettings("nonsense")).toEqual(DEFAULT_TELEGRAM_SETTINGS);
  });

  test("keeps what was sent, where it is usable", () => {
    const settings = normalizeTelegramSettings({
      enabled: true,
      chatId: "-1001234567890",
      chatLabel: "Release bots",
      events: { generated: false, failed: true },
      minRows: 1000,
      apiKeyOnly: false,
    });
    expect(settings).toEqual({
      enabled: true,
      chatId: "-1001234567890",
      chatLabel: "Release bots",
      events: { generated: false, failed: true },
      minRows: 1000,
      apiKeyOnly: false,
    });
  });

  test("drops a chat id that could only fail later", () => {
    expect(normalizeTelegramSettings({ chatId: "not a chat" }).chatId).toBe("");
  });

  test("clamps the row floor rather than refusing it", () => {
    expect(normalizeTelegramSettings({ minRows: -5 }).minRows).toBe(TELEGRAM_LIMITS.minRows.min);
    expect(normalizeTelegramSettings({ minRows: 10_000_000 }).minRows).toBe(TELEGRAM_LIMITS.minRows.max);
    expect(normalizeTelegramSettings({ minRows: "1200" }).minRows).toBe(1200);
    expect(normalizeTelegramSettings({ minRows: "soon" }).minRows).toBe(DEFAULT_TELEGRAM_SETTINGS.minRows);
  });

  test("takes only booleans for the switches, so a truthy string is not an opt-in", () => {
    const settings = normalizeTelegramSettings({ enabled: "yes", events: { generated: 0 } });
    expect(settings.enabled).toBe(false);
    expect(settings.events.generated).toBe(DEFAULT_TELEGRAM_SETTINGS.events.generated);
  });
});

describe("the message", () => {
  test("says what ran, how much of it, and how long it took", () => {
    const text = notificationText(generated());
    expect(text).toContain("Customers");
    expect(text).toContain("25,000 rows");
    expect(text).toContain("9 fields");
    expect(text).toContain("1.2s");
    expect(text).toContain("ds_abc123");
    expect(text).toContain("via API key");
  });

  test("says when a run was not stored, rather than naming a dataset that is not there", () => {
    expect(notificationText(generated({ datasetId: "" }))).toContain("not stored");
  });

  test("times a fast run in milliseconds", () => {
    expect(notificationText(generated({ durationMs: 40 }))).toContain("40ms");
  });

  test("carries the reason a run failed", () => {
    const text = notificationText({
      kind: "failed",
      name: "Orders",
      reason: "enum choice script: fetch failed",
      viaApiKey: false,
    });
    expect(text).toContain("Orders");
    expect(text).toContain("generation failed");
    expect(text).toContain("enum choice script: fetch failed");
    expect(text).not.toContain("via API key");
  });

  test("escapes the parts an account wrote, since the message is HTML", () => {
    // A schema named after a generic, and an error quoting one, are both
    // ordinary — and both end the message early if they go through unescaped.
    const text = notificationText(generated({ name: "Orders <Item> & co", configName: "a > b" }));
    expect(text).toContain("Orders &lt;Item&gt; &amp; co");
    expect(text).not.toContain("<Item>");
    expect(escapeHtml("<b>")).toBe("&lt;b&gt;");
  });

  test("never exceeds what Telegram will accept", () => {
    const text = notificationText(generated({ name: "x".repeat(9000) }));
    expect(text.length).toBeLessThanOrEqual(TELEGRAM_LIMITS.messageLength);
  });

  test("names the account in the test message, so a shared bot is unambiguous", () => {
    expect(testMessageText("you@example.com")).toContain("you@example.com");
  });
});
