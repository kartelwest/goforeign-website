-- Private bucket for Nu Nu schedule-photo uploads. No storage.objects
-- policies are added — the bucket is private (public = false) and every
-- upload/read happens server-side with the service_role key, which bypasses
-- storage RLS the same way it bypasses table RLS elsewhere in this schema.
insert into storage.buckets (id, name, public)
values ('nunu-uploads', 'nunu-uploads', false)
on conflict (id) do nothing;
