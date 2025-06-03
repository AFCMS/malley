UPDATE storage.buckets
SET file_size_limit = 2097152, /* 2 MB */
    allowed_mime_types = ARRAY['image/*']
WHERE id = 'profile-pics';

UPDATE storage.buckets
SET file_size_limit = 2097152, /* 2 MB */
    allowed_mime_types = ARRAY['image/*']
WHERE id = 'banners';