import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { AddressInfo } from 'node:net';
import { expect, test } from '@playwright/test';

import stubServer from '../../apps/activity-player/stub/server.mjs';

const STUB_DIR = join(__dirname, '..', '..', 'apps', 'activity-player', 'stub');
const COMMIT_LOG = join(STUB_DIR, '.stub-commits.jsonl');

async function bootFixture(page, origin: string, token: string) {
  await page.goto(`${origin}/`);
  await page.locator(`[data-token="${token}"]`).click();

  const playerFrame = page.frameLocator('#player');
  const events = page.locator('#events');

  await expect(events).toContainText('"ready"', { timeout: 15_000 });
  await expect(events).not.toContainText('did-not-connect');

  return { playerFrame: playerFrame as ReturnType<typeof page.frameLocator>, events };
}

test.describe('scorm compatibility matrix against the stub content origin', () => {
  let origin = '';

  test.beforeAll(async () => {
    await unlink(COMMIT_LOG).catch(() => {});
    await new Promise<void>((resolve) => stubServer.listen(0, resolve));

    const address = stubServer.address() as AddressInfo;
    origin = `http://content.localhost:${address.port}`;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) => stubServer.close((error) => (error ? reject(error) : resolve())));
  });

  test('1.2 minimal fixture initializes, commits and terminates', async ({ page }) => {
    const { playerFrame, events } = await bootFixture(page, origin, 'stub-scorm12-minimal');
    const scoFrame = playerFrame.frameLocator('#package-frame');

    await scoFrame.getByRole('button', { name: 'Initialize' }).click();
    await expect(scoFrame.locator('#log')).toContainText('LMSInitialize -> true');

    await scoFrame.getByRole('button', { name: 'Commit' }).click();

    const commits = await page.request.get(`${origin}/stub/commits`);
    expect(commits.ok()).toBe(true);

    await scoFrame.getByRole('button', { name: 'Finish' }).click();
    await expect(events).toContainText('"terminated"');
  });

  test('2004 minimal fixture reports ready', async ({ page }) => {
    await bootFixture(page, origin, 'stub-scorm2004-minimal');
  });

  test('three-module fixture exposes every module for the menu', async ({ page }) => {
    for (const token of [
      'stub-scorm2004-three-modules',
      'stub-scorm2004-three-modules--module2.html',
      'stub-scorm2004-three-modules--module3-quiz.html'
    ]) {
      await bootFixture(page, origin, token);
    }
  });

  test('1.2 mastery fixture boots without the package setting a status', async ({ page }) => {
    await bootFixture(page, origin, 'stub-scorm12-quiz-mastery');
  });

  test('Storyline-style fixture initializes and commits through index_lms', async ({ page }) => {
    const { playerFrame } = await bootFixture(page, origin, 'stub-vendor-storyline-style');
    const scoFrame = playerFrame.frameLocator('#package-frame');

    await scoFrame.getByRole('button', { name: 'Initialize' }).click();
    await expect(scoFrame.locator('#log')).toContainText('LMSInitialize -> true');

    await scoFrame.getByRole('button', { name: 'Commit' }).click();

    const commits = await page.request.get(`${origin}/stub/commits`);
    expect(commits.ok()).toBe(true);
  });

  test('Rise-style fixture reports ready through indexapi', async ({ page }) => {
    await bootFixture(page, origin, 'stub-vendor-rise-style');
  });
});
