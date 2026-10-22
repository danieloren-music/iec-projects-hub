"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import {
  isAuthenticationConfigured,
  isEntraIdConfigured,
  isLocalAdminEnabled,
} from "@/auth";
import type { LocalAdminSignInState } from "@/lib/auth/login-state";

export async function signInWithLocalAdmin(
  _previousState: LocalAdminSignInState,
  formData: FormData,
): Promise<LocalAdminSignInState> {
  if (!isAuthenticationConfigured || !isLocalAdminEnabled) {
    return { error: "unavailable" };
  }

  const username = formData.get("username");
  const password = formData.get("password");
  if (
    typeof username !== "string" ||
    username.trim().length === 0 ||
    username.length > 128 ||
    typeof password !== "string" ||
    password.length === 0 ||
    password.length > 1024
  ) {
    return { error: "invalid" };
  }

  try {
    await signIn("local-admin", {
      username,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return { error: "invalid" };
    }
    throw error;
  }

  return { error: null };
}

export async function signInWithEntra() {
  if (!isAuthenticationConfigured || !isEntraIdConfigured) {
    throw new Error("Microsoft Entra sign-in is not configured.");
  }

  await signIn("microsoft-entra-id", { redirectTo: "/" });
}
