# Events prototype

End-to-end clickable mock of the Events feature: admin editor, public catalog and event page, registration and email confirmation, reminders, reschedule and cancel, recording sync, guest list, linked course, and the learner LMS.

- Open [`index.html`](./index.html) in a browser. No build step.
- Spec: [`prd/events/README.md`](../../prd/events/README.md)

Start on the **Map** tab for the guided walkthrough. Use **Controls** (top right) to time travel (24h and 1h reminders, live, ended), change the viewer timezone, and flip scenarios (org student limit reached, event at capacity, org sign-up disabled).

Styling follows the repo's existing prototype conventions: admin and learner screens use `app-theme.css` (mirrors `@cio/ui` tokens, Item-style cards, the dark `Page.FloatingBar` save pill), and public org-site screens use `landing-theme.css` (`--landing-*` tokens, square hairline cards, pill nav) plus the shared `ScrollToTop` control.

All state lives in memory and resets on reload. This folder is not wired into the dashboard.
