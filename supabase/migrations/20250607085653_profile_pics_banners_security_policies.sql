drop policy "user_upload 1tghu4n_0" on "storage"."objects";

drop policy "user_upload 8o6wzb_0" on "storage"."objects";

drop policy "user_upload jh40r1_0" on "storage"."objects";

drop policy "any_read 1tghu4n_0" on "storage"."objects";

drop policy "any_read jh40r1_0" on "storage"."objects";

create policy "insert own banner 1tghu4n_0"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'banners'::text) AND ("left"(name, 36) = (auth.uid())::text) AND ( SELECT (count(*) = 0)
   FROM storage.objects o
  WHERE ((o.bucket_id = 'banners'::text) AND ("left"(o.name, length((auth.uid())::text)) = (auth.uid())::text)))));


create policy "insert own pfp jh40r1_0"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'profile-pics'::text) AND ("left"(name, 36) = (auth.uid())::text) AND ( SELECT (count(*) = 0)
   FROM storage.objects o
  WHERE ((o.bucket_id = 'profile_pics'::text) AND ("left"(o.name, length((auth.uid())::text)) = (auth.uid())::text)))));


create policy "remove own banner 1tghu4n_0"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'banners'::text) AND ("left"(name, length((auth.uid())::text)) = (auth.uid())::text)));


create policy "remove own pfp jh40r1_0"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'profile-pics'::text) AND ("left"(name, length((auth.uid())::text)) = (auth.uid())::text)));


create policy "update own banner 1tghu4n_0"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'banners'::text) AND ("left"(name, length((auth.uid())::text)) = (auth.uid())::text)));


create policy "update pfp jh40r1_0"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'profile-pics'::text) AND ("left"(name, length((auth.uid())::text)) = (auth.uid())::text)));


create policy "any_read 1tghu4n_0"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'banners'::text));


create policy "any_read jh40r1_0"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'profile-pics'::text));




