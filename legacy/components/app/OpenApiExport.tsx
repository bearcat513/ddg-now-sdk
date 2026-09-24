import { useState } from "react";
import { BookOpen, Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";

/**
 * Where the document is, said absolutely — a tool importing by link is not on
 * this page, so a path alone would give it nothing to resolve against.
 *
 * An origin that cannot be resolved against (no browser at all, or one sitting
 * on `about:blank`) leaves the path, which is still true, just not absolute.
 */
export function specUrl(origin: string | undefined): string {
  try {
    return new URL(api.openApiUrl, origin).href;
  } catch {
    return api.openApiUrl;
  }
}

/** The reference page, which renders this same document and can call it. */
export const DOCS_PATH = "/docs";

/**
 * The API, as a document Postman, Bruno and Insomnia can import.
 *
 * Two ways out, because the tools take two: a file to save, and a link to
 * paste. The link is the better one — it re-reads on every import, so a
 * collection built from it follows the server rather than a snapshot of it.
 */
export function OpenApiExport() {
  const [copied, setCopied] = useState(false);

  const url = specUrl(typeof window === "undefined" ? undefined : window.location.origin);

  async function copy() {
    try {
      await copyToClipboard(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The URL is on screen and selectable; a failed copy is not worth an alert.
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-56 flex-1 text-xs text-muted-foreground">
          Every endpoint, its parameters and the shapes it answers with, as an OpenAPI 3.0 document. Import it and
          the whole API arrives as a collection, ready to call.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {/* The reference page reads this same document, so it is offered
              beside it rather than buried in a menu — most people want to read
              the API before they want a file of it. */}
          <Button asChild variant="outline">
            <a href={DOCS_PATH}>
              <BookOpen />
              Open the reference
            </a>
          </Button>
          <Button asChild>
            <a href={api.openApiUrl} download={api.openApiFileName}>
              <Download />
              Download the spec
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 px-4 py-3">
        <div className="min-w-56 flex-1">
          <Label htmlFor="openapi-url" className="label-caps mb-1">
            Or import by link
          </Label>
          <Input
            id="openapi-url"
            readOnly
            value={url}
            onFocus={event => event.currentTarget.select()}
            className="h-8 font-mono text-xs"
          />
        </div>
        <Button variant="outline" onClick={copy} className="h-8">
          {copied ? <Check className="text-emerald-600 dark:text-emerald-400" /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <p className="px-4 py-3 text-[11px] text-muted-foreground/80">
        Or read it here: <a href={DOCS_PATH} className="font-medium text-primary underline-offset-2 hover:underline">
          the reference page
        </a>{" "}
        renders every endpoint and will call it for you. Postman: <span className="font-medium">Import → Link</span>. Bruno:{" "}
        <span className="font-medium">Import Collection → OpenAPI V3</span>. The document itself needs no credential
        — set the <span className="font-mono">X-API-Key</span> header to a key from above and every request in the
        collection reaches exactly what you do.
      </p>
    </>
  );
}
