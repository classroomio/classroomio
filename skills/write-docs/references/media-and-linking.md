# Media and linking standard

Screenshots, video, and links should reduce uncertainty at the exact point where it occurs. They are part of the procedure, not decoration added after writing.

## Choose the right medium

Use text for every required fact and action.

Add a screenshot when the reader must recognize:

- where a control sits among similar controls;
- a modal, menu, editor, table state, mapping screen, or multi-field configuration;
- the result of an action or the student-facing outcome;
- a setting whose label alone is easy to confuse;
- an error, pending state, or destructive confirmation.

A screenshot is usually unnecessary when a short stable path and an unambiguous label are enough.

Add video when motion or continuity is the main source of difficulty:

- drag-and-drop or reorder behavior;
- a multi-screen workflow where transitions matter;
- a live-class or media interaction that is hard to understand from still frames;
- a short product tour that supports, but does not replace, a written procedure.

Use a diagram for relationships, lifecycle, inheritance, or branching that requires several paragraphs to explain. Do not use a diagram for a linear three-step task.

There is no image or video quota. A short answer may need no media; a visual builder may need a screenshot for most major states.

## Screenshot placement

Place a screenshot after the sentence or step that tells the reader what to do, and before the next step. The reader should know what they are looking for before seeing it.

Good sequence:

```mdx
### 2. Choose the completion rule

Under **Lesson completion**, select **Manual**, **Video watch**, or **None**.

![Lesson completion options with Manual selected](./images/control-course-progression/completion-rule.webp)
```

Do not:

- open an article with a screenshot before explaining its purpose;
- place several screenshots together with no text between them;
- put required instructions only in a caption or annotation;
- use a full-page screenshot when the relevant control is a small unreadable detail;
- repeat the same screenshot in multiple articles when a canonical guide can be linked.

For before/after states, label each state in the surrounding text and keep the images adjacent to their explanations. Avoid side-by-side layouts when either image becomes illegible on mobile.

## Screenshot composition

Capture a real, current ClassroomIO state using demo data.

- Show enough product chrome to orient the reader: page title, relevant sidebar item, tab, or modal title.
- Crop unrelated browser chrome and empty space.
- Use the normal desktop layout unless the article is specifically about mobile.
- Use a consistent theme within one article.
- Close unrelated menus, notifications, debug panels, and extensions.
- Hide the pointer unless its location communicates the action.
- Never expose real names, email addresses, domains, student records, tokens, payment data, analytics, or private URLs. Replace them with realistic demo data before capture; do not rely on a tiny blur that may be reversible.
- Capture at a scale where labels remain legible after the help column constrains the image.
- Re-capture when labels, layout, or the resulting state has materially changed.

Annotations:

- Prefer the product's own focus, selected, open, or error state.
- Add one restrained arrow or outline only when the target is still ambiguous.
- Use numbered markers only when the prose refers to several targets in a defined order.
- Do not cover labels, values, or error text.
- Keep annotation color and style consistent across the help center.

## Screenshot files

For new article-specific media, keep files beside their content in a predictable folder:

```text
apps/help/content/help/<section>/
|-- <article-slug>.mdx
`-- images/
    `-- <article-slug>/
        |-- <state-or-action>.webp
        `-- <state-or-action>-student-view.webp
```

Reference them relatively:

```md
![Descriptive alt text](./images/<article-slug>/<state-or-action>.webp)
```

Relative content images let Blume stamp intrinsic dimensions, optimize output, and provide click-to-zoom. Keep existing `/help/<name>.webp` public references working; migrate a legacy image only when every reference is updated and the old URL is intentionally preserved or retired.

Image requirements:

- WebP for ordinary product screenshots.
- Kebab-case filename describing the state or action, not `screenshot-1`.
- Cap width at 1280 pixels unless small text genuinely requires more; never upscale.
- Use about 80 quality, strip metadata, and inspect the result for text artifacts.
- Keep the source aspect ratio.
- Avoid animated GIFs. Use video for meaningful motion or a static frame for one state.

## Alt text and captions

Alt text describes the information the screenshot contributes, not every visible word.

- Use sentence case without a trailing period.
- Name the page or panel, the relevant control or state, and the annotation if present.
- Do not begin with “Image of” or “Screenshot of.”
- Do not repeat the preceding sentence verbatim.
- Keep it concise enough to scan, but specific enough to replace the visual cue.

Example:

```md
![Audience table with the Actions menu open and Assign to Courses highlighted](./images/manage-your-audience/assign-to-courses.webp)
```

Use a visible caption only when the reader needs interpretation that does not fit naturally in the prose: a before/after distinction, a non-obvious result, or the source and date of a diagram. Captions do not replace alt text.

## Video rules

Video is supplementary. A reader must be able to complete the task when playback is blocked, captions are off, or the product has changed slightly.

Placement:

- Whole-workflow video: after the opening answer and real prerequisites, before the detailed procedure.
- Section-specific video: after the section's purpose sentence and before or after the short written sequence it demonstrates.
- Troubleshooting clip: beside the exact symptom, never in a generic media gallery.

Embed an approved YouTube video with a descriptive title:

```mdx
<YouTube id="VIDEO_ID" title="Create and publish a ClassroomIO course" />
```

Use `start={seconds}` when linking directly to the relevant segment materially helps. Do not autoplay.

Every video must have:

- accurate captions;
- a descriptive embed title;
- written steps or a written summary containing every required action, value, warning, and result;
- an owner and a review trigger when the demonstrated UI changes;
- no customer data, secrets, private URLs, or unlicensed media.

Prefer one focused video over a long webinar recording. If only a portion is relevant, link or embed at the useful timestamp and summarize that portion. Do not make users watch a video to discover a one-sentence answer.

## Internal linking model

Links connect moments of need; they do not form a bibliography.

Use four link positions:

1. **Prerequisite link** near the start when another task must be complete first.
2. **Just-in-time link** at the first point where a concept or separate task becomes necessary.
3. **Role handoff link** where an administrator action affects a student experience, or vice versa.
4. **Related guides** at the end for sensible next steps and adjacent tasks.

New articles require:

- a sidebar entry;
- at least one contextual inbound link from an existing article;
- links to canonical prerequisite or concept pages;
- three to five genuinely useful related guides when that many exist.

Do not force weak links to satisfy a count. A narrow quick answer may need fewer related guides.

## Internal link syntax

Use root-relative article URLs without the `/help` deployment prefix:

```md
[Invite students to a course](/manage-students/invite-students)
```

Blume adds `/help` when building the site. Images follow the separate rules above.

Link to a section when the destination page is broad and the specific answer has a durable heading:

```md
[Review the enrollment settings](/manage-students/enrollment-access-control#organization-access)
```

Pin the destination heading with `[#organization-access]` if the fragment is likely to be shared outside the help center or the heading wording may change.

## Link language

- Make the linked words name the destination or action: “review [course enrollment settings](/…)”.
- Never use “click here,” “read more,” a raw URL, or an entire paragraph as link text.
- Link the first useful mention, not every repeated mention.
- Add a short explanation after links in `## Related guides` so readers know why to open them.
- Keep the reader on the current page for essential steps; do not send them through a chain of prerequisite articles unless the tasks are genuinely separate.
- Link to the canonical explanation instead of copying it.

External links:

- Prefer first-party, authoritative sources such as an identity provider's setup documentation.
- Explain why the external destination is needed.
- Do not use a search-result URL, affiliate link, or unofficial tutorial when an authoritative source exists.
- Recheck external links during substantive review because their paths and instructions can change.

## Related guides

End substantive task, troubleshooting, concept, and reference pages with `## Related guides` unless the page is itself a section index whose cards already provide the complete routing.

Order links by the reader's journey:

1. required prerequisite;
2. likely next task;
3. adjacent configuration;
4. opposite-role view when useful;
5. broader reference.

Example:

```md
## Related guides

- [Invite Students](/manage-students/invite-students) — send individual or reusable course invitations
- [Control Enrollment Access](/manage-students/enrollment-access-control) — decide who can join without an invitation
- [Join a Course](/student-onboarding/join-a-course) — see the enrollment flow from a student's perspective
```

## Link and media QA

Before completion:

- run `pnpm --filter @cio/help validate`;
- build the help site so relative media is processed;
- open the rendered page and test image zoom, video loading, and narrow-screen readability;
- click every changed internal link and anchored fragment;
- confirm each new article has an inbound link and sidebar entry;
- search for the old path after a rename or split;
- inspect images for private data, stale labels, unreadable text, and excessive file size;
- verify that the article remains complete if images and embeds fail to load.
