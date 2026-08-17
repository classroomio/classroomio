# Content reporting

## Status

Implemented (v1)

## Purpose

Let authenticated members flag user-generated content so ClassroomIO staff can review abuse. Reports are stored in Postgres. Email is only the alert channel.

## v1 scope

Reportable targets:

- Course newsfeed posts and comments
- Cohort newsfeed posts and comments
- Community questions and answers
- Lesson comments
- User profiles

Not in v1: auto-hide, org-admin moderation queues, appeals, AI classifiers.

## Flow

1. Signed-in org member opens Report on content they can see and did not author.
2. They pick a reason and optionally add details.
3. `POST /report` validates access, snapshots the content, and inserts `content_report`.
4. A ClassroomIO-branded system email goes to `MODERATION_EMAIL` (default `help@classroomio.com`).
5. Staff review from email + DB / `GET /internal/moderation/reports`.
6. Staff record the outcome with `PATCH /internal/moderation/reports/:id`.

Duplicate active reports (`open` or `in_review`) from the same reporter against the same target are rejected. Reporting does not hide or delete the content.

## Data

`content_report` stores:

- reporter, org, target type/id, optional target author
- reason, details, status, priority
- `content_snapshot` JSON (plain text, title, author, surface, URL, capture time)
- assignment and resolution fields

The snapshot is the evidence if the original row is hard-deleted.

## API

- `POST /report` — authenticated org member
- `GET /internal/moderation/reports`
- `GET /internal/moderation/reports/:id`
- `PATCH /internal/moderation/reports/:id`

Internal routes use `PRIVATE_SERVER_KEY`.
