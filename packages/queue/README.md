# @cio/queue

Queue system for ClassroomIO using BullMQ and Redis.

## Features

- Email queue with retry logic
- Taskforce dashboard for monitoring (development)
- Configurable via environment variables
- Simple, extensible architecture

## Configuration

Environment variables:

```env
# Redis
REDIS_URL=redis://localhost:6379
# OR
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Queue
QUEUE_CONCURRENCY=5

# Taskforce (development)
# Get your token from https://taskforce.sh
TASKFORCE_TOKEN=your_taskforce_token
TASKFORCE_CONNECTION_NAME=classroomio-local
TASKFORCE_TEAM=your_team_name  # Optional
```

## Usage

### Email Queue

```typescript
import { emailQueue } from '@cio/queue';

// Add email to queue
const job = await emailQueue.add('send-email', {
  emailId: 'welcome',
  to: 'user@example.com',
  fields: { name: 'John' },
});
```

### API Route

```typescript
// Queue emails: POST /mail?queue=true
// Direct send: POST /mail
```

## Taskforce Dashboard

Taskforce is a cloud-based dashboard for monitoring BullMQ queues. To use it:

1. **Get your Taskforce token** from [https://taskforce.sh](https://taskforce.sh)
2. **Add to `.env`**:
   ```env
   TASKFORCE_TOKEN=your_token_here
   TASKFORCE_CONNECTION_NAME=classroomio-local
   ```
3. **Run the connector**:
   ```bash
   pnpm --filter @cio/queue taskforce
   ```

The connector will link your local Redis queues to the Taskforce.sh dashboard. View your queues at [https://taskforce.sh](https://taskforce.sh)

**Note:** The connector runs as a separate process and connects your local queues to the cloud dashboard.


