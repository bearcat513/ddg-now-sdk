import { ChevronRight, Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { METADATA_LIMITS, type MetadataPair } from "../../lib/metadata";
import { cn } from "../../lib/utils";

type Props = {
  pairs: MetadataPair[];
  onChange: (pairs: MetadataPair[]) => void;
  open: boolean;
  onToggle: () => void;
};

/**
 * The key/value pairs a configuration carries.
 *
 * Edited as a list rather than as the object it is stored as: renaming a key
 * in an object means deleting one entry and adding another, which would move
 * the row out from under the cursor mid-word. A blank key is a row still being
 * typed — it is kept on screen and dropped on the way to storage.
 */
export function MetadataEditor({ pairs, onChange, open, onToggle }: Props) {
  const named = pairs.filter(pair => pair.key.trim()).length;
  const full = pairs.length >= METADATA_LIMITS.pairs;

  const update = (index: number, patch: Partial<MetadataPair>) =>
    onChange(pairs.map((pair, i) => (i === index ? { ...pair, ...patch } : pair)));

  const duplicate = (index: number) => {
    const key = pairs[index]!.key.trim();
    // The last of a repeated key is what gets stored, so say so on the ones
    // that will not: an object cannot hold the same key twice.
    return Boolean(key) && pairs.some((other, i) => i > index && other.key.trim() === key);
  };

  return (
    <div className="rounded-lg border bg-card transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50",
          open && "rounded-b-none",
        )}
      >
        <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
        <Tags className="size-3.5 text-muted-foreground" />
        <span className="font-medium">Metadata</span>
        <span
          className={cn(
            "rounded-full px-1.5 py-px text-[10px] font-medium tabular-nums",
            named ? "bg-primary/12 text-primary" : "text-muted-foreground",
          )}
        >
          {named ? `${named} pair${named === 1 ? "" : "s"}` : "none yet"}
        </span>
      </button>

      {open && (
        <div className="space-y-2 border-t px-3 py-2.5 animate-in fade-in-0 duration-150">
          <p className="text-[11px] text-muted-foreground/70">
            What this schema is for — the team that owns it, the ticket it came from, the environment it seeds. Pairs
            travel with the configuration, through its export and into a script template as{" "}
            <span className="font-mono">{"${CONFIG_METADATA}"}</span>. Saving sorts them by key.
          </p>

          {pairs.map((pair, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={pair.key}
                onChange={event => update(index, { key: event.target.value })}
                placeholder="team"
                maxLength={METADATA_LIMITS.key}
                aria-label={`Metadata key ${index + 1}`}
                aria-invalid={duplicate(index) || undefined}
                title={duplicate(index) ? "Repeated below — the last one is what gets saved" : undefined}
                className="h-8 w-40 font-mono text-xs"
              />
              <Input
                value={pair.value}
                onChange={event => update(index, { value: event.target.value })}
                placeholder="billing"
                maxLength={METADATA_LIMITS.value}
                aria-label={`Metadata value ${index + 1}`}
                className="h-8 min-w-0 flex-1 font-mono text-xs"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(pairs.filter((_, i) => i !== index))}
                aria-label={`Remove metadata pair ${index + 1}`}
                title="Remove this pair"
              >
                <Trash2 className="text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            disabled={full}
            onClick={() => onChange([...pairs, { key: "", value: "" }])}
            title={full ? `A configuration may carry ${METADATA_LIMITS.pairs} pairs` : "Add a key/value pair"}
          >
            <Plus />
            Add pair
          </Button>
        </div>
      )}
    </div>
  );
}
