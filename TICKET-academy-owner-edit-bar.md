# Owner edit bar on the public academy (catalog and course pages)

**Type:** Feature
**Area:** Org public site (academy), landing page
**Prototype:** `prototypes/onboarding-flow/` (`public-courses.html`, `public-course.html`)

## Summary

When an org owner or staff member views their own public academy, show a small floating "Edit" bar that jumps straight to the right place in the dashboard to change what they are looking at. Learners and signed-out visitors never see it.

Today an owner who spots a typo or wants to tweak the page has to leave the academy, open the dashboard, and find the right screen by hand. The bar removes that detour.

## Problem

- Owners preview their academy often (the product tour even ends with "Preview your academy").
- From the preview there is no way back to the editor for the thing they are looking at.
- The landing page editor, the course list and the course settings are three different dashboard areas, and it is not obvious which one controls which part of the page.

## Proposed solution

A fixed, bottom-centre pill, visible only to the org owner (and, if confirmed below, other staff). It has a label ("Viewing as owner") and one to three links.

### Catalog page (`/courses`)

| Link | Destination |
| --- | --- |
| Edit courses | Dashboard Courses list |
| Edit page design | Landing page editor |

### Course page (`/course/:id`)

| Link | Destination |
| --- | --- |
| Edit landing page | Course, Landing Page tab |
| Edit lessons | Course, Lessons tab |
| Settings | Course settings |

The first link is the primary action (dark, filled). The rest are ghost links.

## Scope

**In scope**

- Edit bar on the public catalog page.
- Edit bar on the public course page.
- Visibility limited to the owner viewer.
- Links resolve to the correct dashboard routes for the current org and course.

**Out of scope**

- Inline, in-place editing on the public page (we chose a link bar, not a page builder).
- Learning paths. There is no public learning paths page yet, so there is nothing to attach the bar to. Revisit when that page exists.
- Any change to the dashboard editors themselves.

## Acceptance criteria

1. The owner sees the bar on the catalog page and on every course page of their own academy.
2. Learners, signed-out visitors and members of other orgs never see the bar, and the bar is not present in the DOM for them.
3. Each link opens the correct dashboard destination for that org and course.
4. After editing, the user can get back to the public page (browser back at minimum).
5. The bar does not cover page content or overlap the "Powered by ClassroomIO" badge on the free plan, at 390px, tablet and desktop widths.
6. The bar is keyboard reachable, has a labelled region role, and meets contrast requirements.
7. All copy comes from translations, no hardcoded strings.
8. No console errors.

## Implementation notes (production)

- The prototype uses a viewer check (`A.viewer(S).kind === 'owner'`). In production, base this on the signed-in user's role in the current org, resolved server-side so the bar is not rendered for anyone else.
- Dashboard links must target the admin app host (`getAppBaseUrl()`), not the org's custom domain or tenant subdomain. Staff sign in on the admin app, so a link on a custom domain has to cross origins and may land on a login screen.
- Follow the repo conventions: shared component in `@cio/ui` with a Storybook story and `ui:` prefixed classes, copy under `apps/dashboard/src/lib/utils/translations/en.json` with the other locales updated, and `testId` hooks such as `academy-edit-bar` and `academy-edit-bar-link` for Playwright.
- The bar should be mounted once per shell (the public catalog and public course shells), not copied into each page.
- Prototype reference: `mountEditBar` in `academy-common.js`, styles in `public-academy.css` (`.pa-editbar*`), called from `public-courses.js` and `public-course.js`.


## Known issues in the prototype

- On a narrow window the bar overlaps the "Powered by ClassroomIO" badge slightly. Needs a layout fix before this ships (criterion 5).
- I checked the course page bar in the browser. The catalog page bar was not checked in a browser, and neither were the learner and signed-out hidden states or the link click-through.
