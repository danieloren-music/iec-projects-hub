import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHash } from "node:crypto";
import { getSamlSettings } from "@/lib/auth/saml-settings";
import {
  getLocalAdminConfigurationError,
  isLocalAdminConfigured,
  verifyLocalAdminCredentials,
} from "@/lib/auth/local-admin";

const isProduction = process.env.NODE_ENV === "production";
const authSecret =
  process.env.AUTH_SECRET ||
  (!isProduction
    ? "iec-projects-hub-development-only-auth-secret-do-not-deploy"
    : undefined);
const authSecretConfigured = Boolean(authSecret);
export const isEntraSamlConfigured = getSamlSettings().isConfigured;
const hasLocalAdminCredentials =
  Boolean(process.env.LOCAL_ADMIN_USERNAME) ||
  Boolean(process.env.LOCAL_ADMIN_PASSWORD_HASH);
export const isLocalAdminEnabled =
  authSecretConfigured &&
  (isLocalAdminConfigured() || (!isProduction && !hasLocalAdminCredentials));

const localAdminConfigurationError = getLocalAdminConfigurationError();
if (localAdminConfigurationError) {
  console.error(
    `[auth] Local administrator sign-in is disabled: ${localAdminConfigurationError}`,
  );
}

if (
  isProduction &&
  !authSecretConfigured &&
  (isEntraSamlConfigured || isLocalAdminConfigured())
) {
  console.error("[auth] Sign-in is disabled until AUTH_SECRET is configured.");
}

export const isAuthenticationConfigured =
  authSecretConfigured &&
  (isEntraSamlConfigured || isLocalAdminEnabled);

const providers = [
  ...(isEntraSamlConfigured
    ? [
        Credentials({
          id: "entra-saml",
          name: "Microsoft Entra SAML",
          credentials: {
            handoff: { label: "SAML handoff", type: "text" },
          },
          async authorize(credentials) {
            if (
              typeof credentials.handoff !== "string" ||
              credentials.handoff.length < 40 ||
              credentials.handoff.length > 128
            ) {
              return null;
            }

            const key = `handoff:${createHash("sha256")
              .update(credentials.handoff)
              .digest("hex")}`;
            const { SupabaseSamlCache } = await import("@/lib/auth/saml-cache");
            const payload = await new SupabaseSamlCache().consume(key);
            if (!payload) return null;

            let identity: unknown;
            try {
              identity = JSON.parse(payload);
            } catch (error) {
              if (error instanceof SyntaxError) return null;
              throw error;
            }
            if (
              typeof identity !== "object" ||
              identity === null ||
              !("id" in identity) ||
              typeof identity.id !== "string" ||
              !identity.id.startsWith("entra-saml:") ||
              !("name" in identity) ||
              typeof identity.name !== "string" ||
              !("email" in identity) ||
              (identity.email !== null && typeof identity.email !== "string")
            ) {
              return null;
            }

            return {
              id: identity.id,
              name: identity.name,
              email: identity.email ?? undefined,
            };
          },
        }),
      ]
    : []),
  ...(isLocalAdminEnabled
    ? [
        Credentials({
          id: "local-admin",
          name: "Local administrator",
          credentials: {
            username: { label: "Administrator", type: "text" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            if (!isLocalAdminEnabled) return null;
            if (
              typeof credentials.username !== "string" ||
              typeof credentials.password !== "string" ||
              !(await verifyLocalAdminCredentials(
                credentials.username,
                credentials.password,
              ))
            ) {
              return null;
            }

            const username =
              process.env.LOCAL_ADMIN_USERNAME?.trim() ||
              (!isProduction ? "admin" : undefined);
            if (!username) return null;
            return {
              id: `local-admin:${username}`,
              name: username,
            };
          },
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  providers,
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
