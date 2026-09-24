import { useState, type FormEvent } from "react";
import { AlertCircle, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type SessionUser } from "@/lib/api";

/** PocketBase's own minimum for the `users` collection. */
const MIN_PASSWORD = 8;

type Mode = "login" | "register";

/**
 * The whole app behind one form: sign in, or make an account.
 *
 * On success the server sets an httpOnly session cookie, so nothing here ever
 * holds a token — the page just learns who it is talking to.
 */
export function AuthPanel({ onSignedIn }: { onSignedIn: (user: SessionUser) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const registering = mode === "register";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { user } = registering
        ? await api.register({ email, password, name: name.trim() || undefined })
        : await api.login({ email, password });
      onSignedIn(user);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-background p-6 text-foreground">
      {/* A wash of the account's accent behind the card. It is the only place
          in the app with nothing else on screen, so it can carry some colour. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_50%_-20%,var(--color-primary),transparent_70%)] opacity-[0.07]"
      />

      <div className="relative w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-sm">
            <Database className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-tight">Dummy Data Generator</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {registering ? "Create an account to keep your own schemas." : "Sign in to your schemas and data."}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-5 shadow-lg">
          {registering && (
            <div>
              <Label htmlFor="auth-name" className="mb-1 text-xs">
                Name <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="auth-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
            </div>
          )}

          <div>
            <Label htmlFor="auth-email" className="mb-1 text-xs">
              Email
            </Label>
            <Input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="auth-password" className="mb-1 text-xs">
              Password
            </Label>
            <Input
              id="auth-password"
              type="password"
              required
              minLength={registering ? MIN_PASSWORD : undefined}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={registering ? "new-password" : "current-password"}
            />
            {registering && (
              <p className="mt-1 text-[11px] text-muted-foreground">At least {MIN_PASSWORD} characters.</p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-1.5 rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive animate-in fade-in-0 slide-in-from-top-1"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" className="mt-1 w-full shadow-sm" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {registering ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {registering ? "Already have an account?" : "No account yet?"}{" "}
          <button
            type="button"
            className="focus-ring rounded font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            onClick={() => switchMode(registering ? "login" : "register")}
          >
            {registering ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
