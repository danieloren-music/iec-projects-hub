import {
  withAuthenticatedApi,
} from "@/lib/api/authentication";
import { getPortfolioRepository } from "@/lib/data/portfolio-repository";
import { summarizePortfolio } from "@/lib/data/project-model";

export async function GET(request: Request) {
  return withAuthenticatedApi(request, async () => {
    const projects = await getPortfolioRepository().listProjects();
    return Response.json({ summary: summarizePortfolio(projects) });
  });
}
