/// <reference path="../pb_data/types.d.ts" />

/**
 * Telegram notifications: where an account wants to be told, and about what.
 *
 * A collection of its own rather than another field on `users`, for one
 * reason: the account's own bot token can live here. The preferences blob
 * rides along with every session — it is handed to the browser on sign-in —
 * and a credential must not travel that way. This record is read only when
 * something is about to be sent.
 *
 * Owner-only, all five rules, with no shared route and no hook: a
 * notification is sent by the same request that caused it, using the caller's
 * own token, so nothing here needs privilege and nothing here grants any. One
 * record per account, which the unique index is what actually enforces.
 *
 * The bot token is not hidden, unlike an API key's hash. It is the account's
 * own credential, typed in by the account, and readable back by exactly the
 * one caller who already has it. The server's API never returns it; PocketBase
 * returning it to its owner is not a leak, and keeping it readable is what
 * lets the notification be sent without a privileged route.
 */
migrate(
  app => {
    const users = app.findCollectionByNameOrId("users");

    const settings = new Collection({
      name: "telegram_settings",
      type: "base",
      listRule: "user = @request.auth.id",
      viewRule: "user = @request.auth.id",
      createRule: "user = @request.auth.id",
      updateRule: "user = @request.auth.id",
      deleteRule: "user = @request.auth.id",
      fields: [
        {
          type: "text",
          name: "id",
          system: true,
          primaryKey: true,
          required: true,
          min: 3,
          max: 40,
          pattern: "^[a-z0-9_]+$",
          autogeneratePattern: "[a-z0-9]{15}",
        },
        {
          type: "relation",
          name: "user",
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true, // closing an account stops its notifications
        },
        { type: "bool", name: "enabled" },
        // A user, a group (negative), or a public channel's @name.
        { type: "text", name: "chat_id", required: false, max: 40 },
        { type: "text", name: "chat_label", required: false, max: 100 },
        // BotFather's format is `<bot id>:<secret>`; 60 is comfortably over it.
        { type: "text", name: "bot_token", required: false, max: 100 },
        // Which events, the floor under a run worth reporting, and whether to
        // stay quiet for runs made from the editor — see src/lib/telegram.ts.
        { type: "json", name: "settings", required: false, maxSize: 4096 },
        // A pairing code, and when it stops being one. Cleared on the way in.
        { type: "text", name: "pair_code", required: false, max: 20 },
        { type: "date", name: "pair_expires", required: false },
        { type: "date", name: "verified", required: false },
        { type: "date", name: "last_sent", required: false },
        // Why the last send failed, so the settings page can say so rather
        // than leaving someone waiting for a message that never comes.
        { type: "text", name: "last_error", required: false, max: 300 },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX `idx_telegram_settings_user` ON `telegram_settings` (`user`)"],
    });

    app.save(settings);
  },
  app => {
    app.delete(app.findCollectionByNameOrId("telegram_settings"));
  },
);
