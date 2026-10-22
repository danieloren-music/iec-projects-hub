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
  Configure `AUTH_SECRET` and the Entra client ID, client secret, and
  issuer. The callback URI is
  `http://localhost:3000/api/auth/callback/microsoft-entra-id`. No SAML or
  local-password flow is implemented.
- **Database**: Supabase PostgreSQL uses the server-side adapter and the
  existing project conventions. Set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` only after the owner reviews the database
  access policies and confirms that row-level security protects the data.
- **Project files**: Vercel Blob provides private file storage and direct
  browser uploads. Create a private Blob store in Vercel and connect it to the
  project; set `BLOB_READ_WRITE_TOKEN` for local development (Vercel can inject
  it into deployments). The free Hobby plan has limited monthly quotas and is
  intended for personal projects; confirm the plan is appropriate for your
  organization and check current quotas before using it for production. Run
  [`supabase/migrations/20261022153000_project_attachments.sql`](./supabase/migrations/20261022153000_project_attachments.sql)
  in the Supabase SQL Editor to create the metadata table. Set
  `SUPABASE_SERVICE_ROLE_KEY` as a server-only database secret in local
  development and Vercel. Supported files are limited to 6 MiB and the
  extension/MIME allowlist in the project workspace.
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
infrastructure. Task reads and PMO create/update routes remain disabled until
those contracts are confirmed. The attachment metadata migration does not
assume a project-table primary-key type or change the PMO schema.

Until project membership and permission rules are confirmed, any user signed in
to the configured Entra tenant can view and upload files for existing projects.
Do not store confidential/restricted files until project-level authorization is
approved. Files are force-downloaded; antivirus scanning is not configured.

## Hosting

Vercel remains the current POC host. No deployment is performed by this
repository scaffold. Choose Azure hosting and any data migration separately
before moving the application.
