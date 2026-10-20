import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { experimental_readRawConfig } from 'wrangler';

const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { rawConfig } = experimental_readRawConfig({ config: join(appDirectory, 'wrangler.toml') });
const bucketName = process.env.OBJECT_STORAGE_BUCKET_SCORM || 'scorm';
rawConfig.r2_buckets = rawConfig.r2_buckets.map((bucket) =>
  bucket.binding === 'SCORM_BUCKET' ? { ...bucket, bucket_name: bucketName } : bucket
);
rawConfig.main = resolve(appDirectory, rawConfig.main);

const configDirectory = join(appDirectory, '.wrangler');
mkdirSync(configDirectory, { recursive: true });
const temporaryDirectory = mkdtempSync(join(configDirectory, 'deploy-'));
try {
  const configPath = join(temporaryDirectory, 'wrangler.json');
  writeFileSync(configPath, JSON.stringify(rawConfig));
  const result = spawnSync('pnpm', ['exec', 'wrangler', 'deploy', '--config', configPath, ...process.argv.slice(2)], {
    cwd: appDirectory,
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
