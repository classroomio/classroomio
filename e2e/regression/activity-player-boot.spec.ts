import { execFileSync } from 'node:child_process';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { AddressInfo } from 'node:net';
import { expect, test } from '@playwright/test';

import stubServer from '../../apps/activity-player/stub/server.mjs';

const REPO_ROOT = join(__dirname, '..', '..');
const STUB_DIR = join(REPO_ROOT, 'apps', 'activity-player', 'stub');
const COMMIT_LOG = join(STUB_DIR, '.stub-commits.jsonl');

/**
 * Player boot coverage (PR 10, Player row).
 *
 * Spins up the stub content origin on an ephemeral port and drives the real
 * boot path end to end: harness launches the built player, the player fetches
 * launch state, exposes the SCORM API, mounts the package frame, and the
 * fixture package initializes, commits and terminates through it. This is the
 * automated coverage for `boot()` wiring, which unit tests cannot reach.
 */
test.describe('activity player boot against the stub content origin', () => {
  let origin = '';

  test.beforeAll(async () => {
    execFileSync('pnpm', ['--filter', '@cio/activity-player', 'build'], {
      cwd: REPO_ROOT,
      stdio: 'pipe'
    });

    await unlink(COMMIT_LOG).catch(() => {});
    await new Promise<void>((resolve) => stubServer.listen(0, resolve));

    const address = stubServer.address() as AddressInfo;
    origin = `http://content.localhost:${address.port}`;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) => stubServer.close((error) => (error ? reject(error) : resolve())));
  });

  test('boots the 1.2 fixture: ready, initialize, commit, terminate', async ({ page }) => {
    await page.goto(`${origin}/`);

    await page.locator('[data-token="stub-scorm12-minimal"]').click();

    const playerFrame = page.frameLocator('#player');
    const scoFrame = playerFrame.frameLocator('#package-frame');
    const events = page.locator('#events');

    await expect(events).toContainText('"ready"', { timeout: 15_000 });

    await scoFrame.getByRole('button', { name: 'Initialize' }).click();
    await expect(scoFrame.locator('#log')).toContainText('LMSInitialize -> true');

    await scoFrame.getByRole('button', { name: 'Commit' }).click();

    const commitsResponse = await page.request.get(`${origin}/stub/commits`);
    expect(commitsResponse.ok()).toBe(true);

    const commits = (await commitsResponse.json()) as Array<{ token?: string }>;
    expect(commits.some((entry) => entry.token === 'stub-scorm12-minimal')).toBe(true);

    await scoFrame.getByRole('button', { name: 'Finish' }).click();
    await expect(events).toContainText('"terminated"');
    await expect(events).not.toContainText('did-not-connect');
  });

  test('boots the 2004 fixture and reports ready', async ({ page }) => {
    await page.goto(`${origin}/`);

    await page.locator('[data-token="stub-scorm2004-minimal"]').click();

    const events = page.locator('#events');
    await expect(events).toContainText('"ready"', { timeout: 15_000 });
    await expect(events).not.toContainText('did-not-connect');
  });
});
