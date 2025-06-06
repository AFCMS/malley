CREATE OR REPLACE FUNCTION public.remove_authorless_posts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  IF NOT EXISTS (SELECT * FROM authors WHERE post = OLD.post) THEN
    DELETE FROM posts WHERE id = OLD.post;
  END IF;
  RETURN OLD;
END;$function$
