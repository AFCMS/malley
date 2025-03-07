create table "public"."authored" (
    "profile" uuid not null,
    "post" uuid not null
);


alter table "public"."authored" enable row level security;

create table "public"."category" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying not null
);


alter table "public"."category" enable row level security;

create table "public"."featured-users" (
    "featurer" uuid not null,
    "featuree" uuid not null
);


alter table "public"."featured-users" enable row level security;

create table "public"."follows" (
    "follower" uuid not null,
    "followee" uuid not null
);


alter table "public"."follows" enable row level security;

create table "public"."pendingAuthors" (
    "from_profile" uuid not null,
    "to_profile" uuid not null,
    "post" uuid not null
);


alter table "public"."pendingAuthors" enable row level security;

create table "public"."posts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "body" text,
    "media" text[]
);


alter table "public"."posts" enable row level security;

create table "public"."postsCategory" (
    "post" uuid not null default gen_random_uuid(),
    "category" uuid not null default gen_random_uuid()
);


alter table "public"."postsCategory" enable row level security;

create table "public"."profilesCategory" (
    "profile" uuid not null,
    "category" uuid not null
);


alter table "public"."profilesCategory" enable row level security;

alter table "public"."profiles" add column "banner" text;

alter table "public"."profiles" add column "bio" text;

alter table "public"."profiles" add column "pinned_posts" uuid[];

alter table "public"."profiles" add column "profile_pic" text;

CREATE UNIQUE INDEX authored_pkey ON public.authored USING btree (profile, post);

CREATE UNIQUE INDEX category_name_key ON public.category USING btree (name);

CREATE UNIQUE INDEX category_pkey ON public.category USING btree (id);

CREATE UNIQUE INDEX featured_pkey ON public."featured-users" USING btree (featurer, featuree);

CREATE UNIQUE INDEX follows_pkey ON public.follows USING btree (follower, followee);

CREATE UNIQUE INDEX "pendingAuthors_pkey" ON public."pendingAuthors" USING btree (from_profile, to_profile, post);

CREATE UNIQUE INDEX post_pkey ON public.posts USING btree (id);

CREATE UNIQUE INDEX "postsCategory_pkey" ON public."postsCategory" USING btree (post, category);

CREATE UNIQUE INDEX "profilesCategory_pkey" ON public."profilesCategory" USING btree (profile, category);

alter table "public"."authored" add constraint "authored_pkey" PRIMARY KEY using index "authored_pkey";

alter table "public"."category" add constraint "category_pkey" PRIMARY KEY using index "category_pkey";

alter table "public"."featured-users" add constraint "featured_pkey" PRIMARY KEY using index "featured_pkey";

alter table "public"."follows" add constraint "follows_pkey" PRIMARY KEY using index "follows_pkey";

alter table "public"."pendingAuthors" add constraint "pendingAuthors_pkey" PRIMARY KEY using index "pendingAuthors_pkey";

alter table "public"."posts" add constraint "post_pkey" PRIMARY KEY using index "post_pkey";

alter table "public"."postsCategory" add constraint "postsCategory_pkey" PRIMARY KEY using index "postsCategory_pkey";

alter table "public"."profilesCategory" add constraint "profilesCategory_pkey" PRIMARY KEY using index "profilesCategory_pkey";

alter table "public"."authored" add constraint "authored_post_fkey" FOREIGN KEY (post) REFERENCES posts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."authored" validate constraint "authored_post_fkey";

alter table "public"."authored" add constraint "authored_user_fkey" FOREIGN KEY (profile) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."authored" validate constraint "authored_user_fkey";

alter table "public"."category" add constraint "category_name_key" UNIQUE using index "category_name_key";

alter table "public"."featured-users" add constraint "featured_featuree_fkey" FOREIGN KEY (featuree) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."featured-users" validate constraint "featured_featuree_fkey";

alter table "public"."featured-users" add constraint "featured_featurer_fkey" FOREIGN KEY (featurer) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."featured-users" validate constraint "featured_featurer_fkey";

alter table "public"."follows" add constraint "follows_followee_fkey" FOREIGN KEY (followee) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_followee_fkey";

alter table "public"."follows" add constraint "follows_follower_fkey" FOREIGN KEY (follower) REFERENCES posts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_follower_fkey";

alter table "public"."pendingAuthors" add constraint "pendingAuthors_from_fkey" FOREIGN KEY (from_profile) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."pendingAuthors" validate constraint "pendingAuthors_from_fkey";

alter table "public"."pendingAuthors" add constraint "pendingAuthors_post_fkey" FOREIGN KEY (post) REFERENCES posts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."pendingAuthors" validate constraint "pendingAuthors_post_fkey";

alter table "public"."pendingAuthors" add constraint "pendingAuthors_to_fkey" FOREIGN KEY (to_profile) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."pendingAuthors" validate constraint "pendingAuthors_to_fkey";

alter table "public"."postsCategory" add constraint "postsCategory_category_fkey" FOREIGN KEY (category) REFERENCES category(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."postsCategory" validate constraint "postsCategory_category_fkey";

alter table "public"."postsCategory" add constraint "postsCategory_post_fkey" FOREIGN KEY (post) REFERENCES posts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."postsCategory" validate constraint "postsCategory_post_fkey";

alter table "public"."profiles" add constraint "nb_pinned_posts" CHECK ((cardinality(pinned_posts) <= 10)) not valid;

alter table "public"."profiles" validate constraint "nb_pinned_posts";

alter table "public"."profilesCategory" add constraint "profilesCategory_category_fkey" FOREIGN KEY (category) REFERENCES category(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."profilesCategory" validate constraint "profilesCategory_category_fkey";

alter table "public"."profilesCategory" add constraint "profilesCategory_profile_fkey" FOREIGN KEY (profile) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."profilesCategory" validate constraint "profilesCategory_profile_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public."accept-co-authoring"(post_id integer)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$BEGIN
  if post_id in (select post from pendingAuthors where to_profile = auth.uid())
  then
    delete from pendingAuthors
    where to_profile = auth.uid()
    and post = post_id;
    insert into authored values(
      auth.uid(),
      post_id()
    );

    return true;
  end if;
  return false;
END;$function$
;

CREATE OR REPLACE FUNCTION public.user_is_author_of_post_to_pin()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  IF EXISTS (
    SELECT 1 
    FROM unnest(NEW.pinned_posts) AS pinned_post
    EXCEPT
    SELECT post 
    FROM authored 
    WHERE profile = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Pinned posts must be authored by the user';
  END IF;
  RETURN NEW;

END;$function$
;

grant delete on table "public"."authored" to "anon";

grant insert on table "public"."authored" to "anon";

grant references on table "public"."authored" to "anon";

grant select on table "public"."authored" to "anon";

grant trigger on table "public"."authored" to "anon";

grant truncate on table "public"."authored" to "anon";

grant update on table "public"."authored" to "anon";

grant delete on table "public"."authored" to "authenticated";

grant insert on table "public"."authored" to "authenticated";

grant references on table "public"."authored" to "authenticated";

grant select on table "public"."authored" to "authenticated";

grant trigger on table "public"."authored" to "authenticated";

grant truncate on table "public"."authored" to "authenticated";

grant update on table "public"."authored" to "authenticated";

grant delete on table "public"."authored" to "service_role";

grant insert on table "public"."authored" to "service_role";

grant references on table "public"."authored" to "service_role";

grant select on table "public"."authored" to "service_role";

grant trigger on table "public"."authored" to "service_role";

grant truncate on table "public"."authored" to "service_role";

grant update on table "public"."authored" to "service_role";

grant delete on table "public"."category" to "anon";

grant insert on table "public"."category" to "anon";

grant references on table "public"."category" to "anon";

grant select on table "public"."category" to "anon";

grant trigger on table "public"."category" to "anon";

grant truncate on table "public"."category" to "anon";

grant update on table "public"."category" to "anon";

grant delete on table "public"."category" to "authenticated";

grant insert on table "public"."category" to "authenticated";

grant references on table "public"."category" to "authenticated";

grant select on table "public"."category" to "authenticated";

grant trigger on table "public"."category" to "authenticated";

grant truncate on table "public"."category" to "authenticated";

grant update on table "public"."category" to "authenticated";

grant delete on table "public"."category" to "service_role";

grant insert on table "public"."category" to "service_role";

grant references on table "public"."category" to "service_role";

grant select on table "public"."category" to "service_role";

grant trigger on table "public"."category" to "service_role";

grant truncate on table "public"."category" to "service_role";

grant update on table "public"."category" to "service_role";

grant delete on table "public"."featured-users" to "anon";

grant insert on table "public"."featured-users" to "anon";

grant references on table "public"."featured-users" to "anon";

grant select on table "public"."featured-users" to "anon";

grant trigger on table "public"."featured-users" to "anon";

grant truncate on table "public"."featured-users" to "anon";

grant update on table "public"."featured-users" to "anon";

grant delete on table "public"."featured-users" to "authenticated";

grant insert on table "public"."featured-users" to "authenticated";

grant references on table "public"."featured-users" to "authenticated";

grant select on table "public"."featured-users" to "authenticated";

grant trigger on table "public"."featured-users" to "authenticated";

grant truncate on table "public"."featured-users" to "authenticated";

grant update on table "public"."featured-users" to "authenticated";

grant delete on table "public"."featured-users" to "service_role";

grant insert on table "public"."featured-users" to "service_role";

grant references on table "public"."featured-users" to "service_role";

grant select on table "public"."featured-users" to "service_role";

grant trigger on table "public"."featured-users" to "service_role";

grant truncate on table "public"."featured-users" to "service_role";

grant update on table "public"."featured-users" to "service_role";

grant delete on table "public"."follows" to "anon";

grant insert on table "public"."follows" to "anon";

grant references on table "public"."follows" to "anon";

grant select on table "public"."follows" to "anon";

grant trigger on table "public"."follows" to "anon";

grant truncate on table "public"."follows" to "anon";

grant update on table "public"."follows" to "anon";

grant delete on table "public"."follows" to "authenticated";

grant insert on table "public"."follows" to "authenticated";

grant references on table "public"."follows" to "authenticated";

grant select on table "public"."follows" to "authenticated";

grant trigger on table "public"."follows" to "authenticated";

grant truncate on table "public"."follows" to "authenticated";

grant update on table "public"."follows" to "authenticated";

grant delete on table "public"."follows" to "service_role";

grant insert on table "public"."follows" to "service_role";

grant references on table "public"."follows" to "service_role";

grant select on table "public"."follows" to "service_role";

grant trigger on table "public"."follows" to "service_role";

grant truncate on table "public"."follows" to "service_role";

grant update on table "public"."follows" to "service_role";

grant delete on table "public"."pendingAuthors" to "anon";

grant insert on table "public"."pendingAuthors" to "anon";

grant references on table "public"."pendingAuthors" to "anon";

grant select on table "public"."pendingAuthors" to "anon";

grant trigger on table "public"."pendingAuthors" to "anon";

grant truncate on table "public"."pendingAuthors" to "anon";

grant update on table "public"."pendingAuthors" to "anon";

grant delete on table "public"."pendingAuthors" to "authenticated";

grant insert on table "public"."pendingAuthors" to "authenticated";

grant references on table "public"."pendingAuthors" to "authenticated";

grant select on table "public"."pendingAuthors" to "authenticated";

grant trigger on table "public"."pendingAuthors" to "authenticated";

grant truncate on table "public"."pendingAuthors" to "authenticated";

grant update on table "public"."pendingAuthors" to "authenticated";

grant delete on table "public"."pendingAuthors" to "service_role";

grant insert on table "public"."pendingAuthors" to "service_role";

grant references on table "public"."pendingAuthors" to "service_role";

grant select on table "public"."pendingAuthors" to "service_role";

grant trigger on table "public"."pendingAuthors" to "service_role";

grant truncate on table "public"."pendingAuthors" to "service_role";

grant update on table "public"."pendingAuthors" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

grant delete on table "public"."postsCategory" to "anon";

grant insert on table "public"."postsCategory" to "anon";

grant references on table "public"."postsCategory" to "anon";

grant select on table "public"."postsCategory" to "anon";

grant trigger on table "public"."postsCategory" to "anon";

grant truncate on table "public"."postsCategory" to "anon";

grant update on table "public"."postsCategory" to "anon";

grant delete on table "public"."postsCategory" to "authenticated";

grant insert on table "public"."postsCategory" to "authenticated";

grant references on table "public"."postsCategory" to "authenticated";

grant select on table "public"."postsCategory" to "authenticated";

grant trigger on table "public"."postsCategory" to "authenticated";

grant truncate on table "public"."postsCategory" to "authenticated";

grant update on table "public"."postsCategory" to "authenticated";

grant delete on table "public"."postsCategory" to "service_role";

grant insert on table "public"."postsCategory" to "service_role";

grant references on table "public"."postsCategory" to "service_role";

grant select on table "public"."postsCategory" to "service_role";

grant trigger on table "public"."postsCategory" to "service_role";

grant truncate on table "public"."postsCategory" to "service_role";

grant update on table "public"."postsCategory" to "service_role";

grant delete on table "public"."profilesCategory" to "anon";

grant insert on table "public"."profilesCategory" to "anon";

grant references on table "public"."profilesCategory" to "anon";

grant select on table "public"."profilesCategory" to "anon";

grant trigger on table "public"."profilesCategory" to "anon";

grant truncate on table "public"."profilesCategory" to "anon";

grant update on table "public"."profilesCategory" to "anon";

grant delete on table "public"."profilesCategory" to "authenticated";

grant insert on table "public"."profilesCategory" to "authenticated";

grant references on table "public"."profilesCategory" to "authenticated";

grant select on table "public"."profilesCategory" to "authenticated";

grant trigger on table "public"."profilesCategory" to "authenticated";

grant truncate on table "public"."profilesCategory" to "authenticated";

grant update on table "public"."profilesCategory" to "authenticated";

grant delete on table "public"."profilesCategory" to "service_role";

grant insert on table "public"."profilesCategory" to "service_role";

grant references on table "public"."profilesCategory" to "service_role";

grant select on table "public"."profilesCategory" to "service_role";

grant trigger on table "public"."profilesCategory" to "service_role";

grant truncate on table "public"."profilesCategory" to "service_role";

grant update on table "public"."profilesCategory" to "service_role";

create policy "Enable delete for users based on user_id"
on "public"."authored"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = profile));


create policy "Enable delete for users based on user_id"
on "public"."featured-users"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = featurer));


create policy "Enable read access for all users"
on "public"."featured-users"
as permissive
for select
to public
using (true);


create policy "feature other user"
on "public"."featured-users"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = featurer));


create policy "user follows another"
on "public"."follows"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = follower));


create policy "user stops following another"
on "public"."follows"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = follower));


create policy "request co-authoring"
on "public"."pendingAuthors"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = from_profile));


create policy "retract/decline/accept"
on "public"."pendingAuthors"
as permissive
for delete
to public
using (((( SELECT auth.uid() AS uid) = from_profile) OR (( SELECT auth.uid() AS uid) = to_profile)));


create policy "see recieved requests"
on "public"."pendingAuthors"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = to_profile));


create policy "Enable read access for all users"
on "public"."posts"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."postsCategory"
as permissive
for select
to public
using (true);


create policy "Enable delete for users based on user_id"
on "public"."profilesCategory"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = profile));


create policy "Enable insert for users based on user_id"
on "public"."profilesCategory"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = profile));


create policy "Enable read access for all users"
on "public"."profilesCategory"
as permissive
for select
to public
using (true);


CREATE TRIGGER enforce_user_is_author_of_post_to_pin BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION user_is_author_of_post_to_pin();



