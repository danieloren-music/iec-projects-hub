import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const entraClientId = process.env.ENTRA_CLIENT_ID;
const entraClientSecret = process.env.ENTRA_CLIENT_SECRET;
const entraIssuer = process.env.ENTRA_ISSUER;

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
  secret: process.env.AUTH_SESSION_SECRET,
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
