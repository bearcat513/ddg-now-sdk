/**
 * Telegram notifications: the shape of the settings, and the messages.
 *
 * Shared by the server that sends and the settings page that configures, the
 * same way preferences are — one normalizer, so a body written by hand through
 * the API lands in the same valid shape the UI would have produced.
 *
 * The bot token is deliberately not part of this: it is a credential, it is
 * never sent to the browser, and it lives only in `src/server/telegram.ts` and
 * the account's own record.
 */

/** What an account can be told about. */
export type TelegramEvents = {
  /** A run finished and its rows were stored. */
  generated: boolean;
  /** A run was refused or threw — the one that matters to a cron job. */
  failed: boolean;
};

export type TelegramSettings = {
  /** The switch. Off leaves the rest of the settings in place. */
  enabled: boolean;
  /** Where to send. A user, a group, or `@channelname`. */
  chatId: string;
  /** What that chat is called, for the settings page to show. */
  chatLabel: string;
  events: TelegramEvents;
  /** Runs smaller than this say nothing — a 25-row preview is not news. */
  minRows: number;
  /**
   * Only notify for requests that carried an API key.
   *
   * A generation from the editor has its result on screen already; one from a
   * cron job at 3am is the reason this feature exists.
   */
  apiKeyOnly: boolean;
};

export const TELEGRAM_LIMITS = {
  minRows: { min: 0, max: 100_000 },
  /** Telegram's own ceiling for a message is 4096 characters. */
  messageLength: 4096,
} as const;

export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  enabled: false,
  chatId: "",
  chatLabel: "",
  events: { generated: true, failed: true },
  minRows: 0,
  apiKeyOnly: true,
};

/**
 * A bot token as BotFather issues it: the bot's numeric id, a colon, then the
 * secret. Checked before it is stored so a pasted mistake is refused by name
 * rather than at the first notification that fails to arrive.
 */
export const isBotToken = (value: string): boolean => /^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(value.trim());

/**
 * A chat id: a user or group (a number, negative for groups) or a public
 * channel's `@name`.
 */
export const isChatId = (value: string): boolean => /^(-?\d{1,20}|@[A-Za-z][\w]{4,31})$/.test(value.trim());

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(Math.round(value), min), max);

const bool = (value: unknown, fallback: boolean): boolean => (typeof value === "boolean" ? value : fallback);

/** Whatever was stored or sent, as a complete and valid settings set. */
export function normalizeTelegramSettings(raw: unknown): TelegramSettings {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const events = (input.events && typeof input.events === "object" ? input.events : {}) as Record<string, unknown>;

  const chatId = String(input.chatId ?? "").trim();
  const minRows = Number(input.minRows);

  return {
    enabled: bool(input.enabled, DEFAULT_TELEGRAM_SETTINGS.enabled),
    // An unusable chat id is dropped rather than stored: it would only fail
    // later, at a moment nobody is watching.
    chatId: isChatId(chatId) ? chatId : "",
    chatLabel: String(input.chatLabel ?? "").trim().slice(0, 100),
    events: {
      generated: bool(events.generated, DEFAULT_TELEGRAM_SETTINGS.events.generated),
      failed: bool(events.failed, DEFAULT_TELEGRAM_SETTINGS.events.failed),
    },
    minRows: Number.isFinite(minRows)
      ? clamp(minRows, TELEGRAM_LIMITS.minRows.min, TELEGRAM_LIMITS.minRows.max)
      : DEFAULT_TELEGRAM_SETTINGS.minRows,
    apiKeyOnly: bool(input.apiKeyOnly, DEFAULT_TELEGRAM_SETTINGS.apiKeyOnly),
  };
}

/**
 * The settings as the API hands them back — everything except the credential.
 *
 * `hasOwnBot` rather than the token: whether one is stored is what the page
 * has to draw, and the token itself has no business leaving the server.
 */
export type TelegramState = TelegramSettings & {
  /** Whether this account stores a bot token of its own. */
  hasOwnBot: boolean;
  /** Whether the server brings one, so an account needs none. */
  serverBot: boolean;
  /** Who the bot is, as Telegram answers. Empty where it could not be asked. */
  botUsername: string;
  /** Why it could not be asked, when it could not. */
  botError: string;
  /** When the chat was linked. Empty until it is. */
  verifiedAt: string;
  lastSentAt: string;
  lastError: string;
  /** A pairing code still waiting for its message. */
  pending: { code: string; expiresAt: string; deepLink: string } | null;
};

/* -------------------------------- messages -------------------------------- */

/** What happened, as the sender describes it. */
export type GenerationEvent =
  | {
      kind: "generated";
      name: string;
      rows: number;
      fields: number;
      /** Empty where the run came from an inline schema. */
      configName: string;
      seed: string;
      durationMs: number;
      viaApiKey: boolean;
      /** Empty where `?save=false` meant there is nothing to open. */
      datasetId: string;
    }
  | { kind: "failed"; name: string; reason: string; viaApiKey: boolean };

/** Telegram's HTML parse mode needs exactly these three escaped. */
export const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const seconds = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`);

/**
 * One notification, as HTML.
 *
 * Every value in it is written by the account being notified — a schema name,
 * a seed, an error from its own enum script — so every value is escaped. The
 * result is capped at Telegram's own limit, since it refuses anything longer
 * and a refused message is a notification nobody gets.
 */
export function notificationText(event: GenerationEvent): string {
  const source = event.viaApiKey ? " · via API key" : "";

  const lines =
    event.kind === "generated"
      ? [
          `✅ <b>${escapeHtml(event.name)}</b>`,
          `${event.rows.toLocaleString("en-US")} rows · ${event.fields} fields · ${seconds(event.durationMs)}`,
          [
            event.configName ? `from ${escapeHtml(event.configName)}` : "inline schema",
            event.seed ? `seed <code>${escapeHtml(event.seed)}</code>` : "",
            event.datasetId ? `<code>${escapeHtml(event.datasetId)}</code>` : "not stored",
          ]
            .filter(Boolean)
            .join(" · ") + source,
        ]
      : [
          `⚠️ <b>${escapeHtml(event.name)}</b> — generation failed`,
          escapeHtml(event.reason),
          `dummy data generator${source}`,
        ];

  return lines.join("\n").slice(0, TELEGRAM_LIMITS.messageLength);
}

/** The message the "Send a test message" button sends. */
export const testMessageText = (email: string): string =>
  [
    "🎲 <b>Dummy Data Generator</b>",
    `Notifications for ${escapeHtml(email)} are wired up.`,
    "This is what a run will look like when it lands.",
  ].join("\n");
