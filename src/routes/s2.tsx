import { createFileRoute } from "@tanstack/react-router";
import { ChatSurface } from "@/components/ChatSurface";

export const Route = createFileRoute("/s2")({
  head: () => ({
    meta: [
      { title: "S2 — AskStu.ca" },
      {
        name: "description",
        content:
          "Chat with S2, a practical assistant for Ontario real estate agents.",
      },
      { property: "og:title", content: "S2 — AskStu.ca" },
      {
        property: "og:description",
        content:
          "Chat with S2, a practical assistant for Ontario real estate agents.",
      },
    ],
  }),
  component: S2Page,
});

function S2Page() {
  return <ChatSurface variant="full" />;
}
