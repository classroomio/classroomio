/* eslint-disable no-undef -- Allow the use `process` */
/* eslint-disable no-console -- Allow the use of `console` */
import fs from 'node:fs';
import path from 'node:path';

const customPath = process.argv[2];
const projectDir = customPath || path.resolve(process.cwd());

// Check .env files for the presence of the analyticsId key
function findEnvFileWithAnalyticsId() {
  const files = ['.env.local', '.env.development.local', '.env'];
  const envFile = files.find((file) => {
    const envPath = path.join(projectDir, file);
    if (!fs.existsSync(envPath)) {
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');

    return envContent.includes('VERCEL_ANALYTICS_ID');
  });

  return envFile;
}

function isSpeedInsightsInstalled() {
  const packageJsonPath = path.join(projectDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found in the current directory.');
    return false;
  }

  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);

  if (!packageJson.dependencies) {
    return false;
  }

  return Boolean(packageJson.dependencies['@vercel/speed-insights']);
}

function isAnalyticsIdInNextConfig() {
  const jsConfigPath = path.join(projectDir, 'next.config.js');
  const mjsConfigPath = path.join(projectDir, 'next.config.mjs');

  let configFile;

  if (fs.existsSync(jsConfigPath)) {
    configFile = jsConfigPath;
  } else if (fs.existsSync(mjsConfigPath)) {
    configFile = mjsConfigPath;
  } else {
    return;
  }

  const configContent = fs.readFileSync(configFile, 'utf-8');

  return configContent.includes('analyticsId');
}

function main() {
  if (!isSpeedInsightsInstalled()) {
    // No @vercel/speed-insights installed, we don't need to continue
    return;
  }

  const isInConfig = isAnalyticsIdInNextConfig();
  const envFile = findEnvFileWithAnalyticsId();

  if (isInConfig) {
    console.warn(
      '\x1b[31m',
      `Please remove 'analyticsId' from your next.config.js file.`,
    );
  }
  if (envFile) {
    console.log(
      '\x1b[31m',
      `Please remove 'VERCEL_ANALYTICS_ID' from your ${envFile} file.`,
    );
  }
}

main();
