import { describe, expect, it } from 'vitest';

import { isTransientDatabaseError } from './transient-database-error';

function errorWithCode(code: string, message = 'boom') {
  return Object.assign(new Error(message), { code });
}

describe('isTransientDatabaseError', () => {
  it.each([
    'CONNECTION_CLOSED',
    'CONNECTION_ENDED',
    'CONNECT_TIMEOUT',
    'ECONNRESET',
    '57P01',
    '57P02',
    '53300',
    '08006'
  ])('treats code %s as transient', (code) => {
    expect(isTransientDatabaseError(errorWithCode(code))).toBe(true);
  });

  it('sees through a wrapped cause', () => {
    const wrapped = new Error('Failed query', { cause: errorWithCode('57P01') });

    expect(isTransientDatabaseError(wrapped)).toBe(true);
  });

  it('sees through nested aggregate errors', () => {
    const aggregate = new AggregateError([new Error('other'), errorWithCode('ECONNREFUSED')]);

    expect(isTransientDatabaseError(aggregate)).toBe(true);
  });

  it.each(['23505', '42P01', '22P02'])('does not treat constraint or syntax code %s as transient', (code) => {
    expect(isTransientDatabaseError(errorWithCode(code))).toBe(false);
  });

  it('does not treat plain errors or non-objects as transient', () => {
    expect(isTransientDatabaseError(new Error('TypeError: x is undefined'))).toBe(false);
    expect(isTransientDatabaseError(undefined)).toBe(false);
    expect(isTransientDatabaseError('57P01')).toBe(false);
  });
});
