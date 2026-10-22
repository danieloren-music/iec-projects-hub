import { describe, expect, it } from "vitest";
import {
  ProjectSchema,
  summarizePortfolio,
} from "../src/lib/data/project-model";
import {
  isProjectAttachmentPath,
  MAX_PROJECT_ATTACHMENT_SIZE,
  normalizeAttachmentUpload,
  ProjectAttachmentUploadSchema,
} from "../src/lib/data/project-attachment-policy";

describe("portfolio model", () => {
  it("returns zero aggregates without implying any PMO records", () => {
    expect(summarizePortfolio([])).toEqual({
      projectCount: 0,
      infrastructureRequirementCount: 0,
      tasks: "unavailable-until-schema-confirmed",
    });
  });

  it("preserves only existing field conventions without constraining status labels", () => {
    const project = ProjectSchema.parse({
      id: "synthetic-test-only",
      name: "Synthetic test record",
      rag_status: "organization-defined",
      overall_status: "organization-defined",
      infra_requirements: [
        {
          id: "synthetic-requirement",
          title: "Synthetic test requirement",
          status: "organization-defined",
        },
      ],
    });

    expect(summarizePortfolio([project])).toEqual({
      projectCount: 1,
      infrastructureRequirementCount: 1,
      tasks: "unavailable-until-schema-confirmed",
    });
  });

  describe("project attachment policy", () => {
    it("normalizes supported office files and sanitizes path separators", () => {
      const input = ProjectAttachmentUploadSchema.parse({
        filename: "..\\תוכנית פרויקט.docx",
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: 1024,
      });

      expect(normalizeAttachmentUpload(input)).toMatchObject({
        safeFilename: "תוכנית פרויקט.docx",
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    });

    it("rejects unsupported, mismatched, and over-limit uploads", () => {
      const unsupported = ProjectAttachmentUploadSchema.parse({
        filename: "program.exe",
        contentType: "application/octet-stream",
        sizeBytes: 1024,
      });
      expect(() => normalizeAttachmentUpload(unsupported)).toThrow();

      const mismatched = ProjectAttachmentUploadSchema.parse({
        filename: "diagram.png",
        contentType: "application/pdf",
        sizeBytes: 1024,
      });
      expect(() => normalizeAttachmentUpload(mismatched)).toThrow();

      expect(
        ProjectAttachmentUploadSchema.safeParse({
          filename: "oversized.pdf",
          contentType: "application/pdf",
          sizeBytes: MAX_PROJECT_ATTACHMENT_SIZE + 1,
        }).success,
      ).toBe(false);
    });

    it("scopes sanitized object paths to one project and a generated upload id", () => {
      const uploadId = "a9b5774c-ff5a-4f60-84dc-5a950bf06d6b";
      expect(
        isProjectAttachmentPath("project-42", `project-42/${uploadId}/plan.pdf`),
      ).toBe(true);
      expect(
        isProjectAttachmentPath("project-42", `project-42/${uploadId}/script.exe`),
      ).toBe(false);
      expect(
        isProjectAttachmentPath("project-42", `project-42/${uploadId}/../plan.pdf`),
      ).toBe(false);
      expect(
        isProjectAttachmentPath("project-43", `project-42/${uploadId}/plan.pdf`),
      ).toBe(false);
      expect(
        isProjectAttachmentPath("project-42", `project-42/not-a-uuid/plan.pdf`),
      ).toBe(false);
    });
  });
});
