# Walkthrough Widget PRD

## Status

- Draft

## Date

- May 23, 2026

## Purpose

Define a ClassroomIO product concept that lets customer academies create, publish, and embed in-app onboarding walkthroughs inside their own applications, so admins can guide learners, instructors, partners, or customers through key product workflows without custom engineering for every tutorial.

## Executive Summary

ClassroomIO customers who operate academies and certification programs often need to teach users how to use both the academy and the surrounding product. Today, that guidance usually lives in static help docs, course lessons, support tickets, or one-off engineering work inside the customer's application.

The walkthrough widget would give ClassroomIO a lightweight embedded onboarding layer:

1. Admins create a walkthrough in ClassroomIO.
2. Admins identify target elements in their application manually or through a guided element picker.
3. ClassroomIO stores the walkthrough steps, display rules, and published versions.
4. Customers install a small JavaScript widget in their app.
5. The widget evaluates targeting criteria and walks the end user through the relevant features with next, back, skip, and completion controls.

### Recommendation

Treat walkthroughs as an **activation and enablement product**, not as a replacement for courses, forms, or docs.

The strongest MVP is:

- manual walkthrough builder
- element picker mode
- embeddable JavaScript runtime
- URL and trait-based targeting
- step progress tracking
- basic analytics

Full passive click recording should be a later phase because it introduces reliability, privacy, and selector-quality risks.

## Product Thesis

For customer academies and certification training, courses teach concepts and assessments verify knowledge. Walkthroughs help users succeed in the live application at the exact moment they need guidance.

This creates a useful bridge between:

- **Learning content**: lessons, exercises, certifications, and knowledge checks.
- **In-product enablement**: contextual guidance on the customer's app or ClassroomIO-powered academy.

If ClassroomIO owns both layers, customers can pair training content with embedded product adoption flows:

- "Take the course on creating your first campaign."
- "Open the product and follow the guided walkthrough."
- "Complete the certification task."

## Problem Statement

Customer academy teams frequently need to onboard different audiences into product workflows:

1. New customers learning setup steps.
2. Learners navigating a course portal for the first time.
3. Instructors creating courses, cohorts, forms, or certificates.
4. Partners completing certification tasks inside a product.
5. Internal teams adopting new tools or processes.

Current options are limited:

1. Static help docs are disconnected from the actual UI.
2. Videos become stale when the product changes.
3. Support teams repeatedly answer the same "where do I click?" questions.
4. Customer engineering teams must build custom tours per app.
5. Product adoption data is fragmented across docs, LMS activity, and app analytics.

## Primary Users

### Customer Academy Admin

- Creates walkthroughs for learners, customers, partners, or internal users.
- Publishes walkthroughs and copies the embed snippet.
- Reviews completion and drop-off analytics.

### Product Enablement / Customer Success Manager

- Designs onboarding flows for key activation moments.
- Targets walkthroughs by role, plan, lifecycle stage, or completion status.
- Uses analytics to identify confusing product areas.

### Customer Developer

- Installs the JavaScript widget or npm package.
- Passes current user identity and traits.
- Adds stable `data-cio-tour` attributes where needed.

### End User

- Experiences a guided tour inside the host application.
- Can move forward, go back, skip, or end the walkthrough.
- May trigger a walkthrough from a help menu or onboarding checklist.

## Goals

1. Let customers create and publish app walkthroughs from ClassroomIO.
2. Provide a simple embed installation path for third-party applications.
3. Support reliable step targeting through stable selectors and element metadata.
4. Allow customer-defined display criteria such as first-time user, role, plan, or custom traits.
5. Track walkthrough views, starts, completions, skips, and step drop-off.
6. Keep the runtime lightweight, framework-agnostic, and isolated from host app styles.
7. Preserve user privacy by collecting only explicit walkthrough metadata and interaction events.

## Non-Goals (v1)

- Full browser extension.
- Passive recording of every click on a customer site.
- Session replay or screen recording.
- Branching decision trees.
- A/B testing.
- Automated AI-generated walkthroughs.
- Deep product analytics replacement.
- Arbitrary third-party script execution in walkthrough content.
- Complex no-code automation builder.

## Confirmed Product Decisions

1. Walkthroughs are a **new product domain**, not a mode of course widgets.
2. The public runtime should extend the existing embed direction where practical, but walkthroughs need their own payload contract and event model.
3. The MVP should prioritize **element picker/manual builder** over full click recording.
4. Customers should be encouraged to add stable target attributes such as `data-cio-tour="create-course-button"`.
5. Published walkthroughs should use immutable version snapshots so live customer apps do not break when a draft changes.
6. Targeting rules should be explicit and based on page path, user traits, completion state, or manual triggers.
7. The runtime must support single-page applications where routes change without full page reloads.
8. Progress and completion should be stored by ClassroomIO when the customer provides a stable user identifier.
9. Anonymous session support is allowed, but cross-device completion requires user identity from the customer app.
10. Privacy and consent controls must be part of the product design before any broader recording capability is considered.

## Core Use Cases

### UC-1: New Customer Activation

- A SaaS company embeds the ClassroomIO walkthrough widget in its product.
- New users with `traits.firstTimeUser = true` see a setup walkthrough.
- The tour highlights dashboard navigation, first project creation, and key settings.
- Completion is stored so the walkthrough does not appear again.

### UC-2: Certification Task Guidance

- A customer academy teaches users how to complete a workflow in the customer's app.
- After a lesson, the user launches the app and receives an embedded walkthrough.
- The walkthrough guides the user through the same workflow required for certification.
- ClassroomIO tracks whether the walkthrough was started or completed.

### UC-3: Instructor/Admin Onboarding

- A training organization uses ClassroomIO to onboard new instructors.
- A walkthrough explains how to create a course, invite learners, and publish a certificate.
- Admins can relaunch it from a help menu.

### UC-4: Feature Launch Enablement

- A product team launches a new feature.
- Existing users with `traits.role = "admin"` and `traits.hasSeenFeature = false` see a short feature tour.
- Analytics show which step causes the most drop-off.

### UC-5: Contextual Help

- A user opens a confusing page.
- The host application calls `ClassroomIOWalkthrough.start("billing-setup")`.
- The user gets a short guided explanation without leaving the page.

## Functional Requirements

### FR-1: Walkthrough Lifecycle

Admins can:

1. Create a walkthrough.
2. Save it as draft.
3. Preview it against a target URL or local payload.
4. Publish it.
5. Unpublish or archive it.
6. Duplicate it.
7. Roll back to a previous published version.

Each walkthrough must support:

- name
- description
- organization ownership
- status: `DRAFT | PUBLISHED | ARCHIVED`
- public key
- latest published version
- target application/domain allowlist
- default locale
- created by / updated by metadata

### FR-2: Walkthrough Builder

Admins can configure:

1. Intro step.
2. Ordered list of walkthrough steps.
3. Step title and body.
4. Target element selector.
5. Step placement:
   - top
   - right
   - bottom
   - left
   - center/modal
   - auto
6. Button labels:
   - next
   - back
   - skip
   - done
7. Whether the target element should be highlighted.
8. Whether the page should be dimmed behind the highlighted element.
9. Whether a user must click the target before advancing.
10. Optional completion step.

The builder should warn when a selector looks fragile, such as:

- generated CSS module class names
- deep `nth-child` selectors
- selectors matching zero elements in preview
- selectors matching multiple elements when the step requires one target

### FR-3: Element Picker Mode

Element picker mode is the recommended first capture experience.

Flow:

1. Admin opens their application with the widget installed.
2. Admin starts picker mode from ClassroomIO or a temporary recorder token.
3. Hovering over elements highlights potential targets.
4. Clicking an element captures a proposed selector and metadata.
5. Admin adds title/body copy for that step.
6. Admin repeats for each step.
7. Admin saves the collected steps into the walkthrough draft.

Captured metadata should be limited to:

- page URL/path
- selector candidate
- element tag name
- ARIA label, if present
- `data-cio-tour`, if present
- element role, if present
- visible text snippet with a strict length limit
- bounding box at capture time for preview only

Do not capture:

- form input values
- full page HTML
- screenshots by default
- arbitrary user click streams
- passwords, tokens, or hidden field values

### FR-4: Selector Strategy

Selector reliability is critical.

Preferred selector priority:

1. `data-cio-tour`
2. `data-testid`
3. stable `id`
4. `aria-label` plus role
5. unique text plus role
6. generated CSS path fallback

Recommended customer markup:

```html
<button data-cio-tour="create-course">
  Create course
</button>
```

The builder should show a "selector health" indicator:

- Strong: stable explicit attribute.
- Medium: stable semantic selector.
- Weak: generated fallback selector.

### FR-5: Targeting Rules

Customers can decide when a walkthrough appears.

V1 targeting should support:

1. URL/path rules:
   - equals
   - starts with
   - contains
   - regex, optional and plan-gated
2. User traits:
   - equals
   - not equals
   - exists
   - one of
3. Completion state:
   - user has not completed this walkthrough
   - user has completed another walkthrough
   - user skipped this walkthrough
4. Manual trigger only.
5. Frequency controls:
   - show once
   - show until completed
   - allow relaunch from API

Example runtime initialization:

```typescript
ClassroomIOWalkthrough.init({
  organizationId: "org_123",
  userId: currentUser.id,
  traits: {
    role: currentUser.role,
    plan: currentUser.plan,
    firstTimeUser: currentUser.firstTimeUser,
    coursesCreated: currentUser.coursesCreated
  }
});
```

### FR-6: Public Runtime Widget

Customers can install the widget with a script tag:

```html
<script
  async
  src="https://assets.classroomio.com/embeds/walkthrough/walkthrough.js"
  data-cio-org="org_123">
</script>
```

Or with an npm package:

```typescript
import { ClassroomIOWalkthrough } from "@classroomio/walkthrough";

ClassroomIOWalkthrough.init({
  organizationId: "org_123",
  userId: currentUser.id,
  traits: currentUser.traits
});
```

Runtime responsibilities:

1. Load published walkthrough payloads for the organization/application.
2. Evaluate targeting rules locally where safe.
3. Fetch completion state when a user identity is available.
4. Wait for target elements to appear.
5. Render tooltip/modal UI.
6. Support next, back, skip, and end controls.
7. Track events.
8. Handle SPA route changes.
9. Expose a manual API:

```typescript
window.ClassroomIOWalkthrough.start("walkthrough_key");
window.ClassroomIOWalkthrough.end();
window.ClassroomIOWalkthrough.identify(userId, traits);
```

### FR-7: End-User Experience

End users can:

1. Start an eligible walkthrough automatically or through a host-app trigger.
2. See intro content.
3. Move next and back through steps.
4. Click required target elements when a step requires action.
5. Skip or end the walkthrough.
6. Resume from the latest incomplete step when configured.
7. Relaunch available walkthroughs from a customer-controlled help surface.

Accessibility requirements:

1. Tooltip content must be keyboard navigable.
2. Escape should close or skip based on configuration.
3. Focus should move into the walkthrough UI and be restored when the walkthrough ends.
4. Highlighted elements must not become unreachable by keyboard users.
5. Screen readers should receive step title, body, and progress.
6. Reduced motion preferences must be respected.

### FR-8: Analytics

V1 analytics should include:

1. Walkthrough impressions.
2. Starts.
3. Completed.
4. Skipped.
5. Ended.
6. Step viewed.
7. Step completed.
8. Step drop-off.
9. Average completion rate.
10. Average time to complete.

Analytics should be available:

- per walkthrough
- per published version
- by date range
- by user trait dimensions where privacy and plan allow

### FR-9: Versioning and Publishing

Publishing creates an immutable snapshot containing:

- walkthrough metadata
- ordered steps
- targeting rules
- theme/design tokens
- selector metadata
- runtime compatibility version

Runtime should fetch only published snapshots. Draft changes should never alter behavior on a customer site until explicitly published.

### FR-10: Theming and Branding

Customers can configure:

1. Primary color.
2. Background color.
3. Text color.
4. Border radius.
5. Tooltip width.
6. Overlay opacity.
7. Button labels.
8. Optional "Powered by ClassroomIO" branding depending on plan.

The runtime must isolate styles from the host app, preferably through Shadow DOM.

## Recommended Architecture

### Principle

Reuse the existing embed delivery learnings, but define walkthroughs as their own domain with dedicated data, routes, and runtime contracts.

### Package and App Boundaries

1. `apps/dashboard`
   - walkthrough list
   - builder/editor
   - targeting rules UI
   - analytics views
   - publish and embed code copy

2. `apps/api`
   - organization-protected walkthrough CRUD
   - publish/version routes
   - public payload endpoint
   - event ingestion endpoint
   - progress state endpoint

3. `packages/db`
   - walkthrough query functions
   - walkthrough version queries
   - event and progress queries

4. `packages/utils`
   - walkthrough validation schemas
   - public payload schema
   - targeting rule schema

5. `apps/embeds`
   - lightweight walkthrough runtime
   - isolated UI renderer
   - selector resolution helpers
   - event batching client

## Technical Design

### 1. Data Model

#### 1.1 `walkthrough`

```sql
CREATE TABLE walkthrough (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR NOT NULL DEFAULT 'DRAFT',
  public_key VARCHAR NOT NULL UNIQUE,
  latest_published_version_id UUID,
  application_origin VARCHAR,
  settings JSONB NOT NULL DEFAULT '{}',
  created_by_profile_id UUID,
  updated_by_profile_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 1.2 `walkthrough_version`

```sql
CREATE TABLE walkthrough_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walkthrough_id UUID NOT NULL REFERENCES walkthrough(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  payload_snapshot JSONB NOT NULL,
  runtime_manifest JSONB NOT NULL DEFAULT '{}',
  published_by_profile_id UUID,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (walkthrough_id, version)
);
```

#### 1.3 `walkthrough_progress`

```sql
CREATE TABLE walkthrough_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walkthrough_id UUID NOT NULL REFERENCES walkthrough(id) ON DELETE CASCADE,
  walkthrough_version_id UUID REFERENCES walkthrough_version(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  external_user_id VARCHAR,
  anonymous_id VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'STARTED',
  current_step_key VARCHAR,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'
);
```

#### 1.4 `walkthrough_event`

```sql
CREATE TABLE walkthrough_event (
  id BIGSERIAL PRIMARY KEY,
  walkthrough_id UUID NOT NULL REFERENCES walkthrough(id) ON DELETE CASCADE,
  walkthrough_version_id UUID REFERENCES walkthrough_version(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  external_user_id VARCHAR,
  anonymous_id VARCHAR,
  event_type VARCHAR NOT NULL,
  step_key VARCHAR,
  page_url TEXT,
  traits JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. Public Payload Contract

The runtime should fetch a compact payload:

```typescript
type WalkthroughPublicPayload = {
  schemaVersion: "v1";
  organizationId: string;
  walkthroughs: Array<{
    key: string;
    versionId: string;
    name: string;
    status: "PUBLISHED";
    targeting: TargetingRuleGroup;
    theme: WalkthroughTheme;
    steps: WalkthroughStep[];
  }>;
};
```

Step contract:

```typescript
type WalkthroughStep = {
  key: string;
  type: "intro" | "tooltip" | "modal" | "action" | "completion";
  title: string;
  body: string;
  target?: {
    selector: string;
    selectorType: "data-cio-tour" | "data-testid" | "id" | "aria" | "text" | "css";
    selectorStrength: "strong" | "medium" | "weak";
  };
  placement: "top" | "right" | "bottom" | "left" | "center" | "auto";
  requireTargetClick?: boolean;
  showOverlay?: boolean;
  showProgress?: boolean;
};
```

### 3. API Surface

Organization-scoped routes:

- `GET /organization/walkthroughs`
- `POST /organization/walkthroughs`
- `GET /organization/walkthroughs/:walkthroughId`
- `PUT /organization/walkthroughs/:walkthroughId`
- `POST /organization/walkthroughs/:walkthroughId/publish`
- `POST /organization/walkthroughs/:walkthroughId/archive`
- `POST /organization/walkthroughs/:walkthroughId/rollback`
- `GET /organization/walkthroughs/:walkthroughId/analytics`

Element picker/session routes:

- `POST /organization/walkthroughs/:walkthroughId/picker-session`
- `POST /organization/walkthroughs/:walkthroughId/picker-session/:sessionId/steps`
- `POST /organization/walkthroughs/:walkthroughId/picker-session/:sessionId/complete`

Public runtime routes:

- `GET /walkthroughs/:organizationPublicKey/payload`
- `POST /walkthroughs/:organizationPublicKey/events`
- `GET /walkthroughs/:organizationPublicKey/progress`
- `POST /walkthroughs/:organizationPublicKey/progress`

### 4. Runtime Flow

```text
Host app                         ClassroomIO
  |                                  |
  |-- load walkthrough.js ---------->|
  |<-- static runtime ---------------|
  |                                  |
  |-- init({ userId, traits }) ------|
  |                                  |
  |-- fetch published payload ------>|
  |<-- eligible walkthroughs --------|
  |                                  |
  |-- fetch progress state --------->|
  |<-- completed/skipped state ------|
  |                                  |
  |-- evaluate targeting locally ----|
  |-- find target elements ----------|
  |-- render active walkthrough -----|
  |                                  |
  |-- batch events/progress -------->|
```

### 5. Runtime Constraints

1. No framework dependency required on the host page.
2. Shadow DOM style isolation where possible.
3. Small bootstrap loader with lazy-loaded UI runtime.
4. Event batching to avoid excessive network calls.
5. MutationObserver support for delayed target elements.
6. History API and route-change detection for single-page apps.
7. Graceful no-op when target elements are missing.
8. Strict domain allowlist checks for published payloads.

## Privacy and Security Requirements

1. Do not collect full DOM snapshots.
2. Do not collect form input values.
3. Do not capture screenshots in v1.
4. Only collect selected element metadata during picker mode.
5. Require a short-lived picker token for element capture.
6. Restrict public payloads to published walkthrough fields only.
7. Rate limit public payload, event, and progress endpoints.
8. Batch analytics without storing sensitive traits by default.
9. Hash or redact user agent and IP-derived metadata unless explicitly needed.
10. Allow customers to disable anonymous tracking.
11. Support domain allowlists so a public key cannot be freely embedded anywhere.

## Dashboard Experience

### Walkthrough List

Admins see:

- name
- status
- last edited
- latest published version
- starts
- completion rate
- actions: edit, duplicate, publish, archive

### Builder

Builder sections:

1. Steps
2. Targeting
3. Design
4. Install
5. Analytics

Recommended layout:

- left panel: step list and add-step controls
- center: step editor
- right: preview, selector health, and publish checklist

### Install Page

Show:

1. script tag installation
2. npm installation
3. identify/init example
4. manual start example
5. recommended `data-cio-tour` usage
6. domain allowlist settings

## Rollout Phases

### Phase 0: Product Validation Spec

Ship this PRD and validate:

1. Whether customers want walkthroughs for their own products, ClassroomIO portals, or both.
2. Whether academy use cases are better served by forms, checklists, or walkthroughs.
3. Whether customers can add stable target attributes to their apps.
4. Whether progress tracking should live in ClassroomIO or remain customer-owned.

### Phase 1: Walkthrough MVP

Ship:

1. Walkthrough CRUD.
2. Manual builder.
3. Draft/publish/archive lifecycle.
4. Public payload endpoint.
5. Lightweight runtime.
6. Tooltip and modal steps.
7. URL and trait targeting.
8. Next, back, skip, and end controls.
9. Progress tracking.
10. Basic analytics.

### Phase 2: Element Picker

Add:

1. Short-lived picker sessions.
2. Hover highlight and click-to-select target elements.
3. Selector health scoring.
4. Captured step import into the builder.
5. Preview against live host app pages.

### Phase 3: Advanced Enablement

Add:

1. Action-gated steps.
2. Multi-page walkthrough continuity.
3. Help center launcher.
4. Onboarding checklist integration.
5. Course or certification completion triggers.
6. Webhooks for completion/skipped events.
7. Team templates.

### Phase 4: Recording and Intelligence

Consider only after privacy and reliability controls are proven:

1. Passive click recording with explicit admin-only recording mode.
2. AI-assisted step copy.
3. Auto-detected broken selectors.
4. Suggested replacement selectors.
5. Analytics-based walkthrough optimization.

## Relationship to Forms Product

Forms and walkthroughs solve different parts of the customer academy problem.

Forms are a stronger core LMS primitive for:

- enrollment
- certification applications
- feedback
- evaluations
- assessments-adjacent data collection
- consent and intake workflows

Walkthroughs are stronger for:

- activation
- contextual product education
- feature adoption
- reducing "where do I click?" support load
- guiding users through real application tasks

Recommended priority:

1. Forms first for core academy operations.
2. Walkthroughs second as an activation layer.
3. Later integration where a course, form, or certification can trigger a walkthrough and vice versa.

## Key Risks

1. **Fragile selectors**
   - Dynamic frontends can break walkthroughs when DOM structure changes.
   - Mitigation: stable `data-cio-tour` attributes and selector health warnings.

2. **Privacy concerns**
   - Click recording can accidentally capture sensitive behavior.
   - Mitigation: element picker first, strict metadata limits, explicit recording sessions.

3. **Runtime performance**
   - Customers will not accept a heavy script on production apps.
   - Mitigation: small loader, lazy runtime, cached published payloads.

4. **Host app CSS conflicts**
   - Third-party pages vary widely.
   - Mitigation: Shadow DOM and strict style scoping.

5. **SPA route complexity**
   - Targets may appear after route changes or async rendering.
   - Mitigation: route listeners, MutationObserver, configurable wait timeouts.

6. **Support burden**
   - Customers may expect ClassroomIO to fix selectors in their app.
   - Mitigation: selector health UI, docs, and install guidance.

7. **Product focus**
   - Walkthroughs are useful but may distract from more central LMS workflows.
   - Mitigation: position as a later activation product unless customer demand is strong.

## Open Questions

1. Is the primary target external customer applications, ClassroomIO course portals, or both?
2. Should v1 require customers to add `data-cio-tour` attributes for production-ready tours?
3. Should anonymous users be eligible for walkthrough progress tracking?
4. How much trait data should customers be allowed to send and store?
5. Should walkthrough completion be usable as a course/certification requirement?
6. Should the widget include a built-in help launcher in v1, or only automatic/manual API triggers?
7. Should walkthroughs be packaged under existing widgets navigation or a new "Onboarding" product area?
8. What plans should include walkthroughs, and which features should be plan-gated?
9. Should customers be able to export walkthrough analytics?
10. How should broken selectors be monitored and surfaced after publish?

## Success Metrics

1. Admin can publish and install a basic walkthrough without engineering support beyond adding the widget snippet.
2. End users can complete a walkthrough with next, back, skip, and end controls across supported browsers.
3. Published walkthrough runtime has no host CSS collisions in representative customer apps.
4. At least 80% of production steps use strong or medium selectors.
5. Walkthrough completion and drop-off analytics are visible in the dashboard.
6. Runtime gracefully handles missing targets without breaking the host app.
7. Customers can target walkthroughs by path and user traits without code changes after installation.

## Bottom Line

The walkthrough widget is a promising activation feature for ClassroomIO, especially for customer academies that need users to learn by doing inside a real application. The safest path is to start with a manual builder and explicit element picker, then expand toward recording and intelligence only after the runtime, selector model, privacy posture, and customer demand are proven.
