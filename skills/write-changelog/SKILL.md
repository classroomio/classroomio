---
name: write-changelog
description: Write ClassroomIO's weekly customer changelog from the previous week's shipped work. Produce a concise customer email, a separate changelog-site article and a step-by-step demo walkthrough backed by seeded demo data, capture framed PNG screenshots, and draft the Resend broadcast. Use every Monday when preparing the previous week's release update.
---

# Write weekly changelogs

Turn the previous week's verified, customer-facing releases into three separate pieces:

1. A short email customers can scan quickly.
2. A fuller article for the ClassroomIO changelog site.
3. A demo walkthrough the team follows to record the weekly video.

The article should explain what changed and why it matters. It should not read like an internal engineering report.

## 1. Set the scope

The normal publishing day is Monday. Cover the previous Monday through Sunday, inclusive, plus anything merged on the publishing day itself. Run `git fetch origin main` and list merged PRs up to the moment you write, so nothing merged that morning is missed. Leave out anything the previous changelog in `company/changelogs/` already covered, and say so in the notes.

Ask for the dates if the range is unclear. Represent dates as `YYYY-MM-DD` while researching. Do not pass unvalidated dates into shell or GitHub commands. A valid date matches exactly `^\d{4}-\d{2}-\d{2}$`.

Include only work that shipped during the period. Keep these separate:

- **Shipped:** available to customers in production.
- **In progress:** do not include in the changelog.
- **Internal:** CI, tooling, refactors, process changes, or staging-only work. Omit unless it directly changed the customer experience.

## 2. Research before writing

Gather the week's merged work and verify every customer-facing claim against the product, pull request, demo, issue, or other reliable source.

For each candidate item, record:

- What was missing, broken, or difficult before.
- What changed.
- Who benefits and what they can do now.
- Any important limitation, rollout detail, or action the customer needs to take.
- A short, descriptive feature name.

Do not infer details from a title alone. If a detail cannot be verified, leave it out or mark it for human review. Never invent metrics, dates, customer quotes, availability, or behavior.

Once you have the full list of shipped, customer-facing items, stop and ask the person which ones are the highlights. Show every candidate as a short, plain name with one line on what it does, and let them pick one or more (for example, with a multi-select question). Do not draft until they answer: they know which work matters most to customers. Lead with the highlights they picked everywhere: title, subject, intro and first sections. Re-check the pick whenever new PRs are added to the scope.

Name each headline feature so a customer understands it at a glance ("Webhooks", "Flexible course outline"), and use the same name in the title, the email and the article heading. Do not name a section after the mechanic ("Drag to reorder course content") when the customer benefit is broader.

Group features that serve the same customer goal into one highlight, named after that goal in a few words (for example, the language setting and the student email editor both serve "Academy language", so they share one section with the email editor as a `###` subsection).

Keep the highlights to the features customers will notice. Smaller improvements, such as a clearer error message or extra filters and sorting on a list, go in `## Fixes and improvements` as a single bullet each, not as their own sections or email bullets. A convenience change to an existing flow, such as a new dialog or a Copy button, is also a fixes bullet, even when it has its own PR.

Judge importance by customer impact, not by PR size or tool count. Developer-facing work (public API endpoints, MCP tools) gets at most a short article section and one plain line in the email. Never make it the email's only item after the headline features.

Order the article roughly by customer impact:

1. Important fixes involving lost work, access, security, or broken workflows.
2. New capabilities.
3. Meaningful usability improvements.
4. Small fixes and polish.

Use ClassroomIO terminology consistently:

- Say **organization**, not workspace or org.
- Say **academy**, not org site.
- Say **student**, not learner.
- Say **course**, **cohort**, **tutor**, and **admin** when those are the accurate product terms.
- Say **Assistant** for the teacher and admin AI. Say **AI tutor** only for the student-facing AI.

## 3. Write the voice

Write like a product team explaining useful changes to customers:

- Be direct, warm, and conversational.
- Use short paragraphs and varied sentence length.
- Lead with the user's problem or the capability they now have.
- Prefer concrete explanations over promotional claims.
- Use active voice and present tense for the current product behavior.
- Explain technical work only when it affects the customer.
- Keep headings in sentence case, except the required `ClassroomIO Changelog #NNNN` suffix on the article title.
- Avoid filler openings such as "It's weekly update time," "Let's dive in," or "We're excited to announce."
- Avoid vague claims such as "a better experience" unless the copy explains what is better.
- Do not use emojis, em dashes, or en dashes.
- Do not use a forced rule of three or a generic upbeat conclusion.

The email can use first-person plural for the team ("we fixed", "we added"). The article should primarily use direct, customer-focused language ("you can now").

## 4. Produce the customer email

The email is sent as a Resend broadcast and follows the layout of the previous broadcasts. Summarize the most useful changes and send readers to the full article rather than repeating every detail.

Use this template:

```markdown
Subject: [Same as the article title, without the changelog number]

Hi {{{contact.fullname|there}}},

Here are the updates we shipped last week.

[One line introducing the headline features.]

**[Headline feature name]**

[One sentence on what customers can do now.] A few things you can set up:

- [A concrete use case, in the customer's words.]
- [Another use case.]
- [Another use case.]

[IMAGE: headline-feature.png | what it shows]

[One short paragraph on where to find it and any plan requirement.]

**[Second headline feature name, if there is one]**

[Same shape: what is easier now, then concrete things the customer can do.]

[IMAGE: second-feature.png | what it shows]

**Also this week**

- [A smaller change, in one plain sentence about what the customer can now do.]
- [Another smaller change.]

**[Optional heads up]:** [A change that needs customer action, such as an API change.]

## Video walkthrough

We made a video showing you all these features at a glance. Grab a cup of your favourite beverage and get ready to enjoy. [Watch the walkthrough](VIDEO_URL)

[Read the changelog](CHANGELOG_URL)
```

Rules for the email:

- Sell each headline feature through use cases, not mechanics. For an integration, list concrete things customers can automate with it, each backed by a real event or capability ("Add a student to your CRM as soon as they enroll"), not how it works (signatures, retries). For an editing feature, show how much easier editing is now and name the actions (drag to reorder, edit or delete from the sidebar).
- `Also this week` is a short list of plain sentences, each saying what the customer can now do. Never a run-on summary or a bolded label with a clause list. Leave out anything the reader would have to decode.
- Only the headline features carry images in the email.
- Keep `{{{contact.fullname|there}}}` exactly as written. Resend fills it in.
- If there is no meaningful release, say so plainly rather than padding the email.

## 5. Produce the changelog-site article

The article follows the useful pattern of a short introduction, a walkthrough near the top, detailed feature sections, and a closing fixes list. Keep the media placeholders exactly where a human should add assets.

Use this template:

Number each article. The title always ends with ` - ClassroomIO Changelog #NNNN`, where `NNNN` is a four-digit issue number. Look at the latest file in `company/changelogs/` for the highest existing number and increment it by one. Never reuse a number.

After the highlights are picked, give the person four title proposals and let them pick one or write their own. Do not draft the email or article under a title they have not chosen. Title the article after the headline features, plainly: "Introducing Webhooks and a flexible course outline". Use the customer-facing names from the feature sections. Do not use an action list that ends in "and more" ("Send events to your apps with webhooks, reorder course content by dragging and more"), marketing slogans, or long benefit sentences. The email subject uses the same wording as the title, without the changelog number.

```markdown
# [Biggest feature as a short action], [rest grouped by area] and more - ClassroomIO Changelog #NNNN

[One short paragraph summarizing the week's most useful changes in customer terms.]

[VIDEO: Weekly walkthrough]

## [Feature or fix name]

[IMAGE: Screenshot or product image for this feature]

[Explain what was difficult or broken before, what changed, and what the customer can do now. Use one to three short paragraphs.]

[Optional: explain a limitation, rollout detail, or next step when verified.]

## [Feature or fix name]

[IMAGE: Screenshot or product image for this feature]

[Explain the customer benefit and the new behavior.]

## Fixes and improvements

- **[Short fix name].** [Concrete fix and its customer impact.] ([#1234](https://github.com/classroomio/classroomio/pull/1234))
- **[Short improvement name].** [Concrete improvement and its customer impact.] ([#1235](https://github.com/classroomio/classroomio/pull/1235), [#1236](https://github.com/classroomio/classroomio/pull/1236))

## [Optional next step]

[Use only when there is a real action customers should take, such as updating a setting or trying a new workflow.]
```

Article rules:

- Put the video placeholder immediately after the opening paragraph.
- Include one `[IMAGE: ...]` placeholder in every feature section. Make its description specific enough for someone to choose the asset.
- Do not add an image placeholder to the fixes list.
- Give each substantial feature its own heading. Combine small related fixes only when the relationship is real.
- Describe the before-state, the change, and the after-state. The reader should understand why the update matters without seeing the implementation.
- Omit empty sections, including `## Fixes and improvements` when there are no relevant fixes.
- End every `## Fixes and improvements` bullet with links to its PRs, as in the template. Keep PR numbers out of the feature sections and the email, and keep author handles and engineering-only details out of the article.
- Use links only when they help the customer take action or learn more.

## 6. Prepare the media

Write every image placeholder as `[IMAGE: file-name.png | what the screenshot shows]`, so the person publishing knows both the file and the shot.

- **Format:** PNG or JPG only, never webp. Convert a webp source with `sips -s format png in.webp --out out.png`.
- **Location:** save the files in `company/changelogs/assets/<range>/`, for example `assets/28-sept-05-oct/`. Folder and file names are lowercase words separated by hyphens.
- **Framing:** capture at 1350×830, device scale 1, and use the ClassroomIO browser board with the framing settings in [`../add-docs-image/SKILL.md`](../add-docs-image/SKILL.md). For changelog assets, pass a `.png` output path to the framing script.
- **Reuse:** if the Help Center already has a screenshot of the feature (under `apps/help/content/help/**/images/`), copy it and convert it to PNG instead of capturing a new one.
- **Demo data:** when a feature needs content to look real, add an idempotent seed script under `packages/db/src/scripts/` with a fictional product and fictional names. Re-run it before capturing so earlier test edits are reset.
- **Student view locally:** open `http://localhost:5173/?org=<siteName>` once before the student page, or every login opens the admin editor. Sign in through the API on port 3002, as the add-docs-image skill describes. Start the API with `pnpm api:dev` if it is not running, and stop it when you finish.
- **Check each shot** before framing: no tooltips covering text, no stray test content, images loaded.

The person publishing uploads the files flat to `https://assets.cdn.clsrio.com/changelog/{filename}`, with no date folder. When they confirm, replace each placeholder with `![what it shows](https://assets.cdn.clsrio.com/changelog/{filename})` and check every URL returns 200.

The walkthrough video is a YouTube link they supply. Replace `[VIDEO: Weekly walkthrough]` with the bare link.

## 7. Write the demo walkthrough

The walkthrough video is recorded from local, so the changelog file also carries the steps to demo every item. Add it as `## Demo walkthrough`, the last section of the file. Someone who has not read the PRs should be able to record the whole video from it without guessing a login, a URL or a click.

Prepare the data first, then write the steps against it:

- **Seed what a demo needs.** If a feature needs data the local database does not have (submissions, a second teammate, a live class with past sessions), extend or add the idempotent seed script from section 6. Give it a `db:seed:*` script in `packages/db/package.json`. It also resets anything a demo changes, such as a role switched during the recording or a student's live upload, so every take starts from the same state.
- **Give every role a login.** Each demo that switches people (student vs admin, a tutor without access) needs a seeded account with a known password. Copy the password hash from an existing seed account instead of hashing one yourself.
- **Make files real.** If a demo shows a file (View, Download, a preview), the object must exist in storage. Local storage may be the shared Cloudflare R2 account, so ask before uploading, keep demo objects under the organization's folder with a recognisable prefix, and store each file's real size on its row.
- **Ship the upload files.** When the demo has a student upload something, put sample files with fictional content in `company/changelogs/assets/<range>/demo-files/`.
- **Check dates.** Anything time-based (a live session, a due date, an expiring certificate) must still be in the right state on recording day. Move it if needed and say in the steps what state it is in.

Structure:

```markdown
## Demo walkthrough

[One line: where it runs (organization) and the shared password.]

### Before you start

1. [The reseed command, and what it resets.]
2. [Every login, with the person's name and role.]
3. [Paths to the upload files.]
4. [Practical setup, such as separate browser profiles per role.]

### 1. [Article section name] ([who is signed in])

[Course or page name, with its full local URL, and the state of its data.]

1. [Open X. Click **Exact label**. Point out **Exact label**.]
2. [Optional: a step that changes data, and how to undo it.]

### N. Fixes and improvements (quick cuts)

1. **[Fix name]:** [Where to go and the one action that shows the fix.]
```

Rules:

- Follow the article's order, one `###` per section, plus a final quick-cuts section for the fixes list.
- Name the signed-in person in the heading or the step whenever it changes. Show a permission change from both sides: the blocked view first, then the action that grants access, then the same view working.
- Quote UI labels exactly as they appear in `apps/dashboard/src/lib/utils/translations/en.json`, in bold. Give full `http://localhost:5173/...` URLs for every page that is not one click away.
- Say what data is already there ("8 students, 15 submissions, 6 graded") and what is local-only or missing (an empty delivery log, a course no seed creates).
- Mark steps that change data as optional and say how to undo them. A step that changes a setting the rest of the demo depends on ends with switching it back.
- Include a curl or MCP prompt for API and MCP features, with the local base URL and a real id from the seed.
- Walk through the steps in the running app before handing them over. Fix any label or path that differs, and list steps you could not run under `Publishing notes`.

## 8. Publish

Save the drafts as `company/changelogs/<range>.md` with `## Customer email`, `## Changelog article`, `## Publishing notes` and `## Demo walkthrough` sections.

- **Article:** the person publishing posts it in UserJot themselves. Its public URL looks like `https://feedback.classroomio.com/updates/p/<slug>`. Ask for it before finishing the email.
- **Walkthrough video:** publish the video to the public "Changelogs" YouTube playlist on the same day as the UserJot entry. The website reads that playlist's RSS feed and pairs each video with the entry published within 24 hours, so the dashboard "What's new" modal shows it with no code change. Only when a pairing is wrong, or the video lives outside the playlist, map the UserJot entry id (`id` from `GET https://api.userjot.com/v1/changelogs`) to the YouTube id in `CHANGELOG_VIDEO_OVERRIDES` in `apps/website/src/lib/data/changelog-videos.ts`.
- **Email:** draft it as a Resend broadcast in the browser, matching the previous broadcasts. Open one of them first to check the layout.
  - Reuse an existing `Untitled` draft instead of creating a second one.
  - Name: the article title without the changelog number. From: `ClassroomIO Updates <hello@updates.classroomio.com>`. To: All Contacts. Topic: Changelogs. Subject: the title without the number.
  - Paste the body as HTML into the editor, with the CDN image URLs, then add the unsubscribe footer: "You are receiving this email because you opted in via our site. Want to change how you receive these emails? You can unsubscribe from this list." linked to `{{{RESEND_UNSUBSCRIBE_URL}}}`, then "ClassroomIO".
  - Resend only renders and accepts clicks in a tab that is in front. If the editor stays on "Loading..." or a selector will not save, ask the person to bring the tab forward, or leave that field for them.
  - Never send or schedule the broadcast. Hand back the draft link and list anything left to set.

## 9. Final review

Before returning the two deliverables, check:

- [ ] The date range is the previous Monday through the publishing day, checked against the latest `origin/main`, and is stated clearly.
- [ ] Every listed item shipped during that range.
- [ ] No in-progress or internal-only work is presented as shipped.
- [ ] Every claim is supported by the available source material.
- [ ] The email and article are separate outputs, not one document with duplicated sections.
- [ ] The email is scannable and includes the changelog link.
- [ ] The biggest feature leads, related features are grouped under one customer goal, and small improvements sit in Fixes and improvements.
- [ ] The article has a video placeholder or YouTube link near the top.
- [ ] Every article feature has a framed PNG or JPG with a lowercase, hyphenated name in `company/changelogs/assets/<range>/`.
- [ ] Empty sections and filler have been removed.
- [ ] The terms organization, academy, and student are used consistently.
- [ ] The copy sounds natural when read aloud and contains no em or en dashes.
- [ ] The person picked the highlights from the shipped list and chose the title from four proposals (or wrote their own), and the sections use the same feature names as the title.
- [ ] The email sells each headline feature through concrete use cases, and `Also this week` is plain one-line items, with developer-facing work kept to one line.
- [ ] Every fixes bullet ends with its PR links, and convenience changes such as a new dialog sit there, not in their own section.
- [ ] The article title ends with ` - ClassroomIO Changelog #NNNN`, using the next unused number.
- [ ] Any missing video, image, link, or verification detail is clearly marked for the person publishing it.
- [ ] The demo walkthrough covers every article section and the fixes, in article order, with a login, URL and exact labels for each step.
- [ ] Every demo has data behind it: the seed runs twice cleanly, files open, and time-based content is in the right state on recording day.

Return the email first, then the article, then the demo walkthrough. If a required input is missing, list it briefly after the drafts under `Publishing notes`.
