/**
 * Sending Telegram notifications, and the settings that decide whether to.
 *
 * Two things live here that live nowhere else: the account's bot token, and
 * the calls to Telegram itself. Everything is done with the caller's own
 * token — the settings record is owner-only, and the notification for a run is
 * sent by the request that made the run — so this file, like the rest of the
 * server, holds no credentials and grants no access of its own.
 *
 * A bot can come from two places. An operator may set `TELEGRAM_BOT_TOKEN`,
 * and then nobody has to make a bot at all; an account that would rather use
 * its own pastes one in, and that one wins. Neither is required for the app to
 * run: with no bot anywhere, the settings page says so and nothing is sent.
 */
import {
  DEFAULT_TELEGRAM_SETTINGS,
  isBotToken,
  isChatId,
  normalizeTelegramSettings,
  notificationText,
  testMessageText,
  type GenerationEvent,
  type TelegramSettings,
  type TelegramState,
} from "../lib/telegram";
import { ApiError } from "./http";
import { clientFor, toApiError } from "./pocketbase";

const COLLECTION = "telegram_settings";

/** Telegram's own API. The only host this file ever calls. */
const TELEGRAM_API = "https://api.telegram.org";

/** Long enough for a slow round trip, short enough not to hold a request. */
const CALL_TIMEOUT_MS = 8_000;

/** How long a pairing code is worth sending. */
const PAIRING_TTL_MS = 15 * 60 * 1000;

/** Unambiguous in a chat: no O/0 or I/1 to read back wrong. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type Record_ = Record<string, unknown>;

/** The bot this server brings, if its operator configured one. */
export const serverBotToken = (): string => (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();

/* ------------------------------ the Telegram API ----------------------------- */

/** What the app hands back about one bot. */
type BotIdentity = { username: string; name: string };

/**
 * One call to Telegram.
 *
 * Every failure it can have — a refused token, a chat the bot cannot post to,
 * a network that is not there — comes back as one sentence, because that
 * sentence is what the settings page shows and what `last_error` keeps.
 */
async function callTelegram<T>(botToken: string, method: string, body: Record<string, unknown> = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new ApiError(timedOut ? "Telegram did not answer in time." : "Could not reach Telegram.", 502);
  }

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    result?: T;
    description?: string;
  };

  if (!response.ok || !payload.ok) {
    // Telegram's own wording is the useful part; the status alone is not.
    const detail = payload.description ?? `HTTP ${response.status}`;
    throw new ApiError(`Telegram refused the request: ${detail}`, response.status === 401 ? 400 : 502);
  }

  return payload.result as T;
}

/** Who a bot token belongs to. Also the check that a token is live at all. */
export async function botIdentity(botToken: string): Promise<BotIdentity> {
  const me = await callTelegram<{ username?: string; first_name?: string }>(botToken, "getMe");
  return { username: String(me.username ?? ""), name: String(me.first_name ?? "") };
}

export async function sendMessage(botToken: string, chatId: string, text: string): Promise<void> {
  await callTelegram(botToken, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    // A run's notification is the message; a link preview of nothing is noise.
    disable_web_page_preview: true,
  });
}

/* --------------------------------- storage --------------------------------- */

/**
 * The caller's own id.
 *
 * Listing `users` is the way that works for both credentials: the collection's
 * rule is `id = @request.auth.id`, so the list holds exactly one record — the
 * account the token or the API key belongs to.
 */
async function ownUserId(token: string): Promise<string> {
  try {
    const list = await clientFor(token).collection("users").getList(1, 1);
    const id = (list.items[0] as unknown as Record_ | undefined)?.id;
    if (!id) throw new ApiError("Sign in to continue.", 401);
    return String(id);
  } catch (error) {
    throw toApiError(error, "Could not read your account");
  }
}

/** The caller's settings record, or null where they have never saved any. */
async function ownRecord(token: string): Promise<Record_ | null> {
  try {
    const list = await clientFor(token).collection(COLLECTION).getList(1, 1);
    return (list.items[0] as unknown as Record_ | undefined) ?? null;
  } catch (error) {
    throw toApiError(error, "Could not read your notification settings");
  }
}

/** Creates the record on first use, so every later write is an update. */
async function upsert(token: string, patch: Record_): Promise<Record_> {
  const existing = await ownRecord(token);
  try {
    const records = clientFor(token).collection(COLLECTION);
    return existing
      ? await records.update(String(existing.id), patch)
      : await records.create({ user: await ownUserId(token), ...patch });
  } catch (error) {
    throw toApiError(error, "Could not save your notification settings");
  }
}

/* ------------------------------ what the API sees ---------------------------- */

const asIso = (value: unknown): string => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const date = new Date(text.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

/** The bot token this account's notifications would go through. */
function botTokenOf(record: Record_ | null): string {
  const own = String(record?.bot_token ?? "").trim();
  return own || serverBotToken();
}

/**
 * The stored record as the API describes it.
 *
 * The bot is asked who it is — that call is the only way to know a token still
 * works, and its username is what the pairing link is built from — but a bot
 * that cannot be reached must not take the settings page down with it, so the
 * failure is reported as a field rather than thrown.
 */
async function toState(record: Record_ | null): Promise<TelegramState> {
  const settings = normalizeTelegramSettings(record?.settings);
  const storedChat = String(record?.chat_id ?? "").trim();
  const botToken = botTokenOf(record);

  let botUsername = "";
  let botError = "";
  if (botToken) {
    try {
      botUsername = (await botIdentity(botToken)).username;
    } catch (error) {
      botError = error instanceof Error ? error.message : "Could not reach Telegram.";
    }
  }

  const code = String(record?.pair_code ?? "").trim();
  const expiresAt = asIso(record?.pair_expires);
  const live = code && expiresAt && new Date(expiresAt).getTime() > Date.now();

  return {
    ...settings,
    // The chat id is stored on the record rather than in the settings blob:
    // pairing writes it, and a settings save must not be able to clear it by
    // omission.
    chatId: isChatId(storedChat) ? storedChat : "",
    chatLabel: String(record?.chat_label ?? ""),
    hasOwnBot: Boolean(String(record?.bot_token ?? "").trim()),
    serverBot: Boolean(serverBotToken()),
    botUsername,
    botError,
    verifiedAt: asIso(record?.verified),
    lastSentAt: asIso(record?.last_sent),
    lastError: String(record?.last_error ?? ""),
    pending: live
      ? {
          code,
          expiresAt,
          deepLink: botUsername ? `https://t.me/${botUsername}?start=${code}` : "",
        }
      : null,
  };
}

export const readTelegram = async (token: string): Promise<TelegramState> => toState(await ownRecord(token));

/**
 * Saves what the settings page sends.
 *
 * `botToken` is three-valued on purpose: absent leaves the stored one alone —
 * the page never has it to send back — `""` clears it, and anything else
 * replaces it, once Telegram has confirmed the token actually opens a bot.
 */
export async function writeTelegram(token: string, raw: unknown): Promise<TelegramState> {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const settings = normalizeTelegramSettings(body);

  const patch: Record_ = { enabled: settings.enabled, settings };

  if ("botToken" in body) {
    const botToken = String(body.botToken ?? "").trim();
    if (botToken) {
      if (!isBotToken(botToken)) {
        throw new ApiError("That does not look like a bot token — BotFather issues `123456:ABC-DEF…`.");
      }
      // Refused now, in front of someone who can fix it, rather than at 3am.
      await botIdentity(botToken);
    }
    patch.bot_token = botToken;
  }

  // A chat id may be set by hand — a group or a channel the bot posts to,
  // which no pairing message would ever come from.
  if ("chatId" in body) {
    const chatId = String(body.chatId ?? "").trim();
    if (chatId && !isChatId(chatId)) {
      throw new ApiError('"chatId" must be a Telegram chat id, or a channel as @name.');
    }
    patch.chat_id = chatId;
    patch.chat_label = chatId ? String(body.chatLabel ?? "").trim().slice(0, 100) : "";
    if (!chatId) patch.verified = "";
  }

  return toState(await upsert(token, patch));
}

/** Forgets the chat, the bot and the schedule — everything but the record. */
export async function unlinkTelegram(token: string): Promise<TelegramState> {
  return toState(
    await upsert(token, {
      enabled: false,
      chat_id: "",
      chat_label: "",
      bot_token: "",
      verified: "",
      pair_code: "",
      pair_expires: "",
      last_error: "",
      settings: { ...DEFAULT_TELEGRAM_SETTINGS },
    }),
  );
}

/* --------------------------------- pairing --------------------------------- */

const newPairingCode = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");

/**
 * Starts a pairing: a code to send the bot, and a link that sends it for you.
 *
 * Telegram will not tell a bot which chats exist; a chat has to speak first.
 * So the account sends a code, and the confirm step below looks for it — which
 * is also what proves the chat belongs to the person asking for it.
 */
export async function startPairing(token: string): Promise<TelegramState> {
  const record = await ownRecord(token);
  if (!botTokenOf(record)) {
    throw new ApiError("Add a bot token first, or ask whoever runs this server to configure one.");
  }

  return toState(
    await upsert(token, {
      pair_code: newPairingCode(),
      pair_expires: new Date(Date.now() + PAIRING_TTL_MS).toISOString(),
    }),
  );
}

/** One message the bot has received, as much of it as pairing needs. */
type Update = {
  message?: {
    text?: string;
    chat?: { id?: number | string; title?: string; username?: string; first_name?: string };
  };
};

/** What a chat should be called on the settings page. */
const chatLabel = (chat: NonNullable<NonNullable<Update["message"]>["chat"]>): string =>
  String(chat.title ?? chat.username ?? chat.first_name ?? chat.id ?? "").slice(0, 100);

/**
 * Looks for the pairing message, and keeps the chat it came from.
 *
 * Updates are read without an offset, so they are not consumed: on a shared
 * bot two accounts can be pairing at once, and confirming one must not swallow
 * the other's message. Only an exact match on the code counts, and only the
 * chat it was sent from is kept — nothing else in the update is read.
 */
export async function confirmPairing(token: string): Promise<TelegramState> {
  const record = await ownRecord(token);
  const code = String(record?.pair_code ?? "").trim();
  const expiresAt = asIso(record?.pair_expires);

  if (!code || !expiresAt || new Date(expiresAt).getTime() < Date.now()) {
    throw new ApiError("That pairing code has expired — start again.");
  }

  const botToken = botTokenOf(record);
  if (!botToken) throw new ApiError("There is no bot to check with.");

  const updates = await callTelegram<Update[]>(botToken, "getUpdates", {
    limit: 100,
    timeout: 0,
    allowed_updates: ["message"],
  });

  const match = updates.find(update => String(update.message?.text ?? "").includes(code));
  const chat = match?.message?.chat;
  if (!chat?.id) {
    throw new ApiError(`No message with that code yet. Send "${code}" to the bot, then check again.`);
  }

  return toState(
    await upsert(token, {
      chat_id: String(chat.id),
      chat_label: chatLabel(chat),
      verified: new Date().toISOString(),
      pair_code: "",
      pair_expires: "",
      last_error: "",
    }),
  );
}

/** The "does this actually work" button. */
export async function sendTestMessage(token: string, email: string): Promise<TelegramState> {
  const record = await ownRecord(token);
  const chatId = String(record?.chat_id ?? "").trim();
  const botToken = botTokenOf(record);

  if (!botToken) throw new ApiError("Add a bot token first, or ask whoever runs this server to configure one.");
  if (!chatId) throw new ApiError("Link a chat first — Telegram will not let a bot message one that has not spoken.");

  try {
    await sendMessage(botToken, chatId, testMessageText(email));
  } catch (error) {
    // Kept, so the page still says what went wrong after a reload.
    const reason = error instanceof Error ? error.message : "Could not reach Telegram.";
    await upsert(token, { last_error: reason.slice(0, 300) }).catch(() => {});
    throw error;
  }

  return toState(await upsert(token, { last_sent: new Date().toISOString(), last_error: "" }));
}

/* ------------------------------- notifications ------------------------------ */

/** Whether this event is one the account asked to hear about. */
export function shouldNotify(state: TelegramSettings, event: GenerationEvent): boolean {
  if (!state.enabled || !state.chatId) return false;
  if (state.apiKeyOnly && !event.viaApiKey) return false;
  if (event.kind === "generated") return state.events.generated && event.rows >= state.minRows;
  return state.events.failed;
}

/**
 * Tells the account what its run did, if it asked to be told.
 *
 * Deliberately not awaited by the routes: the rows are the answer to the
 * request, and a Telegram outage must not delay them or fail them. Whatever
 * happens here is recorded on the settings record instead, which is where the
 * settings page reads it back from.
 *
 * It costs one read per generation even for the accounts that have never
 * configured any — deliberately, and not cached: a cache keyed by credential
 * would miss the case this feature exists for, where notifications are set up
 * in the browser and the next run comes from a cron job minutes later.
 */
export function notify(token: string, event: GenerationEvent): void {
  void deliver(token, event).catch(() => {
    // Already recorded, or unrecordable — either way the run itself was fine.
  });
}

async function deliver(token: string, event: GenerationEvent): Promise<void> {
  const record = await ownRecord(token).catch(() => null);
  if (!record) return;

  const settings = { ...normalizeTelegramSettings(record.settings), chatId: String(record.chat_id ?? "").trim() };
  if (!shouldNotify(settings, event)) return;

  const botToken = botTokenOf(record);
  if (!botToken) return;

  try {
    await sendMessage(botToken, settings.chatId, notificationText(event));
    await clientFor(token)
      .collection(COLLECTION)
      .update(String(record.id), { last_sent: new Date().toISOString(), last_error: "" });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Could not reach Telegram.";
    console.warn(`telegram: ${reason}`);
    await clientFor(token)
      .collection(COLLECTION)
      .update(String(record.id), { last_error: reason.slice(0, 300) })
      .catch(() => {});
  }
}
