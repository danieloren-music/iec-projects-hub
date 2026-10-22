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
  Configure `AUTH_SECRET`, trusted-host handling (`AUTH_TRUST_HOST=true` only
  behind a trusted host/proxy), and the Entra client ID, client secret, and
  issuer. The callback URI is
  `http://localhost:3000/api/auth/callback/microsoft-entra-id`. No SAML or
  local-password flow is implemented.
- **Database**: Supabase PostgreSQL uses the server-side adapter and the
  existing project conventions. Set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` only after the owner reviews the database
  access policies and confirms that row-level security protects the data. The
  app does not use a service-role key.
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
infrastructure. Task reads and all PMO create/update routes remain disabled
until those contracts are confirmed. No production schema migrations or seed
records are included.

## Hosting

Vercel remains the current POC host. No deployment is performed by this
repository scaffold. Choose Azure hosting and any data migration separately
before moving the application.
