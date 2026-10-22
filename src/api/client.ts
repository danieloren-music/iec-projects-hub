import {
  InfrastructureRequirementSchema,
  ProjectListSchema,
  ProjectSchema,
  type InfrastructureRequirementRecord,
  type PortfolioSummary,
  type ProjectRecord,
} from "@/lib/data/project-model";
import type { ApiClient } from "@/api/types";
import {
  MAX_PROJECT_ATTACHMENT_SIZE,
  ProjectAttachmentListSchema,
  ProjectAttachmentSchema,
  ProjectAttachmentUploadSchema,
  normalizeAttachmentUpload,
  type ProjectAttachment,
} from "@/lib/data/project-attachment-policy";
import { upload as uploadToBlob } from "@vercel/blob/client";
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

async function request(path: string, init?: RequestInit): Promise<unknown> {
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

  return body;
}

function parsePayload<T>(
  schema: z.ZodType<T>,
  body: unknown,
  key: string,
): T {
  const payload = z.record(z.string(), z.unknown()).parse(body);
  return schema.parse(payload[key]);
}

async function getSummary(): Promise<PortfolioSummary> {
  const body = await request("/api/dashboard/summary");
  return parsePayload(SummarySchema, body, "summary");
}

async function getProjects(): Promise<ProjectRecord[]> {
  const body = await request("/api/projects");
  return parsePayload(ProjectListSchema, body, "projects");
}

async function getProject(projectId: string): Promise<ProjectRecord | null> {
  try {
    const body = await request(
      `/api/projects/${encodeURIComponent(projectId)}`,
    );
    return parsePayload(ProjectSchema, body, "project");
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

async function getProjectAttachments(
  projectId: string,
): Promise<ProjectAttachment[]> {
  const body = await request(
    `/api/projects/${encodeURIComponent(projectId)}/attachments`,
  );
  return parsePayload(ProjectAttachmentListSchema, body, "attachments");
}

async function uploadProjectAttachment(
  projectId: string,
  file: File,
): Promise<ProjectAttachment> {
  if (file.size > MAX_PROJECT_ATTACHMENT_SIZE) {
    throw new ApiRequestError(
      "Files must be 6 MiB or smaller.",
      413,
      "FILE_TOO_LARGE",
    );
  }

  const upload = normalizeAttachmentUpload(
    ProjectAttachmentUploadSchema.parse({
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    }),
  );
  const encodedProjectId = encodeURIComponent(projectId);
  const path = `${projectId}/${crypto.randomUUID()}/${upload.safeFilename}`;
  const blob = await uploadToBlob(path, file, {
    access: "private",
    contentType: upload.contentType,
    handleUploadUrl: `/api/projects/${encodedProjectId}/attachments/upload`,
    clientPayload: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    }),
  });

  const completionResponse = await request(
    `/api/projects/${encodedProjectId}/attachments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: blob.pathname }),
    },
  );

  return parsePayload(ProjectAttachmentSchema, completionResponse, "attachment");
}

async function getInfrastructureRequirements(): Promise<
  InfrastructureRequirementRecord[]
> {
  const body = await request("/api/infrastructure-requirements");
  return parsePayload(
    z.array(InfrastructureRequirementSchema),
    body,
    "requirements",
  );
}

async function getTasks(): Promise<never> {
  await request("/api/tasks");
  throw new ApiRequestError(
    "Task data is unavailable until the PMO task schema is confirmed.",
    503,
    "SCHEMA_UNCONFIRMED",
  );
}

export const liveClient: ApiClient = {
  getSummary,
  getProjects,
  getProject,
  getProjectAttachments,
  uploadProjectAttachment,
  getInfrastructureRequirements,
  getTasks,
};
