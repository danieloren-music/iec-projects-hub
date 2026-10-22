import { z } from "zod";
import { withAuthenticatedApi } from "@/lib/api/authentication";
import { apiError } from "@/lib/api/errors";
import { getPortfolioRepository } from "@/lib/data/portfolio-repository";

const ProjectIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/u);

export function withExistingProject(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
  operation: (
    projectId: string,
    user: { id: string; email?: string | null },
  ) => Promise<Response>,
) {
  return withAuthenticatedApi(request, async (session) => {
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

    if (!session.user.id) {
      return apiError(401, "UNAUTHORIZED", "The user identity is unavailable.");
    }

    return operation(parsedProjectId.data, {
      id: session.user.id,
      email: session.user.email,
    });
  });
}
