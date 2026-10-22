import type {
  InfrastructureRequirementRecord,
  PortfolioSummary,
  ProjectCreateInput,
  ProjectRecord,
  TaskCreateInput,
  TaskRecord,
  TaskUpdateInput,
} from "@/lib/data/project-model";
import type { ProjectAttachment } from "@/lib/data/project-attachment-policy";

export interface ApiClient {
  getSummary(): Promise<PortfolioSummary>;
  getProjects(): Promise<ProjectRecord[]>;
  createProject(input: ProjectCreateInput): Promise<ProjectRecord>;
  getProject(projectId: string): Promise<ProjectRecord | null>;
  getProjectAttachments(projectId: string): Promise<ProjectAttachment[]>;
  uploadProjectAttachment(
    projectId: string,
    file: File,
  ): Promise<ProjectAttachment>;
  getInfrastructureRequirements(): Promise<
    InfrastructureRequirementRecord[]
  >;
  getTasks(projectId?: string): Promise<TaskRecord[]>;
  createTask(input: TaskCreateInput): Promise<TaskRecord>;
  updateTask(taskId: string, input: TaskUpdateInput): Promise<TaskRecord>;
}
