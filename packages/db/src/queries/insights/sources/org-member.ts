import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import { baseColumn, integerMetric } from './helpers';

export const orgMemberSource: InsightsSourceDefinition = {
  id: 'org_member',
  scopeTypes: ['org'],
  build: () => sql`SELECT * FROM org_member_row`,
  dimensions: { period: { valueType: 'date', key: baseColumn('period') } },
  metrics: {
    members_added: integerMetric('members_added'),
    members_total: integerMetric('members_total')
  },
  filters: {}
};
