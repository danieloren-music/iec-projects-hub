const defaultBaseUrl = "https://iec-projects-hub.vercel.app";

export function getSamlSettings() {
  const baseUrl = (
    process.env.ENTRA_SAML_BASE_URL?.trim() || defaultBaseUrl
  ).replace(/\/+$/u, "");
  const entryPoint = process.env.ENTRA_SAML_ENTRY_POINT?.trim();
  const idpIssuer = process.env.ENTRA_SAML_IDP_ISSUER?.trim();
  const idpCert = process.env.ENTRA_SAML_IDP_CERT?.trim();
  const baseUrlIsValid =
    /^https:\/\/[^/]+$/u.test(baseUrl) ||
    (process.env.NODE_ENV !== "production" &&
      /^http:\/\/localhost(?::\d+)?$/u.test(baseUrl));
  const entryPointIsValid = /^https:\/\/[^/]+/u.test(entryPoint ?? "");
  const issuerIsValid = /^https:\/\/[^/]+/u.test(idpIssuer ?? "");

  return {
    baseUrl,
    entityId: `${baseUrl}/api/auth/saml/metadata`,
    callbackUrl: `${baseUrl}/api/auth/saml/acs`,
    entryPoint,
    idpIssuer,
    idpCert,
    isConfigured: Boolean(
      baseUrlIsValid &&
        entryPointIsValid &&
        issuerIsValid &&
        idpCert &&
        idpCert.length <= 32_768 &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}
