---
name: write-changelog
description: Write ClassroomIO's weekly customer changelog from the previous week's shipped work. Produce a concise customer email and a separate changelog-site article with a walkthrough video slot and image placeholders. Use every Monday when preparing the previous week's release update.
---

# Write weekly changelogs

Turn the previous week's verified, customer-facing releases into two separate pieces:

1. A short email customers can scan quickly.
2. A fuller article for the ClassroomIO changelog site.

The article should explain what changed and why it matters. It should not read like an internal engineering report.

## 1. Set the scope

The normal publishing day is Monday. Cover the previous Monday through Sunday, inclusive.

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

## 3. Write the voice

Write like a product team explaining useful changes to customers:

- Be direct, warm, and conversational.
- Use short paragraphs and varied sentence length.
- Lead with the user's problem or the capability they now have.
- Prefer concrete explanations over promotional claims.
- Use active voice and present tense for the current product behavior.
- Explain technical work only when it affects the customer.
- Keep headings in sentence case.
- Avoid filler openings such as "It's weekly update time," "Let's dive in," or "We're excited to announce."
- Avoid vague claims such as "a better experience" unless the copy explains what is better.
- Do not use emojis, em dashes, or en dashes.
- Do not use a forced rule of three or a generic upbeat conclusion.

The email can use first-person plural for the team ("we fixed", "we added"). The article should primarily use direct, customer-focused language ("you can now").

## 4. Produce the customer email

Keep the email brief. Summarize the most useful changes and send readers to the full article rather than repeating every detail.

Use this template:

```markdown
Subject: [Plain-language summary of the week's biggest customer benefit]

Hi [customer name or team],

Here are the updates we shipped last week.

[One or two sentences naming the biggest change or theme and why it matters.]

This week:

- **[Feature or fix]:** [What you can do now and the problem it solves.]
- **[Feature or fix]:** [What you can do now and the problem it solves.]
- **[Feature or fix]:** [What you can do now and the problem it solves.]

Read the full changelog: [CHANGELOG_URL]

[Optional, specific closing sentence only if there is a useful action or detail.]
```

Rules for the email:

- Include only the strongest customer-facing items. Usually use three to five bullets.
- Mention the video only if the link is available and useful: `Watch the walkthrough: [VIDEO_URL]`.
- Do not include image placeholders in the email unless the email template explicitly supports them.
- If there is no meaningful release, say so plainly rather than padding the email.

## 5. Produce the changelog-site article

The article follows the useful pattern of a short introduction, a walkthrough near the top, detailed feature sections, and a closing fixes list. Keep the media placeholders exactly where a human should add assets.

Use this template:

```markdown
# [Specific title for the week's biggest change] and more

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

## 6. Final review

Before returning the two deliverables, check:

- [ ] The date range is the previous Monday through Sunday and is stated clearly.
- [ ] Every listed item shipped during that range.
- [ ] No in-progress or internal-only work is presented as shipped.
- [ ] Every claim is supported by the available source material.
- [ ] The email and article are separate outputs, not one document with duplicated sections.
- [ ] The email is scannable and includes the changelog link.
- [ ] The article has a video placeholder near the top.
- [ ] Every article feature has a specific image placeholder.
- [ ] Empty sections and filler have been removed.
- [ ] The terms organization, academy, and student are used consistently.
- [ ] The copy sounds natural when read aloud and contains no em or en dashes.
- [ ] The article title and email subject describe the actual week's work.
- [ ] Any missing video, image, link, or verification detail is clearly marked for the person publishing it.

Return the email first, then the article. If a required input is missing, list it briefly after the drafts under `Publishing notes`.
