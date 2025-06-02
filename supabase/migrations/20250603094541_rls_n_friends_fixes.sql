drop policy "see recieved requests" on "public"."pendingAuthors";

drop policy "Enable insert for authenticated users only" on "public"."postsCategories";

drop policy "Allow logged-in read access" on "public"."profiles";

drop policy "request co-authoring" on "public"."pendingAuthors";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_co_authoring(post_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  if post_id in (select post from "pendingAuthors" where to_profile = auth.uid())
  then
    delete from "pendingAuthors"
    where to_profile = auth.uid()
    and post = post_id;
    insert into authors values(
      auth.uid(),
      post_id
    );

    return true;
  end if;
  return false;
END;$function$
;

create policy "users can only see who they follow"
on "public"."follows"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = follower));


create policy "see recieved/sent requests"
on "public"."pendingAuthors"
as permissive
for select
to public
using (((( SELECT auth.uid() AS uid) = to_profile) OR (( SELECT auth.uid() AS uid) = from_profile)));


create policy "allow deletes for post authors"
on "public"."postsCategories"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM authors
  WHERE ((authors.post = "postsCategories".post) AND (authors.profile = auth.uid())))));


create policy "allow insert for authors"
on "public"."postsCategories"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM authors
  WHERE ((authors.post = "postsCategories".post) AND (authors.profile = auth.uid())))));


create policy "Enable read access for all users"
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "request co-authoring"
on "public"."pendingAuthors"
as permissive
for insert
to public
with check (((auth.uid() = from_profile) AND (EXISTS ( SELECT 1
   FROM authors
  WHERE (authors.profile = auth.uid())))));




