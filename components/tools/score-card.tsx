import { makeAssistantToolUI } from "@assistant-ui/react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreProjectArgs {
  city: string;
  neighborhood?: string;
  contractorName?: string;
  projectStatus?: string;
}

interface Factor {
  name: string;
  weight: number;
  score: number;
  weightedScore: number;
  detail: string;
}

interface DroppedFactor {
  name: string;
  reason: string;
}

interface ScoreProjectResult {
  summary: string;
  totalScore: number;
  grade: string;
  weightProfile: string;
  factors: Factor[];
  droppedFactors: DroppedFactor[];
  sources: { dataset: string; resourceId: string; fetchedAt: string; url: string }[];
}

const GRADE_COLORS: Record<string, { text: string; bar: string }> = {
  A: { text: "text-green-600", bar: "bg-green-500" },
  B: { text: "text-blue-600", bar: "bg-blue-500" },
  C: { text: "text-yellow-600", bar: "bg-yellow-500" },
  D: { text: "text-orange-600", bar: "bg-orange-500" },
  F: { text: "text-red-600", bar: "bg-red-500" },
};

function getGradeColors({ grade }: { grade: string }) {
  return GRADE_COLORS[grade] ?? GRADE_COLORS.C;
}

export const ScoreCardUI = makeAssistantToolUI<ScoreProjectArgs, ScoreProjectResult>({
  toolName: "scoreProject",
  render: function Render({ result, status }) {
    if (status.type === "running") {
      return (
        <div className="my-3 overflow-hidden rounded-lg border border-border bg-white shadow-xs">
          <div className="border-b border-border bg-muted/30 px-4 py-2">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-9 w-12 animate-pulse rounded bg-muted" />
              <div className="h-2 flex-1 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-2.5 w-12 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (!result) return null;

    const colors = getGradeColors({ grade: result.grade });

    return (
      <div className="my-3 overflow-hidden rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            ציון השקעה
          </span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className={cn("h-3.5 w-3.5", colors.text)} />
            <span className={cn("text-xs font-semibold", colors.text)}>
              {result.grade}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {result.totalScore}
            </span>
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={cn("h-2 rounded-full transition-all duration-700 ease-out", colors.bar)}
                  style={{ width: `${result.totalScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-x-4 gap-y-2">
            {result.factors.map((factor) => (
              <div key={factor.name} title={factor.detail}>
                <div className="text-[11px] text-muted-foreground">
                  {factor.name}
                </div>
                <div className="text-sm font-semibold tabular-nums text-foreground">
                  {Math.round(factor.score)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
});
