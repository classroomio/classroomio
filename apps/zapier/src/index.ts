import { defineApp, version as platformVersion } from 'zapier-platform-core';

import packageJson from '../package.json' with { type: 'json' };
import { authentication } from './authentication';
import { creates } from './creates';
import { hydrators } from './hydrators';
import { addRequestHeaders, handleApiErrors } from './lib/http';
import { dropdownTriggers } from './triggers/dropdowns';
import { eventTriggers } from './triggers/events';

const byKey = <T extends { key: string }>(items: readonly T[]) =>
  Object.fromEntries(items.map((item) => [item.key, item]));

export default defineApp({
  version: packageJson.version,
  platformVersion,
  authentication,
  beforeRequest: [addRequestHeaders],
  afterResponse: [handleApiErrors],
  flags: { cleanInputData: false },
  hydrators,
  triggers: byKey([...eventTriggers, ...dropdownTriggers]),
  creates: byKey(creates)
});
