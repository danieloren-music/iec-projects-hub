import { z } from "zod";
import { withAuthenticatedApi } from "@/lib/api/authentication";
import { apiError, schemaUnconfirmedResponse } from "@/lib/api/errors";
import { getPortfolioRepository } from "@/lib/data/portfolio-repository";

const ProjectIdSchema = z.string().trim().min(1).max(128);

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  return withAuthenticatedApi(request, async () => {
    const { projectId: rawProjectId } = await context.params;
    const parsedProjectId = ProjectIdSchema.safeParse(rawProjectId);
    if (!parsedProjectId.success) {
      return apiError(
        400,
        "BAD_REQUEST",
        "A valid project identifier is required.",
        parsedProjectId.error.issues,
      );
    }

    const project = await getPortfolioRepository().getProjectById(
      parsedProjectId.data,
    );
    if (!project) {
      return apiError(404, "NOT_FOUND", "Project not found.");
    }

    return Response.json({ project });
  });
}

export async function PATCH(request: Request) {
  return withAuthenticatedApi(request, async () => schemaUnconfirmedResponse());
}
