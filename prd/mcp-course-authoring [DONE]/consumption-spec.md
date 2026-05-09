# MCP Consumption Spec

## Purpose

Define exactly how an MCP client such as Claude Desktop or another agent runtime should consume the ClassroomIO MCP server.

This spec assumes:

1. the agent performs source extraction externally
2. the MCP server only accepts structured course payloads
3. ClassroomIO API is the system of record

## Consumption Model

```text
User prompt/source material
  -> Claude or agent
  -> MCP tool call
  -> ClassroomIO API
  -> ClassroomIO DB
```

The MCP server is consumed as a tool surface, not as a conversational model.

## Agent Responsibilities

The agent must:

1. read source material such as PDFs, notes, prompts, or websites
2. infer a structured course outline
3. construct a normalized payload that matches the draft schema
4. call MCP tools with that payload
5. handle validation errors and revise payloads when needed
6. only publish after explicit user confirmation

The agent must not:

1. write directly to the ClassroomIO database
2. assume ClassroomIO will parse raw PDFs
3. assume drafts are automatically published

## Authentication Model

### Target model

Use an organization-scoped MCP key generated from the org `Automation -> MCP` tab.

That key should come from the same shared key infrastructure later reused by the Public API.

The MCP server forwards that credential to ClassroomIO on every request.

Example environment:

```bash
CLASSROOMIO_API_URL=https://api.classroomio.example
CLASSROOMIO_API_KEY=cio_mcp_xxxxx
```

Recommended request header:

```text
Authorization: Bearer cio_mcp_xxxxx
```

### Current bootstrap implementation

Until the shared organization key system lands, the local package uses:

```text
Authorization: Bearer <PRIVATE_SERVER_KEY>
cio-org-id: <organization-id>
x-cio-actor-id: <profile-id>
```

That is an implementation bridge, not the intended long-term auth model.

## MCP Transport

### v1

- `stdio`

This is the best default for Claude Desktop and local agent environments.

### Future

- SSE or HTTP transport if remote/shared infrastructure is needed

## Tool Surface

### `create_course_draft`

Creates a reviewable draft from a normalized payload.

Input:

```json
{
  "sourceType": "prompt",
  "idempotencyKey": "optional-key",
  "summary": {
    "sourceLabel": "Exponential Functions PDF"
  },
  "sourceArtifacts": [
    {
      "type": "pdf",
      "label": "chapter-1.pdf"
    }
  ],
  "draft": {
    "course": {
      "title": "Exponential Functions",
      "description": "A structured introduction to exponential functions.",
      "type": "SELF_PACED",
      "locale": "en"
    },
    "sections": [
      {
        "externalId": "sec-1",
        "title": "Foundations",
        "order": 0
      }
    ],
    "lessons": [
      {
        "externalId": "lesson-1",
        "sectionExternalId": "sec-1",
        "title": "What Is an Exponential Function?",
        "order": 0
      }
    ],
    "lessonLanguages": [
      {
        "lessonExternalId": "lesson-1",
        "locale": "en",
        "content": "<p>Lesson content here</p>"
      }
    ],
    "warnings": []
  }
}
```

Output:

```json
{
  "draftId": "uuid",
  "status": "DRAFT",
  "summary": {
    "sectionCount": 1,
    "lessonCount": 1,
    "localeCount": 1,
    "warningCount": 0
  },
  "warnings": []
}
```

### `get_course_draft`

Fetches the current stored draft.

Input:

```json
{
  "draftId": "uuid"
}
```

Output:

```json
{
  "id": "uuid",
  "status": "DRAFT",
  "draft": {
    "...": "normalized payload"
  },
  "warnings": []
}
```

### `update_course_draft`

Updates a stored draft with revised structure or content.

Input:

```json
{
  "draftId": "uuid",
  "draft": {
    "...": "updated normalized payload"
  }
}
```

Output:

```json
{
  "draftId": "uuid",
  "status": "DRAFT",
  "summary": {
    "sectionCount": 3,
    "lessonCount": 12,
    "localeCount": 1,
    "warningCount": 1
  },
  "warnings": [
    {
      "code": "LOW_CONFIDENCE_BOUNDARY",
      "message": "Section split was inferred.",
      "severity": "warning"
    }
  ]
}
```

### `publish_course_draft`

Publishes a stored draft into real ClassroomIO entities.

Input:

```json
{
  "draftId": "uuid",
  "title": "Optional override",
  "description": "Optional override",
  "type": "SELF_PACED"
}
```

Output:

```json
{
  "courseId": "uuid",
  "createdSections": 3,
  "createdLessons": 12,
  "localeCount": 1
}
```

## Expected Agent Workflow

### Flow A: Prompt-Based Course Creation

1. User asks Claude to create a course.
2. Claude plans the structure.
3. Claude calls `create_course_draft`.
4. Claude presents the summary to the user.
5. User requests revisions if needed.
6. Claude calls `update_course_draft`.
7. User confirms publish.
8. Claude calls `publish_course_draft`.

### Flow B: PDF-Based Course Creation

1. User provides PDF to Claude.
2. Claude extracts and structures the content externally.
3. Claude builds normalized payload.
4. Claude calls `create_course_draft`.
5. Claude presents draft summary and warnings.
6. Claude revises if needed.
7. Claude publishes only after user confirmation.

## Draft Schema Rules

The agent must ensure:

1. `section.externalId` values are unique
2. `lesson.externalId` values are unique
3. every `lesson.sectionExternalId` references an existing section
4. every `lessonLanguage.lessonExternalId` references an existing lesson
5. all required text fields are non-empty

If these rules are violated, ClassroomIO should reject the request with validation errors.

## Error Handling Contract

### Validation Errors

The MCP client should expect 400-level errors when:

- the payload shape is invalid
- section or lesson references are broken
- required fields are missing

Expected behavior:

1. surface the error to the agent
2. revise payload
3. retry with corrected structure

### Authorization Errors

The MCP client should expect:

- `401` for missing or invalid auth
- `403` for valid auth but insufficient org permission

### Publish Errors

If publish fails:

1. do not assume partial success
2. inspect returned error
3. fetch the draft again if needed
4. retry only if the failure is clearly safe to retry

## Idempotency Guidance

The MCP client should send an `idempotencyKey` on draft creation when:

- the same source material may be retried
- the same user prompt may be replayed
- the client cannot guarantee exactly-once execution

Use one stable key per logical draft creation request.

## Recommended User Experience in Claude

The agent should present:

1. course title
2. section count
3. lesson count
4. warnings
5. a publish confirmation prompt before calling `publish_course_draft`

The agent should not auto-publish immediately after draft creation.

## Minimal v1 MCP Server Requirements

The MCP server should:

1. expose the draft/publish tools above
2. validate required inputs before forwarding
3. forward auth and org context to ClassroomIO
4. return structured JSON outputs to the client
5. avoid embedding model logic

## Future Extensions

Possible future tools:

- `list_course_drafts`
- `delete_course_draft`
- `clone_course_structure`
- `add_exercises_to_draft`
- `preview_publish_diff`

These are not required for v1.
