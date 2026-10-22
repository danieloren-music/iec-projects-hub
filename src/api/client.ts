import {
  InfrastructureRequirementSchema,
  ProjectListSchema,
  ProjectSchema,
  type InfrastructureRequirementRecord,
  type PortfolioSummary,
  type ProjectRecord,
} from "@/lib/data/project-model";
import type { ApiClient, CurrentUser } from "@/api/types";
import { z } from "zod";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const SummarySchema = z.object({
  projectCount: z.number().int().nonnegative(),
  infrastructureRequirementCount: z.number().int().nonnegative(),
  tasks: z.literal("unavailable-until-schema-confirmed"),
});

const SessionSchema = z.object({
  user: z
    .object({
      id: z.string().nullish(),
      name: z.string().nullish(),
      email: z.string().nullish(),
    })
    .nullish(),
});

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiRequestError(
      "The application API could not be reached. Check that the app is running and try again.",
      0,
      "NETWORK_ERROR",
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const errorBody = z
      .object({
        error: z
          .object({
            code: z.string().optional(),
            message: z.string().optional(),
          })
          .optional(),
      })
      .safeParse(body);
    throw new ApiRequestError(
      errorBody.success && errorBody.data.error?.message
        ? errorBody.data.error.message
        : `The application API returned HTTP ${response.status}.`,
      response.status,
      errorBody.success ? errorBody.data.error?.code ?? null : null,
    );
  }

  return body as T;
}

function parsePayload<T>(
  schema: z.ZodType<T>,
  body: unknown,
  key: string,
): T {
  const payload = z.record(z.string(), z.unknown()).parse(body);
  return schema.parse(payload[key]);
}

async function getCurrentUser(): Promise<CurrentUser | null> {
  const body = await request<unknown>("/api/auth/session");
  const session = SessionSchema.parse(body).user;
  if (!session) return null;

  return {
    id: session.id ?? "",
    name: session.name,
    email: session.email,
  };
}

async function getSummary(): Promise<PortfolioSummary> {
  const body = await request<unknown>("/api/dashboard/summary");
  return parsePayload(SummarySchema, body, "summary");
}

async function getProjects(): Promise<ProjectRecord[]> {
  const body = await request<unknown>("/api/projects");
  return parsePayload(ProjectListSchema, body, "projects");
}

async function getProject(projectId: string): Promise<ProjectRecord | null> {
  try {
    const body = await request<unknown>(
      `/api/projects/${encodeURIComponent(projectId)}`,
    );
    return parsePayload(ProjectSchema, body, "project");
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

async function getInfrastructureRequirements(): Promise<
  InfrastructureRequirementRecord[]
> {
  const body = await request<unknown>("/api/infrastructure-requirements");
  return parsePayload(
    z.array(InfrastructureRequirementSchema),
    body,
    "requirements",
  );
}

async function getTasks(): Promise<never> {
  return request<never>("/api/tasks");
}

export const liveClient: ApiClient = {
  getCurrentUser,
  getSummary,
  getProjects,
  getProject,
  getInfrastructureRequirements,
  getTasks,
};
