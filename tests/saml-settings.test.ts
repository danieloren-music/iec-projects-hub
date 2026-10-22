import { afterEach, describe, expect, it, vi } from "vitest";
import { getSamlSettings } from "../src/lib/auth/saml-settings";

describe("Entra SAML settings", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the app's exact SP entity and assertion consumer URLs", () => {
    vi.stubEnv("ENTRA_SAML_BASE_URL", "https://iec-projects-hub.vercel.app/");
    vi.stubEnv(
      "ENTRA_SAML_ENTRY_POINT",
      "https://login.microsoftonline.com/example/saml2",
    );
    vi.stubEnv("ENTRA_SAML_IDP_ISSUER", "https://sts.windows.net/example/");
    vi.stubEnv("ENTRA_SAML_IDP_CERT", "certificate");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://example.supabase.co",
    );
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");

    expect(getSamlSettings()).toMatchObject({
      baseUrl: "https://iec-projects-hub.vercel.app",
      entityId: "https://iec-projects-hub.vercel.app/api/auth/saml/metadata",
      callbackUrl: "https://iec-projects-hub.vercel.app/api/auth/saml/acs",
      isConfigured: true,
    });
  });

  it("requires HTTPS identity-provider endpoints and the Supabase state store", () => {
    vi.stubEnv("ENTRA_SAML_ENTRY_POINT", "http://example.com/saml");
    vi.stubEnv("ENTRA_SAML_IDP_ISSUER", "https://sts.windows.net/example/");
    vi.stubEnv("ENTRA_SAML_IDP_CERT", "certificate");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");

    expect(getSamlSettings().isConfigured).toBe(false);
  });
});
