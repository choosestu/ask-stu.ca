import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/s2")({
  beforeLoad: () => {
    throw redirect({ to: "/chat" });
  },
});
