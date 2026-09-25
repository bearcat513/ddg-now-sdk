import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyToClipboard } from "../../lib/clipboard";
import { tokenize, type TokenKind } from "../../lib/highlight";
import { cn } from "../../lib/utils";

/**
 * A block of code or JSON, coloured, with a copy button in its corner.
 *
 * It borrows the editor's tokenizer rather than carrying a second one: JSON is
 * a subset of what that already reads — quoted keys and values, numbers,
 * `true`/`false`/`null` — and a cURL command comes out plain, which is right,
 * since none of it is JavaScript.
 *
 * Tokens are rendered as elements, so a response body from the server is text
 * on this page no matter what it contains.
 */

const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: "",
  comment: "text-muted-foreground/70",
  string: "text-emerald-600 dark:text-emerald-400",
  number: "text-blue-600 dark:text-blue-400",
  keyword: "text-violet-600 dark:text-violet-400",
  literal: "text-orange-600 dark:text-orange-400",
  placeholder: "rounded bg-primary/15 text-primary",
};

type Props = {
  code: string;
  /** Plain text — a header dump, an error — is not coloured as code. */
  plain?: boolean;
  className?: string;
  /** What the copy button puts on the clipboard, when not the code itself. */
  copyText?: string;
  label?: string;
};

export function CodeBlock({ code, plain = false, className, copyText, label }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await copyToClipboard(copyText ?? code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // The text is on screen and selectable; a failed copy is not worth an alert.
    }
  }

  return (
    <div className={cn("group relative", className)}>
      <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-5">
        <code>
          {plain
            ? code
            : tokenize(code).map((token, index) => (
                <span key={index} className={TOKEN_CLASS[token.kind]}>
                  {token.text}
                </span>
              ))}
        </code>
      </pre>

      <button
        type="button"
        onClick={copy}
        aria-label={label ? `Copy ${label}` : "Copy"}
        className="focus-ring absolute top-2 right-2 rounded-md border bg-card/90 p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
      >
        {copied ? <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}
