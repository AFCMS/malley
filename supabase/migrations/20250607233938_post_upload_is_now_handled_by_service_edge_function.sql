drop trigger if exists "enforce_make_user_first_author" on "public"."posts";

drop policy "allow posting" on "public"."posts";

drop policy "edition privilege for authors" on "public"."posts";

drop function if exists "public"."make_poster_first_author"();

alter table "public"."posts" drop column "media";

create policy "edition of post body for authors"
on "public"."posts"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) IN ( SELECT authors.profile
   FROM authors
  WHERE (authors.post = posts.id))));;

REVOKE UPDATE (parent_post) ON TABLE public.posts FROM authenticated;




