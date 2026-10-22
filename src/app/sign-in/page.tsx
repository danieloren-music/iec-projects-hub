import {
  isAuthenticationConfigured,
  isEntraIdConfigured,
  isLocalAdminEnabled,
} from "@/auth";
import { connection } from "next/server";
import { SignInExperience } from "@/components/sign-in-experience";
import {
  signInWithEntra,
  signInWithLocalAdmin,
} from "@/app/sign-in/actions";

export default async function SignInPage() {
  await connection();

  return (
    <SignInExperience
      localAdminReady={isAuthenticationConfigured && isLocalAdminEnabled}
      entraReady={isAuthenticationConfigured && isEntraIdConfigured}
      signInAction={signInWithLocalAdmin}
      entraSignInAction={signInWithEntra}
    />
  );
}
