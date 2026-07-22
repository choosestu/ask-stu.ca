import { createFileRoute, Link } from "@tanstack/react-router";

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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          AskStu.ca
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Practical answers for Ontario real estate agents.
        </p>
        <div className="mt-8">
          <Link
            to="/s2"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open S2
          </Link>
        </div>
      </div>
    </main>
  );
}
