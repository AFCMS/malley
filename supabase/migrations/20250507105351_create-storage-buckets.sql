create policy "any_read 1tghu4n_0"
on "storage"."objects"
as permissive
for select
to anon
using ((bucket_id = 'banners'::text));


create policy "any_read 8o6wzb_0"
on "storage"."objects"
as permissive
for select
to anon
using ((bucket_id = 'post-media'::text));


create policy "any_read jh40r1_0"
on "storage"."objects"
as permissive
for select
to anon
using ((bucket_id = 'profile-pics'::text));


create policy "user_upload 1tghu4n_0"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((bucket_id = 'banners'::text));


create policy "user_upload 8o6wzb_0"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((bucket_id = 'post-media'::text));


create policy "user_upload jh40r1_0"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((bucket_id = 'profile-pics'::text));




