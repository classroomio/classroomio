# Editing the Help Center — writer's guide

This is for writers updating [classroomio.com/help](https://classroomio.com/help) content without
cloning the repo or using Git directly.

## Who this is for, and getting access

You'll log in with your GitHub account, and you need to already be a **collaborator on the
`classroomio/classroomio` repository** — ask whoever manages repo access to add you. Without
collaborator access, login will succeed but saving a change will fail, because the CMS opens pull
requests by pushing a branch directly into the repo.

## Logging in

1. Go to [classroomio.com/help/admin](https://classroomio.com/help/admin).
2. Click **Login with GitHub** and approve the popup.
3. You'll land on the content list, grouped by section (Get Started, Build a Course, Live
   Classes, etc.) — the same sections you see in the Help Center's sidebar.

## Editing an existing page

1. Open a section, then the page you want to change.
2. Edit the fields:
   - **Title** / **Description** — required, shown in the page header and search results.
   - **Sidebar → Label override** — only set this if you want the sidebar to show different text
     than the page Title.
   - **Sidebar → Order** — controls ordering among pages already in the same sidebar group.
   - **Last reviewed** — optional freshness date (`YYYY-MM-DD`); leave blank if unsure.
   - **Draft** — check this to keep the page out of the published site until it's ready.
   - **Body** — the page content.
3. Click **Save**. This does not go live immediately — it opens (or updates) a pull request.

## Uploading an image

Use the image button in the body editor, or drag an image directly into the text. Uploaded files
land alongside the site's existing images and are referenced automatically — you don't need to
know the underlying file path.

## Submitting for review

Saving moves the entry through three real statuses — **Draft → In Review → Ready** — and each one
is reflected on an actual GitHub pull request against `main`, not just inside the CMS:

- **Draft** opens the PR as a GitHub *draft* pull request, which blocks it from being merged by
  accident while you're still working.
- **In Review** marks it ready for someone to look at.
- **Ready** means it's approved and could be merged.

After you submit:
- A comment appears on the pull request with a **preview link** — open it and check your change
  renders correctly before it's merged. This matters especially for pages with call-out boxes or
  step-by-step components, since the CMS's own editor can't always render those.
- Some automated checks run and post comments (spelling/style suggestions, a "needs docs review"
  label). These are **advisory, not blocking**, and will follow up with you if a change is
  actually needed.
- Once merged, the live site rebuilds automatically — there's nothing further for you to do.

**A note on the CMS's own "Publish" button:** marking an entry Ready and clicking Publish
attempts a real merge right from the CMS, using your own GitHub account — it isn't just a
notification to a maintainer. It will only succeed if the repository's merge requirements (review
approval, required checks) are already satisfied; otherwise it fails the same way a manual merge
attempt on GitHub would. In practice, prefer letting a maintainer merge from GitHub after review,
rather than relying on Publish, so a second person always looks at the change first.

## One PR per page — no bulk changes yet

Each page you edit or create gets its **own separate branch and pull request** — Sveltia doesn't
currently support bundling several pages into one PR. If you're updating a whole series of related
pages, expect one PR per page rather than a single combined one; each is reviewed and merged
independently. If a set of changes truly needs to land together atomically (for example, a
coordinated rename referenced across several pages), that's better done by a developer directly in
the repo rather than through the CMS.

## Two things the CMS can't do yet

- **Adding a brand-new page, or reordering entire sections, needs a developer follow-up.** The
  CMS can edit any existing page freely, but a new page won't show up in the site's sidebar until
  a developer adds it to `navigation.sidebar` in `blume.config.ts`. Mention this when you submit a
  new page so someone picks it up.
- **Pages with custom components** (step-by-step guides, call-out boxes) may not render fully
  inside the CMS's editor. Always check the pull request's preview link rather than trusting the
  in-CMS preview for these pages.
