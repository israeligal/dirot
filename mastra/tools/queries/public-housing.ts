/**
 * Public housing inventory and vacancies queries.
 */

import { getSql, formatResult } from "./shared";

export async function queryPublicHousing({
  city,
  limit = 20,
  offset = 0,
}: {
  city?: string;
  limit?: number;
  offset?: number;
}) {
  const inventoryRows = city
    ? await getSql()`SELECT *, COUNT(*) OVER() as total_count FROM public_housing_inventory WHERE city_lms_name ILIKE ${"%" + city + "%"} LIMIT ${limit} OFFSET ${offset}`
    : await getSql()`SELECT *, COUNT(*) OVER() as total_count FROM public_housing_inventory LIMIT ${limit} OFFSET ${offset}`;

  const vacancyRows = city
    ? await getSql()`SELECT *, COUNT(*) OVER() as total_count FROM public_housing_vacancies WHERE city_lms_name ILIKE ${"%" + city + "%"} LIMIT ${limit} OFFSET ${offset}`
    : await getSql()`SELECT *, COUNT(*) OVER() as total_count FROM public_housing_vacancies LIMIT ${limit} OFFSET ${offset}`;

  return {
    inventory: formatResult(inventoryRows),
    vacancies: formatResult(vacancyRows),
  };
}
