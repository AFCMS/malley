create table "public"."likes" (
    "post" uuid not null,
    "profile" uuid not null
);


alter table "public"."likes" enable row level security;

alter table "public"."posts" add column "parent_post" uuid;

CREATE UNIQUE INDEX likes_pkey ON public.likes USING btree (post, profile);

alter table "public"."likes" add constraint "likes_pkey" PRIMARY KEY using index "likes_pkey";

alter table "public"."likes" add constraint "likes_post_fkey" FOREIGN KEY (post) REFERENCES posts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."likes" validate constraint "likes_post_fkey";

alter table "public"."likes" add constraint "likes_profile_fkey" FOREIGN KEY (profile) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."likes" validate constraint "likes_profile_fkey";

alter table "public"."posts" add constraint "posts_parent_post_fkey" FOREIGN KEY (parent_post) REFERENCES posts(id) ON DELETE SET NULL not valid;

alter table "public"."posts" validate constraint "posts_parent_post_fkey";

grant delete on table "public"."likes" to "anon";

grant insert on table "public"."likes" to "anon";

grant references on table "public"."likes" to "anon";

grant select on table "public"."likes" to "anon";

grant trigger on table "public"."likes" to "anon";

grant truncate on table "public"."likes" to "anon";

grant update on table "public"."likes" to "anon";

grant delete on table "public"."likes" to "authenticated";

grant insert on table "public"."likes" to "authenticated";

grant references on table "public"."likes" to "authenticated";

grant select on table "public"."likes" to "authenticated";

grant trigger on table "public"."likes" to "authenticated";

grant truncate on table "public"."likes" to "authenticated";

grant update on table "public"."likes" to "authenticated";

grant delete on table "public"."likes" to "service_role";

grant insert on table "public"."likes" to "service_role";

grant references on table "public"."likes" to "service_role";

grant select on table "public"."likes" to "service_role";

grant trigger on table "public"."likes" to "service_role";

grant truncate on table "public"."likes" to "service_role";

grant update on table "public"."likes" to "service_role";

create policy "Enable read access for all users"
on "public"."authors"
as permissive
for select
to public
using (true);


create policy "Enable insert for users based on user_id"
on "public"."likes"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = profile));


create policy "Enable read access for all users"
on "public"."likes"
as permissive
for select
to public
using (true);




