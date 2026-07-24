import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { useChat } from "@/lib/chat-store";
import { compressImageToDataUrl } from "@/lib/image-compress";
import { PaperworkCTA } from "./PaperworkCTA";
import type { ChatMessage } from "@/lib/chat-store";
import { Markdown } from "@/lib/markdown";

interface Props {
  variant: "panel" | "full";
  autoOpenPhoto?: boolean;
}

export function ChatSurface({ variant, autoOpenPhoto = false }: Props) {
  const {
    messages,
    status,
    error,
    sendMessage,
    submitSurveyAnswer,
    continueAfterSurvey,
    pendingSurveyId,
  } = useChat();
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [preparingImage, setPreparingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (autoOpenPhoto && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      // Give the input a tick to mount, then open the picker.
      const t = setTimeout(() => fileInputRef.current?.click(), 60);
      return () => clearTimeout(t);
    }
  }, [autoOpenPhoto]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !pendingImage) return;
    const text = input;
    const image = pendingImage ?? undefined;
    setInput("");
    setPendingImage(null);
    void sendMessage(text, image);
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
  const isLocked = pendingSurveyId !== null;
  const disabled =
    status === "streaming" ||
    preparingImage ||
    isLocked ||
    (!input.trim() && !pendingImage);

  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && !m.streaming && m.content)?.id;

  const onAreYouSure = () => {
    if (status === "streaming" || isLocked) return;
    void sendMessage("Are you sure?");
  };

  const shell = isFull
    ? "flex h-[100dvh] flex-col bg-background sm:h-[calc(100dvh-2rem)] sm:my-4 sm:mx-auto sm:max-w-3xl sm:rounded-2xl sm:border sm:border-border sm:overflow-hidden"
    : "flex h-[70vh] max-h-[560px] flex-col";

  return (
    <div className={isFull ? "bg-background sm:min-h-[100dvh]" : undefined}>
    <div className={shell}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mx-auto mt-2 mb-6 max-w-xl overflow-hidden rounded-2xl border border-border">
            <div className="relative">
              <img
                src="/stu-portrait.png"
                alt=""
                aria-hidden="true"
                className="h-64 w-full object-cover object-top sm:h-80"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/85" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-sm leading-relaxed">
                  Hi. My name is Stu. Thanks for popping by. Over fifty percent of us did one deal or less last year, which means we don't have extra money lying around to pay for expensive AI programs, apps, and fancy marketing material. So I decided to create this so everybody has easy access to reasonably reliable information. That said, AI hallucinates and makes mistakes, so if something doesn't seem right, I've included an "Are you sure?" button, feel free to click that for a second opinion. I hope you like this app. Please let me know if you do.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((m) => {
            if (m.role === "survey" && m.survey) {
              return (
                <SurveyCard
                  key={m.id}
                  message={m}
                  onAnswer={(answer) => submitSurveyAnswer(m.id, answer)}
                  onContinue={continueAfterSurvey}
                  onPrefill={(text) => setInput(text)}
                  onOpenPhoto={onPickPhoto}
                />
              );
            }
            return (
              <div key={m.id} className="flex flex-col">
                <div
                  className={
                    m.role === "user"
                      ? "self-end rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground max-w-[85%] whitespace-pre-wrap"
                      : "self-start rounded-2xl bg-muted px-3 py-2 text-sm text-foreground max-w-[95%]"
                  }
                >
                  {m.role === "user" && m.imageDataUrl && (
                    <img
                      src={m.imageDataUrl}
                      alt="Attached"
                      className="mb-2 max-h-64 rounded-lg object-cover"
                    />
                  )}
                  {m.role === "assistant" ? (
                    m.content ? (
                      <Markdown text={m.content} />
                    ) : m.streaming ? (
                      "…"
                    ) : null
                  ) : (
                    m.content || (m.streaming ? "…" : "")
                  )}
                </div>
                {m.role === "assistant" && !m.streaming && m.content && (
                  <div className="self-start">
                    <PaperworkCTA />
                  </div>
                )}
              </div>
            );
          })}
          {error && <div className="text-xs text-destructive">{error}</div>}
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-border bg-background p-3"
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
              disabled={isLocked}
              placeholder={
                isLocked
                  ? "Answer the question above to continue…"
                  : pendingImage
                  ? "Add a caption (optional)…"
                  : "Ask Stu…"
              }
              className="min-h-[40px] max-h-32 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              {...(autoOpenPhoto ? {} : { capture: "environment" as const })}
              className="hidden"
              onChange={onFileChange}
            />

            <button
              type="button"
              onClick={onPickPhoto}
              disabled={status === "streaming" || preparingImage || isLocked}
              aria-label="What's this? Attach a photo"
              title="What's this?"
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
    </div>
  );
}

interface SurveyCardProps {
  message: ChatMessage;
  onAnswer: (answer: string) => void;
  onContinue: () => void;
  onPrefill: (text: string) => void;
  onOpenPhoto: () => void;
}

function SurveyCard({
  message,
  onAnswer,
  onContinue,
  onPrefill,
  onOpenPhoto,
}: SurveyCardProps) {
  const q = message.survey!;
  const answered = message.surveyAnswer;
  const [shortText, setShortText] = useState("");

  return (
    <div className="self-stretch rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Quick question from Stu
      </div>
      <div className="mb-3 text-foreground">{q.text}</div>

      {q.type === "multiple_choice" && q.options && (
        <div className="flex flex-wrap gap-2">
          {q.options.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={!!answered}
              onClick={() => onAnswer(opt)}
              className={
                "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                (answered === opt
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-foreground hover:bg-muted disabled:opacity-60")
              }
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {q.type === "short_answer" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = shortText.trim();
            if (!v || answered) return;
            onAnswer(v);
          }}
          className="flex items-end gap-2"
        >
          <input
            type="text"
            value={answered ?? shortText}
            onChange={(e) => setShortText(e.target.value)}
            disabled={!!answered}
            placeholder="Type your answer…"
            className="min-h-[40px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!!answered || !shortText.trim()}
            className="inline-flex h-10 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Submit
          </button>
        </form>
      )}

      {q.type === "true_false" && (
        <div className="flex flex-wrap gap-2">
          {(["True", "False"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={!!answered}
              onClick={() => onAnswer(opt)}
              className={
                "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                (answered === opt
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-foreground hover:bg-muted disabled:opacity-60")
              }
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {q.type === "true_false" && answered && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <div className="text-foreground">
            <span className="font-medium">Correct answer: {q.correct}.</span>{" "}
            {q.explanation}
          </div>
          <div className="flex flex-wrap gap-2">
            {q.tryPrefill && (
              <button
                type="button"
                onClick={() => {
                  onPrefill(q.tryPrefill!);
                  onContinue();
                }}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Try it
              </button>
            )}
            {q.tryOpenPhoto && (
              <button
                type="button"
                onClick={() => {
                  onOpenPhoto();
                  onContinue();
                }}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Try the photo button
              </button>
            )}
            <button
              type="button"
              onClick={onContinue}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
