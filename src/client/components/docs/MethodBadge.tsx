import type { Method } from "../../lib/openapiDoc";
import { cn } from "../../lib/utils";

/**
 * The coloured method chip every reference page has, because a wall of paths
 * is unreadable without one. The colours are the conventional ones — a reader
 * who has seen any other API's docs already knows that red means delete.
 */
const METHOD_CLASS: Record<Method, string> = {
  get: "bg-blue-600/10 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25",
  post: "bg-emerald-600/10 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  put: "bg-amber-600/10 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
  patch: "bg-teal-600/10 text-teal-700 ring-teal-600/20 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/25",
  delete: "bg-red-600/10 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25",
};

export function MethodBadge({ method, className }: { method: Method; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-16 shrink-0 justify-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide uppercase ring-1 ring-inset",
        METHOD_CLASS[method],
        className,
      )}
    >
      {method}
    </span>
  );
}
