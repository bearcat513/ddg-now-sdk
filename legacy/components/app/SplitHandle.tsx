import { useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Current width of the pane on the left, as a percentage of the container. */
  value: number;
  min: number;
  max: number;
  /** Called once the drag ends, so the new size is stored, not streamed. */
  onChange: (percent: number) => void;
  /** Measured to turn a pointer position into a percentage, and written to
   *  directly while dragging. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Restored on a double-click, for when a drag has gone somewhere silly. */
  defaultValue: number;
};

/** Keyboard nudge, in percentage points. Shift makes it a coarse jump. */
const STEP = 2;
const COARSE_STEP = 10;

/**
 * The divider between the schema editor and the preview.
 *
 * It is a one-pixel border with a much wider grab area, because a
 * pixel-accurate target is a bad one — the hit zone straddles the line and
 * only the line itself is painted.
 *
 * A drag writes the width straight to the container's CSS variable and reports
 * the result only when the pointer goes up. Routing every frame through React
 * would re-render the field list and the preview table on each one, to show a
 * number that is about to change again; this way the drag is a style write and
 * the commit is a single render.
 */
export function SplitHandle({ value, min, max, onChange, containerRef, defaultValue }: Props) {
  const dragging = useRef(false);
  /** The last percentage a drag produced, committed when it ends. */
  const latest = useRef(value);

  const clamp = (percent: number) => Math.min(Math.max(percent, min), max);

  function positionToPercent(clientX: number): number | null {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return null;
    return clamp(((clientX - box.left) / box.width) * 100);
  }

  /** Moves the panes now, without telling React about it. */
  function paint(percent: number) {
    latest.current = percent;
    containerRef.current?.style.setProperty("--split", `${percent}%`);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the schema and preview panes"
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      className={cn(
        "group relative hidden w-1.5 shrink-0 cursor-col-resize touch-none select-none lg:block",
        "focus-visible:outline-none",
      )}
      onPointerDown={event => {
        // Only the primary button drags; a right-click should open the menu.
        if (event.button !== 0) return;
        dragging.current = true;
        latest.current = value;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (!dragging.current) return;
        const percent = positionToPercent(event.clientX);
        if (percent !== null) paint(percent);
      }}
      onPointerUp={event => {
        if (!dragging.current) return;
        dragging.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
        // One render, and one debounced save, for the whole drag.
        if (latest.current !== value) onChange(latest.current);
      }}
      onLostPointerCapture={() => {
        // A drag interrupted by the browser still keeps where it got to.
        if (!dragging.current) return;
        dragging.current = false;
        if (latest.current !== value) onChange(latest.current);
      }}
      onDoubleClick={() => onChange(defaultValue)}
      onKeyDown={event => {
        const step = event.shiftKey ? COARSE_STEP : STEP;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onChange(clamp(value - step));
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onChange(clamp(value + step));
        }
        if (event.key === "Home") {
          event.preventDefault();
          onChange(min);
        }
        if (event.key === "End") {
          event.preventDefault();
          onChange(max);
        }
        if (event.key === "Enter") {
          event.preventDefault();
          onChange(defaultValue);
        }
      }}
    >
      {/* The visible line: the border between the panes, thickening under the
          pointer so the handle announces itself before it is grabbed. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors",
          "group-hover:w-0.5 group-hover:bg-primary group-focus-visible:w-0.5 group-focus-visible:bg-primary",
        )}
      />
    </div>
  );
}
