import type {
  InfrastructureRequirementRecord,
  PortfolioSummary,
  ProjectRecord,
} from "@/lib/data/project-model";
import type { ProjectAttachment } from "@/lib/data/project-attachment-policy";

export interface ApiClient {
  getSummary(): Promise<PortfolioSummary>;
  getProjects(): Promise<ProjectRecord[]>;
  getProject(projectId: string): Promise<ProjectRecord | null>;
  getProjectAttachments(projectId: string): Promise<ProjectAttachment[]>;
  uploadProjectAttachment(
    projectId: string,
    file: File,
  ): Promise<ProjectAttachment>;
  getInfrastructureRequirements(): Promise<
    InfrastructureRequirementRecord[]
  >;
  getTasks(): Promise<never>;
}
