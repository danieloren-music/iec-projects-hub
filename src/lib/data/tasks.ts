import "server-only";

import {
  TaskCreateSchema,
  TaskListSchema,
  TaskSchema,
  TaskUpdateSchema,
  type TaskCreateInput,
  type TaskRecord,
  type TaskUpdateInput,
} from "@/lib/data/project-model";
import { DataSourceUnavailableError } from "@/lib/data/portfolio-repository";
import { getSupabaseAdminClient } from "@/lib/data/supabase";

function requireAdminClient() {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new DataSourceUnavailableError(
      "Task management is not configured. Set the Supabase server-side service role key.",
    );
  }
  return client;
}

export async function listTasks(projectId?: string): Promise<TaskRecord[]> {
  let query = requireAdminClient()
    .from("project_tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query;
  if (error) {
    throw new DataSourceUnavailableError("Tasks could not be loaded.");
  }
  return TaskListSchema.parse(data ?? []);
}

export async function createTask(
  input: TaskCreateInput,
  createdBy: string,
): Promise<TaskRecord> {
  const taskInput = TaskCreateSchema.parse(input);
  const { data, error } = await requireAdminClient()
    .from("project_tasks")
    .insert({
      ...taskInput,
      description: taskInput.description || null,
      assigned_to: taskInput.assigned_to || null,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error) {
    throw new DataSourceUnavailableError("The task could not be created.");
  }
  return TaskSchema.parse(data);
}

export async function updateTask(
  taskId: string,
  input: TaskUpdateInput,
): Promise<TaskRecord | null> {
  const { data, error } = await requireAdminClient()
    .from("project_tasks")
    .update({
      ...TaskUpdateSchema.parse(input),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new DataSourceUnavailableError("The task could not be updated.");
  }
  return data ? TaskSchema.parse(data) : null;
}
