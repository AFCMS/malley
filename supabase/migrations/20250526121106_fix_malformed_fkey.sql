alter table "public"."follows" drop constraint "follows_follower_fkey";

alter table "public"."follows" add constraint "follows_follower_fkey" FOREIGN KEY (follower) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_follower_fkey";



