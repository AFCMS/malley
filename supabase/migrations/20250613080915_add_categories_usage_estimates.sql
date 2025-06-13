DROP MATERIALIZED VIEW estimated_categories_usage;
CREATE MATERIALIZED VIEW estimated_categories_usage AS
WITH
  est_posts AS (
    SELECT reltuples::bigint AS est_rows FROM pg_class WHERE relname = 'postsCategories'
  ),
  est_profiles AS (
    SELECT reltuples::bigint AS est_rows FROM pg_class WHERE relname = 'profilesCategories'
  ),
  rates AS (
    SELECT
      GREATEST(
        LEAST(100.0, 1000.0 / NULLIF(estp.est_rows,0) * 100.0),
        0.5
      ) AS rate_posts,
      GREATEST(
        LEAST(100.0, 1000.0 / NULLIF(estpr.est_rows,0) * 100.0),
        0.5
      ) AS rate_profiles,
      estp.est_rows AS posts_rows,
      estpr.est_rows AS profiles_rows
    FROM est_posts estp, est_profiles estpr
  ),
  s_posts AS (
    SELECT category FROM "postsCategories"
    TABLESAMPLE BERNOULLI((SELECT rate_posts FROM rates))
  ),
  s_profiles AS (
    SELECT category FROM "profilesCategories"
    TABLESAMPLE BERNOULLI((SELECT rate_profiles FROM rates))
  ),
  counts_posts AS (
    SELECT category, COUNT(*) AS count_sampled FROM s_posts GROUP BY category
  ),
  counts_profiles AS (
    SELECT category, COUNT(*) AS count_sampled FROM s_profiles GROUP BY category
  ),
  sample_sizes AS (
    SELECT
      (SELECT COUNT(*) FROM s_posts) AS n_posts,
      (SELECT COUNT(*) FROM s_profiles) AS n_profiles
  ),
  extrapolated_posts AS (
    SELECT
      category,
      count_sampled,
      CASE WHEN sp.n_posts > 0
        THEN ROUND(cp.count_sampled * r.posts_rows / sp.n_posts)
        ELSE 0 END AS extrapolated_count
    FROM counts_posts cp, sample_sizes sp, rates r
  ),
  extrapolated_profiles AS (
    SELECT
      category,
      count_sampled,
      CASE WHEN sp.n_profiles > 0
        THEN ROUND(cp.count_sampled * r.profiles_rows / sp.n_profiles)
        ELSE 0 END AS extrapolated_count
    FROM counts_profiles cp, sample_sizes sp, rates r
  ),
  all_extrapolated AS (
    SELECT category, extrapolated_count FROM extrapolated_posts
    UNION ALL
    SELECT category, extrapolated_count FROM extrapolated_profiles
  )
SELECT
  c.id as id,
  c.name as name,
  SUM(ae.extrapolated_count) AS estimated_total
FROM all_extrapolated ae
INNER JOIN categories c ON c.id = ae.category
GROUP BY c.id, c.name
ORDER BY estimated_total DESC;

CREATE EXTENSION IF NOT EXISTS pg_cron;

select cron.schedule('update estimated categories usage',
  '*/5 * * * *',
  $$
    ANALYZE "postsCategories";
    ANALYZE "profilesCategories";
    REFRESH MATERIALIZED VIEW estimated_categories_usage;
  $$
);