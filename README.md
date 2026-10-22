# IEC Projects Hub

Next.js 16.4.2 App Router application for the IEC PMO portfolio, using GitHub,
Vercel, and Supabase. This repository does not provision cloud resources.

## Local development

Use Node.js 22 or newer and npm:

```sh
npm ci
npm run dev
```

The app is served at `http://localhost:3000`. Run checks with:

```sh
npm run lint
npm test
npm run build
```

## Configuration

Copy `.env.example` to `.env.local` and ask the service owners for values using
their approved secret/configuration channels. Do not commit `.env.local`.

- **Authentication**: Auth.js protects application pages and API routes. A
  **development only**, `admin` / `admin` works without environment variables.
  This fallback is disabled whenever `NODE_ENV=production`. For production
  local-admin access, set `AUTH_SECRET`, `LOCAL_ADMIN_USERNAME`, and
  `LOCAL_ADMIN_PASSWORD_HASH`; generate a salted scrypt hash with
  `npm run auth:hash-admin`. The Entra SAML setup and exact Vercel endpoints are
  in [`docs/entra-saml-setup.md`](./docs/entra-saml-setup.md). Set the IdP SSO
  URL, issuer, and signing certificate in Vercel environment variables; SAML
  request/replay state is stored in Supabase so it works across serverless
  instances. Production also needs `AUTH_SECRET` and the Supabase service-role
  key. Never commit either secret.
- **Database**: Supabase PostgreSQL uses the server-side adapter and the
  existing project conventions. Set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` only after the owner reviews the database
  access policies and confirms that row-level security protects the data.
- **Project files and tasks**: Run the SQL migrations in
  [`supabase/migrations`](./supabase/migrations) in filename order in the
  Supabase SQL Editor. Project files live in the private `project-documents`
  Storage bucket, partitioned under
  `<project-id>/<upload-id>/<filename>`. The migration makes the bucket private
  and limits each file to 6 MiB. Downloads pass through the authenticated app
  API; files are not served from public URLs. Set
  `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret in local development and
  Vercel. Never expose this key to client code or commit it. Task records live
  in `project_tasks`, with `todo`, `in_progress`, `blocked`, and `done` states.
  Assignment is recorded by user email; an organization user directory and
  role-management screen are not included yet.
- **Optional Lin / Gemini**: Set a server-only `GEMINI_API_KEY` and explicitly
  enable `LIN_EXTERNAL_AI_ENABLED=true` to turn on Lin. Calls use Gemini 2.5
  Flash. Lin currently answers general PMO questions only and does not receive
  internal project records. Leave the flag `false` or the key empty to keep
  external AI calls disabled.

All environment values are placeholders in `.env.example`; no tenant details,
credentials, database connection values, or production records are included.

## PMO model status

Project and infrastructure reads use the existing Supabase schema. Creating a
project writes its `name`, optional `code`, `overview`, and `target_go_live`,
plus required `business_pm` (implementation owner) and `infra_lead`
(infrastructure project owner); the database must generate its `id`. Verify
that the existing projects table contains the selected columns before using
optional project fields. The task migration uses a text `project_id` to work
with the existing project ID type; the API verifies the project exists before
creating a task. Verify the existing table contract in the Supabase SQL Editor
before using project creation:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'projects'
order by ordinal_position;
```

The `projects` table must have writable `name`, `business_pm`, and `infra_lead`
columns and an `id` column with a database-generated default. Optional fields
are written only when supplied and require matching columns. The task and
attachment migrations do not change the PMO project schema.

Until project membership and permission rules are confirmed, any signed-in
application user can view and upload files for existing projects. Project
attachments are private at the Storage layer, but the application currently
does not enforce per-project membership. Files are force-downloaded; antivirus
scanning is not configured.

## Hosting

Vercel is the current application host. Apply the Supabase migrations before
enabling task management, private project-file storage, and Entra SAML
(`20261022162000_saml_auth_state.sql`).
