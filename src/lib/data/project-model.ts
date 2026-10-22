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

export type ProjectRecord = z.infer<typeof ProjectSchema>;
export type InfrastructureRequirementRecord = z.infer<
  typeof InfrastructureRequirementSchema
>;

export interface PortfolioSummary {
  projectCount: number;
  infrastructureRequirementCount: number;
  tasks: "unavailable-until-schema-confirmed";
}

export function summarizePortfolio(
  projects: readonly ProjectRecord[],
): PortfolioSummary {
  return {
    projectCount: projects.length,
    infrastructureRequirementCount: projects.reduce(
      (total, project) => total + (project.infra_requirements?.length ?? 0),
      0,
    ),
    tasks: "unavailable-until-schema-confirmed",
  };
}
