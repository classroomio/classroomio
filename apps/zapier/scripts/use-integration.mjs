import { writeFileSync } from 'node:fs';

const ENVIRONMENTS = { staging: 'ZAPIER_INTEGRATION_ID_STAGING', production: 'ZAPIER_INTEGRATION_ID_PRODUCTION' };
const environment = process.argv[2];
const variable = ENVIRONMENTS[environment];

if (!variable) {
  throw new Error(`Usage: use-integration.mjs <${Object.keys(ENVIRONMENTS).join('|')}>`);
}

const id = Number(process.env[variable]);

if (!Number.isInteger(id)) {
  throw new Error(`Set ${variable} to the integration id from the Zapier developer platform`);
}

writeFileSync(new URL('../.zapierapprc', import.meta.url), JSON.stringify({ id, key: `App${id}` }, null, 2));
console.log(`Using the ${environment} Zapier integration (App${id})`);
