import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const entraClientId = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
const entraClientSecret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET;
const entraIssuer = process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER;

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
  providers,
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
