CREATE OR REPLACE FUNCTION get_posts_feed(
  has_text text[] default null,
  has_authors uuid[] default null,
  has_categories uuid[] default null,
  liked_by uuid[] default null,
  from_date timestamp default null,
  to_date timestamp default null,
  sort_by text default 'created_at',
  sort_order text default 'desc',
  paging_limit int default 20,
  paging_offset int default 0
)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM posts p
  LEFT JOIN likes l ON l.post = p.id
  WHERE
    (has_text IS NULL OR EXISTS (
      SELECT 1 FROM unnest(has_text) t WHERE p.body ILIKE '%' || t || '%'
    ))
    AND (has_authors IS NULL OR EXISTS (
      SELECT 1 FROM authors a WHERE a.post = p.id AND a.profile = ANY(has_authors)
    ))
    AND (has_categories IS NULL OR EXISTS (
      SELECT 1 FROM "postsCategories" pc WHERE pc.post = p.id AND pc.category = ANY(has_categories)
    ))
    AND (liked_by IS NULL OR EXISTS (
      SELECT 1 FROM likes l2 WHERE l2.post = p.id AND l2.profile = ANY(liked_by)
    ))
    AND (from_date IS NULL OR p.created_at >= from_date)
    AND (to_date IS NULL OR p.created_at <= to_date)
  GROUP BY p.id
  ORDER BY
    CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN p.created_at END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN p.created_at END ASC,
    CASE WHEN sort_by = 'features_count' AND sort_order = 'desc' THEN COUNT(l.post) END DESC,
    CASE WHEN sort_by = 'features_count' AND sort_order = 'asc' THEN COUNT(l.post) END ASC
  LIMIT paging_limit OFFSET paging_offset;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_profiles_feed(
  has_handle text[] default null,
  has_bio text[] default null,
  has_categories uuid[] default null,
  featured_by uuid[] default null,
  features_user uuid[] default null,
  author_of uuid[] default null,
  likes_posts uuid[] default null,
  from_date timestamp default null,
  to_date timestamp default null,
  sort_by text default 'created_at',
  sort_order text default 'desc',
  paging_limit int default 20,
  paging_offset int default 0
)
RETURNS SETOF profiles AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM profiles p
  LEFT JOIN features f ON f.featuree = p.id
  WHERE
    (has_handle IS NULL OR EXISTS (
      SELECT id FROM unnest(has_handle) h WHERE p.handle ILIKE '%' || h || '%'
    ))
    AND (has_bio IS NULL OR EXISTS (
      SELECT bio FROM unnest(has_bio) b WHERE p.bio ILIKE '%' || b || '%'
    ))
    AND (has_categories IS NULL OR EXISTS (
      SELECT profile FROM "profilesCategories" pc WHERE pc.profile = p.id AND pc.category = ANY(has_categories)
    ))
    AND (featured_by IS NULL OR EXISTS (
      SELECT featuree FROM features f WHERE f.featuree = p.id AND f.featurer = ANY(featured_by)
    ))
    AND (features_user IS NULL OR EXISTS (
      SELECT featurer FROM features f WHERE f.featurer = p.id AND f.featuree = ANY(features_user)
    ))
    AND (likes_posts IS NULL OR EXISTS (
      SELECT profile FROM likes l WHERE l.profile = p.id AND l.post = ANY(likes_posts)
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
$$ LANGUAGE plpgsql;
SELECT * from get_profiles_feed();
