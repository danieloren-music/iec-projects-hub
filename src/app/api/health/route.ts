import { isEntraIdConfigured } from "@/auth";
import { withApiLogging } from "@/lib/api/errors";

export async function GET(request: Request) {
  return withApiLogging(request, async () => {
    const services = {
      authentication:
        isEntraIdConfigured && Boolean(process.env.AUTH_SECRET)
          ? "configured"
          : "unconfigured",
      database:
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? "configured"
          : "unconfigured",
      lin:
        process.env.LIN_EXTERNAL_AI_ENABLED === "true" &&
        Boolean(process.env.GEMINI_API_KEY)
          ? "configured"
          : "unavailable",
    } as const;

    const essentialsConfigured =
      services.authentication === "configured" &&
      services.database === "configured";
    const anyEssentialConfigured =
      services.authentication === "configured" ||
      services.database === "configured";
    const status = essentialsConfigured
      ? "healthy"
      : anyEssentialConfigured
        ? "degraded"
        : "unhealthy";

    return Response.json(
      { status, services },
      { status: status === "unhealthy" ? 503 : 200 },
    );
  });
}
