-- Private bucket for item reference photos. Files are served only through
-- short-lived signed URLs. Paths: orders/{order_id}/{item_id}/{file}.
-- Photos are compressed in the browser (~1600px) before upload; 5 MB is a safety cap.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Active users can view item images" on storage.objects
  for select to authenticated
  using (bucket_id = 'item-images' and (select private.is_active_user()));

create policy "Admins can upload item images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'item-images'
    and (select private.is_admin())
    and (storage.foldername(name))[1] = 'orders'
  );

create policy "Admins can replace item images" on storage.objects
  for update to authenticated
  using (bucket_id = 'item-images' and (select private.is_admin()))
  with check (bucket_id = 'item-images' and (select private.is_admin()));

create policy "Admins can delete item images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'item-images' and (select private.is_admin()));
