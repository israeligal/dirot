import { handleChatStream } from "@mastra/ai-sdk";
import { toAISdkV5Messages } from "@mastra/ai-sdk/ui";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "@/mastra";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPostHogClient } from "@/lib/posthog-server";
import { checkRateLimit } from "@/app/lib/rate-limit";

const CHAT_MAX_DURATION_SECONDS = 120;
export const maxDuration = CHAT_MAX_DURATION_SECONDS;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success: rateLimitOk, remaining } = await checkRateLimit({
    identifier: session.user.id,
    endpoint: "chat",
  });
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const threadId = `dirot-${session.user.id}`;
  const resourceId = session.user.id;

  const params = await req.json();
  getPostHogClient().capture({
    distinctId: session.user.id,
    event: "chat_message_sent",
  });

  const stream = await handleChatStream({
    version: "v6",
    mastra,
    agentId: "dirotAgent",
    params: {
      ...params,
      memory: {
        ...params.memory,
        thread: threadId,
        resource: resourceId,
      },
    },
    defaultOptions: {
      maxSteps: 10,
    },
  });
  return createUIMessageStreamResponse({ stream });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threadId = `dirot-${session.user.id}`;
  const resourceId = session.user.id;

  const memory = await mastra.getAgentById("dirot-agent").getMemory();
  let response = null;

  try {
    response = await memory?.recall({
      threadId,
      resourceId,
    });
  } catch (err) {
    console.error("[chat] Failed to recall messages:", err);
  }

  const uiMessages = toAISdkV5Messages(response?.messages || []);
  return NextResponse.json(uiMessages);
}
