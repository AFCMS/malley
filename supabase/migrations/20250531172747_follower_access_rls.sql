CREATE POLICY "users can view follows they are involved in" ON public.follows
FOR SELECT
TO public
USING (
  auth.uid() = follower OR auth.uid() = followee
);
