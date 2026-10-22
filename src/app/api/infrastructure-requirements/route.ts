import { withAuthenticatedApi } from "@/lib/api/authentication";
import { schemaUnconfirmedResponse } from "@/lib/api/errors";
import { getPortfolioRepository } from "@/lib/data/portfolio-repository";

export async function GET(request: Request) {
  return withAuthenticatedApi(request, async () => {
    const requirements =
      await getPortfolioRepository().listInfrastructureRequirements();
    return Response.json({ requirements });
  });
}

export async function POST(request: Request) {
  return withAuthenticatedApi(request, async () => schemaUnconfirmedResponse());
}
