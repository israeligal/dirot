import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  real,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// --- Better Auth Tables ---

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// --- Provenance columns (shared by all tables) ---
const provenance = {
  sourceDataset: text("source_dataset").notNull(),
  resourceId: text("resource_id").notNull(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  dataGovUrl: text("data_gov_url").notNull(),
};

// --- Core Datasets ---

export const urbanRenewal = pgTable(
  "urban_renewal",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    misparMitham: integer("mispar_mitham"),
    yeshuv: text("yeshuv"),
    semelYeshuv: integer("semel_yeshuv"),
    shemMitcham: text("shem_mitcham"),
    yachadKayam: integer("yachad_kayam"),
    yachadTosafti: integer("yachad_tosafti"),
    yachadMutza: integer("yachad_mutza"),
    taarichHachraza: text("taarich_hachraza"),
    misparTochnit: text("mispar_tochnit"),
    kishurLatar: text("kishur_latar"),
    kishurLaMapa: text("kishur_la_mapa"),
    sachHeterim: text("sach_heterim"),
    maslul: text("maslul"),
    shnatMatanTokef: text("shnat_matan_tokef"),
    bebitzua: text("bebitzua"),
    status: text("status"),
    ...provenance,
  },
  (table) => [
    index("idx_ur_yeshuv").on(table.yeshuv),
    index("idx_ur_semel").on(table.semelYeshuv),
    index("idx_ur_shem_mitcham").on(table.shemMitcham),
  ],
);

export const lottery = pgTable(
  "lottery",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    lotteryId: integer("lottery_id"),
    lotteryType: text("lottery_type"),
    lamasCode: integer("lamas_code"),
    lamasName: text("lamas_name"),
    neighborhood: text("neighborhood"),
    projectId: integer("project_id"),
    projectName: text("project_name"),
    providerName: text("provider_name"),
    priceForMeter: text("price_for_meter"),
    projectStatus: text("project_status"),
    constructionPermitName: text("construction_permit_name"),
    lotteryExecutionDate: text("lottery_execution_date"),
    lotteryStatusValue: text("lottery_status_value"),
    lotteryHousingUnits: integer("lottery_housing_units"),
    subscribers: integer("subscribers"),
    winners: integer("winners"),
    marketingMethodDesc: text("marketing_method_desc"),
    ...provenance,
  },
  (table) => [
    index("idx_lot_lamas_name").on(table.lamasName),
    index("idx_lot_lamas_code").on(table.lamasCode),
  ],
);

export const constructionProgress = pgTable(
  "construction_progress",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    mahoz: text("mahoz"),
    yeshuvLamas: text("yeshuv_lamas"),
    atar: text("atar"),
    misparMitham: integer("mispar_mitham"),
    shemMitham: text("shem_mitham"),
    migrash: text("migrash"),
    gush: text("gush"),
    helka: text("helka"),
    misparBinyan: text("mispar_binyan"),
    komotBinyan: text("komot_binyan"),
    yehidotBinyan: integer("yehidot_binyan"),
    shetah: text("shetah"),
    shitatShivuk: text("shitat_shivuk"),
    taarichKobea: text("taarich_kobea"),
    shnatHoze: text("shnat_hoze"),
    stage5Date: text("stage_5_date"),
    stage8Date: text("stage_8_date"),
    stage16Date: text("stage_16_date"),
    stage18Date: text("stage_18_date"),
    stage29Date: text("stage_29_date"),
    stage39Date: text("stage_39_date"),
    stage42Date: text("stage_42_date"),
    ...provenance,
  },
  (table) => [
    index("idx_cp_yeshuv").on(table.yeshuvLamas),
    index("idx_cp_gush").on(table.gush),
  ],
);

export const activeConstruction = pgTable(
  "active_construction",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    workId: integer("work_id"),
    siteName: text("site_name"),
    executorName: text("executor_name"),
    executorId: integer("executor_id"),
    foremanName: text("foreman_name"),
    hasCranes: integer("has_cranes"),
    cityName: text("city_name"),
    buildTypes: text("build_types"),
    safetyWarrents: integer("safety_warrents"),
    sanctions: integer("sanctions"),
    sanctionsSum: integer("sanctions_sum"),
    ...provenance,
  },
  (table) => [
    index("idx_ac_city").on(table.cityName),
    index("idx_ac_executor").on(table.executorName),
  ],
);

export const publicHousingInventory = pgTable(
  "public_housing_inventory",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    cityLmsName: text("city_lms_name"),
    floor: integer("floor"),
    oneRooms: integer("one_rooms"),
    twoRooms: integer("two_rooms"),
    threeRooms: integer("three_rooms"),
    fourRooms: integer("four_rooms"),
    fiveRooms: integer("five_rooms"),
    ...provenance,
  },
  (table) => [index("idx_phi_city").on(table.cityLmsName)],
);

export const publicHousingVacancies = pgTable(
  "public_housing_vacancies",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    cityLmsName: text("city_lms_name"),
    cityLmsCode: integer("city_lms_code"),
    numOfRooms: integer("num_of_rooms"),
    floor: integer("floor"),
    totalArea: real("total_area"),
    validityDate: text("validity_date"),
    companyName: text("company_name"),
    statusName: text("status_name"),
    propertyTypeName: text("property_type_name"),
    ...provenance,
  },
  (table) => [index("idx_phv_city").on(table.cityLmsName)],
);

// --- Infrastructure Datasets ---

export const tma3Roads = pgTable(
  "tma3_roads",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    objectId: text("object_id"),
    tochnitNu: text("tochnit_nu"),
    tochnitNa: text("tochnit_na"),
    status: text("status"),
    shapeLength: text("shape_length"),
    ...provenance,
  },
  (table) => [index("idx_tma3_status").on(table.status)],
);

export const tma23Rail = pgTable(
  "tma23_rail",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    objectId: text("object_id"),
    tochnitNu: text("tochnit_nu"),
    tochnitNa: text("tochnit_na"),
    status: text("status"),
    shapeLength: text("shape_length"),
    ...provenance,
  },
  (table) => [index("idx_tma23_status").on(table.status)],
);

export const transportProjects = pgTable(
  "transport_projects",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    mainName: text("main_name"),
    prjName: text("prj_name"),
    prjId: text("prj_id"),
    prjTyp: text("prj_typ"),
    prjSubtyp: text("prj_subtyp"),
    compName: text("comp_name"),
    road: text("road"),
    prjCost: text("prj_cost"),
    tatStg: text("tat_stg"),
    prjEnd: text("prj_end"),
    lstMsNam: text("lst_ms_nam"),
    nxtMsNam: text("nxt_ms_nam"),
    ...provenance,
  },
  (table) => [
    index("idx_tp_prj_name").on(table.prjName),
    index("idx_tp_road").on(table.road),
  ],
);

export const nationalTransport = pgTable(
  "national_transport",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    name: text("name"),
    planName: text("plan_name"),
    status: text("status"),
    subject: text("subject"),
    adress: text("adress"),
    planLink: text("plan_link"),
    ...provenance,
  },
  (table) => [index("idx_nt_name").on(table.name)],
);

export const massTransit = pgTable(
  "mass_transit",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    name: text("name"),
    lineId: integer("line_id"),
    type: text("type"),
    year: integer("year"),
    shapeLength: real("shape_length"),
    ...provenance,
  },
  (table) => [
    index("idx_mt_name").on(table.name),
    index("idx_mt_type").on(table.type),
  ],
);

// --- Supporting Datasets ---

export const contractors = pgTable(
  "contractors",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    shemYeshut: text("shem_yeshut"),
    misparKablan: text("mispar_kablan"),
    shemYishuv: text("shem_yishuv"),
    shemRehov: text("shem_rehov"),
    taarichKablan: text("taarich_kablan"),
    misparTel: text("mispar_tel"),
    email: text("email"),
    kodAnaf: text("kod_anaf"),
    teurAnaf: text("teur_anaf"),
    kvutza: text("kvutza"),
    sivug: text("sivug"),
    hekef: text("hekef"),
    kablanMukar: text("kablan_mukar"),
    ovdim: text("ovdim"),
    heara: text("heara"),
    ...provenance,
  },
  (table) => [
    index("idx_con_shem").on(table.shemYeshut),
    index("idx_con_city").on(table.shemYishuv),
  ],
);

export const brokers = pgTable(
  "brokers",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    licenseNumber: integer("license_number"),
    name: text("name"),
    city: text("city"),
    ...provenance,
  },
  (table) => [index("idx_br_city").on(table.city)],
);

export const appraisers = pgTable(
  "appraisers",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    name: text("name"),
    licenseNumber: integer("license_number"),
    fileNumber: integer("file_number"),
    city: text("city"),
    ...provenance,
  },
  (table) => [index("idx_ap_city").on(table.city)],
);

export const developmentCosts = pgTable(
  "development_costs",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    projectId: integer("project_id"),
    projectName: text("project_name"),
    mahozName: text("mahoz_name"),
    lamasCode: integer("lamas_code"),
    lamasName: text("lamas_name"),
    atarName: text("atar_name"),
    livingUnits: integer("living_units"),
    statusDescription: text("status_description"),
    developPay: real("develop_pay"),
    ...provenance,
  },
  (table) => [index("idx_dc_lamas").on(table.lamasName)],
);

export const greenBuildings = pgTable(
  "green_buildings",
  {
    id: serial("id").primaryKey(),
    ckanId: integer("ckan_id").notNull(),
    municipalityName: text("municipality_name"),
    buildingStreet: text("building_street"),
    gush: text("gush"),
    helka: text("helka"),
    x: real("x"),
    y: real("y"),
    floorsAboveGround: integer("floors_above_ground"),
    buildingArea: real("building_area"),
    residentialUnits: integer("residential_units"),
    standardName: text("standard_name"),
    certificationStatus: text("certification_status"),
    ...provenance,
  },
  (table) => [index("idx_gb_municipality").on(table.municipalityName)],
);
