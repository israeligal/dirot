export function trimRecord<T extends object>(record: T): T {
  const trimmed = { ...record };
  for (const key of Object.keys(trimmed) as (keyof T)[]) {
    const value = trimmed[key];
    if (typeof value === "string") {
      (trimmed[key] as string & T[keyof T]) = value.trim() as T[keyof T] & string;
    }
  }
  return trimmed;
}

export function formatGovMapUrl({ city }: { city: string }): string {
  const encoded = encodeURIComponent(city.trim());
  return `https://www.govmap.gov.il/?q=${encoded}&z=14`;
}

export function parseStringNumber({ value }: { value: string }): number {
  if (!value) return 0;
  const cleaned = value.trim().replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}
