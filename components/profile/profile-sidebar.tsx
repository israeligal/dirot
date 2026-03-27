"use client";

import { MessagesSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useProfile } from "@/hooks/use-profile";
import { ProfileField } from "@/components/profile/profile-field";
import { AreaTags } from "@/components/profile/area-tags";
import { ToneSelector } from "@/components/profile/tone-selector";
import { CustomInstructions } from "@/components/profile/custom-instructions";

const FIELD_OPTIONS: Record<string, string[]> = {
  investorType: ["מגורים", "השקעה", "שניהם"],
  investmentHorizon: ["קצר (1-3)", "בינוני (3-7)", "ארוך (7+)"],
  riskTolerance: ["שמרני", "מאוזן", "אגרסיבי"],
  budgetRange: ["עד 1.5M", "1.5-2.5M", "2.5-4M", "4M+"],
  experienceLevel: ["ראשון", "יש ניסיון", "מנוסה"],
};

const FIELD_LABELS: Record<string, string> = {
  investorType: "סוג",
  investmentHorizon: "אופק",
  riskTolerance: "סיכון",
  budgetRange: "תקציב",
  experienceLevel: "ניסיון",
};

const PROFILE_FIELDS = [
  "investorType",
  "investmentHorizon",
  "riskTolerance",
  "budgetRange",
  "experienceLevel",
] as const;

function parseAreas({ areasOfInterest }: { areasOfInterest: string | null }): string[] {
  if (!areasOfInterest) return [];
  return areasOfInterest
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ProfileSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { profile, isLoading, updateField } = useProfile();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="mb-2 border-b">
        <div className="flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <MessagesSquare className="size-4" />
                </div>
                <div className="me-6 flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">דירות</span>
                  <span className="text-xs text-muted-foreground">
                    אנליסט פינוי בינוי
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {isLoading ? (
          <div className="flex flex-col gap-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                פרופיל משקיע
              </h3>
              <p className="text-xs text-muted-foreground">לחץ לעריכה</p>
            </div>

            {PROFILE_FIELDS.map((field) => (
              <ProfileField
                key={field}
                label={FIELD_LABELS[field]}
                value={profile?.[field] ?? null}
                options={FIELD_OPTIONS[field]}
                onSelect={({ value }) => updateField({ field, value })}
              />
            ))}

            <AreaTags
              areas={parseAreas({
                areasOfInterest: profile?.areasOfInterest ?? null,
              })}
              onUpdate={({ areas }) =>
                updateField({
                  field: "areasOfInterest",
                  value: areas.length > 0 ? areas.join(", ") : null,
                })
              }
            />

            <div className="border-t border-border" />

            <ToneSelector
              value={profile?.responseStyle ?? null}
              onSelect={({ tone }) =>
                updateField({ field: "responseStyle", value: tone })
              }
            />

            <div className="border-t border-border" />

            <CustomInstructions
              value={profile?.customInstructions ?? null}
              onSave={({ instructions }) =>
                updateField({
                  field: "customInstructions",
                  value: instructions || null,
                })
              }
            />

            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <MessagesSquare className="size-3.5 shrink-0" />
              <span>הצ׳אט גם יעדכן את הפרופיל אוטומטית</span>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
