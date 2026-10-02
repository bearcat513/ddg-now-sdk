import { lazy, Suspense, useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Lock, PenLine } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { api } from "../../lib/api";
import { timeAgo } from "../../lib/timeAgo";
import { WHITEBOARD_SHARE_PARAM, type PublicWhiteboard } from "../../../server/lib/whiteboard";

/** Its own chunk, as in the studio: it is most of what this page downloads. */
const WhiteboardCanvas = lazy(() => import("./WhiteboardCanvas"));

type State =
  | { kind: "loading" }
  | { kind: "password"; error?: string; checking: boolean }
  | { kind: "board"; board: PublicWhiteboard }
  | { kind: "failed"; message: string };

/** The OS theme, live — a stranger has no stored preference to read. */
function useSystemDark(): boolean {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setDark(media.matches);
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);
  return dark;
}

/**
 * One publicly shared whiteboard, read only.
 *
 * The token comes from the URL, and the page asks for a password only when
 * the server says the board has one. The password lives in this component's
 * state for as long as the tab is open and nowhere else — not the URL, not
 * storage — so closing the tab is how a viewer forgets it.
 */
export function SharedWhiteboard() {
  const dark = useSystemDark();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const token = new URLSearchParams(window.location.search).get(WHITEBOARD_SHARE_PARAM) ?? "";

  const open = useCallback(
    async (attempt?: string) => {
      try {
        const result = await api.openPublicWhiteboard(token, attempt);
        if ("board" in result) {
          document.title = result.board.name;
          setState({ kind: "board", board: result.board });
        } else {
          setState({ kind: "password", error: result.error, checking: false });
        }
      } catch (error) {
        setState({
          kind: "failed",
          message: error instanceof Error ? error.message : "This whiteboard could not be opened.",
        });
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) {
      setState({ kind: "failed", message: "This link is missing its whiteboard token." });
      return;
    }
    void open();
  }, [token, open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!password) return;
    setState({ kind: "password", checking: true });
    void open(password);
  };

  if (state.kind === "board") {
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <header className="flex items-center gap-3 border-b bg-card/40 px-4 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <PenLine className="size-4" />
          </span>
          <h1 className="min-w-0 flex-1 truncate font-medium">{state.board.name}</h1>
          <p className="shrink-0 text-xs text-muted-foreground">
            Read only
            {/* sys_updated_on is UTC without a zone; say so before parsing it. */}
            {state.board.updatedAt && ` · updated ${timeAgo(`${state.board.updatedAt.replace(" ", "T")}Z`)}`}
          </p>
        </header>
        <div className="relative min-h-0 flex-1">
          <Suspense fallback={<Centered><Loader2 className="size-4 animate-spin" /> Loading the whiteboard…</Centered>}>
            <div className="absolute inset-0">
              <WhiteboardCanvas scene={state.board.scene} dark={dark} name={state.board.name} readOnly />
            </div>
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4 text-foreground">
      {state.kind === "loading" && (
        <Centered>
          <Loader2 className="size-4 animate-spin" /> Opening the whiteboard…
        </Centered>
      )}

      {state.kind === "failed" && <p className="max-w-sm text-center text-sm text-muted-foreground">{state.message}</p>}

      {state.kind === "password" && (
        <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Lock className="size-4" />
            </span>
            <h1 className="font-medium">This whiteboard is password protected</h1>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="share-password">Password</Label>
            <Input
              id="share-password"
              type="password"
              autoFocus
              autoComplete="off"
              value={password}
              onChange={event => setPassword(event.target.value)}
              aria-invalid={Boolean(state.error)}
            />
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          </div>
          <Button type="submit" disabled={!password || state.checking}>
            {state.checking && <Loader2 className="animate-spin" />}
            Open
          </Button>
        </form>
      )}
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">{children}</div>;
}
