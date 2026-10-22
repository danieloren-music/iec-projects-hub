"use client";

import { useActionState, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  FolderKanban,
  Globe2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useLanguagePreference } from "@/components/language-preference";
import type { LocalAdminSignInState } from "@/lib/auth/login-state";

export function SignInExperience({
  localAdminReady,
  entraReady,
  signInAction,
  entraSignInAction,
}: {
  localAdminReady: boolean;
  entraReady: boolean;
  signInAction: (
    state: LocalAdminSignInState,
    formData: FormData,
  ) => Promise<LocalAdminSignInState>;
  entraSignInAction: () => Promise<void>;
}) {
  const { isRtl, setLanguage } = useLanguagePreference();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(signInAction, {
    error: null,
  });
  const BackArrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <main className="sign-in-page" dir={isRtl ? "rtl" : "ltr"}>
      <section className="sign-in-layout" aria-label="IEC Projects Hub sign in">
        <div className="sign-in-intro">
          <button
            className="sign-in-language"
            type="button"
            onClick={() => setLanguage(isRtl ? "en" : "he")}
            aria-label={isRtl ? "Switch language to English" : "החלפת שפה לעברית"}
          >
            <Globe2 size={17} />
            <span>{isRtl ? "English" : "עברית"}</span>
          </button>
          <div className="sign-in-intro__content">
            <span className="sign-in-brand-mark" aria-hidden="true">
              <FolderKanban size={27} strokeWidth={1.8} />
            </span>
            <p className="sign-in-card__eyebrow">IEC Projects Hub</p>
            <h1>{isRtl ? "כל הפרויקטים. תמונה אחת ברורה." : "Every project. One clear view."}</h1>
            <p className="sign-in-intro__description">
              {isRtl
                ? "סביבת עבודה מרכזית לניהול תיק הפרויקטים, המשימות ודרישות התשתית של הארגון."
                : "A shared workspace for your organization's project portfolio, delivery tasks, and infrastructure requests."}
            </p>
            <ul className="sign-in-benefits">
              <li>
                <ShieldCheck size={19} />
                <span>
                  {isRtl
                    ? "גישה מאובטחת באמצעות חשבון מנהל מקומי או Entra"
                    : "Secure access with a local admin account or Entra"}
                </span>
              </li>
              <li>
                <FolderKanban size={19} />
                <span>
                  {isRtl
                    ? "תיק פרויקטים, משימות ודרישות במקום אחד"
                    : "Projects, tasks, and infrastructure in one place"}
                </span>
              </li>
            </ul>
          </div>
          <p className="sign-in-intro__footer">
            {isRtl ? "סביבת ניהול הפרויקטים של IEC" : "IEC project management workspace"}
          </p>
        </div>

        <div className="sign-in-panel">
          <div className="sign-in-panel__heading">
            <span className="sign-in-panel__icon" aria-hidden="true">
              <LockKeyhole size={21} />
            </span>
            <p className="sign-in-card__eyebrow">
              {isRtl ? "כניסה מאובטחת" : "Secure sign in"}
            </p>
            <h2>{isRtl ? "ברוכים הבאים" : "Welcome back"}</h2>
            <p className="sign-in-card__description">
              {isRtl
                ? "התחברו עם פרטי מנהל מקומיים. אין צורך בחיבור ל־Entra."
                : "Use your local administrator credentials. Entra is not required."}
            </p>
          </div>

          {localAdminReady ? (
            <form action={formAction} className="sign-in-card__form">
              <label htmlFor="admin-username">
                {isRtl ? "שם משתמש" : "Username"}
              </label>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={128}
                required
                disabled={pending}
                placeholder={isRtl ? "admin או root" : "admin or root"}
              />
              <label htmlFor="admin-password">
                {isRtl ? "סיסמה" : "Password"}
              </label>
              <div className="sign-in-password-field">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={1024}
                  required
                  disabled={pending}
                />
                <button
                  className="sign-in-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword
                      ? isRtl
                        ? "הסתרת סיסמה"
                        : "Hide password"
                      : isRtl
                        ? "הצגת סיסמה"
                        : "Show password"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {state.error && (
                <p className="sign-in-card__error" role="alert">
                  {state.error === "unavailable"
                    ? isRtl
                      ? "התחברות מקומית אינה זמינה כרגע. פנו למנהל המערכת."
                      : "Local sign-in is unavailable. Contact your administrator."
                    : isRtl
                      ? "שם המשתמש או הסיסמה אינם נכונים."
                      : "The username or password is incorrect."}
                </p>
              )}
              <button
                className="sign-in-card__submit"
                type="submit"
                disabled={pending}
              >
                <span>
                  {pending
                    ? isRtl
                      ? "מתחבר..."
                      : "Signing in..."
                    : isRtl
                      ? "כניסה למערכת"
                      : "Sign in to workspace"}
                </span>
                {!pending && <BackArrow size={18} aria-hidden="true" />}
              </button>
            </form>
          ) : (
            <div className="sign-in-card__notice" role="status">
              <p className="sign-in-card__notice-title">
                {isRtl
                  ? "התחברות מנהל מקומית לא הוגדרה"
                  : "Local administrator sign-in is not configured"}
              </p>
              <p>
                {isRtl
                  ? "מנהל המערכת יכול להגדיר שם משתמש וגיבוב סיסמה מאובטח במשתני הסביבה."
                  : "An administrator can configure a username and secure password hash in the server environment."}
              </p>
            </div>
          )}

          {entraReady && (
            <>
              <div className="sign-in-divider">
                <span>{isRtl ? "או" : "or"}</span>
              </div>
              <form action={entraSignInAction}>
                <button
                  className="sign-in-card__entra"
                  type="submit"
                  disabled={pending}
                >
                  <Building2 className="entra-mark" size={19} aria-hidden="true" />
                  {isRtl
                    ? "התחברות ארגונית עם Microsoft Entra"
                    : "Continue with Microsoft Entra"}
                </button>
              </form>
            </>
          )}

          {!localAdminReady && !entraReady && (
            <p className="sign-in-card__error" role="alert">
              {isRtl
                ? "לא הוגדרה שיטת התחברות. יש להגדיר AUTH_SECRET ושיטת התחברות בשרת."
                : "No sign-in method is configured. Set AUTH_SECRET and a sign-in method on the server."}
            </p>
          )}

          <p className="sign-in-panel__security">
            <LockKeyhole size={14} />
            {isRtl
              ? "הסיסמה נבדקת בשרת ואינה נשמרת באפליקציה."
              : "Your password is verified on the server and is never stored by the app."}
          </p>
        </div>
      </section>
    </main>
  );
}
