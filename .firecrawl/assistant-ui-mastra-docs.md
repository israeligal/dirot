Mastra

Integrate Mastra directly into your Next.js application's API routes. This approach keeps your backend and frontend code within the same project.

### [Initialize assistant-ui](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration\#initialize-assistant-ui)

Start by setting up assistant-ui in your project. Run one of the following commands:

New Project

```
npx assistant-ui@latest create
```

Existing Project

```
npx assistant-ui@latest init
```

This command installs necessary dependencies and creates basic configuration files, including a default chat API route.

Need Help?

For detailed setup instructions, including adding API keys, basic
configuration, and manual setup steps, please refer to the main [Getting\\
Started guide](https://www.assistant-ui.com/docs).

### [Review Initial API Route](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration\#review-initial-api-route)

The initialization command creates a basic API route at `app/api/chat/route.ts` (or `src/app/api/chat/route.ts`). It typically looks like this:

app/api/chat/route.ts

```
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
  });

  return result.toUIMessageStreamResponse();
}
```

This default route uses the Vercel AI SDK directly with OpenAI. In the following steps, we will modify this route to integrate Mastra.

### [Install Mastra Packages](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration\#install-mastra-packages)

Add the `@mastra/core` package and its peer dependency `zod` (which you can use later inside tools for example). Also add `@mastra/ai-sdk` to convert Mastra's stream to an AI SDK-compatible format:

npmpnpmyarnbunxpm

```
npm install @mastra/core@latest @mastra/ai-sdk@latest zod@latest
```

### [Configure Next.js](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration\#configure-nextjs)

To ensure Next.js correctly bundles your application when using Mastra directly in API routes, you need to configure `serverExternalPackages`.

Update your `next.config.mjs` (or `next.config.js`) file to include `@mastra/*`:

next.config.mjs

```
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@mastra/*"],
  // ... other configurations
};

export default nextConfig;
```

This tells Next.js to treat Mastra packages as external dependencies on the server-side.

### [Create Mastra Files](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration\#create-mastra-files)

Set up the basic folder structure for your Mastra configuration. Create a `mastra` folder (e.g., in your `src` or root directory) with the following structure:

Project Structure

```
/
├── mastra/
│   ├── agents/
│   │   └── chefAgent.ts
│   └── index.ts
└── ... (rest of your project)
```

You can create these files and folders manually or use the following commands in your terminal:

```
mkdir -p mastra/agents
touch mastra/index.ts mastra/agents/chefAgent.ts
```

These files will be used in the next steps to define your Mastra agent and configuration.

### [Define the Agent](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration\#define-the-agent)

Now, let's define the behavior of our AI agent. Open the `mastra/agents/chefAgent.ts` file and add the following code:

mastra/agents/chefAgent.ts

```
import { Agent } from "@mastra/core/agent";

export const chefAgent = new Agent({
  name: "chef-agent",
  instructions:
    "You are Michel, a practical and experienced home chef. " +
    "You help people cook with whatever ingredients they have available.",
  model: "openai/gpt-4o-mini",
});
```

This code creates a new Mastra `Agent` named `chef-agent`.

- `instructions`: Defines the agent's persona and primary goal.
- `model`: Specifies the language model the agent will use (in this case, OpenAI's GPT-4o Mini via Mastra's model router).

Make sure you have set up your OpenAI API key as described in the [Getting Started guide](https://www.assistant-ui.com/docs).

### [Register the Agent](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration\#register-the-agent)

Next, register the agent with your Mastra instance. Open the `mastra/index.ts` file and add the following code:

mastra/index.ts

```
import { Mastra } from "@mastra/core";
import { chefAgent } from "./agents/chefAgent";

export const mastra = new Mastra({
  agents: { chefAgent },
});
```

This code initializes Mastra and makes the `chefAgent` available for use in your application's API routes.

### [Modify the API Route](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration\#modify-the-api-route)

Now, update your API route (`app/api/chat/route.ts`) to use the Mastra agent you just configured. Replace the existing content with the following:

app/api/chat/route.ts

```
import { createUIMessageStreamResponse } from "ai";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { mastra } from "@/mastra"; // Adjust the import path if necessary

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Extract the messages from the request body
  const { messages } = await req.json();

  // Get the chefAgent instance from Mastra
  const agent = mastra.getAgent("chefAgent");

  // Stream the response using the agent
  const stream = await agent.stream(messages);

  // Create a Response that streams the UI message stream to the client
  return createUIMessageStreamResponse({
    stream: toAISdkFormat(stream, { from: "agent" }),
  });
}
```

Key changes:

- We import the `mastra` instance created in `mastra/index.ts`. Make sure the import path (`@/mastra`) is correct for your project setup (you might need `~/mastra`, `../../../mastra`, etc., depending on your path aliases and project structure).
- We retrieve the `chefAgent` using `mastra.getAgent("chefAgent")`.
- Instead of calling the AI SDK's `streamText` directly, we call `agent.stream(messages)` to process the chat messages using the agent's configuration and model.
- The result is still returned in a format compatible with assistant-ui using `createUIMessageStreamResponse()` and `toAISdkFormat()`.

Your API route is now powered by Mastra!

### [Run the Application](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration\#run-the-application)

You're all set! Start your Next.js development server:

```
npm run dev
```

Open your browser to `http://localhost:3000` (or the port specified in your terminal). You should now be able to interact with your `chefAgent` through the assistant-ui chat interface. Ask it for cooking advice based on ingredients you have!

Congratulations! You have successfully integrated Mastra into your Next.js application using the full-stack approach. Your assistant-ui frontend now communicates with a Mastra agent running in your Next.js backend API route.

To explore more advanced Mastra features like memory, tools, workflows, and more, please refer to the [official Mastra documentation](https://mastra.ai/docs).

On this page

- [Initialize assistant-ui](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration#initialize-assistant-ui)
- [Review Initial API Route](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration#review-initial-api-route)
- [Install Mastra Packages](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration#install-mastra-packages)
- [Configure Next.js](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration#configure-nextjs)
- [Create Mastra Files](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration#create-mastra-files)
- [Define the Agent](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration#define-the-agent)
- [Register the Agent](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration#register-the-agent)
- [Modify the API Route](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration#modify-the-api-route)
- [Run the Application](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration#run-the-application)

Copy page [View as Markdown](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration.mdx) [Edit on GitHub](https://github.com/assistant-ui/assistant-ui/edit/main/apps/docs/content/docs/runtimes/mastra/full-stack-integration.mdx) Ask AI

[We are hiring\\
\\
Build the future of agentic UI with us →](https://www.assistant-ui.com/careers)

Ask me anything about assistant-ui

![GPT-5.4 Nano](https://www.assistant-ui.com/icons/openai.svg)GPT-5.4 NanoGPT-5.4 NanoGPT-5.4 MiniClaude Haiku 4.5Gemini 3 FlashGrok 4.1 FastGrok 3 Mini FastLlama 3.3 70BQwen3 32B

New thread

0 (0%)

![GPT-5.4 Nano](https://www.assistant-ui.com/icons/openai.svg)GPT-5.4 NanoGPT-5.4 NanoGPT-5.4 MiniClaude Haiku 4.5Gemini 3 FlashGrok 4.1 FastGrok 3 Mini FastLlama 3.3 70BQwen3 32B