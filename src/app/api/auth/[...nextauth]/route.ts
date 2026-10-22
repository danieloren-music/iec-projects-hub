import { handlers } from "@/auth";
import { apiUnavailable } from "@/lib/api/errors";

const authReady =
  Boolean(process.env.AUTH_SECRET) &&
  process.env.AUTH_TRUST_HOST === "true" &&
  Boolean(
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
  );

function unconfigured() {
  return apiUnavailable("OIDC sign-in is not configured.");
}

export const GET: typeof handlers.GET = async (...args) =>
  authReady ? handlers.GET(...args) : unconfigured();

export const POST: typeof handlers.POST = async (...args) =>
  authReady ? handlers.POST(...args) : unconfigured();
