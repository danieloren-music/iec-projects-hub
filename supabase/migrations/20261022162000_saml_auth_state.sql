begin;

create table if not exists public.auth_saml_cache (
  cache_key text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists auth_saml_cache_expires_at_idx
  on public.auth_saml_cache (expires_at);

alter table public.auth_saml_cache enable row level security;
revoke all on table public.auth_saml_cache from anon, authenticated;
grant select, insert, update, delete on table public.auth_saml_cache to service_role;

commit;
