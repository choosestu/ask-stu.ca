import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { ChatSurface } from "@/components/ChatSurface";

const chatSearchSchema = z.object({
  photo: fallback(z.number().int(), 0).default(0),
});

export const Route = createFileRoute("/chat")({
  validateSearch: zodValidator(chatSearchSchema),
  head: () => ({
    meta: [
      { title: "Ask Stu — Chat" },
      {
        name: "description",
        content:
          "Ask Stu practical Ontario real estate questions. 28 years of experience, free, no account required.",
      },
      { property: "og:title", content: "Ask Stu — Chat" },
      {
        property: "og:description",
        content:
          "Ask Stu practical Ontario real estate questions. 28 years of experience, free, no account required.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { photo } = Route.useSearch();
  return <ChatSurface variant="full" autoOpenPhoto={photo === 1} />;
}
