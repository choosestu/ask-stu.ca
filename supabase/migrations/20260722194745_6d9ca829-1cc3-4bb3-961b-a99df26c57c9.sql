CREATE TABLE public.waitlist_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.waitlist_interest TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist_interest TO authenticated;
GRANT ALL ON public.waitlist_interest TO service_role;
ALTER TABLE public.waitlist_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit interest" ON public.waitlist_interest FOR INSERT TO anon, authenticated WITH CHECK (true);