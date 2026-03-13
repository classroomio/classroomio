# ClassroomIO MCP Server

Thin stdio MCP server for ClassroomIO course-draft authoring.

## Architecture

```text
Teacher
  |
  v
Claude Desktop / Claude Code / other MCP client
  |
  | 1. Reads prompt or PDF content
  | 2. Produces normalized course JSON
  v
ClassroomIO MCP Server (stdio)
  |
  | 3. Forwards validated tool calls
  |    - Authorization: Bearer <cio_mcp_...>
  v
ClassroomIO API
  |
  | 4. Validates payload
  | 5. Resolves org from the key
  | 6. Stores draft or publishes course
  v
ClassroomIO DB
```

## How It Comes Together

1. The agent owns reasoning and extraction.
2. The MCP server does not parse PDFs or generate course structure.
3. The MCP server only exposes tools and forwards structured payloads into ClassroomIO.
4. ClassroomIO API remains the trust boundary for auth, validation, and persistence.
5. Draft creation and publish are explicit separate steps.

## Tool Surface

- `create_course_draft`
- `get_course_draft`
- `update_course_draft`
- `publish_course_draft`

## Required Environment Variables

- `CLASSROOMIO_API_URL`
- `CLASSROOMIO_API_KEY`

## Auth Model

Current implementation uses an org-scoped automation key created in ClassroomIO under `Automation -> MCP`.

The MCP server sends that key as a bearer token on every request.

ClassroomIO API:

1. hashes and verifies the key
2. resolves the owning organization
3. checks the key scopes
4. persists the draft or publish request

The MCP server does not decide permissions. ClassroomIO API remains the source of truth.

## Run

```bash
pnpm --filter @classroomio/mcp build
CLASSROOMIO_API_URL=http://localhost:3081 \
CLASSROOMIO_API_KEY=<cio_mcp_key> \
node packages/mcp/dist/index.js
```

## Claude Code Example

```bash
claude mcp add-json classroomio '{
  "command": "npx",
  "args": ["-y", "@classroomio/mcp"],
  "env": {
    "CLASSROOMIO_API_URL": "https://api.classroomio.com",
    "CLASSROOMIO_API_KEY": "<cio_mcp_key>"
  }
}'
```

## Codex Example

```bash
codex mcp add classroomio \
  --env CLASSROOMIO_API_URL=https://api.classroomio.com \
  --env CLASSROOMIO_API_KEY=<cio_mcp_key> \
  -- npx -y @classroomio/mcp
```

## Cursor Example

```json
{
  "mcpServers": {
    "classroomio": {
      "command": "npx",
      "args": ["-y", "@classroomio/mcp"],
      "env": {
        "CLASSROOMIO_API_URL": "https://api.classroomio.com",
        "CLASSROOMIO_API_KEY": "<cio_mcp_key>"
      }
    }
  }
}
```

## User Flow Examples

This package uses the same org-scoped automation key system that will later power the public API.

Different integrations get different keys and scope presets. The infrastructure is shared, the secrets should not be.

### Flow 1: Prompt to draft to publish

User says:

```text
Create a complete course on exponential functions for high school students in ClassroomIO.
```

Expected agent behavior:

1. Claude plans the course structure.
2. Claude calls `create_course_draft` with:
   - course title and description
   - sections
   - lessons
   - lesson language content
3. Claude reviews the returned draft ID and summary.
4. User requests changes.
5. Claude calls `update_course_draft`.
6. When the user approves, Claude calls `publish_course_draft`.

Result:

- a real ClassroomIO course
- sections created
- lessons created
- lesson language content inserted

### Flow 2: PDF to draft

User says:

```text
I have my course in a PDF. Extract it and turn it into a structured ClassroomIO course draft.
```

Expected agent behavior:

1. Claude reads the PDF itself.
2. Claude extracts and restructures the material into normalized course JSON.
3. Claude calls `create_course_draft`.
4. Claude returns a summary of:
   - detected sections
   - detected lessons
   - warnings or ambiguous splits
5. User asks for revisions.
6. Claude calls `update_course_draft`.
7. User approves publish.
8. Claude calls `publish_course_draft`.

Important:

- the PDF never needs to be uploaded to the MCP server
- the MCP server only receives structured JSON

### Flow 3: Human-in-the-loop revision

User says:

```text
Move logarithmic review before growth models and shorten lesson 2.
```

Expected agent behavior:

1. Claude calls `get_course_draft`.
2. Claude computes the revised structure.
3. Claude calls `update_course_draft` with the modified payload.
4. Claude summarizes what changed before publish.

## Normalized Payload Shape

The core payload sent through the MCP server is:

```text
draft
  course
  sections[]
  lessons[]
  lessonLanguages[]
  warnings[]
  sourceReferences[] optional
  exercises[] optional
```

This keeps prompt-based creation and PDF-based extraction on the same ingestion path.
