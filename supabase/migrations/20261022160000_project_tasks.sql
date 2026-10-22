begin;

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  title text not null check (length(btrim(title)) between 1 and 200),
  description text check (description is null or length(description) <= 2000),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'blocked', 'done')),
  assigned_to text check (assigned_to is null or length(assigned_to) <= 254),
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_tasks_project_created_idx
  on public.project_tasks (project_id, created_at desc);

create index if not exists project_tasks_assignee_idx
  on public.project_tasks (lower(assigned_to))
  where assigned_to is not null;

alter table public.project_tasks enable row level security;
revoke all on table public.project_tasks from anon, authenticated;
grant select, insert, update on table public.project_tasks to service_role;

commit;
