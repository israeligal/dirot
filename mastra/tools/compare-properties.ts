import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { searchByAddress } from "./address";
import { scoreProject } from "./scoring";

const addressSchema = z.object({
  city: z.string().describe("City name in Hebrew"),
  street: z.string().describe("Street name in Hebrew"),
  houseNumber: z.string().optional().describe("House number"),
});

type AddressInput = z.infer<typeof addressSchema>;

interface ScoreResult {
  totalScore: number;
  grade: string;
  weightProfile: string;
  factors: Array<{ name: string; weight: number; score: number; weightedScore: number; detail: string }>;
}

interface PropertyComparison {
  address: { city: string; street: string; houseNumber?: string; label: string };
  score: {
    totalScore: number;
    grade: string;
    weightProfile: string;
  } | null;
  project: {
    found: boolean;
    status: string | null;
    existingUnits: number | null;
    additionalUnits: number | null;
    totalProposedUnits: number | null;
    planNumber: string | null;
    yearApproved: string | null;
    neighborhood: string | null;
  };
  developer: {
    found: boolean;
    name: string | null;
    confidence: string | null;
  };
  infrastructureScore: number;
  risks: string[];
  sourceCount: number;
}

function formatLabel({ city, street, houseNumber }: AddressInput): string {
  return houseNumber ? `${street} ${houseNumber}, ${city}` : `${street}, ${city}`;
}

interface SearchAddressResult {
  pinuiBinui: { found: boolean; projects: Array<Record<string, unknown>> };
  planningAuthority: { found: boolean };
  activeConstruction: { sites: Array<Record<string, unknown>> };
  detectedDeveloper: { found: boolean; developers: Array<{ name: string; confidence: string }> };
  sources: Array<unknown>;
}

function detectRisks({
  searchResult,
}: {
  searchResult: SearchAddressResult;
}): string[] {
  const risks: string[] = [];

  if (!searchResult.pinuiBinui.found) {
    risks.push("לא נמצא פרויקט פינוי בינוי");
  }

  const pbProject = searchResult.pinuiBinui.projects[0];

  if (pbProject?.yearApproved) {
    const yearsAgo = new Date().getFullYear() - Number(pbProject.yearApproved);
    if (yearsAgo >= 5 && !pbProject.underConstruction) {
      risks.push(`פרויקט הוכרז לפני ${yearsAgo} שנים ללא התקדמות`);
    }
  }

  if (pbProject && Number(pbProject.additionalUnits ?? 0) === 0) {
    risks.push("אפס יחידות נוספות");
  }

  const sites = searchResult.activeConstruction.sites;
  const totalSanctions = sites.reduce(
    (sum, s) => sum + (Number(s.sanctions) || 0),
    0,
  );
  if (totalSanctions >= 5) {
    risks.push(`${totalSanctions} עיצומים על קבלנים`);
  }

  if (!searchResult.planningAuthority.found) {
    risks.push("לא נמצאה תוכנית ברשות התכנון");
  }

  return risks;
}

export const compareProperties = createTool({
  id: "compare-properties",
  description:
    "Compare 2-4 addresses side by side. Runs searchByAddress + scoreProject for each address in parallel and returns a normalized comparison with scores, project stages, units, developer info, infrastructure, and risk flags. Renders as a visual comparison card in the chat. After the card renders, provide your comparative analysis.",
  inputSchema: z.object({
    addresses: z
      .array(addressSchema)
      .min(2)
      .max(4)
      .describe("2-4 addresses to compare"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    properties: z.array(
      z.object({
        address: z.object({
          city: z.string(),
          street: z.string(),
          houseNumber: z.string().optional(),
          label: z.string(),
        }),
        score: z
          .object({
            totalScore: z.number(),
            grade: z.string(),
            weightProfile: z.string(),
          })
          .nullable(),
        project: z.object({
          found: z.boolean(),
          status: z.string().nullable(),
          existingUnits: z.number().nullable(),
          additionalUnits: z.number().nullable(),
          totalProposedUnits: z.number().nullable(),
          planNumber: z.string().nullable(),
          yearApproved: z.string().nullable(),
          neighborhood: z.string().nullable(),
        }),
        developer: z.object({
          found: z.boolean(),
          name: z.string().nullable(),
          confidence: z.string().nullable(),
        }),
        infrastructureScore: z.number(),
        risks: z.array(z.string()),
        sourceCount: z.number(),
      }),
    ),
    rankings: z.object({
      bestScore: z.number(),
      worstScore: z.number(),
    }),
  }),
  execute: async ({ addresses }) => {
    console.log(`[compareProperties] comparing ${addresses.length} addresses`);

    const results = await Promise.allSettled(
      addresses.map(async (addr) => {
        const searchResult = (await searchByAddress.execute!(
          addr,
          { agent: {} } as never,
        )) as SearchAddressResult & Record<string, unknown>;

        const pb = searchResult.pinuiBinui.projects[0] as Record<string, unknown> | undefined;
        const dev = searchResult.detectedDeveloper.developers[0] as
          | { name: string; confidence: string }
          | undefined;

        let scoreResult: ScoreResult | null = null;
        try {
          scoreResult = (await scoreProject.execute!(
            {
              city: addr.city,
              neighborhood: (pb?.neighborhood as string) ?? undefined,
              contractorName: dev?.name ?? undefined,
              projectStatus: (pb?.status as string) ?? undefined,
            },
            { agent: {} } as never,
          )) as ScoreResult;
        } catch {
          console.error(`[compareProperties] scoreProject failed for ${addr.street}`);
        }

        return { addr, searchResult, scoreResult };
      }),
    );

    const properties: PropertyComparison[] = results.map((result, i) => {
      const addr = addresses[i];
      const label = formatLabel(addr);

      if (result.status === "rejected") {
        return {
          address: { ...addr, label },
          score: null,
          project: {
            found: false,
            status: null,
            existingUnits: null,
            additionalUnits: null,
            totalProposedUnits: null,
            planNumber: null,
            yearApproved: null,
            neighborhood: null,
          },
          developer: { found: false, name: null, confidence: null },
          infrastructureScore: 0,
          risks: ["שגיאה בשליפת נתונים"],
          sourceCount: 0,
        };
      }

      const { searchResult, scoreResult } = result.value;
      const pb = searchResult.pinuiBinui.projects[0] as Record<string, unknown> | undefined;
      const dev = searchResult.detectedDeveloper.developers[0] as
        | { name: string; confidence: string }
        | undefined;

      const infraFactor = scoreResult?.factors?.find(
        (f) => f.name === "שירותי שכונה",
      );

      return {
        address: { ...addr, label },
        score: scoreResult
          ? {
              totalScore: scoreResult.totalScore,
              grade: scoreResult.grade,
              weightProfile: scoreResult.weightProfile,
            }
          : null,
        project: {
          found: searchResult.pinuiBinui.found,
          status: (pb?.status as string) ?? null,
          existingUnits: pb?.existingUnits != null ? Number(pb.existingUnits) : null,
          additionalUnits: pb?.additionalUnits != null ? Number(pb.additionalUnits) : null,
          totalProposedUnits: pb?.totalProposedUnits != null ? Number(pb.totalProposedUnits) : null,
          planNumber: (pb?.planNumber as string) ?? null,
          yearApproved: (pb?.yearApproved as string) ?? null,
          neighborhood: (pb?.neighborhood as string) ?? null,
        },
        developer: {
          found: !!dev,
          name: dev?.name ?? null,
          confidence: dev?.confidence ?? null,
        },
        infrastructureScore: infraFactor?.score ?? 0,
        risks: detectRisks({ searchResult }),
        sourceCount: searchResult.sources.length,
      };
    });

    // Rankings
    const scores = properties.map((p) => p.score?.totalScore ?? -1);
    const validScores = scores.filter((s) => s >= 0);
    const bestScore =
      validScores.length > 0
        ? scores.indexOf(Math.max(...validScores))
        : 0;
    const worstScore =
      validScores.length > 0
        ? scores.indexOf(Math.min(...validScores))
        : 0;

    const summary = `Comparison of ${properties.length} properties: ${properties.map((p) => `${p.address.label} (${p.score?.grade ?? "N/A"})`).join(" vs ")}.`;

    return {
      summary,
      properties,
      rankings: { bestScore, worstScore },
    };
  },
});
