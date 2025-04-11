set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_co_authoring(post_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  if post_id in (select post from pendingAuthors where to_profile = auth.uid())
  then
    delete from pendingAuthors
    where to_profile = auth.uid()
    and post = post_id;
    insert into authors values(
      auth.uid(),
      post_id()
    );

    return true;
  end if;
  return false;
END;$function$
;

CREATE OR REPLACE FUNCTION public.id_of_ensured_category(request text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$DECLARE
  result INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = request) THEN
    INSERT INTO categories (name) 
    VALUES (request)
    RETURNING id INTO result;
  ELSE
    SELECT id INTO result
    FROM categories 
    WHERE name = request;
  END IF;
  RETURN result;
END;$function$
;

CREATE OR REPLACE FUNCTION public.make_poster_first_author()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  insert into authors (profile, post) values (auth.uid(), NEW.id);
END;$function$
;

CREATE OR REPLACE FUNCTION public.remove_authorless_posts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  IF NOT EXISTS (SELECT 1 FROM authors WHERE id = OLD.id) THEN
    DELETE FROM posts WHERE id = OLD.id;
  END IF;
  RETURN OLD;
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
  END IF;
  RETURN NEW;

END;$function$
;



