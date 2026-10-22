import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const entraClientId = process.env.ENTRA_CLIENT_ID;
const entraClientSecret = process.env.ENTRA_CLIENT_SECRET;
const entraTenantId = process.env.ENTRA_TENANT_ID;
const entraIssuer = entraTenantId
  ? `https://login.microsoftonline.com/${entraTenantId}/v2.0`
  : undefined;

export const isEntraIdConfigured = Boolean(
  entraClientId && entraClientSecret && entraIssuer,
);

const providers = isEntraIdConfigured
  ? [
      MicrosoftEntraID({
        clientId: entraClientId,
        clientSecret: entraClientSecret,
        issuer: entraIssuer,
      }),
    ]
  : [];

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
