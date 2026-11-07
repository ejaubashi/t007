import { mkdir, copyFile, writeFile, cp, readdir, unlink } from 'node:fs/promises';

// Pages has no SPA rewrites: each route gets a real entry point.
for (const route of ['fs45', 'fs45/transform', 'universe', 'fleet/fs45', 'fleet/asterion', 'fleet/spectre']) {
  await mkdir(`dist/${route}`, { recursive: true });
  await copyFile('dist/index.html', `dist/${route}/index.html`);
}
await writeFile('dist/.nojekyll', '');

// Publish a static entry on main as well as gh-pages. Serving the development
// JSX entry directly from main previously produced a blank page on Pages.
// Remove only obsolete Vite output assets; preserve unrelated files.
await mkdir('assets', { recursive: true });
const currentAssets = new Set(await readdir('dist/assets'));
for (const name of await readdir('assets')) {
  if (/^index-[\w-]+\.(js|css)$/.test(name) && !currentAssets.has(name)) {
    await unlink(`assets/${name}`);
  }
}
for (const name of ['index.html', '.nojekyll', 'assets', 'images', 'fs45', 'universe', 'fleet']) {
  await cp(`dist/${name}`, name, { recursive: true });
}
console.log('Static GitHub Pages site prepared for main and gh-pages.');
