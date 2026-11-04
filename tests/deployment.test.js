import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

for (const route of ['', 'fs45/', 'fs45/transform/', 'universe/']) {
  test(`Pages serves compiled assets from main: /t007/${route}`, async () => {
    const html = await readFile(`${route}index.html`, 'utf8');
    // Serving the development index from main used to load JSX directly and
    // leave an empty React root. The published entry must use compiled JS.
    const module = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/);
    assert.ok(module, 'Published page has a JavaScript entry');
    assert.match(module[1], /^\/t007\/assets\/.+\.js$/);
    const resources = [...html.matchAll(/(?:src|href)="(\/t007\/assets\/[^"]+)"/g)];
    assert.ok(resources.length >= 2, 'Both JavaScript and CSS are published');
    for (const [, url] of resources) await access(url.replace('/t007/', ''));
    assert.ok(!html.includes('/src/main.jsx'), 'Development JSX is not served by Pages');
    assert.match(html, /Loading your universe/, 'Startup state is visible before React loads');
  });
}
