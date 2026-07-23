
DROP POLICY IF EXISTS "Anyone can submit interest" ON public.waitlist_interest;

CREATE POLICY "Anyone can submit interest"
ON public.waitlist_interest
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 3 AND 254
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND note IS NOT NULL
  AND length(note) BETWEEN 1 AND 2000
);
