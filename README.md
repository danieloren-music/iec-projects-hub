# IEC Projects Hub

Next.js 16.4.2 App Router application for the IEC PMO portfolio. The existing
Vercel deployment path and Supabase PostgreSQL data service remain the current
POC architecture. Hosting on Azure is a separate future decision; this
repository does not provision or deploy cloud resources.

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

- **Authentication**: Microsoft Entra ID OpenID Connect through Auth.js.
  Configure `AUTH_SESSION_SECRET`, `AUTH_TRUST_HOST=true`, `ENTRA_CLIENT_ID`,
  `ENTRA_CLIENT_SECRET`, and `ENTRA_ISSUER`. `AUTH_SESSION_SECRET` protects
  Auth.js sessions; `ENTRA_CLIENT_SECRET` authenticates this application to
  Microsoft Entra ID. They are separate credentials and must not be reused.
  The callback URI is
  `http://localhost:3000/api/auth/callback/microsoft-entra-id`. No SAML or
  local-password flow is implemented. The site redirects signed-out users to
  `/sign-in`; all application pages and API routes require an authenticated
  session.
- **Database**: Supabase PostgreSQL uses the server-side adapter and the
  existing project conventions. Set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` only after the owner reviews the database
  access policies and confirms that row-level security protects the data.
- **Project files**: Supabase Storage stores project files in the existing
  `project-documents` bucket, under a per-project path
  (`<project-id>/<upload-id>/<filename>`). The bucket is public as currently
  configured, so anyone with a file URL can access it even without signing in.
  The application still authorizes uploads and downloads through its Entra-
  protected API. Keep confidential files out of this bucket until it is made
  private and its access policies are configured. Run
  [`supabase/migrations/20261022153000_project_attachments.sql`](./supabase/migrations/20261022153000_project_attachments.sql)
  in the Supabase SQL Editor to create the metadata table, and set
  `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret in local development and
  Vercel. Supported files are limited to 6 MiB and the extension/MIME allowlist
  in the project workspace.
- **Optional Lin**: Gemini calls stay disabled unless `GEMINI_API_KEY` is set
  and external AI use is explicitly enabled with
  `LIN_EXTERNAL_AI_ENABLED=true`. Lin does not receive internal project
  records.

All environment values are placeholders in `.env.example`; no tenant details,
credentials, database connection values, or production records are included.

## PMO model status

The existing source establishes project and `infra_requirements` field
conventions. Task fields, approved status vocabularies, entity relationships,
RBAC roles and permission rules, audit requirements, and assignment/date rules
remain unconfirmed. Project and infrastructure reads are isolated behind the
repository layer. The frontend uses same-origin API reads for projects and
infrastructure. Creating a project currently writes only its `name` and
requires the database to generate its `id`; other PMO create/update routes and
task reads remain disabled until their contracts are confirmed. No project
migration is assumed. Verify the existing table contract in the Supabase SQL
Editor before using project creation:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'projects'
order by ordinal_position;
```

The `projects` table must have a writable `name` column and an `id` column with
a database-generated default. The attachment metadata migration does not
assume a project-table primary-key type or change the PMO schema.

Until project membership and permission rules are confirmed, any user signed in
to the configured Entra tenant can view and upload files for existing projects.
Do not store confidential/restricted files until project-level authorization is
approved. Files are force-downloaded; antivirus scanning is not configured.

## Hosting

Vercel remains the current POC host. No deployment is performed by this
repository scaffold. Choose Azure hosting and any data migration separately
before moving the application.
