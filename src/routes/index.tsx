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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 py-16">
      <div className="max-w-xl">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Ask Stu.
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          Not everything needs to be big business. I've spent [X] years in Ontario real estate, and a lot of that time teaching newer agents what they're actually looking at inside a house, electric or gas water heater, 100 or 200 amp service, copper or knob and tube, why that humidifier's bolted to the furnace. So here's my way of giving some of that back. Ask a question. Take a photo of anything you're not sure about. Free, no account needed.
        </p>
        <div className="mt-8">
          <Link
            to="/s2"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ask Stu
          </Link>
        </div>
      </div>
    </main>
  );
}
