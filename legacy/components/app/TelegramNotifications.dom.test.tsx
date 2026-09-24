import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Registered before React is imported, so the component renders against a
// document — unless another .dom test in this process got there first, since
// registering twice throws and `bun test` runs them all together.
if (typeof document === "undefined") GlobalRegistrator.register();

// React refuses to batch updates from `act` without this.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TelegramNotifications } from "./TelegramNotifications";
import { api, type TelegramPayload } from "@/lib/api";
import { DEFAULT_TELEGRAM_SETTINGS, type TelegramState } from "@/lib/telegram";

/**
 * The panel across real renders, because what it does is nearly all effect:
 * it reads the settings on mount and writes them back on every change, and
 * the write is the part with a shape to get wrong — a toggle sends the whole
 * settings set, not just the switch that moved.
 */

const state = (over: Partial<TelegramState> = {}): TelegramState => ({
  ...DEFAULT_TELEGRAM_SETTINGS,
  hasOwnBot: false,
  serverBot: false,
  botUsername: "",
  botError: "",
  verifiedAt: "",
  lastSentAt: "",
  lastError: "",
  pending: null,
  ...over,
});

const linked = state({
  enabled: true,
  serverBot: true,
  botUsername: "ddg_notify_bot",
  chatId: "123456789",
  chatLabel: "Ryan",
  verifiedAt: "2026-09-19T08:00:00.000Z",
});

let root: Root | null = null;
let host: HTMLElement | null = null;
const original = { ...api };
/** Every settings save the panel made, in order. */
let saved: TelegramPayload[] = [];

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  Object.assign(api, original);
  saved = [];
});

/** Mounts the panel over a stubbed API and waits for its first read. */
async function mount(initial: TelegramState, over: Partial<typeof api> = {}) {
  Object.assign(api, {
    getTelegram: async () => initial,
    saveTelegram: async (body: TelegramPayload) => {
      saved.push(body);
      return { ...initial, ...body } as TelegramState;
    },
    ...over,
  });

  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(<TelegramNotifications />);
  });
  return host;
}

const text = () => host?.textContent ?? "";
const button = (label: string) =>
  Array.from(host?.querySelectorAll("button, a") ?? []).find(element =>
    element.textContent?.includes(label),
  ) as HTMLElement | undefined;
const click = async (label: string) => {
  const target = button(label);
  if (!target) throw new Error(`no control labelled "${label}" — the panel shows: ${text()}`);
  await act(async () => target.click());
};

describe("with no bot anywhere", () => {
  test("asks for a token, and says who issues one", async () => {
    await mount(state());
    expect(text()).toContain("BotFather");
    expect(host?.querySelector("#telegram-token")).toBeTruthy();
    // Nothing to configure yet: the events are meaningless without a chat.
    expect(text()).not.toContain("Tell me when");
  });

  test("will not save an empty token", async () => {
    // React's synthetic change events do not fire under this DOM, so what is
    // assertable here is the guard rather than the typing: the button is dead
    // until there is something to send, and the toggle tests below cover what
    // a save actually carries.
    await mount(state());
    expect((button("Save the token") as HTMLButtonElement).disabled).toBe(true);
    expect(saved).toHaveLength(0);
  });
});

describe("with a bot but no chat", () => {
  test("offers a pairing code rather than a chat id to guess at", async () => {
    await mount(state({ serverBot: true, botUsername: "ddg_notify_bot" }));
    expect(text()).toContain("a chat has to speak first");
    expect(button("Get a pairing code")).toBeTruthy();
  });

  test("shows the code, the link that sends it, and the way to confirm", async () => {
    const pending = { code: "K7M2P9QT", expiresAt: "2026-09-19T09:15:00.000Z", deepLink: "https://t.me/b?start=K7M2P9QT" };
    await mount(state({ serverBot: true, botUsername: "b" }), {
      pairTelegram: async () => state({ serverBot: true, botUsername: "b", pending }),
    });

    await click("Get a pairing code");
    expect(text()).toContain("K7M2P9QT");
    expect((button("Open Telegram") as HTMLAnchorElement).href).toBe(pending.deepLink);
    expect(button("I've sent it")).toBeTruthy();
  });

  test("says what to do next when the message has not arrived yet", async () => {
    const pending = { code: "K7M2P9QT", expiresAt: "2026-09-19T09:15:00.000Z", deepLink: "" };
    await mount(state({ serverBot: true, pending }), {
      confirmTelegramPairing: async () => {
        throw new Error('No message with that code yet. Send "K7M2P9QT" to the bot, then check again.');
      },
    });

    await click("I've sent it");
    expect(text()).toContain("No message with that code yet");
  });
});

describe("once a chat is linked", () => {
  test("says where the messages go, and through which bot", async () => {
    await mount(linked);
    expect(text()).toContain("Sending to Ryan");
    expect(text()).toContain("@ddg_notify_bot");
  });

  test("sends the whole settings set when one switch moves", async () => {
    // The bug this is here for: a patch that replaced the events object with
    // only the switch that changed would turn the other one off silently.
    await mount(linked);
    const failures = host!.querySelector("#telegram-failed") as HTMLInputElement;
    await act(async () => {
      failures.click();
    });

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      enabled: true,
      chatId: "123456789",
      apiKeyOnly: DEFAULT_TELEGRAM_SETTINGS.apiKeyOnly,
      events: { generated: true, failed: false },
    });
  });

  test("never sends the bot token back, since it never had it", async () => {
    await mount({ ...linked, hasOwnBot: true });
    const enabled = host!.querySelector("#telegram-enabled") as HTMLInputElement;
    await act(async () => {
      enabled.click();
    });
    expect(saved[0]).not.toHaveProperty("botToken");
  });

  test("reports a test message that did not make it", async () => {
    await mount(linked, {
      testTelegram: async () => {
        throw new Error("Telegram refused the request: chat not found");
      },
    });
    await click("Send a test");
    expect(text()).toContain("chat not found");
  });

  test("and one that did", async () => {
    await mount(linked, { testTelegram: async () => ({ ...linked, lastSentAt: new Date().toISOString() }) });
    await click("Send a test");
    expect(text()).toContain("it should be in the chat already");
  });

  test("surfaces the last failure, so nobody waits on a message that is not coming", async () => {
    await mount({ ...linked, lastError: "Forbidden: bot was blocked by the user" });
    expect(text()).toContain("bot was blocked by the user");
  });
});
