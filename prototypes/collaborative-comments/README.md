# Collaborative comments prototype

A clickable prototype of the comments feature from [`prd/collaborative-comments`](../../prd/collaborative-comments/README.md), placed inside the lesson editor, styled like the production editor (Note block with its toolbar, Preview/Edit, add-block bar), so it shows where it would live.

Serve the folder and open `index.html` (it needs its CSS and JS files, so open it over http, for example `python3 -m http.server`). The bar at the top has one button, **Play guided story**, which acts out the whole feature step by step: comments, mentions, slides, replies, resolving, a course change and a teammate leaving. Everything else is clickable too.

## What to try

- **Live (v2):** in the guided story, a teammate replies live. Figma-style coloured cursors with initials and names move around the lesson. Then one teammate types a reply and you watch the text appear letter by letter, next to their cursor and in the thread, before it lands with no refresh.

- **Comment icon on every block:** Note, Video, Slides and Image each have a comment icon with a red count in the block header. Click it and the panel opens filtered to that block ("Slides · 4 comments") with an empty box at the top. Type and press Comment to comment on the whole block. On slides the comment is tagged with the slide on screen (no pins). On images, **Pin to a spot** lets you click the image to attach the comment to a place, and a numbered pin lands there. On video the comment is stamped with the current time. **Show all** clears the block filter.
- Select a sentence in the lesson, click **Comment**, type `@` to mention a teammate, and post.
- Pause the video and click **Comment at mm:ss**. The marker appears on the timeline, and clicking the thread seeks to it.
- Click a highlight or a thread card. The page and the panel stay in sync.
- Resolve a thread. Its highlight and its count badge go away. The filter icon's **Resolved** checkbox brings resolved threads back into view. Reply to a resolved thread and it reopens.
- Press the **Comments** icon button in the course header to open or close the panel. The red number is threads you have not read. The panel header has three icon buttons with tooltips: **+** (new comment), a **filter** (Status: Open, Unread, Read, Resolved; Person: Anyone or specific teammates; Show on content: Text highlights, Video markers, Image pins) and **×** (close).
- **When the content changes:** the guided story deletes a commented sentence. The thread stays and says "Original text was removed" with the original quote. The same applies to a replaced video ("Video has changed") and a deleted question ("Question was removed").
- **Learners:** the guided story switches to a learner, who sees no comments at all.
- **Unread:** a blue dot on the Comments button and on lessons with replies you haven't seen, a "new" tag and a blue edge on those threads, and **Mark all read** in the panel. Opening a thread marks it read. The guided story shows each person's own unread state.
- **Copy link:** every thread has **Copy link**. Opening a thread puts `#thread=<id>` in the address, and opening that address jumps to the thread.
- **Close the panel:** press the **×** in the panel header or **Esc**. Reopen it with the **Comments** icon button in the course header. Highlights stay visible, and clicking one reopens the panel on that thread.
- **Version history:** the guided story opens the versions of the lesson. Pick one to see what it changed (added text green, removed text red), then **Restore this version**. Comments are not part of a version: restoring keeps every thread, and any whose quoted text is gone say "Original text was removed". **Delete a commented sentence** adds a version too.
- **Remove a member:** the guided story removes Tunde from the course. His comments and history stay with a "Former member" tag, and he can no longer be mentioned. **Add Tunde back** undoes it.
- **Publish warning:** **Publish changes** in the page header lists open threads on that page and offers **Review comments**, **Cancel** and **Publish anyway**. With no open threads it is a plain confirm.

## Where each part would live

The shell (`shell.css`, `app-theme.css`) is copied from [`lesson-reader`](../lesson-reader/README.md), which mirrors the shipped course page.

| In the prototype                                                                                                         | Real place                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Course sidebar rows with a count badge                                                                                   | `features/course/components/sidebar/course-content-tree.svelte`                                                                                          |
| **Comments** icon button in the course header                                                                            | `features/course/components/course-header.svelte`                                                                                                        |
| Right-hand Comments panel                                                                                                | A new panel registered with `sidePanel`, like `aiAssistantPanelDefinition` and `transcriptPanelDefinition` in `routes/(app)/courses/[id]/+layout.svelte` |
| Comment icon in the Note block header (comment on the whole lesson) and in the editor toolbar (comment on selected text) | `features/course/components/lesson/note/` (block header and toolbar)                                                                                     |
| Selection → Comment button                                                                                               | The Tiptap editor in `features/course/components/lesson/note/` (next to `quote-selection.svelte`)                                                        |
| Video marker and "Comment at"                                                                                            | `features/course/components/lesson/video/lesson-video-player.svelte`                                                                                     |
| Question comment button                                                                                                  | `features/course/components/question-container.svelte`                                                                                                   |

## Decisions the prototype shows

- **The panel is course-scoped, not lesson-scoped.** The transcript panel uses `scope: 'lesson'`, and the rail closes lesson-scoped panels when you change lesson. The Comments panel lists the whole course, so it must not close on navigation.
- **One button for comments and notifications.** The course header has a single Comments icon button. It opens the panel, and unread threads inside it carry the blue "new" tag, so there is no separate notification list. Whether to reuse the org-level bell (`features/ui/navigation/app-header.svelte`) instead is still to decide.
- **Highlights are drawn over the content.** The prototype finds the quoted text on every render and wraps it in `<mark>`. In the product the editor draws an overlay, and nothing is written into the lesson content (see the PRD's Technical Notes).
- **Unread is stored per person per thread** (how many comments they have seen). Unread, copy link and the publish warning are all in the PRD.
- **Do not reuse `lesson/comments.svelte`.** That is the learner comment section, which uses `lesson_comment`. These comments use separate tables.

## How it is built

- `comments.js` holds sample data and every interaction. State lives in one `state` object, and the DOM is rebuilt with `innerHTML` after each change.
- Mentions are stored as user id plus position in the plain-text body and re-saved on every edit, as the PRD describes.
- Theme is the `.dark` class on `<html>`, the same convention as the app. Light is the default, and the choice is saved in `localStorage`.
- This folder is not wired into the dashboard.
