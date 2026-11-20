// Keeps the manifests, examples and README in line with each other and with
// the hosted server (https://muro.chat/api/mcp). Run with `npm test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const json = (f) => JSON.parse(read(f));
const ENDPOINT = 'https://muro.chat/api/mcp';

// The hosted server's tools and their annotations (app/api/mcp/route.ts in muro).
const TOOLS = {
  list_conversations: 'read-only',
  get_conversation: 'read-only',
  list_contacts: 'read-only',
  get_contact: 'read-only',
  list_sites: 'read-only',
  get_install_snippet: 'read-only',
  send_reply: 'not destructive, not idempotent, open world',
  update_conversation: 'destructive, idempotent',
  create_sites: 'not destructive, idempotent',
  update_site: 'destructive, idempotent',
};
const PROMPTS = ['triage_inbox', 'draft_reply', 'support_digest'];
const RESOURCES = ['muro://sites', 'muro://conversations/{id}'];

test('every manifest and example points at the hosted endpoint with an API key', () => {
  const files = ['mcp.json', 'examples/cursor.json', 'examples/claude-desktop.json', 'examples/windsurf.json', '.claude-plugin/plugin.json'];
  for (const f of files) {
    const s = read(f);
    assert.ok(s.includes(ENDPOINT), `${f} points at ${ENDPOINT}`);
    assert.match(s, /Authorization/, `${f} sends an Authorization header`);
    assert.doesNotMatch(s, /mr_live_[0-9a-f]{8,}/, `${f} holds no real key`);
  }
  assert.equal(json('server.json').remotes[0].url, ENDPOINT);
});

test('server.json requires a secret Bearer key', () => {
  const h = json('server.json').remotes[0].headers[0];
  assert.equal(h.name, 'Authorization');
  assert.equal(h.isRequired, true);
  assert.equal(h.isSecret, true);
  assert.equal(h.variables.api_key.isRequired, true);
});

test('versions agree across package.json, server.json and the plugin manifests', () => {
  const v = json('package.json').version;
  for (const f of ['server.json', '.claude-plugin/plugin.json', '.cursor-plugin/plugin.json']) {
    assert.equal(json(f).version, v, `${f} version`);
  }
});

test('the README lists every tool with its annotations, the prompts and the resources', () => {
  const readme = read('README.md');
  const rows = readme.split('\n').filter((l) => l.startsWith('| `'));
  for (const [tool, ann] of Object.entries(TOOLS)) {
    const row = rows.find((l) => l.startsWith(`| \`${tool}\``));
    assert.ok(row, `README has a row for ${tool}`);
    assert.ok(row.includes(`| ${ann} |`), `${tool} is documented as "${ann}"`);
  }
  for (const p of PROMPTS) assert.ok(readme.includes(`\`${p}\``), `README names the ${p} prompt`);
  for (const r of RESOURCES) assert.ok(readme.includes(`\`${r}\``), `README names ${r}`);
  assert.match(readme, /isError: true/);
});

test('nothing advertises OAuth or an unpublished npm package', () => {
  // The hosted server takes API keys only; npx muro-mcp waits for an npm release.
  for (const f of ['README.md', 'index.js', 'server.json', 'mcp.json', '.claude-plugin/plugin.json', '.cursor-plugin/plugin.json']) {
    const s = read(f);
    assert.doesNotMatch(s, /OAuth/i, `${f} mentions OAuth`);
    assert.doesNotMatch(s, /npx[^\n]*\bmuro-mcp\b/, `${f} advertises npx muro-mcp`);
  }
});

test('no em or en dash in the docs and manifests', () => {
  const dash = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
  for (const f of ['README.md', 'server.json', '.claude-plugin/plugin.json', '.cursor-plugin/plugin.json', 'package.json']) {
    assert.doesNotMatch(read(f), dash, f);
  }
});

test('the icon is a 512 x 512 PNG', () => {
  const b = fs.readFileSync(path.join(root, 'icon.png'));
  assert.equal(b.subarray(1, 4).toString(), 'PNG');
  assert.equal(b.readUInt32BE(16), 512);
  assert.equal(b.readUInt32BE(20), 512);
});
