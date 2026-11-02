import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiOrganizationCustomizationResponse,
  ZPublicApiUpdateOrganizationCustomization
} from '../src/validation/public-api';

// The public API is versioned; a change to either shape is a contract change and must be deliberate.
describe('public API organization customization contract', () => {
  it('ZPublicApiUpdateOrganizationCustomization keeps its published shape', () => {
    expect(
      z.toJSONSchema(ZPublicApiUpdateOrganizationCustomization, { io: 'input', unrepresentable: 'any' })
    ).toMatchSnapshot();
  });

  it('ZPublicApiOrganizationCustomizationResponse keeps its published shape', () => {
    expect(
      z.toJSONSchema(ZPublicApiOrganizationCustomizationResponse, { io: 'output', unrepresentable: 'any' })
    ).toMatchSnapshot();
  });
});
