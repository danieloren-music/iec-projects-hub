import { withAuthenticatedApi } from "@/lib/api/authentication";
import { schemaUnconfirmedResponse } from "@/lib/api/errors";

export async function GET(request: Request) {
  return withAuthenticatedApi(request, async () => schemaUnconfirmedResponse());
}

export async function POST(request: Request) {
  return withAuthenticatedApi(request, async () => schemaUnconfirmedResponse());
}
