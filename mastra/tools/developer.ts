import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  queryContractors,
  queryConstructionSitesByDeveloper,
  type SourceInfo,
} from "./db-queries";
import { trimRecord } from "./utils";

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/search";
const FIRECRAWL_TIMEOUT_MS = 10_000;

const sourcesSchema = z.array(
  z.object({
    dataset: z.string(),
    resourceId: z.string(),
    fetchedAt: z.string(),
    url: z.string(),
  }),
);

interface FirecrawlResult {
  url: string;
  title: string;
  description: string;
}

async function searchFirecrawl({
  query,
  limit = 5,
}: {
  query: string;
  limit?: number;
}): Promise<FirecrawlResult[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn("[searchDeveloper] FIRECRAWL_API_KEY not set, skipping web search");
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT_MS);

  try {
    const response = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, limit }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`[searchDeveloper] Firecrawl returned ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      success?: boolean;
      data?: { web?: FirecrawlResult[] };
    };

    return data.data?.web ?? [];
  } catch (err) {
    console.error("[searchDeveloper] Firecrawl error:", err);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function settled<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

export const searchDeveloper = createTool({
  id: "search-developer",
  description:
    "Research a developer/construction company. Combines government contractor registry data, their active construction sites, and web search results (reviews, news, reputation). Use when the user asks about a specific developer, mentions a company name, or wants to assess developer reliability for a PB project.",
  inputSchema: z.object({
    name: z.string().describe("Developer or company name in Hebrew (e.g., חברת שאפ)"),
    city: z.string().optional().describe("City to filter active projects"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    developer: z.object({
      name: z.string(),
      city: z.string().optional(),
    }),
    registry: z.object({
      found: z.boolean(),
      contractors: z.array(z.record(z.string(), z.unknown())),
    }),
    activeSites: z.object({
      found: z.boolean(),
      count: z.number(),
      totalSanctions: z.number(),
      sites: z.array(z.record(z.string(), z.unknown())),
    }),
    webResults: z.object({
      found: z.boolean(),
      results: z.array(z.record(z.string(), z.unknown())),
    }),
    sources: sourcesSchema,
  }),
  execute: async ({ name, city }) => {
    console.log(`[searchDeveloper] researching: ${name}${city ? ` (${city})` : ""}`);

    const webQuery = `${name} יזם נדל"ן פינוי בינוי חוות דעת`;

    const [registryResult, sitesResult, webResult] = await Promise.allSettled([
      queryContractors({ name, city, limit: 10 }),
      queryConstructionSitesByDeveloper({ name, city, limit: 20 }),
      searchFirecrawl({ query: webQuery, limit: 5 }),
    ]);

    const registry = settled(registryResult);
    const sites = settled(sitesResult);
    const web = settled(webResult) ?? [];

    const sources: SourceInfo[] = [];

    // Gov registry
    const contractors = (registry?.records ?? []).map((r) => trimRecord({
      name: r.shem_yeshut,
      contractorNumber: r.mispar_kablan,
      city: r.shem_yishuv,
      street: r.shem_rehov,
      phone: r.mispar_tel,
      email: r.email,
      branchDescription: r.teur_anaf,
      classification: r.sivug,
      scope: r.hekef,
      recognized: r.kablan_mukar,
      registrationDate: r.taarich_kablan,
      employees: r.ovdim,
      notes: r.heara,
      matchScore: r.match_score,
    }));
    if (registry?.source) sources.push(registry.source);

    // Active sites
    const sitesList = (sites?.records ?? []).map((r) => trimRecord({
      workId: r.work_id,
      siteName: r.site_name,
      contractor: r.executor_name,
      city: r.city_name,
      buildingType: r.build_types,
      hasCranes: r.has_cranes === 1,
      safetyWarnings: r.safety_warrents,
      sanctions: r.sanctions,
      sanctionsAmount: r.sanctions_sum,
    }));
    const totalSanctions = sitesList.reduce(
      (sum, s) => sum + (Number(s.sanctions) || 0),
      0,
    );
    if (sites?.source) sources.push(sites.source);

    // Web results
    const webResults = web.map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));
    if (webResults.length > 0) {
      sources.push({
        dataset: "Web Search (Firecrawl)",
        resourceId: "firecrawl-search",
        fetchedAt: new Date().toISOString(),
        url: "https://firecrawl.dev",
      });
    }

    // Summary
    const parts: string[] = [];
    if (contractors.length > 0) parts.push(`${contractors.length} registry match(es)`);
    if (sitesList.length > 0) parts.push(`${sitesList.length} active site(s)`);
    if (totalSanctions > 0) parts.push(`${totalSanctions} total sanctions`);
    if (webResults.length > 0) parts.push(`${webResults.length} web result(s)`);

    const summary = parts.length > 0
      ? `Developer "${name}": ${parts.join(", ")}.`
      : `No information found for developer "${name}" in government registry, active sites, or web search.`;

    return {
      summary,
      developer: { name, city },
      registry: { found: contractors.length > 0, contractors },
      activeSites: {
        found: sitesList.length > 0,
        count: sitesList.length,
        totalSanctions,
        sites: sitesList,
      },
      webResults: { found: webResults.length > 0, results: webResults },
      sources,
    };
  },
});
