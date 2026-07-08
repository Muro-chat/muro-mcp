#!/usr/bin/env node
/**
 * muro-mcp: connect any stdio MCP client to your muro.chat support inbox.
 *
 * The muro MCP server is a hosted Streamable HTTP endpoint
 * (https://muro.chat/api/mcp). This wrapper bridges stdio clients
 * (Claude Desktop, Windsurf, ...) to it via mcp-remote, so the whole
 * client config is: command "npx", args ["-y", "muro-mcp"], and the
 * MURO_API_KEY environment variable.
 *
 * Get an API key in the muro dashboard: https://muro.chat -> Settings -> API keys.
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

const key = process.env.MURO_API_KEY;
if (!key) {
  console.error(
    'muro-mcp: missing MURO_API_KEY.\n' +
      'Create a key (mr_live_...) in the muro dashboard (Settings -> API keys)\n' +
      'and set it in your MCP client config, e.g.\n' +
      '  { "command": "npx", "args": ["-y", "muro-mcp"], "env": { "MURO_API_KEY": "mr_live_..." } }\n' +
      'Docs: https://muro.chat/docs/api',
  );
  process.exit(1);
}

// Resolve mcp-remote's executable from our own dependency tree, so no
// second download or shell/npx quirks (Windows included).
const remotePkg = require('mcp-remote/package.json');
const binRel = typeof remotePkg.bin === 'string' ? remotePkg.bin : remotePkg.bin['mcp-remote'];
const remoteBin = path.join(path.dirname(require.resolve('mcp-remote/package.json')), binRel);

const child = spawn(
  process.execPath,
  [remoteBin, 'https://muro.chat/api/mcp', '--header', `Authorization: Bearer ${key}`],
  { stdio: 'inherit' },
);
child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('muro-mcp: failed to start mcp-remote:', err.message);
  process.exit(1);
});
