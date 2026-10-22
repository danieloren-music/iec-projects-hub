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
      return "יש למלא שם פרויקט, אחראי יישום ואחראי פרויקט תשתיות.";
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
  const [businessPm, setBusinessPm] = useState("");
  const [infraLead, setInfraLead] = useState("");
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
        business_pm: businessPm,
        infra_lead: infraLead,
      });
      setName("");
      setBusinessPm("");
      setInfraLead("");
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
              placeholder={isRtl ? "לדוגמה: שדרוג תשתיות" : "e.g. Infrastructure upgrade"}
              disabled={saving}
            />
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
              placeholder={isRtl ? "שם אחראי היישום" : "Implementation owner's name"}
              disabled={saving}
            />
            <label htmlFor="project-infra-lead">
              {isRtl ? "אחראי פרויקט תשתיות" : "Infrastructure project owner"}
            </label>
            <input
              id="project-infra-lead"
              name="infra_lead"
              autoComplete="name"
              maxLength={160}
              required
              value={infraLead}
              onChange={(event) => setInfraLead(event.target.value)}
              placeholder={isRtl ? "שם אחראי פרויקט התשתיות" : "Infrastructure project owner's name"}
              disabled={saving}
            />
            <p className="project-create-form__hint">
              {isRtl
                ? "המזהה ייווצר אוטומטית על ידי מסד הנתונים."
                : "The database will generate the project identifier."}
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
                    ? "יצירת פרויקט"
                    : "Create project"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}
