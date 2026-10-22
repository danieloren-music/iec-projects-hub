import { z } from "zod";
import { withAuthenticatedApi } from "@/lib/api/authentication";
import { apiError } from "@/lib/api/errors";
import { getPortfolioRepository } from "@/lib/data/portfolio-repository";
import { TaskCreateSchema } from "@/lib/data/project-model";
import { createTask, listTasks } from "@/lib/data/tasks";

const ProjectIdSchema = z.string().trim().min(1).max(128);

export async function GET(request: Request) {
  return withAuthenticatedApi(request, async () => {
    const projectId = new URL(request.url).searchParams.get("projectId") ?? undefined;
    if (projectId && !ProjectIdSchema.safeParse(projectId).success) {
      return apiError(
        400,
        "BAD_REQUEST",
        "A valid project identifier is required.",
      );
    }
    const tasks = await listTasks(projectId);
    return Response.json({ tasks });
  });
}

export async function POST(request: Request) {
  return withAuthenticatedApi(request, async (session) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return apiError(400, "BAD_REQUEST", "A valid JSON body is required.");
      }
      throw error;
    }

    const input = TaskCreateSchema.safeParse(body);
    if (!input.success) {
      return apiError(
        400,
        "BAD_REQUEST",
        "A valid project, task title, and optional assignee are required.",
        input.error.issues,
      );
    }

    const project = await getPortfolioRepository().getProjectById(
      input.data.project_id,
    );
    if (!project) {
      return apiError(404, "NOT_FOUND", "The selected project was not found.");
    }
    const task = await createTask(input.data, session.user.id);
    return Response.json({ task }, { status: 201 });
  });
}
