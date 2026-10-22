import { z } from "zod";

export const PROJECT_ATTACHMENTS_BUCKET = "project-documents";
export const MAX_PROJECT_ATTACHMENT_SIZE = 6 * 1024 * 1024;
export const PROJECT_ATTACHMENT_ACCEPT =
  ".csv,.doc,.docx,.jpg,.jpeg,.json,.md,.pdf,.png,.ppt,.pptx,.txt,.xls,.xlsx,.yaml,.yml,.zip";

const AttachmentTypes = {
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  json: "application/json",
  md: "text/markdown",
  pdf: "application/pdf",
  png: "image/png",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  yaml: "application/yaml",
  yml: "application/yaml",
  zip: "application/zip",
} as const;

export const ProjectAttachmentUploadSchema = z
  .object({
    filename: z.string().trim().min(1).max(255),
    contentType: z.string().trim().max(128).default(""),
    sizeBytes: z.number().int().positive().max(MAX_PROJECT_ATTACHMENT_SIZE),
  })
  .strict();

export const ProjectAttachmentSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().min(1),
  storage_path: z.string().min(1),
  filename: z.string().min(1),
  content_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
  uploaded_by: z.string().min(1),
  uploaded_by_email: z.string().nullable(),
  created_at: z.string(),
});

export const ProjectAttachmentListSchema = z.array(ProjectAttachmentSchema);
export const ProjectAttachmentUploadUrlSchema = z.object({
  upload: z.object({
    path: z.string().min(1),
    token: z.string().min(1),
    contentType: z.string().min(1),
  }),
});

export type ProjectAttachment = z.infer<typeof ProjectAttachmentSchema>;
export type ProjectAttachmentUpload = z.infer<
  typeof ProjectAttachmentUploadSchema
>;

export function normalizeAttachmentUpload(
  input: ProjectAttachmentUpload,
): ProjectAttachmentUpload & { contentType: string; safeFilename: string } {
  const basename = input.filename.split(/[\\/]/u).at(-1) ?? "";
  const safeFilename = basename
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}._ -]/gu, "_")
    .replace(/\s+/gu, " ")
    .replace(/^[._ -]+|[._ -]+$/gu, "");
  const extension = safeFilename.split(".").at(-1)?.toLowerCase();

  if (!extension || !(extension in AttachmentTypes)) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["filename"],
        message: "This file type is not supported.",
      },
    ]);
  }

  const expectedType = AttachmentTypes[extension as keyof typeof AttachmentTypes];
  const suppliedType = input.contentType.split(";")[0].trim().toLowerCase();
  if (suppliedType && suppliedType !== expectedType) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["contentType"],
        message: "The file type does not match its extension.",
      },
    ]);
  }

  const extensionWithDot = `.${extension}`;
  const shortenedFilename =
    safeFilename.length <= 180
      ? safeFilename
      : `${safeFilename.slice(0, 180 - extensionWithDot.length)}${extensionWithDot}`;

  return {
    ...input,
    filename: basename,
    safeFilename: shortenedFilename,
    contentType: expectedType,
  };
}

export function isProjectAttachmentPath(
  projectId: string,
  path: string,
): boolean {
  const [pathProjectId, uploadId, filename, ...extra] = path.split("/");
  if (
    pathProjectId === projectId &&
    z.string().uuid().safeParse(uploadId).success &&
    typeof filename === "string" &&
    filename.length > 0 &&
    extra.length === 0
  ) {
    const parsed = ProjectAttachmentUploadSchema.safeParse({
      filename,
      contentType: "",
      sizeBytes: 1,
    });
    if (!parsed.success) return false;

    try {
      return normalizeAttachmentUpload(parsed.data).safeFilename === filename;
    } catch (error) {
      if (error instanceof z.ZodError) return false;
      throw error;
    }
  }

  return false;
}
