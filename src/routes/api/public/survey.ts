import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import { SURVEY_QUESTIONS } from "@/lib/survey-questions";

const VALID_KEYS = new Set(SURVEY_QUESTIONS.map((q) => q.key));
const VALID_TYPES = new Set(["multiple_choice", "short_answer", "true_false"]);

function getClientIp(request: Request): string {
  // Trust only platform/edge-set headers; ignore client-supplied x-forwarded-for.
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export const Route = createFileRoute("/api/public/survey")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: {
          question_key?: string;
          question_text?: string;
          question_type?: string;
          answer?: string;
        };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const { question_key, question_text, question_type, answer } = body;
        if (
          typeof question_key !== "string" ||
          !VALID_KEYS.has(question_key) ||
          typeof question_text !== "string" ||
          question_text.length === 0 ||
          question_text.length > 500 ||
          typeof question_type !== "string" ||
          !VALID_TYPES.has(question_type) ||
          typeof answer !== "string" ||
          answer.length === 0 ||
          answer.length > 2000
        ) {
          return new Response("Invalid payload", { status: 400 });
        }

        try {
          const salt = process.env.SUPABASE_SERVICE_ROLE_KEY || "askstu-salt";
          const ipHash = hashIp(getClientIp(request), salt);
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { error } = await supabaseAdmin
            .from("survey_responses")
            .insert({
              question_key,
              question_text,
              question_type,
              answer,
              ip_hash: ipHash,
            });
          if (error) {
            return new Response("Insert failed", { status: 500 });
          }
        } catch {
          return new Response("Server error", { status: 500 });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
