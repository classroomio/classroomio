# Notes Inline Comments PRD

## Status

- **Phase 1:** Done
- **Phase 2:** Not started
- **Phase 3:** Not started

## Progress

| Phase | Scope | Status |
| --- | --- | --- |
| **Phase 1** | Google Docs core — anchored threads, sidebar, resolve/reopen, scroll-to-anchor, focus refetch | ☑ |
| **Phase 2** | @mentions, email notifications, SSE live sync, edit/delete polish | ☐ |
| **Phase 3** | AI segment comments via assistant | ☐ |

## Purpose

Add **Google Docs-style inline comments** to org workspace notes: select text in the editor, start a thread, reply in a persistent right column, resolve when done. Resolved threads remove the highlight but remain navigable from the sidebar. Future phases add @mentions with email, live sync, and AI feedback anchored to note passages.

## Problem Statement

Notes today have a non-functional comments strip (UI shell only). Team collaboration on shared notes requires discussing specific passages — titles and generic top-of-page comments are not enough. Admins and tutors need anchored threads on workspace notes without exposing this surface to LMS students.

## Confirmed Decisions

1. **Audience:** Org team members only (admins/tutors with note read access). **Not** LMS students in v1.
2. **Comment permission:** Any org team member who can **read** the note may create threads and reply.
3. **Resolve permission:** Thread creator + note owner.
4. **Resolved highlights:** Remove TipTap mark from saved HTML; keep `anchor` JSON on thread. Sidebar click scrolls to passage (pulse), even when resolved. **Reopen** re-applies mark if passage still matches.
5. **Layout:** Persistent right comments column on desktop (~320px); sheet on mobile.
6. **Comment body:** Plain text in Phase 1. Phase 2 adds `@mention` + email (no rich text).
7. **Live sync Phase 1:** Optimistic UI + refetch on tab focus. Phase 2 adds SSE.
8. **AI comments (Phase 3):** Same thread model with `author_type: 'ai'`.

## Non-Goals

- Student/LMS comment access (separate pass later).
- Rich-text / markdown in comment bodies.
- Realtime co-editing of note body (only comment sync in Phase 2).
- Public anonymous comments.
- Full notification center (email only in Phase 2).

## User Stories

| # | As a… | I want to… | So that… |
| --- | --- | --- | --- |
| 1 | Org admin/tutor | Select text and add a comment | I can discuss a specific passage |
| 2 | Team member | See all open threads in a sidebar | I can review feedback without scanning the whole note |
| 3 | Team member | Reply in a thread | We can have a conversation on one passage |
| 4 | Thread author / note owner | Resolve a thread | The highlight clears when the issue is addressed |
| 5 | Team member | Click a resolved thread in the sidebar | I can jump back to where it was anchored |
| 6 | Note owner | Reopen a resolved thread | Work can continue if the issue returns |
| 7 | Team member | @mention a colleague (Phase 2) | They get an email and deep link |
| 8 | User with Assistant | Get AI feedback on passages (Phase 3) | Review is faster than reading the whole note |

## UX

### Editor layout

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back     Share (secondary)   Assistant   ⋮                 │
│ Title (borderless)                                           │
├───────────────────────────────┬──────────────────────────────┤
│ TipTap body + comment marks   │ Comments                     │
│ [Select text → Comment chip]  │ Open (n) / Resolved (n)      │
│                               │ Thread cards + reply box     │
└───────────────────────────────┴──────────────────────────────┘
```

### Flows

**Create thread:** Select text → floating Comment button → sidebar composer opens → submit → yellow mark applied + thread card appears.

**Resolve:** Thread menu → Resolve → mark stripped from HTML, card moves to Resolved section (muted).

**Navigate resolved:** Click thread card → editor scrolls to `anchor.quotedText` match in content, brief pulse (no permanent highlight).

**Reopen:** Resolved thread → Reopen → if anchor text found, re-apply mark; else show quoted excerpt in card only.

## Data Model

### Enums

```sql
CREATE TYPE note_comment_thread_status AS ENUM ('open', 'resolved');
CREATE TYPE note_comment_author_type AS ENUM ('user', 'ai');
```

### `org_note_comment_thread`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | Same id used in HTML mark |
| `note_id` | uuid FK → org_note | CASCADE delete |
| `status` | enum | `open` \| `resolved` |
| `anchor` | jsonb | See anchor schema |
| `created_by` | uuid FK → profile | Nullable for AI |
| `author_type` | enum | `user` \| `ai` |
| `resolved_at` | timestamptz | |
| `resolved_by` | uuid | |
| `created_at` / `updated_at` | timestamptz | |

### `org_note_comment`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `thread_id` | uuid FK | CASCADE |
| `author_id` | uuid FK → profile | Nullable for AI |
| `author_type` | enum | |
| `body` | text | Plain text; Phase 2 mention syntax |
| `created_at` / `updated_at` / `deleted_at` | timestamptz | Soft delete |

### `org_note_comment_mention` (Phase 2)

| Column | Type |
| --- | --- |
| `id` | uuid PK |
| `comment_id` | uuid FK |
| `profile_id` | uuid FK |

### Anchor JSON

```typescript
type NoteCommentAnchor = {
  version: 1;
  threadId: string;
  quotedText: string;
  prefix?: string;
  suffix?: string;
};
```

## API

All routes under `/notes/:noteId/comment-threads`, org-scoped via existing middleware.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/notes/:noteId/comment-threads` | List threads with nested comments |
| `POST` | `/notes/:noteId/comment-threads` | Create thread + first comment; body includes `content` (note HTML with mark) |
| `POST` | `/notes/:noteId/comment-threads/:threadId/replies` | Add reply |
| `PATCH` | `/notes/:noteId/comment-threads/:threadId` | Resolve / reopen (+ `content` on reopen when mark re-applied) |
| `PATCH` | `/notes/:noteId/comments/:commentId` | Edit comment (Phase 2) |
| `DELETE` | `/notes/:noteId/comments/:commentId` | Soft delete (Phase 2) |
| `GET` | `/notes/:noteId/comment-threads/stream` | SSE (Phase 2) |

### Access

| Action | Who |
| --- | --- |
| Read | `assertNoteReadAccess` |
| Create / reply | Read access + org team role (admin/tutor) or note owner |
| Resolve / reopen | Thread creator or note owner |
| Edit / delete | Comment author (Phase 2) |

## Technical Design

### TipTap

- New mark extension `NoteCommentMark` in `packages/ui/src/custom/editor/extensions/note-comment/`.
- HTML: `<span data-note-comment="{threadId}" class="note-comment-mark">`.
- Optional `extraExtensions` prop on `TextEditor` / `@cio/ui/custom/editor`.

### Content co-save

Creating a thread or reopening runs a transaction: insert thread/comment + update `org_note.content` + `plain_text` + version row (reuse existing version pattern where appropriate).

### Scroll-to-anchor

Client searches `plainText` for `prefix + quotedText + suffix` (fallback: `quotedText` only). Scrolls editor container; adds temporary pulse class.

### Phase 2 — @mentions + email

- Composer: `@` triggers `MentionPopover` with org team roster.
- Storage: `@[Display Name](user:uuid)` in body + `org_note_comment_mention` rows.
- Email: BullMQ templates `noteCommentMention`, `noteCommentReply` (pattern: `sendNewsfeedCommentEmail`).
- Deep link: `/org/{slug}/notes/{noteId}?thread={threadId}`.

### Phase 2 — Live sync (ideal)

- Redis pub/sub channel `note:{noteId}:comments`.
- `GET /notes/:noteId/comment-threads/stream` (SSE) while editor mounted.
- Mutations publish `{ type: 'thread_created' | 'reply' | 'resolved' | ... }`.

### Phase 3 — AI comments

- Assistant tool creates threads with `author_type: 'ai'`.
- Same anchor + sidebar UX; AI avatar + label.
- Batch “Review note” optional follow-up.

## Implementation Checklist

### Phase 1

- [x] Migration: `org_note_comment_thread`, `org_note_comment`
- [x] Schema types + query layer
- [x] Validation schemas
- [x] Service + access helpers
- [x] API routes
- [x] `NoteCommentMark` TipTap extension + `extraExtensions` hook
- [x] Dashboard: `noteCommentsApi`, comments column, selection bubble
- [x] Wire `note-editor-page` two-column layout
- [x] Resolve / reopen + scroll-to-anchor
- [x] Optimistic UI + refetch on focus
- [x] `en.json` keys

### Phase 2

- [ ] `org_note_comment_mention` migration
- [ ] Mention autocomplete + parsing
- [ ] Email jobs
- [ ] SSE stream endpoint
- [ ] Edit / delete comment
- [ ] Open / Resolved tabs in sidebar

### Phase 3

- [ ] AI author type + assistant tool
- [ ] Batch review flow

## Related

- Notes foundation PR: org workspace CRUD, team sharing, editor UI
- `apps/dashboard/src/lib/features/notes/components/note-comments-bar.svelte` (to be replaced)
- Newsfeed comment email: `apps/api/src/services/newsfeed/newsfeed.ts`
