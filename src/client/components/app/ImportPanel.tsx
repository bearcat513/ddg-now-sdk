import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { api } from "../../lib/api";
import type { Field } from "../../../server/lib/types";

const EXAMPLES: Record<string, string> = {
  JSON: `{
  "id": "0e5b6c1e-1f2a-4c3b-9d4e-5f6a7b8c9d0e",
  "first_name": "Ada",
  "email": "ada@example.com",
  "status": "active",
  "signup_count": 3,
  "mrr": 149.0,
  "is_admin": false,
  "created_at": "2024-03-01T10:00:00Z",
  "tags": ["beta", "enterprise"],
  "address": { "city": "Austin", "state": "TX", "zip": "78701" }
}`,
  TypeScript: `export interface Order {
  id: string;
  customerName: string;
  email: string;
  itemCount: number;
  total: number;
  status: "pending" | "shipped" | "delivered";
  shippedAt?: Date;
  tags: string[];
  shipping: { city: string; postalCode: string };
}`,
  SQL: `CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  department VARCHAR(60),
  job_title VARCHAR(120),
  salary NUMERIC(10,2) NOT NULL,
  hired_at TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);`,
};

type Props = {
  onInferred: (fields: Field[], notes: string[], detected: string) => void;
  onError: (message: string) => void;
};

export function ImportPanel({ onInferred, onError }: Props) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function infer() {
    setBusy(true);
    try {
      const result = await api.infer(input);
      onInferred(result.fields, result.notes, result.detected);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not infer a schema.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Paste a structure, or try an example:</span>
        {Object.entries(EXAMPLES).map(([label, sample]) => (
          <Button key={label} variant="outline" size="sm" className="font-mono" onClick={() => setInput(sample)}>
            {label}
          </Button>
        ))}
      </div>

      <Textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Paste a JSON sample, a TypeScript interface, or a CREATE TABLE statement…"
        className="min-h-56 bg-card font-mono text-xs leading-relaxed shadow-xs"
        spellCheck={false}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={infer} disabled={busy || !input.trim()} className="shadow-sm">
          {busy ? <Loader2 className="animate-spin" /> : <Wand2 />}
          {busy ? "Inferring…" : "Infer schema"}
        </Button>
        <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 shrink-0" />
          Types are guessed from field names and value shapes — every one stays editable.
        </p>
      </div>
    </div>
  );
}
