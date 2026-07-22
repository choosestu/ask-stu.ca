import { useEffect, useRef, useState } from "react";
import { useS2Chat } from "@/lib/s2-chat-store";
import { PaperworkCTA } from "./PaperworkCTA";

interface Props {
  variant: "panel" | "full";
}

export function ChatSurface({ variant }: Props) {
  const { messages, status, error, sendMessage } = useS2Chat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input;
    setInput("");
    void sendMessage(text);
  };

  const isFull = variant === "full";

  return (
    <div
      className={
        isFull
          ? "flex h-[100dvh] flex-col bg-background"
          : "flex h-[70vh] max-h-[560px] flex-col"
      }
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="mx-auto max-w-md py-8 text-center text-sm text-muted-foreground">
            Ask S2 an Ontario real estate question.
          </div>
        )}
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col">
              <div
                className={
                  m.role === "user"
                    ? "self-end rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground max-w-[85%] whitespace-pre-wrap"
                    : "self-start rounded-2xl bg-muted px-3 py-2 text-sm text-foreground max-w-[95%] whitespace-pre-wrap"
                }
              >
                {m.content || (m.streaming ? "…" : "")}
              </div>
              {m.role === "assistant" && !m.streaming && m.content && (
                <div className="self-start">
                  <PaperworkCTA />
                </div>
              )}
            </div>
          ))}
          {error && (
            <div className="text-xs text-destructive">{error}</div>
          )}
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-border bg-background p-3"
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            rows={1}
            placeholder="Ask S2…"
            className="min-h-[40px] max-h-32 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={status === "streaming" || !input.trim()}
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
