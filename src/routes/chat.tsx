import { createFileRoute } from "@tanstack/react-router";
import { ChatSurface } from "@/components/ChatSurface";

type ChatSearch = { photo?: number };

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>): ChatSearch => {
    const raw = search.photo;
    const photo = typeof raw === "number" ? raw : Number(raw);
    return { photo: Number.isFinite(photo) ? photo : undefined };
  },
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
