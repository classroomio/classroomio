import { FlowProducer, Queue } from 'bullmq';

import { getSharedRedisConnection } from '../connection';
import { QUEUE_NAMES, type QueueName } from './names';
import { buildQueueOptions } from './defaults';

/**
 * Lazy queue + flow-producer accessors backed by the shared Redis
 * connection. Workers should NOT use these — they need their own Redis
 * connection per process. These are for the API enqueue path.
 */

const queues = new Map<QueueName, Queue>();
let flowProducer: FlowProducer | undefined;

export function getQueue(name: QueueName): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, {
      ...buildQueueOptions(name),
      connection: getSharedRedisConnection()
    });
    queue.on('error', (error) => {
      console.error(`BullMQ queue error (${name}):`, error);
    });
    queues.set(name, queue);
  }

  return queue;
}

export function getFlowProducer(): FlowProducer {
  if (!flowProducer) {
    flowProducer = new FlowProducer({ connection: getSharedRedisConnection() });
    flowProducer.on('error', (error) => {
      console.error('BullMQ flow producer error:', error);
    });
  }

  return flowProducer;
}

/** Eagerly close every cached queue/flow producer. Useful in tests. */
export async function closeAllQueues(): Promise<void> {
  await Promise.all(Array.from(queues.values()).map((queue) => queue.close()));
  queues.clear();

  if (flowProducer) {
    await flowProducer.close();
    flowProducer = undefined;
  }
}

/** Returns every queue name in registration order. */
export function listQueueNames(): QueueName[] {
  return Object.values(QUEUE_NAMES);
}
