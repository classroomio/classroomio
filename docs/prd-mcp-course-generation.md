# PRD: ClassroomIO MCP Server for AI-Powered Course Generation

**Author:** Engineering  
**Status:** Draft  
**Created:** 2026-03-06  
**Target Release:** v2.x  

---

## 1. Overview

### 1.1 Problem Statement

Educators spend hours manually building courses in ClassroomIO: creating sections, writing lesson content, building exercises, and structuring everything into a coherent curriculum. Meanwhile, they often already have their material in existing formats (PDFs, notes, syllabi) or have a clear topic in mind but lack time to translate it into the ClassroomIO data model.

### 1.2 Proposed Solution

Build a **Model Context Protocol (MCP) server** for ClassroomIO that exposes course management operations as tools that AI assistants (Claude, etc.) can call directly. This enables two powerful workflows:

1. **Generative workflow** — A user tells Claude *"Create a complete course on Exponential Functions in my ClassroomIO organization"* and Claude generates the full course structure, lesson content, and exercises, then writes everything into ClassroomIO via MCP tools.

2. **Import workflow** — A user provides PDF files of their existing lecture materials and says *"Extract my content and publish it into ClassroomIO as a structured course."* Claude reads the PDFs, structures the content into sections/lessons/exercises, and creates the course via MCP tools.

### 1.3 Success Metrics

| Metric | Target |
|--------|--------|
| Time to create a 10-lesson course | < 5 minutes (vs. ~2 hours manual) |
| Courses created via MCP per active org (monthly) | > 3 within 6 months of launch |
| User satisfaction (post-creation survey) | > 4.2 / 5 |
| PDF import accuracy (content preservation) | > 90% |

---

## 2. Background & Context

### 2.1 What is MCP?

The **Model Context Protocol (MCP)** is an open standard that allows AI assistants to interact with external systems through a structured interface of **tools** (actions), **resources** (data), and **prompts** (templates). By implementing an MCP server, ClassroomIO becomes a first-class integration target for Claude Desktop, Cursor, and any MCP-compatible client.

### 2.2 Current ClassroomIO Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit dashboard |
| Backend API | Hono (Node.js) on port 3002 |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT sessions) |
| Existing AI | OpenAI GPT-4o for lesson outlines, notes, exercises |

### 2.3 Current Data Model Hierarchy

```
Organization
  └── Group
        └── Course (V2 with sections)
              ├── Lesson Section (ordered)
              │     └── Lesson (ordered)
              │           ├── note (HTML content)
              │           ├── videos (JSONB)
              │           ├── documents (JSONB)
              │           ├── slide_url
              │           └── Exercise
              │                 └── Question (RADIO | CHECKBOX | TEXTAREA)
              │                       └── Option (for RADIO/CHECKBOX)
              └── metadata (JSONB: grading config, tabs order, etc.)
```

### 2.4 Existing AI Capabilities

ClassroomIO already has AI endpoints for per-lesson generation:

- `POST /api/completion` — Generate lesson outline / note / activities (streaming, GPT-4o)
- `POST /api/completion/exerciseprompt` — Generate exercises from lesson content (streaming, GPT-4o)
- `POST /api/completion/gradingprompt` — AI-assisted grading
- `POST /api/completion/customprompt` — Custom AI completions

The MCP server is **complementary** — it operates at the *course* level (orchestrating full course creation) while these endpoints operate at the *lesson* level. The MCP tools may internally leverage these existing AI endpoints or call the LLM directly.

---

## 3. User Stories

### 3.1 Primary Personas

- **Educator (Teacher/Professor)**: Wants to quickly create courses from their expertise or existing materials.
- **Course Designer**: Builds curriculum for organizations, needs to rapidly prototype course structures.
- **Institution Admin**: Wants to populate their ClassroomIO instance with a library of courses.

### 3.2 User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-1 | Educator | Tell Claude "Create a complete course on Exponential Functions" and have it built in ClassroomIO | I can have a ready-to-edit course in minutes instead of hours |
| US-2 | Educator | Give Claude my PDF lecture notes and have them turned into a structured ClassroomIO course | I can digitize my existing material without manual data entry |
| US-3 | Educator | Review and edit the AI-generated course after creation | I maintain quality control and can add my personal touch |
| US-4 | Course Designer | Ask Claude to generate exercises for each lesson based on the content | Students have assessments aligned with the material |
| US-5 | Course Designer | Ask Claude to list my existing courses and add new lessons to them | I can incrementally build on existing courses |
| US-6 | Institution Admin | Bulk-generate multiple courses via scripted MCP tool calls | I can bootstrap a course catalog quickly |
| US-7 | Educator | Ask Claude to create a course in a specific language/locale | I can serve students in their preferred language |

---

## 4. Technical Design

### 4.1 Architecture Overview

```
┌─────────────────────┐     MCP Protocol      ┌──────────────────────┐
│   Claude Desktop /  │◄────(stdio/SSE)──────►│  ClassroomIO MCP     │
│   Cursor / Any MCP  │                        │  Server              │
│   Client            │                        │  (apps/mcp-server)   │
└─────────────────────┘                        └──────┬───────────────┘
                                                      │
                                                      │ Supabase Client
                                                      │ (service role)
                                                      ▼
                                               ┌──────────────────────┐
                                               │  Supabase / Postgres │
                                               │  (existing DB)       │
                                               └──────────────────────┘
```

The MCP server is a **new app** in the monorepo at `apps/mcp-server/`, implemented in TypeScript using the official `@modelcontextprotocol/sdk` package. It communicates with the ClassroomIO database via the Supabase client (using the service role key for full access, scoped by the authenticated user's organization).

### 4.2 Transport Modes

The server should support two transport modes:

1. **stdio** (default) — For local usage with Claude Desktop and Cursor. The MCP client spawns the server as a child process.
2. **SSE (Server-Sent Events)** — For remote/hosted usage. Runs as an HTTP server that MCP clients can connect to over the network.

### 4.3 Authentication & Authorization

**Current state:** ClassroomIO uses Supabase Auth (JWT sessions). There is no API key system.

**Proposed approach:**

1. **New `api_key` table** in the database:

```sql
CREATE TABLE api_key (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix VARCHAR(8) NOT NULL,        -- e.g., "cio_abc1" for display
    name VARCHAR(255) NOT NULL,             -- user-given label
    profile_id UUID NOT NULL REFERENCES profile(id),
    organization_id UUID NOT NULL REFERENCES organization(id),
    permissions JSONB DEFAULT '["courses:write", "courses:read"]',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_key_hash ON api_key(key_hash);
CREATE INDEX idx_api_key_profile ON api_key(profile_id);
```

2. **Key format:** `cio_<random_48_chars>` — stored as a SHA-256 hash; the plaintext is shown once at creation.

3. **Dashboard UI** for API key management under Organization Settings (create, list, revoke).

4. **MCP server auth flow:**
   - The API key is provided as an environment variable (`CLASSROOMIO_API_KEY`) or passed via MCP server configuration.
   - On startup, the MCP server validates the key against the `api_key` table and resolves the associated `profile_id` and `organization_id`.
   - All database operations are scoped to that organization.

### 4.4 MCP Tools

#### 4.4.1 Course Management Tools

| Tool | Description | Parameters |
|------|------------|------------|
| `list_courses` | List all courses in the user's organization | `status?: "ACTIVE" \| "DELETED"` |
| `get_course` | Get full course details including sections, lessons, exercises | `course_id: string` |
| `create_course` | Create a new course with group and tutor assignment | `title, description, type?: "SELF_PACED" \| "LIVE_CLASS", is_published?: boolean` |
| `update_course` | Update course metadata | `course_id, title?, description?, is_published?, metadata?` |
| `delete_course` | Soft-delete a course | `course_id` |

#### 4.4.2 Section & Lesson Tools

| Tool | Description | Parameters |
|------|------------|------------|
| `add_section` | Add a section to a course | `course_id, title, order?` |
| `add_lesson` | Add a lesson to a course/section with content | `course_id, section_id?, title, content_html, order?, is_unlocked?: boolean` |
| `update_lesson` | Update lesson content or metadata | `lesson_id, title?, content_html?, video_url?, slide_url?` |
| `delete_lesson` | Delete a lesson | `lesson_id` |
| `list_lessons` | List lessons for a course | `course_id` |

#### 4.4.3 Exercise & Assessment Tools

| Tool | Description | Parameters |
|------|------------|------------|
| `add_exercise` | Add an exercise with questions to a lesson | `lesson_id, title, description?, questions: Question[]` |
| `update_exercise` | Update an exercise | `exercise_id, title?, description?, questions?` |
| `delete_exercise` | Delete an exercise | `exercise_id` |

Where `Question` is:

```typescript
interface Question {
  title: string;
  type: "RADIO" | "CHECKBOX" | "TEXTAREA";
  points?: number;
  order?: number;
  options?: {
    label: string;
    is_correct: boolean;
  }[];
}
```

#### 4.4.4 Bulk / Orchestration Tools

| Tool | Description | Parameters |
|------|------------|------------|
| `create_full_course` | Create a complete course with sections, lessons, and exercises in a single call | `title, description, type?, sections: SectionWithLessons[]` |
| `import_pdf_to_course` | Accept a PDF (as base64 or file path) and create a structured course from its content | `pdf_content: string (base64), title?, description?` |

Where `SectionWithLessons` is:

```typescript
interface SectionWithLessons {
  title: string;
  order?: number;
  lessons: {
    title: string;
    content_html: string;
    order?: number;
    exercises?: {
      title: string;
      description?: string;
      questions: Question[];
    }[];
  }[];
}
```

The `create_full_course` tool is critical for the generative workflow. It allows Claude to plan the entire course structure in one reasoning step, then execute a single tool call to create everything. This avoids chatty back-and-forth with many individual tool calls.

### 4.5 MCP Resources

Resources provide read access to ClassroomIO data for context-gathering:

| Resource URI | Description |
|-------------|------------|
| `classroomio://courses` | List of all courses (id, title, description, status) |
| `classroomio://courses/{id}` | Full course detail with sections, lessons, exercises |
| `classroomio://courses/{id}/lessons/{lesson_id}` | Single lesson with full content |
| `classroomio://organization` | Organization info (name, id) |

### 4.6 MCP Prompts

Pre-built prompt templates to guide Claude:

| Prompt | Description | Arguments |
|--------|------------|-----------|
| `generate-course` | Template for generating a full course from a topic | `topic, level? (beginner/intermediate/advanced), num_lessons?, locale?` |
| `import-pdf-course` | Template for structuring PDF content into a course | `pdf_description?` |
| `add-exercises` | Template for generating exercises for an existing course | `course_id` |

Example `generate-course` prompt template:

```
You are creating a course for ClassroomIO. Generate a comprehensive, 
well-structured course on the topic: "{{topic}}"

Level: {{level | default: "intermediate"}}
Target number of lessons: {{num_lessons | default: 10}}
Language: {{locale | default: "en"}}

Structure the course with logical sections, each containing related lessons.
Each lesson should have:
- Detailed HTML content (2000+ words) with headings, examples, and key concepts
- 1-2 exercises with a mix of multiple-choice and open-ended questions

Use the `create_full_course` tool to create everything at once.
```

---

## 5. Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

**Goal:** MCP server scaffold with authentication and basic CRUD tools.

| Task | Details |
|------|---------|
| 1.1 | Create `apps/mcp-server/` package in monorepo |
| 1.2 | Set up TypeScript project with `@modelcontextprotocol/sdk` |
| 1.3 | Add `api_key` table migration and RLS policies |
| 1.4 | Implement API key validation and org/profile resolution |
| 1.5 | Implement `list_courses`, `get_course`, `create_course` tools |
| 1.6 | Implement `add_section`, `add_lesson`, `update_lesson` tools |
| 1.7 | Support stdio transport |
| 1.8 | Write integration tests against a test Supabase instance |

### Phase 2: Exercises & Bulk Operations (Weeks 3-4)

**Goal:** Complete CRUD tools and the critical `create_full_course` tool.

| Task | Details |
|------|---------|
| 2.1 | Implement `add_exercise`, `update_exercise`, `delete_exercise` tools |
| 2.2 | Implement `create_full_course` bulk tool with transactional creation |
| 2.3 | Implement MCP resources (course listing, course detail) |
| 2.4 | Implement MCP prompt templates |
| 2.5 | Add SSE transport support |
| 2.6 | End-to-end testing: Claude Desktop → MCP → full course creation |

### Phase 3: PDF Import & Dashboard UI (Weeks 5-6)

**Goal:** PDF extraction and API key management in the dashboard.

| Task | Details |
|------|---------|
| 3.1 | Implement `import_pdf_to_course` tool with PDF text extraction |
| 3.2 | Add API key management UI in dashboard (Settings → API Keys) |
| 3.3 | Add API key CRUD endpoints to the Hono API |
| 3.4 | Write documentation: setup guide, Claude Desktop config, example prompts |
| 3.5 | Add usage tracking and rate limiting on API keys |

### Phase 4: Polish & Launch (Week 7)

| Task | Details |
|------|---------|
| 4.1 | Error handling, validation, and edge cases |
| 4.2 | Performance optimization for large course creation |
| 4.3 | Security audit (API key handling, input sanitization, RLS verification) |
| 4.4 | Beta testing with select users |
| 4.5 | Launch blog post and documentation |

---

## 6. Detailed Technical Specifications

### 6.1 Project Structure

```
apps/mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Entry point, server setup
│   ├── server.ts                   # MCP server configuration
│   ├── auth/
│   │   └── api-key.ts              # API key validation
│   ├── tools/
│   │   ├── courses.ts              # Course CRUD tools
│   │   ├── sections.ts             # Section tools
│   │   ├── lessons.ts              # Lesson tools
│   │   ├── exercises.ts            # Exercise & question tools
│   │   ├── bulk.ts                 # create_full_course, import_pdf_to_course
│   │   └── index.ts                # Tool registry
│   ├── resources/
│   │   └── index.ts                # MCP resource handlers
│   ├── prompts/
│   │   └── index.ts                # MCP prompt templates
│   ├── services/
│   │   ├── supabase.ts             # Supabase client setup
│   │   └── pdf-extractor.ts        # PDF text extraction
│   └── types/
│       └── index.ts                # Shared TypeScript types
└── tests/
    ├── tools/
    │   ├── courses.test.ts
    │   ├── lessons.test.ts
    │   └── bulk.test.ts
    └── auth.test.ts
```

### 6.2 `create_full_course` Tool — Detailed Flow

This is the most important tool, enabling the single-call generative workflow:

```
Input: { title, description, type, sections[] }
                    │
                    ▼
           ┌─────────────────┐
           │  Create Group    │
           │  (organization)  │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Create Course   │
           │  (V2, group_id)  │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Add creator as  │
           │  Tutor           │
           └────────┬────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  For each section:   │
         │  INSERT lesson_section│
         │                      │
         │  For each lesson:    │
         │  INSERT lesson       │
         │  (note = content_html)│
         │                      │
         │  For each exercise:  │
         │  INSERT exercise     │
         │  INSERT questions    │
         │  INSERT options      │
         └──────────┬───────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Return course   │
           │  summary + URL   │
           └─────────────────┘
```

The tool wraps everything in error handling with cleanup on failure (delete partially created entities). It returns a structured result containing the course ID, URL, and a summary of what was created (number of sections, lessons, exercises).

### 6.3 `import_pdf_to_course` Tool — Detailed Flow

```
Input: { pdf_content (base64), title?, description? }
                    │
                    ▼
           ┌──────────────────────┐
           │  Extract text from   │
           │  PDF (pdf-parse)     │
           └────────┬─────────────┘
                    │
                    ▼
           ┌──────────────────────┐
           │  Return extracted    │
           │  text + metadata     │
           │  to Claude           │
           └────────┬─────────────┘
                    │
        Claude structures the content
        into sections/lessons using
        its own reasoning, then calls
        `create_full_course`
```

**Important design decision:** The `import_pdf_to_course` tool focuses on **extraction only** — it returns the raw text content back to Claude, which then uses its intelligence to structure it into a course and calls `create_full_course`. This keeps the MCP server simple and leverages Claude's superior content understanding. The tool may optionally provide structural hints (detected headings, page breaks, etc.) to help Claude organize the content.

### 6.4 API Key Validation

```typescript
async function validateApiKey(apiKey: string): Promise<{
  profileId: string;
  organizationId: string;
  permissions: string[];
} | null> {
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  const { data } = await supabase
    .from('api_key')
    .select('profile_id, organization_id, permissions, expires_at, revoked_at')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single();
  
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  
  // Update last_used_at
  await supabase
    .from('api_key')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash);
  
  return {
    profileId: data.profile_id,
    organizationId: data.organization_id,
    permissions: data.permissions
  };
}
```

### 6.5 Error Handling Strategy

All tools return structured errors following MCP conventions:

```typescript
// Success
{ content: [{ type: "text", text: JSON.stringify(result) }] }

// Error
{ content: [{ type: "text", text: JSON.stringify({ error: "message", code: "ERROR_CODE" }) }], isError: true }
```

Error codes:
- `AUTH_INVALID_KEY` — Invalid or expired API key
- `AUTH_INSUFFICIENT_PERMISSIONS` — Key lacks required permission
- `COURSE_NOT_FOUND` — Course ID doesn't exist or not in org
- `VALIDATION_ERROR` — Invalid input parameters
- `CREATION_FAILED` — Database error during creation
- `PDF_EXTRACTION_FAILED` — Could not parse PDF content

---

## 7. Configuration & Setup

### 7.1 Claude Desktop Configuration

Users add to their `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "classroomio": {
      "command": "npx",
      "args": ["@classroomio/mcp-server"],
      "env": {
        "CLASSROOMIO_API_KEY": "cio_your_api_key_here",
        "CLASSROOMIO_SUPABASE_URL": "https://your-project.supabase.co",
        "CLASSROOMIO_SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
      }
    }
  }
}
```

**For self-hosted instances**, users provide their own Supabase URL and service role key.

**For ClassroomIO Cloud** (future), the server could be hosted and only require the API key, connecting via SSE:

```json
{
  "mcpServers": {
    "classroomio": {
      "url": "https://mcp.classroomio.com/sse",
      "headers": {
        "Authorization": "Bearer cio_your_api_key_here"
      }
    }
  }
}
```

### 7.2 Environment Variables

| Variable | Required | Description |
|----------|----------|------------|
| `CLASSROOMIO_API_KEY` | Yes | API key for authentication |
| `CLASSROOMIO_SUPABASE_URL` | Yes (self-hosted) | Supabase project URL |
| `CLASSROOMIO_SUPABASE_SERVICE_ROLE_KEY` | Yes (self-hosted) | Supabase service role key |

---

## 8. Example User Flows

### 8.1 Flow 1: Generate a Course from a Topic

**User in Claude Desktop:**
> Create a complete course on "Exponential Functions" for my high school students in ClassroomIO. Make it beginner-friendly with 8 lessons and exercises for each lesson.

**Claude's actions:**
1. Calls `generate-course` prompt template internally to structure its thinking
2. Plans the full course: 3 sections, 8 lessons, 8 exercises
3. Calls `create_full_course` with the complete structure:

```json
{
  "title": "Exponential Functions: From Basics to Applications",
  "description": "A beginner-friendly course covering exponential functions...",
  "type": "SELF_PACED",
  "sections": [
    {
      "title": "1. Foundations",
      "lessons": [
        {
          "title": "What Are Exponential Functions?",
          "content_html": "<h2>Introduction</h2><p>An exponential function is...</p>...",
          "exercises": [
            {
              "title": "Check Your Understanding: Exponential Basics",
              "questions": [
                {
                  "title": "Which of the following is an exponential function?",
                  "type": "RADIO",
                  "points": 5,
                  "options": [
                    { "label": "f(x) = 2^x", "is_correct": true },
                    { "label": "f(x) = x^2", "is_correct": false },
                    { "label": "f(x) = 2x + 1", "is_correct": false }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

4. Returns: *"I've created your course 'Exponential Functions: From Basics to Applications' with 3 sections, 8 lessons, and 8 exercises. You can view and edit it at: https://app.classroomio.com/courses/exponential-functions-from-basics-to-applications"*

### 8.2 Flow 2: Import from PDF

**User in Claude Desktop:**
> I have my lecture notes on Quantum Mechanics as a PDF. Extract the content and create a structured course in ClassroomIO.

*User attaches quantum_mechanics_notes.pdf*

**Claude's actions:**
1. Calls `import_pdf_to_course` with the PDF content (base64)
2. Receives extracted text with structural hints
3. Analyzes the content, identifies chapters/topics/key concepts
4. Structures the content into sections and lessons
5. Generates exercises based on the content
6. Calls `create_full_course` with the structured data
7. Returns summary with course URL

### 8.3 Flow 3: Incremental Course Building

**User:**
> List my courses in ClassroomIO

**Claude:** Calls `list_courses` → *"You have 5 courses: ..."*

**User:**
> Add a new lesson on 'Logarithmic Functions' to the Exponential Functions course, with a quiz

**Claude:**
1. Calls `get_course` to understand the existing structure
2. Calls `add_lesson` with content for the new lesson
3. Calls `add_exercise` with quiz questions
4. Returns confirmation

---

## 9. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| API key exposure | Keys are hashed (SHA-256) in DB; plaintext shown only once at creation |
| Scope creep | API keys are scoped to a single organization; tools only operate within that org |
| Input injection | All HTML content is sanitized before storage; SQL injection prevented by Supabase parameterized queries |
| Rate limiting | API keys have configurable rate limits (default: 100 requests/minute) |
| Data access | MCP server uses service role but scopes all queries by `organization_id` from the API key |
| Key rotation | Keys can be revoked instantly; users can create multiple keys |
| Content safety | Generated content passes through the same moderation pipeline as existing AI features |

---

## 10. Dependencies & Packages

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP server SDK |
| `@supabase/supabase-js` | Database client |
| `pdf-parse` | PDF text extraction |
| `zod` | Input validation |
| `crypto` (Node built-in) | API key hashing |

---

## 11. Future Enhancements (Out of Scope for v1)

| Enhancement | Description |
|------------|------------|
| **Course templates** | Pre-built MCP prompt templates for common subjects (Math, Science, Languages) |
| **Multi-modal import** | Import from PPTX, DOCX, Google Slides, YouTube playlists |
| **Collaborative generation** | Multiple users refining a course via MCP in real-time |
| **Auto-translation** | Leverage `lesson_language` table to auto-generate localized versions |
| **Analytics via MCP** | Expose student progress and course analytics as MCP resources |
| **Student-facing MCP** | Allow students to query course content, get study guides, practice quizzes via MCP |
| **Webhook notifications** | Notify external systems when courses are created/updated via MCP |
| **Hosted MCP endpoint** | ClassroomIO Cloud hosts the MCP server, users only need an API key |
| **Course versioning** | Track AI-generated vs. human-edited content for audit trails |

---

## 12. Open Questions

| # | Question | Proposed Answer |
|---|----------|----------------|
| 1 | Should `create_full_course` be transactional (all-or-nothing)? | Yes — use a Postgres function or manual cleanup on failure |
| 2 | Should we publish the MCP server to npm as `@classroomio/mcp-server`? | Yes — makes setup trivial with `npx` |
| 3 | Should PDF extraction happen server-side or client-side? | Server-side in the MCP tool, using `pdf-parse` |
| 4 | What's the maximum course size we support in a single `create_full_course` call? | 20 sections, 100 lessons, 500 questions (configurable) |
| 5 | Should we support Streamable HTTP transport in addition to stdio and SSE? | Defer to v2; stdio + SSE covers primary use cases |
| 6 | How do we handle the service role key for ClassroomIO Cloud users? | Hosted MCP server manages it; users only provide API key via SSE endpoint |
| 7 | Should we add an MCP tool to enroll students in a course? | Defer to v2; focus on course content creation first |

---

## 13. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| LLM generates low-quality course content | Users lose trust | Medium | Course is created as draft (unpublished); users must review and publish manually |
| API key security breach | Data exposure | Low | Key hashing, rate limiting, org scoping, instant revocation |
| Large courses hit Supabase rate limits | Creation fails midway | Low | Batch inserts, retry logic, configurable size limits |
| MCP protocol changes | Breaking changes | Low | Pin SDK version, follow MCP changelog |
| PDF extraction misses formatted content (tables, equations) | Poor import quality | Medium | Return raw text + warn user about limitations; suggest manual review of complex formatting |

---

## 14. Appendix

### A. Database Entity Relationship (Relevant Tables)

```
organization ─1:N─► group ─1:N─► groupmember
                        │              │
                        │              └──► profile
                        │
                        └──1:1──► course ─1:N─► lesson_section ─1:N─► lesson
                                    │                                     │
                                    │                                     ├──► lesson_language
                                    │                                     │
                                    │                                     └──1:N─► exercise ─1:N─► question ─1:N─► option
                                    │
                                    └──► course_newsfeed

NEW: api_key ──► profile
              ──► organization
```

### B. Question Type IDs

| ID | Label | Options? |
|----|-------|----------|
| 1 | RADIO | Yes (single correct) |
| 2 | CHECKBOX | Yes (multiple correct) |
| 3 | TEXTAREA | No (open-ended) |

### C. Course Type Enum

| Value | Description |
|-------|------------|
| `SELF_PACED` | Students progress at their own speed |
| `LIVE_CLASS` | Instructor-led with scheduled sessions |

### D. Course Version Enum

| Value | Description |
|-------|------------|
| `V1` | Legacy: flat lesson list |
| `V2` | Current: sections → lessons hierarchy |

All MCP-created courses will use **V2** format.
