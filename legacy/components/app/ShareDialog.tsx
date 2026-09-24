import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, Mail, UserMinus, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Shareable, type Shares } from "@/lib/api";

type Props = {
  kind: Shareable;
  id: string;
  title: string;
  /** The signed-in address — what "remove me from this" needs to send. */
  viewerEmail: string;
  onClose: () => void;
  /** Lets the sidebar re-read the record after the share list changes. */
  onChanged: () => void;
};

/**
 * Who a configuration or script template is shared with.
 *
 * Sharing is read-only by design: a recipient can open it, export it and
 * generate from it, and saving a change gives them their own copy. The dialog
 * says so, because "share" usually implies more than it does here.
 */
export function ShareDialog({ kind, id, title, viewerEmail, onClose, onChanged }: Props) {
  const [shares, setShares] = useState<Shares | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setShares(await api.listShares(kind, id));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not read the share list.");
    }
  }, [kind, id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Escape closes, like every other dialog on the web.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run(action: () => Promise<Shares>) {
    setBusy(true);
    setError("");
    try {
      setShares(await action());
      onChanged();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    const address = email.trim();
    if (!address) return;
    await run(async () => {
      const next = await api.addShare(kind, id, address);
      setEmail("");
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
      onClick={event => event.target === event.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 rounded-t-xl border-b bg-muted/30 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">Share “{title}”</h2>
            <p className="text-xs text-muted-foreground">
              Recipients can open, export and generate from it — not change it.
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="space-y-3 px-4 py-3">
          {!shares ? (
            <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Loading…
            </p>
          ) : shares.canShare ? (
            <>
              <form onSubmit={add} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  aria-label="Email address to share with"
                  autoFocus
                />
                <Button type="submit" disabled={busy || !email.trim()}>
                  {busy ? <Loader2 className="animate-spin" /> : <UserPlus />}
                  Share
                </Button>
              </form>

              {shares.sharedWith.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                  Not shared with anyone yet. They need an account here first.
                </p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {shares.sharedWith.map(address => (
                    <li key={address} className="flex items-center gap-2 px-3 py-2">
                      <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm">{address}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => void run(() => api.removeShare(kind, id, address))}
                        aria-label={`Stop sharing with ${address}`}
                        title="Stop sharing"
                      >
                        <UserMinus className="text-muted-foreground hover:text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                Shared with you by <span className="font-medium">{shares.owner || "another account"}</span>.
              </p>
              <p className="text-xs text-muted-foreground">
                You can open it, export it and generate from it. Saving a change keeps a copy under your own account.
              </p>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    // The server lets a recipient show themselves out; the
                    // record then drops off their list entirely.
                    const next = await api.removeShare(kind, id, viewerEmail);
                    onClose();
                    return next;
                  })
                }
              >
                {busy && <Loader2 className="animate-spin" />}
                Remove from my list
              </Button>
            </div>
          )}

          {error && (
            <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
