alter table "public"."posts" alter column "media" set data type text using "media"::text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.id_of_ensured_category(request text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$DECLARE
  result INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM category WHERE name = request) THEN
    INSERT INTO category (name) 
    VALUES (request)
    RETURNING id INTO result;
  ELSE
    SELECT id INTO result
    FROM category 
    WHERE name = request;
  END IF;
  RETURN result;
END;$function$
;

drop function if exists "public"."accept_co_authoring"(post_id integer);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_co_authoring(post_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
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

drop policy "Enable delete for users based on user_id" on "public"."featuredUsers";

drop policy "Enable read access for all users" on "public"."featuredUsers";

drop policy "feature other user" on "public"."featuredUsers";

revoke delete on table "public"."featuredUsers" from "anon";

revoke insert on table "public"."featuredUsers" from "anon";

revoke references on table "public"."featuredUsers" from "anon";

revoke select on table "public"."featuredUsers" from "anon";

revoke trigger on table "public"."featuredUsers" from "anon";

revoke truncate on table "public"."featuredUsers" from "anon";

revoke update on table "public"."featuredUsers" from "anon";

revoke delete on table "public"."featuredUsers" from "authenticated";

revoke insert on table "public"."featuredUsers" from "authenticated";

revoke references on table "public"."featuredUsers" from "authenticated";

revoke select on table "public"."featuredUsers" from "authenticated";

revoke trigger on table "public"."featuredUsers" from "authenticated";

revoke truncate on table "public"."featuredUsers" from "authenticated";

revoke update on table "public"."featuredUsers" from "authenticated";

revoke delete on table "public"."featuredUsers" from "service_role";

revoke insert on table "public"."featuredUsers" from "service_role";

revoke references on table "public"."featuredUsers" from "service_role";

revoke select on table "public"."featuredUsers" from "service_role";

revoke trigger on table "public"."featuredUsers" from "service_role";

revoke truncate on table "public"."featuredUsers" from "service_role";

revoke update on table "public"."featuredUsers" from "service_role";

alter table "public"."featuredUsers" drop constraint "featured_featuree_fkey";

alter table "public"."featuredUsers" drop constraint "featured_featurer_fkey";

alter table "public"."featuredUsers" drop constraint "featuredUsers_pkey";

drop index if exists "public"."featuredUsers_pkey";

drop table "public"."featuredUsers";

create table "public"."features" (
    "featurer" uuid not null,
    "featuree" uuid not null
);


alter table "public"."features" enable row level security;

CREATE UNIQUE INDEX "featuredUsers_pkey" ON public.features USING btree (featurer, featuree);

alter table "public"."features" add constraint "featuredUsers_pkey" PRIMARY KEY using index "featuredUsers_pkey";

alter table "public"."features" add constraint "featured_featuree_fkey" FOREIGN KEY (featuree) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."features" validate constraint "featured_featuree_fkey";

alter table "public"."features" add constraint "featured_featurer_fkey" FOREIGN KEY (featurer) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."features" validate constraint "featured_featurer_fkey";

grant delete on table "public"."features" to "anon";

grant insert on table "public"."features" to "anon";

grant references on table "public"."features" to "anon";

grant select on table "public"."features" to "anon";

grant trigger on table "public"."features" to "anon";

grant truncate on table "public"."features" to "anon";

grant update on table "public"."features" to "anon";

grant delete on table "public"."features" to "authenticated";

grant insert on table "public"."features" to "authenticated";

grant references on table "public"."features" to "authenticated";

grant select on table "public"."features" to "authenticated";

grant trigger on table "public"."features" to "authenticated";

grant truncate on table "public"."features" to "authenticated";

grant update on table "public"."features" to "authenticated";

grant delete on table "public"."features" to "service_role";

grant insert on table "public"."features" to "service_role";

grant references on table "public"."features" to "service_role";

grant select on table "public"."features" to "service_role";

grant trigger on table "public"."features" to "service_role";

grant truncate on table "public"."features" to "service_role";

grant update on table "public"."features" to "service_role";

create policy "Enable delete for users based on user_id"
on "public"."features"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = featurer));


create policy "Enable read access for all users"
on "public"."features"
as permissive
for select
to public
using (true);


create policy "feature other user"
on "public"."features"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = featurer));

