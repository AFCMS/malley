revoke update on table "public"."posts" from "authenticated";

GRANT UPDATE (body) ON posts TO authenticated;

alter table "public"."posts" add column "rt_of" uuid;

alter table "public"."posts" add constraint "posts_rt_of_fkey" FOREIGN KEY (rt_of) REFERENCES posts(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."posts" validate constraint "posts_rt_of_fkey";

