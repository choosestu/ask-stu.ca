CREATE TABLE public.survey_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_key text NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL,
  answer text NOT NULL,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.survey_responses TO service_role;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: inserts go through the server route using service role.
