ALTER POLICY "users can view follows they are involved in" 
ON "public"."follows"
TO public
USING ((((SELECT auth.uid()) = follower) OR ((SELECT auth.uid()) = followee)));