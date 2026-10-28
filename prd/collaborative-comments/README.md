# Collaborative Comments PRD

## Overview

A way for the people who **build** a course to talk to each other **inside** the course.

Think Figma comments or GitHub PR review comments. An admin can highlight a sentence in a lesson and
write "this is out of date, @Ada can you rewrite it?". Ada gets notified, replies, fixes the text, and
marks the comment as resolved.

This is **not** the existing learner comments on lessons. Learners never see these comments.

## Problem Statement

Today, course teams review content over Slack, email, or calls. The feedback lives far away from the
content it is about, so it gets lost and nobody knows what is still open.

## Goals

- Keep feedback on the exact spot it refers to: a sentence, a video moment, a question.
- Make it clear who needs to act, through @mentions and notifications.
- Make it clear what is done and what is still open, through resolve and reopen.

## Users

- **Admins and tutors on the course team** can see, write, reply to and resolve comments.
- **Learners** never see comments, not in the dashboard, the public course page, or the API.
  The API must enforce this. Hiding it in the UI is not enough.
- You can only **@mention** people who are on the course team (admins and tutors with access to that
  course).

## Key Terms

| Term | Meaning |
| --- | --- |
| **Thread** | A first comment plus all its replies. Everything below is about threads. |
| **Anchor** | Where a thread is attached: the whole course, a lesson, a text highlight, a video timestamp, or an exercise question. |
| **Resolve** | Mark a thread as done. It hides from the default view but is never deleted. It can be reopened. |
| **Mention** | Typing `@` and picking a team member. That person gets notified. |

## User Stories

- As a tutor, I can highlight a sentence in a lesson and leave a comment on it, so feedback stays on the exact text.
- As a tutor, I can leave a comment at a moment in a video, so others can jump straight to it.
- As an admin, I can @mention a teammate, so they know they need to act.
- As a teammate, I get notified when I am mentioned or someone replies, so I don't miss feedback.
- As anyone on the course team, I can see every open thread in one place, so I know what is left to do.
- As anyone on the course team, I can resolve a thread when it is fixed, so the list stays clean.

## Functional Requirements

### 1. Where you can leave a comment

| Anchor | How you start it | What it looks like afterwards |
| --- | --- | --- |
| **Course (general)** | "Comments" panel → New comment, with no specific spot. | Listed in the panel under "General". |
| **Lesson / exercise page** | Comment button on the page header. | Count badge on the page and in the course outline. |
| **Text highlight in a lesson note** | Select text in the editor → "Comment" in the toolbar. | The text gets a soft highlight. Clicking it opens the thread. |
| **Video timestamp** | Pause the video → "Comment at 02:14". | A marker on the video timeline. Clicking the thread jumps the video to that time. |
| **Exercise question** | Comment button on a question card. | Count badge on the question. |

### 2. Writing comments

- Comments are plain text with `@mentions` and links. No rich text, images or files in v1.
- Authors can **edit** and **delete** their own comments. Edited comments show "edited".
- Org admins can delete any comment.
- Deleting the first comment of a thread deletes the whole thread. Deleting a reply removes only that reply.

### 3. Threads

- Anyone on the course team can **reply**, **resolve** and **reopen** a thread.
- A resolved thread shows who resolved it and when.
- Replying to a resolved thread reopens it.

### 4. The Comments panel

A side panel on the course, opened from the course header. It is the one place to see every thread in
the course.

- Filters: **Open** (default), **Resolved**, **Mentions me**, **Created by me**.
- Grouped by where the thread lives: General, then each lesson/exercise in course order.
- Clicking a thread takes you to the exact spot: scrolls to the highlight, seeks the video, or opens
  the question.
- The panel and page badges count **open** threads only.

### 5. When the content changes

The thing a comment points at can be edited or removed. The comment must not silently disappear.

- **Highlighted text is edited:** the highlight follows the text if it can still be found.
- **Highlighted text is deleted:** the thread stays, marked **"Original text was removed"**, and shows
  the quote as it was when the comment was made.
- **Video is replaced:** timestamp threads stay, marked **"Video has changed"**. The marker is hidden.
- **Question is deleted:** its threads move up to the exercise page, marked **"Question was removed"**.
- **Lesson or exercise is deleted:** its threads are deleted with it.
- **Course is cloned, used as a template, or exported:** comments are **not** copied.

### 6. Notifications

Use the existing notification system (bell icon + email).

| Event | Who is notified |
| --- | --- |
| You are @mentioned | You |
| Someone replies in a thread you started, replied to, or were mentioned in | You |
| A thread you started is resolved | You |

- You are never notified about your own actions.
- Every notification links straight to the thread.
- Email follows the user's notification preferences. Group emails so a busy review does not send
  dozens of emails at once (for example, one digest per thread every few minutes).

## Edge Cases

- **Removed from the course team:** the person's old comments stay with their name. They can no
  longer see the comments or be mentioned.
- **Mentioning someone who later loses access:** they get no further notifications for that thread.
- **Two people highlight overlapping text:** both threads exist. Clicking an overlap shows both.
- **Lesson in another language (translations):** a highlight belongs to the language version it was
  made on.
- **Org turns the feature off:** comments are hidden, not deleted. Turning it back on restores them.

## Non-Goals (v1)

- Real-time updates. The panel refreshes when opened and after you post. Live updates can come later.
- Reactions (👍), attachments, screenshots, rich text.
- Commenting on course settings, landing page, or certificates.
- Comments on a region of a video frame (only timestamps).
- Assigning a thread to someone as a task, or due dates.
- Inviting learners or outside reviewers to comment.

## Technical Notes

These are guides, not final decisions.

- Keep this separate from the learner comment tables (`lesson_comment`, `public_lesson_comment`).
  New tables, roughly: `comment_thread` (course, anchor type, anchor data, status, resolved by/at) and
  `comment` (thread, author, body, edited at).
- Store mentions as user ids, not as names inside the comment text, so renamed users display
  correctly. See "Persisted columns store data, not presentation" in `CLAUDE.md`.
- **Text anchors:** the lesson editor is Tiptap. Keep the highlight as a comment mark with the thread
  id inside the lesson content, and save the quoted text on the thread as the fallback for when the
  mark is gone. The mark must never show in the learner view.
- **Video anchors:** store the media/asset id and the second. If the lesson's asset id changes, the
  thread is outdated.
- Every comment endpoint checks that the caller is an admin or tutor on that course.
- Course outline and page badges need cheap open-thread counts. Return counts with the course
  outline rather than one request per lesson.

## Acceptance Criteria

- [ ] A tutor can highlight text in a lesson, @mention an admin, and the admin gets a bell notification
      and an email that opens the exact highlight.
- [ ] A tutor can leave a comment at a video timestamp, and clicking it seeks the video.
- [ ] Comments can be left on the course (general), a lesson/exercise page, and an exercise question.
- [ ] The Comments panel lists every open thread in the course and can filter to "Mentions me".
- [ ] Resolving a thread removes its highlight and badge count; reopening brings them back.
- [ ] Deleting highlighted text keeps the thread, marked "Original text was removed", with the original quote.
- [ ] Cloning a course does not copy its comments.
- [ ] A learner account cannot see or fetch any comment, through the UI or the API.
