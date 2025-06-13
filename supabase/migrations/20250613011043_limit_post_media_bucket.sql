UPDATE storage.buckets
SET file_size_limit = 4194304, /* 4 MB */
    allowed_mime_types = ARRAY['image/*']
WHERE id = 'post-media';