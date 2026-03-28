/**
 * Shared database query helpers for agent tools.
 * Re-exports from domain-specific query modules under ./queries/.
 */

export { getSql, formatResult, extractSource } from "./queries/shared";
export type { QueryResult, SourceInfo } from "./queries/shared";
export { queryUrbanRenewal, queryUrbanRenewalByAddress } from "./queries/urban-renewal";
export {
  queryConstructionSites,
  queryConstructionProgress,
  queryConstructionSitesByDeveloper,
  queryConstructionSitesByAddress,
  queryGreenBuildingsByAddress,
  queryDevelopmentCostsByAddress,
} from "./queries/construction";
export { queryLotteries, queryLotteriesByAddress } from "./queries/lottery";
export { queryContractors } from "./queries/contractors";
export { queryInfrastructure } from "./queries/infrastructure";
export { queryBrokers, queryAppraisers } from "./queries/professionals";
export { queryPublicHousing } from "./queries/public-housing";
