---
name: plugin-builder
description: Comprehensive architecture, strict guardrails ("The Cage"), verification workflows, and development roadmap for all ClassroomIO plugins (micro-widgets to large visual studio suites).
---

# ClassroomIO Plugin Builder & Architecture Cage

This skill defines the mandatory development lifecycle, architectural guardrails, and automated verification procedures for building ClassroomIO plugins. Every agent and developer modifying or authoring plugins must confine their work to the strict rules outlined below.

---

## 1. The Plugin "Cage" (Strict Non-Negotiables)

Plugins follow the **Chrome extension mental model**: they are cosmetic, behavioral, and workflow-level customizations that let organizations personalize their LMS cleanly without modifying core app code or creating maintenance overhead.

All plugins must strictly satisfy these non-negotiable rules:

| Rule | Requirement | Why It Matters |
|---|---|---|
| **1. No DB Table Bloat** | Do **NOT** create new PostgreSQL tables or Drizzle schema migrations for plugins unless building an entire dedicated data engine. | Plugins store state in `org_capability`, slot contexts, or `localStorage`. DB churn creates migration debt. |
| **2. Scoped Icon Imports** | ALWAYS import icons from `@lucide/svelte`. **NEVER** import from `lucide-svelte`. | Unscoped `lucide-svelte` fails during Vite/Rollup production bundling with unresolvable module errors. |
| **3. Strict ID & Category Prefix** | Manifest `id` **MUST** follow `{category}_{slug}` (e.g. `activity_announcement_banner`, `certificate_studio`). | Enforced at runtime by `@cio/sdk` manifest validator in `plugin.ts`. |
| **4. Design System Tokens** | Use `@cio/ui` theme classes (`bg-card`, `text-primary`, `border-border`). **NEVER** hardcode hex colors (`#3b82f6`, `#10b981`) in `.svelte` markup. | Plugins must naturally inherit organization theme tokens, custom branding colors, and dark mode. |
| **5. No Direct DB Queries in UI** | Never import from `@cio/db/queries` or `@cio/db` inside plugin components. | Frontend code must consume slot contexts, the typed API client, or the SDK. |
| **6. Runes Mode Conformance** | Use Svelte 5 runes (`$props()`, `$state()`, `$derived()`, `$effect()`). Avoid deprecated `export let` or `<svelte:component>`. | Legacy Svelte syntax causes build warnings and breaks reactive prop synchronization. |
| **7. Reactive Collections** | Use `SvelteSet` and `SvelteMap` from `svelte/reactivity` for reactive collections. | Native `Set` and `Map` are non-reactive in Svelte 5 and fail to trigger UI updates on mutation. |
| **8. Full Localization** | Every plugin capability must have its `nameKey` and `descriptionKey` defined in `apps/dashboard/src/lib/utils/translations/en.json`. | Prevents unlocalized raw keys from leaking to organization administrators. |
| **9. Central Registration** | All active first-party plugins must be added to `configuredPlugins` and re-exported in `plugins/index.ts`. | Ensures both the dashboard and API runtimes can resolve active plugins. |
| **10. Plugin Journal Ledger** | Every plugin must be registered in `plugins/meta/_journal.json` with an incremented `idx`, manifest `id`, `name`, `category`, `path`, capability metadata, slots/routes, and millisecond timestamp `when`. | Maintains an immutable audit trail, version ledger, and discovery index for all ClassroomIO plugins. |

---

## 2. Plugin Taxonomies (Micro vs. Macro Architecture)

ClassroomIO classifies plugins into two distinct architectural patterns:

### Pattern A: Micro-Plugins (Widgets, Cards, & Utility Banners)
- **Use Case**: Compact UI additions that attach to existing host screens (e.g., banners, focus stopwatches, celebration confetti, compliance checkboxes, smart resume cards).
- **Directory Structure**:
  ```text
  plugins/<category>/<plugin-slug>/
  ├── components/
  │   └── <widget-name>.svelte
  └── index.ts
  ```
- **Data Flow**: Consumes props passed directly from the host `<PluginSlot name="..." context={{ ... }} />`.
- **State**: Ephemeral client state or persistent browser storage (`localStorage`).
- **File Budget**: Single component files should remain under ~250–300 lines.

### Pattern B: Macro-Plugins (Full Studio Suites & Route-Driven Apps)
- **Use Case**: Complex interactive visual designers or standalone organization tool suites (e.g., `certificate-studio`).
- **Directory Structure**:
  ```text
  plugins/<category>/<plugin-slug>/
  ├── components/
  │   ├── <feature>-builder.svelte      # Main container orchestrating layout
  │   ├── <feature>-stage.svelte        # Visual canvas or editor
  │   ├── <feature>-inspector.svelte    # Property controls
  │   └── <feature>-toolbar.svelte      # Action buttons and tools
  ├── utils/
  │   └── types.ts                      # Domain types and presets
  └── index.ts                          # Defines routes and pluginNav
  ```
- **Compound Component Rule**: Break large interfaces into focused subcomponents with single responsibilities. Do **NOT** cram 1,000+ lines into a monolithic file.
- **Context-Driven State**: Share state via Svelte Context (`setContext` / `getContext`) or module-level runes state. **Avoid prop-drilling 30+ primitive variables with `$bindable()`**.
- **Navigation**: Define `pluginNav` in `index.ts` with `titleKey`, `path`, `icon`, and `group`.

---

## 3. Step-by-Step Implementation Roadmap

When creating or modifying any plugin, follow this exact 6-step sequence:

### Step 1: SDK Manifest Definition
Create `plugins/<category>/<plugin-slug>/index.ts`:
```typescript
import { definePlugin, type PluginDefinition } from '@cio/sdk';

export interface MyPluginOptions {
  description?: string;
}

export function myPlugin(options: MyPluginOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'activity_my_plugin', // MUST match {category}_{slug}
    name: 'My Plugin',
    version: '1.0.0',
    category: 'activity',     // activity | block | integration | certificate | landing | enrollment
    activation: {
      kind: 'org-capability',
      capabilityId: 'my_plugin',
      nameKey: 'plugins.my_plugin.name',
      descriptionKey: 'plugins.my_plugin.description'
    },
    description: options.description ?? 'Concise feature summary.',
    slots: {
      'lesson.after': () => import('./components/my-widget.svelte')
    }
  });
}

export default myPlugin;
```

### Step 2: Component Implementation
Write the Svelte 5 component under `plugins/<category>/<plugin-slug>/components/`:
- Declare typed props via `$props()`.
- Use `@cio/ui` theme classes for all backgrounds, text, and borders.
- Import icons from `@lucide/svelte`.

### Step 3: Slot or Route Mounting
- **Existing Slots**: If mounting into an existing slot (`lms.banner`, `lesson.after`, `course.sidebar`, `certificate.actions`), ensure the host view passes needed context.
- **New Slots**: If introducing a new slot, add the name to `SLOT_NAMES` in `packages/sdk/src/types.ts` and run `pnpm --filter @cio/sdk build`.

### Step 4: Localization
Add the plugin's name and description keys to `apps/dashboard/src/lib/utils/translations/en.json`:
```json
"plugins": {
  "my_plugin": {
    "name": "My Plugin",
    "description": "Concise feature summary."
  }
}
```

### Step 5: Central Barrel Registration
Register the plugin in `plugins/index.ts`:
1. Import the factory function using the `.js` ESM resolution path.
2. Add the factory invocation to `configuredPlugins`.
3. Export the factory and its option types.

### Step 6: Plugin Journal Registration
Append an entry to `plugins/meta/_journal.json` maintaining the sequential index, manifest metadata, path, activation, slots/routes, and millisecond creation timestamp:
```json
{
  "idx": 2,
  "id": "activity_my_plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "category": "activity",
  "description": "Concise feature summary.",
  "path": "plugins/activity/my-plugin",
  "activation": {
    "kind": "org-capability",
    "capabilityId": "my_plugin",
    "nameKey": "plugins.my_plugin.name",
    "descriptionKey": "plugins.my_plugin.description"
  },
  "slots": ["lesson.after"],
  "when": 1789200000000
}
```

### Step 7: Automated Verification
Run the verification suite to prove the implementation satisfies all architectural guardrails.

---

## 4. Automated Verification Suite (Agent Execution)

ClassroomIO provides an automated verification engine located at [`scripts/verify-plugins.mjs`](file:///c:/Users/c/Desktop/classroom.io/scripts/verify-plugins.mjs) and registered as `pnpm plugins:verify`.

Every agent working on plugins must run the verifier autonomously:

### 1. Verify a Single Plugin (Targeted Check During Development)
```bash
node scripts/verify-plugins.mjs -p <plugin-slug-or-id>
```
*Example:*
```bash
node scripts/verify-plugins.mjs -p announcement-banner
```

### 2. Verify All Plugins Across the Repository
```bash
pnpm plugins:verify
```

### 3. Strict Pre-Commit Verification (Exits with Code 1 on Any Warning)
```bash
node scripts/verify-plugins.mjs --strict
```

### 4. Full Quality & Contract Suite
Before completing any plugin task, run the full verification battery:
```bash
# 1. Automated plugin quality & guardrails audit
pnpm plugins:verify

# 2. SDK manifest and contract tests
pnpm --filter @cio/sdk test

# 3. TypeScript packaging build
pnpm --filter @cio/plugins build

# 4. Format changed files
pnpm format:changed
```

### Verifier Checklist Reference
The automated verifier checks:
- [x] **Manifest Integrity**: Valid `id`, matching `{category}_` prefix, valid category.
- [x] **Slot Integrity**: Valid slot names matching SDK `SLOT_NAMES`, target component files exist on disk.
- [x] **Translation Keys**: All `nameKey` and `descriptionKey` strings exist in `en.json`.
- [x] **Central Export**: Plugin is exported and present in `configuredPlugins`.
- [x] **Journal Ledger**: Plugin is registered with matching metadata in `plugins/meta/_journal.json`.
- [x] **Import Hygiene**: No forbidden imports (`lucide-svelte`, `@cio/db/queries`).
- [x] **Theme Tokens**: No arbitrary hardcoded `#hex` colors in component markup.
- [x] **Runes Conformance**: No legacy `export let` or `<svelte:component>` in modern components.
- [x] **Anti-Bloat**: Flags empty pass-through wrappers and monolithic files over 500 lines.
