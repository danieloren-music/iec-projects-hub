# Integration Hand-off

- **Status**: Frontend-to-API integration completed; live authentication/database verification remains blocked until owner configuration is supplied.

- **Workspace**: repository root; Next.js 16.4.2 App Router + Route Handlers, Node runtime.
- **Commands**: `npm ci`; `npm run dev` (port 3000); `npm run build`; `npm run lint`; `npm test`.
- **Backend**: repository root; local API runs with Next.js at port 3000; health `GET /api/health`.
- **Frontend**: repository root; dev `npm run dev`; build `npm run build`.
- **API seam**: `src/api/index.ts` exports the typed live client from `src/api/client.ts`. Types: `src/api/types.ts`; project types: `src/lib/data/project-model.ts`.
- **Mock cleanup after live wiring**: `src/api/mockClient.ts` has been removed. There are no synthetic record datasets, duplicated local PMO types, or Mock State Switcher.
- **API inventory**:
  - `GET /api/health`
  - `GET /api/dashboard/summary`
  - `GET, POST /api/projects`
  - `GET, PATCH /api/projects/{projectId}`
  - `GET, POST /api/tasks`
  - `PATCH /api/tasks/{taskId}`
  - `GET, POST /api/infrastructure-requirements`
  - `PATCH /api/infrastructure-requirements/{requirementId}`
  - `POST /api/lin`
  - `GET /api/openapi.json`
  - Auth.js OIDC: `GET, POST /api/auth/[...nextauth]`; callback `/api/auth/callback/microsoft-entra-id`.
- **Current API limits**: project and infrastructure reads use only existing repository conventions (`projects`, nested `infra_requirements`); task reads return `SCHEMA_UNCONFIRMED`; all project/task/infrastructure writes are disabled pending PMO confirmation. No role/permission matrix is assumed.
- **Authentication**: Microsoft Entra ID via OIDC/Auth.js only (no SAML or local-password flow). Required deployment settings: `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_ISSUER`. Values are user-supplied; do not invent them.
- **Database**: PostgreSQL via Supabase; server adapter `src/lib/data/supabase.ts`; env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Migration tool/directory remain TBD until the PMO entity contract is confirmed. **Create no schema migrations and NO seed data** until fields, relationships, status values, roles, and permissions are approved.
- **Services**: Essential—Vercel (current host, external to Azure), Supabase PostgreSQL (external to Azure). Enhancement—Gemini Lin (external; disabled unless `GEMINI_API_KEY` and explicit `LIN_EXTERNAL_AI_ENABLED=true` are configured; no project records are sent to Gemini).
- **Hosting**: do not deploy. Azure target and migration work require a separate future deployment plan.

## Integration results (2026-10-22)

- Replaced the empty preview API client with a typed same-origin client for the existing read endpoints; dashboard, project, infrastructure, and task screens now render live loading, empty, or API error states. Removed `src/api/mockClient.ts`.
- No schema migration was created or applied: this hand-off prohibits schema assumptions until PMO fields, relations, statuses, RBAC, and audit rules are confirmed. No seed data was created.
- The local Next.js production server built and started. `/` returned 200; `/api/openapi.json` returned 200; `/api/health` returned 503 with authentication/database unconfigured. Every API inventory route/method registered and returned either 200 (public routes) or a structured 503 `SERVICE_UNAVAILABLE`; no 500s remained after adding a clean OIDC-unconfigured response for Auth.js routes.
- OIDC and Supabase values are not configured in this workspace. Authenticated reads cannot be verified against the database; task API behavior cannot pass the auth gate to surface `SCHEMA_UNCONFIRMED`. A successful browser-to-API data request and end-to-end populated/empty data rendering therefore remain blocked.
- `npm run lint`, `npm test` (2 tests), `tsc --noEmit`, and `npm run build` all pass using the local Node 22 runtime. No deployment, commit, or push was performed. The project plan is approved; deployment and authenticated live-data verification remain pending configuration.
