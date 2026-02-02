-- Drop the problematic policy
DROP POLICY IF EXISTS "Anyone can view public voids" ON public.voids;

-- Recreate without the recursive subquery to void_members
-- Instead, we'll check void_members separately using a security definer function
CREATE OR REPLACE FUNCTION public.user_is_void_member(check_void_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM void_members 
    WHERE void_id = check_void_id 
    AND user_id = auth.uid()
  );
$$;

-- Recreate the SELECT policy using the helper function
CREATE POLICY "Anyone can view public voids" 
ON public.voids 
FOR SELECT 
USING (
  is_public = true 
  OR owner_id = auth.uid() 
  OR user_is_void_member(id)
);