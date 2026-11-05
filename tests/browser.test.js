import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

let browser, server;
const origin = 'http://127.0.0.1:4174';
before(async () => {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: 'pipe' });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(origin)).ok) { ready = true; break; } } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  assert.ok(ready, 'Development server starts');
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); server?.kill(); });

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`Complete portfolio flow at ${viewport.width}px`, async (t) => {
    const page = await browser.newPage({ viewport });
    t.after(() => page.close());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const failedImages = [];
    page.on('response', response => { if (response.status() >= 400) failedImages.push(response.url()); });
    await page.goto(origin);
    await page.locator('canvas').waitFor();
    assert.equal(await page.locator('.no-webgl').count(), 0, 'WebGL initializes');
    await page.getByRole('button', { name: 'Day mode', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'day');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'day', 'Theme survives reload');
    await page.getByRole('button', { name: 'Night mode', exact: true }).click();
    await page.getByRole('button', { name: 'Work', exact: true }).click();
    await page.getByRole('link', { name: /THE SPACESHIP/ }).click();
    await page.waitForURL('**/fs45/');
    assert.equal(await page.locator('h1').textContent(), 'A spaceship built from my logo.');
    await page.getByRole('link', { name: 'build', exact: true }).click();
    await page.getByRole('slider', { name: 'Build stage' }).fill('4');
    assert.equal(await page.locator('.build-control>span').first().textContent(), '05 THE SHIP');
    await page.getByRole('button', { name: /THE NAME/ }).click();
    await page.locator('dialog[open]').waitFor();
    assert.match(await page.locator('dialog').textContent(), /FS for Flyshare/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog[open]').count(), 0);
    await page.getByRole('button', { name: 'View cockpit fullscreen' }).click();
    await page.locator('dialog[open]').waitFor();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await page.getByRole('button', { name: 'Open 3D viewer' }).click();
    await page.waitForURL('**/fs45/transform/');
    await page.locator('canvas').waitFor();
    const transformer = page.getByRole('button', { name: 'Transformer', exact: true });
    await transformer.click();
    assert.equal(await transformer.getAttribute('aria-pressed'), 'true');
    await page.waitForTimeout(400);
    assert.match(await page.locator('.scene').getAttribute('aria-label'), /transformer/);
    const canvas = page.locator('canvas');
    const bounds = await canvas.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width / 2 + 70, bounds.y + bounds.height / 2 - 30, { steps: 5 }); await page.mouse.up();
    await page.getByRole('button', { name: 'Reset view' }).click();
    await page.getByRole('button', { name: /SOUND/ }).click();
    assert.equal(await page.getByRole('button', { name: /SOUND/ }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: /FS-45 BACK/ }).click();
    await page.waitForURL('**/fs45/');
    await page.getByRole('button', { name: 'FLYSHARE', exact: true }).first().click();
    await page.waitForURL('**/#work');
    await page.getByRole('link', { name: /THE FLYSHARE UNIVERSE/ }).click();
    await page.waitForURL('**/universe/');
    await page.locator('canvas').waitFor();
    await page.getByRole('button', { name: /FLYSHARE BACK/ }).click();
    await page.waitForURL(origin + '/');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    assert.deepEqual(failedImages, [], 'No missing resources');
    await page.close();
  });
}
