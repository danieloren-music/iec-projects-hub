import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { SupabaseSamlCache } from "@/lib/auth/saml-cache";
import { createEntraSamlClient, getSamlSettings } from "@/lib/auth/saml";

const MAX_SAML_RESPONSE_LENGTH = 1024 * 1024;
const HANDOFF_COOKIE = "iec-saml-handoff";

function signInError(baseUrl: string) {
  return NextResponse.redirect(
    new URL("/sign-in?error=entra-saml", baseUrl),
    303,
  );
}

export async function POST(request: Request) {
  const settings = getSamlSettings();
  if (!settings.isConfigured) {
    return Response.json(
      { error: "Microsoft Entra SAML is not configured." },
      { status: 503 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("application/x-www-form-urlencoded")) {
    return Response.json({ error: "Invalid SAML response." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    if (error instanceof TypeError) {
      return Response.json({ error: "Invalid SAML response." }, { status: 400 });
    }
    throw error;
  }
  const samlResponse = form.get("SAMLResponse");
  const relayState = form.get("RelayState");
  if (
    typeof samlResponse !== "string" ||
    samlResponse.length === 0 ||
    samlResponse.length > MAX_SAML_RESPONSE_LENGTH ||
    typeof relayState !== "string" ||
    !/^[A-Za-z0-9_-]{40,80}$/u.test(relayState)
  ) {
    return signInError(settings.baseUrl);
  }

  const cache = new SupabaseSamlCache();
  let profile;
  try {
    const result = await createEntraSamlClient(cache).validatePostResponseAsync({
      SAMLResponse: samlResponse,
      RelayState: relayState,
    });
    if (result.loggedOut || !result.profile) return signInError(settings.baseUrl);
    profile = result.profile;
  } catch (error) {
    console.error(
      "[auth:saml] Entra assertion validation failed.",
      error instanceof Error ? error.message : "Unknown SAML validation error",
    );
    return signInError(settings.baseUrl);
  }

  if ((await cache.consume(`relay:${relayState}`)) !== "sign-in") {
    console.warn("[auth:saml] Rejected an invalid or already-used RelayState.");
    return signInError(settings.baseUrl);
  }

  const identityNameId = profile.nameID.trim();
  if (!identityNameId || identityNameId.length > 512) {
    console.warn("[auth:saml] The assertion did not contain a valid NameID.");
    return signInError(settings.baseUrl);
  }

  const profileEmail =
    profile.email ??
    profile.mail ??
    profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ??
    profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn"];
  const email =
    typeof profileEmail === "string" &&
    profileEmail.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(profileEmail)
      ? profileEmail
      : null;
  const profileDisplayName =
    profile.displayName ??
    profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
  const name =
    typeof profileDisplayName === "string" &&
    profileDisplayName.trim().length > 0 &&
    profileDisplayName.length <= 200
      ? profileDisplayName.trim()
      : (email ?? identityNameId);
  const subjectId = createHash("sha256")
    .update(`${profile.issuer}\u0000${identityNameId}`)
    .digest("hex");
  const handoffToken = randomBytes(32).toString("base64url");
  const handoffKey = `handoff:${createHash("sha256")
    .update(handoffToken)
    .digest("hex")}`;

  await cache.saveAsync(
    handoffKey,
    JSON.stringify({
      id: `entra-saml:${subjectId}`,
      name,
      email,
    }),
  );

  const response = NextResponse.redirect(
    new URL("/api/auth/saml/complete", settings.baseUrl),
    303,
  );
  response.cookies.set(HANDOFF_COOKIE, handoffToken, {
    httpOnly: true,
    secure: settings.baseUrl.startsWith("https://"),
    sameSite: "lax",
    path: "/api/auth/saml/complete",
    maxAge: 60,
  });
  return response;
}
