import {
  withAuthenticatedApi,
} from "@/lib/api/authentication";
import {
  apiError,
} from "@/lib/api/errors";
import { ProjectCreateSchema } from "@/lib/data/project-model";
import { getPortfolioRepository } from "@/lib/data/portfolio-repository";

export async function GET(request: Request) {
  return withAuthenticatedApi(request, async () => {
    const projects = await getPortfolioRepository().listProjects();
    return Response.json({ projects });
  });
}

export async function POST(request: Request) {
  return withAuthenticatedApi(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
      return apiError(400, "BAD_REQUEST", "A valid JSON body is required.");
    }

    const input = ProjectCreateSchema.safeParse(body);
    if (!input.success) {
      return apiError(
        400,
        "BAD_REQUEST",
        "A project name and both project owners are required.",
        input.error.issues,
      );
    }

    const project = await getPortfolioRepository().createProject(input.data);
    return Response.json({ project }, { status: 201 });
  });
}
