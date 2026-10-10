---
name: write-changelog
description: Write ClassroomIO's weekly customer changelog from the previous week's shipped work. Produce a concise customer email and a separate changelog-site article, capture framed PNG screenshots, and draft the Resend broadcast. Use every Monday when preparing the previous week's release update.
---

# Write weekly changelogs

Turn the previous week's verified, customer-facing releases into two separate pieces:

1. A short email customers can scan quickly.
2. A fuller article for the ClassroomIO changelog site.

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

Pick the week's biggest feature deliberately and lead with it everywhere: title, subject, intro and first section. Re-check this whenever new PRs are added to the scope.

Group features that serve the same customer goal into one highlight, named after that goal in a few words (for example, the language setting and the student email editor both serve "Academy language", so they share one section with the email editor as a `###` subsection).

Keep the highlights to the features customers will notice. Smaller improvements, such as a clearer error message or extra filters and sorting on a list, go in `## Fixes and improvements` as a single bullet each, not as their own sections or email bullets.

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

The big one is [biggest feature]. [One or two sentences on what customers can do now.]

[IMAGE: biggest-feature.png | what it shows]

[One short paragraph on how to use it.]

This week:

**[Feature]:** [What you can do now and the problem it solves.]
[IMAGE: feature.png | what it shows]

**[Feature]:** [What you can do now and the problem it solves.]
[IMAGE: feature.png | what it shows]

**[Optional heads up]:** [A change that needs customer action, such as an API change.]

## Video walkthrough

We made a video showing you all these features at a glance. Grab a cup of your favourite beverage and get ready to enjoy. [Watch the walkthrough](VIDEO_URL)

[Read the changelog](CHANGELOG_URL)
```

Rules for the email:

- Include only the strongest customer-facing items. Usually use three to five items.
- Each item can carry the same image as its article section.
- Keep `{{{contact.fullname|there}}}` exactly as written. Resend fills it in.
- If there is no meaningful release, say so plainly rather than padding the email.

## 5. Produce the changelog-site article

The article follows the useful pattern of a short introduction, a walkthrough near the top, detailed feature sections, and a closing fixes list. Keep the media placeholders exactly where a human should add assets.

Use this template:

Number each article. The title always ends with ` - ClassroomIO Changelog #NNNN`, where `NNNN` is a four-digit issue number. Look at the latest file in `company/changelogs/` for the highest existing number and increment it by one. Never reuse a number.

Start the title with the week's biggest feature as a short, plain action ("Set your academy language"). Group the rest by area in casual words instead of listing every feature, then end with "and more". Example: "Set your academy language, bunch of exercise improvements and more". Write it the way you would say it to a customer. Do not write marketing slogans ("Your academy now speaks your students' language"), long benefit sentences, or a flat list of feature names. The email subject uses the same wording as the title, without the changelog number.

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

- [Concrete fix and its customer impact.]
- [Concrete improvement and its customer impact.]

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
- Keep internal PR numbers, author handles, and engineering-only details out of the article.
- Use links only when they help the customer take action or learn more.

## 6. Prepare the media

Write every image placeholder as `[IMAGE: file-name.png | what the screenshot shows]`, so the person publishing knows both the file and the shot.

- **Format:** PNG or JPG only, never webp. Convert a webp source with `sips -s format png in.webp --out out.png`.
- **Location:** save the files in `company/changelogs/assets/<range>/`, for example `assets/28-sept-05-oct/`. Folder and file names are lowercase words separated by hyphens.
- **Framing:** capture at 1350×830, device scale 1, and frame it in the ClassroomIO browser board, exactly as [`../add-docs-image/SKILL.md`](../add-docs-image/SKILL.md) describes. Write the framed output straight to `.png`.
- **Reuse:** if the Help Center already has a screenshot of the feature (under `apps/help/content/help/**/images/`), copy it and convert it to PNG instead of capturing a new one.
- **Demo data:** when a feature needs content to look real, add an idempotent seed script under `packages/db/src/scripts/` with a fictional product and fictional names. Re-run it before capturing so earlier test edits are reset.
- **Student view locally:** open `http://localhost:5173/?org=<siteName>` once before the student page, or every login opens the admin editor. Sign in through the API on port 3002, as the add-docs-image skill describes. Start the API with `pnpm api:dev` if it is not running, and stop it when you finish.
- **Check each shot** before framing: no tooltips covering text, no stray test content, images loaded.

The person publishing uploads the files flat to `https://assets.cdn.clsrio.com/changelog/{filename}`, with no date folder. When they confirm, replace each placeholder with `![what it shows](https://assets.cdn.clsrio.com/changelog/{filename})` and check every URL returns 200.

The walkthrough video is a YouTube link they supply. Replace `[VIDEO: Weekly walkthrough]` with the bare link.

## 7. Publish

Save the drafts as `company/changelogs/<range>.md` with `## Customer email`, `## Changelog article` and `## Publishing notes` sections.

- **Article:** the person publishing posts it in UserJot themselves. Its public URL looks like `https://feedback.classroomio.com/updates/p/<slug>`. Ask for it before finishing the email.
- **Walkthrough video:** UserJot's API does not return an entry's embedded video, so the dashboard "What's new" modal reads it from `apps/website/src/lib/data/changelog-videos.ts`. When the entry has a walkthrough, add one line there mapping the UserJot entry id (`id` from `GET https://api.userjot.com/v1/changelogs`) to the YouTube id, and include that file in the change.
- **Email:** draft it as a Resend broadcast in the browser, matching the previous broadcasts. Open one of them first to check the layout.
  - Reuse an existing `Untitled` draft instead of creating a second one.
  - Name: the article title without the changelog number. From: `ClassroomIO Updates <hello@updates.classroomio.com>`. To: All Contacts. Topic: Changelogs. Subject: the title without the number.
  - Paste the body as HTML into the editor, with the CDN image URLs, then add the unsubscribe footer: "You are receiving this email because you opted in via our site. Want to change how you receive these emails? You can unsubscribe from this list." linked to `{{{RESEND_UNSUBSCRIBE_URL}}}`, then "ClassroomIO".
  - Resend only renders and accepts clicks in a tab that is in front. If the editor stays on "Loading..." or a selector will not save, ask the person to bring the tab forward, or leave that field for them.
  - Never send or schedule the broadcast. Hand back the draft link and list anything left to set.

## 8. Final review

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
- [ ] The article title and email subject start with the week's biggest feature, as a short plain action, with the rest grouped by area.
- [ ] The article title ends with ` - ClassroomIO Changelog #NNNN`, using the next unused number.
- [ ] Any missing video, image, link, or verification detail is clearly marked for the person publishing it.

Return the email first, then the article. If a required input is missing, list it briefly after the drafts under `Publishing notes`.
