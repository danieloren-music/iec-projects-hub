import { auth, isEntraIdConfigured } from "@/auth";
import {
  apiError,
  withApiLogging,
} from "@/lib/api/errors";

type AuthenticatedSession = {
  user: { id: string; email: string | null };
};

type AuthenticationResult =
  | { session: null; response: Response }
  | { session: AuthenticatedSession; response: null };

function hasSessionUser(value: unknown): value is {
  user: { id: string; email?: string | null };
} {
  if (
    typeof value !== "object" ||
    value === null ||
    !("user" in value) ||
    typeof value.user !== "object" ||
    value.user === null ||
    !("id" in value.user) ||
    typeof value.user.id !== "string" ||
    !value.user.id
  ) {
    return false;
  }

  return !("email" in value.user) || value.user.email == null ||
    typeof value.user.email === "string";
}

export async function requireAuthenticatedUser(): Promise<AuthenticationResult> {
  if (!isEntraIdConfigured || !process.env.AUTH_SESSION_SECRET) {
    return {
      session: null,
      response: apiError(
        503,
        "SERVICE_UNAVAILABLE",
        "OIDC sign-in is not configured.",
      ),
    } as const;
  }

  const session: unknown = await auth();
  if (!hasSessionUser(session)) {
    return {
      session: null,
      response: apiError(401, "UNAUTHORIZED", "Sign-in is required."),
    } as const;
  }

  return {
    session: {
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
      },
    },
    response: null,
  };
}

export function withAuthenticatedApi(
  request: Request,
  operation: (session: AuthenticatedSession) => Promise<Response>,
) {
  return withApiLogging(request, async () => {
    const authentication = await requireAuthenticatedUser();
    if (authentication.response) {
      return authentication.response;
    }

    return operation(authentication.session);
  });
}
