"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { cn } from "@/lib/utils";

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-500",
  B: "bg-blue-500",
  C: "bg-amber-500",
  D: "bg-orange-500",
  F: "bg-red-500",
};

const GRADE_TEXT_COLORS: Record<string, string> = {
  A: "text-emerald-700",
  B: "text-blue-700",
  C: "text-amber-700",
  D: "text-orange-700",
  F: "text-red-700",
};

function getStageColor(status: string | null): string {
  if (!status) return "bg-slate-200 text-slate-600";
  if (status.includes("בביצוע") || status.includes("בנייה"))
    return "bg-emerald-100 text-emerald-700";
  if (status.includes("היתר") || status.includes("רישוי"))
    return "bg-blue-100 text-blue-700";
  if (status.includes("תוקף") || status.includes("אישור"))
    return "bg-teal-100 text-teal-700";
  if (status.includes("הפקדה"))
    return "bg-amber-100 text-amber-700";
  if (status.includes("הכרזה"))
    return "bg-orange-100 text-orange-700";
  return "bg-slate-200 text-slate-600";
}

interface PropertyData {
  address: { city: string; street: string; houseNumber?: string; label: string };
  score: { totalScore: number; grade: string; weightProfile: string } | null;
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
  developer: { found: boolean; name: string | null; confidence: string | null };
  infrastructureScore: number;
  risks: string[];
  sourceCount: number;
}

function ScoreBar({ score, grade }: { score: number; grade: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div
            className={cn("h-2 rounded-full transition-all", GRADE_COLORS[grade] ?? "bg-slate-400")}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>
      <span className={cn("text-lg font-bold tabular-nums", GRADE_TEXT_COLORS[grade] ?? "text-slate-600")}>
        {score}
      </span>
      <span className={cn("text-sm font-semibold", GRADE_TEXT_COLORS[grade] ?? "text-slate-600")}>
        {grade}
      </span>
    </div>
  );
}

function PropertyCard({
  property,
  isBest,
  isWorst,
}: {
  property: PropertyData;
  isBest: boolean;
  isWorst: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-[200px] flex-1 snap-center rounded-lg border p-3 transition-shadow",
        isBest && "ring-2 ring-emerald-500/30",
        isWorst && "ring-2 ring-red-500/30",
        !isBest && !isWorst && "border-slate-200",
      )}
    >
      {/* Address */}
      <div className="mb-3">
        <div className="font-semibold text-sm text-slate-800">
          {property.address.street} {property.address.houseNumber}
        </div>
        <div className="text-xs text-slate-500">{property.address.city}</div>
        {isBest && (
          <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            הטוב ביותר
          </span>
        )}
      </div>

      {/* Score */}
      <div className="mb-3">
        {property.score ? (
          <ScoreBar score={property.score.totalScore} grade={property.score.grade} />
        ) : (
          <div className="flex h-8 items-center text-xs text-slate-400 border border-dashed rounded px-2">
            ציון לא זמין
          </div>
        )}
      </div>

      {/* Stage */}
      <div className="mb-2">
        <div className="text-[10px] font-medium uppercase text-slate-400 mb-1">שלב</div>
        {property.project.found ? (
          <span
            className={cn(
              "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
              getStageColor(property.project.status),
            )}
          >
            {property.project.status ?? "לא ידוע"}
          </span>
        ) : (
          <span className="text-xs text-slate-400">לא נמצא פרויקט</span>
        )}
      </div>

      {/* Units */}
      {property.project.found && (
        <div className="mb-2">
          <div className="text-[10px] font-medium uppercase text-slate-400 mb-1">יחידות דיור</div>
          <div className="text-sm text-slate-700">
            {property.project.existingUnits ?? "—"}
            <span className="mx-1 text-slate-400">&larr;</span>
            {property.project.totalProposedUnits ?? "—"}
            {property.project.additionalUnits != null && (
              <span className="text-xs text-emerald-600 ms-1">
                (+{property.project.additionalUnits})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Developer */}
      <div className="mb-2">
        <div className="text-[10px] font-medium uppercase text-slate-400 mb-1">יזם</div>
        {property.developer.found ? (
          <div className="text-xs text-slate-700">
            {property.developer.name}
            {property.developer.confidence === "low" && (
              <span className="ms-1 text-[10px] text-amber-500">(אפשרי)</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400">לא זוהה</span>
        )}
      </div>

      {/* Infrastructure */}
      <div className="mb-2">
        <div className="text-[10px] font-medium uppercase text-slate-400 mb-1">תשתיות</div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 flex-1 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-blue-400"
              style={{ width: `${property.infrastructureScore}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-slate-500">
            {property.infrastructureScore}
          </span>
        </div>
      </div>

      {/* Risks */}
      {property.risks.length > 0 && (
        <div>
          <div className="text-[10px] font-medium uppercase text-slate-400 mb-1">סיכונים</div>
          <div className="flex flex-col gap-0.5">
            {property.risks.map((risk, i) => (
              <span key={i} className="text-[11px] text-red-600">
                {risk}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const ComparisonTableUI = makeAssistantToolUI({
  toolName: "compare-properties",
  render: ({ status, result }) => {
    if (status.type === "running") {
      return (
        <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            השוואת נכסים
          </div>
          <div className="flex gap-3 px-4 py-4">
            {[1, 2].map((i) => (
              <div key={i} className="min-w-[200px] flex-1 animate-pulse space-y-3 rounded-lg border border-slate-200 p-3">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-1/2 rounded bg-slate-200" />
                <div className="h-8 w-full rounded bg-slate-200" />
                <div className="h-3 w-2/3 rounded bg-slate-200" />
                <div className="h-3 w-1/2 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!result) return null;

    const { properties, rankings } = result as {
      properties: PropertyData[];
      rankings: { bestScore: number; worstScore: number };
    };

    return (
      <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          <span>השוואת נכסים</span>
          <span className="text-slate-400">{properties.length} נכסים</span>
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 py-4">
          {properties.map((property, index) => (
            <PropertyCard
              key={index}
              property={property}
              isBest={index === rankings.bestScore && properties.length > 1}
              isWorst={
                index === rankings.worstScore &&
                properties.length > 1 &&
                rankings.bestScore !== rankings.worstScore
              }
            />
          ))}
        </div>
      </div>
    );
  },
});
