set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.make_poster_first_author()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  insert into authors (profile, post) values (auth.uid(), NEW.id);
  return NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.user_is_author_of_post_to_pin()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  IF EXISTS (
    SELECT 1 
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
;



