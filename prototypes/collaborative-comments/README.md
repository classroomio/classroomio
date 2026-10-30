# Collaborative comments prototype

A clickable prototype of the comments feature from [`prd/collaborative-comments`](../../prd/collaborative-comments/README.md), placed inside the real course lesson page so it shows where it would live.

Serve the folder and open `index.html` (it needs its CSS and JS files, so open it over http, for example `python3 -m http.server`). The dark bar at the top has **Who am I?** (org admin, two tutors, or a learner), **What if the course changes?** (pretends the content was edited), **Theme**, **Start over** and **How to use**.

## What to try

- **Live (v2):** press **A teammate replies live**. Figma-style coloured cursors with initials and names move around the lesson. Then one teammate types a reply and you watch the text appear letter by letter, next to their cursor and in the thread, before it lands with no refresh.

- Select a sentence in the lesson, click **Comment**, type `@` to mention a teammate, and post.
- Pause the video and click **Comment at mm:ss**. The marker appears on the timeline, and clicking the thread seeks to it.
- Click a highlight or a thread card. The page and the panel stay in sync.
- Resolve a thread. Its highlight and its count badge go away. Reply to a resolved thread and it reopens.
- Open the bell as Ada or Ellena to see mention and reply notifications.
- **Delete a commented sentence**, **Replace the video** and **Delete a question** show "Original text was removed", "Video has changed" and "Question was removed" (the question threads move up to the exercise page).
- **Who am I? → A learner** shows that nothing is visible to learners.
- **Unread:** a blue dot on the Comments button and on lessons with replies you haven't seen, a "new" tag and a blue edge on those threads, and **Mark all read** in the panel. Opening a thread marks it read. Switch **Who am I?** to see each person's own unread state.
- **Assignee:** open a thread and pick someone in **Assignee**. They get a bell notification, the card shows "Assigned to Ada", and **Assigned to me** filters the panel. Resolving clears the assignee, and replies also notify the assignee. You can also pick **Assign to** when you start a thread. There are no due dates or extra statuses.
- **Copy link:** every thread has **Copy link**. Opening a thread puts `#thread=<id>` in the address, and opening that address jumps to the thread.
- **History:** open a thread and press **History**. It lists who started, replied, edited, assigned, resolved or reopened, newest first.
- **Activity tab:** the Comments panel has **Threads** and **Activity** tabs. Activity is the course comment history: one card per thread with its events inside (Open or Resolved badge, lesson name, quoted text), grouped by day. Switch Last week, Last 2 weeks or Last month, filter by **person** or **event type**, or search the comments. Click a card header to jump to its thread on the Threads tab. A blue dot on the tab shows new activity.
- **Close the panel:** press **Close** in the panel header, **Esc**, or the **Comments** button in the course header. While it is closed, a **Comments** tab on the right edge brings it back. Highlights stay visible, and clicking one reopens the panel on that thread.
- **Version history:** the clock icon in the page header opens the versions of that lesson. Pick one to see what it changed (added text green, removed text red), then **Restore this version**. Comments are not part of a version: restoring keeps every thread, and any whose quoted text is gone say "Original text was removed". **Delete a commented sentence** adds a version too.
- **Remove a member:** **Remove Tunde from course** in the top bar. His comments and history stay with a "Former member" tag, his assignments are cleared, and he can no longer be mentioned or assigned. **Add Tunde back** undoes it.
- **Publish warning:** **Publish changes** in the page header lists open threads on that page and offers **Review comments**, **Cancel** and **Publish anyway**. With no open threads it is a plain confirm.

## Where each part would live

The shell (`shell.css`, `app-theme.css`) is copied from [`lesson-reader`](../lesson-reader/README.md), which mirrors the shipped course page.

| In the prototype                                  | Real place                                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Course sidebar rows with a count badge            | `features/course/components/sidebar/course-content-tree.svelte`                                                                                          |
| **Comments** button and bell in the course header | `features/course/components/course-header.svelte`                                                                                                        |
| **Comment** button in the page header             | `features/course/pages/lesson.svelte` and `exercise.svelte`                                                                                              |
| Right-hand Comments panel                         | A new panel registered with `sidePanel`, like `aiAssistantPanelDefinition` and `transcriptPanelDefinition` in `routes/(app)/courses/[id]/+layout.svelte` |
| Selection → Comment button                        | The Tiptap editor in `features/course/components/lesson/note/` (next to `quote-selection.svelte`)                                                        |
| Video marker and "Comment at"                     | `features/course/components/lesson/video/lesson-video-player.svelte`                                                                                     |
| Question comment button                           | `features/course/components/question-container.svelte`                                                                                                   |

## Decisions the prototype shows

- **The panel is course-scoped, not lesson-scoped.** The transcript panel uses `scope: 'lesson'`, and the rail closes lesson-scoped panels when you change lesson. The Comments panel lists the whole course, so it must not close on navigation.
- **The course header has no bell today.** The notification bell lives in the org-level app header (`features/ui/navigation/app-header.svelte`). The prototype puts a bell next to Comments so mentions are visible while working. Whether to reuse the org bell instead is still to decide.
- **Highlights are drawn over the content.** The prototype finds the quoted text on every render and wraps it in `<mark>`. In the product the editor draws an overlay, and nothing is written into the lesson content (see the PRD's Technical Notes).
- **Unread is stored per person per thread** (how many comments they have seen). These four additions (unread, copy link, publish warning, assignee) are not in the PRD yet.
- **Do not reuse `lesson/comments.svelte`.** That is the learner comment section, which uses `lesson_comment`. These comments use separate tables.

## How it is built

- `comments.js` holds sample data and every interaction. State lives in one `state` object, and the DOM is rebuilt with `innerHTML` after each change.
- Mentions are stored as user id plus position in the plain-text body and re-saved on every edit, as the PRD describes.
- Theme is the `.dark` class on `<html>`, the same convention as the app. Light is the default, and the choice is saved in `localStorage`.
- This folder is not wired into the dashboard.
