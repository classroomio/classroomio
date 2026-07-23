import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import type { Redis } from 'ioredis';

import { prepareRedisConnection } from './connection';

/**
 * Regression: BullMQ calls `duplicate()` for secondary clients. Those copies
 * must get an `error` listener, otherwise Redis Cloud maintenance disconnects
 * (`ECONNABORTED`) crash the Node process as unhandled EventEmitter errors.
 *
 * We drive the REAL `prepareRedisConnection` from `connection.ts` against a
 * fake Redis EventEmitter so this stays runnable without a live Redis and
 * actually protects the production code path.
 */

type FakeRedis = EventEmitter & {
  duplicate: (options?: object) => FakeRedis;
};

function createFakeRedis(): FakeRedis {
  const connection = new EventEmitter() as FakeRedis;

  connection.duplicate = () => createFakeRedis();
  prepareRedisConnection(connection as unknown as Redis);

  return connection;
}

test('duplicate connections get error listeners', () => {
  const root = createFakeRedis();
  const firstDuplicate = root.duplicate();
  const nestedDuplicate = firstDuplicate.duplicate();

  assert.ok(root.listenerCount('error') >= 1);
  assert.ok(firstDuplicate.listenerCount('error') >= 1);
  assert.ok(nestedDuplicate.listenerCount('error') >= 1);
});

test('preparing the same connection twice does not stack listeners', () => {
  const root = createFakeRedis();
  prepareRedisConnection(root as unknown as Redis);

  assert.equal(root.listenerCount('error'), 1);
});

test('preparing the same connection twice does not re-wrap duplicate()', () => {
  const root = createFakeRedis();
  const duplicateAfterFirst = root.duplicate;

  prepareRedisConnection(root as unknown as Redis);

  assert.equal(root.duplicate, duplicateAfterFirst);
});

test('emitting error on duplicates does not throw', () => {
  const root = createFakeRedis();
  const duplicated = root.duplicate();
  const abortError = Object.assign(new Error('read ECONNABORTED'), {
    code: 'ECONNABORTED',
    errno: -103,
    syscall: 'read'
  });

  assert.doesNotThrow(() => {
    root.emit('error', abortError);
    duplicated.emit('error', abortError);
  });
});
