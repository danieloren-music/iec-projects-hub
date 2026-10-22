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

- **Authentication**: Auth.js protects application pages and API routes. A
  local administrator login works without Entra when `AUTH_SECRET`,
  `LOCAL_ADMIN_USERNAME`, and `LOCAL_ADMIN_PASSWORD_HASH` are configured. Set
  the username to `admin` or `root` as needed; the application contains no
  admin password. Generate a salted scrypt hash through a hidden terminal
  prompt with `npm run auth:hash-admin`, then place the resulting hash only in
  `.env.local` or the hosting provider's secret store. Use a long, unique
  password and protect public deployments with network controls and login
  rate-limiting.

  Microsoft Entra sign-in remains an optional OpenID Connect provider through
  Auth.js. Configure `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, and
  `ENTRA_TENANT_ID` to enable it. Register these Web redirect URIs in Entra:
  `http://localhost:3000/api/auth/callback/microsoft-entra-id` and
  `https://<your-vercel-domain>/api/auth/callback/microsoft-entra-id`.
  `AUTH_SECRET` is a separate random key used by Auth.js to protect sessions,
  not a Microsoft credential. Generate it using the command in `.env.example`
  and store it in local and deployment secret settings. The application trusts
  its configured hosting proxy; no extra `AUTH_TRUST_HOST` value is required.
  The root URL (`/`) is protected and redirects signed-out users to `/sign-in`.
  The configured local account can be named `admin` or `root`; the current
  application does not yet enforce a separate PMO role/permission matrix.
  Entra currently uses OIDC, not SAML. A SAML change requires the Entra
  enterprise-app metadata/certificate and a production-ready shared
  request/replay-state store; do not switch protocols by only changing an
  environment variable.
- **Database**: Supabase PostgreSQL uses the server-side adapter and the
  existing project conventions. Set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` only after the owner reviews the database
  access policies and confirms that row-level security protects the data.
- **Project files**: The current upload/download implementation also requires
  the server-only `SUPABASE_SERVICE_ROLE_KEY` to issue signed uploads and access
  attachment metadata. Never expose this key to client code or commit it.
  Supabase Storage stores project files in the existing
  `project-documents` bucket, under a per-project path
  (`<project-id>/<upload-id>/<filename>`). The bucket is public as currently
  configured, so anyone with a file URL can access it even without signing in.
  The application still authorizes uploads and downloads through its
  authenticated API. Keep confidential files out of this bucket until it is made
  private and its access policies are configured. Run
  [`supabase/migrations/20261022153000_project_attachments.sql`](./supabase/migrations/20261022153000_project_attachments.sql)
  in the Supabase SQL Editor to create the metadata table, and set
  `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret in local development and
  Vercel. Supported files are limited to 6 MiB and the extension/MIME allowlist
  in the project workspace.
- **Optional Lin / Gemini**: Set a server-only `GEMINI_API_KEY` and explicitly
  enable `LIN_EXTERNAL_AI_ENABLED=true` to turn on Lin. Calls use Gemini 2.5
  Flash. Lin currently answers general PMO questions only and does not receive
  internal project records. Leave the flag `false` or the key empty to keep
  external AI calls disabled.

All environment values are placeholders in `.env.example`; no tenant details,
credentials, database connection values, or production records are included.

## PMO model status

The existing source establishes project and `infra_requirements` field
conventions. Task fields, approved status vocabularies, entity relationships,
RBAC roles and permission rules, audit requirements, and assignment/date rules
remain unconfirmed. Project and infrastructure reads are isolated behind the
repository layer. The frontend uses same-origin API reads for projects and
infrastructure. Creating a project writes its `name`, optional `code`, `overview`, and
`target_go_live`, plus required `business_pm` (implementation owner) and
`infra_lead` (infrastructure project owner); the database must generate its
`id`. Verify that the existing projects table contains the selected columns
before using optional project fields. Other PMO create/update routes and task
reads remain disabled until their contracts are confirmed. No project
migration is assumed. Verify the existing table contract in the Supabase SQL
Editor before using project creation:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'projects'
order by ordinal_position;
```

The `projects` table must have writable `name`, `business_pm`, and `infra_lead`
columns and an `id` column with a database-generated default. Optional fields
are written only when supplied and require matching columns. The attachment
metadata migration does not assume a project-table primary-key type or change
the PMO schema.

Until project membership and permission rules are confirmed, any user signed in
to the configured Entra tenant can view and upload files for existing projects.
Do not store confidential/restricted files until project-level authorization is
approved. Files are force-downloaded; antivirus scanning is not configured.

## Hosting

Vercel remains the current POC host. No deployment is performed by this
repository scaffold. Choose Azure hosting and any data migration separately
before moving the application.
