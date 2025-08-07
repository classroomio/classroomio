# Trigger Package

This package contains Trigger.dev tasks for ClassroomIO automation workflows.

## Structure

```
packages/trigger/
├── src/
│   └── trigger/
│       ├── task/
│       │   ├── email-tasks/
│       │   │   ├── welcome-email.ts
│       │   │   └── index.ts
│       │   ├── schedule-tasks/
│       │   │   ├── daily-cleanup.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       └── utils/
│           ├── email.ts
│           ├── cleanup.ts
│           └── types.ts
├── index.ts
├── package.json
├── tsconfig.json
└── trigger.config.ts
```

## Available Tasks

### Email Tasks

- **welcomeEmailTask**: Sends welcome emails to new users
  - Payload: `{ userId: string, email: string, name: string }`
  - Max duration: 5 minutes
  - Retries: 3 attempts with exponential backoff

### Schedule Tasks

- **dailyCleanupTask**: Runs daily cleanup operations
  - Schedule: Daily at 2 AM
  - Cleans up old logs, temporary files, and expired sessions

## Usage in Dashboard

### 1. Import the package

```typescript
import { welcomeEmailTask, dailyCleanupTask } from 'trigger';
```

### 2. Use the TriggerService

```typescript
import { TriggerService } from '$lib/utils/services/trigger';

// Trigger welcome email
await TriggerService.triggerWelcomeEmail({
  userId: 'user-id',
  email: 'user@example.com',
  name: 'John Doe'
});

// Trigger cleanup
await TriggerService.triggerCleanup();
```

### 3. API Routes

The dashboard includes API routes for triggering tasks:

- `POST /api/trigger/welcome-email` - Trigger welcome email
- `POST /api/trigger/cleanup` - Trigger cleanup task

## Development

### Build the package

```bash
cd packages/trigger
pnpm build
```

### Run in development mode

```bash
cd packages/trigger
pnpm dev
```

### Deploy tasks

```bash
cd packages/trigger
pnpm deploy
```

## Environment Variables

Make sure to set these environment variables in your dashboard:

```env
TRIGGER_API_KEY=your_trigger_api_key
TRIGGER_API_URL=https://api.trigger.dev
```

## Adding New Tasks

1. Create a new task file in the appropriate directory (`email-tasks/` or `schedule-tasks/`)
2. Export the task from the directory's `index.ts`
3. Add the export to the main `index.ts`
4. Create an API route in the dashboard if needed
5. Add the method to `TriggerService` if needed

## Example: Adding a New Email Task

```typescript
// src/trigger/task/email-tasks/reminder-email.ts
import { task } from '@trigger.dev/sdk/v3';

export const reminderEmailTask = task({
  id: 'reminder-email',
  run: async (payload, { ctx }) => {
    // Task implementation
  }
});
```

```typescript
// src/trigger/task/email-tasks/index.ts
export { reminderEmailTask } from './reminder-email';
```

```typescript
// index.ts
export { reminderEmailTask } from './src/trigger/task/email-tasks/reminder-email';
```
