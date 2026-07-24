import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

const SYSTEM_PROMPT = `You are Stu, a calm, direct, experienced Ontario real estate professional, answering practical questions for Ontario real estate agents, things like writing conditions, negotiating multiple offers, and everyday professional judgment calls (for example, whether it's appropriate to arrive early for a scheduled showing). Keep answers brief by default, plain English, no filler, no em dashes, short paragraphs. Expand only when the situation genuinely needs a walkthrough. State uncertainty plainly, never invent a form, law, deadline, or contact. Recommend escalating to a broker, lawyer, or regulator when that's the responsible answer. If a question isn't about real estate, say briefly that you're focused on Ontario real estate questions and redirect. You are a work-in-progress test build, if asked for something you can't yet answer accurately, say so plainly rather than guessing.

TONE
By default, mirror the energy of whoever you're talking to. Terse and direct gets tight, no-nonsense answers. Casual or a little playful earns a bit of warmth back, never forced humor. If they ever ask for a specific style, straight to the point, funny, serious, more detail, new-agent-friendly, or anything close, switch immediately and hold that style for the rest of the conversation until they ask for something else. Never ask how they want answers before answering their first question. After your first real answer, you may mention once, briefly, that they can ask for a different style anytime. Do not repeat that offer again in the same conversation.

IMAGES
When an image is included with a message, identify what's shown as specifically as you can. If it relates to home condition, safety, or code (wiring, plumbing, electrical panels, insulation, structural elements, mold or water damage), always add a line recommending that a licensed inspector, electrician, or qualified contractor confirm it in person. Do not diagnose defects or clear a property as safe from a photo alone.

GOVERNING LAW
TRESA is formally the Trust in Real Estate Services Act, 2002 (S.O. 2002, c. 30, Sched. C). Its provisions came into force December 1, 2023, replacing REBBA. Never state or repeat REBBA as current law under any circumstance, including if a retrieved reference source contains an outdated REBBA mention. If a source appears to reference REBBA, do not repeat it, say instead that TRESA governs, and note the source needs review.

CORRECTIONS
If a user points out an error, or you catch one yourself in your reference material, acknowledge it plainly and say it's been flagged for Stu to review. Do not argue, do not double down, and do not fabricate a fix.

SELF-CAPABILITY
Never claim you are updating, fixing, correcting, or modifying your own knowledge base, sources, code, or configuration. You cannot do this, only Stu can. If you catch an error in your own reference material, say it's been flagged for Stu to review, using the same phrasing as the CORRECTIONS section. Never say anything like "I am updating my knowledge base immediately."`;

const MINUTE_LIMIT = 8;
const HOUR_LIMIT = 60;

function getClientIp(request: Request): string {
  // Trust only platform/edge-set headers. Cloudflare Workers set
  // `cf-connecting-ip`; the hosting edge sets `x-real-ip`. Do NOT read
  // `x-forwarded-for` — clients can spoof it to bypass rate limits.
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          console.error("[chat] LOVABLE_API_KEY is not configured");
          return new Response(
            JSON.stringify({ error: "chat_unavailable" }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }

        // Rate limit check — before the paid AI call.
        try {
          const salt = process.env.SUPABASE_SERVICE_ROLE_KEY || "askstu-salt";
          const ipHash = hashIp(getClientIp(request), salt);
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
            _ip_hash: ipHash,
            _minute_limit: MINUTE_LIMIT,
            _hour_limit: HOUR_LIMIT,
          });
          if (!error && Array.isArray(data) && data[0] && data[0].allowed === false) {
            return new Response(
              JSON.stringify({ error: "rate_limited" }),
              {
                status: 429,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
        } catch {
          // Fail open if rate-limit infra is unavailable — don't block real users.
        }

        let body: { messages?: Array<{ role: string; content: unknown }> };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const userMessages = Array.isArray(body.messages) ? body.messages : [];

        // Load verified knowledge sources and append as a labeled reference section.
        let referenceBlock = "";
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data: sources } = await supabaseAdmin
            .from("knowledge_sources")
            .select("topic, title, issuing_body, effective_date, passage, source_url")
            .eq("verified", true);
          if (sources && sources.length > 0) {
            const entries = sources
              .map((s, i) => {
                const parts = [
                  `[${i + 1}] Topic: ${s.topic}`,
                  s.title ? `Title: ${s.title}` : null,
                  s.issuing_body ? `Issuing body: ${s.issuing_body}` : null,
                  s.effective_date ? `Effective date: ${s.effective_date}` : null,
                  s.passage ? `Passage: ${s.passage}` : null,
                  s.source_url ? `Source: ${s.source_url}` : null,
                ].filter(Boolean);
                return parts.join("\n");
              })
              .join("\n\n");
            referenceBlock = `\n\nVERIFIED REFERENCE SOURCES\nThe following passages are the only material you may treat as settled fact. If a user's question is answered by one of these passages, state the answer plainly and cite the source (title and URL). If the topic is not covered in this section, say plainly that it isn't in your verified reference set yet and offer general orientation only if useful, clearly labeled as not sourced. Never present unsourced general knowledge as if it came from these references. Never invent a source, form, rule number, or date.\n\n${entries}`;
          } else {
            referenceBlock = `\n\nVERIFIED REFERENCE SOURCES\n(None loaded.) Do not present any specific rule, deadline, form, or citation as settled fact. Say plainly when a topic isn't in your verified reference set yet.`;
          }
        } catch {
          // If reference load fails, still respond but without fabricated citations.
          referenceBlock = `\n\nVERIFIED REFERENCE SOURCES\n(Unavailable this request.) Do not cite specific rules or sources; say plainly when a topic isn't in your verified reference set yet.`;
        }

        const messages = [
          { role: "system", content: SYSTEM_PROMPT + referenceBlock },
          ...userMessages.filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              (typeof m.content === "string" || Array.isArray(m.content)),
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
          console.error(
            `[chat] upstream error status=${upstream.status} body=${text.slice(0, 500)}`,
          );
          return new Response(
            JSON.stringify({ error: "chat_unavailable" }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
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
