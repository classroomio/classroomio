# Validation Schemas

Shared validation schemas for ClassroomIO workspace using Zod with **convention-based translations**.

## Structure

Each entity has its own folder with entity-specific schemas:

```
validation/
├── course/
│   ├── course.ts      # Course validation schemas
│   └── index.ts       # Re-exports
├── mail/
│   ├── mail.ts        # Email validation schemas
│   └── index.ts       # Re-exports
├── constants.ts       # Shared constants
├── index.ts           # Main entry point
├── README.md          # This file
└── USAGE.md           # Detailed usage guide
```

## Quick Start

### Import Schemas

```typescript
// Import from main module
import { ZCourseClone, TCourseClone } from '@cio/utils/validation';

// Import from entity module
import { ZEmailData } from '@cio/utils/validation/mail';
```

### Backend Usage (API)

Schemas are used **without custom error messages** - just validation rules:

```typescript
import { ZCourseClone } from '@cio/utils/validation';
import { zValidator } from '@hono/zod-validator';

export const cloneRouter = new Hono()
  .post('/', zValidator('json', ZCourseClone), async (c) => {
    const data = c.req.valid('json'); // Fully typed!
    // ... handle validated data
  });
```

### Frontend Usage (Dashboard)

Use the error mapper to get translated messages:

```typescript
import { ZEmailData } from '@cio/utils/validation/mail';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

let formData = { to: '', subject: '', content: '' };
let errors: Record<string, string> = {};

function handleSubmit() {
  const result = ZEmailData.safeParse(formData);
  
  if (!result.success) {
    // Automatically maps to translations using convention
    errors = mapZodErrorsToTranslations(result.error);
    return;
  }
  
  // Use validated data
  doSomething(result.data);
}
```

## Translation Convention

We use **convention-based translation keys** to avoid hardcoding messages in schemas.

### How It Works

Schemas are clean with **no custom error messages**:

```typescript
// ✅ Clean schema (in @cio/utils)
export const ZEmailData = z.object({
  to: z.string().email(),        // No message
  subject: z.string().min(1),    // No message
  content: z.string().min(10)    // No message
});
```

Frontend maps errors to translations using this convention:

```
validations.{fieldName}.{errorCode}
```

### Example Translation Keys

| Field | Validation | Error Code | Translation Key |
|-------|-----------|------------|-----------------|
| `to` | `.email()` | `invalid_string` | `validations.to.invalid_email` |
| `subject` | `.min(1)` | `too_small` | `validations.subject.too_small` |
| `username` | `.min(3)` | `too_small` | `validations.username.too_small` |
| `username` | `.max(20)` | `too_big` | `validations.username.too_big` |

### Translation File Example

```json
{
  "validations": {
    "to": {
      "invalid_email": "Invalid email address",
      "invalid_type": "Email is required"
    },
    "subject": {
      "too_small": "Subject is required"
    },
    "username": {
      "too_small": "Username must be at least 3 characters",
      "too_big": "Username cannot exceed 20 characters"
    },
    "generic": {
      "required": "This field is required",
      "invalid_email": "Invalid email address",
      "too_small_string": "Must be at least {min} characters"
    }
  }
}
```

### Benefits

✅ **Single Source of Truth** - Schema defined once, used everywhere  
✅ **No Duplication** - Don't reimplement schemas in frontend  
✅ **Flexible** - Add specific translations or use generic fallbacks  
✅ **Multilingual** - Easy to translate without touching schemas  
✅ **Maintainable** - Change schema once, translations adapt automatically

### Common Error Codes

| Zod Error | When It Occurs |
|-----------|----------------|
| `too_small` | String too short, number too small, array too few items |
| `too_big` | String too long, number too large, array too many items |
| `invalid_email` | Invalid email format (from `.email()`) |
| `invalid_url` | Invalid URL format (from `.url()`) |
| `invalid_type` | Wrong type (e.g., undefined when string expected) |
| `invalid_enum_value` | Value not in allowed options |

## Naming Convention

- **Schemas**: Prefixed with `Z` (e.g., `ZCourseClone`)
- **Types**: Prefixed with `T` (e.g., `TCourseClone`)
- **Translation Keys**: Follow pattern `validations.{field}.{errorCode}`

## Adding New Validations

### 1. Create Schema in Utils Package

```typescript
// packages/utils/src/validation/lesson/lesson.ts
import * as z from 'zod';

/**
 * Lesson Create Validation Schema
 * Used for creating new lessons
 * 
 * Translation keys:
 * - validations.title.too_small
 * - validations.duration.too_small
 */
export const ZLessonCreate = z.object({
  title: z.string().min(1),       // Clean - no message
  duration: z.number().min(1)     // Clean - no message
});
export type TLessonCreate = z.infer<typeof ZLessonCreate>;

// validation/lesson/index.ts
export * from './lesson';
```

### 2. Export from Main Module

```typescript
// packages/utils/src/validation/index.ts
export * from './course';
export * from './mail';
export * from './lesson';  // Add this
```

### 3. Use in API

```typescript
// apps/api/src/routes/lesson/create.ts
import { ZLessonCreate } from '@cio/utils/validation/lesson';
import { zValidator } from '@hono/zod-validator';

export const lessonRouter = new Hono()
  .post('/', zValidator('json', ZLessonCreate), async (c) => {
    const data = c.req.valid('json');
    // ... create lesson
  });
```

### 4. Add Translations in Frontend

```json
// apps/dashboard/src/lib/utils/translations/en.json
{
  "validations": {
    "title": {
      "too_small": "Title is required",
      "too_big": "Title is too long"
    },
    "duration": {
      "too_small": "Duration must be at least 1 minute"
    }
  }
}
```

### 5. Use in Frontend Form

```typescript
// apps/dashboard/src/lib/components/LessonForm.svelte
import { ZLessonCreate } from '@cio/utils/validation/lesson';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

let formData = { title: '', duration: 0 };
let errors = {};

function handleSubmit() {
  const result = ZLessonCreate.safeParse(formData);
  
  if (!result.success) {
    errors = mapZodErrorsToTranslations(result.error);
    // errors.title = "Title is required" (translated)
    return;
  }
  
  createLesson(result.data);
}
```

## Best Practices

### 1. Keep Schemas Clean - No Error Messages

Schemas should contain **only validation rules**, no custom messages:

```typescript
// ✅ Good - Clean schema
export const ZUserProfile = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20)
});

// ❌ Bad - Hardcoded messages
export const ZUserProfile = z.object({
  email: z.string().email('Invalid email'),           // Don't do this
  username: z.string().min(3, 'Too short')            // Don't do this
});

// ❌ Bad - Translated messages in schema
export const ZUserProfile = z.object({
  email: z.string().email(t.get('validations.email')) // Don't do this
});
```

**Why?** Schemas are shared between backend (no translations) and frontend (with translations). Keep them clean and universal.

### 2. Always Export Types

```typescript
export const ZCourseClone = z.object({ /* ... */ });
export type TCourseClone = z.infer<typeof ZCourseClone>;
```

### 3. Document Schemas with Translation Keys

Help frontend developers know which translation keys to add:

```typescript
/**
 * User Profile Validation Schema
 * Used for updating user profile information
 * 
 * Translation keys (convention-based):
 * - validations.email.invalid_email
 * - validations.username.too_small
 * - validations.username.too_big
 * - validations.bio.too_big
 */
export const ZUserProfile = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  bio: z.string().max(500).optional()
});
export type TUserProfile = z.infer<typeof ZUserProfile>;
```

### 4. Use Descriptive Field Names

Field names become part of translation keys, so use clear names:

```typescript
// ✅ Good - Clear field names
z.object({
  email: z.string().email(),
  fullName: z.string().min(5),
  phoneNumber: z.string().min(10)
});
// Translation keys: validations.email.*, validations.fullName.*, validations.phoneNumber.*

// ❌ Bad - Unclear field names
z.object({
  e: z.string().email(),
  fn: z.string().min(5),
  ph: z.string().min(10)
});
// Translation keys: validations.e.*, validations.fn.*, validations.ph.* (unclear!)
```

### 5. Group Related Validations

Keep related schemas together in the same entity folder:

```typescript
// validation/user/user.ts
export const ZUserCreate = z.object({ /* ... */ });
export const ZUserUpdate = z.object({ /* ... */ });
export const ZUserProfile = z.object({ /* ... */ });
```

### 6. Don't Duplicate Schemas

**Never** reimplement schemas in the frontend:

```typescript
// ❌ Bad - Reimplementing in frontend
// apps/dashboard/src/schemas/user.ts
export const userSchema = z.object({
  email: z.string().email(t.get('validations.email.invalid')),
  // ... duplicating from @cio/utils
});

// ✅ Good - Import and use error mapper
import { ZUserProfile } from '@cio/utils/validation/user';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

const result = ZUserProfile.safeParse(data);
if (!result.success) {
  errors = mapZodErrorsToTranslations(result.error);
}
```
