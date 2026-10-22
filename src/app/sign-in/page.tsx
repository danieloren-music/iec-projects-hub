import { isEntraIdConfigured, signIn } from "@/auth";
import { connection } from "next/server";

async function signInWithEntra() {
  "use server";

  await signIn("microsoft-entra-id", { redirectTo: "/" });
}

export default async function SignInPage() {
  await connection();
  const ready =
    isEntraIdConfigured &&
    Boolean(process.env.AUTH_SECRET) &&
    process.env.AUTH_TRUST_HOST === "true";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
          IEC Projects Hub
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Sign in with your organization’s Microsoft Entra ID account using OpenID Connect.
        </p>
        {ready ? (
          <form action={signInWithEntra} className="mt-8">
            <button
              className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              type="submit"
            >
              Continue with Microsoft
            </button>
          </form>
        ) : (
          <div
            className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            <p className="font-semibold">Sign-in is not configured yet.</p>
            <p className="mt-1">
              Configure AUTH_SECRET, AUTH_TRUST_HOST, and the
              AUTH_MICROSOFT_ENTRA_ID_ID, AUTH_MICROSOFT_ENTRA_ID_SECRET, and
              AUTH_MICROSOFT_ENTRA_ID_ISSUER values in the local or deployment
              secret store. No credentials or tenant details are included in
              this repository.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
