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
      <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="order-1 flex justify-center md:order-1">
          <img
            src="/stu-portrait.png"
            alt="Portrait of Stu"
            className="w-full max-w-sm rounded-2xl"
          />
        </div>
        <div className="order-2 md:order-2">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Ask Stu.
          </h1>
          <blockquote className="mt-6 border-l-2 border-border pl-4">
            <p className="text-base leading-relaxed text-foreground">
              &ldquo;After 28 years in Ontario real estate, I've answered thousands of questions from new agents. Everything from identifying what's in a mechanical room to writing offers, negotiating deals, understanding TRESA, paperwork, inspections, and everyday situations that don't get taught in licensing courses.&rdquo;
            </p>
            <footer className="mt-3 text-sm text-muted-foreground">— Stu</footer>
          </blockquote>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Ask a question. Upload a photo. Get an answer.
            <br />
            Free. No account required.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Go ahead. Ask Stu.
          </p>
          <div className="mt-8">
            <Link
              to="/chat"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ask Stu
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
