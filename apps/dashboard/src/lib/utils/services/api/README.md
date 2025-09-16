# API Client

## Basic Usage

```typescript
import { apiClient, safeRequest, rpc } from '$lib/utils/services/api';

// GET request
const result = await safeRequest(async () => {
  return apiClient.request('/api/users', { method: 'GET' });
});

// POST request
const result = await safeRequest(async () => {
  return apiClient.request('/api/users', {
    method: 'POST',
    body: { name: 'John', email: 'john@example.com' }
  });
});

// Handle response
if (result.success) {
  console.log('Data:', result.data);
} else {
  console.error('Error:', result.error.message);
}
```

## Error Handling

```typescript
if (result.success) {
  // Success
  console.log(result.data);
} else {
  // Check error type
  if (result.error.error_code === 'auth') {
    window.location.href = '/login';
  } else if (result.error.error_code === 'client') {
    showError('Please check your input');
  } else if (result.error.error_code === 'server') {
    showError('Server error, please try again');
  }
}
```

## Custom Fetch

```typescript
import { createApiClient } from '$lib/utils/services/api';

const customClient = createApiClient({
  customFetch: (input, init) => {
    // Your custom fetch logic
    return fetch(input, init);
  }
});

const result = await safeRequest(async () => {
  return customClient.request('/api/data', { method: 'GET' });
});
```

## RPC Usage

```typescript
import { rpc } from '$lib/utils/services/api';

// Use with Hono RPC
const data = await rpc.users.$get();
const user = await rpc.users.$post({ json: { name: 'John' } });
```

## Error Codes

- `'auth'` - 401 Unauthorized
- `'client'` - 400-499 Client errors
- `'server'` - 500-599 Server errors
- `'timeout'` - 408 Request timeout
- `'network'` - 0 Network issues
