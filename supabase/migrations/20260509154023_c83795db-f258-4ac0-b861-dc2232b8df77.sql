CREATE OR REPLACE FUNCTION public.create_guest_void(_name text, _board_type text DEFAULT 'cosmic')
 RETURNS TABLE(id uuid, name text, invite_code text, board_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_void public.voids%ROWTYPE;
BEGIN
  INSERT INTO public.voids (name, owner_id, is_public, board_type)
  VALUES (
    COALESCE(NULLIF(trim(_name), ''), 'My Void'),
    NULL,
    false,
    COALESCE(NULLIF(trim(_board_type), ''), 'cosmic')
  )
  RETURNING * INTO new_void;

  RETURN QUERY
  SELECT new_void.id, new_void.name, new_void.invite_code, new_void.board_type;
END;
$function$;