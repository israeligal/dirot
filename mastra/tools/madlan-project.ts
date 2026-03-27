import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { fetchProjectById } from "../../app/lib/madlan-client";

export const queryProject = createTool({
  id: "query-project",
  description:
    "Get details about a specific new construction project. Returns pricing, unit types, developer, building stage, and urban renewal status.",
  inputSchema: z.object({
    projectId: z
      .string()
      .describe(
        "Project ID (e.g., מגרש_13_בפארק_הים_בת_ים or NISENBOIM_33_BAT_YAM)",
      ),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    projects: z.array(z.record(z.string(), z.unknown())),
    sources: z.array(
      z.object({
        dataset: z.string(),
        resourceId: z.string(),
        fetchedAt: z.string(),
        url: z.string(),
      }),
    ),
  }),
  execute: async (input) => {
    const projects = await fetchProjectById({
      ids: [{ type: "project", id: input.projectId }],
    });

    const mapped = projects.map((p) => ({
      id: p.id,
      name: p.projectName,
      priceRange: p.priceRange,
      bedsRange: p.bedsRange,
      unitTypes: p.apartmentTypes,
      developers: p.developers.map((d) => d.name),
      buildingStage: p.buildingStage,
      urbanRenewal: p.urbanRenewal,
      totalUnits: p.units,
      floorRange: p.floorRange,
      city: p.city,
      neighborhood: p.neighbourhood,
    }));

    const project = mapped[0];
    const priceStr = project?.priceRange?.min
      ? `from ${(project.priceRange.min / 1_000_000).toFixed(1)}M NIS`
      : "";
    const summary = project
      ? `${project.name}: ${project.developers.join(", ")}${priceStr ? `, ${priceStr}` : ""}${project.buildingStage ? `, stage: ${project.buildingStage}` : ""}.`
      : `Project ${input.projectId} not found.`;

    const sources = [
      {
        dataset: "market-data",
        resourceId: "api",
        fetchedAt: new Date().toISOString(),
        url: "",
      },
    ];

    return { summary, total: projects.length, projects: mapped, sources };
  },
});
