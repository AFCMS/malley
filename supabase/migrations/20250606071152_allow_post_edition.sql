create policy "edition privilege for authors"
on "public"."posts"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) IN ( SELECT authors.profile
   FROM authors
  WHERE (authors.post = posts.id))));




