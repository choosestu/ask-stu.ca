import { useSyncExternalStore, useCallback } from "react";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  imageDataUrl?: string;
  streaming?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  status: "idle" | "streaming" | "error";
  error: string | null;
}

let state: ChatState = { messages: [], status: "idle", error: null };
const listeners = new Set<() => void>();

function setState(next: Partial<ChatState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return state;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

type PayloadContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

function toPayloadContent(m: ChatMessage): PayloadContent {
  if (m.role === "user" && m.imageDataUrl) {
    const parts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [];
    if (m.content) parts.push({ type: "text", text: m.content });
    parts.push({ type: "image_url", image_url: { url: m.imageDataUrl } });
    return parts;
  }
  return m.content;
}

async function sendMessage(text: string, imageDataUrl?: string) {
  const trimmed = text.trim();
  if ((!trimmed && !imageDataUrl) || state.status === "streaming") return;

  const userMsg: ChatMessage = {
    id: uid(),
    role: "user",
    content: trimmed,
    imageDataUrl,
  };
  const assistantMsg: ChatMessage = {
    id: uid(),
    role: "assistant",
    content: "",
    streaming: true,
  };

  setState({
    messages: [...state.messages, userMsg, assistantMsg],
    status: "streaming",
    error: null,
  });

  const payload = state.messages
    .filter((m) => !m.streaming)
    .map((m) => ({ role: m.role, content: toPayloadContent(m) }));

  try {
    const res = await fetch("/api/public/s2-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payload }),
    });
    if (res.status === 429) {
      throw new Error(
        "Getting a lot of questions right now, try again in a few minutes.",
      );
    }
    if (!res.ok || !res.body) {
      throw new Error(`Chat failed (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let acc = "";

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            acc += delta;
            setState({
              messages: state.messages.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: acc } : m,
              ),
            });
          }
        } catch {
          /* ignore parse errors on partial chunks */
        }
      }
    }

    setState({
      messages: state.messages.map((m) =>
        m.id === assistantMsg.id ? { ...m, streaming: false } : m,
      ),
      status: "idle",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    setState({
      messages: state.messages.map((m) =>
        m.id === assistantMsg.id
          ? { ...m, streaming: false, content: m.content || message }
          : m,
      ),
      status: "error",
      error: message,
    });
  }
}

function reset() {
  setState({ messages: [], status: "idle", error: null });
}

export function useS2Chat() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    messages: snap.messages,
    status: snap.status,
    error: snap.error,
    sendMessage: useCallback(sendMessage, []),
    reset: useCallback(reset, []),
  };
}
