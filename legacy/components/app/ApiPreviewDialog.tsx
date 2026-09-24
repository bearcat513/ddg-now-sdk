import { useEffect, useState } from "react";
import { Check, Copy, Download, FileJson, KeyRound, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";
import { UNTITLED_DATASET, withoutGenerationStamp } from "@/lib/datasetName";
import {
  API_KEY_HEADER,
  API_KEY_VARIABLE,
  buildRequest,
  DEFAULT_PREVIEW_OPTIONS,
  FORMAT_LABELS,
  toCurl,
  toCurlScript,
  type PreviewFormat,
  type PreviewOptions,
  type PreviewTarget,
} from "@/lib/curl";
import { cn } from "@/lib/utils";

type Props = {
  /** The schema on screen, and the stored one behind it when there is one. */
  inline: Extract<PreviewTarget, { kind: "inline" }>;
  config: Extract<PreviewTarget, { kind: "config" }> | null;
  onClose: () => void;
  /** Takes the reader to where keys are issued. */
  onManageKeys: () => void;
};

const FORMATS: PreviewFormat[] = ["", "json", "csv", "sql"];

/** A segmented control: one row of buttons, one of them pressed. */
function Choice<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="label-caps">{label}</Label>
      {/* One sunken track holding the choices, so the group reads as a single
          control with a position in it rather than as loose buttons. */}
      <div className="inline-flex flex-wrap gap-0.5 rounded-lg border bg-muted/60 p-0.5">
        {options.map(option => {
          const chosen = option.value === value;
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={chosen}
              className={cn(
                "focus-ring rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                chosen
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * The same generation the Generate button runs, written out as a request.
 *
 * Everything the editor holds — fields, row count, seed, locale — is already
 * a valid API call, so this shows that call rather than describing it: pick
 * how the rows should come back, and copy a command that produces them.
 */
export function ApiPreviewDialog({ inline, config, onClose, onManageKeys }: Props) {
  const [useConfig, setUseConfig] = useState(Boolean(config));
  const [options, setOptions] = useState<PreviewOptions>({
    ...DEFAULT_PREVIEW_OPTIONS,
    limit: DEFAULT_PREVIEW_OPTIONS.limit,
    baseUrl: typeof window === "undefined" ? "" : window.location.origin,
  });
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const target: PreviewTarget = useConfig && config ? config : inline;
  const request = buildRequest(target, options);
  const command = toCurl(request);

  async function copy() {
    setCopyError("");
    try {
      await copyToClipboard(toCurlScript(request));
      setCopied(true);
    } catch (error) {
      setCopyError(error instanceof Error ? error.message : "The browser blocked the clipboard write.");
    }
  }

  const set = (patch: Partial<PreviewOptions>) => setOptions(current => ({ ...current, ...patch }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
      onClick={event => event.target === event.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="API preview"
      >
        <div className="flex items-start justify-between gap-3 rounded-t-xl border-b bg-muted/30 px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Terminal className="size-4" />
              API preview
            </h2>
            <p className="text-xs text-muted-foreground">
              The request behind the Generate button — run it from a terminal, a script or CI.
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto px-4 py-3">
          {config && (
            <Choice
              label="Endpoint"
              hint={
                useConfig
                  ? `The stored schema “${config.configName}” — the row count, seed and locale on screen ride along as overrides.`
                  : "The schema on screen, sent in the body. Works whether or not it has ever been saved."
              }
              value={useConfig ? "config" : "inline"}
              options={[
                { value: "config", label: "Saved configuration" },
                { value: "inline", label: "Inline schema" },
              ]}
              onChange={value => setUseConfig(value === "config")}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Choice
              label="Response"
              hint={
                options.format
                  ? `A ${FORMAT_LABELS[options.format]} download, with every row in it.`
                  : "JSON: the dataset record, a window of rows, and the total."
              }
              value={options.format}
              options={FORMATS.map(format => ({ value: format, label: FORMAT_LABELS[format] }))}
              onChange={format => set({ format })}
            />

            <Choice
              label="Store the dataset"
              hint={
                options.save
                  ? `Saved under your account as “${withoutGenerationStamp(target.name) || UNTITLED_DATASET} · <run timestamp>”, so the rows can be fetched again later.`
                  : "Nothing is persisted, and every row comes back in this one response."
              }
              value={options.save ? "yes" : "no"}
              options={[
                { value: "yes", label: "Save" },
                { value: "no", label: "Don’t save" },
              ]}
              onChange={value => set({ save: value === "yes" })}
            />
          </div>

          {options.save && !options.format && (
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="api-preview-limit" className="label-caps">
                Rows in the response
              </Label>
              <Input
                id="api-preview-limit"
                type="number"
                min={0}
                value={options.limit}
                onChange={event => set({ limit: Math.max(0, Number(event.target.value) || 0) })}
                className="h-8 w-24"
              />
              <span className="text-[11px] text-muted-foreground">
                0 returns all {inline.rowCount.toLocaleString()} rows inline; the dataset is stored whole either way.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs">
                <span className="font-semibold">{request.method}</span>{" "}
                <span className="text-muted-foreground">{request.path}</span>
              </p>
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy cURL"}
              </Button>
            </div>

            <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed shadow-inner">
              <code>{command}</code>
            </pre>

            {copyError && <p className="text-xs text-destructive">{copyError}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <KeyRound className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1">
              Set <span className="font-mono">{API_KEY_VARIABLE}</span> to an API key first — it travels as{" "}
              <span className="font-mono">{API_KEY_HEADER}</span> and reaches exactly what you do. The copied snippet
              includes the <span className="font-mono">export</span> line.
            </span>
            <Button size="sm" variant="ghost" onClick={onManageKeys}>
              API keys
            </Button>
          </div>

          {/* One request is the thing you came for; the whole API is the thing
              you want next, and a tool will take it as a file. */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <FileJson className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1">
              Working in Postman or Bruno? Every endpoint here is described in one OpenAPI document.
            </span>
            <Button size="sm" variant="ghost" asChild>
              <a href={api.openApiUrl} download={api.openApiFileName}>
                <Download />
                OpenAPI spec
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
