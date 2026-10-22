import "server-only";

import { SAML, ValidateInResponseTo } from "@node-saml/node-saml";
import { SupabaseSamlCache } from "@/lib/auth/saml-cache";
import { getSamlSettings } from "@/lib/auth/saml-settings";

export { getSamlSettings } from "@/lib/auth/saml-settings";

function normalizeCertificate(certificate: string): string {
  const normalized = certificate.replace(/\\n/gu, "\n").trim();
  if (normalized.includes("-----BEGIN CERTIFICATE-----")) {
    return normalized;
  }
  const base64 = normalized.replace(/\s+/gu, "");
  if (!/^[A-Za-z0-9+/=]+$/u.test(base64)) {
    throw new Error("ENTRA_SAML_IDP_CERT must be a PEM or Base64 certificate.");
  }
  const lines = base64.match(/.{1,64}/gu)?.join("\n");
  if (!lines) {
    throw new Error("ENTRA_SAML_IDP_CERT is empty.");
  }
  return `-----BEGIN CERTIFICATE-----\n${lines}\n-----END CERTIFICATE-----`;
}

export function createEntraSamlClient(cacheProvider = new SupabaseSamlCache()) {
  const settings = getSamlSettings();
  if (!settings.isConfigured || !settings.entryPoint || !settings.idpIssuer || !settings.idpCert) {
    throw new Error(
      "Entra SAML is not configured. Set its IdP values and the Supabase server-side storage credentials.",
    );
  }

  return new SAML({
    entryPoint: settings.entryPoint,
    idpIssuer: settings.idpIssuer,
    idpCert: normalizeCertificate(settings.idpCert),
    issuer: settings.entityId,
    audience: settings.entityId,
    callbackUrl: settings.callbackUrl,
    identifierFormat: null,
    validateInResponseTo: ValidateInResponseTo.always,
    requestIdExpirationPeriodMs: 5 * 60 * 1000,
    acceptedClockSkewMs: 2 * 60 * 1000,
    maxAssertionAgeMs: 5 * 60 * 1000,
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,
    cacheProvider,
  });
}
