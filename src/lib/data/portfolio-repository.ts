import "server-only";

import {
  InfrastructureRequirementSchema,
  ProjectCreateSchema,
  ProjectListSchema,
  type InfrastructureRequirementRecord,
  type ProjectCreateInput,
  type ProjectRecord,
} from "@/lib/data/project-model";
import { getSupabaseServerClient } from "@/lib/data/supabase";

export class DataSourceUnavailableError extends Error {
  constructor(message = "Supabase is not configured.") {
    super(message);
    this.name = "DataSourceUnavailableError";
  }
}

export interface PortfolioRepository {
  listProjects(): Promise<ProjectRecord[]>;
  createProject(input: ProjectCreateInput): Promise<ProjectRecord>;
  getProjectById(projectId: string): Promise<ProjectRecord | null>;
  listInfrastructureRequirements(): Promise<
    InfrastructureRequirementRecord[]
  >;
}

export class SupabasePortfolioRepository implements PortfolioRepository {
  async listProjects(): Promise<ProjectRecord[]> {
    const client = getSupabaseServerClient();
    if (!client) {
      throw new DataSourceUnavailableError();
    }

    const { data, error } = await client
      .from("projects")
      .select("*, infra_requirements(*)");

    if (error) {
      throw new DataSourceUnavailableError("Project data could not be loaded.");
    }

    return ProjectListSchema.parse(data ?? []);
  }

  async createProject(input: ProjectCreateInput): Promise<ProjectRecord> {
    const client = getSupabaseServerClient();
    if (!client) {
      throw new DataSourceUnavailableError();
    }

    const { data, error } = await client
      .from("projects")
      .insert(ProjectCreateSchema.parse(input))
      .select("*, infra_requirements(*)")
      .single();

    if (error) {
      throw new DataSourceUnavailableError(
        "Project could not be created. Verify that the projects table accepts a name and generates its id.",
      );
    }

    const project = ProjectListSchema.element.safeParse(data);
    if (!project.success || project.data.id == null) {
      throw new DataSourceUnavailableError(
        "The project was created, but its generated identifier could not be verified.",
      );
    }

    return project.data;
  }

  async getProjectById(projectId: string): Promise<ProjectRecord | null> {
    const client = getSupabaseServerClient();
    if (!client) {
      throw new DataSourceUnavailableError();
    }

    const { data, error } = await client
      .from("projects")
      .select("*, infra_requirements(*)")
      .eq("id", projectId)
      .maybeSingle();

    if (error) {
      throw new DataSourceUnavailableError("Project data could not be loaded.");
    }

    return data ? ProjectListSchema.element.parse(data) : null;
  }

  async listInfrastructureRequirements(): Promise<
    InfrastructureRequirementRecord[]
  > {
    const client = getSupabaseServerClient();
    if (!client) {
      throw new DataSourceUnavailableError();
    }

    const { data, error } = await client
      .from("infra_requirements")
      .select("*");

    if (error) {
      throw new DataSourceUnavailableError(
        "Infrastructure requirements could not be loaded.",
      );
    }

    return (data ?? []).map((row) =>
      InfrastructureRequirementSchema.parse(row),
    );
  }
}

export function getPortfolioRepository(): PortfolioRepository {
  return new SupabasePortfolioRepository();
}
