import "server-only";

import { BlobNotFoundError, get, head } from "@vercel/blob";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DataSourceUnavailableError } from "@/lib/data/portfolio-repository";
import {
  isProjectAttachmentPath,
  normalizeAttachmentUpload,
  MAX_PROJECT_ATTACHMENT_SIZE,
  ProjectAttachmentListSchema,
  ProjectAttachmentSchema,
  ProjectAttachmentUploadSchema,
  type ProjectAttachment,
} from "@/lib/data/project-attachment-policy";

const AttachmentPathSchema = z.string().min(1).max(512);

function getAttachmentMetadataClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function requireAttachmentMetadataClient(): SupabaseClient {
  const client = getAttachmentMetadataClient();
  if (!client) {
    throw new DataSourceUnavailableError(
      "Project file metadata is not configured.",
    );
  }
  return client;
}

export async function listProjectAttachments(
  projectId: string,
): Promise<ProjectAttachment[]> {
  const client = requireAttachmentMetadataClient();
  const { data, error } = await client
    .from("project_attachments")
    .select(
      "id, project_id, storage_path, filename, content_type, size_bytes, uploaded_by, uploaded_by_email, created_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new DataSourceUnavailableError(
      "Project files could not be loaded.",
    );
  }

  return ProjectAttachmentListSchema.parse(data ?? []);
}

export async function completeProjectAttachmentUpload(
  projectId: string,
  pathInput: unknown,
  user: { id: string; email?: string | null },
): Promise<ProjectAttachment> {
  const path = AttachmentPathSchema.parse(pathInput);
  if (!isProjectAttachmentPath(projectId, path)) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["path"],
        message: "The uploaded file path is invalid for this project.",
      },
    ]);
  }

  const filename = path.split("/").at(-1) ?? "";
  const upload = normalizeAttachmentUpload(
    ProjectAttachmentUploadSchema.parse({
      filename,
      contentType: "",
      sizeBytes: 1,
    }),
  );
  let fileInfo;
  try {
    fileInfo = await head(path);
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      throw new z.ZodError([
        {
          code: "custom",
          path: ["path"],
          message: "The uploaded file could not be found.",
        },
      ]);
    }
    throw error;
  }

  if (!fileInfo.size || fileInfo.size > MAX_PROJECT_ATTACHMENT_SIZE) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["path"],
        message: "The uploaded file exceeds the permitted size.",
      },
    ]);
  }

  if (fileInfo.contentType !== upload.contentType) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["path"],
        message: "The uploaded file type is not supported.",
      },
    ]);
  }

  const client = requireAttachmentMetadataClient();
  const { data, error } = await client
    .from("project_attachments")
    .insert({
      project_id: projectId,
      storage_path: path,
      filename,
      content_type: upload.contentType,
      size_bytes: fileInfo.size,
      uploaded_by: user.id,
      uploaded_by_email: user.email ?? null,
    })
    .select(
      "id, project_id, storage_path, filename, content_type, size_bytes, uploaded_by, uploaded_by_email, created_at",
    )
    .single();

  if (error) {
    throw new DataSourceUnavailableError(
      "The uploaded file could not be added to the project.",
    );
  }

  return ProjectAttachmentSchema.parse(data);
}

export async function getProjectAttachmentDownload(
  projectId: string,
  attachmentId: string,
): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  filename: string;
} | null> {
  const client = requireAttachmentMetadataClient();
  const { data: row, error: queryError } = await client
    .from("project_attachments")
    .select("storage_path, filename, content_type")
    .eq("project_id", projectId)
    .eq("id", attachmentId)
    .maybeSingle();

  if (queryError) {
    throw new DataSourceUnavailableError(
      "Project file details could not be loaded.",
    );
  }
  if (!row) {
    return null;
  }

  const blob = await get(row.storage_path, { access: "private" });
  if (!blob?.stream) {
    return null;
  }

  return {
    stream: blob.stream,
    contentType: row.content_type,
    filename: row.filename,
  };
}
