import { auth, isEntraIdConfigured } from "@/auth";
import type { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const authReady =
  isEntraIdConfigured &&
  Boolean(process.env.AUTH_SESSION_SECRET) &&
  process.env.AUTH_TRUST_HOST === "true";

const authenticatedProxy = auth(
  (request: NextAuthRequest, event: NextFetchEvent) => {
    void event;
    const isApiRequest = request.nextUrl.pathname.startsWith("/api/");
    const isSignInPage = request.nextUrl.pathname === "/sign-in";

    if (!request.auth?.user) {
      if (isSignInPage) return NextResponse.next();
      if (isApiRequest) {
        return NextResponse.json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Sign-in is required.",
              details: null,
            },
          },
          { status: 401 },
        );
      }

      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (isSignInPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  },
);

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const isSignInPage = request.nextUrl.pathname === "/sign-in";
  if (!authReady) {
    if (isSignInPage) return NextResponse.next();
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "OIDC sign-in is not configured.",
            details: null,
          },
        },
        { status: 503 },
      );
    }

    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return authenticatedProxy(request, event);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
