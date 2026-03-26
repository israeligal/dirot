import { db } from "../app/lib/db";
import { statisticalAreas } from "../app/lib/schema";
import { sql } from "drizzle-orm";

const ARCGIS_URL =
  "https://services5.arcgis.com/Uf22JfJFZDKuNwZ4/arcgis/rest/services/statistical_areas_2022/FeatureServer/0/query";

const BATCH_SIZE = 50; // Smaller batches — geometry strings are large

async function fetchStatisticalAreas() {
  console.log("Fetching statistical areas from ArcGIS Hub...");

  const allFeatures: Array<Record<string, unknown>> = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      f: "geojson",
      resultOffset: String(offset),
      resultRecordCount: String(limit),
    });

    const response = await fetch(`${ARCGIS_URL}?${params}`);
    if (!response.ok) {
      throw new Error(
        `ArcGIS fetch failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const features = data.features || [];

    if (features.length === 0) break;

    allFeatures.push(...features);
    console.log(`  Fetched ${allFeatures.length} features so far...`);

    if (features.length < limit) break;
    offset += limit;
  }

  console.log(`Total features fetched: ${allFeatures.length}`);
  return allFeatures;
}

function computeCentroid(geometry: {
  type: string;
  coordinates: number[][][][] | number[][][];
}): { lat: number; lng: number } {
  // For Polygon or MultiPolygon, average all coordinates
  let totalLat = 0;
  let totalLng = 0;
  let count = 0;

  const processCoords = (coords: number[][]) => {
    for (const [lng, lat] of coords) {
      totalLng += lng;
      totalLat += lat;
      count++;
    }
  };

  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates as number[][][]) {
      processCoords(ring);
    }
  } else if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates as number[][][][]) {
      for (const ring of polygon) {
        processCoords(ring);
      }
    }
  }

  return count > 0
    ? { lat: totalLat / count, lng: totalLng / count }
    : { lat: 0, lng: 0 };
}

async function syncStatisticalAreas() {
  const features = await fetchStatisticalAreas();

  if (features.length === 0) {
    console.log("No features fetched — aborting");
    return;
  }

  // Truncate
  console.log("Truncating statistical_areas table...");
  await db.execute(sql`TRUNCATE TABLE statistical_areas RESTART IDENTITY`);

  // Map features to records
  const records = features.map((f: any) => {
    const props = f.properties || {};
    const geometry = f.geometry || null;
    const centroid = geometry
      ? computeCentroid(geometry)
      : { lat: 0, lng: 0 };

    return {
      // Try common field names from CBS statistical area datasets
      statAreaCode: String(
        props.STAT_AREA ||
          props.stat_area ||
          props.SEMEL_YISHUV_STAT ||
          props.STAT11 ||
          ""
      ),
      cityCode: String(
        props.SEMEL_YISH ||
          props.city_code ||
          props.YISHUV_STAT ||
          ""
      ),
      cityName: String(
        props.SHEM_YISH || props.SHEM_YISHUV || props.city_name || ""
      ),
      areaName: String(
        props.SHEM_EZOR ||
          props.area_name ||
          props.SHEM_STAT ||
          ""
      ),
      population: props.POP_TOTAL ? Number(props.POP_TOTAL) : null,
      geometry: geometry ? JSON.stringify(geometry) : null,
      centroidLat: centroid.lat,
      centroidLng: centroid.lng,
    };
  });

  // Batch insert
  console.log(`Inserting ${records.length} statistical areas...`);
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    // @ts-expect-error — Drizzle dynamic table typing
    await db.insert(statisticalAreas).values(batch);
    console.log(
      `  Inserted ${Math.min(i + BATCH_SIZE, records.length)} / ${records.length}`
    );
  }

  console.log("Statistical areas sync complete");
}

syncStatisticalAreas()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
