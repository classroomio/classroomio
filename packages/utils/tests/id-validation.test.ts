import { describe, expect, it } from 'vitest';

import { isValidNumericId, isValidUuid } from '../src/validation/shared/id';

describe('isValidUuid', () => {
  it.each([
    'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e',
    '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    '00000000-0000-0000-0000-000000000000',
    'B2F0A5D4-8C1E-4A6B-9D3F-2E7C8A1B4D5E'
  ])('accepts %s', (value) => {
    expect(isValidUuid(value)).toBe(true);
  });

  it.each([
    '',
    'not-a-uuid',
    '123',
    'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5',
    'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e0',
    ' b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e'
  ])('rejects %j', (value) => {
    expect(isValidUuid(value)).toBe(false);
  });

  it.each([undefined, null, 42, {}])('rejects the non-string %j', (value) => {
    expect(isValidUuid(value)).toBe(false);
  });
});

describe('isValidNumericId', () => {
  it.each(['1', '42', '9007199254740991'])('accepts %s', (value) => {
    expect(isValidNumericId(value)).toBe(true);
  });

  it.each(['', 'abc', '0', '-1', '1.5', '01', '1e3', ' 1', '9007199254740993'])('rejects %j', (value) => {
    expect(isValidNumericId(value)).toBe(false);
  });

  it.each([undefined, null, 42])('rejects the non-string %j', (value) => {
    expect(isValidNumericId(value)).toBe(false);
  });
});
