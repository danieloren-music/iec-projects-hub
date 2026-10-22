import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import {
  getLocalAdminConfigurationError,
  isLocalAdminConfigured,
  verifyLocalAdminCredentials,
} from "@/lib/auth/local-admin";

const entraClientId = process.env.ENTRA_CLIENT_ID;
const entraClientSecret = process.env.ENTRA_CLIENT_SECRET;
const entraTenantId = process.env.ENTRA_TENANT_ID;
const entraIssuer = entraTenantId
  ? `https://login.microsoftonline.com/${entraTenantId}/v2.0`
  : undefined;

export const isEntraIdConfigured = Boolean(
  entraClientId && entraClientSecret && entraIssuer,
);

const authSecretConfigured = Boolean(process.env.AUTH_SECRET);
export const isLocalAdminEnabled =
  authSecretConfigured && isLocalAdminConfigured();

const localAdminConfigurationError = getLocalAdminConfigurationError();
if (localAdminConfigurationError) {
  console.error(
    `[auth] Local administrator sign-in is disabled: ${localAdminConfigurationError}`,
  );
}

if (
  !authSecretConfigured &&
  (isEntraIdConfigured || isLocalAdminConfigured())
) {
  console.error("[auth] Sign-in is disabled until AUTH_SECRET is configured.");
}

export const isAuthenticationConfigured =
  authSecretConfigured &&
  (isEntraIdConfigured || isLocalAdminEnabled);

const providers = [
  ...(isEntraIdConfigured
    ? [
        MicrosoftEntraID({
          clientId: entraClientId,
          clientSecret: entraClientSecret,
          issuer: entraIssuer,
        }),
      ]
    : []),
  ...(isLocalAdminConfigured()
    ? [
        Credentials({
          id: "local-admin",
          name: "Local administrator",
          credentials: {
            username: { label: "Administrator", type: "text" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
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

            const username = process.env.LOCAL_ADMIN_USERNAME?.trim();
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
  secret: process.env.AUTH_SECRET,
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
