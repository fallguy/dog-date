-- Storage buckets for dog photos and (eventually) AI-generated videos.
-- Photos bucket is public-read (so profile URLs work in the swipe deck
-- without per-request auth). Only owners can upload/modify their own files.

-- ============================================================================
-- dog-photos bucket
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

-- Path convention: {user_id}/{dog_id}/{filename}
-- The first path segment is the owner's auth.uid(), used by the RLS policies.

create policy "anyone can read dog photos"
  on storage.objects for select
  using (bucket_id = 'dog-photos');

create policy "owners upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners update own files"
  on storage.objects for update
  using (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- dog-videos bucket (populated by the Fal.ai webhook edge function later)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('dog-videos', 'dog-videos', true)
on conflict (id) do nothing;

create policy "anyone can read dog videos"
  on storage.objects for select
  using (bucket_id = 'dog-videos');

-- Writes to dog-videos happen from the edge function using the service role,
-- which bypasses RLS, so no user-facing insert/update policy is needed here.
