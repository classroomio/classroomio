---
name: diff-marketing
description: Generate customer-focused marketing content from recent git changes, commits, merged pull requests, and shipped features. Use when the user invokes /diff-marketing or /marketing, or asks for blog posts, tweets, changelogs, or emails about what shipped.
---

# Diff marketing

Generate content suggestions from recent code changes, commits, merged pull requests, and shipped features.

## Process

1. Analyze recent changes:
   - Look at the git log for the past week:
     `git log --since="1 week ago" --pretty=format:"%h - %s (%an, %ar)"`
   - Check merged pull requests and their descriptions.
   - Review modified files and their purpose.
   - Identify new features, bug fixes, improvements, and refactors.

2. Categorize changes by impact:
   - High impact: new features, major improvements, breaking changes.
   - Medium impact: enhancements, notable bug fixes, performance improvements.
   - Low impact: minor fixes, refactors, dependency updates.

3. Read relevant files to understand the user-facing change before writing.

4. Generate specific content suggestions with drafts, prioritizing user value,
   SEO opportunities, and useful distribution channels.

## Content suggestions by type

### Blog posts

For high-impact changes:

- Focus on features that solve user problems.
- Include the problem, solution, benefits, screenshots or demos, and code examples when useful.
- Use an educational, in-depth, SEO-optimized angle.
- Aim for 800–2,000 words.
- Possible angles:
  - "Introducing [Feature]: How We Built..."
  - "How [Feature] Helps You..."
  - "Behind the Scenes: Building [Feature]"

### Tweets and social media

Use all impact levels for:

- Launch posts that explain the benefit and include a visual.
- Threads that break down complex features.
- Tip posts with a quick, useful takeaway.
- Behind-the-scenes posts about decisions and tradeoffs.

Keep the tone conversational, concise, and specific. Include emojis,
hashtags, mentions, links, and visuals when they add value. Treat a meaningful
release as a launch opportunity and suggest a way to gather early feedback.

### Changelog updates

- Structure entries as `## [Version] - [Date]`.
- Use Added, Changed, Fixed, Deprecated, Removed, and Security categories as applicable.
- Write in user-facing language.
- Link to documentation or blog posts for major features.
- Keep the writing technical but accessible.

### Email updates

For medium- and high-impact changes, suggest newsletters, feature
announcements, or onboarding updates.

- Include a hero image, brief introduction, feature highlights, and CTA when appropriate.
- Use a personal, benefit-focused, actionable tone.

### Press releases

Suggest these only for major launches, milestones, partnerships, or funding.
Include a headline, summary, quotes, boilerplate, and contact details. Use a
professional, newsworthy, quotable tone.

### Documentation

Suggest updates to:

- Getting-started guides.
- Feature documentation.
- API references.
- Code examples and use cases.
- Troubleshooting sections.

### Video content

For high-impact changes, suggest demos, tutorial walkthroughs, release
overviews, or development diaries.

## Content strategy

1. Repurpose a blog post into a thread, newsletter, and documentation update.
2. Coordinate content with the release.
3. Lead with user benefits.
4. Show the product with screenshots, GIFs, or videos.
5. Include keywords, meta descriptions, and alt text where relevant.
6. Give every piece a clear next step.
7. Cross-link related content.
8. Suggest how to collect feedback and measure response.

## Output format

Use this structure:

```markdown
## Week of [Date Range]

### Summary

[High-level overview of what shipped]

### High impact changes

- [Change 1]: [Description]
- [Change 2]: [Description]

### Medium impact changes

- [Change]: [Description]

### Low impact changes

- [Change]: [Description]

### Content suggestions

#### Blog posts

1. **"[Title]"**: [Brief description, key points, and target audience]
2. **"[Title]"**: [Brief description, key points, and target audience]

#### Tweets and threads

1. Launch post: [Draft text with emojis when appropriate]
2. Thread idea: [Topic and key points]
3. Tip: [Quick value post]

#### Changelog entry

## [Version] - [Date]

### Added

- [Feature]: [User-facing description]

### Fixed

- [Bug]: [What was fixed]

#### Email subject lines

- "[Compelling subject line option 1]"
- "[Compelling subject line option 2]"

#### Video ideas

- "[Video concept and key points to cover]"

#### Documentation updates needed

- [ ] Update [doc page] with [new information]
- [ ] Add [new guide] for [feature]
```

## Writing standards

- Use customer-centric messaging.
- Say what shipped and what it does. Do not invent metrics, customer results, or product behavior.
- Use diff output and relevant source files to ground every claim.
- Prefer plain language over hype.
- Avoid generic launch copy, unsupported superlatives, and vague claims.
- Use sentence-case headings and varied, natural prose.
- Keep emojis functional and sparse.
- End with the most useful next action for the reader.
