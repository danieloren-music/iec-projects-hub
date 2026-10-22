import {
  isAuthenticationConfigured,
  isEntraSamlConfigured,
  isLocalAdminEnabled,
} from "@/auth";
import { connection } from "next/server";
import { Suspense } from "react";
import { SignInExperience } from "@/components/sign-in-experience";
import {
  signInWithEntra,
  signInWithLocalAdmin,
} from "@/app/sign-in/actions";

async function SignInPageContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  await connection();
  const { error } = await searchParams;

  return (
    <SignInExperience
      localAdminReady={isAuthenticationConfigured && isLocalAdminEnabled}
      entraReady={isAuthenticationConfigured && isEntraSamlConfigured}
      samlError={error === "entra-saml"}
      signInAction={signInWithLocalAdmin}
      entraSignInAction={signInWithEntra}
    />
  );
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={<main className="sign-in-page" aria-busy="true" />}
    >
      <SignInPageContent searchParams={searchParams} />
    </Suspense>
  );
}
