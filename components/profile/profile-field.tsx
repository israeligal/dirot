"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ProfileFieldProps {
  label: string;
  value: string | null;
  options: string[];
  onSelect: ({ value }: { value: string }) => void;
}

export function ProfileField({
  label,
  value,
  options,
  onSelect,
}: ProfileFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors",
          value
            ? "bg-primary/10 text-primary"
            : "border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary",
        )}
      >
        {value ? (
          <>
            <span>{value}</span>
            <span className="text-xs opacity-60">&#9998;</span>
          </>
        ) : (
          <span>+ בחר</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full z-20 mt-1 min-w-36 rounded-lg border border-border bg-background p-1 shadow-xs">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onSelect({ value: option });
                setIsOpen(false);
              }}
              className={cn(
                "block w-full rounded-md px-3 py-1.5 text-start text-sm transition-colors",
                option === value
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
