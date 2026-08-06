---
name: create-issue
description: File a GitHub issue in classroomio/classroomio. Use when the user asks to create, file, or open a bug ticket or issue.
---

Follow these steps in order. Keep the issue short and actionable.

## 1. Understand the report

Confirm before filing:

- **What** is broken or requested
- **Where** in the product (exact screen/flow — e.g. org landing page editor → Embed, not course builder)
- **Steps to reproduce** (numbered, from a known starting state)
- **Expected** vs **actual** behavior
- **Evidence** — screen recording, screenshot, or error message (link if available)

If the user shared a video, fetch the transcript or summary first.

## 2. Check for duplicates

```bash
gh issue list --repo classroomio/classroomio --state all --limit 30 --search '<keywords>' --json number,title,state,url
```

Do not file if an open issue already covers the same bug.

## 3. Pick issue type

| Type | When | Label |
|------|------|-------|
| Bug | Something broken or data lost | `bug` |
| Feature | New capability | use feature template fields |
| Improvement | Small enhancement | use improvement template fields |

Most agent-filed reports are **bugs**. Use the bug report fields from `.github/ISSUE_TEMPLATE/bug-report.yml`.

**Title format:** `[area] Short description`  
Examples: `[org landing page] Embed code textarea overflows sidebar`

**Severity (bugs):**

- S0 — data loss, security, crash, payments
- S1 — core feature broken, no workaround
- S2 — wrong behavior, workaround exists
- S3 — cosmetic / layout only

## 4. Create the issue

```bash
gh issue create --repo classroomio/classroomio \
  --title "[area] Short description" \
  --label "bug" \
  --body "$(cat <<'EOF'
## Bug Report

### Severity
S2 — Minor (works but wrong/confusing; workaround exists)

### Area
organizations / settings

### Environment
Not yet verified

### Steps to reproduce
1. ...

### Expected behavior
...

### Actual behavior
...

### Screen recording
(link if available)

### Likely cause
(optional — file path + one-line explanation if you found it in the codebase)

### Mode-specific?
No — happens in both / not mode-related

### Before filing
- [x] I searched existing issues and this is not a duplicate.
EOF
)"
```

Fill in every section. Remove optional sections you cannot support. Link related issues with `#123`.

## 5. Reply to the user

Return the issue URL and a one-line summary. Do not open a PR unless asked.
