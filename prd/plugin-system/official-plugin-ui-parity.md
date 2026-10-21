# Official Plugin UI and Behavior Parity

Status: **Certificate Studio parity work in progress; remaining plugins audited**

This plan compares the independently hosted official plugins in `classroomio-plugins` with the donor
implementations on `feat/plugin-system`. The donor branch is the acceptance reference for appearance,
interaction, and user-visible behavior. Internal dashboard imports from the donor implementations are
not part of the target architecture; equivalent behavior must use the public plugin SDK, manifest
contributions, and sandbox-safe UI.

## Acceptance rules

An official plugin is at parity only when:

1. Its visual hierarchy, spacing, states, responsive behavior, and theme behavior match the donor.
2. Every donor interaction has an equivalent user-visible result.
3. Loading, empty, error, disabled, success, and persisted states are covered.
4. The plugin uses no dashboard source import, private store, session cookie, or internal API.
5. Required host behavior is exposed as a generic public capability usable by third-party plugins.
6. Browser interaction tests cover the primary flow, not only component rendering.

## Certificate Studio

### Differences found

The first external port reproduced the editor layout but omitted important parts of the donor behavior:

- the canvas overlay disabled pointer input for element zones;
- the selected border covered the canvas at the same interaction depth as content elements;
- selection used blue instead of the donor's amber treatment;
- signatures were represented as one group instead of independently selectable elements;
- only corner resize handles were available;
- snapping, vertical centering, and several inspector controls were missing;
- border, background, badge, and QR controls did not all affect the public renderer;
- signatory add, remove, enable, selection, and layout reindexing were incomplete;
- color controls were rectangular instead of the donor's circular swatches.

### Completed in the current pass

- restored pointer-based dragging and resizing with reactive preview updates;
- waits for iframe fonts to settle before measuring element bounds and uses a template-independent
  certificate-root marker;
- keeps drag and resize updates transient until pointer release so the preview iframe is not rebuilt
  for every pointer movement;
- kept the border below content interaction zones;
- restored amber hover, selection, handles, and element toolbar treatment;
- added four corner and four edge resize handles;
- added horizontal and vertical center actions and center snapping guides;
- rendered and measured each signatory independently;
- added individual signatory selection, positioning, enabling, adding, removing, and layout reindexing;
- restored custom copy, typography color, badge image/foil, QR label/ID, and background controls;
- changed palette and native color controls to circular presentation;
- connected border style, background style, badge style, image, and QR position to the public renderer;
- constrained and auto-scaled the full-certificate preview dialog for the available iframe viewport;
- retained the donor's modular editor renderer instead of incorrectly turning each production
  template into a separate editor implementation;
- kept template CRUD behind Certificate Studio's authenticated remote backend and removed the
  browser-storage fallback that could report a save without durable backend persistence;
- validated title dragging and signatory add/remove/selection in a real browser.

The five starter designs configure the modular editor renderer. `rendererTemplateId: "modular"` is
intentional and matches the donor implementation; `templateId` records the selected visual family.
Protected template data does not travel through a dashboard proxy. For local development, the
plugin connects to its backend on `http://localhost:4000`, while production uses the HTTPS origin
declared by the manifest.

### Remaining acceptance work

- port the donor's exact Victorian, double-rule, geometric, minimal, and custom-image border artwork;
- add keyboard nudging, delete, escape-to-deselect, and focus-visible behavior;
- add margin snapping and preserve the badge aspect ratio during every resize direction;
- add upload-backed badge/signature assets after the public asset API is available;
- add undo/redo history and dirty-state regression tests;
- add browser tests for resize, snapping, hide/show, every inspector section, save, reload, and preview;
- compare all five starter templates at desktop and constrained iframe sizes.

## Announcement Banner

### Current parity

The external banner closely matches the donor's centered message, `NEW` badge, sparkle treatment,
CTA, dismissal action, dynamic latest-course mode, and persistent per-user dismissal. The external
settings screen is more complete than the donor because it exposes configuration through public
plugin storage.

### Remaining work

- add visual regression coverage for desktop, mobile, long copy, missing CTA, and custom colors;
- validate text contrast before accepting a custom background color;
- move user-facing copy to the plugin localization layer;
- confirm the host slot owns layout offset so the sandbox never mutates dashboard CSS;
- test dismissal-key revision behavior across settings updates and reinstall.

## Lesson Acknowledgment

### Current parity

The external plugin preserves the prompt, acknowledged state, timestamp, undo action, loading state,
and lesson completion synchronization. It correctly replaces local dashboard utilities with public
lesson and plugin-storage APIs.

### Remaining work

- match donor iconography, spacing, button loading indicators, and hover/disabled states exactly;
- localize all copy and error messages;
- add browser tests for acknowledge, persisted reload, undo, API failure, and missing lesson context;
- define conflict behavior when lesson completion changes outside the plugin after it loads.

## Reading Time and Focus Mode

### Differences found

The external plugin only renders estimated reading time and word count. The donor also provides an
elapsed-time timer, pause, resume, reset, focus-mode entry/exit, an active focus indicator, and Escape
handling.

### Required platform decision

The timer can live entirely inside the sandbox. True focus mode affects host chrome and therefore
requires a generic, permissioned host capability. The plugin must not reach into dashboard stores or
DOM. Add a public contract such as `client.ui.requestMode({ mode: 'focus' })`, with host-owned exit,
Escape, accessibility, and cleanup behavior, before porting that part of the donor.

### Implementation order

1. Restore the in-slot timer, pause, resume, and reset UI.
2. Persist timer state per user and lesson through plugin storage.
3. Specify and implement the generic host display-mode capability and permission.
4. Connect the plugin's focus action to that capability.
5. Add browser tests for timer restoration, iframe reload, focus entry/exit, Escape, and uninstall cleanup.

## LinkedIn Certificate Sharing

### Differences found

The donor builds a LinkedIn certification URL from the certificate name, organization, issue date,
certificate ID, and verification URL. The external plugin currently contributes a static host action,
so it does not yet preserve the donor's certificate-specific URL construction.

### Implementation order

1. Define safe URL-template variables for the `certificate.actions` context.
2. Expose only the certificate fields granted to that contribution.
3. Build and encode the LinkedIn URL in the host action resolver or a sandboxed action UI.
4. Port the donor URL tests and add manifest validation for unknown variables.
5. Verify disabled behavior when required certificate context is unavailable.

## Donor plugins not yet represented externally

### Completion Celebration

The external repository has no equivalent for the donor's completion card, confetti replay, copied
state, and sharing action. Define a course-completion contribution surface and a least-privilege
completion context, then port the animation and actions into a sandboxed plugin.

### Learner Up Next

The external repository has no equivalent for the donor's resume card, progress summary, next
unlocked item selection, and all-complete state. Implement it only through public course-content and
progress APIs, with navigation delegated to the host SDK.

## Delivery order

1. Finish Certificate Studio remaining acceptance tests and exact renderer artwork.
2. Restore Reading Time's sandbox-owned timer.
3. Complete Lesson Acknowledgment visual and state tests.
4. Complete Announcement Banner responsive, contrast, and persistence tests.
5. Add certificate-context URL templates and finish LinkedIn sharing parity.
6. Design and ship the generic host display-mode capability, then restore Focus Mode.
7. Port Completion Celebration.
8. Port Learner Up Next.
9. Run the same isolation, build, artifact, install, reload, and uninstall suite for every official plugin.

## Explicit non-goals

- copying `$lib`, `$features`, SvelteKit state, or dashboard stores into an official plugin;
- adding plugin-specific branches to the dashboard host;
- granting first-party plugins broader permissions than third-party plugins;
- declaring parity based on screenshots without interaction and persistence tests.
