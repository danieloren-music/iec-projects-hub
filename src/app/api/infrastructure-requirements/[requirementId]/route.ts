import { withAuthenticatedApi } from "@/lib/api/authentication";
import { schemaUnconfirmedResponse } from "@/lib/api/errors";

export async function PATCH(request: Request) {
  return withAuthenticatedApi(request, async () => schemaUnconfirmedResponse());
}
