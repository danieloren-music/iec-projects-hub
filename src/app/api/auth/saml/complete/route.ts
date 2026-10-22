import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { getSamlSettings } from "@/lib/auth/saml";

const HANDOFF_COOKIE = "iec-saml-handoff";

export async function GET() {
  const settings = getSamlSettings();
  const cookieStore = await cookies();
  const handoff = cookieStore.get(HANDOFF_COOKIE)?.value;
  cookieStore.delete(HANDOFF_COOKIE);

  if (!settings.isConfigured || !handoff) {
    return NextResponse.redirect(
      new URL("/sign-in?error=entra-saml", settings.baseUrl),
    );
  }

  await signIn("entra-saml", { handoff, redirectTo: "/" });
}
