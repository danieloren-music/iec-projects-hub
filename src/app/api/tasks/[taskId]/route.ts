import { z } from "zod";
import { withAuthenticatedApi } from "@/lib/api/authentication";
import { apiError } from "@/lib/api/errors";
import { TaskUpdateSchema } from "@/lib/data/project-model";
import { updateTask } from "@/lib/data/tasks";

const TaskIdSchema = z.string().uuid();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  return withAuthenticatedApi(request, async () => {
    const { taskId } = await context.params;
    const parsedId = TaskIdSchema.safeParse(taskId);
    if (!parsedId.success) {
      return apiError(
        400,
        "BAD_REQUEST",
        "A valid task identifier is required.",
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return apiError(400, "BAD_REQUEST", "A valid JSON body is required.");
      }
      throw error;
    }

    const input = TaskUpdateSchema.safeParse(body);
    if (!input.success) {
      return apiError(
        400,
        "BAD_REQUEST",
        "A valid task status or assignee is required.",
        input.error.issues,
      );
    }
    const task = await updateTask(parsedId.data, input.data);
    if (!task) return apiError(404, "NOT_FOUND", "Task not found.");
    return Response.json({ task });
  });
}
