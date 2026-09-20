# Help Center content backlog

This is an internal production brief for the 99 Help Center articles that currently contain only a coming-soon state. It is intentionally stored outside `content/help`, so Blume does not publish it or expose it in Help Center navigation or search.

Use each entry as a starting brief, not as verified product documentation. Before replacing a placeholder, confirm the current interface, permissions, plan requirements, defaults, side effects, and success states in the product and source code. Follow `skills/write-docs/SKILL.md` when drafting the article.

Media notes:

- Screenshots are recommendations, not quotas. Capture real current UI with safe demo data and place each image after the instruction it supports.
- Store new screenshots under `content/help/<section>/images/<article-slug>/` as optimized WebP files.
- Videos are supplementary. Every action, value, warning, and success state must still appear in writing.
- “No video” means the task is clearer through text and focused screenshots.

## Get started

### `content/help/get-started/what-is-classroomio.mdx` — What is ClassroomIO?

- **Article type:** Product overview and decision guide.
- **Cover:** Who ClassroomIO serves; the relationship between an organization, academy, LMS, courses, students, tutors, and administrators; the typical create-publish-enroll-deliver-report journey; where administrators and students sign in.
- **Images:** One annotated ecosystem diagram showing the organization, public academy, admin dashboard, and student LMS relationship. Avoid a transient dashboard screenshot.
- **Video:** Recommended—a short product tour showing the administrator and student experiences without attempting to teach setup.

### `content/help/get-started/preview-your-academy-as-a-learner.mdx` — Preview your academy as a learner

- **Article type:** Task guide for administrators and tutors.
- **Cover:** Prerequisites for previewing; where to open the academy or learner view; what preview mode does and does not simulate; how enrollment, unpublished content, and access rules affect the preview; how to exit and verify the real student experience safely.
- **Images:** The preview/open-academy control and the resulting learner-facing academy or LMS with demo content.
- **Video:** Recommended—the transition between the admin dashboard, public academy, and signed-in learner view is easier to understand in motion.

### `content/help/get-started/compare-plans-and-feature-limits.mdx` — Compare plans and feature limits

- **Article type:** Decision guide.
- **Cover:** The current plans; stable feature and usage dimensions; which limits are hard limits versus metered usage; what happens when a limit is reached; where to view authoritative current pricing; how upgrades and downgrades affect access.
- **Images:** No product screenshot unless the in-app plan comparison exposes information not available on the public pricing page. Prefer a maintained comparison table.
- **Video:** No video.

### `content/help/get-started/manage-your-subscription-and-billing.mdx` — Manage your subscription and billing

- **Article type:** Task guide for organization owners or billing administrators.
- **Cover:** Required role; opening **Settings → Billing**; viewing the active plan and renewal state; updating payment details; finding invoices; canceling or resuming; what changes immediately versus at the billing-period boundary.
- **Images:** Billing overview, payment-management handoff, and cancellation confirmation. Exclude real card, invoice, address, and customer data.
- **Video:** No video; billing states and warnings should remain easy to scan in text.

### `content/help/get-started/understand-usage-and-plan-limits.mdx` — Understand usage and plan limits

- **Article type:** Concept and feature reference.
- **Cover:** Each tracked resource; how active students and organizations are counted; reset or billing-cycle behavior where applicable; warning and blocked states; how removals, archiving, and plan changes affect usage.
- **Images:** Usage/limits panel showing safe sample values and one limit-warning state if it can be reproduced safely.
- **Video:** No video.

### `content/help/get-started/create-and-manage-organizations.mdx` — Create and manage organizations

- **Article type:** Overview that routes to organization tasks.
- **Cover:** Primary versus additional organization behavior; who can create one; how data and members are separated; plan limits; links to create, switch, and delete task guides.
- **Images:** Organization switcher with multiple demo organizations and the organization-management screen.
- **Video:** No video; link to the focused task guides instead.

## Build courses

### `content/help/build-courses/create-a-course-with-ai.mdx` — Create a course with AI

- **Article type:** Task guide.
- **Cover:** Availability and AI-credit requirements; starting the AI creation flow; writing an effective course brief; choosing or reviewing generated structure; generation states; editing, verifying, and publishing generated content; privacy and accuracy responsibilities.
- **Images:** AI course prompt form, generation/progress state, and generated outline review screen.
- **Video:** Recommended—the multi-screen generate-review-edit flow benefits from a focused walkthrough.

### `content/help/build-courses/duplicate-or-import-a-course.mdx` — Duplicate or import a course

- **Article type:** Task guide with separate supported variants.
- **Cover:** Difference between duplication and import; supported sources or formats; what content and settings are copied; what is excluded; processing states; how to review the new course; duplicate naming and ownership behavior.
- **Images:** Duplicate/import action menu, source selection or upload state, and completed copied course.
- **Video:** No video unless import includes a multi-step mapping interface.

### `content/help/build-courses/organize-content-with-sections.mdx` — Organize content with sections

- **Article type:** Task and best-practice guide.
- **Cover:** When sections help; creating, naming, editing, moving, and deleting sections; assigning lessons and exercises; effects on student navigation and progression; handling empty sections.
- **Images:** Course content tree before and after grouping, plus the create/edit section control.
- **Video:** Recommended—a short clip should demonstrate dragging content into sections while written steps remain complete.

### `content/help/build-courses/create-and-reorder-lessons-and-exercises.mdx` — Create and reorder lessons and exercises

- **Article type:** Task guide.
- **Cover:** Adding each content type; naming and opening an item; drag-and-drop ordering; moving items between sections; save behavior; student-facing order; restrictions caused by progression or published enrollments.
- **Images:** Add-content menu and course content tree with a moved item in its resulting position.
- **Video:** Recommended—drag-and-drop and cross-section movement are clearer in motion.

### `content/help/build-courses/turn-content-grouping-on-or-off.mdx` — Turn content grouping on or off

- **Article type:** Task guide with a behavior-change warning.
- **Cover:** What content grouping changes; where to toggle it; prerequisites; how existing sections and item order are handled; student-facing effects; reversibility and what to review before saving.
- **Images:** Grouping toggle and the course outline in grouped and ungrouped states.
- **Video:** No video.

### `content/help/build-courses/create-and-edit-a-lesson.mdx` — Create and edit a lesson

- **Article type:** Core task guide.
- **Cover:** Creating a lesson from the course outline; naming it; opening the editor; adding and formatting content; saving and draft behavior; previewing; publishing or making it available; editing an existing lesson safely.
- **Images:** Add-lesson control, lesson editor with the main regions labeled, and preview/result state.
- **Video:** Recommended—a concise editor walkthrough can orient first-time authors.

### `content/help/build-courses/write-lesson-content-in-the-editor.mdx` — Write lesson content in the editor

- **Article type:** Feature reference and task guide.
- **Cover:** Supported text structure and formatting; headings, lists, links, quotes, code, and embeds that are currently available; keyboard or slash-command behavior if shipped; paste behavior; autosave/draft state; accessibility and content-design guidance.
- **Images:** Formatting toolbar or command menu and a representative lesson with accessible structure.
- **Video:** No video; a scannable formatting reference is more useful.

### `content/help/build-courses/add-or-upload-a-video.mdx` — Add or upload a video

- **Article type:** Task and troubleshooting guide.
- **Cover:** Supported upload and embed methods; accepted formats and limits; upload/processing states; replacing or removing media; captions or transcripts; student playback behavior; common upload and playback failures.
- **Images:** Video insertion control, upload/processing state, and completed player in the lesson editor or preview.
- **Video:** Recommended—show the upload, processing, preview, and replacement flow without relying on the video for limits or troubleshooting.

### `content/help/build-courses/add-documents-and-downloads.mdx` — Add documents and downloads

- **Article type:** Task guide.
- **Cover:** Supported file types and limits; attaching or embedding a document; file naming; student access and download behavior; replacing/removing files; accessibility and privacy checks.
- **Images:** File/document insertion control and the resulting student-facing attachment.
- **Video:** No video.

### `content/help/build-courses/recover-drafts-and-use-version-history.mdx` — Recover drafts and use version history

- **Article type:** Task and recovery guide.
- **Cover:** What is saved automatically; how versions are created; opening history; previewing a version; restoring content; unsaved or conflicting edits; what restoration changes and whether it can be undone.
- **Images:** Save status, version-history list, version preview, and restore confirmation.
- **Video:** Recommended—the sequence of comparing and restoring versions benefits from continuity.

### `content/help/build-courses/choose-an-exercise-question-type.mdx` — Choose an exercise question type

- **Article type:** Decision guide and reference.
- **Cover:** Every shipped question type; best use cases; response format; automatic versus manual grading; answer and feedback capabilities; limitations; accessibility considerations.
- **Images:** Question-type picker and one compact representative example for visually distinct types. Avoid an image for every trivial variation.
- **Video:** No video.

### `content/help/build-courses/set-answers-points-and-automatic-grading.mdx` — Set answers, points, and automatic grading

- **Article type:** Task guide.
- **Cover:** Which question types support correct answers; entering accepted answers; assigning points; partial credit or tolerance where available; automatic grading timing; manual overrides; what students see after submission.
- **Images:** Answer and points configuration for one automatically graded question and the resulting graded response.
- **Video:** No video.

### `content/help/build-courses/update-course-details-and-cover-image.mdx` — Update course details and cover image

- **Article type:** Task guide.
- **Cover:** Opening course details; title, description, cover, and other shipped metadata; image requirements; save behavior; where changes appear; effects on URLs, enrollment, or published students where applicable.
- **Images:** Course details form and course card/landing-page result using safe demo content.
- **Video:** No video.

### `content/help/build-courses/set-course-order-and-content-grouping.mdx` — Set course order and content grouping

- **Article type:** Task and concept guide.
- **Cover:** Where course order applies; manual versus automatic order if supported; enabling grouping; interaction with tags, catalogs, or LMS sections; student-facing result; defaults and constraints.
- **Images:** Ordering/grouping settings and the resulting learner course list.
- **Video:** No video unless ordering is drag-and-drop, in which case add a short focused clip.

### `content/help/build-courses/enable-comments-and-course-downloads.mdx` — Enable comments and course downloads

- **Article type:** Settings task guide.
- **Cover:** Where each toggle lives; role and plan requirements; what comments allow; moderation implications; what “course downloads” includes; effects on existing students and content; student-facing result.
- **Images:** The two settings and separate student views of comments and download controls.
- **Video:** No video.

### `content/help/build-courses/add-a-course-callout.mdx` — Add a course callout

- **Article type:** Task guide.
- **Cover:** What a callout is and where it appears; opening the callout editor; supported text, link, image, or action fields; previewing; publishing; editing or removing; accessibility guidance.
- **Images:** Callout configuration and the resulting academy or course view.
- **Video:** No video.

## Manage learners

### `content/help/manage-learners/view-a-learner-profile-and-activity.mdx` — View a learner profile and activity

- **Article type:** Task and reference guide.
- **Cover:** Required permissions; finding a learner; profile fields and status; course enrollments; activity/progress timeline; available management actions; data freshness and privacy boundaries.
- **Images:** Audience table action into a safe demo learner profile and the activity/enrollment area.
- **Video:** No video.

### `content/help/manage-learners/add-and-remove-people-from-a-course.mdx` — Add and remove people from a course

- **Article type:** Task guide with a removal warning.
- **Cover:** Roles allowed to manage people; adding existing audience members; inviting new students if supported; bulk selection; removing enrollment; what happens to progress, submissions, access, and certificates; success states.
- **Images:** Course people list, add-person dialog, and removal confirmation describing consequences.
- **Video:** No video.

### `content/help/manage-learners/review-a-learners-course-progress.mdx` — Review a learner’s course progress

- **Article type:** Task and reference guide.
- **Cover:** Opening an individual student record from a course; completion percentage; lesson/exercise states; marks and submissions; last activity; locked or overdue items; available follow-up actions.
- **Images:** Student progress detail with safe sample data and an expanded content-progress view.
- **Video:** No video.

### `content/help/manage-learners/post-to-a-cohort-news-feed.mdx` — Post to a cohort news feed

- **Article type:** Task guide.
- **Cover:** Availability and permissions; opening a cohort; composing and formatting a post; audience and notification behavior; publishing; editing or deleting; what cohort members see.
- **Images:** Cohort post composer and resulting student-facing news-feed post.
- **Video:** No video.

## Deliver and engage

### `content/help/deliver-and-engage/view-and-export-marks.mdx` — View and export marks

- **Article type:** Task and reference guide.
- **Cover:** Required role; locating marks; filters and columns; score and grading-status meanings; opening a submission; export format and included fields; privacy and safe handling of exported student data.
- **Images:** Marks table with safe sample data, filter/export menu, and export-ready state.
- **Video:** No video.

### `content/help/deliver-and-engage/notify-learners-about-an-exercise.mdx` — Notify learners about an exercise

- **Article type:** Task guide.
- **Cover:** Who can send a notification; eligible recipients; where to trigger it; subject/message options; send timing; duplicate-send considerations; email or in-app delivery; confirmation and failure states.
- **Images:** Notify action, recipient/message dialog, and send confirmation. Never show real email addresses.
- **Video:** No video.

### `content/help/deliver-and-engage/understand-locked-course-content.mdx` — Understand locked course content

- **Article type:** Concept and troubleshooting reference.
- **Cover:** Why content locks; sequential progression, completion rules, prerequisites, enrollment state, and release rules that can cause it; administrator versus student view; diagnosing the blocking item; safe ways to unlock access.
- **Images:** Student locked-content state and administrator progression/completion settings that caused it.
- **Video:** No video.

### `content/help/deliver-and-engage/review-certificate-reports.mdx` — Review certificate reports

- **Article type:** Task and reference guide.
- **Cover:** Required role; report location; eligibility, issued, and downloaded states; filters and date ranges; opening a record; export behavior; revocation or reissue actions only if shipped.
- **Images:** Certificate report table and record detail using safe demo data.
- **Video:** No video.

### `content/help/deliver-and-engage/help-a-learner-download-a-certificate.mdx` — Help a learner download a certificate

- **Article type:** Troubleshooting and role-handoff guide.
- **Cover:** Eligibility checks; course completion and certificate rules; where students find certificates; download steps; missing or disabled download causes; browser/download troubleshooting; what administrators can verify.
- **Images:** Student certificate location and download control, plus the administrator eligibility/report state.
- **Video:** No video.

### `content/help/deliver-and-engage/understand-compliance-courses.mdx` — Understand compliance courses

- **Article type:** Concept and decision guide.
- **Cover:** Purpose of a compliance course; differences from other course types; assignment and due-date behavior; recurring cycles; completion and certificate relationships; administrator and student experience; when to choose this type.
- **Images:** Lifecycle diagram from assignment through completion and recurrence; one course-type setting screenshot if needed.
- **Video:** No video.

### `content/help/deliver-and-engage/configure-recurring-compliance-training.mdx` — Configure recurring compliance training

- **Article type:** Task guide.
- **Cover:** Prerequisites; recurrence options; start/due dates; assignment behavior; what creates a new cycle; reminders; effects on existing completions; saving and verifying the schedule.
- **Images:** Recurrence configuration, date/rule fields, and resulting cycle schedule.
- **Video:** Recommended—the relationship between recurrence settings and generated cycles benefits from a narrated walkthrough.

### `content/help/deliver-and-engage/manage-active-compliance-cycles.mdx` — Manage active compliance cycles

- **Article type:** Task and operations guide.
- **Cover:** Active-cycle states; viewing assigned students and deadlines; changing allowed settings; reminders and follow-up; closing or canceling a cycle; consequences for progress and history.
- **Images:** Active-cycle list, cycle detail, and any close/cancel confirmation.
- **Video:** No video.

### `content/help/deliver-and-engage/review-learner-compliance-history.mdx` — Review learner compliance history

- **Article type:** Task and reference guide.
- **Cover:** Finding a student; cycle-by-cycle status; completion, expiration, overdue, and exemption meanings if supported; certificates/evidence; filters; export or audit use; privacy expectations.
- **Images:** Individual compliance-history timeline or table with safe demo data.
- **Video:** No video.

### `content/help/deliver-and-engage/monitor-organization-compliance.mdx` — Monitor organization compliance

- **Article type:** Reporting and decision guide.
- **Cover:** Organization-level status metrics; current versus historical cycles; overdue and at-risk populations; filters; drilling into courses, cohorts, or students; export/report actions; recommended review cadence without making policy claims.
- **Images:** Compliance overview dashboard and an applied filter/drill-down state.
- **Video:** No video.

### `content/help/deliver-and-engage/post-a-course-announcement.mdx` — Post a course announcement

- **Article type:** Task guide.
- **Cover:** Required permissions; opening the course news feed; composing and formatting; recipient scope; notification behavior; publishing; editing or deleting; student-facing result.
- **Images:** Announcement composer and resulting student news-feed item.
- **Video:** No video.

### `content/help/deliver-and-engage/set-organization-wide-ai-tutor-defaults.mdx` — Set organization-wide AI Tutor defaults

- **Article type:** Settings and policy guide.
- **Cover:** Availability, permissions, and AI-credit implications; opening **Settings → AI Tutor**; every organization-level default; what students can ask or access; privacy and content scope; save behavior; course-level inheritance.
- **Images:** Organization AI Tutor settings with inheritance/default labels visible.
- **Video:** No video.

### `content/help/deliver-and-engage/override-ai-tutor-settings-for-a-course.mdx` — Override AI Tutor settings for a course

- **Article type:** Task guide.
- **Cover:** Prerequisites and permissions; inherited versus overridden values; opening course AI Tutor settings; changing controls; resetting to organization defaults; effect on current students and conversations.
- **Images:** Course-level settings showing inherited values and an active override.
- **Video:** No video.

### `content/help/deliver-and-engage/use-ai-tutor-as-a-learner.mdx` — Use AI Tutor as a learner

- **Article type:** Student task and expectations guide.
- **Cover:** Where AI Tutor appears; when it is available; starting and continuing a conversation; what course context it uses; usage limits; verifying answers against course material; privacy and prohibited sensitive information; getting instructor help.
- **Images:** Student AI Tutor entry point and conversation panel using harmless demo prompts.
- **Video:** Recommended—a short student-view demonstration can show opening, asking, and returning to course content.

## Publish and brand

### `content/help/publish-and-brand/choose-which-lms-navigation-tabs-learners-see.mdx` — Choose which LMS navigation tabs learners see

- **Article type:** Settings task guide.
- **Cover:** Opening **Settings → Customize LMS**; every configurable tab; dependencies that force or hide a tab; ordering if supported; save behavior; effect on signed-in students; preview/testing.
- **Images:** Navigation-tab settings and learner LMS before/after using safe demo content.
- **Video:** No video.

### `content/help/publish-and-brand/customize-the-learner-dashboard-banner.mdx` — Customize the learner dashboard banner

- **Article type:** Task guide.
- **Cover:** Banner location; supported text, image, and action fields; image dimensions; visibility conditions; preview; save/publish behavior; accessibility and responsive design checks.
- **Images:** Banner editor and desktop plus narrow learner-dashboard results.
- **Video:** No video.

### `content/help/publish-and-brand/show-course-news-feeds-and-grading.mdx` — Show course news feeds and grading

- **Article type:** Settings and behavior guide.
- **Cover:** Each feature toggle; required course or organization conditions; what students see; notification implications; grading visibility; effects of disabling features after use; how to test.
- **Images:** Relevant Customize LMS settings and student views of news feed and marks.
- **Video:** No video.

### `content/help/publish-and-brand/configure-polls-and-live-comments.mdx` — Configure polls and live comments

- **Article type:** Settings and moderation guide.
- **Cover:** Availability and permissions; enabling each feature; where it appears; participation and moderation behavior; notifications; disabling after activity exists; student-facing experience.
- **Images:** Poll/comment settings and an active student-facing poll or live-comment surface.
- **Video:** Recommended if comments update in real time; show participation and moderation continuity.

### `content/help/publish-and-brand/customize-the-sign-in-background.mdx` — Customize the sign-in background

- **Article type:** Branding task guide.
- **Cover:** Opening the setting; supported image type, size, and crop behavior; uploading/replacing/removing; preview; contrast and accessibility; custom-domain and academy scope.
- **Images:** Sign-in background picker and resulting sign-in page on desktop and narrow viewport.
- **Video:** No video.

### `content/help/publish-and-brand/configure-the-course-catalog-section.mdx` — Configure the course catalog section

- **Article type:** Landing-page builder task guide.
- **Cover:** Adding/selecting the catalog section; course inclusion rules; filters, ordering, and layout options; empty-state behavior; preview; publishing; how course visibility affects the result.
- **Images:** Catalog-section settings and published academy catalog result.
- **Video:** Recommended—the builder-to-preview workflow and live section changes benefit from a focused walkthrough.

### `content/help/publish-and-brand/add-embeds-links-and-callouts.mdx` — Add embeds, links, and callouts

- **Article type:** Landing-page component reference and task guide.
- **Cover:** Supported component types; adding and ordering them; safe URL/embed requirements; labels and calls to action; responsive preview; publishing; removing; accessibility guidance.
- **Images:** Component picker and one configured example of each visually distinct component type.
- **Video:** Recommended if components are arranged with drag-and-drop; otherwise no video.

### `content/help/publish-and-brand/reconnect-a-domain-that-needs-attention.mdx` — Reconnect a domain that needs attention

- **Article type:** Troubleshooting guide.
- **Cover:** Domain warning states; checking current DNS without deleting valid records; re-verification; SSL pending/error states; propagation considerations without promising a duration; preserving academy access; safe evidence for support.
- **Images:** Exact needs-attention status, expected DNS records with demo values, and successful verified state.
- **Video:** No video.

### `content/help/publish-and-brand/create-a-course-widget.mdx` — Create a course widget

- **Article type:** Task guide.
- **Cover:** Widget purpose and prerequisites; opening the widget area; creating and naming; choosing an initial source and layout; saving; previewing; finding embed code; draft/published state.
- **Images:** Widget list/create action, editor overview, and preview.
- **Video:** Recommended—the end-to-end create-preview-publish flow spans several states.

### `content/help/publish-and-brand/choose-courses-layout-and-design.mdx` — Choose courses, layout, and design

- **Article type:** Widget customization guide.
- **Cover:** Selecting courses or rules; ordering; supported layouts; colors, typography, spacing, and card options; responsive behavior; preview; inherited branding; save/publish behavior.
- **Images:** Course selector, layout/design controls, and desktop/narrow previews.
- **Video:** No video unless course ordering is drag-and-drop; a short clip can supplement that interaction.

### `content/help/publish-and-brand/embed-a-widget-on-another-website.mdx` — Embed a widget on another website

- **Article type:** Task and troubleshooting guide.
- **Cover:** Publishing prerequisite; copying embed code; generic installation location; supported website constraints; sizing/responsiveness; updates after embedding; common script, content-security-policy, and caching failures; safe sharing of diagnostics.
- **Images:** Copy-embed-code control and a widget rendered on a neutral demo website.
- **Video:** No video; platform-specific variations should use tabs or separate authoritative links if needed.

### `content/help/publish-and-brand/use-widget-version-history.mdx` — Use widget version history

- **Article type:** Task and recovery guide.
- **Cover:** How versions are created; opening history; identifying author/time/state; previewing differences; restoring; whether restore republishes automatically; undo/recovery behavior.
- **Images:** Version list, version preview, and restore confirmation.
- **Video:** Recommended—the compare-preview-restore sequence benefits from continuity.

### `content/help/publish-and-brand/archive-or-restore-a-widget.mdx` — Archive or restore a widget

- **Article type:** Task guide with an availability warning.
- **Cover:** Difference between archive and delete; what happens to existing embeds; locating archived widgets; archiving; restoring; naming/status conflicts; success states.
- **Images:** Archive action and confirmation, archived list, and restore action.
- **Video:** No video.

## Analytics and reporting

### `content/help/analytics-and-reporting/read-your-organization-analytics-overview.mdx` — Read your organization analytics overview

- **Article type:** Metric reference and orientation guide.
- **Cover:** Date range and data freshness; definition of every summary metric; trend comparison behavior; filter scope; drill-down destinations; permissions; known exclusions.
- **Images:** Full analytics overview with numbered annotations tied to metric definitions and safe demo data.
- **Video:** No video.

### `content/help/analytics-and-reporting/analyze-landing-views-enrollments-and-completions.mdx` — Analyze landing views, enrollments, and completions

- **Article type:** Reporting guide.
- **Cover:** Definition and attribution of each funnel metric; date/filter behavior; reading trends; distinguishing academy/course views where applicable; conversion calculation; practical interpretation limits; drill-down or export options.
- **Images:** Funnel/time-series area with an applied date range and tooltip or detail state.
- **Video:** No video.

### `content/help/analytics-and-reporting/view-top-countries-and-popular-course-types.mdx` — View top countries and popular course types

- **Article type:** Metric reference.
- **Cover:** How country is determined; privacy/unknown values; ranking rules; what “popular” measures; date and filter scope; how to use the data without over-interpreting it.
- **Images:** Country and course-type visualizations with safe aggregate demo data.
- **Video:** No video.

### `content/help/analytics-and-reporting/compare-your-top-courses.mdx` — Compare your top courses

- **Article type:** Reporting and decision guide.
- **Cover:** Ranking metric and tie behavior; available comparison dimensions; date/filter scope; opening course analytics; identifying completion or engagement outliers; limitations of comparing unlike course types.
- **Images:** Top-courses table/chart and an applied metric or date filter.
- **Video:** No video.

### `content/help/analytics-and-reporting/review-course-performance-and-learner-progress.mdx` — Review course performance and learner progress

- **Article type:** Task and metric reference.
- **Cover:** Course analytics location; enrollment, active-student, progress, completion, and score metrics; date/filter behavior; cohort or student drill-down; interpreting incomplete and inactive states.
- **Images:** Course analytics overview and learner-progress table with safe demo data.
- **Video:** No video.

### `content/help/analytics-and-reporting/view-submissions-and-completion-data.mdx` — View submissions and completion data

- **Article type:** Reporting guide.
- **Cover:** Submission and completion definitions; filtering by exercise, status, or date; opening a record; late/missing/graded states; export behavior; differences between attempts and students.
- **Images:** Submission/completion table, filters, and one record detail.
- **Video:** No video.

### `content/help/analytics-and-reporting/view-a-learners-analytics.mdx` — View a learner’s analytics

- **Article type:** Task and reference guide.
- **Cover:** Finding a student; organization-wide and per-course metrics; enrollment, activity, progress, marks, and completion history; date/data freshness; available actions; privacy expectations.
- **Images:** Student analytics profile with safe sample data and a course drill-down.
- **Video:** No video.

### `content/help/analytics-and-reporting/report-on-compliance-status.mdx` — Report on compliance status

- **Article type:** Reporting and audit guide.
- **Cover:** Available status dimensions; active versus historical cycle scope; overdue/expiring/completed definitions; filters; cohort/course/student drill-down; export fields; handling the report as sensitive data.
- **Images:** Compliance status dashboard and export/filter controls with safe aggregate data.
- **Video:** No video.

## Account, team, and security

### `content/help/account-team-security/update-your-personal-profile.mdx` — Update your personal profile

- **Article type:** Task guide.
- **Cover:** Opening **Settings → Profile**; editable fields; avatar requirements; email or identity-provider constraints; validation; saving; where changes appear.
- **Images:** Profile form and avatar control using demo identity data.
- **Video:** No video.

### `content/help/account-team-security/manage-your-notification-preferences.mdx` — Manage your notification preferences

- **Article type:** Settings guide.
- **Cover:** Opening **Settings → Notifications**; every preference category; email versus in-app behavior; mandatory operational/security messages; save timing; organization scope.
- **Images:** Notification preferences grouped by category.
- **Video:** No video.

### `content/help/account-team-security/remove-a-team-member.mdx` — Remove a team member

- **Article type:** Destructive task guide.
- **Cover:** Required role; checking ownership and assigned courses; what access is removed; what authored content and records remain; transfer requirements if any; removal steps; confirmation and reinvitation behavior.
- **Images:** Team-member action menu and consequence-focused removal confirmation with demo data.
- **Video:** No video.

### `content/help/account-team-security/understand-primary-and-additional-organizations.mdx` — Understand primary and additional organizations

- **Article type:** Concept reference.
- **Cover:** Definitions; ownership and billing relationship; plan limits; data and team separation; switching behavior; what can or cannot move between organizations; deletion constraints.
- **Images:** Relationship diagram plus organization switcher showing primary/additional labels if the UI exposes them.
- **Video:** No video.

### `content/help/account-team-security/create-another-organization.mdx` — Create another organization

- **Article type:** Task guide.
- **Cover:** Eligibility and limits; opening organization management; naming and site identifier; initial setup; owner/team defaults; billing impact; success state and next setup steps.
- **Images:** Create-organization action, form, and new organization in the switcher.
- **Video:** No video.

### `content/help/account-team-security/switch-between-organizations.mdx` — Switch between organizations

- **Article type:** Quick task guide.
- **Cover:** Opening the switcher; identifying the active organization; switching; URL and context changes; unsaved-work warning if applicable; troubleshooting a missing organization.
- **Images:** Open organization switcher with active and available organizations clearly labeled.
- **Video:** No video.

### `content/help/account-team-security/delete-an-organization.mdx` — Delete an organization

- **Article type:** Destructive task guide.
- **Cover:** Required ownership; primary-organization restrictions; everything deleted or retained; custom-domain, billing, student, content, certificate, and integration effects; export/backup steps; confirmation; recovery policy.
- **Images:** Delete control and full consequence confirmation. Never use a real organization.
- **Video:** No video.

### `content/help/account-team-security/view-and-change-your-plan.mdx` — View and change your plan

- **Article type:** Billing task guide.
- **Cover:** Required role; viewing active plan and renewal; comparing available changes; upgrade timing; downgrade limits and feature loss; confirmation; invoice/payment implications; cancellation path.
- **Images:** Current-plan panel, plan chooser, and change confirmation with no private billing data.
- **Video:** No video.

### `content/help/account-team-security/understand-student-and-organization-limits.mdx` — Understand student and organization limits

- **Article type:** Limit reference and troubleshooting guide.
- **Cover:** How each resource is counted; active versus invited/removed students; primary/additional organization count; warning thresholds; blocked actions; reducing usage; upgrade behavior.
- **Images:** Usage panel and a reproducible limit warning or blocked state.
- **Video:** No video.

### `content/help/account-team-security/view-and-manage-ai-credits.mdx` — View and manage AI credits

- **Article type:** Usage and billing guide.
- **Cover:** What consumes credits; where balance and history appear; reset or purchase behavior; organization scope; insufficient-credit state; controlling usage; billing implications.
- **Images:** **Settings → AI Credits** overview and usage-history or insufficient-credit state with demo values.
- **Video:** No video.

### `content/help/account-team-security/choose-allowed-sign-in-methods.mdx` — Choose allowed sign-in methods

- **Article type:** Security settings guide.
- **Cover:** Required role; password/social/SSO/token methods actually supported; enabling and disabling; effects on existing sessions and users; signup versus sign-in distinction; lockout prevention; testing before enforcement.
- **Images:** **Settings → Authentication → General** with sign-in options and any enforcement warning.
- **Video:** No video.

### `content/help/account-team-security/set-up-token-based-authentication.mdx` — Set up token-based authentication

- **Article type:** Security integration task guide.
- **Cover:** Intended use; prerequisites; opening **Settings → Authentication → Token Auth**; generating or rotating the signing secret; required token claims and expiry at a high level; test flow; revocation; secret-storage warnings.
- **Images:** Token Auth settings with every secret redacted and a non-sensitive enabled/test state.
- **Video:** No video; precise written security instructions are preferable.

## Integrations and automation

### `content/help/integrations-and-automation/understand-classroomio-integrations.mdx` — Understand ClassroomIO integrations

- **Article type:** Overview and routing guide.
- **Cover:** Available integration surfaces; when to use built-in integrations, MCP, API, SSO, embeds, or webhooks if shipped; permissions and credential ownership; data-access boundaries; links to focused setup guides.
- **Images:** Architecture/decision diagram rather than a transient integrations gallery.
- **Video:** No video.

### `content/help/integrations-and-automation/understand-classroomio-mcp.mdx` — Understand ClassroomIO MCP

- **Article type:** Concept and security reference.
- **Cover:** What Model Context Protocol (MCP) enables; supported ClassroomIO capabilities; who can create access; authentication model; permission and data scope; limits; suitable and unsuitable use cases; revocation.
- **Images:** MCP relationship diagram connecting an AI client, ClassroomIO MCP, and organization data.
- **Video:** No video.

### `content/help/integrations-and-automation/create-rotate-and-revoke-mcp-keys.mdx` — Create, rotate, and revoke MCP keys

- **Article type:** Security task guide.
- **Cover:** Required role; creating a key; one-time secret display; naming and scope; secure storage; rotation sequence that avoids downtime; revocation effects; audit information; lost-key recovery.
- **Images:** Key-management list and create/revoke confirmations with all secrets hidden.
- **Video:** No video.

### `content/help/integrations-and-automation/connect-claude-code-codex-cursor-or-opencode.mdx` — Connect Claude Code, Codex, Cursor, or OpenCode

- **Article type:** Multi-variant setup guide.
- **Cover:** Shared prerequisites; server URL and credential handling; separate tabs for each verified client; exact configuration location/shape; restarting or reconnecting; successful tool discovery; common authentication and configuration errors.
- **Images:** One connection-success state per client only when it materially differs; redact all keys, usernames, paths, and private organization data.
- **Video:** No video; client instructions change quickly and are easier to maintain as text.

### `content/help/integrations-and-automation/understand-mcp-limits-and-permissions.mdx` — Understand MCP limits and permissions

- **Article type:** Security and limit reference.
- **Cover:** Available tools/actions; read versus write capabilities; organization scope; role inheritance; rate or usage limits; AI-credit implications if any; auditability; safe least-privilege practices.
- **Images:** Permission/scope matrix or diagram. Add a settings screenshot only if scopes are configurable in the UI.
- **Video:** No video.

### `content/help/integrations-and-automation/create-and-manage-api-keys.mdx` — Create and manage API keys

- **Article type:** Security task guide.
- **Cover:** Required role and plan; opening key management; creating/naming/scoping; one-time display; secure storage; rotation; revocation; audit metadata; troubleshooting invalid or expired keys.
- **Images:** API key list and create/revoke states with secrets fully redacted.
- **Video:** No video.

### `content/help/integrations-and-automation/authenticate-an-api-request.mdx` — Authenticate an API request

- **Article type:** Developer quick-start guide.
- **Cover:** API base URL; required authorization header; safe environment-variable example; one minimal request and response; common 401/403 causes; key scope and rotation links; link to API reference.
- **Images:** No screenshot. Use short, copyable code examples with placeholder credentials.
- **Video:** No video.

## Learner guides

### `content/help/learner-guides/sign-in-and-reset-your-password.mdx` — Sign in and reset your password

- **Article type:** Student task and troubleshooting guide.
- **Cover:** Finding the correct academy sign-in page; available sign-in methods; requesting a reset; verification and reset email behavior; expired/used links; SSO-only organizations; safe escalation without sharing credentials.
- **Images:** Academy sign-in, reset request, and reset-password form using demo identity data.
- **Video:** No video.

### `content/help/learner-guides/update-your-profile-and-preferences.mdx` — Update your profile and preferences

- **Article type:** Student task guide.
- **Cover:** Opening profile/preferences; editable identity fields and avatar; notification or accessibility preferences actually available; save behavior; identity-provider restrictions; where changes appear.
- **Images:** Student profile and preferences screens with demo data.
- **Video:** No video.

### `content/help/learner-guides/navigate-lessons-and-exercises.mdx` — Navigate lessons and exercises

- **Article type:** Student orientation and task guide.
- **Cover:** Opening a course; course outline; current/completed/locked states; moving next/previous; section navigation; resuming; differences between lessons and exercises; mobile behavior where relevant.
- **Images:** Student course player with outline labels and representative lesson/exercise states.
- **Video:** Recommended—a short student-view tour can show movement through the course player and resume behavior.

### `content/help/learner-guides/understand-locked-content-and-progression.mdx` — Understand locked content and progression

- **Article type:** Student quick answer and troubleshooting guide.
- **Cover:** Common reasons content is locked; identifying the required previous item; lesson and exercise completion signals; waiting for grading or scheduled access; what the student can do; when to contact the course team.
- **Images:** Locked item with its explanatory message and the completion state required to unlock it.
- **Video:** No video.

### `content/help/learner-guides/complete-and-submit-an-exercise.mdx` — Complete and submit an exercise

- **Article type:** Student task guide.
- **Cover:** Opening an exercise; supported response interactions; required questions; saving/resuming if supported; submitting; confirmation; retries; automatic versus manual grading; what cannot be edited after submission.
- **Images:** Exercise response state, validation for a missing required answer, and submission confirmation.
- **Video:** Recommended for multi-question navigation and submission continuity, especially on narrow screens.

### `content/help/learner-guides/view-marks-and-instructor-feedback.mdx` — View marks and instructor feedback

- **Article type:** Student task and reference guide.
- **Cover:** Where marks appear; pending, graded, and needs-review states; points/percentages; per-question and overall feedback; notifications; resubmission implications; who to contact about grading.
- **Images:** Student marks list and detailed feedback using demo results.
- **Video:** No video.

### `content/help/learner-guides/know-when-you-qualify-for-a-certificate.mdx` — Know when you qualify for a certificate

- **Article type:** Student eligibility reference.
- **Cover:** Course completion threshold; lesson/exercise requirements; grading dependencies; compliance-cycle timing; certificate availability state; reasons eligibility may be delayed; administrator-controlled rules.
- **Images:** Student course completion/eligibility indicator and certificate-ready state.
- **Video:** No video.

### `content/help/learner-guides/view-and-download-your-certificates.mdx` — View and download your certificates

- **Article type:** Student task and troubleshooting guide.
- **Cover:** Finding certificates; opening certificate details; downloading/printing; certificate identifier or verification if available; missing certificate checks; browser download issues; expired/reissued behavior.
- **Images:** Student certificate list, certificate preview, and download control using demo data.
- **Video:** No video.

## Troubleshooting and reference

### `content/help/troubleshooting-and-reference/troubleshoot-login-and-verification-emails.mdx` — Troubleshoot login and verification emails

- **Article type:** Troubleshooting guide.
- **Cover:** Wrong academy/login URL; email spelling; spam/quarantine; delivery delays without promising timing; expired verification/reset links; social sign-in and SSO conflicts; resending safely; escalation evidence.
- **Images:** Only exact error states that materially help diagnosis; never show a real inbox or address.
- **Video:** No video.

### `content/help/troubleshooting-and-reference/troubleshoot-course-access-and-enrollment.mdx` — Troubleshoot course access and enrollment

- **Article type:** Troubleshooting decision tree.
- **Cover:** Publication and visibility; self-enrollment; organization restrictions; invitation status; payment completion; cohort assignment; course dates; account mismatch; locked progression versus missing enrollment; role-specific checks.
- **Images:** Representative unavailable/enrollment error and the corresponding administrator setting. Use separate student/admin labels.
- **Video:** No video.

### `content/help/troubleshooting-and-reference/troubleshoot-video-uploads-and-playback.mdx` — Troubleshoot video uploads and playback

- **Article type:** Troubleshooting guide.
- **Cover:** Supported format/size; unstable or interrupted upload; processing state; browser/network checks; embedded-provider restrictions; captions; student playback, audio, and full-screen issues; evidence to collect.
- **Images:** Upload/processing/error states and player error only when the exact message matters.
- **Video:** No video; a video is a poor dependency for playback troubleshooting.

### `content/help/troubleshooting-and-reference/troubleshoot-invitation-and-notification-emails.mdx` — Troubleshoot invitation and notification emails

- **Article type:** Troubleshooting guide.
- **Cover:** Recipient address and status; pending versus accepted invitation; spam/quarantine; notification preferences; organization email restrictions; resend behavior; duplicate invitations; safe escalation evidence.
- **Images:** Pending invitation state and resend action with all recipient data replaced.
- **Video:** No video.

### `content/help/troubleshooting-and-reference/troubleshoot-custom-domains-and-ssl.mdx` — Troubleshoot custom domains and SSL

- **Article type:** Troubleshooting decision tree.
- **Cover:** Required DNS records; conflicting records; apex/subdomain differences; verification and propagation; SSL pending/error; redirect loops; cached results; preserving the default academy URL; safe DNS evidence for support.
- **Images:** ClassroomIO domain status, expected record table with demo values, and representative registrar DNS fields.
- **Video:** No video; registrar interfaces vary and age quickly.

### `content/help/troubleshooting-and-reference/troubleshoot-course-publishing-and-visibility.mdx` — Troubleshoot course publishing and visibility

- **Article type:** Troubleshooting guide.
- **Cover:** Draft/unpublished state; missing required content/settings; academy and course visibility; enrollment restrictions; catalog inclusion; course type/date behavior; permissions; cache/preview differences; success checks from a student account.
- **Images:** Publication/visibility status and a student-facing unavailable state paired with the correcting setting.
- **Video:** No video.

### `content/help/troubleshooting-and-reference/supported-browsers-and-devices.mdx` — Supported browsers and devices

- **Article type:** Compatibility reference.
- **Cover:** Currently supported desktop/mobile browsers and minimum versions only if verified; operating-system expectations; JavaScript/cookie requirements; responsive support; unsupported embedded browsers; update/cache troubleshooting; accessibility considerations.
- **Images:** No image. Keep the compatibility matrix textual and maintainable.
- **Video:** No video.

### `content/help/troubleshooting-and-reference/contact-classroomio-support.mdx` — Contact ClassroomIO support

- **Article type:** Support escalation guide.
- **Cover:** Available official support channels and hours/plan differences if verified; when to use each; information to include; how to capture safe diagnostics; expected status/response communication without unsupported promises; security and privacy exclusions.
- **Images:** One screenshot of the in-product support entry point if it exists and is stable.
- **Video:** No video.

### `content/help/troubleshooting-and-reference/organization.mdx` — Organization structure

- **Article type:** Concept reference.
- **Cover:** Definition; relationship to an academy; primary/additional distinctions; ownership, teams, billing, and limits; what data belongs to an organization; links to create, switch, and delete guides.
- **Images:** Relationship diagram; no UI screenshot unless labels are necessary to distinguish organization context.
- **Video:** No video.

### `content/help/troubleshooting-and-reference/section-lesson-and-exercise.mdx` — Section, lesson, and exercise

- **Article type:** Concept comparison reference.
- **Cover:** Definition and hierarchy of each item; what each can contain; student navigation; ordering; completion and grading differences; when sections are optional; links to focused creation guides.
- **Images:** Course-content hierarchy diagram and one annotated course outline.
- **Video:** No video.

### `content/help/troubleshooting-and-reference/certificate-and-compliance-cycle.mdx` — Certificate and compliance cycle

- **Article type:** Concept comparison reference.
- **Cover:** Definition of a certificate and compliance cycle; eligibility versus issuance; recurrence and expiration; relationship to course completion; administrator and student views; reporting implications; links to configuration and download guides.
- **Images:** Lifecycle diagram connecting assignment, cycle, completion, eligibility, and certificate issuance.
- **Video:** No video.

## Suggested production order

1. Write foundational concept pages that other guides need to link to: ClassroomIO, organization structure, content hierarchy, course locking, and compliance concepts.
2. Complete the highest-frequency setup journeys: plans/billing, course creation, lesson creation, people management, authentication, and student sign-in/course-taking.
3. Complete feature families together so screenshots and terminology remain consistent: AI Tutor, compliance, widgets, analytics, and LMS customization.
4. Write troubleshooting pages after their canonical task guides so diagnostics can link to stable instructions instead of repeating them.
5. Capture media only after written procedures and exact UI labels are verified.

When an article is complete, replace its coming-soon MDX, add `last_reviewed`, add contextual inbound and related-guide links, validate/build the Help Center, and check off or remove its entry here.
