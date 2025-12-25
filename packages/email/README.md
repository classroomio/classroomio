# @cio/emails

## Overview

A unified email system using a single `send()` function that accepts an email ID string with full runtime validation via Zod schemas. All emails are defined declaratively with automatic registration.

## Key Features

- **Minimal imports**: Single `import { send } from '@cio/email'`
- **Type safety**: Type-safe email IDs with autocomplete (TypeScript enforces valid IDs)
- **Runtime validation**: Zod schemas validate fields at runtime
- **Auto-registration**: Emails are automatically registered when defined
- **Discoverability**: All emails accessible via string ID
- **Consistency**: Unified pattern for all email templates
- **Validation**: Automatic Zod validation of fields with helpful error messages

## Usage

### Sending an Email

```typescript
import { sendEmail } from '@cio/email';

await send('forgotPassword', {
  to: 'user@example.com',
  fields: {
    name: 'John Doe',
    email: 'user@example.com',
    link: 'https://app.classroomio.com/reset?token=abc123'
  }
});
```

### With Overrides

```typescript
await send('forgotPassword', {
  to: 'user@example.com',
  fields: {
    name: 'John Doe',
    email: 'user@example.com',
    link: 'https://app.classroomio.com/reset?token=abc123'
  },
  from: '"Support Team" <support@classroomio.com>',
  replyTo: 'help@classroomio.com'
});
```

## Creating Email Templates

### Basic Example

```typescript
// packages/email/src/emails/forgot-password.ts
import * as z from 'zod';
import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const forgotPasswordEmail = defineEmail({
  id: 'forgotPassword',
  subject: 'Password reset notification - ClassroomIO',
  schema: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    link: z.url()
  }),
  render: (fields) => {
    const content = `Hello ${fields.name},
    <p>You are receiving this email because you have requested a password reset.</p>
    <div>
      <a class="button" href="${fields.link}">Reset my password</a>
    </div>`;

    return getDefaultTemplate(content);
  }
});
```

TypeScript will provide autocomplete for valid email IDs and show errors for invalid ones. The `EmailId` type is defined in `utils/types.ts` based on the `EMAIL_IDS` constant in `utils/constants.ts`.

**Note:** When adding new emails, update both:

1. The `EMAIL_IDS` array in `utils/constants.ts`
2. The `EmailSchemas` type mapping in `emails/index.ts`

This ensures full type safety and schema inference.

## Error Handling

The `send()` function automatically validates fields against the email's schema. If validation fails, a helpful error is thrown:

```typescript
try {
  await send('forgotPassword', {
    to: 'user@example.com',
    fields: {
      name: '', // Invalid: empty string
      link: 'not-a-url' // Invalid: not a URL
    }
  });
} catch (error) {
  // Error: Invalid fields for email "forgotPassword": name: String must contain at least 1 character(s), link: Invalid url
}
```

If an email ID doesn't exist:

```typescript
try {
  await send('nonexistentEmail', { ... });
} catch (error) {
  // Error: Email template "nonexistentEmail" not found. Available emails: forgotPassword, welcome, verifyEmail
}
```

## Architecture

### Core Components

- **`core/types.ts`**: Type definitions (EmailTemplate, SendConfig, etc.)
- **`core/registry.ts`**: Email registry that stores all templates
- **`core/base.ts`**: Base send function that validates and sends
- **`send.ts`**: `defineEmail()` and `send()` functions
- **`utils/constants.ts`**: `EMAIL_IDS` constant array with all email IDs
- **`utils/types.ts`**: `EmailId` type derived from `EMAIL_IDS` for type safety, and `EmailSchemaFor` conditional type
- **`emails/*.ts`**: Individual email definitions
- **`emails/index.ts`**: Auto-exports all emails for registration and defines `EmailSchemas` type mapping
- **`index.ts`**: Main export point

### Flow

1. Email definitions use `defineEmail()` which automatically registers them
2. All emails are imported via `emails/index.ts` when the package is loaded
3. `send()` looks up the email by ID, validates fields, and sends via existing infrastructure
4. Existing `deliverEmail()` function from `send.ts` is reused for actual delivery

## Adding New Emails

When adding a new email template:

1. Create a new email file in `emails/` directory using `defineEmail()`
2. Export it from `emails/index.ts`
3. **Important**: Add the email ID to the `EMAIL_IDS` array in `utils/constants.ts`
4. **Important**: Add the schema mapping to `EmailSchemas` type in `emails/index.ts` for type inference

Example:

```typescript
// 1. Create emails/new-email.ts
export const newEmail = defineEmail({
  id: 'newEmail',
  subject: 'New Email',
  schema: z.object({
    name: z.string(),
    code: z.string()
  }),
  render: (fields) => { ... }
});

// 2. Export from emails/index.ts
export * from './new-email';

// Import the email definition for type mapping
import type { newEmail } from './new-email';

// Add to EmailSchemas type mapping in emails/index.ts
export type EmailSchemas = {
  forgotPassword: typeof forgotPasswordEmail.template.schema;
  welcome: typeof welcomeEmail.template.schema;
  verifyEmail: typeof verifyEmailEmail.template.schema;
  newEmail: typeof newEmail.template.schema;  // ← Add here for type inference
};

// 3. Add to utils/constants.ts
export const EMAIL_IDS = [
  'forgotPassword',
  'welcome',
  'verifyEmail',
  'newEmail'  // ← Add here for type safety
] as const;
```
