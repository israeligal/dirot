"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AreaTagsProps {
  areas: string[];
  onUpdate: ({ areas }: { areas: string[] }) => void;
}

export function AreaTags({ areas, onUpdate }: AreaTagsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setIsAdding(false);
      setInputValue("");
      return;
    }

    const isDuplicate = areas.some(
      (area) => area.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isDuplicate) {
      setIsAdding(false);
      setInputValue("");
      return;
    }

    onUpdate({ areas: [...areas, trimmed] });
    setInputValue("");
    setIsAdding(false);
  };

  const handleRemove = ({ city }: { city: string }) => {
    onUpdate({ areas: areas.filter((area) => area !== city) });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
    if (event.key === "Escape") {
      setIsAdding(false);
      setInputValue("");
    }
  };

  return (
    <div>
      <span className="mb-1 block text-xs text-muted-foreground">
        אזורי עניין
      </span>
      <div className="flex flex-wrap gap-1.5">
        {areas.map((city) => (
          <span
            key={city}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm text-primary"
          >
            {city}
            <button
              type="button"
              onClick={() => handleRemove({ city })}
              className="text-xs opacity-60 transition-opacity hover:opacity-100"
              aria-label={`הסר ${city}`}
            >
              &times;
            </button>
          </span>
        ))}

        {isAdding ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAdd}
            className={cn(
              "w-24 rounded-full border border-primary bg-transparent px-2.5 py-0.5 text-sm text-foreground outline-none",
              "placeholder:text-muted-foreground",
            )}
            placeholder="עיר..."
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center rounded-full border border-dashed border-border px-2.5 py-0.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            + עיר
          </button>
        )}
      </div>
    </div>
  );
}
