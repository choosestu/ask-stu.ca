
CREATE TABLE public.rate_limit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash text NOT NULL,
  window_kind text NOT NULL CHECK (window_kind IN ('minute','hour')),
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ip_hash, window_kind, window_start)
);

GRANT ALL ON public.rate_limit TO service_role;

ALTER TABLE public.rate_limit ENABLE ROW LEVEL SECURITY;

CREATE INDEX rate_limit_lookup_idx ON public.rate_limit (ip_hash, window_kind, window_start);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _ip_hash text,
  _minute_limit integer,
  _hour_limit integer
)
RETURNS TABLE (allowed boolean, minute_count integer, hour_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  minute_bucket timestamptz := date_trunc('minute', now());
  hour_bucket timestamptz := date_trunc('hour', now());
  m_count integer;
  h_count integer;
BEGIN
  INSERT INTO public.rate_limit (ip_hash, window_kind, window_start, count)
  VALUES (_ip_hash, 'minute', minute_bucket, 1)
  ON CONFLICT (ip_hash, window_kind, window_start)
  DO UPDATE SET count = public.rate_limit.count + 1
  RETURNING count INTO m_count;

  INSERT INTO public.rate_limit (ip_hash, window_kind, window_start, count)
  VALUES (_ip_hash, 'hour', hour_bucket, 1)
  ON CONFLICT (ip_hash, window_kind, window_start)
  DO UPDATE SET count = public.rate_limit.count + 1
  RETURNING count INTO h_count;

  DELETE FROM public.rate_limit
  WHERE (window_kind = 'minute' AND window_start < now() - interval '10 minutes')
     OR (window_kind = 'hour' AND window_start < now() - interval '2 hours');

  RETURN QUERY SELECT
    (m_count <= _minute_limit AND h_count <= _hour_limit),
    m_count,
    h_count;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;
