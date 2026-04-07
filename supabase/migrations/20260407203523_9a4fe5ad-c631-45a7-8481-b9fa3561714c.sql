CREATE OR REPLACE FUNCTION public.user_has_void_access(check_void_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    check_void_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.voids
      WHERE id = check_void_id
        AND is_public = false
        AND invite_code IS NOT NULL
    )
    OR EXISTS (
      SELECT 1
      FROM public.voids
      WHERE id = check_void_id
        AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.void_members
      WHERE void_id = check_void_id
        AND user_id = auth.uid()
    );
$function$;

CREATE OR REPLACE FUNCTION public.create_guest_void(_name text)
RETURNS TABLE (id uuid, name text, invite_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_void public.voids%ROWTYPE;
BEGIN
  INSERT INTO public.voids (name, owner_id, is_public)
  VALUES (COALESCE(NULLIF(trim(_name), ''), 'My Void'), NULL, false)
  RETURNING * INTO new_void;

  RETURN QUERY
  SELECT new_void.id, new_void.name, new_void.invite_code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.lookup_multiplayer_void(_invite_code text)
RETURNS TABLE (id uuid, name text, invite_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT v.id, v.name, v.invite_code
  FROM public.voids v
  WHERE v.invite_code = UPPER(TRIM(_invite_code))
    AND v.is_public = false
  LIMIT 1;
$function$;