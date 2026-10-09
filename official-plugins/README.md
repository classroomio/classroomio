# ClassroomIO Official Plugins

This directory holds the source code for ClassroomIO's first-party / official plugins.

## Architectural Boundary

Official plugins live in the ClassroomIO Git repository for co-located revision history, but **they must build, install, and execute as if they were built in a completely separate repository by a third party.**

### Allowed Dependencies
- `@classroomio/plugin-sdk`
- `@classroomio/plugin-design`
- Standard public npm packages

### Strictly Forbidden Dependencies & Imports
- `@cio/*` (including `@cio/db`, `@cio/ui`, `@cio/certificates`, `@cio/utils`)
- `$lib/*` or `$features/*` (dashboard source internals)
- `$app/*` (SvelteKit host internals)
- `apps/*` or `packages/*`
- Relative imports that escape the plugin directory (`../../..`)

## Isolation Enforcement
Every official plugin is validated via `pnpm plugins:verify-isolation`, which performs:
1. Static AST/regex scan for forbidden imports.
2. `package.json` dependency validation (no `@cio/*` packages allowed).
3. Manifest validation (`plugin.json` schema).
4. Clean-room compilation in an isolated temporary directory outside the monorepo.
