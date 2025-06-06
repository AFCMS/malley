CREATE OR REPLACE FUNCTION public.id_of_ensured_category(request text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  result text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF NOT EXISTS (SELECT * FROM categories WHERE name = request) THEN
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
