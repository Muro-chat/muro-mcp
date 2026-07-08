# muro MCP server

The official **hosted** [Model Context Protocol](https://modelcontextprotocol.io) server for [muro.chat](https://muro.chat), the live chat widget + AI support inbox for people running multiple projects.

Connect your AI agent (Claude, Claude Desktop, Cursor, Windsurf, ChatGPT, or any MCP client) to your support inbox: it can list and search customer conversations, read full message threads, send replies or internal notes, triage with status/tags/assignee, look up contacts, and even configure the chat widget. Support becomes a tool call inside your editor.

There is nothing to install and no local process: the server is a remote **Streamable HTTP** endpoint.

```
https://muro.chat/api/mcp
```

Also listed on the official MCP registry as [`chat.muro/support`](https://registry.modelcontextprotocol.io/v0/servers?search=muro).

## Authentication

Create an API key in the muro dashboard (**Settings → API keys**). Keys look like `mr_live_…` and carry scopes:

| Scope | Allows |
| --- | --- |
| `read` | list/search conversations, read threads, contacts, sites |
| `write` | send replies and notes, triage, update widget config |

A key can be **pinned to a single site**: every request it makes (REST and MCP alike) only sees that site's conversations, contacts and config. One key per repo means the agent working on a project only ever sees that project's inbox.

Send the key as a Bearer token:

```
Authorization: Bearer mr_live_…
```

## Quick start

Clients that support remote MCP servers natively can use the URL + header directly. stdio-only clients connect through [`mcp-remote`](https://www.npmjs.com/package/mcp-remote):

```bash
npx mcp-remote https://muro.chat/api/mcp \
  --header "Authorization: Bearer mr_live_…"
```

Ready-to-paste configs for common clients are in [`examples/`](./examples):

- [Claude Desktop](./examples/claude-desktop.json) (`claude_desktop_config.json`)
- [Cursor](./examples/cursor.json) (`.cursor/mcp.json`)
- [Windsurf](./examples/windsurf.json) (`~/.codeium/windsurf/mcp_config.json`)

## Tools

| Tool | What it does |
| --- | --- |
| `list_conversations` | List conversations; filter by status, full-text search |
| `get_conversation` | One conversation with its messages |
| `send_reply` | Reply to the visitor, or leave an internal note |
| `update_conversation` | Change status, tags, assignee |
| `list_contacts` | List contacts |
| `get_contact` | One contact's details |
| `list_sites` | Your sites and their widget config |
| `update_site` | Configure the widget: color, position, welcome message, language, size |

## Example prompts

Once connected, ask your agent things like:

- "What are customers complaining about today?"
- "Read the last conversation about the checkout bug and summarize it."
- "Draft a reply to the visitor asking about refunds, friendly tone."
- "Close every conversation we already answered this week."
- "Switch the widget on my landing page to dark blue and French."

## Links

- Product: [muro.chat](https://muro.chat)
- API + MCP docs: [muro.chat/docs/api](https://muro.chat/docs/api)
- Live demo: [muro.chat/demo](https://muro.chat/demo)
- Contact: [hello@muro.chat](mailto:hello@muro.chat)

## License

The documentation and example configurations in this repository are MIT licensed (see [LICENSE](./LICENSE)). The muro service itself is a commercial product.
