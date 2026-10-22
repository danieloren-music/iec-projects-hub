import { z } from "zod";
import { apiError } from "@/lib/api/errors";
import { withExistingProject } from "@/lib/api/project-attachment-scope";
import {
  completeProjectAttachmentUpload,
  createProjectAttachmentUpload,
  listProjectAttachments,
} from "@/lib/data/project-attachments";

const CompleteUploadSchema = z.object({
  path: z.string().min(1).max(512),
}).strict();

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  return withExistingProject(request, context, async (projectId) => {
    const attachments = await listProjectAttachments(projectId);
    return Response.json({ attachments });
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  return withExistingProject(request, context, async (projectId, user) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return apiError(400, "BAD_REQUEST", "A valid JSON body is required.");
      }
      throw error;
    }

    if (
      typeof body === "object" &&
      body !== null &&
      "path" in body
    ) {
      const { path } = CompleteUploadSchema.parse(body);
      const attachment = await completeProjectAttachmentUpload(
        projectId,
        path,
        user,
      );
      return Response.json({ attachment }, { status: 201 });
    }

    const upload = await createProjectAttachmentUpload(projectId, body);
    return Response.json({ upload }, { status: 201 });
  });
}
