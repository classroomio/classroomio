import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

/**
 * Regression: BullMQ calls `duplicate()` for secondary clients. Those copies
 * must get an `error` listener, otherwise Redis Cloud maintenance disconnects
 * (`ECONNABORTED`) crash the Node process as unhandled EventEmitter errors.
 *
 * We exercise the same prepare/wrap pattern used in `connection.ts` against a
 * fake Redis EventEmitter so this stays runnable without a live Redis.
 */

const ERROR_HANDLER_ATTACHED = Symbol.for('cio.bullmq.redisErrorHandler');

type FakeRedis = EventEmitter & {
  duplicate: (options?: object) => FakeRedis;
  [ERROR_HANDLER_ATTACHED]?: boolean;
};

function attachRedisLifecycleHandlers(connection: FakeRedis): void {
  if (connection[ERROR_HANDLER_ATTACHED]) {
    return;
  }

  connection[ERROR_HANDLER_ATTACHED] = true;
  connection.on('error', () => {
    // swallow — production logs here
  });
}

function wrapDuplicate(connection: FakeRedis): void {
  const originalDuplicate = connection.duplicate.bind(connection);

  connection.duplicate = ((options?: object) => {
    const duplicated = originalDuplicate(options);
    prepareRedisConnection(duplicated);
    return duplicated;
  }) as FakeRedis['duplicate'];
}

function prepareRedisConnection(connection: FakeRedis): void {
  attachRedisLifecycleHandlers(connection);
  wrapDuplicate(connection);
}

function createFakeRedis(): FakeRedis {
  const connection = new EventEmitter() as FakeRedis;

  connection.duplicate = () => createFakeRedis();
  prepareRedisConnection(connection);

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
