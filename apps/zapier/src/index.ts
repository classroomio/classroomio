import { defineApp, version as platformVersion } from 'zapier-platform-core';

import packageJson from '../package.json' with { type: 'json' };
import { authentication } from './authentication';
import { creates } from './creates';
import { hydrators } from './hydrators';
import { addRequestHeaders, handleApiErrors } from './lib/http';
import { searches } from './searches';
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
  hydrators,
  triggers: byKey([...eventTriggers, ...dropdownTriggers]),
  creates: byKey(creates),
  searches: byKey(searches),
  searchOrCreates: {
    find_student: {
      key: 'find_student',
      display: {
        label: 'Find or Create Student',
        description: 'Finds a student by email, or invites them to your organization if they are new.'
      },
      search: 'find_student',
      create: 'add_student'
    }
  }
});
