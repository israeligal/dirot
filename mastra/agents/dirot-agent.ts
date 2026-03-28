import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { DIROT_INSTRUCTIONS } from "./dirot-instructions";

// HITL tools
import { updateTodosTool } from "../tools/update-todos-tool";
import { askForPlanApprovalTool } from "../tools/ask-for-plan-approval-tool";
import { requestInputTool } from "../tools/request-input";

// Data query tools
import { searchPinuiBinui } from "../tools/pinui-binui";
import {
  searchConstructionSites,
  searchConstructionProgress,
} from "../tools/construction";
import { searchLotteries } from "../tools/lotteries";
import { searchInfrastructure } from "../tools/infrastructure";
import {
  searchContractors,
  searchBrokersAndAppraisers,
} from "../tools/professionals";
import { searchPublicHousing } from "../tools/public-housing";
import { searchXplan } from "../tools/xplan";
import { scoreProject } from "../tools/scoring";
import { searchByAddress } from "../tools/address";
import { searchDeveloper } from "../tools/developer";
import { saveProperty, listProperties, removeProperty } from "../tools/saved-properties";
import { compareProperties } from "../tools/compare-properties";
import { queryAreaPricing } from "../tools/madlan-area";
import { searchListings } from "../tools/madlan-listings";
import { queryProject } from "../tools/madlan-project";
import { queryNearbyTransit } from "../tools/nearby-transit";
import { queryNearbySchools } from "../tools/nearby-schools";
import { lookupNeighborhood } from "../tools/neighborhood-lookup";
import { getProfile, updateProfile } from "../tools/profile";

const getModel = () => {
  const modelId = process.env.AI_MODEL || "google/gemini-2.5-pro";
  const [provider, model] = modelId.split("/");

  if (provider === "google") {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_API_KEY is required. Set it in .env.local",
      );
    }
    const google = createGoogleGenerativeAI({ apiKey });
    return google(model);
  }

  throw new Error(
    `Unsupported provider: ${provider}. Set AI_MODEL=google/gemini-2.5-pro in .env.local`,
  );
};

export const dirotAgent = new Agent({
  id: "dirot-agent",
  name: "Dirot Investment Analyst",
  instructions: DIROT_INSTRUCTIONS,
  model: getModel(),
  memory: new Memory({
    options: {
      lastMessages: 40,
    },
  }),
  tools: {
    // HITL workflow
    updateTodosTool,
    askForPlanApprovalTool,
    requestInputTool,
    // Data queries
    searchPinuiBinui,
    searchConstructionSites,
    searchConstructionProgress,
    searchLotteries,
    searchInfrastructure,
    searchContractors,
    searchBrokersAndAppraisers,
    searchPublicHousing,
    // XPLAN + Scoring
    searchXplan,
    scoreProject,
    // Address lookup
    searchByAddress,
    // Developer research
    searchDeveloper,
    // Saved properties
    saveProperty,
    listProperties,
    removeProperty,
    // Comparison
    compareProperties,
    // Market data
    queryAreaPricing,
    searchListings,
    queryProject,
    // Location-based tools
    queryNearbyTransit,
    queryNearbySchools,
    lookupNeighborhood,
    // User profile
    getProfile,
    updateProfile,
  },
});
