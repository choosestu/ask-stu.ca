import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { useS2Chat } from "@/lib/s2-chat-store";
import { compressImageToDataUrl } from "@/lib/image-compress";
import { PaperworkCTA } from "./PaperworkCTA";

interface Props {
  variant: "panel" | "full";
  autoOpenPhoto?: boolean;
}

const SUGGESTIONS = [
  "How do I find a septic tank?",
  "Can I go in early for a scheduled showing?",
  "What's the deposit timeline rule?",
  "What's this in the electrical panel?",
];

const GREETING =
  "I'm S2, ask me anything about Ontario real estate, or upload a photo of something you're not sure about.";

export function ChatSurface({ variant, autoOpenPhoto }: Props) {
  const { messages, status, error, sendMessage } = useS2Chat();
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [preparingImage, setPreparingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const submit = (text: string, image?: string) => {
    if (!text.trim() && !image) return;
    void sendMessage(text, image);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !pendingImage) return;
    const text = input;
    const image = pendingImage ?? undefined;
    setInput("");
    setPendingImage(null);
    submit(text, image);
  };

  const onPickPhoto = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPreparingImage(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setPendingImage(dataUrl);
    } catch {
      // ignore — user can retry
    } finally {
      setPreparingImage(false);
    }
  };

  const isFull = variant === "full";
  const isEmpty = messages.length === 0;
  const disabled =
    status === "streaming" ||
    preparingImage ||
    (!input.trim() && !pendingImage);

  const composer = (
    <form
      onSubmit={onSubmit}
      className={
        isEmpty
          ? "w-full"
          : "border-t border-border bg-background p-3"
      }
    >
      <div className="mx-auto max-w-2xl">
        {(pendingImage || preparingImage) && (
          <div className="mb-2 flex items-center gap-2">
            {pendingImage ? (
              <div className="relative">
                <img
                  src={pendingImage}
                  alt="Preview"
                  className="h-16 w-16 rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  aria-label="Remove photo"
                  className="absolute -right-2 -top-2 rounded-full bg-background border border-border p-0.5 text-foreground shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Preparing photo…
              </div>
            )}
          </div>
        )}
        <div className="flex items-end gap-2">
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
            placeholder={pendingImage ? "Add a caption (optional)…" : "Ask S2…"}
            className="min-h-[40px] max-h-32 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            type="button"
            onClick={onPickPhoto}
            disabled={status === "streaming" || preparingImage}
            aria-label="Attach a photo"
            title="Attach a photo"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex h-10 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );

  // Empty-state centered layout (greeting + suggestions + composer together).
  if (isEmpty) {
    return (
      <div
        className={
          isFull
            ? "flex h-[100dvh] flex-col items-center justify-center bg-background px-4 py-6"
            : "flex h-[70vh] max-h-[560px] flex-col items-center justify-center px-4 py-4"
        }
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="text-center text-base text-foreground">
            {GREETING}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => submit(q)}
                disabled={status === "streaming"}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
          {composer}
          {error && (
            <div className="text-center text-xs text-destructive">{error}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isFull
          ? "flex h-[100dvh] flex-col bg-background"
          : "flex h-[70vh] max-h-[560px] flex-col"
      }
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
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
                {m.role === "user" && m.imageDataUrl && (
                  <img
                    src={m.imageDataUrl}
                    alt="Attached"
                    className="mb-2 max-h-64 rounded-lg object-cover"
                  />
                )}
                {m.content || (m.streaming ? "…" : "")}
              </div>
              {m.role === "assistant" && !m.streaming && m.content && (
                <div className="self-start">
                  <PaperworkCTA />
                </div>
              )}
            </div>
          ))}
          {error && <div className="text-xs text-destructive">{error}</div>}
        </div>
      </div>
      {composer}
    </div>
  );
}
