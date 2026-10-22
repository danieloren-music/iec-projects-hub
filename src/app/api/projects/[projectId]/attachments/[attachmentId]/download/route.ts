import { z } from "zod";
import { apiError } from "@/lib/api/errors";
import { withExistingProject } from "@/lib/api/project-attachment-scope";
import { getProjectAttachmentDownload } from "@/lib/data/project-attachments";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ projectId: string; attachmentId: string }>;
  },
) {
  return withExistingProject(
    request,
    { params: context.params },
    async (projectId) => {
      const { attachmentId } = await context.params;
      const parsedId = z.string().uuid().safeParse(attachmentId);
      if (!parsedId.success) {
        return apiError(400, "BAD_REQUEST", "A valid file identifier is required.");
      }

      const file = await getProjectAttachmentDownload(
        projectId,
        parsedId.data,
      );
      if (!file) {
        return apiError(404, "NOT_FOUND", "Project file not found.");
      }

      return new Response(file.stream, {
        headers: {
          "Content-Type": file.contentType,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    },
  );
}
