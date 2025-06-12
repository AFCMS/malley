set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_profiles_feed(has_handle text[] DEFAULT NULL::text[], has_bio text[] DEFAULT NULL::text[], has_categories uuid[] DEFAULT NULL::uuid[], featured_by uuid[] DEFAULT NULL::uuid[], features_user uuid[] DEFAULT NULL::uuid[], author_of uuid[] DEFAULT NULL::uuid[], likes_posts uuid[] DEFAULT NULL::uuid[], from_date timestamp without time zone DEFAULT NULL::timestamp without time zone, to_date timestamp without time zone DEFAULT NULL::timestamp without time zone, sort_by text DEFAULT 'created_at'::text, sort_order text DEFAULT 'desc'::text, paging_limit integer DEFAULT 20, paging_offset integer DEFAULT 0)
 RETURNS SETOF profiles
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM profiles p
  LEFT JOIN features f ON f.featuree = p.id
  WHERE
    (has_handle IS NULL OR EXISTS (
      SELECT 1 FROM unnest(has_handle) h WHERE p.handle ILIKE '%' || h || '%'
    ))
    AND (has_bio IS NULL OR EXISTS (
      SELECT 1 FROM unnest(has_bio) b WHERE p.bio ILIKE '%' || b || '%'
    ))
    AND (has_categories IS NULL OR EXISTS (
      SELECT 1 FROM "profilesCategories" pc WHERE pc.profile = p.id AND pc.category = ANY(has_categories)
    ))
    AND (featured_by IS NULL OR EXISTS (
      SELECT 1 FROM features f WHERE f.featuree = p.id AND f.featurer = ANY(featured_by)
    ))
    AND (features_user IS NULL OR EXISTS (
      SELECT 1 FROM features f WHERE f.featurer = p.id AND f.featuree = ANY(features_user)
    ))
    AND (likes_posts IS NULL OR EXISTS (
      SELECT 1 FROM likes l WHERE l.profile = p.id AND l.post = ANY(likes_posts)
    ))
    AND (from_date IS NULL OR p.created_at >= from_date)
    AND (to_date IS NULL OR p.created_at <= to_date)
  GROUP BY p.id
  ORDER BY
    CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN p.created_at END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN p.created_at END ASC,
    CASE WHEN sort_by = 'features_count' AND sort_order = 'desc' THEN COUNT(f.featuree) END DESC,
    CASE WHEN sort_by = 'features_count' AND sort_order = 'asc' THEN COUNT(f.featuree) END ASC
  LIMIT paging_limit OFFSET paging_offset;
END;
$function$
;

create policy "Enable delete for users based on user_id"
on "public"."likes"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = profile));




