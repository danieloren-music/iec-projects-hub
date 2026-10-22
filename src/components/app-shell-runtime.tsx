import { auth, isEntraIdConfigured } from "@/auth";
import { signOutAction } from "@/app/sign-out/actions";
import { AppShell } from "@/components/app-shell";
import { connection } from "next/server";
import type { ReactNode } from "react";

export async function AppShellRuntime({
  children,
}: {
  children: ReactNode;
}) {
  await connection();

  const authConfigured =
    isEntraIdConfigured &&
    Boolean(process.env.AUTH_SECRET) &&
    process.env.AUTH_TRUST_HOST === "true";
  const session = authConfigured ? await auth() : null;
  if (!session?.user) {
    return children;
  }

  const currentUser = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      }
    : null;
  const linEnabled =
    authConfigured &&
    process.env.LIN_EXTERNAL_AI_ENABLED === "true" &&
    Boolean(process.env.GEMINI_API_KEY);

  return (
    <AppShell
      linEnabled={linEnabled}
      currentUser={currentUser}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
