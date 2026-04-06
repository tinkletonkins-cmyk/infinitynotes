-- Allow anonymous users to create and view voids (for guest multiplayer)
DROP POLICY IF EXISTS "Authenticated users can create voids" ON public.voids;

CREATE POLICY "Anyone can create voids" ON public.voids
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view voids" ON public.voids
  FOR SELECT USING (true);
