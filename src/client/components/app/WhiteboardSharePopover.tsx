import { useState, type FormEvent } from "react";
import { Check, Copy, Globe, Loader2, Lock, RefreshCw, Share2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { api } from "../../lib/api";
import { copyToClipboard } from "../../lib/clipboard";
import { cn } from "../../lib/utils";
import {
  MAX_SHARE_PASSWORD_LENGTH,
  MIN_SHARE_PASSWORD_LENGTH,
  whiteboardShareUrl,
  type WhiteboardShare,
  type WhiteboardShareInput,
} from "../../../server/lib/whiteboard";

type Props = {
  /** Null until the board has a record — there is nothing to link to yet. */
  boardId: string | null;
  /** Null when the caller may not change the board, so may not share it. */
  share: WhiteboardShare | null;
  owned: boolean;
  onChange: (share: WhiteboardShare) => void;
  onError: (message: string) => void;
};

/**
 * The header's Share button: a board's public link, and its password.
 *
 * Only the owner sees the controls. The link opens a read-only copy of the
 * board for anyone, signed in or not; a password, when set, is asked for
 * before the drawing is sent. The page never sees a password again after
 * sending it — the server keeps a salted hash — so "change" means "replace".
 */
export function WhiteboardSharePopover({ boardId, share, owned, onChange, onError }: Props) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");
  const [editingPassword, setEditingPassword] = useState(false);

  const enabled = Boolean(share?.enabled);
  const link = share?.token ? whiteboardShareUrl(window.location.origin, share.token) : "";
  const disabledReason = !boardId
    ? "Save the board before sharing it."
    : !owned || !share
      ? "Only the board's owner can share it."
      : null;

  const apply = async (change: Omit<WhiteboardShareInput, "enabled"> & { enabled?: boolean }) => {
    if (!boardId) return;
    setBusy(true);
    try {
      onChange(await api.updateWhiteboardShare(boardId, { enabled, ...change }));
      return true;
    } catch (error) {
      onError(error instanceof Error ? error.message : "The sharing settings could not be saved.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await copyToClipboard(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      onError(error instanceof Error ? error.message : "The link could not be copied.");
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (await apply({ password })) {
      setPassword("");
      setEditingPassword(false);
    }
  };

  const passwordTooShort = password.length > 0 && password.length < MIN_SHARE_PASSWORD_LENGTH;

  return (
    <Popover onOpenChange={open => !open && (setEditingPassword(false), setPassword(""))}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={Boolean(disabledReason)} title={disabledReason ?? "Share a public link"}>
          {enabled ? <Globe className="text-emerald-600" /> : <Share2 />}
          {enabled ? "Shared" : "Share"}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="flex w-96 flex-col gap-4 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-primary"
            checked={enabled}
            disabled={busy}
            onChange={event => void apply({ enabled: event.target.checked })}
          />
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium">Anyone with the link can view</span>
            <span className="text-xs text-muted-foreground">
              Read only, and no account needed. Turning this off stops the link working until you turn it back on.
            </span>
          </span>
          {busy && <Loader2 className="ml-auto size-4 shrink-0 animate-spin text-muted-foreground" />}
        </label>

        {enabled && link && (
          <>
            <div className="flex gap-2">
              <Input readOnly value={link} aria-label="Public link" onFocus={event => event.target.select()} className="h-8 text-xs" />
              <Button size="sm" variant="outline" onClick={() => void copy()} title="Copy link">
                {copied ? <Check className="text-emerald-600" /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <Lock className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Password</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {share?.passwordProtected ? "Required to view" : "None"}
                </span>
              </div>

              {share?.passwordProtected && !editingPassword ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditingPassword(true)}>
                    Change
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => void apply({ password: null })}>
                    Remove
                  </Button>
                </div>
              ) : (
                <form onSubmit={event => void savePassword(event)} className="flex flex-col gap-1.5">
                  <Label htmlFor="whiteboard-share-password" className="sr-only">
                    {share?.passwordProtected ? "New password" : "Password"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="whiteboard-share-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder={share?.passwordProtected ? "New password" : "Optional password"}
                      value={password}
                      maxLength={MAX_SHARE_PASSWORD_LENGTH}
                      onChange={event => setPassword(event.target.value)}
                      className="h-8"
                    />
                    <Button size="sm" type="submit" disabled={busy || password.length < MIN_SHARE_PASSWORD_LENGTH}>
                      Set
                    </Button>
                  </div>
                  <p className={cn("text-xs", passwordTooShort ? "text-destructive" : "text-muted-foreground")}>
                    At least {MIN_SHARE_PASSWORD_LENGTH} characters. Viewers are asked for it before the board loads.
                  </p>
                </form>
              )}
            </div>

            <div className="border-t pt-3">
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void apply({ newLink: true })}
                className="text-muted-foreground"
              >
                <RefreshCw />
                Reset link
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                Makes a new link. Anyone holding the old one loses access.
              </p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
