# Project Plan

**Status**: Approved
**Created**: 2026-10-22
**Mode**: AUGMENT

---

## 1. Project Overview

**Goal**: Augment the existing IEC Projects Hub Next.js application into a polished PMO portfolio for dashboard, project, task, and infrastructure-requirement tracking, with role-aware screens, Hebrew/English and RTL/LTR support, dark mode, and optional Lin chat. Keep the current Vercel/Supabase deployment path distinct from a future Azure deployment and isolate provider-specific code so domain logic remains portable. The project is designed so that every module is independently testable.

**App Type**: Full-stack SSR

**API Login**: Yes

**Mode**: AUGMENT

**Deployment Plan**: `.azure/plan.md` not found; Vercel is the current POC host and Azure is a future portability target.

---

## 2. Backend — Next.js Route Handlers

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Runtime** | Node |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |
| **Orchestration** | docker-compose |

Keep the existing Next.js Route Handlers as the POC API; this is not an Azure Functions service. Route handlers should validate requests and delegate to typed domain/service interfaces and server-side data-access modules rather than owning database SDK calls. Keep the Supabase adapter replaceable and avoid Vercel-specific APIs in domain logic so a later Azure hosting choice is an infrastructure change, not a domain rewrite. Detailed PMO fields, relationships, status vocabularies, and role/permission rules are intentionally unconfirmed; do not create a database schema or seed records from this plan alone.

---

## 3. Frontend — Next.js App Router

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | Next.js App Router |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Vercel (external to Azure; current host) | Host the existing Next.js POC | — | `npm run dev` | Essential |
| Supabase PostgreSQL (external to Azure; current datastore) | Primary relational persistence for project, task, and infrastructure tracking | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Set locally in `.env.local` from the user's Supabase project; no committed fallback | Essential |
| Supabase Storage (external to Azure; current file storage) | Project attachments under per-project paths; bucket is public as currently configured | `SUPABASE_SERVICE_ROLE_KEY` (server-only), plus Supabase URL and anon key | Use the existing `project-documents` bucket; apply `supabase/migrations/20261022153000_project_attachments.sql` for metadata | Essential for attachments |
| Google Gemini API (external to Azure; optional) | Optional Lin general PMO Q&A; enhancement only | `GEMINI_API_KEY`, `LIN_EXTERNAL_AI_ENABLED` | Unset / `false`; enable only after approval | Enhancement |

No Azure service is required for the current Vercel-hosted POC. Choose an Azure hosting service and any related migration work during a separate future Azure deployment plan; do not treat Vercel or Supabase as Azure resources.

---

## 5. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | backend, frontend | ❓ | Not confirmed by scan (`node --version` unavailable in the scanned shell) |
| npm | backend, frontend | ❓ | Not confirmed by scan (`npm --version` unavailable in the scanned shell) |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Chrome | frontend | ✅ | 155.0.8059.85 |

Double-check that all ❓ tools are installed and available in your development shell before proceeding. No Azure Functions or Azure-emulator prerequisite is included because the current app uses Next.js Route Handlers and Vercel/Supabase; no matching VS Code debug-integration extension is required by the prerequisite reference for this service set.

---

## 6. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: A calm, data-dense PMO console with precise typography, compact project tables, restrained navy/teal accents, and clear status contrast. Provide a light default and a matching dark theme; use semantic status colors consistently without letting them overpower delivery data.
**Typography**: Geist, system-ui
**Assistant Experience**: Lin remains opt-in and can be opened in a contextual side panel from the portfolio workspace; show a clear unavailable state until the optional AI service is securely configured.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1D4ED8` | Project actions, active portfolio navigation, and selected workspaces |
| `accent` | `#0F766E` | Infrastructure highlights and Lin assistant accents |
| `surface` | `#F4F7FB` | Portfolio canvas and default light-mode page background |
| `text` | `#172033` | Project names, work-item labels, and core delivery information |
| `muted` | `#667085` | Ownership/context captions and secondary portfolio metadata |
| `border` | `#D7E0EB` | Project-grid dividers, request-table rules, and control outlines |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Portfolio Dashboard | `/` | Scan portfolio health, delivery workload, and infrastructure demand at a glance. | `header, nav, hero, kpi-row, split(table\|card-list), footer` |
| Projects | `/projects` | Search and review the project portfolio by delivery state and health. | `header, nav, tabs, table, footer` |
| Project Workspace | `/projects/[projectId]` | Review one project's summary, related tasks, and infrastructure requests. | `header, nav, hero, tabs, two-column(table+card-list), footer` |
| Task Board | `/tasks` | Review and filter task work across the portfolio. | `header, nav, section-title, tabs, table, footer` |
| Infrastructure Requests | `/infrastructure` | Track infrastructure requirements and show the empty unassigned view. | `header, nav, section-title, tabs, table, empty, footer` |
| Sign In | `/sign-in` | Provide a dedicated entry point before users reach the portfolio. | `header, main, form, actions, footer` |

### Sample Content

The following synthetic records are solely for the layout preview; they are not production or approved PMO data. Names, counts, field labels, and state labels must be validated against the user's PMO conventions before they become fixtures or seed data.

```text
Portfolio Dashboard — project summary (illustrative):
| Project                    | Delivery state | Health        | Open tasks |
| Datricks rollout           | In delivery    | Attention     | 4          |
| PMO workspace pilot        | Planning       | On track      | 7          |
| Network visibility upgrade | In delivery    | At risk       | 3          |

Projects — project (illustrative):
| Project                    | Stage          | Health        | Work items |
| Datricks rollout           | In delivery    | Attention     | 8          |
| PMO workspace pilot        | Planning       | On track      | 12         |
| Network visibility upgrade | In delivery    | At risk       | 6          |

Project Workspace — Datricks rollout tasks:
| Task                          | Project          | State       |
| Confirm dependency owner      | Datricks rollout | In progress |
| Validate test environment     | Datricks rollout | Blocked     |
| Prepare rollout checkpoint   | Datricks rollout | Planned     |

Project Workspace — Datricks rollout infrastructure:
| Requirement                 | Project          | State       |
| Network connectivity review | Datricks rollout | Open        |
| Test environment capacity   | Datricks rollout | In progress |
| Data access review          | Datricks rollout | Open        |

Task Board — task:
| Task                         | Project                    | State       |
| Confirm dependency owner     | Datricks rollout           | In progress |
| Prepare pilot walkthrough   | PMO workspace pilot        | Planned     |
| Validate network path       | Network visibility upgrade | Blocked     |

Infrastructure Requests — requirement:
| Requirement                 | Project                    | State       |
| Network connectivity review | Datricks rollout           | Open        |
| Test environment capacity   | PMO workspace pilot        | In progress |
| Data access review          | Network visibility upgrade | Open        |

Sign In — no credentials or sample secrets:
Local account: blank username and password · Entra: optional Microsoft sign-in button
```

Before schema or data implementation, confirm the PMO entity fields, relationships, permitted status/health values, role names and permission matrix, assignment/date rules, audit/history needs, and whether any demonstration records are approved. The preview depicts loading, empty, and error states as well as populated examples; the empty filter is illustrative, not a claim about live data.

---

## 7. Project Structure

```text
iec-projects-hub/
├── .azure/
│   ├── requirements.json                 # Existing
│   └── project-plan.md                   # This plan
├── public/                               # Existing static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts           # Planned
│   │   │   ├── dashboard/summary/route.ts # Planned
│   │   │   ├── projects/route.ts         # Planned
│   │   │   ├── projects/[projectId]/route.ts # Planned
│   │   │   ├── tasks/route.ts            # Planned
│   │   │   ├── tasks/[taskId]/route.ts   # Planned
│   │   │   ├── infrastructure-requirements/route.ts # Planned
│   │   │   ├── projects/[projectId]/attachments/route.ts # Planned
│   │   │   └── projects/[projectId]/attachments/[attachmentId]/download/route.ts # Planned
│   │   │   └── lin/route.ts              # Existing; review before extending
│   ├── sign-in/page.tsx                  # Planned dedicated sign-in landing
│   │   ├── infrastructure/page.tsx       # Planned
│   │   ├── projects/page.tsx             # Planned
│   │   ├── projects/[projectId]/page.tsx  # Planned
│   │   ├── tasks/page.tsx                # Planned
│   │   ├── page.tsx                      # Existing; portfolio dashboard
│   │   ├── layout.tsx                    # Existing
│   │   └── globals.css                   # Existing
│   ├── components/
│   │   ├── portfolio/                    # Planned reusable dashboard/project views
│   │   ├── tasks/                        # Planned task views
│   │   ├── infrastructure/               # Planned requirement views
│   │   └── assistant/                    # Planned Lin side-panel experience
│   ├── lib/
│   │   ├── supabase.ts                   # Existing; refactor behind a server-side data-access boundary
│   │   ├── data/                         # Planned typed repository/service contracts
│   │   └── validation/                   # Planned request validation after schema confirmation
│   └── messages/                          # Planned English/Hebrew UI resources
├── tests/                                 # Planned unit/component/API tests
├── supabase/
│   └── migrations/                        # Project-attachment metadata only
├── package.json                           # Existing; add test script/config when implementing
└── .env.example                            # Planned; names only, never real credentials
```

---

## 8. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/api/health` | Health check for the application and configured dependencies | — | `{ status, services }` | 200, 503 |
| 2 | GET | `/api/dashboard/summary` | Return portfolio dashboard aggregates | — | `{ summary }` | 200, 503 |
| 3 | GET | `/api/projects` | List projects using confirmed filter/paging rules | — | `{ projects }` | 200, 400, 500 |
| 4 | POST | `/api/projects` | Create a project after its field contract is confirmed | Project payload (schema to confirm) | `{ project }` | 201, 400, 409, 422, 500 |
| 5 | GET | `/api/projects/{projectId}` | Read one project and its confirmed summary | — | `{ project }` | 200, 404, 500 |
| 6 | PATCH | `/api/projects/{projectId}` | Update a project using confirmed fields | Project patch (schema to confirm) | `{ project }` | 200, 400, 404, 409, 422, 500 |
| 7 | GET | `/api/tasks` | List tasks using confirmed filter/paging rules | — | `{ tasks }` | 200, 400, 500 |
| 8 | POST | `/api/tasks` | Create a task after its field and relationship contracts are confirmed | Task payload (schema to confirm) | `{ task }` | 201, 400, 409, 422, 500 |
| 9 | PATCH | `/api/tasks/{taskId}` | Update a task using confirmed fields | Task patch (schema to confirm) | `{ task }` | 200, 400, 404, 409, 422, 500 |
| 10 | GET | `/api/infrastructure-requirements` | List infrastructure requirements using confirmed filters | — | `{ requirements }` | 200, 400, 500 |
| 11 | POST | `/api/infrastructure-requirements` | Create a requirement after its field contract is confirmed | Requirement payload (schema to confirm) | `{ requirement }` | 201, 400, 409, 422, 500 |
| 12 | PATCH | `/api/infrastructure-requirements/{requirementId}` | Update a requirement using confirmed fields | Requirement patch (schema to confirm) | `{ requirement }` | 200, 400, 404, 409, 422, 500 |
| 13 | POST | `/api/lin` | Optional Lin Q&A endpoint; retain the existing route shape and make availability configuration-dependent | `{ prompt }` | `{ reply }` | 200, 400, 500, 503 |
| 14 | GET | `/api/projects/{projectId}/attachments` | List attachments for an existing project for signed-in users | — | `{ attachments }` | 200, 401, 404, 503 |
| 15 | POST | `/api/projects/{projectId}/attachments` | Create a signed upload URL or register an uploaded file | `{ filename, contentType, sizeBytes }` or `{ path }` | `{ upload }` or `{ attachment }` | 201, 400, 401, 404, 503 |
| 16 | GET | `/api/projects/{projectId}/attachments/{attachmentId}/download` | Download a file after application authorization | — | File response | 200, 401, 404, 503 |

Use the shared error response shape `{ "error": { "code": "NOT_FOUND", "message": "Item not found", "details": null } }`, with the applicable standard error code for validation, malformed input, missing resources, conflicts, and unhandled errors. The concrete payload schemas remain subject to the confirmation items in Section 6.

---

## 9. Next Steps

1. Confirm the existing Supabase bucket is named `project-documents` and set to public; the current API keeps upload/download actions behind Entra authentication, but public object URLs remain accessible to anyone who has them.
2. Run the project-attachment metadata SQL migration in the Supabase SQL Editor and configure its service key as a server-only secret.
3. Configure Entra ID OIDC and Supabase using deployment secrets; never commit credentials.
4. Confirm PMO entities, status vocabulary, relationships, roles, permissions, and audit requirements before adding PMO migrations or write operations.
5. Keep confidential project files out of the public bucket; use a private bucket and project-level authorization for sensitive content.
6. Plan Azure hosting and any provider/data migration separately; do not provision or deploy without explicit authorization.
