# ADR 001: ClassroomIO Plugin Architecture & Implementation Conventions

- **Status**: Accepted & Enforced
- **Date**: 2026-09-15
- **Author**: ClassroomIO Core Engineering
- **Applies to**: `plugins/**`, `packages/sdk/**`, `classroomio.config.ts`

---

## 1. Context & Motivation

ClassroomIO is transitioning from hardcoded platform features to a composable, extensible plugin architecture. Unlike legacy LMS platforms (e.g. Moodle) which rely on sprawling XML manifests, arbitrary SQL access, and unverified global hooks, ClassroomIO plugins are:

1. **TypeScript-first & in-process**: Plugins are pure TypeScript modules defined with `@cio/sdk`. Autocomplete and compiler diagnostics provide immediate feedback.
2. **Strictly sandboxed by tenant & permissions**: Multi-tenant isolation (`orgId`) and declared permission scopes are non-negotiable.
3. **Rigidly validated at build and test time**: The SDK runtime (`definePlugin`, `resolveConfig`) acts as a compile-time and import-time gatekeeper. If any convention is broken, tests fail immediately.

This ADR serves as the **contract for all team members and third-party contributors**. Any pull request introducing or modifying a plugin that violates these conventions will fail automated test suites (`vitest`, `turbo run test`, CI).

---

## 2. Decision: The Plugin Architecture Standards

Every ClassroomIO plugin must strictly adhere to the following 10 pillars:

```
plugins/
└── {category}/
    └── {plugin-slug}/
        ├── index.ts              # Entry point exporting default definePlugin(...)
        ├── components/           # Svelte UI components (preview, widgets, modales)
        │   └── *.svelte
        ├── utils/                # Pure helper functions, URL builders, serializers
        │   └── *.ts
        ├── tests/                # Plugin unit and integration tests
        │   └── *.test.ts
        └── template.ts           # (Optional) Template renderers (e.g. for certificates)
```

---

### Pillar 1: Directory Structure & File Placement

Plugins must be located under the top-level `plugins/` directory, organized strictly by category:

`plugins/<category>/<plugin-slug>/index.ts`

- The `<category>` folder name **must** be one of the six approved categories:
  - `activity` — Custom learning activity engines (e.g., flashcards, interactive role-play).
  - `block` — Dashboard widgets and sidebar content blocks.
  - `integration` — Third-party connectors, social sharing, external APIs, and webhook responders.
  - `certificate` — Custom certificate themes, renderers, and credential badges.
  - `landing` — Public landing page sections, hero units, and footer elements.
  - `enrollment` — Custom admission, payment, or invitation flows.
- The directory name `<plugin-slug>` must be kebab-case (e.g., `certificate-modern-gold`, `linkedin-certificate`, `xp-leaderboard`).
- The primary entry point **must** be named `index.ts`.

---

### Pillar 2: Factory Function Pattern & Mandatory `definePlugin()`

A plugin must be exported as a **named factory function** that returns the result of calling `definePlugin()` from `@cio/sdk`, and must also be re-exported from the central barrel at `plugins/index.ts`.

```ts
// plugins/certificate/certificate-modern-gold/index.ts
import { definePlugin, type PluginDefinition } from '@cio/sdk';

export interface ModernGoldCertificateOptions {
  description?: string;
}

export function modernGoldCertificate(options: ModernGoldCertificateOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'certificate_modern_gold',
    name: 'Modern Gold Certificate',
    version: '1.0.0',
    category: 'certificate',
    description: options.description ?? 'A prestigious dark slate and gold certificate template.',
    // ...
  });
}

export default modernGoldCertificate;
```

#### Central Barrel Export (`plugins/index.ts`)
All in-tree plugins must be re-exported from the central `plugins/index.ts` barrel:

```ts
// plugins/index.ts
export { modernGoldCertificate, type ModernGoldCertificateOptions } from './certificate/certificate-modern-gold';
export { linkedinCertificate, type LinkedInCertificateOptions } from './integration/linkedin-certificate';
```

Then in `classroomio.config.ts`, consumers import and invoke plugins cleanly:

```ts
import { defineConfig } from '@cio/sdk';
import { topNav } from '@cio/sdk/layouts';
import { linkedinCertificate, modernGoldCertificate } from './plugins';

export default defineConfig({
  layout: topNav(),
  plugins: [
    linkedinCertificate(),
    modernGoldCertificate({ description: 'Custom description' })
  ]
});
```

> **Why tests fail if raw objects bypass `definePlugin()`**:  
> `definePlugin()` registers the plugin object in an internal SDK `WeakSet`. When `classroomio.config.ts` passes the plugin to `resolveConfig()`, `isDefinedPlugin()` checks for membership in this `WeakSet`. Passing a raw object literal bypasses validation and throws:
> `Error: [ClassroomIO SDK] Plugin at index 0 must be created with definePlugin().`

---

### Pillar 3: Plugin ID & Naming Conformance

The `id` property is the permanent unique identifier for the plugin across databases, migrations, and event dispatches.

- **Regex rule**: `/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/`
  - Only lowercase letters, digits, and single underscores.
  - No uppercase letters, hyphens, double underscores, or trailing underscores.
- **Prefix rule**: The `id` **must start with `${category}_`**.

| Category | Valid Plugin ID | Invalid Plugin ID (Fails Tests) |
| :--- | :--- | :--- |
| `certificate` | `certificate_modern_gold` | `modern_gold` *(missing category prefix)* |
| `integration` | `integration_linkedin_cert` | `integration-linkedin-cert` *(contains hyphens)* |
| `activity` | `activity_role_play` | `Activity_role_play` *(contains uppercase)* |
| `block` | `block_xp_counter` | `block__xp__counter` *(double underscore)* |

---

### Pillar 4: Semantic Versioning (`version`)

The `version` field must strictly comply with official SemVer 2.0 (tested via regex).

- **Valid**: `'1.0.0'`, `'0.1.0'`, `'2.1.3-beta.1'`
- **Invalid**: `'1'`, `'v1.0.0'`, `'1.0'`, `'01.0.0'`

---

### Pillar 5: Slot Registrations & Dynamic Component Loaders

Plugins inject UI into ClassroomIO via slots.

```ts
slots: {
  'certificate.template': () => import('./preview.svelte'),
  'certificate.actions': () => import('./components/linkedin-button.svelte'),
  'dashboard.widgets': [
    () => import('./components/widget-a.svelte'),
    () => import('./components/widget-b.svelte')
  ]
}
```

1. **Only registered slot names from `SLOT_NAMES` are permitted**:
   - `lesson.activity`
   - `lesson.sidebar`
   - `course.sidebar`
   - `course.format`
   - `lesson.after`
   - `landing.sections`
   - `landing.hero.after`
   - `landing.footer.before`
   - `certificate.template`
   - `certificate.actions`
   - `enrollment.flow`
2. **Lazy Dynamic Imports Only**:  
   Slot handlers **must be dynamic loader functions** returning a promise (e.g., `() => import('./widget.svelte')`).  
   **Do NOT pass component references directly** (e.g., `slots: { 'lesson.sidebar': MyWidget }`). Static imports bloat the initial bundle and trigger runtime validation errors.

---

### Pillar 6: Event Hooks (`on`)

Plugins react to core domain events using the `on` object.

```ts
on: {
  'lesson.completed': async (event, ctx) => {
    // payload: { userId, courseId, lessonId, orgId }
  },
  'exercise.graded': async (event, ctx) => {
    // payload: { userId, exerciseId, score, maxScore, orgId }
  }
}
```

- **Only registered hook names from `HOOK_NAMES` are permitted**:
  - `lesson.completed`
  - `exercise.graded`
  - `student.enrolled`
  - `course.published`
  - `certificate.issued`
- Hook names outside this list throw validation errors on import.
- Handlers must be idempotent and non-blocking.

---

### Pillar 7: Custom Data Storage via `defineEntity()`

Plugins must **never** execute raw database queries or write untyped payloads into core database tables. If a plugin requires persistent state, it must define typed entities.

```ts
import { defineEntity } from '@cio/sdk';

export const xpPointsEntity = defineEntity('xp_points', {
  scope: ['org', 'user'],
  fields: {
    points: { type: 'int', default: 0, required: true },
    level: { type: 'int', default: 1 }
  }
});
```

1. **Mandatory helper**: Entities must be created using `defineEntity()`. Raw schemas throw:
   `Plugin entities must be created with defineEntity().`
2. **Multi-tenant scoping**: `scope` must be an array containing valid scopes (`'org'`, `'course'`, `'lesson'`, `'user'`). Every entity record is permanently isolated by `orgId`.
3. **Repository access**: Plugins manipulate records through `ctx.data[entityName]` (`findOne`, `findMany`, `insert`, `update`, `upsert`, `delete`).

---

### Pillar 8: Mandatory Privacy Manifest When Declaring Entities

**Strict GDPR & Privacy Rule**: If a plugin declares one or more `entities`, it **must** declare a `privacy` manifest in its plugin definition.

```ts
export default definePlugin({
  id: 'integration_xp_leaderboard',
  // ...
  entities: [xpPointsEntity],
  privacy: {
    description: 'Stores cumulative gamification XP and level progress per user per organisation.',
    storesPersonalData: true,
    onDeleteUser: async (userId: string, orgId: string) => {
      // Logic to purge user records upon account deletion
    },
    onExportUser: async (userId: string, orgId: string) => {
      // Logic to return user records for GDPR data takeout requests
      return {};
    }
  }
});
```

> **Why tests fail if omitted**:  
> `resolveConfig()` verifies that any plugin storing data provides an audit description and lifecycle handlers for data deletion (`onDeleteUser`) and portability (`onExportUser`). Omitting `privacy` when `entities.length > 0` throws:
> `Error: [ClassroomIO SDK] Plugin "..." declares entities but is missing a required privacy manifest.`

---

### Pillar 9: Declared Permission Scopes (`permissions`)

Plugins operate under least-privilege principles. If a plugin interacts with core models, it must declare its scopes:

- Allowed scopes from `PERMISSION_SCOPES`:
  - `exercise:read`
  - `submission:write`
  - `enrollment:read`
  - `completion:write`
  - `grade:write`
  - `data:own`
  - `public:read`
- Any undeclared scope string throws validation errors on import.

---

### Pillar 10: Mandatory Test Suite for Every Plugin

Every plugin submitted to `plugins/` must have automated unit/integration tests located in `plugins/<category>/<plugin-slug>/tests/` (or dogfooded in `packages/sdk/tests/`).

The test suite **must assert**:
1. **Manifest Validity**: Resolving the plugin with `defineConfig` and `resolveConfig` produces no errors.
2. **Category & ID Conformance**: Verifies ID prefix matches category.
3. **Slot Integrity**: Verifies registered slots exist in `resolved.slots`.
4. **Domain Logic**: Tests pure functions, URL generators, score multipliers, or certificate renderers.
5. **GDPR/Privacy Handlers**: If entities are defined, verifies `onDeleteUser` and `onExportUser` execute cleanly.

---

## 3. Quick Reference Matrix

| Feature | Allowed Values | Failure Case |
| :--- | :--- | :--- |
| **Category** | `activity`, `block`, `integration`, `certificate`, `landing`, `enrollment` | `ZodError: Invalid enum value` |
| **Plugin ID** | `${category}_[a-z0-9_]+` | `Error: Plugin id does not match declared category` |
| **Version** | Strict SemVer (`1.0.0`) | `Error: Plugin version must be valid semver` |
| **Slots** | Registered names from `SLOT_NAMES` | `Error: Unknown plugin slot "..."` |
| **Slot Loaders** | `() => import(...)` | `Error: Plugin UI registrations must be dynamic import loader functions` |
| **Hooks** | Registered names from `HOOK_NAMES` | `Error: Unknown plugin hook "..."` |
| **Entities** | Created via `defineEntity()` | `Error: Plugin entities must be created with defineEntity()` |
| **Privacy** | Required if `entities` is present | `Error: Plugin declares entities but is missing a required privacy manifest` |
| **Permissions** | Subset of `PERMISSION_SCOPES` | `Error: Invalid permission scope` |

---

## 4. How to Create a New Plugin (Step-by-Step)

1. Create directory `plugins/<category>/<my-plugin>/`.
2. Create `index.ts` with `definePlugin(...)`.
3. If providing UI, add Svelte components under `components/` and expose them via lazy slot loaders in `slots`.
4. If storing data, declare `defineEntity(...)` and include the mandatory `privacy` block.
5. Add test coverage under `tests/<my-plugin>.test.ts`.
6. Register the plugin in root `classroomio.config.ts`.
7. Run `pnpm --filter @cio/sdk test` to ensure all system tests pass.

---

## 5. Consequences

- **Positive**:
  - No configuration drift or broken manifests.
  - Zero chance of third-party plugins executing unauthorized SQL.
  - Full GDPR compliance built-in from day one.
  - Complete type safety and autocomplete in developer IDEs.
- **Negative / Constraints**:
  - Contributors must learn the SDK helpers (`definePlugin`, `defineEntity`) rather than writing ad-hoc code.
  - All UI must be bundled as dynamic imports.
