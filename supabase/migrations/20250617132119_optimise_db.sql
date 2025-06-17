drop policy "request co-authoring" on "public"."pendingAuthors";

drop policy "allow deletes for post authors" on "public"."postsCategories";

drop policy "allow insert for authors" on "public"."postsCategories";

CREATE INDEX idx_authors_post ON public.authors USING btree (post);

CREATE INDEX idx_authors_profile ON public.authors USING btree (profile);

CREATE INDEX idx_features_featuree ON public.features USING btree (featuree);

CREATE INDEX idx_features_featurer ON public.features USING btree (featurer);

CREATE INDEX idx_follows_followee ON public.follows USING btree (followee);

CREATE INDEX idx_follows_follower ON public.follows USING btree (follower);

CREATE INDEX idx_likes_post ON public.likes USING btree (post);

CREATE INDEX idx_likes_profile ON public.likes USING btree (profile);

CREATE INDEX "idx_pendingAuthors_from_profile" ON public."pendingAuthors" USING btree (from_profile);

CREATE INDEX "idx_pendingAuthors_post" ON public."pendingAuthors" USING btree (post);

CREATE INDEX "idx_pendingAuthors_to_profile" ON public."pendingAuthors" USING btree (to_profile);

CREATE INDEX "idx_postsCategories_category" ON public."postsCategories" USING btree (category);

CREATE INDEX "idx_postsCategories_post" ON public."postsCategories" USING btree (post);

CREATE INDEX idx_posts_parent_post ON public.posts USING btree (parent_post);

CREATE INDEX idx_posts_rt_of ON public.posts USING btree (rt_of);

CREATE INDEX "idx_profilesCategories_category" ON public."profilesCategories" USING btree (category);

CREATE INDEX "idx_profilesCategories_profile" ON public."profilesCategories" USING btree (profile);

CREATE INDEX idx_profiles_id ON public.profiles USING btree (id);

create policy "request co-authoring"
on "public"."pendingAuthors"
as permissive
for insert
to public
with check (((( SELECT auth.uid() AS uid) = from_profile) AND (EXISTS ( SELECT 1
   FROM authors
  WHERE (authors.profile = ( SELECT auth.uid() AS uid))))));


create policy "allow deletes for post authors"
on "public"."postsCategories"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM authors
  WHERE ((authors.post = "postsCategories".post) AND (authors.profile = ( SELECT auth.uid() AS uid))))));


create policy "allow insert for authors"
on "public"."postsCategories"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM authors
  WHERE ((authors.post = "postsCategories".post) AND (authors.profile = ( SELECT auth.uid() AS uid))))));




