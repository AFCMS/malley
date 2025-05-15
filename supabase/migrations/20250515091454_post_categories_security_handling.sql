set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.user_is_author_of_post_to_categorise()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  IF EXISTS (
    (select profile from authors where post = NEW.post and profile = (select auth.uid()))
  ) THEN
    RAISE EXCEPTION 'You are not an author of that post';
    RETURN NULL;
  END IF;
  RETURN NEW;

END;$function$
;

DROP FUNCTION IF EXISTS public.id_of_ensured_category;
CREATE OR REPLACE FUNCTION public.id_of_ensured_category(request text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  result text;
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

create policy "Enable read access for all users"
on "public"."categories"
as permissive
for select
to public
using (true);


create policy "Enable insert for authenticated users only"
on "public"."postsCategories"
as permissive
for insert
to authenticated
with check (true);


CREATE TRIGGER enforce_user_is_author_of_post_to_categorise BEFORE INSERT OR DELETE ON public."postsCategories" FOR EACH STATEMENT EXECUTE FUNCTION user_is_author_of_post_to_categorise();



