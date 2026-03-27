"use client";

import { useState, useEffect, useCallback } from "react";

interface Profile {
  investorType: string | null;
  investmentHorizon: string | null;
  riskTolerance: string | null;
  budgetRange: string | null;
  experienceLevel: string | null;
  areasOfInterest: string | null;
  responseStyle: string | null;
  customInstructions: string | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data.profile);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateField = useCallback(
    async ({ field, value }: { field: string; value: string | null }) => {
      setProfile((prev) =>
        prev ? { ...prev, [field]: value } : ({ [field]: value } as Profile),
      );

      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field, value }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProfile(data.profile);
      } catch {
        fetchProfile();
      }
    },
    [fetchProfile],
  );

  return { profile, isLoading, updateField, refetch: fetchProfile };
}
