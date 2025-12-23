import { Queue, Worker, QueueEvents } from 'bullmq';
import { redisConnection, redisWorkerConnection } from '../config/redis';
import { queueEnv } from '../config/env';
import type { Job } from 'bullmq';

export type JobHandler<T = any> = (job: Job<T>) => Promise<any>;

export interface QueueOptions {
  attempts?: number;
  backoffDelay?: number;
  concurrency?: number;
}

class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  createQueue<T = any>(name: string, options?: QueueOptions): Queue<T> {
    if (this.queues.has(name)) {
      return this.queues.get(name)! as Queue<T>;
    }

    const queue = new Queue<T>(name, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: options?.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: options?.backoffDelay || 2000
        },
        removeOnComplete: {
          age: 24 * 3600,
          count: 1000
        },
        removeOnFail: {
          age: 7 * 24 * 3600
        }
      }
    });

    this.queues.set(name, queue);
    return queue;
  }

  createWorker<T = any>(queueName: string, processor: JobHandler<T>, options?: QueueOptions): Worker<T> {
    if (this.workers.has(queueName)) {
      console.log(`Worker for queue "${queueName}" already exists, returning existing worker`);
      return this.workers.get(queueName)! as Worker<T>;
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" does not exist. Create it first.`);
    }

    console.log(
      `Creating worker for queue "${queueName}" with concurrency ${options?.concurrency || queueEnv.QUEUE_CONCURRENCY || 5}`
    );

    const worker = new Worker<T>(queueName, processor, {
      connection: redisWorkerConnection,
      concurrency: options?.concurrency || queueEnv.QUEUE_CONCURRENCY || 5
    });

    worker.on('ready', () => {
      console.log(`Worker for queue "${queueName}" is ready`);
    });

    worker.on('active', (job) => {
      console.log(`Job ${job.id} is now active in queue "${queueName}"`);
    });

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed in queue "${queueName}"`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed in queue "${queueName}":`, err);
    });

    worker.on('error', (err) => {
      console.error(`Worker error in queue "${queueName}":`, err);
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  getQueue<T = any>(name: string): Queue<T> | undefined {
    return this.queues.get(name) as Queue<T> | undefined;
  }

  getAllQueues(): Queue[] {
    return Array.from(this.queues.values());
  }

  async close(): Promise<void> {
    await Promise.all([
      ...Array.from(this.workers.values()).map((worker) => worker.close()),
      ...Array.from(this.queues.values()).map((queue) => queue.close())
    ]);
    this.queues.clear();
    this.workers.clear();
  }
}

export const queueManager = new QueueManager();
