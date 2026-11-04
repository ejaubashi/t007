import { mkdir, copyFile, writeFile } from 'node:fs/promises';

// GitHub Pages does not provide an SPA rewrite. Give each known route a real
// index.html so direct visits and refreshes work without a redirect workaround.
for (const route of ['fs45', 'fs45/transform', 'universe']) {
  await mkdir(`dist/${route}`, { recursive: true });
  await copyFile('dist/index.html', `dist/${route}/index.html`);
}
await writeFile('dist/.nojekyll', '');
console.log('GitHub Pages route entry points created.');
