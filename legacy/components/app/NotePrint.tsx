import { useEffect, useRef, useState } from "react";
import { NoteView } from "@/components/app/NoteView";
import type { ResolvedReference } from "@/lib/notes";

/**
 * A note as a page, and the print run that turns one into a PDF.
 *
 * There is no PDF writer in here, and deliberately none in the bundle: a PDF
 * of a note has to *be* the note — its headings, its reference chips, the
 * tables it quotes out of a dataset — and the only renderer guaranteed to
 * agree with the preview is the one that drew the preview. So the sheet below
 * is the same `NoteView`, laid out for paper by src/../styles/globals.css, and
 * the PDF comes out of the browser's own print pipeline: every platform's
 * print dialog saves to one, the text stays text rather than a screenshot, and
 * an app that runs in Docker with no way out to a CDN gains no dependency.
 *
 * What the sheet is not is the preview pane. It is mounted outside the app's
 * root, so printing does not have to undo a screenful of panes, scrollers and
 * toolbars to get at the note inside them — in print the app is not on the
 * page at all and this is.
 */

/** The date under the title, and the flag that a print run is up. */
const stamp = () => new Date().toLocaleDateString(undefined, { dateStyle: "long" });

/**
 * A print run: mounts the sheet, waits for it to land, and opens the dialog.
 *
 * `fileName` is what the saved PDF is called, because every browser names it
 * after the page — so the page is named after the note for as long as the
 * dialog is up, and put back afterwards.
 */
export function usePrintNote(fileName: string) {
  /** The stamp on the sheet while it is mounted; null the rest of the time. */
  const [printedOn, setPrintedOn] = useState<string | null>(null);

  // Read at print time rather than closed over, so the effect does not re-run
  // — and print a second time — on every keystroke into the title.
  const label = useRef(fileName);
  label.current = fileName;

  useEffect(() => {
    if (printedOn === null) return;

    const root = document.documentElement;
    const title = document.title;
    const dark = root.classList.contains("dark");

    document.title = label.current;

    // Paper is white whatever the screen is, and the theme is one class on
    // one element — so dropping it is the whole of it, and the sheet prints
    // on the light palette with the account's accent still its own.
    if (dark) {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }

    const stop = () => setPrintedOn(null);
    window.addEventListener("afterprint", stop);
    // A frame, so the sheet is in the document before the dialog reads it.
    const frame = requestAnimationFrame(() => window.print());

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", stop);
      document.title = title;
      if (dark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      }
    };
  }, [printedOn]);

  return {
    printedOn,
    /**
     * Opens the dialog. A browser that never said the last one closed would
     * otherwise leave the button dead, so a second press prints directly.
     */
    print: () => (printedOn === null ? setPrintedOn(stamp()) : window.print()),
  };
}

/**
 * The sheet itself: the note's title, when it was printed, and the note.
 *
 * References resolve through whatever the editor knows, exactly as the preview
 * does — a chip carries the record's name at the moment of printing, which is
 * the closest a paper copy can get to the live thing.
 */
export function NotePrintSheet({
  title,
  body,
  printedOn,
  resolve,
}: {
  title: string;
  body: string;
  printedOn: string;
  resolve: (id: string, field: string) => ResolvedReference | undefined;
}) {
  return (
    <article className="note-print">
      <header className="mb-4 border-b pb-3">
        <h1 className="text-2xl font-semibold text-foreground">{title.trim() || "Untitled note"}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{printedOn}</p>
      </header>

      {/* No `onOpen`: a chip on paper is a name, not a control. */}
      <NoteView source={body} resolve={resolve} />
    </article>
  );
}
