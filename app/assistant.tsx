"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { UpdateTodosToolUI } from "@/components/tools/todo";
import { AskForPlanApprovalToolUI } from "@/components/tools/plan-approval";
import { RequestInputToolUI } from "@/components/tools/human-in-the-loop";
import { ComparisonTableUI } from "@/components/tools/comparison-table";
import { ScoreCardUI } from "@/components/tools/score-card";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import posthog from "posthog-js";

export const Assistant = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const handleSignOut = async () => {
    posthog.capture("user_signed_out");
    posthog.reset();
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/login"),
      },
    });
  };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pe-0.5">
          <ThreadListSidebar side="right" />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="me-2 h-4 border-border"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>דירות - אנליסט פינוי בינוי</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="me-auto" />
              {session?.user && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {session.user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    title="התנתקות"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </div>
              )}
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread />
              <UpdateTodosToolUI />
              <AskForPlanApprovalToolUI />
              <RequestInputToolUI />
              <ComparisonTableUI />
              <ScoreCardUI />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
