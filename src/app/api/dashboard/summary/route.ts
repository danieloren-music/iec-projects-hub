import {
  withAuthenticatedApi,
} from "@/lib/api/authentication";
import { getPortfolioRepository } from "@/lib/data/portfolio-repository";
import { summarizePortfolio } from "@/lib/data/project-model";
import { listTasks } from "@/lib/data/tasks";

export async function GET(request: Request) {
  return withAuthenticatedApi(request, async () => {
    const [projects, tasks] = await Promise.all([
      getPortfolioRepository().listProjects(),
      listTasks(),
    ]);
    return Response.json({ summary: summarizePortfolio(projects, tasks) });
  });
}
