# ClassroomIO plugins

This directory contains trusted, in-tree extensions that are compiled and deployed with ClassroomIO.

## Architecture

The plugin system separates three concepts:

- A **code plugin** is a TypeScript module registered at build time.
- An **organization capability** is an optional per-organization switch declared by a code plugin.
- Plugin-owned records, such as Certificate Studio presets, are ordinary domain data. They are not plugins.

`configuredPlugins` in [`plugins/index.ts`](./index.ts) is the single connection point for code plugins. Both
`classroomio.config.ts` and the API consume this array. A plugin that is removed from the array is no longer shown
to cloud users, cannot be activated, and cannot be authorized by a stale capability row.

## Supported plugin contributions

The current production contract supports:

- organization capability metadata and activation;
- lazy Svelte components in named UI slots;
- lazy dashboard pages under `/org/[slug]/plugins/[plugin-path]`;
- sidebar navigation for plugin pages;
- declarative certificate renderer definitions;
- API route contributions registered in `apps/api/src/routes/plugins/api-route-registry.ts`.

Lifecycle hooks, event buses, plugin-owned entity repositories, activity types, permission scopes, privacy
manifests, and completion/grade write-back are future design work. Do not advertise or implement against those
surfaces until a production runtime exists for them.

## Adding a plugin

Create a category folder and return a manifest from `definePlugin()`:

```ts
import { definePlugin, type PluginDefinition } from '@cio/sdk';

export function myIntegration(): PluginDefinition {
  return definePlugin({
    id: 'integration_my_service',
    name: 'My service',
    version: '1.0.0',
    category: 'integration',
    description: 'Adds an action to issued certificates.',
    activation: {
      kind: 'org-capability',
      capabilityId: 'my_service',
      nameKey: 'plugins.my_service.name',
      descriptionKey: 'plugins.my_service.description'
    },
    slots: {
      'certificate.actions': () => import('./components/my-action.svelte')
    }
  });
}
```

Then export the factory and add its result to `configuredPlugins`:

```ts
export const configuredPlugins: PluginDefinition[] = [myIntegration()];
```

Plugins without an `activation` block are always active. Capability-gated plugins must supply translated name and
description keys in their activation metadata.

## Plugin registry and metadata ledger

Similar to the database migration journal in `packages/db/src/migrations/meta/_journal.json`, all configured plugins in the repository are recorded in [`plugins/meta/_journal.json`](./meta/_journal.json).

Each journal entry records:
- `idx` & `when`: deterministic entry index and timestamp
- `id`: unique plugin identifier (e.g. `certificate_studio`)
- `name` & `version`: SemVer metadata
- `category`: plugin category (`certificate`, `integration`, etc.)
- `path`: source directory relative to the repository
- `activation`: capability rule (`always` vs `org-capability`)
- `contributions`: registered routes, UI slots, navigation items, or renderer templates

## UI routes

Plugin page loaders are scoped to the plugin manifest, so identical subpaths do not collide:

```ts
pluginNav: {
  titleKey: 'my_plugin.sidebar_title',
  path: 'my-plugin',
  icon: 'puzzle',
  group: 'tools',
  adminOnly: true
},
routes: {
  '/': () => import('./components/plugin-home.svelte'),
  '/settings': () => import('./components/plugin-settings.svelte')
}
```

The dashboard host resolves these at `/org/[slug]/plugins/my-plugin` and
`/org/[slug]/plugins/my-plugin/settings`. Keep page-specific sizing and overflow behavior in the plugin page
component, not in shared dashboard shells.

## API routes

API routers remain statically composed so Hono can preserve exact RPC client types. Register a router in
`apps/api/src/routes/plugins/api-route-registry.ts` and mount the registry entry in the aggregate plugin router.
The registry guard derives availability from `configuredPlugins`, so removing the plugin from the single
connection point also makes its API endpoints unavailable.

## Validation and tests

- IDs use `{category}_{slug}` with lowercase letters, numbers, and single underscores.
- Versions use semantic versioning.
- UI registrations use dynamic import loaders.
- Slots must be declared in `SLOT_NAMES`.
- Each plugin should test its manifest and domain behavior.

Run the SDK and plugin dogfood tests with:

```bash
pnpm --filter @cio/sdk test
```

The current implementation boundaries and deferred work are documented in
[`prd/plugin-system/implementation-remediation-plan.md`](../prd/plugin-system/implementation-remediation-plan.md).
