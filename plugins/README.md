# ClassroomIO Plugins

Welcome to the ClassroomIO plugin ecosystem. This directory contains official and modular extensions for ClassroomIO.

> **CRITICAL ARCHITECTURAL REQUIREMENT**:  
> All plugins in this directory must strictly comply with **[ADR 001: Plugin Architecture & Implementation Conventions](../../prd/plugin-system/adr-001-plugin-conventions.md)**.  
> Any plugin that violates these conventions will fail build and CI test suites.

---

## Directory Structure

Plugins are organized strictly by category:

```text
plugins/
├── activity/                  # Custom learning activity modules (flashcards, roleplay, etc.)
├── block/                     # Dashboard & sidebar widgets
├── certificate/               # Custom certificate designs & credential templates
│   └── certificate-modern-gold/
├── enrollment/                # Custom admission & registration flows
├── integration/               # Third-party integrations & event responders
│   └── linkedin-certificate/
└── landing/                   # Custom landing page themes & marketing sections
```

## Enabled Plugins: One List for Dashboard and API

`createConfiguredPlugins()` in `plugins/index.ts` is the single list of plugins enabled by this repository. Both
`classroomio.config.ts` and the API runtime call it because the dashboard and API run in separate processes.

The shared list is necessary; using a function is a design choice. A constant could also hold the list, but the
factory gives each runtime a fresh array of SDK-validated plugin definitions and prevents one consumer from mutating
the list seen by another consumer during development or tests.

Add or remove enabled plugins in `createConfiguredPlugins()` rather than adding a second list directly inside
`classroomio.config.ts`. Keeping one factory prevents the dashboard from showing a plugin that the API has not loaded
for server hooks or certificate rendering. The factory returns fresh, SDK-validated plugin instances for each process.

```typescript
export function createConfiguredPlugins(): PluginDefinition[] {
  return [linkedinCertificate(), modernGoldCertificate()];
}
```

---

## The 10 Enforced Plugin Conventions

Before submitting a plugin, ensure it meets the following criteria:

1. **Category Folder**: Must reside in one of the six categories (`activity`, `block`, `integration`, `certificate`, `landing`, `enrollment`).
2. **Factory Function Entrypoint**: Every plugin must export a named factory function returning `definePlugin({...})` and be re-exported in `plugins/index.ts`.
3. **Valid ID**: Must match `/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/` and start with `{category}_` (e.g. `certificate_modern_gold`).
4. **Valid SemVer**: `version` must be valid semantic versioning (e.g. `'1.0.0'`).
5. **Dynamic UI Loaders**: All slots must use lazy dynamic loaders: `() => import('./components/my-widget.svelte')`. Never use static imports for slot components.
6. **Registered Slots & Hooks**: Only use slot names from `SLOT_NAMES` and hook names from `HOOK_NAMES`.
7. **Storage via `defineEntity`**: Never write raw DB SQL. Declare custom models using `defineEntity()`.
8. **Mandatory Privacy Manifest**: If your plugin defines `entities`, you **must** supply a `privacy` block with `onDeleteUser` and `onExportUser` handlers.
9. **Scoped Permissions**: Declare only permitted scopes from `PERMISSION_SCOPES`.
10. **Automated Tests**: Every plugin must include unit tests verifying its manifest and functionality.

---

## Quick Example: Creating an Integration Plugin

`plugins/integration/my-integration/index.ts`:

```typescript
import { definePlugin, type PluginDefinition } from '@cio/sdk';

export interface MyServiceOptions {
  webhookUrl?: string;
}

export function myService(options: MyServiceOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'integration_my_service',
    name: 'My External Service',
    version: '1.0.0',
    category: 'integration',
    description: 'Connects course completion events to an external webhook.',
    slots: {
      'certificate.actions': () => import('./components/action-button.svelte')
    },
    on: {
      'lesson.completed': async (payload, ctx) => {
        // Handle completion event safely
      }
    }
  });
}

export default myService;
```

Export it in `plugins/index.ts`:

```typescript
export { myService, type MyServiceOptions } from './integration/my-integration';

export function createConfiguredPlugins(): PluginDefinition[] {
  return [myService()];
}
```

Consume it in `classroomio.config.ts`:

```typescript
import { createConfiguredPlugins } from './plugins';

export default defineConfig({
  plugins: createConfiguredPlugins()
});
```

---

## Testing Plugins

Run SDK and dogfood tests:

```bash
pnpm --filter @cio/sdk test
```

For more details on plugin lifecycle, entities, and slot contracts, refer to the full specification:  
👉 **[Read ADR 001: Plugin Conventions](../../prd/plugin-system/adr-001-plugin-conventions.md)**
