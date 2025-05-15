drop trigger if exists "enforce_make_user_first_author" on "public"."posts";

drop trigger if exists "enforce_remove_authorless_posts" on "public"."authors";

drop trigger if exists "enforce_user_is_author_of_post_to_pin" on "public"."profiles";

drop policy "Allow individual insert access" on "public"."profiles";

drop function if exists "public"."remove_authorless_posts"();

drop function if exists "public"."user_is_author_of_post_to_pin"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.remove_autorless_posts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$BEGIN
  IF NOT EXISTS (SELECT 1 FROM authors WHERE id = OLD.id) THEN
    DELETE FROM posts WHERE id = OLD.id;
  END IF;
  RETURN OLD;
END;$function$
;

CREATE OR REPLACE FUNCTION public.user_is_autor_of_post_to_pin()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
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

create policy "Allow individual insert access"
on "public"."profiles"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = id));


CREATE TRIGGER enforce_make_poster_first_author AFTER INSERT ON public.posts FOR EACH STATEMENT EXECUTE FUNCTION make_poster_first_author();

CREATE TRIGGER enforce_remove_authorless_posts AFTER DELETE ON public.authors FOR EACH STATEMENT EXECUTE FUNCTION remove_autorless_posts();

CREATE TRIGGER enforce_user_is_author_of_post_to_pin BEFORE INSERT OR UPDATE ON public.profiles FOR EACH STATEMENT EXECUTE FUNCTION user_is_autor_of_post_to_pin();



