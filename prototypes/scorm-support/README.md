# SCORM support prototypes

Rebuilt for revision 3 of the PRD: SCORM is a separate **activity** content type with its own pages, and **SCORM courses** hold exactly one package.

Clickable HTML mocks for every SCORM surface. Open [`index.html`](./index.html) in a browser.

- Spec: [`prd/scorm-support/v2/README.md`](../../prd/scorm-support/v2/README.md) — where the PRD and a prototype disagree, the PRD wins.
- Each page has a state bar at the bottom left and a theme toggle in the header.
- `app-theme.css`, `proto.css` and `course-shell.css` are copied from `prototypes/course-templates`. `scorm.css` and `proto.js` hold the SCORM pieces.
- `activity-editor.html` is the package editor for the activity at `/courses/[id]/activities/[activityId]`. `scorm-course.html` covers the SCORM course format: New course → Upload a SCORM package, the Package nav item, course cards, the landing-page curriculum and Convert to standard.

This folder is not wired into the dashboard.
