# Neon MCP Slim

Minimal MCP server for Dirot's Neon database. Reads `DATABASE_URL` from environment. Exposes only 3 essential tools (vs 20+ in full Neon MCP).

## Tools

| Tool | Description | Params |
|------|-------------|--------|
| `sql` | Execute SQL query | `query: string` |
| `tables` | List all tables | none |
| `schema` | Get table schema | `table: string` |

## Config

In `.mcp.json`:

```json
{
  "mcpServers": {
    "neon-slim": {
      "command": "node",
      "args": ["/Users/gal/personal-projects/dirot/tools/neon-mcp-slim/dist/index.js"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

## Development

```bash
npm install
npm run build
npm run dev  # run with tsx
```
