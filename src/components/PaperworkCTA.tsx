import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function PaperworkCTA() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (status === "done") {
    return (
      <div className="mt-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Thanks. We'll be in touch.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
      >
        Want help turning this into paperwork?
      </button>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !note.trim()) return;
    setStatus("submitting");
    setErrorMsg(null);
    const { error } = await supabase
      .from("waitlist_interest")
      .insert({ email: email.trim(), note: note.trim() });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("done");
  };

  return (
    <form
      onSubmit={submit}
      className="mt-2 flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3"
    >
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        type="text"
        required
        placeholder="What are you working on?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {status === "submitting" ? "Sending…" : "Send"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        {errorMsg && (
          <span className="text-xs text-destructive">{errorMsg}</span>
        )}
      </div>
    </form>
  );
}
