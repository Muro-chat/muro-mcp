# muro MCP server

[muro](https://muro.chat) is a live chat widget and support inbox for people who run several sites. This is its official hosted [Model Context Protocol](https://modelcontextprotocol.io) server: Claude, Cursor, Windsurf, VS Code or any MCP client can read, search, reply to and triage your customer conversations, and set up the chat widget on your sites.

```
https://muro.chat/api/mcp
```

Remote server, Streamable HTTP transport (JSON responses, stateless), nothing to install. Listed on the official MCP registry as [`chat.muro/support`](https://registry.modelcontextprotocol.io/v0/servers?search=chat.muro).

## Authentication

Every request sends a muro API key as a Bearer token:

```
Authorization: Bearer mr_live_...
```

Create the key in the muro dashboard under **Settings, MCP & API**. Pick what it may do:

| Scope | Allows |
| --- | --- |
| `read` | list and search conversations, read threads, contacts, sites, install snippets |
| `write` | send replies and notes, triage, add sites, configure widgets |

A key can also be pinned to **one site**: every tool then only sees and acts on that site. Prefer a read-only key unless the agent must reply. Revoke a key in the same screen and it stops working at once.

## Quick start

### Claude Code

```bash
claude mcp add --transport http muro https://muro.chat/api/mcp \
  --header "Authorization: Bearer $MURO_API_KEY"
```

### Claude Desktop

`claude_desktop_config.json`, through the [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) bridge:

```json
{
  "mcpServers": {
    "muro": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://muro.chat/api/mcp", "--header", "Authorization:${MURO_AUTH}"],
      "env": { "MURO_AUTH": "Bearer mr_live_..." }
    }
  }
}
```

### Cursor

`.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global), with `MURO_API_KEY` in your environment:

```json
{
  "mcpServers": {
    "muro": {
      "url": "https://muro.chat/api/mcp",
      "headers": { "Authorization": "Bearer ${env:MURO_API_KEY}" }
    }
  }
}
```

### VS Code

```bash
code --add-mcp '{"name":"muro","type":"http","url":"https://muro.chat/api/mcp","headers":{"Authorization":"Bearer mr_live_..."}}'
```

### Any client, or plain HTTP

It is JSON-RPC over HTTP:

```bash
curl https://muro.chat/api/mcp \
  -H "Authorization: Bearer $MURO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

More configs (Windsurf and other stdio clients) are in [`examples/`](./examples).

## Tools

Every tool has a `title` and the four MCP annotations. Read tools are `readOnlyHint: true`. Write tools need the `write` scope; the ones that overwrite data carry `destructiveHint: true`, and `send_reply` is `openWorldHint: true` because a real visitor receives the message, so clients can ask you before running them.

| Tool | Title | Scope | Annotations | What it does |
| --- | --- | --- | --- | --- |
| `list_conversations` | List conversations | read | read-only | Conversations, newest first; filter by status, full-text search |
| `get_conversation` | Read a conversation | read | read-only | One conversation with its recent messages |
| `list_contacts` | List contacts | read | read-only | People who talked to the workspace |
| `get_contact` | Get a contact | read | read-only | One contact with metadata |
| `list_sites` | List sites | read | read-only | Sites, widget ids and widget config |
| `get_install_snippet` | Get the install snippet | read | read-only | Widget snippet plus per-platform steps |
| `send_reply` | Send a reply or note | write | not destructive, not idempotent, open world | Reply to the visitor, or add an internal note |
| `update_conversation` | Triage a conversation | write | destructive, idempotent | Status, tags (replaces the set), assignee, mark read |
| `create_sites` | Add sites | write | not destructive, idempotent | Add 1 to many domains in one call, safe to retry |
| `update_site` | Configure a site's widget | write | destructive, idempotent | Name, color, corner, welcome message, language, launcher |

**Errors.** A tool that fails returns a normal result with `isError: true` and a plain sentence the model can act on, for example `No conversation with id cnv_123.` or `This API key lacks the write scope required for this tool.` Only protocol problems (unknown tool or method, malformed JSON) are JSON-RPC errors. Successful calls return the data both as JSON text and as `structuredContent`.

## Prompts and resources

`prompts/list` offers three prompts:

| Prompt | Arguments | Does |
| --- | --- | --- |
| `triage_inbox` | none | Summarizes open conversations and proposes status and tags, changes nothing |
| `draft_reply` | `conversation_id` (required), `tone` | Drafts a reply for your approval before anything is sent |
| `support_digest` | `site` | Groups recent conversations into topics and suggests doc fixes, read only |

`resources/list` and `resources/templates/list` expose read-only views over the same data as the tools:

| Resource | Content |
| --- | --- |
| `muro://sites` | Every site the key can see, with widget id and config |
| `muro://conversations/{id}` | One conversation with its 20 most recent messages |

## Example prompts

- "What are customers asking about today? Group the open conversations by topic."
- "Read the latest conversation about refunds and draft a friendly reply. Show it to me before sending."
- "Close every conversation we already answered this week and tag them `resolved-by-docs`."

## stdio bridge

Some clients only speak stdio. [`index.js`](./index.js) bridges them to the hosted server with [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) and your key from `MURO_API_KEY`:

```bash
git clone https://github.com/Muro-chat/muro-mcp && cd muro-mcp && npm install
```

```json
{ "command": "node", "args": ["/path/to/muro-mcp/index.js"], "env": { "MURO_API_KEY": "mr_live_..." } }
```

Or with Docker: `docker build -t muro-mcp .` then `docker run -i -e MURO_API_KEY=mr_live_... muro-mcp`.

| Variable | Used by | Value |
| --- | --- | --- |
| `MURO_API_KEY` | the stdio bridge, the Docker image, the Cursor and Claude Code manifests | `mr_live_...` from Settings, MCP & API |

## Security

- Data stays in the workspace that owns the key, and inside the one site the key is pinned to, if any.
- Keys are stored as SHA-256 hashes; a revoked or expired key is refused on the next request.
- `send_reply` sends a real message to a real visitor. Treat conversation content as untrusted input: a visitor can write anything, including text that looks like instructions to your agent. Review drafts before sending.
- muro is hosted in Germany (Nuremberg). Privacy policy: [muro.chat/legal/privacy](https://muro.chat/legal/privacy). Report a vulnerability to [contact@muro.chat](mailto:contact@muro.chat).

## Manifests in this repo

| File | For |
| --- | --- |
| [`server.json`](./server.json) | Official MCP registry (`chat.muro/support`) |
| [`.claude-plugin/plugin.json`](./.claude-plugin/plugin.json) | Claude Code plugin (reads `MURO_API_KEY`) |
| [`.cursor-plugin/plugin.json`](./.cursor-plugin/plugin.json) + [`mcp.json`](./mcp.json) | Cursor plugin (reads `MURO_API_KEY`) |
| [`icon.png`](./icon.png) | 512 x 512 icon, also at https://muro.chat/icon-512.png |

`npm test` checks that these manifests, the examples and this README agree with each other and with the hosted server's tool list.

## Links

- Product: [muro.chat](https://muro.chat)
- Docs (REST, webhooks, MCP): [muro.chat/docs/api](https://muro.chat/docs/api)
- OpenAPI: [muro.chat/api/v1/openapi.json](https://muro.chat/api/v1/openapi.json)
- Support: [muro.chat/support](https://muro.chat/support), [contact@muro.chat](mailto:contact@muro.chat)

## License

MIT, see [LICENSE](./LICENSE). This covers the code, docs and configs in this repository; the muro service itself is a commercial product.
