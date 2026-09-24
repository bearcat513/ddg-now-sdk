import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FIELD_GROUPS, FIELD_TYPES, fieldTypeLabel, type FieldType, type FieldTypeMeta } from "@/lib/types";

type Props = {
  value: FieldType;
  onChange: (type: FieldType) => void;
  className?: string;
  /** Types this particular picker must not offer — array elements, mostly. */
  exclude?: FieldType[];
};

/**
 * What a type can be found by: its label, its group, and the type name used in
 * config files and template tokens — so someone who knows `latencyMs` or has
 * read the JSON can type that instead of hunting for "Latency (ms)".
 */
function haystack(meta: FieldTypeMeta): string {
  return `${meta.label} ${meta.group} ${meta.type}`.toLowerCase();
}

/**
 * The types a query leaves, in their original order.
 *
 * Every whitespace-separated word has to appear somewhere in the candidate, so
 * the order they are typed in does not matter — "seq date" and "date seq" both
 * reach the sequential timestamp — and each extra word narrows rather than
 * widens, which is what a filter box is expected to do. An empty query matches
 * everything.
 */
export function filterFieldTypes(types: FieldTypeMeta[], query: string): FieldTypeMeta[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return types;
  return types.filter(meta => {
    const text = haystack(meta);
    return terms.every(term => text.includes(term));
  });
}

/**
 * The picker's behaviour, with no markup attached: which types are on offer,
 * what the search box holds, and which row the keyboard is on.
 *
 * It is separate from the component because the popover it lives in cannot be
 * driven in a test environment, while this can — and every bug this picker has
 * had has been in here rather than in the markup.
 */
export function useTypeSearch(value: FieldType, exclude: FieldType[]) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  /**
   * Callers pass `exclude` as a literal, so it is a different array on every
   * render even when its contents never change. Keying the list off its text
   * keeps `available` stable, which keeps everything derived from it stable.
   */
  const excludeKey = exclude.join(",");
  const available = useMemo(() => {
    const excluded = new Set(excludeKey ? excludeKey.split(",") : []);
    return FIELD_TYPES.filter(meta => !excluded.has(meta.type));
  }, [excludeKey]);

  /** The flat list of matches, in group order — what the arrow keys walk. */
  const matches = useMemo(() => filterFieldTypes(available, query), [available, query]);

  /** The same matches, grouped, with empty groups dropped. */
  const grouped = useMemo(
    () =>
      FIELD_GROUPS.map(group => ({ group, types: matches.filter(meta => meta.group === group) })).filter(
        entry => entry.types.length > 0,
      ),
    [matches],
  );

  /**
   * Opening starts clean, on the type currently chosen.
   *
   * This belongs to the act of opening, not to a render. As an effect it would
   * re-run whenever anything it read changed identity — which, with a literal
   * `exclude`, is every render — and clear the search box out from under
   * whoever was typing into it.
   */
  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) return;
    setQuery("");
    const current = available.findIndex(meta => meta.type === value);
    setActiveIndex(current === -1 ? 0 : current);
  }

  /** A new search starts from the top, so the highlight is never past the end. */
  function search(next: string) {
    setQuery(next);
    setActiveIndex(0);
  }

  /** Wraps, so holding one arrow always reaches everything. */
  function move(step: number) {
    if (!matches.length) return;
    setActiveIndex(current => (current + step + matches.length) % matches.length);
  }

  return {
    open,
    changeOpen,
    query,
    search,
    matches,
    grouped,
    activeIndex,
    setActiveIndex,
    move,
    /** What Enter would choose right now. */
    active: matches[activeIndex] ?? null,
  };
}

export function TypeSelect({ value, onChange, className, exclude = [] }: Props) {
  const { open, changeOpen, query, search, matches, grouped, activeIndex, setActiveIndex, move, active } =
    useTypeSearch(value, exclude);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keep the highlighted row in view as the arrows move it.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, query]);

  function choose(type: FieldType) {
    onChange(type);
    changeOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : matches.length - 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (active) choose(active.type);
    }
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        role="combobox"
        aria-expanded={open}
        aria-label="Field type"
        className={cn(
          "border-input dark:bg-input/30 dark:hover:bg-input/50 flex h-8 items-center justify-between gap-2",
          "rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none",
          "transition-[color,box-shadow] hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          // The chevron turns over while the list is open, so the trigger says
          // which way it is pointing without reading its label.
          "[&>svg]:transition-transform data-[state=open]:[&>svg]:rotate-180",
          className,
        )}
      >
        <span className="truncate">{fieldTypeLabel(value)}</span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-56 p-0"
        // The search box takes focus, not the list, so typing narrows straight
        // away. The content is already mounted when this fires, so the ref is
        // set — reaching for it later would find `currentTarget` already null.
        onOpenAutoFocus={event => {
          event.preventDefault();
          searchRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2 rounded-t-md border-b bg-muted/40 px-2.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={searchRef}
            value={query}
            onChange={event => search(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search types…"
            aria-label="Search field types"
            spellCheck={false}
            autoComplete="off"
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{matches.length}</span>
          )}
        </div>

        <div ref={listRef} role="listbox" aria-label="Field types" className="max-h-72 overflow-y-auto p-1">
          {grouped.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Nothing matches <span className="font-mono text-foreground">{query}</span>
            </p>
          ) : (
            grouped.map(({ group, types }) => (
              <div key={group}>
                <p className="label-caps px-2 pb-1 pt-2 first:pt-1">{group}</p>
                {types.map(meta => {
                  const index = matches.indexOf(meta);
                  const active = index === activeIndex;
                  return (
                    <button
                      key={meta.type}
                      type="button"
                      role="option"
                      aria-selected={meta.type === value}
                      data-active={active}
                      // Hovering moves the highlight, so the mouse and the
                      // arrow keys never disagree about what Enter would pick.
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() => choose(meta.type)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none",
                        "transition-colors",
                        active && "bg-accent text-accent-foreground",
                        meta.type === value && "font-medium",
                      )}
                    >
                      <Check className={cn("size-3.5 shrink-0", meta.type === value ? "text-primary opacity-100" : "opacity-0")} />
                      <span className="truncate">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
