"use client";

import { Globe2 } from "lucide-react";
import { useLanguagePreference } from "@/components/language-preference";

export function SignInExperience({
  ready,
  signInAction,
}: {
  ready: boolean;
  signInAction: () => Promise<void>;
}) {
  const { isRtl, setLanguage } = useLanguagePreference();

  return (
    <main className="sign-in-page" dir={isRtl ? "rtl" : "ltr"}>
      <section className="sign-in-card">
        <div className="sign-in-card__toolbar" dir="ltr">
          <button
            className="sign-in-language"
            type="button"
            onClick={() => setLanguage(isRtl ? "en" : "he")}
            aria-label={isRtl ? "Switch language to English" : "החלפת שפה לעברית"}
          >
            <Globe2 size={16} />
            <span>{isRtl ? "English" : "עברית"}</span>
          </button>
        </div>
        <p className="sign-in-card__eyebrow">IEC Projects Hub</p>
        <h1>{isRtl ? "ברוכים הבאים" : "Welcome"}</h1>
        <p className="sign-in-card__description">
          {isRtl
            ? "התחברו באמצעות חשבון Microsoft Entra ID של הארגון כדי להמשיך לסביבת ניהול הפרויקטים."
            : "Sign in with your organization's Microsoft Entra ID account to continue to the project workspace."}
        </p>
        {ready ? (
          <form action={signInAction} className="sign-in-card__form">
            <button className="sign-in-card__submit" type="submit">
              {isRtl ? "התחברות עם Microsoft" : "Continue with Microsoft"}
            </button>
          </form>
        ) : (
          <div className="sign-in-card__notice" role="status">
            <p className="sign-in-card__notice-title">
              {isRtl ? "ההתחברות עדיין לא הוגדרה" : "Sign-in is not configured yet"}
            </p>
            <p>
              {isRtl
                ? "יש להגדיר AUTH_SECRET, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET ו־ENTRA_TENANT_ID בסביבת הפיתוח או הפריסה."
                : "Configure AUTH_SECRET, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET, and ENTRA_TENANT_ID in the local or deployment environment."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
