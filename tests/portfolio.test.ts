import { describe, expect, it } from "vitest";
import {
  ProjectSchema,
  summarizePortfolio,
} from "../src/lib/data/project-model";

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
});
