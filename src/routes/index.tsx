import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AskStu.ca" },
      {
        name: "description",
        content:
          "Practical answers for Ontario real estate agents.",
      },
      { property: "og:title", content: "AskStu.ca" },
      {
        property: "og:description",
        content:
          "Practical answers for Ontario real estate agents.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 py-16">
      <div className="max-w-xl">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Ask Stu.
        </h1>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            After 28 years in Ontario real estate, I've answered thousands of questions from new agents. Everything from identifying what's in a mechanical room to writing offers, negotiating deals, understanding TRESA, paperwork, inspections, and everyday situations that don't get taught in licensing courses.
          </p>
          <p>Ask a question. Upload a photo. Get an answer.</p>
          <p>Free. No account required.</p>
          <p>Go ahead. Ask Stu.</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/s2"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ask Stu
          </Link>
          <Link
            to="/s2"
            search={{ photo: 1 }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Camera className="h-4 w-4" />
            What is this?
          </Link>
        </div>
      </div>
    </main>
  );
}
