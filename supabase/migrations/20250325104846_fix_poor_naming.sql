drop policy "Enable delete for users based on user_id" on "public"."featured-users";

drop policy "Enable read access for all users" on "public"."featured-users";

drop policy "feature other user" on "public"."featured-users";

revoke delete on table "public"."category" from "anon";

revoke insert on table "public"."category" from "anon";

revoke references on table "public"."category" from "anon";

revoke select on table "public"."category" from "anon";

revoke trigger on table "public"."category" from "anon";

revoke truncate on table "public"."category" from "anon";

revoke update on table "public"."category" from "anon";

revoke delete on table "public"."category" from "authenticated";

revoke insert on table "public"."category" from "authenticated";

revoke references on table "public"."category" from "authenticated";

revoke select on table "public"."category" from "authenticated";

revoke trigger on table "public"."category" from "authenticated";

revoke truncate on table "public"."category" from "authenticated";

revoke update on table "public"."category" from "authenticated";

revoke delete on table "public"."category" from "service_role";

revoke insert on table "public"."category" from "service_role";

revoke references on table "public"."category" from "service_role";

revoke select on table "public"."category" from "service_role";

revoke trigger on table "public"."category" from "service_role";

revoke truncate on table "public"."category" from "service_role";

revoke update on table "public"."category" from "service_role";

revoke delete on table "public"."featured-users" from "anon";

revoke insert on table "public"."featured-users" from "anon";

revoke references on table "public"."featured-users" from "anon";

revoke select on table "public"."featured-users" from "anon";

revoke trigger on table "public"."featured-users" from "anon";

revoke truncate on table "public"."featured-users" from "anon";

revoke update on table "public"."featured-users" from "anon";

revoke delete on table "public"."featured-users" from "authenticated";

revoke insert on table "public"."featured-users" from "authenticated";

revoke references on table "public"."featured-users" from "authenticated";

revoke select on table "public"."featured-users" from "authenticated";

revoke trigger on table "public"."featured-users" from "authenticated";

revoke truncate on table "public"."featured-users" from "authenticated";

revoke update on table "public"."featured-users" from "authenticated";

revoke delete on table "public"."featured-users" from "service_role";

revoke insert on table "public"."featured-users" from "service_role";

revoke references on table "public"."featured-users" from "service_role";

revoke select on table "public"."featured-users" from "service_role";

revoke trigger on table "public"."featured-users" from "service_role";

revoke truncate on table "public"."featured-users" from "service_role";

revoke update on table "public"."featured-users" from "service_role";

alter table "public"."category" drop constraint "category_name_key";

alter table "public"."featured-users" drop constraint "featured_featuree_fkey";

alter table "public"."featured-users" drop constraint "featured_featurer_fkey";

alter table "public"."postsCategory" drop constraint "postsCategory_category_fkey";

alter table "public"."profilesCategory" drop constraint "profilesCategory_category_fkey";

alter table "public"."category" drop constraint "category_pkey";

alter table "public"."featured-users" drop constraint "featured_pkey";

drop index if exists "public"."featured_pkey";

drop index if exists "public"."category_name_key";

drop index if exists "public"."category_pkey";

drop table "public"."category";

drop table "public"."featured-users";

create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying not null
);


alter table "public"."categories" enable row level security;

create table "public"."featuredUsers" (
    "featurer" uuid not null,
    "featuree" uuid not null
);


alter table "public"."featuredUsers" enable row level security;

CREATE UNIQUE INDEX "featuredUsers_pkey" ON public."featuredUsers" USING btree (featurer, featuree);

CREATE UNIQUE INDEX category_name_key ON public.categories USING btree (name);

CREATE UNIQUE INDEX category_pkey ON public.categories USING btree (id);

alter table "public"."categories" add constraint "category_pkey" PRIMARY KEY using index "category_pkey";

alter table "public"."featuredUsers" add constraint "featuredUsers_pkey" PRIMARY KEY using index "featuredUsers_pkey";

alter table "public"."categories" add constraint "category_name_key" UNIQUE using index "category_name_key";

alter table "public"."featuredUsers" add constraint "featured_featuree_fkey" FOREIGN KEY (featuree) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."featuredUsers" validate constraint "featured_featuree_fkey";

alter table "public"."featuredUsers" add constraint "featured_featurer_fkey" FOREIGN KEY (featurer) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."featuredUsers" validate constraint "featured_featurer_fkey";

alter table "public"."postsCategory" add constraint "postsCategory_category_fkey" FOREIGN KEY (category) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."postsCategory" validate constraint "postsCategory_category_fkey";

alter table "public"."profilesCategory" add constraint "profilesCategory_category_fkey" FOREIGN KEY (category) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."profilesCategory" validate constraint "profilesCategory_category_fkey";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."featuredUsers" to "anon";

grant insert on table "public"."featuredUsers" to "anon";

grant references on table "public"."featuredUsers" to "anon";

grant select on table "public"."featuredUsers" to "anon";

grant trigger on table "public"."featuredUsers" to "anon";

grant truncate on table "public"."featuredUsers" to "anon";

grant update on table "public"."featuredUsers" to "anon";

grant delete on table "public"."featuredUsers" to "authenticated";

grant insert on table "public"."featuredUsers" to "authenticated";

grant references on table "public"."featuredUsers" to "authenticated";

grant select on table "public"."featuredUsers" to "authenticated";

grant trigger on table "public"."featuredUsers" to "authenticated";

grant truncate on table "public"."featuredUsers" to "authenticated";

grant update on table "public"."featuredUsers" to "authenticated";

grant delete on table "public"."featuredUsers" to "service_role";

grant insert on table "public"."featuredUsers" to "service_role";

grant references on table "public"."featuredUsers" to "service_role";

grant select on table "public"."featuredUsers" to "service_role";

grant trigger on table "public"."featuredUsers" to "service_role";

grant truncate on table "public"."featuredUsers" to "service_role";

grant update on table "public"."featuredUsers" to "service_role";

create policy "Enable delete for users based on user_id"
on "public"."featuredUsers"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = featurer));


create policy "Enable read access for all users"
on "public"."featuredUsers"
as permissive
for select
to public
using (true);


create policy "feature other user"
on "public"."featuredUsers"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = featurer));

drop trigger if exists "enforce_remove_authorless_posts" on "public"."authored";

drop policy "Enable delete for users based on user_id" on "public"."authored";

drop policy "Enable read access for all users" on "public"."postsCategory";

drop policy "Enable delete for users based on user_id" on "public"."profilesCategory";

drop policy "Enable insert for users based on user_id" on "public"."profilesCategory";

drop policy "Enable read access for all users" on "public"."profilesCategory";

revoke delete on table "public"."authored" from "anon";

revoke insert on table "public"."authored" from "anon";

revoke references on table "public"."authored" from "anon";

revoke select on table "public"."authored" from "anon";

revoke trigger on table "public"."authored" from "anon";

revoke truncate on table "public"."authored" from "anon";

revoke update on table "public"."authored" from "anon";

revoke delete on table "public"."authored" from "authenticated";

revoke insert on table "public"."authored" from "authenticated";

revoke references on table "public"."authored" from "authenticated";

revoke select on table "public"."authored" from "authenticated";

revoke trigger on table "public"."authored" from "authenticated";

revoke truncate on table "public"."authored" from "authenticated";

revoke update on table "public"."authored" from "authenticated";

revoke delete on table "public"."authored" from "service_role";

revoke insert on table "public"."authored" from "service_role";

revoke references on table "public"."authored" from "service_role";

revoke select on table "public"."authored" from "service_role";

revoke trigger on table "public"."authored" from "service_role";

revoke truncate on table "public"."authored" from "service_role";

revoke update on table "public"."authored" from "service_role";

revoke delete on table "public"."postsCategory" from "anon";

revoke insert on table "public"."postsCategory" from "anon";

revoke references on table "public"."postsCategory" from "anon";

revoke select on table "public"."postsCategory" from "anon";

revoke trigger on table "public"."postsCategory" from "anon";

revoke truncate on table "public"."postsCategory" from "anon";

revoke update on table "public"."postsCategory" from "anon";

revoke delete on table "public"."postsCategory" from "authenticated";

revoke insert on table "public"."postsCategory" from "authenticated";

revoke references on table "public"."postsCategory" from "authenticated";

revoke select on table "public"."postsCategory" from "authenticated";

revoke trigger on table "public"."postsCategory" from "authenticated";

revoke truncate on table "public"."postsCategory" from "authenticated";

revoke update on table "public"."postsCategory" from "authenticated";

revoke delete on table "public"."postsCategory" from "service_role";

revoke insert on table "public"."postsCategory" from "service_role";

revoke references on table "public"."postsCategory" from "service_role";

revoke select on table "public"."postsCategory" from "service_role";

revoke trigger on table "public"."postsCategory" from "service_role";

revoke truncate on table "public"."postsCategory" from "service_role";

revoke update on table "public"."postsCategory" from "service_role";

revoke delete on table "public"."profilesCategory" from "anon";

revoke insert on table "public"."profilesCategory" from "anon";

revoke references on table "public"."profilesCategory" from "anon";

revoke select on table "public"."profilesCategory" from "anon";

revoke trigger on table "public"."profilesCategory" from "anon";

revoke truncate on table "public"."profilesCategory" from "anon";

revoke update on table "public"."profilesCategory" from "anon";

revoke delete on table "public"."profilesCategory" from "authenticated";

revoke insert on table "public"."profilesCategory" from "authenticated";

revoke references on table "public"."profilesCategory" from "authenticated";

revoke select on table "public"."profilesCategory" from "authenticated";

revoke trigger on table "public"."profilesCategory" from "authenticated";

revoke truncate on table "public"."profilesCategory" from "authenticated";

revoke update on table "public"."profilesCategory" from "authenticated";

revoke delete on table "public"."profilesCategory" from "service_role";

revoke insert on table "public"."profilesCategory" from "service_role";

revoke references on table "public"."profilesCategory" from "service_role";

revoke select on table "public"."profilesCategory" from "service_role";

revoke trigger on table "public"."profilesCategory" from "service_role";

revoke truncate on table "public"."profilesCategory" from "service_role";

revoke update on table "public"."profilesCategory" from "service_role";

alter table "public"."authored" drop constraint "authored_post_fkey";

alter table "public"."authored" drop constraint "authored_user_fkey";

alter table "public"."postsCategory" drop constraint "postsCategory_category_fkey";

alter table "public"."postsCategory" drop constraint "postsCategory_post_fkey";

alter table "public"."profilesCategory" drop constraint "profilesCategory_category_fkey";

alter table "public"."profilesCategory" drop constraint "profilesCategory_profile_fkey";

alter table "public"."authored" drop constraint "authored_pkey";

alter table "public"."postsCategory" drop constraint "postsCategory_pkey";

alter table "public"."profilesCategory" drop constraint "profilesCategory_pkey";

drop index if exists "public"."authored_pkey";

drop index if exists "public"."postsCategory_pkey";

drop index if exists "public"."profilesCategory_pkey";

drop table "public"."authored";

drop table "public"."postsCategory";

drop table "public"."profilesCategory";

create table "public"."authors" (
    "profile" uuid not null,
    "post" uuid not null
);


alter table "public"."authors" enable row level security;

create table "public"."postsCategories" (
    "post" uuid not null default gen_random_uuid(),
    "category" uuid not null default gen_random_uuid()
);


alter table "public"."postsCategories" enable row level security;

create table "public"."profilesCategories" (
    "profile" uuid not null,
    "category" uuid not null
);


alter table "public"."profilesCategories" enable row level security;

CREATE UNIQUE INDEX authors_pkey ON public.authors USING btree (profile, post);

CREATE UNIQUE INDEX "postsCategory_pkey" ON public."postsCategories" USING btree (post, category);

CREATE UNIQUE INDEX "profilesCategory_pkey" ON public."profilesCategories" USING btree (profile, category);

alter table "public"."authors" add constraint "authors_pkey" PRIMARY KEY using index "authors_pkey";

alter table "public"."postsCategories" add constraint "postsCategory_pkey" PRIMARY KEY using index "postsCategory_pkey";

alter table "public"."profilesCategories" add constraint "profilesCategory_pkey" PRIMARY KEY using index "profilesCategory_pkey";

alter table "public"."authors" add constraint "authored_post_fkey" FOREIGN KEY (post) REFERENCES posts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."authors" validate constraint "authored_post_fkey";

alter table "public"."authors" add constraint "authored_user_fkey" FOREIGN KEY (profile) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."authors" validate constraint "authored_user_fkey";

alter table "public"."postsCategories" add constraint "postsCategory_category_fkey" FOREIGN KEY (category) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."postsCategories" validate constraint "postsCategory_category_fkey";

alter table "public"."postsCategories" add constraint "postsCategory_post_fkey" FOREIGN KEY (post) REFERENCES posts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."postsCategories" validate constraint "postsCategory_post_fkey";

alter table "public"."profilesCategories" add constraint "profilesCategory_category_fkey" FOREIGN KEY (category) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."profilesCategories" validate constraint "profilesCategory_category_fkey";

alter table "public"."profilesCategories" add constraint "profilesCategory_profile_fkey" FOREIGN KEY (profile) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."profilesCategories" validate constraint "profilesCategory_profile_fkey";

grant delete on table "public"."authors" to "anon";

grant insert on table "public"."authors" to "anon";

grant references on table "public"."authors" to "anon";

grant select on table "public"."authors" to "anon";

grant trigger on table "public"."authors" to "anon";

grant truncate on table "public"."authors" to "anon";

grant update on table "public"."authors" to "anon";

grant delete on table "public"."authors" to "authenticated";

grant insert on table "public"."authors" to "authenticated";

grant references on table "public"."authors" to "authenticated";

grant select on table "public"."authors" to "authenticated";

grant trigger on table "public"."authors" to "authenticated";

grant truncate on table "public"."authors" to "authenticated";

grant update on table "public"."authors" to "authenticated";

grant delete on table "public"."authors" to "service_role";

grant insert on table "public"."authors" to "service_role";

grant references on table "public"."authors" to "service_role";

grant select on table "public"."authors" to "service_role";

grant trigger on table "public"."authors" to "service_role";

grant truncate on table "public"."authors" to "service_role";

grant update on table "public"."authors" to "service_role";

grant delete on table "public"."postsCategories" to "anon";

grant insert on table "public"."postsCategories" to "anon";

grant references on table "public"."postsCategories" to "anon";

grant select on table "public"."postsCategories" to "anon";

grant trigger on table "public"."postsCategories" to "anon";

grant truncate on table "public"."postsCategories" to "anon";

grant update on table "public"."postsCategories" to "anon";

grant delete on table "public"."postsCategories" to "authenticated";

grant insert on table "public"."postsCategories" to "authenticated";

grant references on table "public"."postsCategories" to "authenticated";

grant select on table "public"."postsCategories" to "authenticated";

grant trigger on table "public"."postsCategories" to "authenticated";

grant truncate on table "public"."postsCategories" to "authenticated";

grant update on table "public"."postsCategories" to "authenticated";

grant delete on table "public"."postsCategories" to "service_role";

grant insert on table "public"."postsCategories" to "service_role";

grant references on table "public"."postsCategories" to "service_role";

grant select on table "public"."postsCategories" to "service_role";

grant trigger on table "public"."postsCategories" to "service_role";

grant truncate on table "public"."postsCategories" to "service_role";

grant update on table "public"."postsCategories" to "service_role";

grant delete on table "public"."profilesCategories" to "anon";

grant insert on table "public"."profilesCategories" to "anon";

grant references on table "public"."profilesCategories" to "anon";

grant select on table "public"."profilesCategories" to "anon";

grant trigger on table "public"."profilesCategories" to "anon";

grant truncate on table "public"."profilesCategories" to "anon";

grant update on table "public"."profilesCategories" to "anon";

grant delete on table "public"."profilesCategories" to "authenticated";

grant insert on table "public"."profilesCategories" to "authenticated";

grant references on table "public"."profilesCategories" to "authenticated";

grant select on table "public"."profilesCategories" to "authenticated";

grant trigger on table "public"."profilesCategories" to "authenticated";

grant truncate on table "public"."profilesCategories" to "authenticated";

grant update on table "public"."profilesCategories" to "authenticated";

grant delete on table "public"."profilesCategories" to "service_role";

grant insert on table "public"."profilesCategories" to "service_role";

grant references on table "public"."profilesCategories" to "service_role";

grant select on table "public"."profilesCategories" to "service_role";

grant trigger on table "public"."profilesCategories" to "service_role";

grant truncate on table "public"."profilesCategories" to "service_role";

grant update on table "public"."profilesCategories" to "service_role";

create policy "Enable delete for users based on user_id"
on "public"."authors"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = profile));


create policy "Enable read access for all users"
on "public"."postsCategories"
as permissive
for select
to public
using (true);


create policy "Enable delete for users based on user_id"
on "public"."profilesCategories"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = profile));


create policy "Enable insert for users based on user_id"
on "public"."profilesCategories"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = profile));


create policy "Enable read access for all users"
on "public"."profilesCategories"
as permissive
for select
to public
using (true);


CREATE TRIGGER enforce_remove_authorless_posts AFTER DELETE ON public.authors FOR EACH ROW EXECUTE FUNCTION remove_authorless_posts();
