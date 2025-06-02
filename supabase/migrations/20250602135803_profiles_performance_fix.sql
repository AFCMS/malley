ALTER POLICY "Allow individual insert access" 
ON "public"."profiles"
TO public
WITH CHECK ((SELECT auth.uid()) = id);