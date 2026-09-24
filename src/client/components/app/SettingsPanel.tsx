import { useEffect, useState, type ReactNode } from "react";
import { Check, Loader2, Palette, RotateCcw, Settings2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TypeSelect } from "./TypeSelect";
import { PREFERENCE_LIMITS, type Preferences } from "../../../server/lib/preferences";
import { cn } from "../../lib/utils";

/** Where a preference save has got to, for the header's quiet indicator. */
export type SaveState = "idle" | "saving" | "saved" | "failed";

type Props = {
  preferences: Preferences;
  saveState: SaveState;
  /** Where the preferences live — the same label the sidebar shows for data. */
  storage: string;
  onChange: (patch: Partial<Preferences>) => void;
  onReset: () => void;
  onClose: () => void;
  /** Rendered at the start of the header — the sidebar control, when it is away. */
  leading?: ReactNode;
};

/* ---------------------------- building blocks ---------------------------- */

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
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
function Setting({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint: string;
  htmlFor?: string;
  children: ReactNode;
}) {
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
 * The draft is kept as text so a half-typed value is not clamped out from under
 * the cursor: the preference itself only changes on blur or Enter, and an empty
 * or nonsense entry snaps back to what is stored. That mattered on
 * `localStorage` for the cursor's sake; here it also means one request per
 * value settled rather than one per keystroke.
 *
 * The effect is what makes the server the authority. A commit sends a number
 * and the reply may be a different one — 50,000 preview rows come back as 1,000
 * — and this resets the draft to whatever came back, so the box shows what is
 * stored rather than what was asked for.
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

/** A yes/no preference. A plain checkbox — there is no switch primitive here. */
function ToggleSetting({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
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

/* ------------------------------- the panel ------------------------------- */

/**
 * The settings view.
 *
 * This is the Bun app's `SettingsPanel` with the parts that have no subject
 * here taken out rather than reimplemented. Gone with the features they
 * configured: the accent picker, the API-key list, the OpenAPI export, the
 * Telegram hooks, the account and password form, the workspace export, the
 * default script template, and the dataset history limit. What is left is the
 * preferences this application actually has.
 *
 * Two changes of meaning worth being plain about. The account section is gone
 * because the session is the instance's — there is no password here to change
 * and no sign-out to offer. And the subtitle is now true again: preferences are
 * stored per user on `x_1040823_ddg_now_user_pref`, so they follow the account
 * across browsers, which is what the Bun version promised and the first port
 * could not.
 *
 * A view rather than a dialog. It fills the main pane, keeps the nav beside it,
 * and has its own URL — the same treatment the editor gets, because it is the
 * same kind of place.
 */
export function SettingsPanel({ preferences, saveState, storage, onChange, onReset, onClose, leading }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b bg-card/40 px-4 py-3">
        {leading}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Settings2 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold leading-tight tracking-tight">Settings</h1>
          <p className="truncate text-xs text-muted-foreground">
            Preferences follow your account, not this browser.
          </p>
        </div>

        {/* Saving is silent and automatic, so it needs somewhere fixed to say
            so — a phrase appended to the subtitle moves the text around it.
            Unlike the Bun version this is a real request, so there is a failed
            arm: a save that did not land must not read as one that did. */}
        {saveState !== "idle" && (
          <span
            role="status"
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]",
              "animate-in fade-in-0",
              saveState === "failed" ? "bg-destructive/12 text-destructive" : "bg-muted text-muted-foreground",
            )}
          >
            {saveState === "saving" && (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving…
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                Saved
              </>
            )}
            {saveState === "failed" && <>Not saved</>}
          </span>
        )}

        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close settings" title="Back to the editor">
          <X />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
          <Section
            icon={<Palette className="size-4" />}
            title="Appearance"
            description="How the page is drawn, for you, wherever you open it."
          >
            <Setting label="Theme" hint="System follows your operating system, live." htmlFor="pref-theme">
              <Select
                value={preferences.theme}
                onValueChange={theme => onChange({ theme: theme as Preferences["theme"] })}
              >
                <SelectTrigger id="pref-theme" className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </Setting>

            <Setting
              label="Editor split"
              hint="How much of the editor the schema pane takes. Dragging the divider changes this too."
              htmlFor="pref-split"
            >
              <NumberSetting
                id="pref-split"
                value={preferences.editorSplitPercent}
                min={PREFERENCE_LIMITS.editorSplit.min}
                max={PREFERENCE_LIMITS.editorSplit.max}
                onCommit={editorSplitPercent => onChange({ editorSplitPercent })}
              />
            </Setting>

            <Setting label="Sidebar" hint="Whether the nav starts out of the way when the page opens.">
              <ToggleSetting
                id="pref-sidebar"
                checked={preferences.sidebarCollapsed}
                onChange={sidebarCollapsed => onChange({ sidebarCollapsed })}
                label="Start collapsed"
              />
            </Setting>
          </Section>

          <Section
            icon={<SlidersHorizontal className="size-4" />}
            title="Defaults"
            description="What a new schema, a new field and the preview start out as. Changes save as you make them."
          >
            <Setting
              label="Rows per schema"
              hint="What the Rows box starts at for a new schema."
              htmlFor="pref-rows"
            >
              <NumberSetting
                id="pref-rows"
                value={preferences.defaultRowCount}
                min={PREFERENCE_LIMITS.rowCount.min}
                max={PREFERENCE_LIMITS.rowCount.max}
                onCommit={defaultRowCount => onChange({ defaultRowCount })}
              />
            </Setting>

            <Setting label="New field type" hint="The type Add field starts a field as.">
              <TypeSelect
                value={preferences.defaultFieldType}
                onChange={defaultFieldType => onChange({ defaultFieldType })}
                className="h-8 w-full"
              />
            </Setting>

            <Setting
              label="Preferred export"
              hint="Which download is offered first in the data pane."
              htmlFor="pref-format"
            >
              <Select
                value={preferences.defaultExportFormat}
                onValueChange={format => onChange({ defaultExportFormat: format as Preferences["defaultExportFormat"] })}
              >
                <SelectTrigger id="pref-format" className="h-8 w-full">
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

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              {/* Where they live, said plainly. The sidebar carries the same
                  label for the data, and a preference is a record here too —
                  which is the whole difference from the version that kept
                  these in this browser. */}
              <p className="min-w-56 flex-1 text-[11px] text-muted-foreground/80">
                Stored on <span className="font-mono">x_1040823_ddg_now_user_pref</span> in{" "}
                <span className="font-mono">{storage}</span>, one row for you, readable by nobody else.
              </p>
              <Button variant="ghost" size="sm" onClick={onReset}>
                <RotateCcw />
                Reset to defaults
              </Button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
