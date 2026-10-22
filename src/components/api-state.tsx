"use client";

import Link from "next/link";
import { useAppUi } from "@/components/app-shell";

export function ApiLoading({ label }: { label: string }) {
  const { isRtl } = useAppUi();
  return (
    <div className="surface-card" role="status" aria-live="polite">
      {isRtl ? "טוען נתונים חיים…" : `Loading ${label} from the application API…`}
    </div>
  );
}

export function ApiErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const { isRtl } = useAppUi();

  return (
    <section className="surface-card" role="alert">
      <h2>{isRtl ? "הנתונים אינם זמינים" : "Live data is unavailable"}</h2>
      <p>{error.message}</p>
      <p>
        {isRtl
          ? "בדקו את ההתחברות ואת הגדרות השירות, ואז נסו שוב."
          : "Check sign-in and service configuration, then try again."}
      </p>
      <div className="hero__actions">
        <button className="button" onClick={onRetry} type="button">
          {isRtl ? "ניסיון חוזר" : "Retry"}
        </button>
        <Link className="button--quiet" href="/sign-in">
          {isRtl ? "התחברות" : "Sign in"}
        </Link>
      </div>
    </section>
  );
}
