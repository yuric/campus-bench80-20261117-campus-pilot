import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('the main heading announces pilot readiness', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<main\b[^>]*>[\s\S]*?<h1\b[^>]*>Benchmark pilot ready<\/h1>/);
});

test('the builder continues to reject symlinks', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'pilot-symlink-'));
  try {
    await writeFile(join(fixture, 'target.html'), '<h1>Target</h1>');
    await symlink('target.html', join(fixture, 'index.html'));
    assert.throws(
      () => execFileSync(process.execPath, [join(root, 'scripts/build.mjs')], { cwd: fixture, stdio: 'pipe' }),
      /Refusing symlink: index\.html/,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test('the real build publishes health for the current git revision', async () => {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'pipe' });
  const health = JSON.parse(await readFile(new URL('../dist/assets/pilot-health.json', import.meta.url), 'utf8'));
  assert.deepEqual(health, { status: 'ok', revision });
  assert.equal(
    await readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
    await readFile(new URL('../index.html', import.meta.url), 'utf8'),
  );
});
