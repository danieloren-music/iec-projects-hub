const spec = {
  openapi: "3.1.0",
  info: {
    title: "IEC Projects Hub API",
    version: "0.1.0",
    description:
      "Read-only PMO API scaffold. Write contracts and task schemas remain disabled pending PMO confirmation.",
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "__Secure-authjs.session-token",
        description: "Auth.js OIDC session established by Microsoft Entra ID.",
      },
    },
  },
  paths: {
    "/api/health": { get: { summary: "Application configuration health" } },
    "/api/dashboard/summary": {
      get: {
        summary: "Portfolio aggregates",
        security: [{ sessionCookie: [] }],
      },
    },
    "/api/projects": {
      get: {
        summary: "List projects",
        security: [{ sessionCookie: [] }],
      },
      post: {
        summary: "Disabled until PMO schema is confirmed",
        security: [{ sessionCookie: [] }],
      },
    },
    "/api/projects/{projectId}": {
      get: {
        summary: "Read one project",
        security: [{ sessionCookie: [] }],
      },
      patch: {
        summary: "Disabled until PMO schema is confirmed",
        security: [{ sessionCookie: [] }],
      },
    },
    "/api/projects/{projectId}/attachments": {
      get: {
        summary: "List private files attached to a project",
        security: [{ sessionCookie: [] }],
      },
      post: {
        summary:
          "Create a signed upload URL or register a completed project-file upload",
        security: [{ sessionCookie: [] }],
      },
    },
    "/api/projects/{projectId}/attachments/{attachmentId}/download": {
      get: {
        summary: "Redirect to a short-lived private project-file download",
        security: [{ sessionCookie: [] }],
      },
    },
    "/api/tasks": {
      get: {
        summary: "Disabled until PMO task schema is confirmed",
        security: [{ sessionCookie: [] }],
      },
      post: {
        summary: "Disabled until PMO task schema is confirmed",
        security: [{ sessionCookie: [] }],
      },
    },
    "/api/tasks/{taskId}": {
      patch: {
        summary: "Disabled until PMO task schema is confirmed",
        security: [{ sessionCookie: [] }],
      },
    },
    "/api/infrastructure-requirements": {
      get: {
        summary: "List infrastructure requirements",
        security: [{ sessionCookie: [] }],
      },
      post: {
        summary: "Disabled until PMO schema is confirmed",
        security: [{ sessionCookie: [] }],
      },
    },
    "/api/infrastructure-requirements/{requirementId}": {
      patch: {
        summary: "Disabled until PMO schema is confirmed",
        security: [{ sessionCookie: [] }],
      },
    },
    "/api/lin": {
      post: {
        summary: "Optional Lin Q&A; unavailable until explicitly enabled",
        security: [{ sessionCookie: [] }],
      },
    },
  },
};

export async function GET() {
  return Response.json(spec);
}
