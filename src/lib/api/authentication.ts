import { auth, isEntraIdConfigured } from "@/auth";
import {
  apiError,
  withApiLogging,
} from "@/lib/api/errors";

export async function requireAuthenticatedUser() {
  if (!isEntraIdConfigured || !process.env.AUTH_SECRET) {
    return {
      session: null,
      response: apiError(
        503,
        "SERVICE_UNAVAILABLE",
        "OIDC sign-in is not configured.",
      ),
    } as const;
  }

  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      response: apiError(401, "UNAUTHORIZED", "Sign-in is required."),
    } as const;
  }

  return { session, response: null } as const;
}

export function withAuthenticatedApi(
  request: Request,
  operation: () => Promise<Response>,
) {
  return withApiLogging(request, async () => {
    const authentication = await requireAuthenticatedUser();
    if (authentication.response) {
      return authentication.response;
    }

    return operation();
  });
}
