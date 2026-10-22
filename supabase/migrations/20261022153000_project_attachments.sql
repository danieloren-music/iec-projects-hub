-- This table stores project-file metadata. File contents are in the
-- project-documents Storage bucket; the service-role key is server-only.
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

commit;
