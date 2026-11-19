---
name: link-prs
description: Write every pull request and issue reference as a clickable link rather than a bare number. Use whenever a reply, PR description, issue body, comment or report mentions a PR or issue in classroomio/classroomio.
---

Never refer to a pull request or issue by number alone. Always make it clickable.

## The rule

Write `[#1213](https://github.com/classroomio/classroomio/pull/1213)`, not `#1213`.

Issues use `/issues/` instead of `/pull/`:
`[#1199](https://github.com/classroomio/classroomio/issues/1199)`.

GitHub resolves both paths either way, so a wrong guess still lands on the right
page — but prefer the correct one.

## Where it applies

Every reference, every time: chat replies, summaries, status updates, tables,
and prose. A number mentioned three times in an answer is linked three times.

Markdown reference-style links are fine when the same PR appears repeatedly:

```markdown
That landed in [#1213] and was reverted by [#1220].

[#1213]: https://github.com/classroomio/classroomio/pull/1213
[#1220]: https://github.com/classroomio/classroomio/pull/1220
```

## Where it does not apply

- **Commit messages and PR bodies on GitHub.** GitHub auto-links `#1213` there,
  and a full URL is noise. Keep those bare.
- **Branch names, file paths and shell commands.** `gh pr view 1213` stays as
  typed — it is a command, not a reference.
- **Another repository.** Link it, but to that repo's URL, not this one's.

## Why

A bare number costs the reader a search to act on. It also goes stale the moment
the text leaves this conversation: pasted into Slack or a doc, `#1213` means
nothing without the repo attached.
