
CREATE TABLE public.knowledge_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic text NOT NULL,
  title text,
  issuing_body text,
  effective_date date,
  passage text,
  source_url text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.knowledge_sources TO service_role;

ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

-- No policies: table is only accessed server-side via service_role.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_knowledge_sources_updated_at
BEFORE UPDATE ON public.knowledge_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.knowledge_sources (topic, title, issuing_body, effective_date, passage, source_url, verified) VALUES
('mls_timing', 'REALTOR® Cooperation Policy — 3-Day MLS Rule', 'CREA (Canadian Real Estate Association)', '2024-01-03',
'Once a property is publicly marketed in any way (yard sign, "Coming Soon" signage, social media, flyers, newsletters), CREA''s national REALTOR® Cooperation Policy requires it be entered on the local board''s MLS system within 3 days. This is a national floor, local boards may set stricter rules. TRREB specifically requires entry within 2 TRREB business days (Mon–Fri, excluding statutory holidays) of the commencement date under MLS Rule R-365. Note: this is a CREA/board MLS rule, not a TRESA statutory requirement, don''t attribute it to TRESA.',
'https://www.crea.ca/media-hub/news/a-new-duty-of-cooperation-added-to-the-realtor-code/', true),
('representation_basics', NULL, NULL, NULL, NULL, NULL, false),
('human_rights_disclosure', NULL, NULL, NULL, NULL, NULL, false),
('deposit_trust_handling', NULL, NULL, NULL, NULL, NULL, false),
('fintrac_id_verification', NULL, NULL, NULL, NULL, NULL, false);
