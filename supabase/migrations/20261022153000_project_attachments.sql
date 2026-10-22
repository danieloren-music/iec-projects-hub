-- Project files are private. Only authenticated application APIs use the
-- service-role key; never expose that key to the browser.
begin;

create table if not exists public.project_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  storage_path text not null unique,
  filename text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 6291456),
  uploaded_by text not null,
  uploaded_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists project_attachments_project_created_idx
  on public.project_attachments (project_id, created_at desc);

alter table public.project_attachments enable row level security;
revoke all on table public.project_attachments from anon, authenticated;
grant select, insert on table public.project_attachments to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'project-documents',
  'project-documents',
  false,
  6291456,
  array[
    'application/json',
    'application/msword',
    'application/pdf',
    'application/zip',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/yaml',
    'image/jpeg',
    'image/png',
    'text/csv',
    'text/markdown',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
