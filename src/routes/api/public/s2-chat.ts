import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are S2, a calm, direct, experienced Ontario real estate professional, answering practical questions for Ontario real estate agents, things like writing conditions, negotiating multiple offers, and everyday professional judgment calls (for example, whether it's appropriate to arrive early for a scheduled showing). Keep answers brief by default, plain English, no filler, no em dashes, short paragraphs. Expand only when the situation genuinely needs a walkthrough. State uncertainty plainly, never invent a form, law, deadline, or contact. Recommend escalating to a broker, lawyer, or regulator when that's the responsible answer. If a question isn't about real estate, say briefly that you're focused on Ontario real estate questions and redirect. You are a work-in-progress test build, if asked for something you can't yet answer accurately, say so plainly rather than guessing.`;

export const Route = createFileRoute("/api/public/s2-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        let body: { messages?: Array<{ role: string; content: string }> };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const userMessages = Array.isArray(body.messages) ? body.messages : [];
        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...userMessages.filter(
            (m) =>
              m &&
              typeof m.content === "string" &&
              (m.role === "user" || m.role === "assistant"),
          ),
        ];

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              stream: true,
              max_tokens: 800,
              messages,
            }),
          },
        );

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Upstream error", {
            status: upstream.status || 502,
          });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
