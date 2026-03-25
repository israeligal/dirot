We use tracking cookies to understand how you use the product and help us improve it. Please accept cookies to help us improve.

Accept cookiesDecline cookies

[Skip to main content](https://mastra.ai/guides/getting-started/next-js#__docusaurus_skipToContent_fallback)

[mastra.ai, Back to docs homepage](https://mastra.ai/docs)

[Docs](https://mastra.ai/docs) [Models](https://mastra.ai/models) [Guides](https://mastra.ai/guides) [Reference](https://mastra.ai/reference) [Learnnew](https://mastra.ai/learn)

[GitHub repository](https://github.com/mastra-ai/mastra)

Search documentation
`CTRL + K`

Ask AI

Open main menu

Latest Version

- [Overview](https://mastra.ai/guides/)
- [Getting Started](https://mastra.ai/guides/getting-started/quickstart)

  - [Quickstart](https://mastra.ai/guides/getting-started/quickstart)
  - [Next.js](https://mastra.ai/guides/getting-started/next-js)
  - [React](https://mastra.ai/guides/getting-started/vite-react)
  - [Astro](https://mastra.ai/guides/getting-started/astro)
  - [SvelteKit](https://mastra.ai/guides/getting-started/sveltekit)
  - [Nuxt](https://mastra.ai/guides/getting-started/nuxt)
  - [Express](https://mastra.ai/guides/getting-started/express)
  - [Hono](https://mastra.ai/guides/getting-started/hono)
  - [Electron](https://mastra.ai/guides/getting-started/electron)
- [Concepts](https://mastra.ai/guides/concepts/multi-agent-systems)

  - [Multi-agent systems](https://mastra.ai/guides/concepts/multi-agent-systems)
- [Agent Frameworks](https://mastra.ai/guides/agent-frameworks/ai-sdk)

  - [AI SDK](https://mastra.ai/guides/agent-frameworks/ai-sdk)
- [Agentic UIs](https://mastra.ai/guides/build-your-ui/ai-sdk-ui)

  - [AI SDK UI](https://mastra.ai/guides/build-your-ui/ai-sdk-ui)
  - [CopilotKit](https://mastra.ai/guides/build-your-ui/copilotkit)
  - [Assistant UI](https://mastra.ai/guides/build-your-ui/assistant-ui)
- [Deployment](https://mastra.ai/guides/deployment/amazon-ec2)

  - [Amazon EC2](https://mastra.ai/guides/deployment/amazon-ec2)
  - [AWS Lambda](https://mastra.ai/guides/deployment/aws-lambda)
  - [Azure App Services](https://mastra.ai/guides/deployment/azure-app-services)
  - [Cloudflare](https://mastra.ai/guides/deployment/cloudflare)
  - [Digital Ocean](https://mastra.ai/guides/deployment/digital-ocean)
  - [Netlify](https://mastra.ai/guides/deployment/netlify)
  - [Vercel](https://mastra.ai/guides/deployment/vercel)
  - [Inngest](https://mastra.ai/guides/deployment/inngest)
- [Tutorials](https://mastra.ai/guides/guide/chef-michel)

  - [Fundamentals](https://mastra.ai/guides/guide/chef-michel)

  - [Multi-agent systems](https://mastra.ai/guides/guide/research-coordinator)

  - [Workspaces](https://mastra.ai/guides/guide/dev-assistant)

  - [WhatsApp Chat Bot](https://mastra.ai/guides/guide/whatsapp-chat-bot)
  - [GitHub Actions: PR Description](https://mastra.ai/guides/guide/github-actions-pr-description)
- [Migrations](https://mastra.ai/guides/migrations/upgrade-to-v1/overview)

  - [v1.0](https://mastra.ai/guides/migrations/upgrade-to-v1/overview)

  - [VNext → Standard APIs](https://mastra.ai/guides/migrations/vnext-to-standard-apis)
  - [AgentNetwork → .network()](https://mastra.ai/guides/migrations/agentnetwork)
  - [.network() → Supervisor Agents](https://mastra.ai/guides/migrations/network-to-supervisor)
  - [AI SDK v4 → v5](https://mastra.ai/guides/migrations/ai-sdk-v4-to-v5)

system mode

- Getting Started
- Next.js

Copy markdown

On this page

# Integrate Mastra in your Next.js project

In this guide, you'll build a tool-calling AI agent using Mastra, then connect it to Next.js by importing and calling the agent directly from your routes.

You'll use [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview) and [AI Elements](https://ai-sdk.dev/elements) to create a beautiful, interactive chat experience.

![Screenshot of a chat-style web app displaying a completed &quot;weatherTool&quot; tool call, answering &quot;What is the weather in London?&quot; with a JSON result. A message suggests offering activity ideas, and a text input field is at the bottom.](https://mastra.ai/assets/images/nextjs-quickstart-11fce4f78d172367bb97a14f132d701f.png)

What you'll build: an agent that can call a weather tool, display the JSON result, stream a weather summary in the chat UI, and persist conversation history across reloads.

## Before you begin [Direct link to Before you begin](https://mastra.ai/guides/getting-started/next-js\#before-you-begin "Direct link to Before you begin")

- You'll need an API key from a supported [model provider](https://mastra.ai/models). If you don't have a preference, use [OpenAI](https://mastra.ai/models/providers/openai).
- Install Node.js `v22.13.0` or later

## Create a new Next.js app (optional) [Direct link to Create a new Next.js app (optional)](https://mastra.ai/guides/getting-started/next-js\#create-a-new-nextjs-app-optional "Direct link to Create a new Next.js app (optional)")

If you already have a Next.js app, skip to the next step.

Run the following command to [create a new Next.js app](https://nextjs.org/docs/app/getting-started/installation):

- npm
- pnpm
- Yarn
- Bun

```bash
npx create-next-app@latest my-nextjs-agent --yes --ts --eslint --tailwind --src-dir --app --turbopack --no-react-compiler --no-import-alias
```

```bash
pnpm dlx create-next-app@latest my-nextjs-agent --yes --ts --eslint --tailwind --src-dir --app --turbopack --no-react-compiler --no-import-alias
```

```bash
yarn dlx create-next-app@latest my-nextjs-agent --yes --ts --eslint --tailwind --src-dir --app --turbopack --no-react-compiler --no-import-alias
```

```bash
bun x create-next-app@latest my-nextjs-agent --yes --ts --eslint --tailwind --src-dir --app --turbopack --no-react-compiler --no-import-alias
```

This creates a project called `my-nextjs-agent`, but you can replace it with any name you want.

## Initialize Mastra [Direct link to Initialize Mastra](https://mastra.ai/guides/getting-started/next-js\#initialize-mastra "Direct link to Initialize Mastra")

Navigate to your Next.js project:

```bash
cd my-nextjs-agent
```

Run [`mastra init`](https://mastra.ai/reference/cli/mastra#mastra-init). When prompted, choose a provider (e.g. OpenAI) and enter your key:

- npm
- pnpm
- Yarn
- Bun

```bash
npx mastra@latest init
```

```bash
pnpm dlx mastra@latest init
```

```bash
yarn dlx mastra@latest init
```

```bash
bun x mastra@latest init
```

This creates a `src/mastra` folder with an example weather agent and the following files:

- `index.ts` \- Mastra config, including memory
- `tools/weather-tool.ts` \- a tool to fetch weather for a given location
- `agents/weather-agent.ts`\- a weather agent with a prompt that uses the tool

You'll call `weather-agent.ts` from your Next.js routes in the next steps.

Using Mastra Studio alongside Next.js

If you want to run `mastra dev` (Mastra Studio) alongside your Next.js app and have both share the same database, update the storage URL in `src/mastra/index.ts` to use an absolute path:

```typescript
url: 'file:/absolute/path/to/your/project/mastra.db'
```

Relative paths resolve based on each process's working directory, which differs between `next dev` and `mastra dev`.

## Install AI SDK UI & AI elements [Direct link to Install AI SDK UI & AI elements](https://mastra.ai/guides/getting-started/next-js\#install-ai-sdk-ui--ai-elements "Direct link to Install AI SDK UI & AI elements")

Install AI SDK UI along with the Mastra adapter:

- npm
- pnpm
- Yarn
- Bun

```bash
npm install @mastra/ai-sdk@latest @ai-sdk/react ai
```

```bash
pnpm add @mastra/ai-sdk@latest @ai-sdk/react ai
```

```bash
yarn add @mastra/ai-sdk@latest @ai-sdk/react ai
```

```bash
bun add @mastra/ai-sdk@latest @ai-sdk/react ai
```

Next, initialize AI Elements. When prompted, choose the default options:

- npm
- pnpm
- Yarn
- Bun

```bash
npx ai-elements@latest
```

```bash
pnpm dlx ai-elements@latest
```

```bash
yarn dlx ai-elements@latest
```

```bash
bun x ai-elements@latest
```

This downloads the entire AI Elements UI component library into a `@/components/ai-elements` folder.

## Create a chat route [Direct link to Create a chat route](https://mastra.ai/guides/getting-started/next-js\#create-a-chat-route "Direct link to Create a chat route")

Create `src/app/api/chat/route.ts`:

src/app/api/chat/route.ts

```ts
import { handleChatStream } from '@mastra/ai-sdk'
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui'
import { createUIMessageStreamResponse } from 'ai'
import { mastra } from '@/mastra'
import { NextResponse } from 'next/server'

const THREAD_ID = 'example-user-id'
const RESOURCE_ID = 'weather-chat'

export async function POST(req: Request) {
  const params = await req.json()
  const stream = await handleChatStream({
    mastra,
    agentId: 'weather-agent',
    params: {
      ...params,
      memory: {
        ...params.memory,
        thread: THREAD_ID,
        resource: RESOURCE_ID,
      },
    },
  })
  return createUIMessageStreamResponse({ stream })
}

export async function GET() {
  const memory = await mastra.getAgentById('weather-agent').getMemory()
  let response = null

  try {
    response = await memory?.recall({
      threadId: THREAD_ID,
      resourceId: RESOURCE_ID,
    })
  } catch {
    console.log('No previous messages found.')
  }

  const uiMessages = toAISdkV5Messages(response?.messages || [])

  return NextResponse.json(uiMessages)
}
```

The `POST` route accepts a prompt and streams the agent's response back in AI SDK format, while the `GET` route fetches message history from memory so the UI can be hydrated when the client reloads.

## Create a chat page [Direct link to Create a chat page](https://mastra.ai/guides/getting-started/next-js\#create-a-chat-page "Direct link to Create a chat page")

Create `src/app/chat/page.tsx`:

src/app/chat/page.tsx

```tsx
'use client'

import '@/app/globals.css'
import { useEffect, useState } from 'react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'

import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'

import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'

import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'

function Chat() {
  const [input, setInput] = useState<string>('')

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch('/api/chat')
      const data = await res.json()
      setMessages([...data])
    }
    fetchMessages()
  }, [setMessages])

  const handleSubmit = async () => {
    if (!input.trim()) return

    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="relative size-full h-screen w-full p-6">
      <div className="flex h-full flex-col">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map(message => (
              <div key={message.id}>
                {message.parts?.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <Message key={`${message.id}-${i}`} from={message.role}>
                        <MessageContent>
                          <MessageResponse>{part.text}</MessageResponse>
                        </MessageContent>
                      </Message>
                    )
                  }

                  if (part.type?.startsWith('tool-')) {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        <ToolHeader
                          type={(part as ToolUIPart).type}
                          state={(part as ToolUIPart).state || 'output-available'}
                          className="cursor-pointer"
                        />
                        <ToolContent>
                          <ToolInput input={(part as ToolUIPart).input || {}} />
                          <ToolOutput
                            output={(part as ToolUIPart).output}
                            errorText={(part as ToolUIPart).errorText}
                          />
                        </ToolContent>
                      </Tool>
                    )
                  }

                  return null
                })}
              </div>
            ))}
            <ConversationScrollButton />
          </ConversationContent>
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-20">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={e => setInput(e.target.value)}
              className="md:leading-10"
              value={input}
              placeholder="Type your message..."
              disabled={status !== 'ready'}
            />
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  )
}

export default Chat
```

This component connects [`useChat()`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) to the `api/chat` endpoint, sending prompts there and streaming the response back in chunks.

It renders the response text using the [`<MessageResponse>`](https://ai-sdk.dev/elements/components/message#messageresponse-) component, and shows any tool invocations with the [`<Tool>`](https://ai-sdk.dev/elements/components/tool) component.

## Test your agent [Direct link to Test your agent](https://mastra.ai/guides/getting-started/next-js\#test-your-agent "Direct link to Test your agent")

1. Run your Next.js app with `npm run dev`
2. Open the chat at [http://localhost:3000/chat](http://localhost:3000/chat)
3. Try asking about the weather. If your API key is set up correctly, you'll get a response

## Next steps [Direct link to Next steps](https://mastra.ai/guides/getting-started/next-js\#next-steps "Direct link to Next steps")

Congratulations on building your Mastra agent with Next.js! 🎉

From here, you can extend the project with your own tools and logic:

- Learn more about [agents](https://mastra.ai/docs/agents/overview)
- Give your agent its own [tools](https://mastra.ai/docs/agents/using-tools)
- Add human-like [memory](https://mastra.ai/docs/memory/overview) to your agent

When you're ready, read more about how Mastra integrates with AI SDK UI and Next.js, and how to deploy your agent anywhere, including Vercel:

- Integrate Mastra with [AI SDK UI](https://mastra.ai/guides/build-your-ui/ai-sdk-ui)
- Deploy your agent to [Vercel](https://mastra.ai/guides/deployment/vercel)
- Deploy your agent [anywhere](https://mastra.ai/docs/deployment/overview)

[Edit this page on GitHub](https://github.com/mastra-ai/mastra/tree/main/docs/src/content/en/guides/getting-started/next-js.mdx) [llms.txt](https://mastra.ai/guides/getting-started/next-js/llms.txt)

[Previous\\
\\
Quickstart](https://mastra.ai/guides/getting-started/quickstart) [Next\\
\\
React](https://mastra.ai/guides/getting-started/vite-react)

On this page

- [Before you begin](https://mastra.ai/guides/getting-started/next-js#before-you-begin)
- [Create a new Next.js app (optional)](https://mastra.ai/guides/getting-started/next-js#create-a-new-nextjs-app-optional)
- [Initialize Mastra](https://mastra.ai/guides/getting-started/next-js#initialize-mastra)
- [Install AI SDK UI & AI elements](https://mastra.ai/guides/getting-started/next-js#install-ai-sdk-ui--ai-elements)
- [Create a chat route](https://mastra.ai/guides/getting-started/next-js#create-a-chat-route)
- [Create a chat page](https://mastra.ai/guides/getting-started/next-js#create-a-chat-page)
- [Test your agent](https://mastra.ai/guides/getting-started/next-js#test-your-agent)
- [Next steps](https://mastra.ai/guides/getting-started/next-js#next-steps)

Mastra Newsletter

SubscribeShare feedback

reCAPTCHA

Recaptcha requires verification.

[Privacy](https://www.google.com/intl/en/policies/privacy/) \- [Terms](https://www.google.com/intl/en/policies/terms/)

protected by **reCAPTCHA**

[Privacy](https://www.google.com/intl/en/policies/privacy/) \- [Terms](https://www.google.com/intl/en/policies/terms/)