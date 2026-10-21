---
name: writing-code
description: >-
  Mandatory code-writing rules for this repo, led by the comment policy: default
  to no comments, document functions with JSDoc only when the signature isn't
  enough, and never explain a design choice inline (refactor instead). Read this
  before writing or editing any code.
---

# Writing Code

Read this before writing or editing code. The comment policy is the part agents get wrong most often, so it comes first and it is not optional.

## The comment policy

Default: **write no comments.**

An inline comment is allowed only when it records an **external constraint** — something true about the world outside this file that the code cannot express. Platform behavior, a build-tool quirk, a third-party API's odd requirement, a legal or policy limit.

Everything else is banned:

- Narrating what the code does.
- Section headers.
- Restating types, names, or obvious intent.
- Explaining a design decision. If a reader needs the decision explained, the design is the problem — refactor until the code says it.
- Commented-out code.
- `TODO` / `FIXME` with no owner and no tracked issue.

When in doubt, delete it. A missing comment costs a reader one re-read; a wrong one costs them trust.

## Documenting functions

Use JSDoc, and only when the signature doesn't already convey the contract. State the contract — inputs, side effects, what it returns or throws — not the implementation. One or two lines.

If a function needs a paragraph to explain, it is doing too much. Split it.

## Examples

Bad — narrates the code and restates the obvious:

```ts
// increment the counter by one
counter += 1;

// check if the user is an admin
if (user.role === 'admin') {
  // ...
}
```

Bad — module block that enumerates the implementation:

```ts
/**
 * Shared cascade-deletion helpers used by org deletion scripts.
 *
 * `deleteOrganization` removes an organization and ALL associated data by
 * walking every child table (courses, lessons, exercises, submissions,
 * groupmembers, tags, assets, widgets, programs, cohorts, AI data,
 * analytics, etc.) in reverse dependency order before removing the org.
 */
```

The table list is a copy of the schema that will drift and then lie. Keep it out of the source.

Good — JSDoc states the contract:

```ts
/**
 * Removes an organization and every child row. Throws if the org is missing.
 */
export async function deleteOrganization(orgId: string): Promise<void> {
```

Good — the one allowed inline comment, one line, external constraint:

```ts
// SvelteKit prerender bakes the build-time fetch into static HTML; serve at runtime so the KV cache is read per request.
export const prerender = false;
```

## Before you commit

- [ ] No comment narrates what the code does.
- [ ] No comment explains an internal design choice.
- [ ] Every JSDoc states a contract, not an implementation.
- [ ] The only inline comments left record an external constraint, in one line.
