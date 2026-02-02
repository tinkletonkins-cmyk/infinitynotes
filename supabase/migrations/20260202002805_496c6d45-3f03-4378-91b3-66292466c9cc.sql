-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "View notes in accessible voids" ON public.notes;
DROP POLICY IF EXISTS "Create notes in accessible voids" ON public.notes;
DROP POLICY IF EXISTS "Update notes in accessible voids" ON public.notes;
DROP POLICY IF EXISTS "Delete notes in accessible voids" ON public.notes;

DROP POLICY IF EXISTS "View connections in accessible voids" ON public.note_connections;
DROP POLICY IF EXISTS "Create connections in accessible voids" ON public.note_connections;
DROP POLICY IF EXISTS "Delete connections in accessible voids" ON public.note_connections;

-- Create a security definer function to check void access without triggering RLS
CREATE OR REPLACE FUNCTION public.user_has_void_access(check_void_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    check_void_id IS NULL  -- Public void (null void_id)
    OR EXISTS (
      SELECT 1 FROM voids 
      WHERE id = check_void_id 
      AND (is_public = true OR owner_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM void_members 
      WHERE void_id = check_void_id 
      AND user_id = auth.uid()
    );
$$;

-- Recreate notes policies using the security definer function
CREATE POLICY "View notes in accessible voids" ON public.notes
  FOR SELECT USING (public.user_has_void_access(void_id));

CREATE POLICY "Create notes in accessible voids" ON public.notes
  FOR INSERT WITH CHECK (public.user_has_void_access(void_id));

CREATE POLICY "Update notes in accessible voids" ON public.notes
  FOR UPDATE USING (public.user_has_void_access(void_id));

CREATE POLICY "Delete notes in accessible voids" ON public.notes
  FOR DELETE USING (public.user_has_void_access(void_id));

-- Recreate note_connections policies using the security definer function
CREATE POLICY "View connections in accessible voids" ON public.note_connections
  FOR SELECT USING (public.user_has_void_access(void_id));

CREATE POLICY "Create connections in accessible voids" ON public.note_connections
  FOR INSERT WITH CHECK (public.user_has_void_access(void_id));

CREATE POLICY "Delete connections in accessible voids" ON public.note_connections
  FOR DELETE USING (public.user_has_void_access(void_id));