# PRD: ClassroomIO Labs

**Status:** Draft  
**Author:** Rotimi Best  
**Date:** 2026-05-03  
**Version:** 1.0

---

## 1. Overview

Labs is a new lesson content block type that allows teachers to embed interactive, sandboxed mini-applications directly inside a lesson. Unlike quizzes — which test recall through structured questions — Labs are experiential: students practice, simulate, explore, or make decisions inside a purpose-built interactive environment.

Each Lab is a single compiled Svelte application hosted as a standalone HTML page and embedded via `<iframe>`. Labs communicate with ClassroomIO through a strict `postMessage` interface. They have no network access. They support two modes: **Teacher Mode** (configure the experience) and **Student Mode** (play the experience).

Labs are contributed by developers to an open-source marketplace repository and discovered through an in-editor picker modal.

---

## 2. Problem Statement

ClassroomIO is building for compliance training and certification programs. These programs need learners to not just understand content but to demonstrate judgment under realistic conditions — recognizing a phishing email, following an incident response playbook, correctly classifying sensitive data.

Today, the only interactive tool available to teachers is the quiz. Quizzes test recall but cannot simulate decision-making under pressure, multi-step scenarios, or contextual judgment. There is also no mechanism for the ClassroomIO ecosystem to grow through external developer contributions.

This leaves a critical pedagogical gap: compliance certifications require learners to practice realistic scenarios, and teachers have no way to deliver that inside a lesson.

---

## 3. Goals

1. **G1** — Give teachers a way to embed interactive, scenario-based activities directly in lessons alongside existing content blocks (video, notes, slides).
2. **G2** — Make Labs completable and trackable — completion state and score feed into lesson progress and certification records.
3. **G3** — Enable an open-source developer ecosystem where contributors can publish Labs to a public marketplace.
4. **G4** — Keep Labs sandboxed and secure — no network access, no access to student PII, no access to ClassroomIO internals.
5. **G5** — Support a teacher configuration model so a single Lab can be deployed differently across different courses or compliance contexts.

---

## 4. Non-Goals

- **Labs are not quizzes.** Labs do not replace the existing quiz block. They are complementary.
- **Labs are not full course modules.** A Lab is a focused, time-bounded activity (typically 2–10 minutes). Multi-hour simulations are out of scope.
- **Labs do not have network access.** External API calls from within a Lab are explicitly prohibited.
- **Labs are not AI-generated on the fly.** The AI assistant may recommend which Lab to use, but it does not generate Lab code at runtime.
- **Labs are not native mobile apps.** The initial release targets web only.
- **The Labs marketplace is not monetized in v1.** All Labs are free and open source.

---

## 5. User Personas

### Teacher / Course Creator
Builds lessons. Wants to give students realistic practice. Does not write code. Expects to pick a Lab from a list, configure it through a form, and have it appear in the lesson.

### Student / Learner
Takes lessons as part of a certification program. Expects clear instructions, responsive interactions, and immediate feedback. Needs to complete the Lab to progress through the lesson.

### Lab Developer / Contributor
A developer (internal or external) who builds a Lab app as a single Svelte file and submits it to the marketplace repository via pull request. Needs a clear SDK, local dev harness, and contribution guidelines.

### Organization Admin / Compliance Manager
Monitors certification completion. Needs assurance that Lab completions are recorded in audit logs alongside quiz scores.

---

## 6. User Stories

### Teacher
- As a teacher, I can add a Lab block to any lesson so that students have an interactive activity alongside my written content.
- As a teacher, I can pick a Lab from a categorized list (by topic, compliance type, difficulty) so I can find the right one quickly.
- As a teacher, I can configure the Lab (difficulty, number of rounds, pass threshold, scenario set) through a form so the experience fits my course context.
- As a teacher, I can preview the Lab in both Teacher Mode and Student Mode before publishing so I know exactly what students will see.
- As a teacher, I can set a minimum pass score for the Lab so students must demonstrate competence before marking the lesson complete.
- As a teacher, I can reorder the Lab block within the lesson just like any other content block.

### Student
- As a student, I can see a Lab embedded inline in my lesson and interact with it without leaving the lesson page.
- As a student, I receive clear instructions before starting the Lab so I know what I am expected to do.
- As a student, I receive immediate feedback during the Lab so I can learn from my choices in the moment.
- As a student, I can see my result (score, pass/fail, summary) when the Lab ends so I know how I performed.
- As a student, if I fail a Lab that has a required pass score, I can retry it so I have another chance to pass.
- As a student, my Lab completion is reflected in my overall lesson progress so I can track my certification status.

### Lab Developer
- As a developer, I can scaffold a new Lab using a CLI command so I can start building without boilerplate.
- As a developer, I can run a local dev harness that simulates the `postMessage` init flow so I can develop the Lab in isolation.
- As a developer, I can define a config schema in `manifest.json` so ClassroomIO auto-generates the teacher configuration form for my Lab.
- As a developer, I can submit my Lab as a pull request to the `classroomio-labs` repository so it appears in the marketplace after review.

### Admin
- As a compliance manager, I can view Lab completion records per student in the organization dashboard so I can audit certification evidence.
- As a compliance manager, I can see the Lab version a student completed so I know if they need to redo it after an update.

---

## 7. Feature Requirements

### 7.1 Lab Block in Lesson Editor

- The lesson content block picker gains a new item: **Lab**. It sits alongside Video, Note, and Slide in the picker list.
- Selecting "Lab" opens the Lab Picker Modal (see 7.2).
- Once a Lab is chosen and configured, the block renders in the lesson editor as:
  - The Lab's name and preview thumbnail.
  - A **Configure** button to reopen the configuration form.
  - A **Preview** button to see the live iframe in either Teacher or Student mode.
  - A remove/delete button.
- The block is orderable via drag-and-drop like all other blocks.
- The block stores: `{ labSlug, labVersion, config: Record<string, unknown> }`.

### 7.2 Lab Picker Modal

- Triggered when a teacher selects "Lab" from the block picker.
- Displays all available Labs from the marketplace.
- Each Lab card shows:
  - Name
  - Short description (≤ 120 characters)
  - Preview thumbnail / animated GIF
  - Tags (e.g. `cybersecurity`, `compliance`, `finance`, `health-safety`)
  - Author
  - Estimated completion time
- Teachers can filter by tag and search by name.
- Selecting a Lab proceeds to the Configuration step within the same modal.
- Configuration step:
  - Renders the form derived from the Lab's `configSchema`.
  - Shows a live iframe preview of the Lab in Teacher Mode reflecting the current config values.
  - Has a Save button that closes the modal and inserts the block.

### 7.3 Teacher Mode

- When the iframe is loaded with `mode: 'teacher'`, the Lab renders its own configuration UI.
- The Lab's config UI is entirely self-contained inside the iframe. ClassroomIO does not render config fields directly — it drives the form via the `configSchema` in the picker modal (see 7.2), but the Lab itself also renders a config preview.
- When the teacher changes config in the modal form, ClassroomIO sends a fresh `init` message to the iframe so the Lab can update its preview in real time.
- When the teacher switches to "Student Preview", the iframe reloads with `mode: 'student'` and the current config frozen in.

### 7.4 Student Mode

- The Lab iframe is embedded inline in the lesson page with `mode: 'student'` and the teacher's saved config.
- Before the Lab starts, an instruction overlay is shown (either from the Lab itself or from ClassroomIO wrapping the iframe) covering:
  - Lab name
  - Objective / what the student needs to do
  - Estimated time
  - Pass score (if configured)
  - A **Start** button
- The Lab is fullscreen-expandable via a button on the iframe wrapper.
- While the student is in the Lab, a progress indicator (if the Lab emits `progress` events) shows on the iframe wrapper.
- When the Lab emits `complete`, ClassroomIO:
  - Records the result (score, passed, timestamp, labVersion, config hash).
  - Displays a result overlay on top of the iframe showing: score, pass/fail badge, and a brief summary from the Lab.
  - If the student passed (or no pass threshold was set): marks the Lab block as complete in lesson progress.
  - If the student failed and retries are allowed: shows a Retry button that reloads the iframe.
- A completed Lab block shows a green check in the lesson.

### 7.5 Completion and Progress Tracking

- Lab completion is stored per-student per-lesson block.
- Each completion record includes:
  - `studentId`
  - `lessonId`
  - `blockId` (the specific block within the lesson)
  - `labSlug`
  - `labVersion`
  - `configHash` (hash of the config used — ensures auditability)
  - `score` (0–100 or null if Lab doesn't produce a score)
  - `passed` (boolean or null)
  - `completedAt` (timestamp)
  - `attemptNumber`
  - `metadata` (arbitrary JSON from the Lab's `complete` event — e.g. per-round breakdown)
- A Lab block with a required pass score blocks lesson completion if the student has not passed it.
- A Lab block without a required pass score only requires the student to reach the `complete` event (any score).
- Org admins can export Lab completion records per student as part of certification audit exports.

### 7.6 Retry Policy

- Teacher can configure:
  - **Unlimited retries** (default)
  - **Limited retries** (e.g. max 3 attempts)
  - **No retry** (one attempt only)
- On retry, the iframe reloads with the same config but a fresh internal state.
- Each attempt is stored as a separate completion record. The "official" result for certification purposes is the student's **best** score across attempts.

### 7.7 Lab Versioning in Lessons

- Each Lab block records the `labVersion` at the time it is configured.
- When a new Lab version is published to the marketplace, existing lesson blocks are **not** automatically updated.
- A **version badge** appears on the Lab block in the editor if the block is behind the latest version:
  - Yellow badge: minor update available (non-breaking config changes).
  - Red badge: major update available (breaking config changes — config may need to be reconfigured).
- Teachers can explicitly upgrade to the new version from the block settings.
- Students who completed the Lab under an older version do not need to redo it unless the teacher explicitly requires it.

---

## 8. Technical Architecture

### 8.1 System Components

```
┌────────────────────────────────────────────────────────────┐
│                   classroomio-labs (GitHub repo)           │
│                                                            │
│  apps/                                                     │
│    phishing-detector/                                      │
│      index.svelte         ← entire Lab (logic + UI + style)│
│      manifest.json        ← metadata + config schema       │
│      preview.png                                           │
│                                                            │
│  sdk/                                                      │
│    index.ts               ← postMessage helpers + types    │
│    harness/               ← local dev simulator            │
│                                                            │
│  scripts/                                                  │
│    build.ts               ← compiles all labs to dist/     │
│    validate.ts            ← validates manifest + contract  │
└──────────────────────────────────┬─────────────────────────┘
                                   │ CI build + deploy
                                   ▼
┌─────────────────────────────────────────────────────────┐
│         labs.classroomio.com (static CDN)               │
│                                                         │
│   /phishing-detector/v1.2.0/index.html                  │
│   /phishing-detector/latest/index.html                  │
│   /registry.json   ← list of all labs + manifests       │
└─────────────────────────────────────────────────────────┘
                                   │
                          iframe src=
                                   │
┌─────────────────────────────────────────────────────────┐
│         ClassroomIO Dashboard (lesson editor / viewer)  │
│                                                         │
│   LabBlock.svelte  ─── postMessage ──► Lab iframe       │
│       ▲                                                  │
│       │ stores config, completion records               │
│   ClassroomIO API / DB                                  │
└─────────────────────────────────────────────────────────┘
```

### 8.2 postMessage Interface Specification

All messages are JSON objects with a `type` discriminant.

#### ClassroomIO → Lab iframe

**`init`** — sent immediately after the iframe loads. The Lab must wait for this before rendering.

```typescript
{
  type: 'init';
  mode: 'teacher' | 'student';
  config: Record<string, unknown>;  // teacher-saved config (empty object if not yet configured)
  locale: string;                   // e.g. 'en', 'fr'
  context: {
    studentId?: string;             // only in student mode, opaque token (not email/name)
    attemptNumber: number;          // 1-indexed
  };
}
```

**`config_update`** — sent in teacher mode when the teacher changes config values in the picker modal form. The Lab should update its preview without full re-render.

```typescript
{
  type: 'config_update';
  config: Record<string, unknown>;
}
```

**`resize_ack`** — sent in response to a `resize_request` from the Lab (see below).

```typescript
{
  type: 'resize_ack';
  width: number;
  height: number;
}
```

#### Lab iframe → ClassroomIO

**`ready`** — emitted when the Lab has finished initializing and is ready for `init`.

```typescript
{ type: 'ready' }
```

**`resize_request`** — emitted when the Lab needs a different iframe dimension.

```typescript
{
  type: 'resize_request';
  width?: number;   // preferred width in px, omit for full-width
  height: number;   // preferred height in px
}
```

**`progress`** — emitted periodically to report student progress through the Lab.

```typescript
{
  type: 'progress';
  percent: number;    // 0–100
  label?: string;     // e.g. "Round 3 of 5"
}
```

**`complete`** — emitted when the Lab activity is finished.

```typescript
{
  type: 'complete';
  score: number | null;           // 0–100, null if unscored
  passed: boolean | null;         // null if no pass threshold in Lab
  durationSeconds: number;        // total active time
  summary: {
    headline: string;             // e.g. "You caught 4 out of 5 phishing emails"
    details?: Record<string, unknown>;  // arbitrary breakdown for audit metadata
  };
}
```

**`error`** — emitted if the Lab enters an unrecoverable error state.

```typescript
{
  type: 'error';
  message: string;   // human-readable, shown in ClassroomIO fallback UI
}
```

#### Security constraints on postMessage
- ClassroomIO only accepts messages from the iframe's known origin (`labs.classroomio.com`).
- The iframe is served with the following headers:
  - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'none'; frame-ancestors https://app.classroomio.com`
  - `connect-src: 'none'` — no outbound network requests.
- The iframe sandbox attribute: `sandbox="allow-scripts allow-same-origin"` — no form submissions, no top-navigation, no popups.

### 8.3 Lab Build Pipeline

Each `apps/{slug}/index.svelte` is compiled by Vite + `@sveltejs/vite-plugin-svelte` to a self-contained `dist/{slug}/v{version}/index.html` (all JS/CSS inlined, no external dependencies).

The `scripts/build.ts` script:
1. Reads each `manifest.json` and validates against the manifest schema.
2. Compiles each Lab to `dist/{slug}/v{version}/index.html`.
3. Also writes to `dist/{slug}/latest/index.html`.
4. Generates `dist/registry.json` — the full marketplace catalog.

CI runs on every merged PR to `main`. Deployment is to a static CDN (Cloudflare Pages or equivalent).

### 8.4 Registry Format (`registry.json`)

```json
{
  "version": 1,
  "updatedAt": "2026-05-03T00:00:00Z",
  "labs": [
    {
      "slug": "phishing-detector",
      "name": "Phishing Detector",
      "description": "Students identify phishing vs legitimate emails in a realistic inbox simulation.",
      "tags": ["cybersecurity", "compliance", "security-awareness"],
      "author": { "name": "ClassroomIO Team", "url": "https://classroomio.com" },
      "version": "1.2.0",
      "estimatedMinutes": 5,
      "previewImage": "https://labs.classroomio.com/phishing-detector/preview.png",
      "url": "https://labs.classroomio.com/phishing-detector/v1.2.0/index.html",
      "latestUrl": "https://labs.classroomio.com/phishing-detector/latest/index.html",
      "configSchema": {
        "difficulty": {
          "type": "select",
          "label": "Difficulty",
          "options": ["easy", "medium", "hard"],
          "default": "medium"
        },
        "rounds": {
          "type": "number",
          "label": "Number of rounds",
          "min": 3,
          "max": 10,
          "default": 5
        },
        "industry": {
          "type": "select",
          "label": "Industry context",
          "options": ["generic", "finance", "healthcare", "tech", "retail"],
          "default": "generic"
        }
      }
    }
  ]
}
```

ClassroomIO fetches `registry.json` at build time (SSG) or with a short TTL cache. The modal renders the list from this data.

---

## 9. Manifest Specification

Every Lab must include a `manifest.json` at its root.

```typescript
type Manifest = {
  slug: string;              // kebab-case, globally unique, immutable after first publish
  name: string;              // display name, max 50 chars
  description: string;       // max 160 chars
  tags: string[];            // from the approved tag list (see §11)
  author: {
    name: string;
    url?: string;
    email?: string;
  };
  version: string;           // semver
  estimatedMinutes: number;  // honest estimate for student
  minHeight: number;         // minimum iframe height in px the Lab needs to function
  changelog: string;         // human-readable summary of changes in this version
  configSchema: ConfigSchema;
  breakingChanges?: string;  // if semver major bump, describe what config keys changed
};

type ConfigSchema = Record<string, ConfigField>;

type ConfigField =
  | { type: 'text';     label: string; default?: string; maxLength?: number }
  | { type: 'number';   label: string; default?: number; min?: number; max?: number }
  | { type: 'boolean';  label: string; default?: boolean }
  | { type: 'select';   label: string; options: string[]; default?: string }
  | { type: 'multiselect'; label: string; options: string[]; default?: string[] };
```

---

## 10. Data Model

### `lab_block` (stored as part of lesson block)

This is a new block type stored within the existing lesson block structure.

```typescript
type LabBlock = {
  type: 'lab';
  labSlug: string;
  labVersion: string;           // pinned at time of insertion
  latestVersion: string;        // checked at load time from registry
  config: Record<string, unknown>;
  configHash: string;           // SHA-256 of JSON.stringify(config) — for audit
  passingScore: number | null;  // 0–100, null = no threshold
  maxAttempts: number | null;   // null = unlimited
};
```

### `lab_completion` (new table)

```typescript
type LabCompletion = {
  id: string;
  studentId: string;
  courseId: string;
  lessonId: string;
  blockId: string;              // references the specific lab block in the lesson
  labSlug: string;
  labVersion: string;           // version the student ran
  configHash: string;           // config snapshot at time of attempt
  attemptNumber: number;
  score: number | null;
  passed: boolean | null;
  durationSeconds: number;
  completedAt: Date;
  metadata: Record<string, unknown>;  // Lab's summary.details
};
```

### Indexes needed
- `(studentId, lessonId, blockId)` — for lesson progress checks
- `(courseId, labSlug)` — for org-level audit reporting
- `(studentId, courseId)` — for certification eligibility queries

---

## 11. Lab Catalog: Compliance-Focused Apps (v1)

The following Labs will be built and shipped as part of the initial release. All are targeted at the compliance training and certification niche.

### Lab 1: Phishing Detector
**Slug:** `phishing-detector`  
**Estimated time:** 5 min  
**Tags:** `cybersecurity`, `security-awareness`, `compliance`

The student sees a realistic email inbox with a mix of legitimate and phishing emails. They must classify each one (Safe / Suspicious / Phishing). After each decision, feedback explains the signals they should have spotted. At the end, they see a score and a breakdown of which emails tripped them up.

**Config options:** difficulty (easy/medium/hard), number of emails (3–10), industry context (generic/finance/healthcare/tech/retail).

**Pass threshold:** Teacher-configurable (e.g. must correctly identify 80% of emails).

---

### Lab 2: Incident Response Playbook
**Slug:** `incident-response`  
**Estimated time:** 8 min  
**Tags:** `cybersecurity`, `compliance`, `incident-management`

A security incident unfolds across 5–7 decision points. At each point the student reads a situation update and chooses from 3–4 options (e.g. "Escalate to CISO", "Contain the affected systems", "Wait for more information"). Wrong choices have cascading consequences shown in subsequent steps. The final score reflects how well the student contained the incident and followed correct procedure.

**Config options:** incident type (ransomware / data breach / insider threat / DDoS), organization size context, number of steps.

---

### Lab 3: Data Classification Sorter
**Slug:** `data-classifier`  
**Estimated time:** 4 min  
**Tags:** `data-privacy`, `compliance`, `gdpr`, `hipaa`

The student sees a stream of documents, data snippets, and file descriptions. They drag each item into the correct classification bucket: Public / Internal / Confidential / Restricted. Items are drawn from realistic workplace examples (HR records, marketing materials, customer PII, code repositories). Immediate feedback per item.

**Config options:** classification framework (generic / GDPR / HIPAA / PCI-DSS), item count (5–15), industry context.

---

### Lab 4: Social Engineering Detector
**Slug:** `social-engineering`  
**Estimated time:** 6 min  
**Tags:** `cybersecurity`, `security-awareness`, `compliance`

The student reads a realistic chat or phone call transcript that scrolls in real time (simulating live interaction). At key moments (every 2–3 exchanges), the transcript pauses and asks "What do you do?" with 3 options. The Lab tracks how many manipulation tactics the student identified correctly. At the end, annotated versions of the transcript highlight all the red flags.

**Config options:** scenario type (help desk impersonation / vendor impersonation / executive fraud), difficulty, number of decision points.

---

### Lab 5: Policy Adjudicator
**Slug:** `policy-adjudicator`  
**Estimated time:** 5 min  
**Tags:** `compliance`, `hr-compliance`, `ethics`, `finance`

The student reviews workplace scenarios one at a time — an expense claim, a gift from a vendor, a request to share data with a partner, a colleague asking for system access. For each scenario, they choose: Approve / Reject / Escalate. A relevant policy extract is available as a collapsible reference panel. Feedback after each decision cites the specific policy clause.

**Config options:** policy domain (expense / gifts-and-conflicts / data-sharing / access-control), number of scenarios, policy strictness (lenient / standard / strict).

---

### Lab 6: Hazard Spotter
**Slug:** `hazard-spotter`  
**Estimated time:** 5 min  
**Tags:** `health-safety`, `compliance`, `workplace-safety`

The student sees a detailed illustrated scene of a workplace (office, warehouse, lab, construction site). They must click on every safety hazard they can spot within a time limit. After submitting, all hazards are revealed and annotated. Score is based on hazards found versus missed and false positives (clicking something that is not a hazard).

**Config options:** workplace type, difficulty (hazard density), time limit, number of scenes.

---

### Lab 7: GDPR Rights Simulator
**Slug:** `gdpr-rights`  
**Estimated time:** 6 min  
**Tags:** `data-privacy`, `gdpr`, `compliance`

The student takes the role of a Data Protection Officer handling a set of incoming data subject requests (right to access, right to erasure, right to portability, right to object). For each request, they must decide: what action to take, within what timeframe, and what to communicate back to the subject. Feedback references the correct GDPR articles.

**Config options:** request types to include, jurisdiction variants (EU GDPR / UK GDPR / CCPA), number of requests.

---

### Lab 8: Password & MFA Hygiene
**Slug:** `password-hygiene`  
**Estimated time:** 4 min  
**Tags:** `cybersecurity`, `security-awareness`, `compliance`

An interactive two-part exercise: (1) the student rates a set of passwords as strong/weak and explains why, then sees annotated feedback; (2) the student walks through setting up MFA on a simulated account interface, choosing the most secure method from the options presented.

**Config options:** password count, MFA methods to include (authenticator app / SMS / hardware key).

---

## 12. Approved Tag List (v1)

Tags govern how Labs are organized in the marketplace picker. Only approved tags may be used in `manifest.json`.

```
cybersecurity         — Threats, attacks, defenses
security-awareness    — Recognition and behavior change
compliance            — Regulatory and policy adherence
data-privacy          — GDPR, HIPAA, CCPA, PII handling
gdpr                  — GDPR-specific
hipaa                 — HIPAA-specific
pci-dss               — PCI-DSS-specific
hr-compliance         — Workplace policy, harassment, ethics
health-safety         — Physical safety, hazard recognition
workplace-safety      — Overlaps health-safety, more procedural
incident-management   — Response procedures
data-management       — Classification, retention, handling
finance               — Expense policy, fraud awareness
ethics                — Conflicts of interest, gifts
access-control        — Identity, permissions, least privilege
```

---

## 13. Marketplace / Contribution Model

### Repository
`github.com/classroomio/classroomio-labs` — public, open source (MIT).

### Directory Structure
```
classroomio-labs/
  apps/
    {slug}/
      index.svelte
      manifest.json
      preview.png          (800×450 static image)
      preview.gif          (optional, ≤ 2MB animated demo)
      README.md            (required — describes the Lab, config options, pedagogy)
  sdk/
    src/
      index.ts             (postMessage helpers, TypeScript types, constants)
    harness/
      index.html           (local dev simulator — simulates ClassroomIO host)
      harness.ts
  packages/
    create-lab/            (CLI scaffolding tool — `npx create-classroomio-lab`)
  docs/
    contributing.md
    manifest-spec.md
    postmessage-spec.md
    design-guidelines.md
  scripts/
    build.ts
    validate.ts
    release.ts
```

### Contribution Flow
1. Developer runs `npx create-classroomio-lab` — scaffolds a new directory with a starter `index.svelte`, a `manifest.json` template, and links to the design guide.
2. Developer builds the Lab locally using `pnpm dev --lab={slug}` which opens the harness in the browser, simulating the `init` message flow.
3. Developer submits a PR with the new `apps/{slug}/` directory.
4. CI runs:
   - Manifest validation (schema check, slug uniqueness, semver format).
   - Contract validation (does the compiled Lab respond to `init` and emit `ready` and `complete`?).
   - Lighthouse accessibility audit (must pass score ≥ 80).
   - Visual regression (snapshot of the compiled Lab at 1280px and 768px).
5. ClassroomIO team reviews for pedagogical quality and content accuracy.
6. Merged to `main` → CI builds and deploys to CDN → registry.json updated → appears in marketplace.

### SDK (`sdk/src/index.ts`)

The SDK is a tiny TypeScript module that Lab authors import to simplify the postMessage protocol:

```typescript
import { LabSDK } from '@classroomio/lab-sdk';

const lab = new LabSDK();

lab.onInit((payload) => {
  // payload.mode, payload.config, payload.context
  initializeApp(payload);
});

lab.onConfigUpdate((config) => {
  updatePreview(config);
});

lab.complete({
  score: 85,
  passed: true,
  durationSeconds: 243,
  summary: {
    headline: 'You caught 4 out of 5 phishing emails',
    details: { caught: 4, missed: 1, falsePositives: 0 }
  }
});

lab.progress({ percent: 60, label: 'Round 3 of 5' });
```

### Design Guidelines for Contributors

Labs must follow these design rules to maintain visual consistency and quality:

- Use the Lab SDK's provided CSS variables for color (the SDK ships a minimal design token CSS file).
- Minimum touch target size: 44×44px.
- No external fonts. Use system font stack.
- Must be usable at 320px viewport width and above.
- Text must meet WCAG AA contrast ratio (4.5:1 for body text).
- All interactive elements must be keyboard accessible.
- No autoplay audio or video.
- Animations must respect `prefers-reduced-motion`.

---

## 14. Security & Sandboxing

| Threat | Mitigation |
|--------|-----------|
| Lab makes network requests | `connect-src: 'none'` CSP + iframe `sandbox` attribute removes fetch/XHR ability |
| Lab attempts top-level navigation | `sandbox="allow-scripts"` without `allow-top-navigation` |
| Lab reads student PII | Only opaque `studentId` token passed; no email, name, or org data |
| Lab exfiltrates config data | `frame-ancestors` CSP restricts who can embed the Lab |
| Malicious Lab code in marketplace | PR review process + CI contract validation + manifest schema validation |
| postMessage spoofing (non-lab origin) | ClassroomIO checks `event.origin === 'https://labs.classroomio.com'` before processing |
| Compromised CDN | Subresource integrity (SRI) hash stored per Lab version in registry.json; iframe src checked against it |
| Config injection | Config is JSON-serialized and passed as a structured message, never eval'd |

---

## 15. Accessibility Requirements

- All Labs must achieve Lighthouse accessibility score ≥ 80 (enforced in CI).
- Labs must be operable by keyboard alone.
- Labs must provide appropriate ARIA labels on all interactive elements.
- Labs must not rely solely on color to convey meaning.
- ClassroomIO wrapper around the iframe must have `title` attribute describing the Lab.
- The "Start" overlay and result overlay rendered by ClassroomIO (not the Lab) fully comply with WCAG AA.

---

## 16. Versioning Strategy

Labs use **semver** (`MAJOR.MINOR.PATCH`).

| Change | Version bump |
|--------|-------------|
| Bug fix, visual tweak, wording change | `PATCH` |
| New config option (backwards-compatible default) | `MINOR` |
| Existing config option renamed or removed | `MAJOR` |
| Scoring algorithm changes (affects pass/fail) | `MAJOR` |
| Core interaction mechanic changes | `MAJOR` |

**Lesson blocks pin to the exact version used when the teacher configured the Lab.** The block continues to load that version even after newer versions are published. The editor shows an upgrade prompt for minor and major updates.

**For major version upgrades:** ClassroomIO warns the teacher that the config schema has changed and may need to be reconfigured. It does not auto-migrate config. Students who already passed under an older major version are not required to redo it unless the teacher explicitly resets completions.

---

## 17. Teacher UX Flow (End-to-End)

```
Lesson Editor
    │
    ├─ Click "+ Add Block"
    │
    ├─ Block Picker → select "Lab"
    │
    ├─ Lab Picker Modal opens
    │       ├─ Browse / search / filter by tag
    │       ├─ Select "Phishing Detector"
    │       │
    │       └─ Configuration Step
    │               ├─ Left panel: config form (from configSchema)
    │               │     difficulty: [Medium ▼]
    │               │     rounds: [5]
    │               │     industry: [Finance ▼]
    │               │     pass score: [80%]
    │               │     max attempts: [Unlimited ▼]
    │               │
    │               └─ Right panel: live iframe preview (teacher mode)
    │                     updates as config changes
    │
    ├─ Click "Add Lab"
    │
    └─ Lab Block appears in lesson
            ├─ Shows: name, thumbnail, configured version
            ├─ "Preview as Student" button → opens modal with student mode iframe
            └─ "Configure" button → reopens config modal
```

---

## 18. Student UX Flow (End-to-End)

```
Lesson Page
    │
    ├─ Student scrolls to Lab block
    │
    ├─ Lab block shows:
    │       ├─ Lab name + description
    │       ├─ Estimated time: ~5 min
    │       ├─ Pass required: 80%
    │       └─ [Start Lab] button
    │
    ├─ Student clicks "Start Lab"
    │       └─ Iframe loads in student mode with teacher config
    │
    ├─ Student interacts with Lab
    │       ├─ Progress bar updates (from `progress` events)
    │       └─ Lab can request fullscreen expand
    │
    ├─ Lab emits `complete`
    │
    ├─ Result overlay appears (rendered by ClassroomIO):
    │       ├─ Score: 84/100
    │       ├─ ✅ Passed (required: 80%)
    │       ├─ "You caught 4 out of 5 phishing emails"
    │       └─ [Continue Lesson] or [Try Again]
    │
    └─ Lab block marked complete ✅ in lesson progress
```

---

## 19. AI Assistant Integration

The existing ClassroomIO AI assistant (used by teachers) can recommend Labs contextually.

- When a teacher is editing a lesson on a topic (e.g. "Identifying Phishing Attacks"), the AI assistant can suggest: *"Would you like to add a Phishing Detector lab to give students hands-on practice with this topic?"*
- The AI assistant can call the existing lesson content tools to insert a Lab block with a pre-set config.
- The AI does not generate Lab code. It only selects from the available registry and configures from known config schemas.

Tool to expose to the AI assistant:

```typescript
insert_lab_block({
  lessonId: string,
  afterBlockId: string,
  labSlug: string,
  config: Record<string, unknown>,
  passingScore?: number,
  maxAttempts?: number
})
```

---

## 20. Analytics & Reporting

### Teacher-level analytics (per Lab block)
- Completion rate (% of enrolled students who completed the Lab)
- Pass rate (% of completions that passed the threshold)
- Average score
- Average number of attempts
- Average time on Lab
- Score distribution histogram

### Org-level analytics (compliance dashboard)
- Labs completed per student per course
- Labs failed / retried per student
- Aggregate pass rates across the organization by tag (e.g. "cybersecurity Labs: 73% pass rate")
- Downloadable CSV of all `lab_completion` records for audit

### Lab-level analytics (for marketplace contributors — anonymized)
- Total completions across all ClassroomIO instances
- Average score by difficulty
- Average time to complete
- Most common failure points (from `metadata.details` aggregated anonymously)

---

## 21. Success Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Labs added to lessons (teacher adoption) | 30% of active courses have ≥ 1 Lab block |
| Student engagement | ≥ 85% of students who reach a Lab block start it |
| Student completion | ≥ 75% of started Labs reach the `complete` event |
| Marketplace growth | ≥ 12 Labs published (8 internal + 4 community) |
| Completion record accuracy | 0 data loss incidents on completion records |
| Developer experience | Median time from `npx create-classroomio-lab` to first `complete` event in harness ≤ 30 min |

---

## 22. Phased Roadmap

### Phase 1: Foundation (Weeks 1–6)
- [ ] `classroomio-labs` repository scaffold (SDK, harness, build pipeline, manifest spec)
- [ ] `npx create-classroomio-lab` CLI scaffold
- [ ] postMessage interface implemented in ClassroomIO lesson viewer
- [ ] Lab block type in lesson editor (add, configure, reorder, delete)
- [ ] Lab Picker Modal (from local registry.json fixture)
- [ ] Teacher Mode and Student Mode iframe wrappers
- [ ] Completion tracking (database table + API endpoint)
- [ ] CDN deployment pipeline
- [ ] **Lab 1: Phishing Detector** (first Lab, used to validate entire stack)

### Phase 2: Compliance Pack (Weeks 7–12)
- [ ] Marketplace picker connected to live registry.json from CDN
- [ ] Version badge on Lab blocks (upgrade available notification)
- [ ] Retry policy configuration for teachers
- [ ] Pass threshold enforcement in lesson progress
- [ ] **Labs 2–5:** Incident Response, Data Classifier, Social Engineering Detector, Policy Adjudicator
- [ ] Org-level Lab completion reporting in admin dashboard

### Phase 3: Ecosystem (Weeks 13–20)
- [ ] Public marketplace website (`labs.classroomio.com`) with filtering, search, previews
- [ ] Contribution documentation and design guidelines published
- [ ] CI contract validation and accessibility checks live
- [ ] AI assistant Lab recommendation integration
- [ ] **Labs 6–8:** Hazard Spotter, GDPR Rights Simulator, Password Hygiene
- [ ] Analytics dashboard for teachers (completion rate, pass rate, score distribution)
- [ ] Community contributions open

### Phase 4: Scale (Months 6+)
- [ ] Monetization model for third-party Lab developers (revenue share)
- [ ] Org-level custom Lab hosting (private Labs not in public marketplace)
- [ ] Lab A/B testing (two configs, random assignment, compare outcomes)
- [ ] Offline support (Service Worker caching of Lab iframe for LMS environments with limited connectivity)

---

## 23. Open Questions

| # | Question | Owner | Priority |
|---|----------|-------|----------|
| 1 | Should completion records count toward LMS-grade exports (SCORM/xAPI)? If so, Labs may need to emit xAPI statements. | Product + Engineering | High |
| 2 | What is the SLA for CDN availability? Labs blocking lesson progress means CDN downtime = blocked students. Need fallback (graceful degradation: show "Lab temporarily unavailable, lesson progress unblocked"). | Engineering | High |
| 3 | Do Labs need to support RTL languages? Several target compliance markets (Middle East, Israel) are RTL. | Design | Medium |
| 4 | Can a teacher build a private Lab (not published to the marketplace) and use it in their org? This needs a private hosting model. | Product | Medium |
| 5 | Should the AI assistant be able to configure a Lab it recommends, or only suggest and require the teacher to configure manually? | Product | Medium |
| 6 | For HIPAA and other regulated contexts, can the `metadata.details` stored in `lab_completion` contain anything that could be considered PHI? Need a data handling policy. | Legal + Engineering | High |
| 7 | What is the review SLA for community Lab submissions? A slow review process kills ecosystem momentum. | Community | Medium |
| 8 | Should Labs support multiple languages, or is the teacher responsible for picking a language-appropriate Lab? | Product | Low |

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| Lab | A single interactive activity app, built as one Svelte file, embedded in a lesson via iframe |
| Lab Block | A lesson content block of type `lab`, storing the slug, version, and config for one Lab |
| Manifest | A `manifest.json` file in each Lab's directory describing its metadata and config schema |
| Config | A JSON object of teacher-set values passed to the Lab at `init` time |
| Config Schema | A JSON schema in `manifest.json` that describes what config fields the Lab accepts |
| Registry | `registry.json` — the CDN-hosted catalog of all published Labs |
| Teacher Mode | The iframe mode where the Lab renders its configuration UI and preview |
| Student Mode | The iframe mode where the Lab renders its interactive experience |
| Complete Event | The `postMessage` event emitted by a Lab when the student finishes the activity |
| Harness | A local browser simulator that mimics the ClassroomIO host for Lab development |

---

## Appendix B: Rejected Alternatives

**Why not iframes served from the same origin?**  
Same-origin iframes can access parent window globals and DOM, defeating the sandbox. Cross-origin is required for security isolation.

**Why not Web Components?**  
Web Components run in the same JS context as the lesson page — no sandboxing, no isolation. Any Lab bug could crash the whole lesson page.

**Why not a JSON-based DSL for building Labs?**  
A DSL limits what Labs can express. The single-Svelte-file model gives contributors full control over interaction design, which is exactly what makes interesting Labs possible. The postMessage interface provides the structural constraint without constraining the experience.

**Why not embed Labs as full pages with their own routing?**  
Labs are inherently sub-page components — they belong inside a lesson, alongside other content. Routing to a separate page breaks the lesson flow and makes it impossible to have multiple Labs per lesson.
