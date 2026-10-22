import { isEntraIdConfigured, signIn } from "@/auth";
import { connection } from "next/server";
import { SignInExperience } from "@/components/sign-in-experience";

async function signInWithEntra() {
  "use server";

  await signIn("microsoft-entra-id", { redirectTo: "/" });
}

export default async function SignInPage() {
  await connection();
  const ready =
    isEntraIdConfigured &&
    Boolean(process.env.AUTH_SECRET);

  return <SignInExperience ready={ready} signInAction={signInWithEntra} />;
}
