-- Allow anyone (including anon) to create voids
DROP POLICY IF EXISTS "Authenticated users can create voids" ON public.voids;

CREATE POLICY "Anyone can create voids"
  ON public.voids
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to look up a void by invite code (needed for join flow)
DROP POLICY IF EXISTS "Anyone can view public voids" ON public.voids;

CREATE POLICY "Anyone can view voids"
  ON public.voids
  FOR SELECT
  USING (true);
