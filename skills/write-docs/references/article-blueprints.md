# Article blueprints

Choose an article shape from the reader's intent, not from the product's menu structure. The product navigation belongs inside instructions; it is not the documentation taxonomy.

## Universal article anatomy

Every article needs these elements, though not always as explicit sections:

1. A search-shaped title that promises one answer or outcome.
2. A one- or two-sentence opening that directly answers the title and identifies the result.
3. Conditions or prerequisites only when they can block the task.
4. The answer, procedure, explanation, or decision support.
5. A way to recognize success or understand what happens next.
6. Troubleshooting only for likely failures specific to this task.
7. A short set of related guides that continue the reader's journey.

Do not add “Overview,” “Introduction,” or “In this article” when the opening paragraph already does that work.

## Task or how-to guide

Use when the reader wants to create, configure, invite, publish, grade, export, or otherwise finish an action.

Typical size: 300–900 words. Size is a diagnostic, not a quota. Split the page when it contains several independently useful tasks or the reader must repeatedly choose unrelated branches.

```mdx
---
title: Connect a Custom Domain
description: Connect and verify a custom domain for your ClassroomIO academy.
last_reviewed: 'YYYY-MM-DD'
---

Connect a custom domain so students use your branded web address instead of the default academy subdomain.

:::info[Available on …]
State a real plan, role, or setup requirement only when one exists.
:::

## Before you start

- Requirement that can actually block the task
- Information or access the reader must have ready

## Connect your domain

### 1. Open Domains

From the admin dashboard, go to **Settings → Domains**.

### 2. Add the domain

Describe the action and the immediate result.

![Screenshot placed after the instruction it confirms](./images/connect-a-custom-domain/add-domain.webp)

### 3. Verify the connection

Describe the action and the success state.

## What happens next

Explain propagation, notifications, student impact, or the visible success state when relevant.

## Troubleshooting

### The domain is still pending

Give the likely cause, the check, and the next action.

## Related guides

- [Guide title](/durable-slug) — explain why the reader would open it
```

Rules:

- Omit `## Before you start` when there are no real prerequisites.
- Use one numbered `###` heading per meaningful action, not per sentence or field.
- Put optional branches after the main successful path unless they must be chosen earlier.
- State the success signal in the final step or `## What happens next`.
- Put destructive warnings immediately before the destructive step.

## Quick answer or troubleshooting guide

Use for search-shaped questions such as “Why can't students enroll?” or “How do I resend an invite?” Thinkific's strong quick-reference pattern is useful here: question, direct solution, then supporting detail.

Typical size: 150–500 words. Do not inflate a simple answer into a feature guide.

```mdx
---
title: Why Can't Students Enroll in My Course?
description: Check the settings that can hide enrollment or block new students.
last_reviewed: 'YYYY-MM-DD'
---

Students cannot enroll when the course is unpublished, self-enrollment is off, organization signup is restricted, or a paid enrollment has not completed.

## Check the course

1. Open the course and select **Settings**.
2. Confirm …

## Check organization access

Explain the next most likely cause and link to the canonical access-control guide.

## If it still does not work

State what evidence to collect and where to contact support. Never ask for passwords, tokens, or full payment details.

## Related guides

- [Control Course Enrollment](/manage-students/enrollment-access-control) — review every setting that affects enrollment
```

Troubleshooting sequence:

1. State the likely causes in priority order.
2. Give a check that distinguishes each cause.
3. Give the corrective action.
4. Show the success signal.
5. Escalate only after self-service checks, naming safe evidence to provide.

Do not use a generic FAQ article when each question is independently searchable and deserves its own URL.

## Concept or feature reference

Use when the reader needs to understand a feature, state, role, rule, or data model before choosing what to do.

Typical size: 400–1,000 words.

```mdx
---
title: Understand Course Types
description: Compare Self-paced, Live class, Compliance, and Public courses in ClassroomIO.
last_reviewed: 'YYYY-MM-DD'
---

Course types control how students access content, complete training, and interact with scheduled sessions.

## Course type comparison

| Type | Best for | Enrollment | Completion behavior |
| --- | --- | --- | --- |
| … | … | … | … |

## Self-paced

Define it, explain material behavior, and state when to choose it.

## What changes when you switch types

Explain side effects and include a warning before risky changes.

## Related guides

- [Create a Course](/…) — put the concept into practice
```

Rules:

- Start with the distinction that affects a decision.
- Use tables for stable comparisons, not prose that forces repeated scanning.
- Link to task guides for configuration rather than embedding every procedure.
- Explain defaults, inheritance, status meanings, and side effects when relevant.

## Overview or decision guide

Use for section landing pages, multi-feature journeys, and choices where the reader needs routing rather than one procedure.

Typical size: 400–1,200 words.

```mdx
---
title: Manage Course Enrollment
description: Choose how students join a course and find the guide for each enrollment method.
last_reviewed: 'YYYY-MM-DD'
---

ClassroomIO supports direct enrollment, email invitations, reusable invite links, and self-enrollment. Choose a method based on who controls access and whether payment is required.

## Choose an enrollment method

| If you want to… | Use | Guide |
| --- | --- | --- |
| Add known students immediately | Direct enrollment | [Enroll Students Directly](/…) |

## How access settings work together

Give only the context needed to choose a path.

## Related guides

<CardGroup cols={2}>
  <Card title="Invite students" href="/manage-students/invite-students" icon="mail">
    Send individual or reusable invitations.
  </Card>
</CardGroup>
```

Rules:

- Route readers to task pages instead of reproducing every task.
- Use cards only when the article is functioning as an index or next-step hub.
- Keep category prose outcome-focused; do not mirror every visible product tab.

## Student guide

Student guides use the task or troubleshooting blueprint with these adjustments:

- Address the student directly as “you.” Do not describe them in the third person.
- Use only LMS and academy navigation visible to students.
- Do not expose administrator-only settings, internal names, or diagnostic details.
- Explain when the next step depends on an administrator, tutor, invitation, course rule, or payment.
- Link to another student guide by default. Link to an administrator guide only when the reader benefits from understanding the policy and the audience shift is explicit.
- Use screenshots captured from a student account, not an administrator impersonation view if the two differ.

## When to split an article

Split when at least one of these is true:

- A subsection has its own clear search query and useful shareable answer.
- Different roles follow different workflows.
- The reader can complete one task without reading the others.
- Screenshots come from different product areas and the page repeatedly resets context.
- The page has more than one primary success state.
- Troubleshooting has become a substantial decision tree.

Keep together when the steps form one uninterrupted workflow, share the same prerequisites, and lead to one success state.

After splitting:

- choose one canonical page for shared concepts;
- replace duplicated detail with a short explanation and descriptive link;
- add reciprocal links only when both directions are useful;
- update the sidebar and every affected inbound link;
- preserve old URLs or create a redirect plan.
