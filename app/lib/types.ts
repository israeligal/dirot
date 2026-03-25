// --- Core Datasets ---

export interface UrbanRenewalRecord {
  _id: number;
  MisparMitham: number;
  Yeshuv: string;
  SemelYeshuv: number;
  ShemMitcham: string;
  YachadKayam: string; // string-encoded number
  YachadTosafti: string; // string-encoded number
  YachadMutza: number;
  TaarichHachraza: string;
  MisparTochnit: string;
  KishurLatar: string; // MAVAT link, may be empty
  KishurLaMapa: string; // GovMap link, may be empty
  SachHeterim: string; // string-encoded number
  Maslul: string; // "מיסוי" or municipal
  ShnatMatanTokef: string;
  Bebitzua: string; // "כן"/"לא"
  Status: string;
}

export interface LotteryRecord {
  _id: number;
  LotteryId: number;
  LotteryType: string;
  ParentLotteryId: string;
  ContinLotteryId: string;
  CentralizationType: string;
  MarketingMethod: number;
  MarketingMethodDesc: string;
  MarketingRep: string;
  Eligibility: string;
  LotteryStatusValue: string;
  LotteryEndSignupDate: string;
  LotteryExecutionDate: string;
  LamasCode: number;
  LamasName: string;
  Neighborhood: string;
  ProjectId: number;
  ProjectName: string;
  ProviderName: string;
  ProjectStatus: string;
  ConstructionPermitName: string;
  PriceForMeter: string; // e.g. "9,242.00"
  LotterySignupHousingUnits: number;
  LotterySignupNativeHousingUnits: string;
  LotteryHousingUnits: number;
  LotteryNativeHousingUnits: number;
  Subscribers: number;
  SubscribersBenyMakom: number;
  SubscribersDisabled: number;
  SubscribersSeriesA: number;
  SubscribersSeriesB: number;
  SubscribersSeriesC: number;
  SubscribersMeshapryDiur: number;
  Winners: number;
  WinnersBneyMakom: string;
  WinnersSeriesA: number;
  WinnersSeriesB: number;
  WinnersSeriesC: number;
  WinnersHasryDiur: number;
  WinnersMeshapryDiur: number;
}

export interface LotteryNoDrawRecord {
  _id: number;
  // Dataset currently has 0 records — will be typed when data appears
}

export interface ConstructionProgressRecord {
  _id: number;
  MAHOZ: string;
  YESHUV_LAMAS: string;
  ATAR: string;
  MISPAR_MITHAM: number;
  SHEM_MITHAM: string;
  MIGRASH: string;
  GUSH: string;
  HELKA: string;
  MISPAR_BINYAN: string;
  KOMOT_BINYAN: string; // string-encoded number
  YEHIDOT_BINYAN: number;
  SHETAH: string; // string-encoded number
  SHITAT_SHIVUK: string;
  TAARICH_KOBEA: string;
  SHNAT_HOZE: string;
  TAARICH_SHLAV_BNIYA_5: string;
  TAARICH_SHLAV_BNIYA_7: number; // API inconsistency — likely Excel serial date
  TAARICH_SHLAV_BNIYA_8: string;
  TAARICH_SHLAV_BNIYA_16: string;
  TAARICH_SHLAV_BNIYA_18: string;
  TAARICH_SHLAV_BNIYA_29: string;
  TAARICH_SHLAV_BNIYA_39: string;
  TAARICH_SHLAV_BNIYA_42: string;
}

export interface ActiveConstructionSiteRecord {
  _id: number;
  work_id: number;
  site_name: string;
  executor_name: string;
  executor_id: number;
  foreman_name: string | null;
  has_cranes: number;
  city_name: string;
  build_types: string;
  safety_warrents: number; // intentional API typo — do not rename
  sanctions: number;
  sanctions_sum: number;
}

export interface PublicHousingRecord {
  _id: number;
  CityLMSName: string;
  Floor: number;
  NoRooms: number;
  OneRooms: number;
  TwoRooms: number;
  ThreeRooms: number;
  FourRooms: number;
  FiveRooms: number;
  SixRooms: number;
  SevenRooms: number;
  EightRooms: number;
  NineRooms: number;
  TenRooms: number;
  MoreRooms: number;
}

export interface PublicHousingVacancyRecord {
  _id: number;
  CityLmsName: string;
  CityLmsCode: number;
  NumOfRooms: number;
  Floor: number;
  TotalArea: number;
  ValidityDate: string;
  CompanyName: string;
  StatusName: string;
  StatusChangeDate: string;
  PropertyTypeName: string;
}

// --- Infrastructure Datasets ---

export interface RoadPlanRecord {
  _id: number;
  OBJECTID: string;
  TOCHNIT_NU: string;
  TOCHNIT_NA: string;
  STATUS: string;
  SHAPE_Leng: string;
  Shape_Length: string;
}

export interface RailPlanRecord {
  _id: number;
  OBJECTID: string;
  TOCHNIT_NU: string;
  TOCHNIT_NA: string;
  STATUS: string;
  SHAPE_Leng: string;
  Shape_Length: string;
}

export interface TransportProjectRecord {
  _id: number;
  FID: number;
  Main_ID: string;
  Main_Name: string;
  PRJ_NAME: string;
  PRJ_ID: string;
  PRJ_TYP: string;
  PRJ_SUBTYP: string;
  COMP_NAME: string;
  TAT_NAME: string;
  ORIG_YEAR: string;
  WP_YEAR: string;
  PRJ_COST: string;
  TAT_COST: string;
  EXEC_QRT: string;
  PRJ_END: string;
  TAT_STG: string;
  MS_UPDATE: string;
  LST_MS_NAM: string;
  LST_MS_QRT: string;
  LST_MS_TYP: string;
  NXT_MS_NAM: string;
  NXT_MS_QRT: string;
  NXT_MS_TYP: string;
  ROAD: string;
  Shape_Leng: number;
  Shape_Le_1: string;
  GEO_ID: string;
  COMP_ID: string;
  CR_PNIM: string;
}

export interface NationalTransportRecord {
  _id: number;
  OID: number;
  YEARMONTH: number;
  REMARKS: string;
  PLAN_LINK: string;
  PLAN_NAME: string;
  NAME: string;
  LABEL: string;
  STATUS: string;
  SUBJECT: string;
  ADRESS: string; // intentional API spelling
  Shape_Length: number;
  Shape_Area: number;
}

export interface MassTransitRecord {
  _id: number;
  OID: number;
  NAME: string;
  LINE_ID: number;
  TYPE: string; // "רכבת קלה", "BRT", "מטרו"
  YEAR: number;
  Shape_Length: number;
}

// --- Supporting Datasets ---

export interface ContractorRecord {
  _id: number;
  MISPAR_YESHUT: string;
  SHEM_YESHUT: string;
  MISPAR_KABLAN: string;
  SHEM_YISHUV: string;
  SHEM_REHOV: string;
  MISPAR_BAIT: string;
  TAARICH_KABLAN: string;
  MISPAR_TEL: string;
  EMAIL: string;
  KOD_ANAF: string;
  TEUR_ANAF: string;
  KVUTZA: string;
  SIVUG: string;
  TARICH_SUG: string;
  HEKEF: string;
  KABLAN_MUKAR: string;
  OVDIM: string;
  HEARA: string;
}

export interface BrokerRecord {
  _id: number;
  "מס רשיון": number;
  "שם המתווך": string;
  "עיר מגורים": string;
}

export interface AppraiserRecord {
  _id: number;
  "שם שמאי": string;
  "מספר רשיון": number;
  "מספר תיק": number;
  עיר: string;
}

export interface DevelopmentCostRecord {
  _id: number;
  ProjectID: number;
  ProjectName: string;
  MahozCode: number;
  MahozName: string;
  MashbashCode: number;
  MashbashName: string;
  LamasCode: number;
  LamasName: string;
  AtarCode: number;
  AtarName: string;
  LivingUnits: number;
  ProjectStatus: number;
  StatusDescription: string;
  TenderIndexDate: string;
  DevelopPay: number;
  OldByNewCost: number;
  MosdotDevPay: number;
  TenderDevPay: number;
}

export interface GreenBuildingRecord {
  _id: number;
  project_id: number;
  building_id: number;
  designation_id: number;
  project_halted: string;
  project_general_last_update: string;
  building_count: number;
  designation_count: number;
  gush: string;
  helka: string;
  X: number;
  Y: number;
  municipality_id: number;
  municipality_name: string;
  building_info_last_update: string;
  building_street: string;
  building_address_number: string;
  building_address_entrance: string;
  building_migrash: string;
  floors_above_ground: number;
  building_area: number;
  standard_name_id: number;
  standard_name: string;
  standard_designation_id: number;
  standard_designation_name: string;
  standard_designation_main_use: number;
  main_use_name: string;
  route: string;
  designation_area: number;
  residential_units: number;
  designation_info_last_update: string;
  certification_status: string;
  certificate_date_pre: string;
  certificate_insert_date_pre: string;
  certificate_score_pre: number;
  certificate_stars_pre: number;
  certificate_energy_pre: string;
  certificate_date_a: string;
  certificate_insert_date_a: string;
  certificate_score_a: number;
  certificate_stars_a: number;
  certificate_energy_a: string;
  certificate_date_b: string;
  certificate_insert_date_b: string;
  certificate_score_b: number;
  certificate_stars_b: number;
  certificate_energy_b: string;
  designation_info_status: string;
}
