import { useSyncExternalStore, useCallback } from "react";
import type { SurveyQuestion } from "./survey-questions";
import { pickRandomSurveyQuestion } from "./survey-questions";

export type ChatRole = "user" | "assistant" | "survey";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  imageDataUrl?: string;
  streaming?: boolean;
  survey?: SurveyQuestion;
  surveyAnswer?: string;
  surveyRevealed?: boolean;
}

interface PendingSend {
  text: string;
  imageDataUrl?: string;
}

interface ChatState {
  messages: ChatMessage[];
  status: "idle" | "streaming" | "error";
  error: string | null;
  userMessageCount: number;
  surveyAsked: boolean;
  pendingSurveyId: string | null;
  pendingSend: PendingSend | null;
}

let state: ChatState = {
  messages: [],
  status: "idle",
  error: null,
  userMessageCount: 0,
  surveyAsked: false,
  pendingSurveyId: null,
  pendingSend: null,
};
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

function toPayloadContent(m: ChatMessage, includeImage: boolean): PayloadContent {
  if (m.role === "user" && m.imageDataUrl && includeImage) {
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

async function actuallySend(text: string, imageDataUrl?: string) {
  const trimmed = text.trim();
  if (!trimmed && !imageDataUrl) return;

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
    userMessageCount: state.userMessageCount + 1,
  });

  const priorChat = state.messages.filter(
    (m) => !m.streaming && (m.role === "user" || m.role === "assistant"),
  );
  const payload = priorChat.map((m, i) => ({
    role: m.role,
    content: toPayloadContent(m, i === priorChat.length - 1),
  }));

  try {
    const res = await fetch("/api/public/chat", {
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

async function sendMessage(text: string, imageDataUrl?: string) {
  const trimmed = text.trim();
  if ((!trimmed && !imageDataUrl) || state.status === "streaming") return;
  if (state.pendingSurveyId) return;

  // Intercept before the 6th user message with a random survey question.
  if (!state.surveyAsked && state.userMessageCount >= 5) {
    const q = pickRandomSurveyQuestion();
    const surveyMsg: ChatMessage = {
      id: uid(),
      role: "survey",
      content: "",
      survey: q,
    };
    setState({
      messages: [...state.messages, surveyMsg],
      pendingSurveyId: surveyMsg.id,
      pendingSend: { text: trimmed, imageDataUrl },
    });
    return;
  }

  await actuallySend(trimmed, imageDataUrl);
}

async function submitSurveyAnswer(messageId: string, answer: string) {
  const msg = state.messages.find((m) => m.id === messageId);
  if (!msg || msg.role !== "survey" || !msg.survey) return;
  const q = msg.survey;

  // Update UI immediately.
  setState({
    messages: state.messages.map((m) =>
      m.id === messageId
        ? {
            ...m,
            surveyAnswer: answer,
            surveyRevealed: q.type === "true_false" ? true : m.surveyRevealed,
          }
        : m,
    ),
  });

  // Fire-and-forget insert; don't block continuation on network failure.
  try {
    await fetch("/api/public/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_key: q.key,
        question_text: q.text,
        question_type: q.type,
        answer,
      }),
    });
  } catch {
    /* swallow — survey persistence is best-effort */
  }

  // For true_false, wait for continueAfterSurvey (user sees reveal + try it).
  if (q.type === "true_false") return;

  finishSurvey();
}

function finishSurvey() {
  const pending = state.pendingSend;
  setState({
    surveyAsked: true,
    pendingSurveyId: null,
    pendingSend: null,
  });
  if (pending) {
    void actuallySend(pending.text, pending.imageDataUrl);
  }
}

function reset() {
  setState({
    messages: [],
    status: "idle",
    error: null,
    userMessageCount: 0,
    surveyAsked: false,
    pendingSurveyId: null,
    pendingSend: null,
  });
}

export function useChat() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    messages: snap.messages,
    status: snap.status,
    error: snap.error,
    pendingSurveyId: snap.pendingSurveyId,
    sendMessage: useCallback(sendMessage, []),
    submitSurveyAnswer: useCallback(submitSurveyAnswer, []),
    continueAfterSurvey: useCallback(finishSurvey, []),
    reset: useCallback(reset, []),
  };
}
