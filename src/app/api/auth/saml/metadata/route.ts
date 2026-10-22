import { NextResponse } from "next/server";
import {
  createEntraSamlClient,
  getSamlSettings,
} from "@/lib/auth/saml";

export async function GET() {
  if (!getSamlSettings().isConfigured) {
    return Response.json(
      { error: "Microsoft Entra SAML is not configured." },
      { status: 503 },
    );
  }

  const metadata = createEntraSamlClient().generateServiceProviderMetadata(
    null,
  );
  return new NextResponse(metadata, {
    headers: {
      "Content-Type": "application/samlmetadata+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
