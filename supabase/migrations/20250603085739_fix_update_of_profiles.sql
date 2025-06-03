CREATE OR REPLACE FUNCTION public.user_is_author_of_post_to_pin()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  IF EXISTS (
    SELECT * 
    FROM unnest(NEW.pinned_posts) AS pinned_post
    EXCEPT
    SELECT post 
    FROM authors
    WHERE profile = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Pinned posts must be authored by the user';
    RETURN NULL;
  END IF;
  RETURN NEW;

END;$function$
