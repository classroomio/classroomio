# A plugin framework pattern for ClassroomIO

A proposed **simple** framework pattern that anyone could use to build plugins for ClassroomIO,
with the explicit goal of driving open-source adoption through simplicity — simple enough that a
weekend contributor could rebuild the kinds of plugins Moodle has.

This is exploratory design, not a build plan; it describes the pattern and the seams it would
reuse.

---

## The key insight: the hard parts already exist, unnamed

1. **`@cio/question-types`** is already a plugin system in disguise. It is a **registry of typed
   definitions** (key + id + capability flags + a render contract + an answer serializer), it is
   UI-agnostic, and `apps/dashboard`, `apps/api`, and `@cio/ui` all consume the _same contract_.
   That is exactly how Moodle's `qtype` plugins work — a registry + a contract everyone renders
   against. (`packages/question-types/README.md`.)
2. **`apps/embeds`** is already a **sandboxed UI runtime**: CDN-hosted ES-module bundles with a
   `mount(el)` contract, a hosted iframe (`embed.classroomio.com/course-widget?key=…`), a
   payload API host injected as `window.CIO.apiBaseUrl`, and a bootstrap/lazy-chunk loader. That
   is the browser half of a plugin runtime. (`apps/embeds/README.md`.)
3. **Outbound webhooks + REST API** are already the signed, event-driven logic surface.
   (`prd/webhooks/README.md`.)

The framework is: take the "registry + contract" idea from question-types, the "iframe + mount +
scoped host API" idea from embeds, and the "signed events + REST" idea from webhooks, and unify
them behind one manifest and one SDK.

## The framework in one sentence

> A plugin is a **folder with a manifest** that fills one or more **extension points** using one
> of three **primitives** (provide, hook, page), runs in one of three **runtime tiers**
> (declarative, sandboxed browser, out-of-process server), and declares the **permissions** it
> needs.

---

## 1. Plugin anatomy (what an author creates)

A single folder:

- `cio-plugin.json` — the manifest (the only required file)
- `src/…` — one entry file per extension point
- `README.md`, `icon.svg`

Manifest example (a plugin that adds a new question type _and_ a report widget):

```json
{
  "id": "acme.flashcard",
  "name": "Flashcard Question",
  "version": "1.0.0",
  "author": "Acme",
  "license": "MIT",
  "permissions": ["exercise:read", "submission:read"],
  "extensionPoints": [
    { "point": "question-type", "runtime": "browser", "entry": "src/flashcard.ts" },
    { "point": "report-widget", "runtime": "browser", "entry": "src/report.ts" }
  ]
}
```

The entire surface a beginner must understand: **which slot, what runtime, which file.**

## 2. Three primitives (the entire mental model)

Kept to three verbs so it is learnable in five minutes:

- **Provide** — "I add a new _kind of thing_." Register a definition that conforms to an
  extension point's contract (a question type, a certificate template, an auth method). This is
  the **Moodle plugin-type** model.
- **Hook** — "I react to or modify something at a defined point." `on('enrollment.completed', fn)`
  (action) and `filter('certificate.render', fn)` (filter). This is the **WordPress** model, and
  it maps 1:1 onto the existing webhook event catalog.
- **Page** — "I add a screen or panel in the dashboard." A nav entry + an iframe-mounted UI.
  This is the **VS Code / Grafana-app** model, and it reuses `apps/embeds`.

Everything a plugin can do is one of these three.

## 3. Extension-point catalog (the Moodle-parity map)

Each extension point is a named slot with a typed contract in a package such as
`@classroomio/plugin-sdk`. They can ship incrementally; each new slot unlocks a whole category
of community plugins.

| Extension point                    | Primitive             | Maps to Moodle type   | Reuses in the stack                              |
| ---------------------------------- | --------------------- | --------------------- | ----------------------------------------------- |
| `question-type`                    | provide               | `qtype`               | `@cio/question-types` contract (already exists) |
| `lesson-block` / `content-block`   | provide               | `mod` (activity)      | lesson renderer + embeds iframe                 |
| `course-format`                    | provide               | `format`              | course shell renderer + embeds iframe (gap; see gap analysis) |
| `report-widget`                    | provide               | `report` / `block`    | dashboard + iframe (Grafana-panel style)        |
| `dashboard-page`                   | page                  | `local` / admin `tool`| nav + embeds iframe                             |
| `certificate-template`             | provide (declarative) | —                     | existing certificate engine                     |
| `auth-provider`                    | provide               | `auth`                | Better Auth                                     |
| `enrollment-method`                | provide               | `enrol`               | invite/enrollment services                      |
| `event-handler` / `integration`    | hook                  | messaging/notification| webhooks (`emitWebhookEvent`) + REST            |
| `ai-tool`                          | provide               | —                     | `@classroomio/mcp`                              |
| `content-importer`                 | provide               | `qformat` / repository| SCORM/Moodle-backup/CSV import                  |
| `theme`                            | provide (declarative) | `theme`               | org theming (declarative only on cloud)         |

Starting with `question-type` gives immediate, visible Moodle parity because the contract is
already built.

## 4. Runtime tiers (how one manifest stays safe on cloud and powerful on self-host)

One plugin format, three ways to run it:

- **`declarative`** — pure JSON/config, no code at all (certificate templates, themes, simple
  field definitions). Zero security risk; runs anywhere.
- **`browser`** — UI code runs in a **sandboxed iframe on a separate origin** (reusing the
  embeds runtime). It never touches the dashboard's DOM or cookies; it talks to the host only
  through a typed `postMessage` bridge that the SDK provides. Host API calls are **proxied
  through the bridge**, which enforces (a) the plugin's declared `permissions` and (b) the
  current user's own capabilities. This is the Figma/VS Code model and it is safe even for
  untrusted community plugins on multi-tenant cloud.
- **`server`** — logic that needs a backend runs **out-of-process**: the author hosts a tiny
  HTTP handler, and ClassroomIO calls it with **HMAC-signed requests** (identical scheme to
  webhooks: `X-Cio-Signature-256` over `<timestamp>.<body>`), while the handler calls back via a
  **scoped API key**. This is the LTI/webhook model — the plugin's server code never runs in
  ClassroomIO's process.

Escape hatch for **self-hosted installs only**: a `server-native` tier that loads the plugin as
an in-process Node module (full power, like Moodle). Because self-hosters own their box, they
accept that trust — the same bargain Moodle makes. Cloud refuses to load `server-native`
plugins. **One format, trust scales with the deployment.**

## 5. Permissions (capability-based, declared up front)

The manifest lists **scopes** (`exercise:read`, `submission:write`, `enrollment:read`,
`user:email`, …). At install time the org admin sees exactly what the plugin can access and
approves it (GitHub-app style). The bridge and the signed-request layer both enforce these
scopes, intersected with the acting user's own permissions. This is the capability whitelist
from the sandbox research, and it is what lets the door open to community code.

## 6. The smallest possible plugin (proof it is simple)

Because the question-type contract already exists, a brand-new question type is basically **one
definition object** conforming to the SDK contract — capability flags, three renderers, and a
serializer/scorer:

```ts
import { defineQuestionType } from '@classroomio/plugin-sdk';

export default defineQuestionType({
  key: 'FLASHCARD',
  label: 'Flashcard',
  capabilities: { autoGradable: true, supportsPartialCredit: false },
  renderers: { edit: EditView, take: TakeView, preview: PreviewView },
  serialize: (q, answer) => ({ questionId: q.id, answer }),
  score: (q, answer) => (answer === q.correct ? 1 : 0)
});
```

This maps directly onto `ExerciseRendererDefinition`, the render contract, capability flags, and
`serializeExerciseAnswer` that already exist. A contributor can rebuild any Moodle question type
in a single file.

## 7. The developer experience that drives open-source attention

Simplicity of the _runtime_ is not enough; ecosystems explode because of **tooling**. Three
things matter most:

- **A scaffolder** — `npm create @classroomio/plugin@latest` → pick an extension point → get a
  working plugin with manifest, entry, and a local harness. (`@classroomio/mcp` already exists,
  so the npm org is there.)
- **A local mock host / dev harness** — a `cio-plugin dev` command boots a fake ClassroomIO
  (like the embeds dev harness at `:5180`) that serves the extension point live, with mock data
  and the same permission enforcement, so nobody needs a full ClassroomIO install to build. This
  is the single biggest adoption lever.
- **A registry + review tiers** — a plugin directory (mirroring Moodle's) with **first-party /
  verified / community** trust tiers; community `browser`/`server` plugins are safe by
  construction, `server-native` is self-host-only, and verified/first-party get signed. Install
  is per-org via `/settings/integrations`.

## 8. A sensible ordering (lowest effort → highest breadth)

Described here as sequencing, not a commitment:

1. `@classroomio/plugin-sdk` with the manifest schema + the three primitives + the permission
   model, and wire up `question-type` first (the contract is already done → immediate
   Moodle-qtype parity).
2. `event-handler` / `integration` hooks on top of the existing webhook catalog (turns every
   webhook into a plugin hook for free).
3. `browser` runtime + `dashboard-page` / `report-widget` by generalizing `apps/embeds` into a
   plugin host.
4. Scaffolder + local harness + registry (the open-source flywheel).
5. Add `lesson-block`, `course-format`, `certificate-template`, `auth-provider`,
   `enrollment-method`, `content-importer`, `ai-tool` one slot at a time.

---

## Net

ClassroomIO does not need a new architecture. It needs to **name and generalize
`@cio/question-types` (contracts/registry) + `apps/embeds` (sandboxed UI) + webhooks/REST
(signed logic)** behind one `cio-plugin.json` manifest, one `@classroomio/plugin-sdk`, three
primitives (provide/hook/page), and three runtime tiers. That is simple enough for a weekend
contributor and broad enough to reach Moodle-level plugin coverage.
