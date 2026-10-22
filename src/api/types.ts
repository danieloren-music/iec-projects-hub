import type {
  InfrastructureRequirementRecord,
  PortfolioSummary,
  ProjectRecord,
} from "@/lib/data/project-model";

export interface CurrentUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface ApiClient {
  getCurrentUser(): Promise<CurrentUser | null>;
  getSummary(): Promise<PortfolioSummary>;
  getProjects(): Promise<ProjectRecord[]>;
  getProject(projectId: string): Promise<ProjectRecord | null>;
  getInfrastructureRequirements(): Promise<
    InfrastructureRequirementRecord[]
  >;
  getTasks(): Promise<never>;
}
