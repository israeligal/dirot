We use tracking cookies to understand how you use the product and help us improve it. Please accept cookies to help us improve.

Accept cookiesDecline cookies

[Skip to main content](https://mastra.ai/reference/ai-sdk/handle-chat-stream#__docusaurus_skipToContent_fallback)

[mastra.ai, Back to docs homepage](https://mastra.ai/docs)

[Docs](https://mastra.ai/docs) [Models](https://mastra.ai/models) [Guides](https://mastra.ai/guides) [Reference](https://mastra.ai/reference) [Learnnew](https://mastra.ai/learn)

[GitHub repository](https://github.com/mastra-ai/mastra)

Search documentation
`CTRL + K`

Ask AI

Open main menu

Latest Version

- [Overview](https://mastra.ai/reference/)
- [Configuration](https://mastra.ai/reference/configuration)
- [Agents](https://mastra.ai/reference/agents/agent)

- [AI SDK](https://mastra.ai/reference/ai-sdk/chat-route)

  - [chatRoute()](https://mastra.ai/reference/ai-sdk/chat-route)
  - [handleChatStream()](https://mastra.ai/reference/ai-sdk/handle-chat-stream)
  - [handleNetworkStream()](https://mastra.ai/reference/ai-sdk/handle-network-stream)
  - [handleWorkflowStream()](https://mastra.ai/reference/ai-sdk/handle-workflow-stream)
  - [networkRoute()](https://mastra.ai/reference/ai-sdk/network-route)
  - [toAISdkStream()](https://mastra.ai/reference/ai-sdk/to-ai-sdk-stream)
  - [toAISdkV4Messages()](https://mastra.ai/reference/ai-sdk/to-ai-sdk-v4-messages)
  - [toAISdkV5Messages()](https://mastra.ai/reference/ai-sdk/to-ai-sdk-v5-messages)
  - [withMastra()](https://mastra.ai/reference/ai-sdk/with-mastra)
  - [workflowRoute()](https://mastra.ai/reference/ai-sdk/workflow-route)
- [Auth](https://mastra.ai/reference/auth/auth0)

- [CLI](https://mastra.ai/reference/cli/create-mastra)

- [Client SDK](https://mastra.ai/reference/client-js/agents)

- [Core](https://mastra.ai/reference/core/mastra-class)

- [Deployer](https://mastra.ai/reference/deployer/cloudflare)

- [Evals](https://mastra.ai/reference/evals/answer-relevancy)

- [Harness](https://mastra.ai/reference/harness/harness-class)

- [Memory](https://mastra.ai/reference/memory/clone-utilities)

- [Observability](https://mastra.ai/reference/datasets/dataset)

- [Processors](https://mastra.ai/reference/processors/batch-parts-processor)

- [RAG](https://mastra.ai/reference/rag/database-config)

- [Server](https://mastra.ai/reference/server/create-route)

- [Storage](https://mastra.ai/reference/storage/overview)

- [Streaming](https://mastra.ai/reference/streaming/ChunkType)

- [Templates](https://mastra.ai/reference/templates/overview)

- [Tools & MCP](https://mastra.ai/reference/tools/document-chunker-tool)

- [Vectors](https://mastra.ai/reference/vectors/s3vectors)

- [Voice](https://mastra.ai/reference/voice/azure)

- [Workflows](https://mastra.ai/reference/workflows/run)

- [Workspaces](https://mastra.ai/reference/workspace/agentfs-filesystem)


system mode

- AI SDK
- handleChatStream()

Copy markdown

On this page

# handleChatStream()

Framework-agnostic handler for streaming agent chat in AI SDK-compatible format. Use this function directly when you need to handle chat streaming outside Hono or Mastra's own [apiRoutes](https://mastra.ai/docs/server/custom-api-routes) feature.

`handleChatStream()` returns a `ReadableStream` that you can wrap with [`createUIMessageStreamResponse()`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream-response).

`handleChatStream()` keeps the existing AI SDK v5/default behavior. If your app is typed against AI SDK v6, pass `version: 'v6'`.

Use [`chatRoute()`](https://mastra.ai/reference/ai-sdk/chat-route) if you want to create a chat route inside a Mastra server.

## Usage example [Direct link to Usage example](https://mastra.ai/reference/ai-sdk/handle-chat-stream\#usage-example "Direct link to Usage example")

Next.js App Router example:

app/api/chat/route.ts

```typescript
import { handleChatStream } from '@mastra/ai-sdk'
import { createUIMessageStreamResponse } from 'ai'
import { mastra } from '@/src/mastra'

export async function POST(req: Request) {
  const params = await req.json()
  const stream = await handleChatStream({
    mastra,
    agentId: 'weatherAgent',
    params,
    messageMetadata: () => ({ createdAt: new Date().toISOString() }),
  })
  return createUIMessageStreamResponse({ stream })
}
```

## Parameters [Direct link to Parameters](https://mastra.ai/reference/ai-sdk/handle-chat-stream\#parameters "Direct link to Parameters")

### version?:

'v5' \| 'v6'

= 'v5'

Selects the AI SDK stream contract to emit. Omit it or pass \`'v5'\` for the existing default behavior. Pass \`'v6'\` when your app is typed against AI SDK v6 response helpers.

### mastra:

Mastra

The Mastra instance containing registered agents.

### agentId:

string

The ID of the agent to use for chat.

### params:

ChatStreamHandlerParams

Parameters for the chat stream, including messages and optional resume data.

### params.messages:

UIMessage\[\]

Array of messages in the conversation.

### params.resumeData?:

Record<string, any>

Data for resuming a suspended agent execution. Requires \`runId\` to be set.

### params.runId?:

string

The run ID. Required when \`resumeData\` is provided.

### params.providerOptions?:

Record<string, Record<string, unknown>>

Provider-specific options passed to the language model (e.g. \`{ openai: { reasoningEffort: "high" } }\`). Merged with \`defaultOptions.providerOptions\`, with \`params\` taking precedence.

### params.requestContext?:

RequestContext

Request context to pass to the agent execution.

### defaultOptions?:

AgentExecutionOptions

Default options passed to agent execution. These are merged with params, with params taking precedence.

### sendStart?:

boolean

= true

Whether to send start events in the stream.

### sendFinish?:

boolean

= true

Whether to send finish events in the stream.

### sendReasoning?:

boolean

= false

Whether to include reasoning steps in the stream.

### sendSources?:

boolean

= false

Whether to include source citations in the stream.

### messageMetadata?:

(options: { part: UIMessageStreamPart }) => Record<string, unknown> \| undefined

A function that receives the current stream part and returns metadata to attach to start and finish chunks. See the \[AI SDK message metadata docs\](https://ai-sdk.dev/docs/ai-sdk-ui/message-metadata) for details.

[Edit this page on GitHub](https://github.com/mastra-ai/mastra/tree/main/docs/src/content/en/reference/ai-sdk/handle-chat-stream.mdx) [llms.txt](https://mastra.ai/reference/ai-sdk/handle-chat-stream/llms.txt)

[Previous\\
\\
chatRoute()](https://mastra.ai/reference/ai-sdk/chat-route) [Next\\
\\
handleNetworkStream()](https://mastra.ai/reference/ai-sdk/handle-network-stream)

On this page

- [Usage example](https://mastra.ai/reference/ai-sdk/handle-chat-stream#usage-example)
- [Parameters](https://mastra.ai/reference/ai-sdk/handle-chat-stream#parameters)

Mastra Newsletter

SubscribeShare feedback

reCAPTCHA

Recaptcha requires verification.

[Privacy](https://www.google.com/intl/en/policies/privacy/) \- [Terms](https://www.google.com/intl/en/policies/terms/)

protected by **reCAPTCHA**

[Privacy](https://www.google.com/intl/en/policies/privacy/) \- [Terms](https://www.google.com/intl/en/policies/terms/)