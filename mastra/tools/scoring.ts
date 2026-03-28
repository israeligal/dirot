import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { type SourceInfo } from "./db-queries"
import { computeGrade } from "./scoring-factors"
import { gatherScoringData, computeFactors } from "./scoring-engine"

export const scoreProject = createTool({
  id: "score-project",
  description:
    "Compute the weighted investment score for a city/area. Returns per-factor scores (0-100), weighted total, and letter grade (A-F). Factors with missing data are dropped and weights redistributed. Use this to compare investment potential across areas.",
  inputSchema: z.object({
    city: z.string().describe("City name in Hebrew (required)"),
    neighborhood: z
      .string()
      .optional()
      .describe("Neighborhood or complex name"),
    contractorName: z
      .string()
      .optional()
      .describe("Contractor name for reliability check"),
    projectStatus: z
      .string()
      .optional()
      .describe("Known project status if available"),
    yearApproved: z
      .number()
      .optional()
      .describe("Year the plan was approved (for time decay)"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    totalScore: z.number(),
    grade: z.string(),
    weightProfile: z.string(),
    factors: z.array(
      z.object({
        name: z.string(),
        weight: z.number(),
        score: z.number(),
        weightedScore: z.number(),
        detail: z.string(),
      }),
    ),
    droppedFactors: z.array(
      z.object({
        name: z.string(),
        reason: z.string(),
      }),
    ),
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
    console.log("[scoreProject] input:", JSON.stringify(input))

    const data = await gatherScoringData({
      city: input.city,
      neighborhood: input.neighborhood,
      contractorName: input.contractorName,
    })

    const { stageProfile, factors, droppedFactors } = computeFactors({
      ...data,
      projectStatus: input.projectStatus,
      yearApproved: input.yearApproved,
    })

    const totalScore = Math.round(
      factors.reduce((sum, f) => sum + f.weightedScore, 0),
    )
    const grade = computeGrade({ totalScore })
    const weightProfile = stageProfile === "default"
      ? "ברירת מחדל (שלב לא ידוע)"
      : `${stageProfile} (משקלות מותאמים לשלב)`

    const activeCount = factors.length
    const droppedCount = droppedFactors.length
    const droppedNote = droppedCount > 0 ? ` (${droppedCount} פקטורים הושמטו בשל חוסר מידע)` : ""

    const summary = `ציון השקעה ל${input.city}${input.neighborhood ? ` (${input.neighborhood})` : ""}: ${totalScore}/100 (דירוג ${grade}). ${activeCount} פקטורים פעילים${droppedNote}. פרופיל משקלות: ${weightProfile}.`

    const sources: SourceInfo[] = []
    if (data.urbanResult.status === "fulfilled" && data.urbanResult.value.source) {
      sources.push(data.urbanResult.value.source)
    }
    if (data.xplanResult.status === "fulfilled") {
      sources.push(data.xplanResult.value.source)
    }

    console.log("[scoreProject] score:", totalScore, "grade:", grade, "active:", activeCount, "dropped:", droppedCount)

    return { summary, totalScore, grade, weightProfile, factors, droppedFactors, sources }
  },
})
