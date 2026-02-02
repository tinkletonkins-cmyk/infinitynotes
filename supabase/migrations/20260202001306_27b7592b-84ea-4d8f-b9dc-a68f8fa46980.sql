-- Allow users to join voids via invite code (self-join)
DROP POLICY IF EXISTS "Owners can add members" ON public.void_members;

CREATE POLICY "Users can join via invite or owners can add" ON public.void_members
  FOR INSERT TO authenticated WITH CHECK (
    -- Owner can add anyone
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid())
    OR
    -- User can add themselves if void has an invite code
    (user_id = auth.uid() AND void_id IN (SELECT id FROM public.voids WHERE invite_code IS NOT NULL))
  );