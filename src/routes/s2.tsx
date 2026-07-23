import { createFileRoute } from "@tanstack/react-router";
import { ChatSurface } from "@/components/ChatSurface";

export const Route = createFileRoute("/s2")({
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
  component: S2Page,
});

function S2Page() {
  return <ChatSurface variant="full" />;
}
