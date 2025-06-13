# ClassroomIO Public API Documentation

## Overview

This is the public API for ClassroomIO, a course management system. The API follows RESTful principles and uses API key authentication.

## Prerequisites

### Database Setup

1. The API uses Supabase as the database
2. For development purposes, Row Level Security (RLS) must be disabled on the following tables:

   - `organization`
   - `course`
   - `lesson`
   - `lesson_language`
   - `group`
   - `groupmember`
   - `organizationmember`

   This is temporary and will be properly secured in production.

### API Key Setup

1. Each organization needs an API key to access the API
2. Generate a unique API key and add it to the `api_key` column in the `organization` table
3. Keep this API key secure as it provides access to your organization's data

## Authentication

### API Key Authentication

All API requests must include the API key in the `X-API-Key` header:

```http
X-API-Key: your-api-key-here
```

Example using cURL:

```bash
curl -H "X-API-Key: your-api-key-here" http://localhost:3003/api/v1/organizations
```

Example using Postman:

1. Add a header with key `X-API-Key` and your API key as the value
2. Or use the environment variable `{{apiKey}}` in the Postman collection

## API Endpoints

### Base URL

```
http://localhost:3003/api/v1
```

### Organizations

- `GET /organizations` - Get organization profile
- `PATCH /organizations` - Update organization profile
  ```json
  {
    "name": "Updated Organization Name",
    "avatar_url": "https://example.com/avatar.jpg"
  }
  ```

### Courses

- `GET /courses` - List courses (supports pagination and sorting)
  - Query parameters:
    - `page` (default: 1)
    - `limit` (default: 10, max: 100)
    - `sort_by` (options: created_at, title, updated_at, cost)
    - `sort_order` (options: asc, desc)
- `GET /courses/:courseId` - Get single course
- `PATCH /courses/:courseId` - Update course
- `POST /courses/:courseId/enrollments` - Enroll user in course

### Lessons

- `GET /courses/:courseId/lessons` - List course lessons
  - Query parameters:
    - `page` (default: 1)
    - `limit` (default: 10, max: 100)
    - `sort_by` (options: created_at, title, order, updated_at)
    - `sort_order` (options: asc, desc)
- `GET /lessons/:lessonId` - Get single lesson
- `PATCH /lessons/:lessonId` - Update lesson
- `PATCH /lessons/:lessonId/lock` - Toggle lesson lock status

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    "version": "v1",
    "timestamp": "2024-03-21T12:00:00.000Z",
    "pagination": {
      // Pagination info if applicable
    }
  }
}
```

## Error Handling

Errors follow this format:

```json
{
  "success": false,
  "error": "Error message or validation errors",
  "meta": {
    "version": "v1",
    "timestamp": "2024-03-21T12:00:00.000Z"
  }
}
```

Common HTTP Status Codes:

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing API key)
- `404` - Not Found
- `500` - Server Error

## Development Setup

1. Navigate to the backend directory:

   ```bash
   cd apps/backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=3003
   ```

4. Start the development server:
   ```bash
   npm run api:dev
   ```

## Testing

The easiest way to test the API is using the included Postman collection:

1. Open Postman
2. Click "Import" button
3. Select the file `src/public/v1/tests/postman_collection.json` from this repository
4. Set up your environment variables in Postman:
   - `baseUrl`: http://localhost:3003/api/v1
   - `apiKey`: Your organization's API key (from the `api_key` column in the `organization` table)

That's it! You can now test all endpoints directly from Postman. The collection includes examples for all available endpoints with proper headers and request bodies.

## Security Notes

1. The current setup with RLS disabled is for development only
2. In production:
   - RLS will be enabled
   - API keys will be properly secured
   - Additional security measures will be implemented
3. Never commit API keys or sensitive credentials to version control

## Support

For development support or to report issues, please contact the development team.
