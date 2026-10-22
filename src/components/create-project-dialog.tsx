"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { api } from "@/api";
import { ApiRequestError } from "@/api/client";
import { useAppUi } from "@/components/app-shell";

function getCreateErrorMessage(error: unknown, isRtl: boolean) {
  if (!(error instanceof ApiRequestError)) {
    return error instanceof Error
      ? error.message
      : isRtl
        ? "לא ניתן ליצור את הפרויקט כרגע."
        : "The project could not be created.";
  }

  if (isRtl) {
    if (error.code === "BAD_REQUEST") {
      return "יש לבדוק את שם הפרויקט, תאריך היעד ופרטי בעלי התפקידים.";
    }
    if (error.code === "UNAUTHORIZED") return "יש להתחבר מחדש כדי ליצור פרויקט.";
    if (error.code === "SERVICE_UNAVAILABLE") {
      return "לא ניתן לשמור כרגע. יש לוודא שעמודות הפרויקט קיימות ושמזהה הפרויקט נוצר אוטומטית.";
    }
    if (error.code === "NETWORK_ERROR") return "לא ניתן להתחבר למערכת כרגע.";
  }

  return error.message;
}

export function CreateProjectDialog({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const { isRtl } = useAppUi();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [overview, setOverview] = useState("");
  const [businessPm, setBusinessPm] = useState("");
  const [infraLead, setInfraLead] = useState("");
  const [targetGoLive, setTargetGoLive] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    try {
      await api.createProject({
        name,
        ...(code.trim() ? { code: code.trim() } : {}),
        ...(overview.trim() ? { overview: overview.trim() } : {}),
        business_pm: businessPm,
        infra_lead: infraLead,
        ...(targetGoLive ? { target_go_live: targetGoLive } : {}),
      });
      setName("");
      setCode("");
      setOverview("");
      setBusinessPm("");
      setInfraLead("");
      setTargetGoLive("");
      setOpen(false);
      onCreated();
    } catch (cause) {
      setError(getCreateErrorMessage(cause, isRtl));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        className="button"
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Plus size={16} />
        {isRtl ? "פרויקט חדש" : "New project"}
      </button>
      {open && (
        <dialog
          ref={dialogRef}
          className="project-create-dialog"
          aria-labelledby="project-create-title"
          dir={isRtl ? "rtl" : "ltr"}
          onCancel={(event) => {
            event.preventDefault();
            if (!saving) setOpen(false);
          }}
        >
          <div className="project-create-dialog__heading">
            <div>
              <p className="eyebrow">
                {isRtl ? "סביבת הפרויקטים" : "Project workspace"}
              </p>
              <h2 id="project-create-title">
                {isRtl ? "יצירת פרויקט" : "Create a project"}
              </h2>
              <p className="project-create-dialog__description">
                {isRtl
                  ? "הזינו את פרטי הבסיס והאחריות כדי לפתוח סביבת עבודה לפרויקט."
                  : "Add the project brief and owners to create its workspace."}
              </p>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => setOpen(false)}
              aria-label={isRtl ? "סגירה" : "Close"}
              disabled={saving}
            >
              <X size={17} />
            </button>
          </div>
          <form className="project-create-form" onSubmit={submit}>
            <section className="project-create-form__section">
              <div className="project-create-form__section-heading">
                <span>01</span>
                <div>
                  <h3>{isRtl ? "פרטי הפרויקט" : "Project details"}</h3>
                  <p>
                    {isRtl
                      ? "הגדירו זיהוי, היקף ותאריך יעד."
                      : "Define the project identity, scope, and target."}
                  </p>
                </div>
              </div>
              <div className="project-create-form__grid">
                <div className="project-create-form__field project-create-form__field--wide">
                  <label htmlFor="project-name">
                    {isRtl ? "שם הפרויקט" : "Project name"}
                  </label>
                  <input
                    id="project-name"
                    name="name"
                    autoFocus
                    autoComplete="off"
                    maxLength={160}
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={
                      isRtl ? "לדוגמה: שדרוג תשתיות" : "e.g. Infrastructure upgrade"
                    }
                    disabled={saving}
                  />
                </div>
                <div className="project-create-form__field">
                  <label htmlFor="project-code">
                    {isRtl ? "קוד פרויקט (אופציונלי)" : "Project code (optional)"}
                  </label>
                  <input
                    id="project-code"
                    name="code"
                    autoComplete="off"
                    maxLength={64}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder={isRtl ? "למשל: IEC-204" : "e.g. IEC-204"}
                    disabled={saving}
                  />
                </div>
                <div className="project-create-form__field">
                  <label htmlFor="project-target-go-live">
                    {isRtl ? "תאריך יעד להשקה" : "Target go-live"}
                  </label>
                  <input
                    id="project-target-go-live"
                    name="target_go_live"
                    type="date"
                    value={targetGoLive}
                    onChange={(event) => setTargetGoLive(event.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="project-create-form__field project-create-form__field--wide">
                  <label htmlFor="project-overview">
                    {isRtl ? "תקציר והיקף" : "Overview and scope"}
                  </label>
                  <textarea
                    id="project-overview"
                    name="overview"
                    rows={3}
                    maxLength={2000}
                    value={overview}
                    onChange={(event) => setOverview(event.target.value)}
                    placeholder={
                      isRtl
                        ? "מה הפרויקט נועד להשיג?"
                        : "What is this project intended to deliver?"
                    }
                    disabled={saving}
                  />
                  <span className="project-create-form__counter">
                    {overview.length}/2000
                  </span>
                </div>
              </div>
            </section>
            <section className="project-create-form__section">
              <div className="project-create-form__section-heading">
                <span>02</span>
                <div>
                  <h3>{isRtl ? "בעלי תפקידים" : "Project owners"}</h3>
                  <p>
                    {isRtl
                      ? "הגדירו גורם אחראי ליישום ולתשתיות."
                      : "Assign accountable implementation and infrastructure owners."}
                  </p>
                </div>
              </div>
              <div className="project-create-form__grid">
                <div className="project-create-form__field">
                  <label htmlFor="project-business-pm">
                    {isRtl ? "אחראי יישום" : "Implementation owner"}
                  </label>
                  <input
                    id="project-business-pm"
                    name="business_pm"
                    autoComplete="name"
                    maxLength={160}
                    required
                    value={businessPm}
                    onChange={(event) => setBusinessPm(event.target.value)}
                    placeholder={
                      isRtl ? "שם אחראי היישום" : "Implementation owner's name"
                    }
                    disabled={saving}
                  />
                </div>
                <div className="project-create-form__field">
                  <label htmlFor="project-infra-lead">
                    {isRtl
                      ? "אחראי פרויקט תשתיות"
                      : "Infrastructure project owner"}
                  </label>
                  <input
                    id="project-infra-lead"
                    name="infra_lead"
                    autoComplete="name"
                    maxLength={160}
                    required
                    value={infraLead}
                    onChange={(event) => setInfraLead(event.target.value)}
                    placeholder={
                      isRtl
                        ? "שם אחראי פרויקט התשתיות"
                        : "Infrastructure project's owner"
                    }
                    disabled={saving}
                  />
                </div>
              </div>
            </section>
            <p className="project-create-form__hint">
              {isRtl
                ? "המזהה ייווצר אוטומטית. סטטוסים, הרשאות ומשימות יוגדרו לאחר אישור מודל ה־PMO."
                : "The database generates the project ID. Statuses, permissions, and tasks remain subject to PMO model confirmation."}
            </p>
            {error && (
              <p className="project-create-form__error" role="alert">
                {error}
              </p>
            )}
            <div className="project-create-form__actions">
              <button
                className="button--quiet-dark"
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                {isRtl ? "ביטול" : "Cancel"}
              </button>
              <button className="button--primary" type="submit" disabled={saving}>
                {saving
                  ? isRtl
                    ? "יוצר..."
                    : "Creating..."
                  : isRtl
                    ? "יצירת סביבת פרויקט"
                    : "Create project workspace"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}
