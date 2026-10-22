"use client";

import { useCallback, useRef, useState } from "react";
import { Download, FileText, Paperclip, Upload } from "lucide-react";
import { api } from "@/api";
import { useApiResource } from "@/api/use-api-resource";
import { ApiErrorState, ApiLoading } from "@/components/api-state";
import { EmptyState, useAppUi } from "@/components/app-shell";
import { PROJECT_ATTACHMENT_ACCEPT } from "@/lib/data/project-attachment-policy";

export function ProjectAttachments({ projectId }: { projectId: string }) {
  const { isRtl } = useAppUi();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const loadAttachments = useCallback(
    () => api.getProjectAttachments(projectId),
    [projectId],
  );
  const attachments = useApiResource(loadAttachments);

  async function uploadFiles(files: File[]) {
    setUploading(true);
    setUploadError(null);
    setUploadMessage(null);
    let uploaded = 0;

    try {
      for (const file of files) {
        await api.uploadProjectAttachment(projectId, file);
        uploaded += 1;
      }
      setUploadMessage(
        isRtl
          ? `${uploaded} קבצים נוספו לפרויקט.`
          : `${uploaded} file${uploaded === 1 ? "" : "s"} added to the project.`,
      );
      attachments.retry();
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : isRtl
            ? "העלאת הקובץ נכשלה."
            : "The file upload failed.",
      );
      if (uploaded > 0) attachments.retry();
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="surface-card project-attachments">
      <div className="card-heading">
        <div>
          <h2>{isRtl ? "קבצי הפרויקט" : "Project files"}</h2>
          <span className="card-heading__hint">
            {isRtl ? "אחסון פרטי" : "Private storage"}
          </span>
        </div>
        <button
          className="button project-attachments__upload"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading
            ? isRtl
              ? "מעלה..."
              : "Uploading..."
            : isRtl
              ? "העלאת קבצים"
              : "Upload files"}
        </button>
      </div>

      <input
        ref={inputRef}
        className="project-attachments__input"
        type="file"
        accept={PROJECT_ATTACHMENT_ACCEPT}
        multiple
        disabled={uploading}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          if (files.length > 0) void uploadFiles(files);
        }}
        aria-label={isRtl ? "בחירת קבצים להעלאה" : "Choose files to upload"}
      />
      <p className="project-attachments__hint">
        {isRtl
          ? "Word, Excel, PowerPoint, PDF, PNG, JPEG וקובצי עבודה נוספים עד 6 MiB לקובץ."
          : "Word, Excel, PowerPoint, PDF, PNG, JPEG, and other project files up to 6 MiB each."}
      </p>

      {uploadError && (
        <p className="project-attachments__message project-attachments__message--error" role="alert">
          {uploadError}
        </p>
      )}
      {uploadMessage && (
        <p className="project-attachments__message" role="status">
          {uploadMessage}
        </p>
      )}

      {attachments.state.status === "loading" && (
        <ApiLoading label="project files" />
      )}
      {attachments.state.status === "error" && (
        <ApiErrorState
          error={attachments.state.error}
          onRetry={attachments.retry}
        />
      )}
      {attachments.state.status === "success" &&
        (attachments.state.data.length === 0 ? (
          <EmptyState
            icon={Paperclip}
            title="No project files"
            titleHe="אין קבצים בפרויקט"
            description="Upload a project document to make it available to signed-in project users."
            descriptionHe="אפשר להעלות מסמך כדי שיהיה זמין למשתמשים מחוברים בפרויקט."
          />
        ) : (
          <ul className="project-attachments__list">
            {attachments.state.data.map((attachment) => (
              <li className="project-attachments__item" key={attachment.id}>
                <span className="project-attachments__file-icon" aria-hidden="true">
                  <FileText size={18} />
                </span>
                <span className="project-attachments__file">
                  <strong>{attachment.filename}</strong>
                  <small>
                    {attachment.uploaded_by_email || attachment.uploaded_by}
                    {" · "}
                    {new Intl.NumberFormat(isRtl ? "he-IL" : "en-US", {
                      maximumFractionDigits: 1,
                    }).format(attachment.size_bytes / 1024)}
                    {" KiB"}
                  </small>
                </span>
                <a
                  className="control-button control-button--icon"
                  href={`/api/projects/${encodeURIComponent(projectId)}/attachments/${encodeURIComponent(attachment.id)}/download`}
                  aria-label={
                    isRtl
                      ? `הורדת ${attachment.filename}`
                      : `Download ${attachment.filename}`
                  }
                  title={isRtl ? "הורדה" : "Download"}
                >
                  <Download size={16} />
                </a>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
