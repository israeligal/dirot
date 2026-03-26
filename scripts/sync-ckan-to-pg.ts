/**
 * Sync CKAN data to PostgreSQL
 * Run: npx tsx scripts/sync-ckan-to-pg.ts
 *
 * Fetches all records from 17 CKAN datasets, cleans them, and inserts into Neon PG.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "../app/lib/schema";
import {
  RESOURCE_URBAN_RENEWAL,
  RESOURCE_LOTTERY,
  RESOURCE_CONSTRUCTION_PROGRESS,
  RESOURCE_ACTIVE_CONSTRUCTION,
  RESOURCE_PUBLIC_HOUSING_INVENTORY,
  RESOURCE_PUBLIC_HOUSING_VACANCIES,
  RESOURCE_TMA3_ROADS,
  RESOURCE_TMA23_RAIL,
  RESOURCE_TRANSPORT_PROJECTS,
  RESOURCE_NATIONAL_TRANSPORT,
  RESOURCE_MASS_TRANSIT_TLV,
  RESOURCE_CONTRACTORS,
  RESOURCE_BROKERS,
  RESOURCE_APPRAISERS,
  RESOURCE_DEVELOPMENT_COSTS,
  RESOURCE_GREEN_BUILDINGS,
  RESOURCE_BUS_STOPS,
  RESOURCE_LRT_STATIONS,
  RESOURCE_LRT_LINES,
  RESOURCE_SCHOOL_COORDINATES,
} from "../app/lib/constants";

const pgSql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: pgSql });

function trim(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

function toInt(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  const cleaned = String(val).trim().replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : Math.round(n);
}

function toFloat(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  const n = Number(String(val).trim().replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
}

async function fetchAllCkan(resourceId: string): Promise<Record<string, unknown>[]> {
  const allRecords: Record<string, unknown>[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}&limit=${limit}&offset=${offset}`;
    const resp = await fetch(url);
    const data = await resp.json() as {
      success: boolean;
      result: { records: Record<string, unknown>[]; total: number };
    };

    if (!data.success) throw new Error(`CKAN error for ${resourceId}`);

    allRecords.push(...data.result.records);
    console.log(`    Fetched ${allRecords.length}/${data.result.total}`);

    if (allRecords.length >= data.result.total) break;
    offset += limit;
  }

  return allRecords;
}

type SyncConfig = {
  name: string;
  resourceId: string;
  table: typeof schema[keyof typeof schema];
  dataGovUrl: string;
  mapRecord: (r: Record<string, unknown>) => Record<string, unknown>;
};

const SYNC_CONFIGS: SyncConfig[] = [
  {
    name: "Urban Renewal",
    resourceId: RESOURCE_URBAN_RENEWAL,
    table: schema.urbanRenewal,
    dataGovUrl: "https://data.gov.il/dataset/urban_renewal",
    mapRecord: (r) => ({
      ckanId: r._id,
      misparMitham: toInt(r.MisparMitham),
      yeshuv: trim(r.Yeshuv),
      semelYeshuv: toInt(r.SemelYeshuv),
      shemMitcham: trim(r.ShemMitcham),
      yachadKayam: toInt(r.YachadKayam),
      yachadTosafti: toInt(r.YachadTosafti),
      yachadMutza: toInt(r.YachadMutza),
      taarichHachraza: trim(r.TaarichHachraza),
      misparTochnit: trim(r.MisparTochnit),
      kishurLatar: trim(r.KishurLatar),
      kishurLaMapa: trim(r.KishurLaMapa),
      sachHeterim: trim(r.SachHeterim),
      maslul: trim(r.Maslul),
      shnatMatanTokef: trim(r.ShnatMatanTokef),
      bebitzua: trim(r.Bebitzua),
      status: trim(r.Status),
    }),
  },
  {
    name: "Lottery",
    resourceId: RESOURCE_LOTTERY,
    table: schema.lottery,
    dataGovUrl: "https://data.gov.il/dataset/mechir-lamishtaken",
    mapRecord: (r) => ({
      ckanId: r._id,
      lotteryId: toInt(r.LotteryId),
      lotteryType: trim(r.LotteryType),
      lamasCode: toInt(r.LamasCode),
      lamasName: trim(r.LamasName),
      neighborhood: trim(r.Neighborhood),
      projectId: toInt(r.ProjectId),
      projectName: trim(r.ProjectName),
      providerName: trim(r.ProviderName),
      priceForMeter: trim(r.PriceForMeter),
      projectStatus: trim(r.ProjectStatus),
      constructionPermitName: trim(r.ConstructionPermitName),
      lotteryExecutionDate: trim(r.LotteryExecutionDate),
      lotteryStatusValue: trim(r.LotteryStatusValue),
      lotteryHousingUnits: toInt(r.LotteryHousingUnits),
      subscribers: toInt(r.Subscribers),
      winners: toInt(r.Winners),
      marketingMethodDesc: trim(r.MarketingMethodDesc),
    }),
  },
  {
    name: "Active Construction",
    resourceId: RESOURCE_ACTIVE_CONSTRUCTION,
    table: schema.activeConstruction,
    dataGovUrl: "https://data.gov.il/dataset/b072e36c-a53b-49e1-be08-4a608fcf4638",
    mapRecord: (r) => ({
      ckanId: r._id,
      workId: toInt(r.work_id),
      siteName: trim(r.site_name),
      executorName: r.executor_name != null ? trim(r.executor_name) : null,
      executorId: toInt(r.executor_id),
      foremanName: r.foreman_name != null ? trim(r.foreman_name) : null,
      hasCranes: toInt(r.has_cranes),
      cityName: trim(r.city_name),
      buildTypes: trim(r.build_types),
      safetyWarrents: toInt(r.safety_warrents),
      sanctions: toInt(r.sanctions),
      sanctionsSum: toInt(r.sanctions_sum),
    }),
  },
  {
    name: "Construction Progress",
    resourceId: RESOURCE_CONSTRUCTION_PROGRESS,
    table: schema.constructionProgress,
    dataGovUrl: "https://data.gov.il/dataset/hitkadmuthabnia",
    mapRecord: (r) => ({
      ckanId: r._id,
      mahoz: trim(r.MAHOZ),
      yeshuvLamas: trim(r.YESHUV_LAMAS),
      atar: trim(r.ATAR),
      misparMitham: toInt(r.MISPAR_MITHAM),
      shemMitham: trim(r.SHEM_MITHAM),
      migrash: trim(r.MIGRASH),
      gush: trim(r.GUSH),
      helka: trim(r.HELKA),
      misparBinyan: trim(r.MISPAR_BINYAN),
      komotBinyan: trim(r.KOMOT_BINYAN),
      yehidotBinyan: toInt(r.YEHIDOT_BINYAN),
      shetah: trim(r.SHETAH),
      shitatShivuk: trim(r.SHITAT_SHIVUK),
      taarichKobea: trim(r.TAARICH_KOBEA),
      shnatHoze: trim(r.SHNAT_HOZE),
      stage5Date: trim(r.TAARICH_SHLAV_BNIYA_5),
      stage8Date: trim(r.TAARICH_SHLAV_BNIYA_8),
      stage16Date: trim(r.TAARICH_SHLAV_BNIYA_16),
      stage18Date: trim(r.TAARICH_SHLAV_BNIYA_18),
      stage29Date: trim(r.TAARICH_SHLAV_BNIYA_29),
      stage39Date: trim(r.TAARICH_SHLAV_BNIYA_39),
      stage42Date: trim(r.TAARICH_SHLAV_BNIYA_42),
    }),
  },
  {
    name: "Contractors",
    resourceId: RESOURCE_CONTRACTORS,
    table: schema.contractors,
    dataGovUrl: "https://data.gov.il/dataset/pinkashakablanim",
    mapRecord: (r) => ({
      ckanId: r._id,
      shemYeshut: trim(r.SHEM_YESHUT),
      misparKablan: trim(r.MISPAR_KABLAN),
      shemYishuv: trim(r.SHEM_YISHUV),
      shemRehov: trim(r.SHEM_REHOV),
      taarichKablan: trim(r.TAARICH_KABLAN),
      misparTel: trim(r.MISPAR_TEL),
      email: trim(r.EMAIL),
      kodAnaf: trim(r.KOD_ANAF),
      teurAnaf: trim(r.TEUR_ANAF),
      kvutza: trim(r.KVUTZA),
      sivug: trim(r.SIVUG),
      hekef: trim(r.HEKEF),
      kablanMukar: trim(r.KABLAN_MUKAR),
      ovdim: trim(r.OVDIM),
      heara: trim(r.HEARA),
    }),
  },
  {
    name: "Mass Transit",
    resourceId: RESOURCE_MASS_TRANSIT_TLV,
    table: schema.massTransit,
    dataGovUrl: "https://data.gov.il/dataset/mataan_tlv",
    mapRecord: (r) => ({
      ckanId: r._id,
      name: trim(r.NAME),
      lineId: toInt(r.LINE_ID),
      type: trim(r.TYPE),
      year: toInt(r.YEAR),
      shapeLength: toFloat(r.Shape_Length),
    }),
  },
  {
    name: "TMA3 Roads",
    resourceId: RESOURCE_TMA3_ROADS,
    table: schema.tma3Roads,
    dataGovUrl: "https://data.gov.il/dataset/tma_3",
    mapRecord: (r) => ({
      ckanId: r._id,
      objectId: trim(r.OBJECTID),
      tochnitNu: trim(r.TOCHNIT_NU),
      tochnitNa: trim(r.TOCHNIT_NA),
      status: trim(r.STATUS),
      shapeLength: trim(r.Shape_Length),
    }),
  },
  {
    name: "TMA23 Rail",
    resourceId: RESOURCE_TMA23_RAIL,
    table: schema.tma23Rail,
    dataGovUrl: "https://data.gov.il/dataset/tma_23",
    mapRecord: (r) => ({
      ckanId: r._id,
      objectId: trim(r.OBJECTID),
      tochnitNu: trim(r.TOCHNIT_NU),
      tochnitNa: trim(r.TOCHNIT_NA),
      status: trim(r.STATUS),
      shapeLength: trim(r.Shape_Length),
    }),
  },
  {
    name: "Transport Projects",
    resourceId: RESOURCE_TRANSPORT_PROJECTS,
    table: schema.transportProjects,
    dataGovUrl: "https://data.gov.il/dataset/workplan",
    mapRecord: (r) => ({
      ckanId: r._id,
      mainName: trim(r.Main_Name),
      prjName: trim(r.PRJ_NAME),
      prjId: trim(r.PRJ_ID),
      prjTyp: trim(r.PRJ_TYP),
      prjSubtyp: trim(r.PRJ_SUBTYP),
      compName: trim(r.COMP_NAME),
      road: trim(r.ROAD),
      prjCost: trim(r.PRJ_COST),
      tatStg: trim(r.TAT_STG),
      prjEnd: trim(r.PRJ_END),
      lstMsNam: trim(r.LST_MS_NAM),
      nxtMsNam: trim(r.NXT_MS_NAM),
    }),
  },
  {
    name: "National Transport",
    resourceId: RESOURCE_NATIONAL_TRANSPORT,
    table: schema.nationalTransport,
    dataGovUrl: "https://data.gov.il/dataset/ttl_transport",
    mapRecord: (r) => ({
      ckanId: r._id,
      name: trim(r.NAME),
      planName: trim(r.PLAN_NAME),
      status: trim(r.STATUS),
      subject: trim(r.SUBJECT),
      adress: trim(r.ADRESS),
      planLink: trim(r.PLAN_LINK),
    }),
  },
  {
    name: "Brokers",
    resourceId: RESOURCE_BROKERS,
    table: schema.brokers,
    dataGovUrl: "https://data.gov.il/dataset/metavhim",
    mapRecord: (r) => ({
      ckanId: r._id,
      licenseNumber: toInt(r["מס רשיון"]),
      name: trim(r["שם המתווך"]),
      city: trim(r["עיר מגורים"]),
    }),
  },
  {
    name: "Appraisers",
    resourceId: RESOURCE_APPRAISERS,
    table: schema.appraisers,
    dataGovUrl: "https://data.gov.il/dataset/shamaim",
    mapRecord: (r) => ({
      ckanId: r._id,
      name: trim(r["שם שמאי"]),
      licenseNumber: toInt(r["מספר רשיון"]),
      fileNumber: toInt(r["מספר תיק"]),
      city: trim(r["עיר"]),
    }),
  },
  {
    name: "Public Housing Inventory",
    resourceId: RESOURCE_PUBLIC_HOUSING_INVENTORY,
    table: schema.publicHousingInventory,
    dataGovUrl: "https://data.gov.il/dataset/diurtziburi",
    mapRecord: (r) => ({
      ckanId: r._id,
      cityLmsName: trim(r.CityLMSName),
      floor: toInt(r.Floor),
      oneRooms: toInt(r.OneRooms),
      twoRooms: toInt(r.TwoRooms),
      threeRooms: toInt(r.ThreeRooms),
      fourRooms: toInt(r.FourRooms),
      fiveRooms: toInt(r.FiveRooms),
    }),
  },
  {
    name: "Public Housing Vacancies",
    resourceId: RESOURCE_PUBLIC_HOUSING_VACANCIES,
    table: schema.publicHousingVacancies,
    dataGovUrl: "https://data.gov.il/dataset/diurtziburi",
    mapRecord: (r) => ({
      ckanId: r._id,
      cityLmsName: trim(r.CityLmsName),
      cityLmsCode: toInt(r.CityLmsCode),
      numOfRooms: toInt(r.NumOfRooms),
      floor: toInt(r.Floor),
      totalArea: toFloat(r.TotalArea),
      validityDate: trim(r.ValidityDate),
      companyName: trim(r.CompanyName),
      statusName: trim(r.StatusName),
      propertyTypeName: trim(r.PropertyTypeName),
    }),
  },
  {
    name: "Development Costs",
    resourceId: RESOURCE_DEVELOPMENT_COSTS,
    table: schema.developmentCosts,
    dataGovUrl: "https://data.gov.il/dataset/aluyot-pituach",
    mapRecord: (r) => ({
      ckanId: r._id,
      projectId: toInt(r.ProjectID),
      projectName: trim(r.ProjectName),
      mahozName: trim(r.MahozName),
      lamasCode: toInt(r.LamasCode),
      lamasName: trim(r.LamasName),
      atarName: trim(r.AtarName),
      livingUnits: toInt(r.LivingUnits),
      statusDescription: trim(r.StatusDescription),
      developPay: toFloat(r.DevelopPay),
    }),
  },
  {
    name: "Green Buildings",
    resourceId: RESOURCE_GREEN_BUILDINGS,
    table: schema.greenBuildings,
    dataGovUrl: "https://data.gov.il/dataset/greenbuildings",
    mapRecord: (r) => ({
      ckanId: r._id,
      municipalityName: trim(r.municipality_name),
      buildingStreet: trim(r.building_street),
      gush: trim(r.gush),
      helka: trim(r.helka),
      x: toFloat(r.X),
      y: toFloat(r.Y),
      floorsAboveGround: toInt(r.floors_above_ground),
      buildingArea: toFloat(r.building_area),
      residentialUnits: toInt(r.residential_units),
      standardName: trim(r.standard_name),
      certificationStatus: trim(r.certification_status),
    }),
  },
  {
    name: "Bus Stops",
    resourceId: RESOURCE_BUS_STOPS,
    table: schema.busStops,
    dataGovUrl: "https://data.gov.il/dataset/27047419-e1fc-4f1d-bb15-7f5f0805d226",
    mapRecord: (r) => ({
      ckanId: r._id,
      stationId: toInt(r.StationId),
      cityCode: toInt(r.CityCode),
      cityName: trim(r.CityName),
      metropolinCode: toInt(r.MetropolinCode),
      metropolinName: trim(r.MetropolinName),
      stationTypeCode: toInt(r.StationTypeCode),
      stationTypeName: trim(r.StationTypeName),
      stationOperatorTypeCode: toInt(r.StationOperatorTypeCode),
      stationOperatorTypeName: trim(r.StationOperatorTypeName),
      lat: toFloat(r.Lat),
      lng: toFloat(r.Long),
    }),
  },
  {
    name: "LRT Stations",
    resourceId: RESOURCE_LRT_STATIONS,
    table: schema.lrtStations,
    dataGovUrl: "https://data.gov.il/dataset/86fce9f0-0e5a-4012-8a84-86a233e83191",
    mapRecord: (r) => ({
      ckanId: r._id,
      oid: toInt(r.OID),
      x: toFloat(r.X),
      y: toFloat(r.Y),
      entranceExit: trim(r.ENTRC_EXIT),
      accessibleEntrance: trim(r.ACSBL_ENTR),
      entranceType: trim(r.ENTRC_TYPE),
      notes: trim(r.NOTES),
      line: trim(r.LINE),
      type: trim(r.TYPE),
      status: trim(r.STATUS),
      yearMonth: toInt(r.YEARMONTH),
      company: trim(r.COMP),
      metroArea: trim(r.MTR_AREA),
      stationName: trim(r.STAT_NAME),
      entranceLabel: trim(r.ENTRC_LBL),
    }),
  },
  {
    name: "LRT Lines",
    resourceId: RESOURCE_LRT_LINES,
    table: schema.lrtLines,
    dataGovUrl: "https://data.gov.il/dataset/b65ae5cf-8aab-4b8e-ae08-de941368fff0",
    mapRecord: (r) => ({
      ckanId: r._id,
      oid: toInt(r.OID),
      name: trim(r.NAME),
      lineEn: trim(r.LINE_EG),
      frequency: trim(r.FREQ),
      status: trim(r.STATUS),
      yearMonth: toInt(r.YEARMONTH),
      company: trim(r.COMP),
      startStation: trim(r.START_),
      destination: trim(r.DESTNATION),
      metroArea: trim(r.MTR_AREA),
      length: toFloat(r.LENGT),
      shapeLength: toFloat(r.Shape_Length),
    }),
  },
  {
    name: "School Coordinates",
    resourceId: RESOURCE_SCHOOL_COORDINATES,
    table: schema.schools,
    dataGovUrl: "https://data.gov.il/dataset/845e1d30-1b79-46a0-870c-6c39d18700d0",
    mapRecord: (r) => ({
      ckanId: r._id,
      schoolCode: trim(r.SEMEL_MOSAD),
      schoolName: trim(r.SHEM_MOSAD),
      lat: toFloat(r.UTM_Y), // UTM_Y is actually WGS84 latitude
      lng: toFloat(r.UTM_X), // UTM_X is actually WGS84 longitude
      locationAccuracy: trim(r.RAMAT_DIYUK_MIKUM),
    }),
  },
];

async function syncDataset(cfg: SyncConfig) {
  console.log(`\n📥 ${cfg.name}...`);

  const records = await fetchAllCkan(cfg.resourceId);
  console.log(`  Fetched ${records.length} records from CKAN`);

  // Truncate table
  await db.execute(sql`TRUNCATE TABLE ${sql.identifier(cfg.table[Symbol.for("drizzle:Name")])} RESTART IDENTITY`);

  if (records.length === 0) {
    console.log("  ⚠️  No records to insert");
    return;
  }

  // Neon has a query param limit (~6500). Smaller batches for tables with many columns.
  const batchSize = 100;
  const mapped = records.map((r) => ({
    ...cfg.mapRecord(r),
    sourceDataset: cfg.name.toLowerCase().replace(/\s+/g, "_"),
    resourceId: cfg.resourceId,
    dataGovUrl: cfg.dataGovUrl,
  }));

  for (let i = 0; i < mapped.length; i += batchSize) {
    const batch = mapped.slice(i, i + batchSize);
    // @ts-expect-error — Drizzle insert typing with dynamic table
    await db.insert(cfg.table).values(batch);
    console.log(`  Inserted ${Math.min(i + batchSize, mapped.length)}/${mapped.length}`);
  }

  console.log(`  ✅ ${cfg.name}: ${mapped.length} records synced`);
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Dirot — CKAN → PostgreSQL Sync");
  console.log("═══════════════════════════════════════════════");

  const startTime = Date.now();

  for (const cfg of SYNC_CONFIGS) {
    try {
      await syncDataset(cfg);
    } catch (error) {
      console.error(`  ❌ ${cfg.name} failed:`, error instanceof Error ? error.message : error);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  Sync complete in ${elapsed}s`);
  console.log(`═══════════════════════════════════════════════\n`);
}

main().catch(console.error);
