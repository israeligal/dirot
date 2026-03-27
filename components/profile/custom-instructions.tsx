"use client";

import { useState, useRef } from "react";

interface CustomInstructionsProps {
  value: string | null;
  onSave: ({ instructions }: { instructions: string }) => void;
}

export function CustomInstructions({ value, onSave }: CustomInstructionsProps) {
  const [text, setText] = useState(value ?? "");
  const originalRef = useRef(value ?? "");

  const handleBlur = () => {
    const trimmed = text.trim();
    if (trimmed !== originalRef.current) {
      onSave({ instructions: trimmed });
      originalRef.current = trimmed;
    }
  };

  return (
    <div>
      <span className="mb-1 block text-xs text-muted-foreground">
        הוראות מותאמות
      </span>
      <textarea
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={handleBlur}
        placeholder="הוראות נוספות לסוכן..."
        className="w-full resize-none rounded-lg bg-muted/30 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
