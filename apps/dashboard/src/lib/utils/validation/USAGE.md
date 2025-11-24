# Convention-Based Validation with Translations

## Overview

We use **convention-based translation keys** for Zod validation errors. This approach:
- ✅ No metadata needed - just follow the naming pattern
- ✅ Clean shared schemas without hardcoded messages
- ✅ Automatic fallback to generic translations
- ✅ Works with multiple validation rules per field

## Convention

Translation keys follow this pattern:

```
validations.{fieldName}.{errorCode}
```

### Common Error Codes

| Error Code | When It Occurs | Example Field |
|------------|----------------|---------------|
| `too_small` | String too short, number too small, array too few items | username.too_small |
| `too_big` | String too long, number too large, array too many items | bio.too_big |
| `invalid_email` | Invalid email format | email.invalid_email |
| `invalid_url` | Invalid URL format | website.invalid_url |
| `invalid_type` | Wrong type (e.g., undefined when string expected) | username.invalid_type |
| `invalid_enum_value` | Value not in allowed options | role.invalid_enum_value |

## Quick Start

### 1. Import Schema and Error Mapper

```typescript
import { ZEmailData } from '@cio/utils/validation/mail';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

let formData = { to: '', subject: '', content: '' };
let errors: Record<string, string> = {};

function handleSubmit() {
  const result = ZEmailData.safeParse(formData);
  
  if (!result.success) {
    errors = mapZodErrorsToTranslations(result.error);
    return;
  }
  
  // Use validated data
  sendEmail(result.data);
}
```

### 2. Add Translation Keys

```json
{
  "validations": {
    "to": {
      "invalid_email": "Invalid email address",
      "invalid_type": "Email is required"
    },
    "subject": {
      "too_small": "Subject is required",
      "too_big": "Subject is too long"
    },
    "content": {
      "too_small": "Content must be at least 1 character",
      "too_big": "Content is too long"
    },
    
    "generic": {
      "required": "This field is required",
      "invalid_email": "Invalid email address",
      "invalid_url": "Invalid URL",
      "too_small_string": "Must be at least {min} characters",
      "too_big_string": "Must be at most {max} characters"
    }
  }
}
```

## Complete Example: User Profile Form

### Schema (Shared)

```typescript
// packages/utils/src/validation/user/user.ts
export const ZUserProfile = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  bio: z.string().min(10).max(500).optional(),
  age: z.number().min(13).max(120)
});
```

### Component

```typescript
// Component.svelte
<script lang="ts">
  import { ZUserProfile } from '@cio/utils/validation/user';
  import { mapZodErrorsToTranslations } from '$lib/utils/validation';
  
  let formData = {
    email: '',
    username: '',
    bio: '',
    age: 0
  };
  
  let errors: Record<string, string> = {};
  
  function handleSubmit() {
    const result = ZUserProfile.safeParse(formData);
    
    if (!result.success) {
      errors = mapZodErrorsToTranslations(result.error);
      return;
    }
    
    // Success!
    saveProfile(result.data);
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="email">Email</label>
    <input id="email" type="email" bind:value={formData.email} />
    {#if errors.email}
      <span class="error">{errors.email}</span>
    {/if}
  </div>

  <div>
    <label for="username">Username</label>
    <input id="username" bind:value={formData.username} />
    {#if errors.username}
      <span class="error">{errors.username}</span>
    {/if}
  </div>

  <div>
    <label for="bio">Bio</label>
    <textarea id="bio" bind:value={formData.bio}></textarea>
    {#if errors.bio}
      <span class="error">{errors.bio}</span>
    {/if}
  </div>

  <div>
    <label for="age">Age</label>
    <input id="age" type="number" bind:value={formData.age} />
    {#if errors.age}
      <span class="error">{errors.age}</span>
    {/if}
  </div>

  <button type="submit">Save Profile</button>
</form>
```

### Translations

```json
{
  "validations": {
    "email": {
      "invalid_email": "Invalid email address",
      "invalid_type": "Email is required"
    },
    "username": {
      "too_small": "Username must be at least 3 characters",
      "too_big": "Username cannot exceed 20 characters",
      "invalid_type": "Username is required"
    },
    "bio": {
      "too_small": "Bio must be at least 10 characters",
      "too_big": "Bio cannot exceed 500 characters"
    },
    "age": {
      "too_small": "You must be at least 13 years old",
      "too_big": "Invalid age",
      "invalid_type": "Age is required"
    }
  }
}
```

## Multiple Errors Per Field

Zod validates in order and returns the **first error** it encounters:

```typescript
// Schema
z.string().min(3).max(20)

// Input: ""
// Error: too_small (stops at first rule)
// Translation: validations.username.too_small

// Input: "ab"
// Error: too_small (still fails first rule)
// Translation: validations.username.too_small

// Input: "this_is_way_too_long_username"
// Error: too_big (passed min, failed max)
// Translation: validations.username.too_big
```

## Fallback Strategy

The error mapper tries translations in this order:

1. **Specific field + error code**: `validations.email.invalid_email`
2. **Generic error type**: `validations.generic.invalid_email`
3. **Zod's default message**: "Invalid email"

## Advanced: Helper Function

For cleaner code, use the helper:

```typescript
import { validateWithTranslation } from '$lib/utils/validation';

function handleSubmit() {
  const result = validateWithTranslation(ZUserProfile, formData);
  
  if ('errors' in result) {
    errors = result.errors;
    return;
  }
  
  // Success - result.data is typed!
  saveProfile(result.data);
}
```

## Adding New Fields

1. **Add to schema** (in packages/utils):
```typescript
export const ZUserProfile = z.object({
  // ... existing fields
  website: z.string().url().optional()
});
```

2. **Add translations**:
```json
{
  "validations": {
    "website": {
      "invalid_url": "Please enter a valid URL",
      "invalid_type": "Website is required"
    }
  }
}
```

3. **That's it!** No metadata, no reimplementation.

## Generic Fallbacks

If you don't add specific translations, the mapper uses generic ones:

```json
{
  "validations": {
    "generic": {
      "required": "This field is required",
      "invalid_email": "Invalid email address",
      "invalid_url": "Invalid URL",
      "invalid_format": "Invalid format",
      "too_small_string": "Must be at least {min} characters",
      "too_big_string": "Must be at most {max} characters",
      "too_small_number": "Must be at least {min}",
      "too_big_number": "Must be at most {max}",
      "invalid_enum": "Must be one of: {options}",
      "error": "Validation error"
    }
  }
}
```

Just remove the message parameter and add the translation key following the convention!
