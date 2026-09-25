/**
 * The script template editor.
 *
 * Copied from `legacy/components/app/ScriptTemplatePanel.tsx` and kept as it
 * was, because what it is about did not change in the port: a name, a body,
 * and a palette of the placeholders the render endpoint knows — which it reads
 * from the same module the endpoint substitutes with, so the chips and the
 * substitution can never disagree.
 *
 * The one thing that did change is who "yours" means. On PocketBase a template
 * could be shared with you read-only; here read is app-wide for the role and
 * the ACL keeps writes to the creator, so `owned` is now "you made this" and
 * saving someone else's still forks it into your own copy.
 */

import { useRef } from "react";
import { AlertTriangle, Plus, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { CodeEditor, type CodeEditorHandle } from "./CodeEditor";
import {
  countPlaceholders,
  DATASET_PLACEHOLDER,
  PLACEHOLDERS,
  usedPlaceholders,
  type PlaceholderGroup,
} from "../../../server/lib/scriptTemplate";

type Props = {
  name: string;
  body: string;
  /** null while the template on screen has never been saved. */
  activeId: string | null;
  /** False when this one is someone else's: saving keeps your own copy. */
  owned: boolean;
  busy: boolean;
  onNameChange: (name: string) => void;
  onBodyChange: (body: string) => void;
  onSave: () => void;
  onNew: () => void;
};

const GROUP_LABELS: Record<PlaceholderGroup, string> = {
  dataset: "Dataset",
  configuration: "Configuration",
};

export function ScriptTemplatePanel({
  name,
  body,
  activeId,
  owned,
  busy,
  onNameChange,
  onBodyChange,
  onSave,
  onNew,
}: Props) {
  const editor = useRef<CodeEditorHandle>(null);
  const placeholders = countPlaceholders(body);
  const used = usedPlaceholders(body);

  /** Drops a placeholder where the caret is, so the palette reads as typing. */
  const insert = (token: string) => editor.current?.insert(token);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor="template-name" className="label-caps mb-1">
            Template name
          </Label>
          <Input
            id="template-name"
            className="h-8"
            placeholder="Seed incidents"
            value={name}
            onChange={e => onNameChange(e.target.value)}
          />
        </div>

        <Button variant="outline" size="sm" onClick={onNew} title="Start a new template">
          <Plus />
          New
        </Button>
        <Button size="sm" onClick={onSave} disabled={busy || !name.trim()}>
          <Save />
          {!owned ? "Save my copy" : activeId ? "Save" : "Save template"}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="template-body" className="label-caps">
            Script
          </Label>
          <span className="text-[11px] text-muted-foreground/70">Tab indents · Esc then Tab leaves the editor</span>
        </div>
        <CodeEditor
          ref={editor}
          id="template-body"
          label="Script template body"
          className="min-h-64 flex-1"
          value={body}
          onChange={onBodyChange}
        />
      </div>

      {used.length === 0 ? (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-500">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            No placeholders in this script, so rendering it would copy the template back unchanged.
          </span>
        </p>
      ) : placeholders === 0 ? (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-500">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            No <span className="font-mono">{DATASET_PLACEHOLDER}</span> here, so this renders with the run's details
            but none of its rows.
          </span>
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground/70">
          The dataset replaces <span className="font-mono">{DATASET_PLACEHOLDER}</span>
          {placeholders > 1 && ` (${placeholders} times)`}, inserted as the same JSON the download serves. Generate a
          dataset, then use <span className="font-medium">Script</span> beside the preview to copy or download the
          result.
        </p>
      )}

      <div className="space-y-1.5">
        <p className="text-[11px] text-muted-foreground/70">
          Click to insert at the caret. Each one expands to a JavaScript literal — quotes and brackets included — so a
          template never has to quote what goes into it.
        </p>
        {(Object.keys(GROUP_LABELS) as PlaceholderGroup[]).map(group => (
          <div key={group} className="flex flex-wrap items-center gap-1">
            <span className="label-caps w-24 shrink-0">
              {GROUP_LABELS[group]}
            </span>
            {PLACEHOLDERS.filter(entry => entry.group === group).map(entry => (
              <button
                key={entry.token}
                type="button"
                onClick={() => insert(entry.token)}
                className="chip"
                title={`${entry.description} — renders as ${entry.example}`}
              >
                {entry.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
