// The stdio bridge refuses to start without a key, with a message that says
// where to get one. Needs no network and no installed dependency.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('index.js exits 1 with guidance when MURO_API_KEY is missing', () => {
  const env = { ...process.env };
  delete env.MURO_API_KEY;
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'index.js')], { env, encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing MURO_API_KEY/);
  assert.match(r.stderr, /Settings -> MCP & API/);
  assert.match(r.stderr, /https:\/\/muro\.chat\/api\/mcp/);
});
