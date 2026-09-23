# ClassroomIO help-center editorial standard

This standard translates the strongest recurring patterns from the Teachable and Thinkific audits into rules for ClassroomIO. It favors Teachable's task depth and visual guidance, Thinkific's concise question/solution articles, and the shared practice of organizing documentation around outcomes rather than copying application navigation.

## Voice and language

Write like a calm product expert helping one person complete a task.

- Address the reader as “you.”
- Use active voice and present tense: “ClassroomIO sends the invitation,” not “The invitation will be sent.”
- Start instructions with direct verbs: **Open**, **Select**, **Enter**, **Turn on**, **Review**, **Save**.
- Prefer “select” for device-neutral controls. Use “click” only when pointer behavior matters.
- Keep sentences short, but combine fragments that would make the page choppy.
- Use contractions when natural: “can't,” “you'll,” “doesn't.”
- Use plain language before specialist terms, then keep terminology consistent.
- Explain why only when it changes a decision, prevents a mistake, or clarifies an unexpected result.
- Be factual and neutral. Help content is not marketing copy.

Avoid:

- “In this article, we will…,” “This guide walks you through…,” and other meta introductions;
- “simply,” “just,” “obviously,” “easy,” and language that blames the reader;
- vague promises such as “seamlessly,” “powerful,” or “best-in-class”;
- future tense for current behavior;
- exclamation marks except when reproducing exact UI copy;
- “etc.” when the omitted items affect a decision;
- implementation jargon that the UI does not expose;
- gendered pronouns for a generic person.

## Audience and point of view

Choose one primary audience per article.

- Administrator/tutor guide: “you” means the person managing an organization or course.
- Student guide: “you” means the person taking the course.
- Reference page: name both roles when comparing their views, but keep each paragraph explicit.

If the role matters to access, say so before the instruction: “Organization administrators can…” Do not imply that every user sees every control.

## Product terminology

Use the exact visible UI label, capitalization, and singular/plural form from `en.json`.

- Bold interactive labels and named UI areas: **Settings**, **Save changes**, **Allow students to enroll**.
- Express a navigation path as **Settings → Domains**.
- Use inline code for typed values, URL paths, file formats, slugs, and literal identifiers: `.csv`, `/course/intro`, `<siteName>`.
- Put exact errors or notifications in quotation marks when the wording matters.
- Do not bold ordinary concepts merely for emphasis.

Preferred ClassroomIO terms:

- organization, not workspace, when describing the academy-owning admin entity or multiple organizations under one account;
- academy for the public organization site;
- LMS for the signed-in student learning area;
- student, not learner, unless “learner” is an exact label being quoted;
- academy landing page, not org landing page;
- course landing page for the public page of one course.

The Settings sidebar currently groups **Profile** and **Notifications** under Personal; **Branding**, **Domains**, **Teams**, **Customize LMS**, and **Billing** under Workspace; and AI and authentication items under Extensions. Verify this before writing because navigation can change.

Use **Workspace** only when reproducing that exact ClassroomIO interface label. Do not use it as the general name for an organization, a plan allowance, or an account relationship. Preserve third-party product names such as **Google Workspace**.

## Titles and descriptions

Titles should match what a reader searches for and what the article delivers.

Use:

- verb + object for tasks: “Invite Students to a Course”;
- question form for problems: “Why Can't Students Enroll?”;
- “Understand…” or a concise noun phrase for reference: “Understand Course Types”;
- reader-visible vocabulary rather than internal feature names.

Keep titles distinct within the help center. Avoid titles such as “Settings,” “Overview,” “Configuration,” or “Using the Feature” without a specific object.

Descriptions:

- are one sentence;
- normally stay below about 160 characters without sacrificing clarity;
- state the outcome, answer, or meaningful scope;
- use different wording from the title;
- do not begin with “Learn how to” when a direct verb is clearer.

## Opening paragraph

The first paragraph must work as a search-result answer and support-agent excerpt.

- Answer the title in the first sentence.
- Identify the result and the most important boundary.
- Keep it to one or two short sentences.
- Do not place an image, video, manual table of contents, or generic overview before the answer.

For troubleshooting, list the most likely causes immediately. For a task, state what completing the task changes. For a reference page, state the decision the concept controls.

## Headings and page hierarchy

Frontmatter supplies the H1. Start body sections at `##`.

- Use `##` for major reader questions, stages, or outcomes.
- Use `###` for procedure steps or meaningful subsections.
- Use `####` sparingly for detail within one step; never skip heading levels.
- Write headings as useful signposts: “Verify the domain” instead of “Verification.”
- Number sequential `###` headings: `### 1. Open Domains`.
- Do not number non-sequential headings.
- Keep heading wording stable after publication because Blume generates linkable anchors from it.
- Pin a heavily shared or externally referenced heading with `[#durable-anchor]` before changing its wording.

Do not add a manual “In this article” list. Blume creates an in-page table of contents from headings.

## Procedures

Use numbered `###` action headings for a sequence with meaningful explanation or media.

Each step should contain:

1. the action;
2. the required value or choice;
3. the immediate response, when it confirms progress;
4. a condition or branch, if it applies at that point.

Use a simple ordered list when every step is one short sentence and none needs a screenshot, callout, or deep link.

Rules:

- Begin from a recognizable location.
- Use the shortest stable navigation path, then describe orientation only if the page has similarly named controls.
- Group related fields into one step instead of making every form field a step.
- Put optional values after required ones and mark them “optional.”
- State defaults when they affect what the reader should choose.
- Explain whether changes save automatically or require **Save changes**.
- State delays and asynchronous states without promising an unverified duration.
- End with a visible success signal.
- Do not hide a required step in an accordion, note, caption, or video.

## Conditions, permissions, and side effects

Move conditions before the action they govern.

Include only verified conditions such as:

- required role or ownership;
- paid plan or feature availability;
- course type, publish state, enrollment state, or prerequisite content;
- inherited organization or course settings;
- email or notification side effects;
- effects on existing students and records;
- reversibility, processing time, or data deletion.

Do not assume a plan name from a disabled control. Trace the actual entitlement logic.

For destructive actions, say exactly what is deleted, retained, or recoverable before the step. Use a `danger` callout only when the outcome is destructive or difficult to undo.

## Callouts

Callouts are exceptions to the reading flow, not containers for ordinary instructions.

- `note`: neutral supporting context.
- `info`: availability, scope, or a relationship that prevents confusion.
- `tip`: an optional shortcut or best practice.
- `success`: a positive state the reader can verify.
- `warning`: a surprising behavior, prerequisite, or risk that needs care.
- `danger`: destructive or effectively irreversible consequences.

Give a callout a specific title when readers may scan past the body: `:::warning[Changing the course type affects existing students]`.

Place the callout immediately before the relevant action. Avoid consecutive callouts, generic “Important” titles, and more than one callout for the same fact.

## Lists, tables, tabs, and accordions

- Use bullets for unordered options, requirements, or outcomes.
- Use ordered lists only when order matters.
- Use tables for stable comparisons or references with repeated fields.
- Do not put long procedural prose or large screenshots in tables; tables collapse poorly on narrow screens.
- Use `<Tabs>` only for equivalent variants, such as two identity providers or platform-specific instructions. The reader should need only one tab.
- Use `<Accordion>` for optional FAQs, long examples, or uncommon detail. Required information stays visible.
- Use cards on section/index pages to route readers, not as decoration within a normal task article.

## Troubleshooting and errors

Write troubleshooting as a sequence of diagnostic checks, not a collection of guesses.

For each problem:

1. Name the symptom in the reader's words.
2. Give the most likely verified cause.
3. Tell the reader what to inspect.
4. Give the corrective action.
5. State the success signal.

Order causes by likelihood and cost: common settings before rare system failures, reversible checks before destructive resets.

When escalation is required, tell the reader what safe context to provide: organization URL, course name, approximate time, visible error text, and a non-sensitive screenshot. Never request passwords, one-time codes, API keys, full payment details, or private student data in a public channel.

## Findability and independent use

Write so the article still makes sense when opened from search, chat, or a support reply rather than from the sidebar.

- Name the product area in the opening navigation instruction.
- Define a necessary term on first use or link to its canonical reference.
- Do not rely on “the previous guide” or sidebar order.
- State prerequisites explicitly rather than assuming the reader completed another page.
- Keep the title, description, opening paragraph, and headings rich in the reader's natural vocabulary without repeating keywords unnaturally.

## Accessibility and inclusive content

- Do not identify controls by color, position, or icon alone. Pair the cue with its label: “Select **Add**, the plus icon beside Lessons.”
- Do not rely on a screenshot to communicate a value, warning, or sequence.
- Expand an acronym at first use unless it is a visible product term: “Single Sign-On (SSO).”
- Use descriptive links and alt text.
- Avoid directional language such as “on the right” unless the location is stable and paired with a label.
- Account for keyboard and touch users when the interaction differs materially.

## Maintenance

- Set `last_reviewed` only after verifying the current product behavior.
- Review articles when UI labels, navigation, entitlements, defaults, screenshots, emails, or side effects change.
- Prefer stable concepts and visible labels over brittle pixel descriptions.
- If a feature is unavailable or unfinished, omit it from published help content. Track the documentation need elsewhere.
- Remove obsolete instructions rather than appending a historical correction to the top of the article.
- Preserve stable URLs and pinned anchors when possible.
