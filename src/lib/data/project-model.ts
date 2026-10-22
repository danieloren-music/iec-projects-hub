import { z } from "zod";

const OptionalLabel = z.string().nullish();

export const InfrastructureRequirementSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    category: OptionalLabel,
    title: OptionalLabel,
    status: OptionalLabel,
    blocker_reason: OptionalLabel,
  })
  .strip();

export const ProjectSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: OptionalLabel,
    code: OptionalLabel,
    overview: OptionalLabel,
    business_pm: OptionalLabel,
    infra_lead: OptionalLabel,
    rag_status: OptionalLabel,
    overall_status: OptionalLabel,
    target_go_live: OptionalLabel,
    infra_requirements: z.array(InfrastructureRequirementSchema).nullish(),
  })
  .strip();

export const ProjectListSchema = z.array(ProjectSchema);

export const TaskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "blocked",
  "done",
]);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  assigned_to: z.string().email().max(254).nullable(),
  created_by: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TaskListSchema = z.array(TaskSchema);

export const TaskCreateSchema = z
  .object({
    project_id: z.string().trim().min(1).max(128),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    assigned_to: z.string().trim().email().max(254).optional(),
  })
  .strict();

export const TaskUpdateSchema = z
  .object({
    status: TaskStatusSchema.optional(),
    assigned_to: z.string().trim().email().max(254).nullable().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0);

export const ProjectCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    code: z.string().trim().min(1).max(64).optional(),
    overview: z.string().trim().min(1).max(2000).optional(),
    business_pm: z.string().trim().min(1).max(160),
    infra_lead: z.string().trim().min(1).max(160),
    target_go_live: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((value) => {
        const parsed = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(parsed.getTime()) &&
          parsed.toISOString().slice(0, 10) === value;
      })
      .optional(),
  })
  .strict();

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;
export type ProjectRecord = z.infer<typeof ProjectSchema>;
export type TaskRecord = z.infer<typeof TaskSchema>;
export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;
export type InfrastructureRequirementRecord = z.infer<
  typeof InfrastructureRequirementSchema
>;

export interface PortfolioSummary {
  projectCount: number;
  infrastructureRequirementCount: number;
  taskCount: number;
}

export function summarizePortfolio(
  projects: readonly ProjectRecord[],
  tasks: readonly TaskRecord[] = [],
): PortfolioSummary {
  return {
    projectCount: projects.length,
    infrastructureRequirementCount: projects.reduce(
      (total, project) => total + (project.infra_requirements?.length ?? 0),
      0,
    ),
    taskCount: tasks.length,
  };
}
