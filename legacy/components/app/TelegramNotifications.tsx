import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, Loader2, Send, TriangleAlert, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";
import { TELEGRAM_LIMITS, type TelegramState } from "@/lib/telegram";
import { cn } from "@/lib/utils";

/** One row, in the shape the rest of the settings page uses. */
function Row({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
      <div className="min-w-56 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  );
}

function Toggle({
  id,
  checked,
  onChange,
  label,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={event => onChange(event.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}

/** Whatever the last action had to say, in the colour that says which. */
function Note({ kind, children }: { kind: "error" | "info"; children: ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-1.5 px-4 py-2.5 text-xs",
        kind === "error" ? "bg-destructive/8 text-destructive" : "text-muted-foreground",
      )}
    >
      {kind === "error" && <TriangleAlert className="mt-px size-3.5 shrink-0" />}
      <span className="min-w-0 flex-1">{children}</span>
    </p>
  );
}

const when = (iso: string) => (iso ? new Date(iso).toLocaleString() : "");

/**
 * Telegram notifications, configured here and sent by the run that earns one.
 *
 * Three states, in the order they are reached: no bot to send through, a bot
 * but no chat to send to, and a chat — at which point the settings are about
 * which runs are worth a message rather than about Telegram at all.
 */
export function TelegramNotifications() {
  const [state, setState] = useState<TelegramState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [botToken, setBotToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void api
      .getTelegram()
      .then(setState)
      .catch(error => setLoadError(error instanceof Error ? error.message : "Could not read your settings."));
  }, []);

  /** Runs one action, keeping whatever it says about how it went. */
  async function run(what: string, action: () => Promise<TelegramState>, success = "") {
    setBusy(what);
    setError("");
    setNote("");
    try {
      setState(await action());
      if (success) setNote(success);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  }

  /** A settings change saves itself; there is no Save button for these. */
  const save = (patch: Partial<TelegramState> & { botToken?: string }) =>
    run("save", () => api.saveTelegram({ ...state, ...patch }));

  async function copyCode(code: string) {
    try {
      await copyToClipboard(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The code is on screen and selectable; a failed copy is not worth an alert.
    }
  }

  if (loadError) return <Note kind="error">{loadError}</Note>;

  if (!state) {
    return (
      <p className="flex items-center gap-2 px-4 py-6 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Reading your notification settings…
      </p>
    );
  }

  const hasBot = state.serverBot || state.hasOwnBot;
  const linked = Boolean(state.chatId);

  return (
    <>
      {/* A bot has to exist before any of the rest means anything. */}
      {!hasBot && (
        <div className="space-y-2 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Notifications go through a Telegram bot. This server has none of its own, so bring one:{" "}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline underline-offset-2"
            >
              @BotFather
            </a>{" "}
            issues a token in about thirty seconds — <span className="font-mono">/newbot</span>, answer twice, and it
            hands you <span className="font-mono">123456:ABC-DEF…</span>.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-56 flex-1">
              <Label htmlFor="telegram-token" className="label-caps mb-1">
                Bot token
              </Label>
              <Input
                id="telegram-token"
                value={botToken}
                onChange={event => setBotToken(event.target.value)}
                placeholder="123456789:AA…"
                className="h-8 font-mono text-xs"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <Button
              disabled={!botToken.trim() || busy === "save"}
              onClick={async () => {
                await save({ botToken: botToken.trim() });
                setBotToken("");
              }}
            >
              {busy === "save" ? <Loader2 className="animate-spin" /> : null}
              Save the token
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/80">
            It is stored on your account and never sent back to this page. Whoever runs this server can set{" "}
            <span className="font-mono">TELEGRAM_BOT_TOKEN</span> instead, and then nobody needs their own.
          </p>
        </div>
      )}

      {hasBot && !linked && (
        <div className="space-y-3 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Telegram will not tell a bot which chats exist — a chat has to speak first. Send the code below to{" "}
            {state.botUsername ? (
              <span className="font-medium text-foreground">@{state.botUsername}</span>
            ) : (
              "the bot"
            )}
            , then check back.
          </p>

          {state.pending ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md border bg-muted/40 px-3 py-1.5 font-mono text-sm font-semibold tracking-[0.2em]">
                {state.pending.code}
              </code>
              <Button variant="outline" size="sm" onClick={() => copyCode(state.pending!.code)}>
                {copied ? <Check className="text-emerald-600 dark:text-emerald-400" /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
              {state.pending.deepLink && (
                <Button variant="outline" size="sm" asChild>
                  <a href={state.pending.deepLink} target="_blank" rel="noreferrer">
                    <ExternalLink />
                    Open Telegram
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                disabled={busy === "confirm"}
                onClick={() => run("confirm", api.confirmTelegramPairing, "Linked.")}
              >
                {busy === "confirm" ? <Loader2 className="animate-spin" /> : <Check />}
                I've sent it
              </Button>
              <span className="text-[11px] text-muted-foreground/80">
                Expires {when(state.pending.expiresAt)}
              </span>
            </div>
          ) : (
            <Button size="sm" disabled={busy === "pair"} onClick={() => run("pair", api.pairTelegram)}>
              {busy === "pair" ? <Loader2 className="animate-spin" /> : null}
              Get a pairing code
            </Button>
          )}
        </div>
      )}

      {linked && (
        <>
          <Row
            label={state.chatLabel ? `Sending to ${state.chatLabel}` : "Chat linked"}
            hint={
              [
                state.botUsername && `through @${state.botUsername}`,
                state.verifiedAt && `linked ${when(state.verifiedAt)}`,
              ]
                .filter(Boolean)
                .join(" · ") || "Ready to send."
            }
          >
            <Button
              variant="outline"
              size="sm"
              disabled={busy === "test"}
              onClick={() => run("test", api.testTelegram, "Sent — it should be in the chat already.")}
            >
              {busy === "test" ? <Loader2 className="animate-spin" /> : <Send />}
              Send a test
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy === "unlink"}
              onClick={() => run("unlink", api.unlinkTelegram, "Unlinked.")}
            >
              <Unlink />
              Unlink
            </Button>
          </Row>

          <Row label="Notifications" hint="Nothing is sent while this is off.">
            <Toggle
              id="telegram-enabled"
              checked={state.enabled}
              onChange={enabled => save({ enabled })}
              label={state.enabled ? "On" : "Off"}
            />
          </Row>

          <Row label="Tell me when" hint="Which runs are worth a message.">
            <Toggle
              id="telegram-generated"
              checked={state.events.generated}
              disabled={!state.enabled}
              onChange={generated => save({ events: { ...state.events, generated } })}
              label="A run finishes"
            />
            <Toggle
              id="telegram-failed"
              checked={state.events.failed}
              disabled={!state.enabled}
              onChange={failed => save({ events: { ...state.events, failed } })}
              label="A run fails"
            />
          </Row>

          <Row
            label="Only for API keys"
            hint="Stay quiet for runs made here, where the rows land on screen anyway."
          >
            <Toggle
              id="telegram-api-only"
              checked={state.apiKeyOnly}
              disabled={!state.enabled}
              onChange={apiKeyOnly => save({ apiKeyOnly })}
              label={state.apiKeyOnly ? "API keys only" : "Every run"}
            />
          </Row>

          <Row label="Smallest run worth reporting" hint="Rows. 0 reports every run, however short.">
            <Input
              id="telegram-min-rows"
              type="number"
              min={TELEGRAM_LIMITS.minRows.min}
              max={TELEGRAM_LIMITS.minRows.max}
              defaultValue={state.minRows}
              disabled={!state.enabled}
              className="h-8 w-28"
              onBlur={event => {
                const minRows = Number(event.target.value);
                if (Number.isFinite(minRows) && minRows !== state.minRows) void save({ minRows });
              }}
              onKeyDown={event => event.key === "Enter" && event.currentTarget.blur()}
            />
          </Row>
        </>
      )}

      {state.botError && <Note kind="error">Telegram would not answer for this bot: {state.botError}</Note>}
      {error && <Note kind="error">{error}</Note>}
      {!error && state.lastError && (
        <Note kind="error">The last notification did not arrive: {state.lastError}</Note>
      )}
      {note && <Note kind="info">{note}</Note>}
      {!note && !error && state.lastSentAt && (
        <Note kind="info">Last message sent {when(state.lastSentAt)}.</Note>
      )}
    </>
  );
}
