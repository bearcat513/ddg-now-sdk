import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Check,
  Download,
  FileJson,
  KeyRound,
  Loader2,
  Package,
  RotateCcw,
  Send,
  Settings2,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiKeys } from "@/components/app/ApiKeys";
import { OpenApiExport } from "@/components/app/OpenApiExport";
import { TelegramNotifications } from "@/components/app/TelegramNotifications";
import { TypeSelect } from "@/components/app/TypeSelect";
import { api, type SessionUser } from "@/lib/api";
import { ACCENT_COLORS, PREFERENCE_LIMITS, type Preferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { workspaceFileName } from "@/lib/workspaceFile";
import type { ScriptTemplate } from "@/lib/scriptTemplate";

/** PocketBase's own minimum for the `users` collection. */
const MIN_PASSWORD = 8;

/** Where a preference save has got to, for the header's quiet indicator. */
export type SaveState = "idle" | "saving" | "saved";

type Props = {
  me: SessionUser;
  preferences: Preferences;
  saveState: SaveState;
  /** Every template this account can see, for the default-template picker. */
  templates: ScriptTemplate[];
  /** How much the workspace export will contain. */
  counts: { configs: number; templates: number };
  /** Where the data lives — the same label the sidebar shows. */
  storage: string;
  onChange: (patch: Partial<Preferences>) => void;
  onReset: () => void;
  /** A password change issues a new session, so the app needs the new user. */
  onAccountUpdated: (user: SessionUser) => void;
  onClose: () => void;
  /** Rendered at the start of the header — the sidebar control, when it is away. */
  leading?: ReactNode;
};

/* ------------------------------- building blocks ------------------------------- */

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-start gap-2.5 border-b bg-muted/30 px-4 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          {icon}
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="divide-y">{children}</div>
    </section>
  );
}

/** One preference: what it is on the left, the control on the right. */
function Setting({ label, hint, htmlFor, children }: { label: string; hint: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
      <div className="min-w-56 flex-1">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="w-48 shrink-0">{children}</div>
    </div>
  );
}

/**
 * A number preference.
 *
 * The draft is kept as text so a half-typed value is not clamped out from
 * under the cursor: the preference itself only changes on blur or Enter, and
 * an empty or nonsense entry snaps back to what is stored.
 */
function NumberSetting({
  id,
  value,
  min,
  max,
  onCommit,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) return setDraft(String(value));
    onCommit(parsed);
  };

  return (
    <Input
      id={id}
      type="number"
      min={min}
      max={max}
      className="h-8"
      value={draft}
      onChange={event => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={event => event.key === "Enter" && event.currentTarget.blur()}
    />
  );
}

/** A text preference, committed on the same terms as a number one. */
function TextSetting({
  id,
  value,
  placeholder,
  maxLength,
  onCommit,
}: {
  id: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  return (
    <Input
      id={id}
      className="h-8"
      placeholder={placeholder}
      maxLength={maxLength}
      value={draft}
      onChange={event => setDraft(event.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={event => event.key === "Enter" && event.currentTarget.blur()}
    />
  );
}

/** A yes/no preference. A plain checkbox — there is no switch primitive here. */
function ToggleSetting({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}

/**
 * The accent picker: seven swatches rather than a dropdown, because the thing
 * being chosen is the colour itself.
 *
 * Each swatch carries its own `data-accent`, so it paints `var(--primary)` from
 * the same CSS rule that will paint the app — no copy of the palette lives
 * here, and a swatch already looks right in whichever theme is on.
 */
function AccentSetting({
  value,
  onChange,
}: {
  value: Preferences["accentColor"];
  onChange: (accent: Preferences["accentColor"]) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Accent color" className="flex flex-wrap gap-1.5">
      {ACCENT_COLORS.map(accent => {
        const selected = accent.id === value;
        return (
          <button
            key={accent.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={accent.label}
            title={accent.label}
            data-accent={accent.id}
            onClick={() => onChange(accent.id)}
            className={cn(
              "size-6 rounded-full border transition-[box-shadow,transform] hover:scale-110",
              // Both rings are the swatch's own colour rather than the app's, so
              // they still read while a different accent is being considered.
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-background"
                : "border-border",
            )}
            style={{ background: "var(--primary)" }}
          >
            {selected && <Check className="mx-auto size-3.5" style={{ color: "var(--primary-foreground)" }} />}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- password --------------------------------- */

function PasswordForm({ onAccountUpdated }: { onAccountUpdated: (user: SessionUser) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setDone(false);
    try {
      const { user } = await api.changePassword({ currentPassword: current, newPassword: next });
      // PocketBase invalidates every token on a password change; the server
      // has already issued a fresh session cookie to go with this one.
      onAccountUpdated(user);
      setCurrent("");
      setNext("");
      setDone(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not change the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 px-4 py-3">
      <div className="min-w-40 flex-1">
        <Label htmlFor="current-password" className="mb-1 text-xs">
          Current password
        </Label>
        <Input
          id="current-password"
          type="password"
          className="h-8"
          autoComplete="current-password"
          value={current}
          onChange={event => setCurrent(event.target.value)}
          required
        />
      </div>
      <div className="min-w-40 flex-1">
        <Label htmlFor="new-password" className="mb-1 text-xs">
          New password
        </Label>
        <Input
          id="new-password"
          type="password"
          className="h-8"
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          value={next}
          onChange={event => setNext(event.target.value)}
          required
        />
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={busy || !current || next.length < MIN_PASSWORD}>
        {busy ? <Loader2 className="animate-spin" /> : <KeyRound />}
        Change password
      </Button>

      <p className="w-full text-[11px] text-muted-foreground">
        At least {MIN_PASSWORD} characters. Changing it signs out every other session — this one stays signed in.
      </p>

      {error && <p className="w-full text-xs text-destructive">{error}</p>}
      {done && (
        <p className="flex w-full items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Check className="size-3.5" />
          Password changed.
        </p>
      )}
    </form>
  );
}

/* ---------------------------------- page ---------------------------------- */

export function SettingsPanel({
  me,
  preferences,
  saveState,
  templates,
  counts,
  storage,
  onChange,
  onReset,
  onAccountUpdated,
  onClose,
  leading,
}: Props) {
  const joined = me.createdAt ? new Date(me.createdAt).toLocaleDateString() : "—";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b bg-card/40 px-4 py-3">
        {leading}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Settings2 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold leading-tight tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">Preferences follow your account, not this browser.</p>
        </div>

        {/* Saving is silent and automatic, so it needs somewhere fixed to say
            so — a phrase appended to the subtitle moves the text around it. */}
        {saveState !== "idle" && (
          <span
            role="status"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground animate-in fade-in-0"
          >
            {saveState === "saving" ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                Saved
              </>
            )}
          </span>
        )}
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close settings" title="Back to the editor">
          <X />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <Section icon={<UserRound className="size-4" />} title="Account" description="Who you are signed in as.">
            <div className="flex flex-wrap gap-x-8 gap-y-2 px-4 py-3 text-sm">
              <div>
                <p className="label-caps">Email</p>
                <p>{me.email}</p>
              </div>
              <div>
                <p className="label-caps">Name</p>
                <p>{me.name || <span className="text-muted-foreground">—</span>}</p>
              </div>
              <div>
                <p className="label-caps">Member since</p>
                <p>{joined}</p>
              </div>
              <div className="min-w-0">
                <p className="label-caps">Storage</p>
                <p className="truncate" title={storage}>
                  {storage || "—"}
                </p>
              </div>
            </div>

            <PasswordForm onAccountUpdated={onAccountUpdated} />
          </Section>

          <Section
            icon={<KeyRound className="size-4" />}
            title="API keys"
            description="A long-lived credential for scripts and cron jobs, in place of a session that expires in a week."
          >
            <ApiKeys confirmDestructive={preferences.confirmDestructive} />
          </Section>

          <Section
            icon={<Send className="size-4" />}
            title="Telegram notifications"
            description="Be told when a run finishes or fails — the point being the runs you are not watching."
          >
            <TelegramNotifications />
          </Section>

          <Section
            icon={<FileJson className="size-4" />}
            title="OpenAPI spec"
            description="The whole API in one document, for Postman, Bruno, Insomnia and the code generators."
          >
            <OpenApiExport />
          </Section>

          <Section
            icon={<SlidersHorizontal className="size-4" />}
            title="Preferences"
            description="Defaults for new schemas, new fields and the preview. Changes save as you make them."
          >
            <Setting label="Theme" hint="System follows your operating system." htmlFor="pref-theme">
              <Select value={preferences.theme} onValueChange={theme => onChange({ theme: theme as Preferences["theme"] })}>
                <SelectTrigger id="pref-theme" className="h-8 w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </Setting>

            <Setting label="Accent color" hint="Colors buttons, focus rings, tabs and the current selection.">
              <AccentSetting value={preferences.accentColor} onChange={accentColor => onChange({ accentColor })} />
            </Setting>

            <Setting label="Rows per schema" hint="What the Rows box starts at for a new schema." htmlFor="pref-rows">
              <NumberSetting
                id="pref-rows"
                value={preferences.defaultRowCount}
                min={PREFERENCE_LIMITS.rowCount.min}
                max={PREFERENCE_LIMITS.rowCount.max}
                onCommit={defaultRowCount => onChange({ defaultRowCount })}
              />
            </Setting>

            <Setting
              label="Default seed"
              hint="Prefills Seed on a new schema, so runs are reproducible by default. Empty means fresh data each run."
              htmlFor="pref-seed"
            >
              <TextSetting
                id="pref-seed"
                value={preferences.defaultSeed}
                placeholder="random"
                maxLength={PREFERENCE_LIMITS.seedLength}
                onCommit={defaultSeed => onChange({ defaultSeed })}
              />
            </Setting>

            <Setting label="New field type" hint="The type Add field starts a field as.">
              <TypeSelect
                value={preferences.defaultFieldType}
                onChange={defaultFieldType => onChange({ defaultFieldType })}
                className="h-8 w-full"
              />
            </Setting>

            <Setting label="Preferred export" hint="Which download is offered first beside the preview." htmlFor="pref-format">
              <Select
                value={preferences.defaultExportFormat}
                onValueChange={format => onChange({ defaultExportFormat: format as Preferences["defaultExportFormat"] })}
              >
                <SelectTrigger id="pref-format" className="h-8 w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="sql">SQL inserts</SelectItem>
                </SelectContent>
              </Select>
            </Setting>

            <Setting
              label="Default script template"
              hint={
                templates.length
                  ? "Preselected when you render a dataset into a script."
                  : "Nothing to pick yet — save a script template first."
              }
              htmlFor="pref-template"
            >
              <Select
                value={preferences.defaultTemplateId || "none"}
                onValueChange={id => onChange({ defaultTemplateId: id === "none" ? "" : id })}
              >
                <SelectTrigger id="pref-template" className="h-8 w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">First in the list</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Setting>

            <Setting
              label="Preview rows"
              hint="How many rows the table shows. The whole dataset is still stored and exported."
              htmlFor="pref-preview"
            >
              <NumberSetting
                id="pref-preview"
                value={preferences.previewRowLimit}
                min={PREFERENCE_LIMITS.previewRows.min}
                max={PREFERENCE_LIMITS.previewRows.max}
                onCommit={previewRowLimit => onChange({ previewRowLimit })}
              />
            </Setting>

            <Setting label="Datasets listed" hint="How many recent datasets the sidebar keeps on screen." htmlFor="pref-history">
              <NumberSetting
                id="pref-history"
                value={preferences.datasetHistoryLimit}
                min={PREFERENCE_LIMITS.datasetHistory.min}
                max={PREFERENCE_LIMITS.datasetHistory.max}
                onCommit={datasetHistoryLimit => onChange({ datasetHistoryLimit })}
              />
            </Setting>

            <Setting label="Deleting" hint="Deletes are immediate and cannot be undone.">
              <ToggleSetting
                id="pref-confirm"
                checked={preferences.confirmDestructive}
                onChange={confirmDestructive => onChange({ confirmDestructive })}
                label="Ask first"
              />
            </Setting>

            <div className="flex justify-end px-4 py-3">
              <Button variant="ghost" size="sm" onClick={onReset}>
                <RotateCcw />
                Reset to defaults
              </Button>
            </div>
          </Section>

          <Section
            icon={<Package className="size-4" />}
            title="Export everything"
            description="One JSON file holding every configuration and script template you can see, plus these preferences."
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="min-w-56 flex-1 text-xs text-muted-foreground">
                {counts.configs} configuration{counts.configs === 1 ? "" : "s"} · {counts.templates} script template
                {counts.templates === 1 ? "" : "s"} · preferences. Generated datasets are left out — they are data
                rather than configuration, and each already has its own CSV and JSON download.
              </p>
              <Button asChild>
                <a href={api.workspaceExportUrl} download={workspaceFileName()}>
                  <Download />
                  Export workspace
                </a>
              </Button>
            </div>
            <p className="px-4 py-3 text-[11px] text-muted-foreground/80">
              Every entry under <span className="font-mono">configs</span> is itself a complete{" "}
              <span className="font-mono">*.ddg.json</span> document, so one lifted out of the bundle imports through
              the upload button beside <span className="font-medium">Configurations</span> unchanged.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
