"use client";

import { cn } from "@/lib/utils";

const TONES = ["מקצועי", "תמציתי", "מפורט", "חם", "לימודי"] as const;

interface ToneSelectorProps {
  value: string | null;
  onSelect: ({ tone }: { tone: string }) => void;
}

export function ToneSelector({ value, onSelect }: ToneSelectorProps) {
  const activeTone = value ?? "מקצועי";

  return (
    <div>
      <span className="mb-2 block text-xs text-muted-foreground">
        סגנון תשובה
      </span>
      <div className="flex flex-wrap gap-1.5">
        {TONES.map((tone) => (
          <button
            key={tone}
            type="button"
            onClick={() => onSelect({ tone })}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              tone === activeTone
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            {tone}
          </button>
        ))}
      </div>
    </div>
  );
}
