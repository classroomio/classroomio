# Queue Setup Guide: BullMQ with Redis

Quick reference guide for setting up BullMQ for video processing.

## Why BullMQ?

- ✅ You already have Redis in your stack
- ✅ Easy to Dockerize (Redis is simple to containerize)
- ✅ Perfect for CPU-intensive video encoding jobs
- ✅ Built-in retry logic, progress tracking, and job priorities
- ✅ Great monitoring tools (Bull Board)

## Quick Start

### 1. Install Dependencies

```bash
cd apps/api
pnpm add bullmq
pnpm add -D @types/bullmq
```

### 2. Add Redis to Docker Compose

Update `docker/docker-compose.yaml`:

```yaml
services:
  # ... existing services ...
  
  redis:
    image: redis:7-alpine
    container_name: classroomio-redis
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis_data:
    driver: local
```

### 3. Update Environment Variables

Your `.env` file should have:
```bash
REDIS_URL=redis://redis:6379  # For Docker Compose
# OR
REDIS_URL=redis://localhost:6379  # For local development
```

### 4. Create Queue Service

Create `apps/api/src/services/video/queue.ts`:

```typescript
import { Queue, QueueEvents } from 'bullmq';
import { redis } from '@api/utils/redis/redis';

export interface VideoEncodingJob {
  fileKey: string;
  userId: string;
  lessonId?: string;
}

export const videoProcessingQueue = new Queue<VideoEncodingJob>('video-encoding', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // 7 days
    },
  },
});

export const videoQueueEvents = new QueueEvents('video-encoding', {
  connection: redis,
});
```

### 5. Create Worker

Create `apps/api/src/services/video/worker.ts`:

```typescript
import { Worker } from 'bullmq';
import { redis } from '@api/utils/redis/redis';
import type { VideoEncodingJob } from './queue';

export const videoWorker = new Worker<VideoEncodingJob>(
  'video-encoding',
  async (job) => {
    const { fileKey } = job.data;
    
    // Your encoding logic here
    await job.updateProgress(0);
    
    // ... encoding steps ...
    
    await job.updateProgress(100);
    return { success: true, fileKey };
  },
  {
    connection: redis,
    concurrency: 2, // Adjust based on CPU
  }
);
```

### 6. Start Worker

In `apps/api/src/index.ts`:

```typescript
import { videoWorker } from '@api/services/video/worker';

// Worker starts automatically when imported

// Graceful shutdown
process.on('SIGTERM', async () => {
  await videoWorker.close();
  process.exit(0);
});
```

### 7. Create API Endpoints

Create `apps/api/src/routes/media/video/process.ts`:

```typescript
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { videoProcessingQueue } from '@api/services/video/queue';

export const videoProcessRouter = new Hono()
  .post('/process', authMiddleware, async (c) => {
    const { fileKey } = await c.req.json();
    
    const job = await videoProcessingQueue.add('encode-video', {
      fileKey,
      userId: c.get('user').id,
    });
    
    return c.json({
      success: true,
      jobId: job.id,
      status: 'queued',
    });
  })
  .get('/status/:jobId', authMiddleware, async (c) => {
    const jobId = c.req.param('jobId');
    const job = await videoProcessingQueue.getJob(jobId);
    
    if (!job) {
      return c.json({ success: false, error: 'Job not found' }, 404);
    }
    
    return c.json({
      success: true,
      status: await job.getState(),
      progress: job.progress || 0,
    });
  });
```

## Docker Commands

```bash
# Start Redis
docker-compose up -d redis

# Check Redis is running
docker-compose ps redis

# View Redis logs
docker-compose logs -f redis

# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check queue stats
docker-compose exec redis redis-cli KEYS "bull:video-encoding:*"
```

## Monitoring (Optional)

Install Bull Board for a nice UI:

```bash
pnpm add @bull-board/api @bull-board/hono
```

Create monitoring endpoint:

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { videoProcessingQueue } from '@api/services/video/queue';

const serverAdapter = new HonoAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(videoProcessingQueue)],
  serverAdapter,
});

// Mount in your Hono app
app.route('/admin/queues', serverAdapter.getRouter());
```

Visit `http://localhost:3081/admin/queues` to see the queue dashboard.

## Configuration Tips

### Concurrency
Adjust based on your server CPU:
- 2-4 cores: `concurrency: 1-2`
- 4-8 cores: `concurrency: 2-4`
- 8+ cores: `concurrency: 4-8`

### Job Priorities
```typescript
// High priority (processed first)
await queue.add('encode-video', data, { priority: 10 });

// Normal priority
await queue.add('encode-video', data, { priority: 5 });

// Low priority
await queue.add('encode-video', data, { priority: 1 });
```

### Rate Limiting
```typescript
const worker = new Worker('video-encoding', handler, {
  limiter: {
    max: 10,        // Max 10 jobs
    duration: 60000, // per minute
  },
});
```

## Troubleshooting

### Redis Connection Issues
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Jobs Not Processing
1. Check worker is running: Look for worker logs
2. Check Redis: `docker-compose logs redis`
3. Check job state: Use Bull Board or Redis CLI

### Memory Issues
- Reduce `concurrency` in worker
- Add `removeOnComplete` to clean up old jobs
- Monitor Redis memory: `docker stats classroomio-redis`

## Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [Bull Board](https://github.com/felixmosh/bull-board)
