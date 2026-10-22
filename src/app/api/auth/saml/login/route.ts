import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { SupabaseSamlCache } from "@/lib/auth/saml-cache";
import { createEntraSamlClient, getSamlSettings } from "@/lib/auth/saml";

export async function GET() {
  const settings = getSamlSettings();
  if (!settings.isConfigured) {
    return Response.json(
      { error: "Microsoft Entra SAML is not configured." },
      { status: 503 },
    );
  }

  const cache = new SupabaseSamlCache();
  const relayState = randomBytes(32).toString("base64url");
  await cache.saveAsync(`relay:${relayState}`, "sign-in");
  const saml = createEntraSamlClient(cache);
  const authorizeUrl = await saml.getAuthorizeUrlAsync(
    relayState,
    undefined,
    {},
  );

  return NextResponse.redirect(authorizeUrl, 303);
}
