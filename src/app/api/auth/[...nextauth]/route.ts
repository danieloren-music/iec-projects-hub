import { handlers, isAuthenticationConfigured } from "@/auth";
import { apiUnavailable } from "@/lib/api/errors";

function unconfigured() {
  return apiUnavailable("Authentication is not configured.");
}

export const GET: typeof handlers.GET = async (...args) =>
  isAuthenticationConfigured ? handlers.GET(...args) : unconfigured();

export const POST: typeof handlers.POST = async (...args) =>
  isAuthenticationConfigured ? handlers.POST(...args) : unconfigured();
