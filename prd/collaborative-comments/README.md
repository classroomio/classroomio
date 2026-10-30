# Collaborative Comments PRD

**Release: v2.** This whole feature ships in v2, including live updates (section 7).

## Overview

A way for the people who **build** a course to talk to each other **inside** the course.

Think Figma comments or GitHub PR review comments. An admin can highlight a sentence in a lesson and
write "this is out of date, @Ada can you rewrite it?". Ada gets notified, replies, fixes the text, and
marks the comment as resolved.

This is **not** the existing learner comments on lessons. Learners never see these comments.

## Prototype

- **Demo video:** [Watch the walkthrough](https://www.awesomescreenshot.com/video/57930902?key=1fde72e0c4b980f105eb488e34fede14)
- **Clickable prototype:** [`prototypes/collaborative-comments`](../../prototypes/collaborative-comments/README.md).
  Serve the folder over http and press **Play guided story**.

## Problem Statement

Today, course teams review content over Slack, email, or calls. The feedback lives far away from the
content it is about, so it gets lost and nobody knows what is still open.

## Goals

- Keep feedback on the exact spot it refers to: a sentence, a video moment, a question.
- Make it clear who needs to act, through @mentions and notifications.
- Make it clear what is done and what is still open, through resolve and reopen.

## Users

- **Admins and tutors on the course team** can see, write, reply to and resolve comments.
- **Org admins** count as part of every course team in their org, so they can see, write and delete
  comments on any course even if they are not listed on it.
- **Learners** never see comments, not in the dashboard, the public course page, or the API.
  The API must enforce this. Hiding it in the UI is not enough.
- You can only **@mention** people who are on the course team (admins and tutors with access to that
  course).

## Key Terms

| Term        | Meaning                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| **Thread**  | A first comment plus all its replies. Everything below is about threads.                                              |
| **Anchor**  | Where a thread is attached: the whole course, a lesson, a text highlight, a video timestamp, or an exercise question. |
| **Resolve** | Mark a thread as done. It hides from the default view but is never deleted. It can be reopened.                       |
| **Mention** | Typing `@` and picking a team member. That person gets notified.                                                      |

## User Stories

- As a tutor, I can highlight a sentence in a lesson and leave a comment on it, so feedback stays on the exact text.
- As a tutor, I can leave a comment at a moment in a video, so others can jump straight to it.
- As an admin, I can @mention a teammate, so they know they need to act.
- As a teammate, I get notified when I am mentioned or someone replies, so I don't miss feedback.
- As anyone on the course team, I can see every open thread in one place, so I know what is left to do.
- As anyone on the course team, I can resolve a thread when it is fixed, so the list stays clean.
- As a tutor, I can assign a thread to a teammate, so it is clear who owns it.
- As a teammate, I can see which threads are new to me, so I know what I have not read.
- As anyone on the course team, I can copy a link to a thread and share it.
- As an admin, I am warned about open comments before I publish a page.

## Functional Requirements

### 1. Where you can leave a comment

| Anchor                              | How you start it                                       | What it looks like afterwards                                                     |
| ----------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **Course (general)**                | "Comments" panel → New comment, with no specific spot. | Listed in the panel under "General".                                              |
| **Lesson / exercise page**          | Comment button on the page header.                     | Count badge on the page and in the course outline.                                |
| **Text highlight in a lesson note** | Select text in the editor → "Comment" in the toolbar.  | The text gets a soft highlight. Clicking it opens the thread.                     |
| **Video timestamp**                 | Pause the video → "Comment at 02:14".                  | A marker on the video timeline. Clicking the thread jumps the video to that time. |
| **Exercise question**               | Comment button on a question card.                     | Count badge on the question.                                                      |

### 2. Writing comments

- Comments are plain text with `@mentions` and links. No rich text, images or files in v1.
- Authors can **edit** and **delete** their own comments. Edited comments show "edited".
- Org admins can delete any comment.
- Deleting the first comment of a thread deletes the whole thread. Deleting a reply removes only that reply.

### 3. Threads

- Anyone on the course team can **reply**, **resolve** and **reopen** a thread.
- A thread can have one **assignee**, picked from the current course team when the thread is started or
  later. The assignee is notified, sees it under **Assigned to me**, and the card shows who owns it.
  Resolving clears the assignee. Removing someone from the team clears their assignments.
- A resolved thread shows who resolved it and when.
- Replying to a resolved thread reopens it.
- **Copy link:** every thread has a **Copy link** button. The link opens the course on that thread,
  scrolled to its highlight, video moment or question. Anyone without access to the course sees no
  comment, as with every other comment endpoint.
- **Unread:** each person has their own read state per thread. A thread with replies you have not seen
  shows a blue dot, a "new" tag and a blue edge. The Comments button and the lesson in the course
  outline show a dot too. Opening a thread marks it read for you only, and **Mark all read** clears
  everything. Reading never changes whether a thread is open or resolved.

### 3a. Thread history

Every thread has a **History** list, newest first, so the team can see what happened and who did it.

- It records: started, replied, edited a comment, deleted a reply, assigned or unassigned, resolved,
  reopened (including reopened by a reply), and a team member being removed or added back.
- Each line shows the person, when, and a "Former member" tag if they have since left the team.
- Edits and deletes appear as events only. The old text is not kept.
- History is never deleted when someone leaves. It goes only with the thread.

**Activity tab.** The Comments panel has two tabs, **Threads** and **Activity**. Activity shows the
history of the whole course, and the lesson stays visible beside it.

- Choose **Last week**, **Last 2 weeks** or **Last month**. Newest activity first, grouped by day
  (Today, Yesterday, and so on).
- Each thread with activity is one card: its status (Open or Resolved), where it lives, the quoted text,
  and the events inside it (who did what and when). Resolved threads are included.
- Filter by **person** or **event type** (started, replied, resolved, assigned), or search the comment
  text. Clicking a card opens that thread on the Threads tab.
- A dot on the tab shows activity you have not looked at yet.
- Same visibility as comments: admins and tutors only, never learners.

### 4. The Comments panel

A side panel on the course, opened from the course header. It is the one place to see every thread in
the course.

- Filters: **Open** (default), **Resolved**, **Mentions me** (someone tagged you), **Assigned to me**
  (it is yours to handle) and **Created by me**.
- Grouped by where the thread lives: General, then each lesson/exercise in course order.
- Clicking a thread takes you to the exact spot: scrolls to the highlight, seeks the video, or opens
  the question.
- The panel and page badges count **open** threads only.
- The panel can be **closed** from its header or with Esc, and reopened from the Comments button in
  the course header or an edge tab. Highlights stay visible while it is closed, and clicking one
  reopens the panel on that thread.

### 4a. Publishing with open comments

Comments never block publishing, but the team should not publish by accident with feedback still open.

- When someone presses **Publish** on a lesson or exercise that has open threads, a confirm lists them
  (who wrote each one and a short preview) with **Review comments**, **Cancel** and **Publish anyway**.
- **Review comments** opens the panel on the first open thread.
- With no open threads it is a plain publish confirm.
- Learners never see the comments, whether the team publishes anyway or not.

### 5. When the content changes

The thing a comment points at can be edited or removed. The comment must not silently disappear.

- **Highlighted text is edited:** the highlight follows the text if it can still be found.
- **Highlighted text is deleted:** the thread stays, marked **"Original text was removed"**, and shows
  the quote as it was when the comment was made.
- **Video is replaced:** timestamp threads stay, marked **"Video has changed"**. The marker is hidden.
- **Question is deleted:** its threads move up to the exercise page, marked **"Question was removed"**.
- **Lesson or exercise is deleted:** its threads are deleted with it.
- **Course is cloned, used as a template, or exported:** comments are **not** copied.
- **A lesson version is restored:** comments are not part of a version, so restoring never deletes
  or rolls back a thread. Threads whose quoted text is not in the restored version are marked
  **"Original text was removed"**, as if the text had been deleted. The version list shows who
  changed the lesson and when, and what each version added or removed.

### 6. Notifications

Use the existing notification system (bell icon + email). If the bell or email delivery for
these events does not exist yet, building it is part of this feature, not a separate prerequisite.

| Event                                                                     | Who is notified |
| ------------------------------------------------------------------------- | --------------- |
| You are @mentioned                                                        | You             |
| A thread is assigned to you                                               | You             |
| Someone replies in a thread you started, replied to, or were mentioned in | You             |
| A thread you started is resolved                                          | You             |

- You are never notified about your own actions.
- Replies in a thread also notify its assignee.
- Every notification links straight to the thread.
- Email follows the user's notification preferences. Group emails so a busy review does not send
  dozens of emails at once (for example, one digest per thread every few minutes).

### 7. Live updates

Comments show up for teammates without a page refresh.

- A new comment, reply, resolve or reopen made by a teammate appears in the open panel within a few
  seconds, and counts and badges update with it.
- Teammates who are on the same lesson show up like in Figma: a coloured cursor with their initials
  and name, moving where they move. Each person keeps one colour for the whole session.
- When a teammate writes a comment or reply, you see their text appear letter by letter, both next
  to their cursor and in the thread, in their colour with "Ada is typing…". The comment lands in
  the panel when they post it. Text they have not posted can still be abandoned and then vanishes.
- Cursors are only shown between admins and tutors. Learners never see them.
- Live updates never move the page under you: a thread you are typing in keeps your draft and focus.
- If the connection drops, the panel shows it is offline and catches up on reconnect.
- Notifications (bell and email) work the same as in section 6.

## Edge Cases

- **Removed from the course team:** the full history stays for everyone who is still on the team.
  Their comments, replies, resolves and reopens keep their name and avatar, with a small "Former
  member" tag. Threads they started stay open or resolved as they were, and open threads can still be
  replied to and resolved by others. They can no longer see the comments, be mentioned, or be
  assigned. Anything assigned to them is cleared and the thread goes back to unassigned. The one
  exception is an org admin: they stay on every course team of their org, so removing them from a
  course's list changes nothing for comments.
- **Account deleted entirely:** their comments stay and show as "Deleted user". Each comment keeps
  the author's name as it was at deletion, so the thread still reads clearly.
- **Removed person was mentioned:** the mention stays in the text as plain "@Ada" and no longer
  links to a profile.
- **Mentioning someone who later loses access:** they get no further notifications for that thread.
- **Two people highlight overlapping text:** both threads exist. Clicking an overlap shows both.
- **Lesson in another language (translations):** a highlight belongs to the language version it was
  made on.
- **Org turns the feature off:** comments are hidden, not deleted. Turning it back on restores them.

## Non-Goals (v1)

- Co-editing the same comment or the lesson text itself. Live cursors and live comment updates (section 7) are in scope.
- Reactions (👍), attachments, screenshots, rich text.
- Commenting on course settings, landing page, or certificates.
- Comments on a region of a video frame (only timestamps).
- Due dates, or any task statuses beyond open and resolved.
- Inviting learners or outside reviewers to comment.

## Technical Notes

These are guides, not final decisions.

- Keep this separate from the learner comment tables (`lesson_comment`, `public_lesson_comment`).
  New tables, roughly: `comment_thread` (course, anchor type, anchor data, status, resolved by/at) and
  `comment` (thread, author, body, edited at).
- Store mentions as user ids, not as names inside the comment text, so renamed users display
  correctly. See "Persisted columns store data, not presentation" in `CLAUDE.md`. Each comment keeps
  its plain text body plus a list of mentions, one per `@`, each with the user id and its position
  in the body. Editing a comment saves a fresh list, so positions never go stale.
- **Text anchors:** the lesson editor is Tiptap. Do not write anything into the lesson content
  itself, so clone, export and the learner view never see comment data. The thread stores the text
  range and the quoted text. The editor draws the highlight on top of the content while the author
  is working, and re-finds the range by the quoted text when the content changes. The thread also stores a few words
  of text before and after the quote. If the quote appears more than once, the match with the same
  surrounding words wins; if that is still ambiguous, the thread is marked "Original text was
  removed" instead of guessing.
- **History survives removal:** a comment points at its author by user id, never through course
  team membership. Removing someone from the team deletes the membership row only, never their
  comments. Whether to show "Former member" is worked out when the panel loads, by checking if the
  author is still on the team. Nothing is written into the comment. Account deletion must not
  cascade to comments: keep the row and store the display name at that moment.
- **Access:** org admins are allowed on every comment endpoint, in addition to admins and tutors on
  the course.
- **Video anchors:** store the media/asset id and the second. If the lesson's asset id changes, the
  thread is outdated.
- Every comment endpoint checks that the caller is an admin or tutor on that course, or an admin of
  the org that owns it.
- Course outline and page badges need cheap open-thread counts. Return counts with the course
  outline rather than one request per lesson.

## Acceptance Criteria

- [ ] A tutor can highlight text in a lesson, @mention an admin, and the admin gets a bell notification
      and, if their email preferences allow it, an email that opens the exact highlight.
- [ ] A tutor can leave a comment at a video timestamp, and clicking it seeks the video.
- [ ] Comments can be left on the course (general), a lesson/exercise page, and an exercise question.
- [ ] The Comments panel lists every open thread in the course and can filter to "Mentions me".
- [ ] Resolving a thread removes its highlight and badge count; reopening brings them back.
- [ ] Deleting highlighted text keeps the thread, marked "Original text was removed", with the original quote.
- [ ] A reply from a teammate appears in an open thread without a refresh, and their coloured cursor with initials shows while they write.
- [ ] A thread can be assigned when it is started or later. The assignee is notified and sees it under "Assigned to me", and resolving clears the assignee.
- [ ] A thread with replies a person has not read shows as unread to that person only, and opening it clears it.
- [ ] "Copy link" on a thread gives a link that opens the course on that thread.
- [ ] Publishing a page with open threads shows a warning that lists them, with "Review comments" and "Publish anyway".
- [ ] Cloning a course does not copy its comments.
- [ ] A learner account cannot see or fetch any comment, through the UI or the API.
- [ ] After a tutor is removed from a course, their comments and replies are still visible to the team, tagged "Former member", and open threads they started can still be resolved by others.
- [ ] An org admin can still see and delete comments on a course after being removed from its team list.
- [ ] If a highlighted quote appears twice after an edit, the thread attaches to the match with the same surrounding words, or is marked as removed when that is unclear.
