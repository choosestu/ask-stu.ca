import { createFileRoute } from "@tanstack/react-router";
import { ChatSurface } from "@/components/ChatSurface";

interface S2Search {
  photo?: number;
}

export const Route = createFileRoute("/s2")({
  validateSearch: (search: Record<string, unknown>): S2Search => ({
    photo: search.photo ? Number(search.photo) : undefined,
  }),
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
  const { photo } = Route.useSearch();
  return <ChatSurface variant="full" autoOpenPhoto={photo === 1} />;
}
