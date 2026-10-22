import { handleUpload } from "@vercel/blob/client";
import { z } from "zod";
import { apiError, withApiLogging } from "@/lib/api/errors";
import { withExistingProject } from "@/lib/api/project-attachment-scope";
import {
  isProjectAttachmentPath,
  MAX_PROJECT_ATTACHMENT_SIZE,
  normalizeAttachmentUpload,
  ProjectAttachmentUploadSchema,
} from "@/lib/data/project-attachment-policy";

const GenerateClientTokenEventSchema = z.object({
  type: z.literal("blob.generate-client-token"),
  payload: z.object({
    pathname: z.string().min(1).max(512),
    multipart: z.boolean(),
    clientPayload: z.string().nullable(),
  }),
});

const UploadCompletedEventSchema = z.object({
  type: z.literal("blob.upload-completed"),
  payload: z.object({
    blob: z.object({
      url: z.string(),
      downloadUrl: z.string(),
      pathname: z.string(),
      contentType: z.string(),
      contentDisposition: z.string(),
      etag: z.string(),
    }),
    tokenPayload: z.string().nullable().optional(),
  }),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiError(400, "BAD_REQUEST", "A valid JSON body is required.");
    }
    throw error;
  }

  const tokenEvent = GenerateClientTokenEventSchema.safeParse(body);
  if (tokenEvent.success) {
    return withExistingProject(request, context, async (projectId) => {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return apiError(
          503,
          "SERVICE_UNAVAILABLE",
          "Private project file uploads are not configured.",
        );
      }

      let clientPayload: unknown;
      try {
        clientPayload = JSON.parse(
          tokenEvent.data.payload.clientPayload ?? "",
        );
      } catch (error) {
        if (error instanceof SyntaxError) {
          return apiError(
            400,
            "BAD_REQUEST",
            "The upload details are invalid.",
          );
        }
        throw error;
      }

      const upload = normalizeAttachmentUpload(
        ProjectAttachmentUploadSchema.parse(clientPayload),
      );
      const path = tokenEvent.data.payload.pathname;
      if (
        !isProjectAttachmentPath(projectId, path) ||
        path.split("/").at(-1) !== upload.safeFilename
      ) {
        return apiError(
          400,
          "BAD_REQUEST",
          "The upload path is invalid for this project.",
        );
      }

      const response = await handleUpload({
        body: tokenEvent.data,
        request,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: [upload.contentType],
          maximumSizeInBytes: MAX_PROJECT_ATTACHMENT_SIZE,
          addRandomSuffix: false,
          allowOverwrite: false,
        }),
      });
      return Response.json(response);
    });
  }

  const completedEvent = UploadCompletedEventSchema.safeParse(body);
  if (completedEvent.success) {
    return withApiLogging(request, async () => {
      const response = await handleUpload({
        body: completedEvent.data,
        request,
        onBeforeGenerateToken: async () => {
          throw new Error("An upload token was not expected.");
        },
      });
      return Response.json(response);
    });
  }

  return apiError(400, "BAD_REQUEST", "The upload request is invalid.");
}
