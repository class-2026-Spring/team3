create policy "아바타 업로드" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "아바타 조회" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "아바타 수정" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
