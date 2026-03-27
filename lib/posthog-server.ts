import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
    if (!token) {
      console.warn("[posthog-server] NEXT_PUBLIC_POSTHOG_TOKEN not set — events will be dropped");
    }
    posthogClient = new PostHog(token ?? "noop", {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
      disabled: !token,
    });
  }
  return posthogClient;
}
