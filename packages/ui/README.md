# @cio/ui

UI component library for ClassroomIO, built with Svelte 5 and Tailwind CSS.

## Package Information

- **Name**: `@cio/ui`
- **Type**: Svelte component library
- **Framework**: Svelte 5
- **Styling**: Tailwind CSS with custom `ui` prefix

## Folder Structure

```
packages/ui/
├── src/
│   ├── base/          # Components from shadcn-svelte
│   ├── custom/        # Components from other sources or built on top of base components
│   ├── hooks/         # Reusable Svelte hooks
│   ├── tools/         # Utility functions (cn, sanitize, etc.)
│   ├── index.css      # Global styles
│   └── index.ts       # Main export file
├── package.json
├── components.json    # shadcn-svelte configuration
└── jsrepo.json        # jsrepo configuration
```

## Content Structure

### Base Components (`src/base/`)

All components in the `base` directory are primarily from [shadcn-svelte](https://www.shadcn-svelte.com/). These are the foundational UI components that follow the shadcn design system.

**Guidelines:**
- Any new component from shadcn-svelte should be added to the `base` directory
- Components are organized in their own folders with an `index.ts` file for exports
- Each component folder typically contains the main component file(s) and an `index.ts` export file

**Examples:**
- `base/button/` - Button component from shadcn-svelte
- `base/dialog/` - Dialog component from shadcn-svelte
- `base/tooltip/` - Tooltip component from shadcn-svelte

### Custom Components (`src/custom/`)

Components in the `custom` directory come from various sources or are built on top of base components:

1. **External Sources:**
   - Components from [shadcn-svelte-extras](https://www.shadcn-svelte-extras.com/)
   - Components from [Edra Editor](http://edra.tsuzat.com/) (rich text editor)
   - Other third-party component libraries

2. **Extended Components:**
   - Any component that builds on top of shadcn-svelte base components
   - Custom implementations that extend base component functionality

**Examples:**
- `custom/underline-tabs/` - From shadcn-svelte-extras
- `custom/editor/` - Rich text editor based on Edra/Tiptap
- `custom/image-cropper/` - Custom image cropping component
- `custom/checkbox-field/` - Field component built on top of base Checkbox

### Hooks (`src/hooks/`)

Reusable Svelte hooks are located in the `src/hooks/` directory. These are Svelte 5 runes-based utilities that can be used across components.

**Available Hooks:**
- `is-mobile.svelte.ts` - Media query hook for mobile breakpoints
- `use-clipboard.svelte.ts` - Clipboard copy functionality with state management

**Usage:**
```svelte
<script lang="ts">
  import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';
  import { UseClipboard } from '@cio/ui/hooks/use-clipboard.svelte';
</script>
```

### Tools (`src/tools/`)

Utility functions and helpers are located in `src/tools/`. The main utility is the `cn` function for class name merging.

## Importing `cn`

The `cn` utility function is used throughout the codebase for merging Tailwind CSS classes. It combines `clsx` and `tailwind-merge` to handle class conflicts intelligently.

**Import:**
```typescript
import { cn } from '../../tools';
```

**Example usage:**
```svelte
<script lang="ts">
  import { cn } from '../../tools';
  
  let { class: className } = $props();
</script>

<div class={cn('ui:bg-primary ui:text-white', className)}>
  Content
</div>
```

The `cn` function is exported from `src/tools/index.ts` and is also available as a named export from the main package:

```typescript
import { cn } from '@cio/ui';
```

## Tailwind Prefix

All Tailwind CSS classes in this package use a custom prefix: **`ui`**

This ensures that styles don't conflict with other Tailwind configurations in consuming applications.

**Usage:**
```svelte
<div class="ui:bg-primary ui:text-primary-foreground ui:rounded-md">
  Content
</div>
```

**Note:** When adding new components or styles, always use the `ui:` prefix for all Tailwind classes.

## Component Exports

Components are exported from the main `src/index.ts` file in an alphabetical order. There are two main export patterns:

### Base Components

Base components are exported as namespaced exports:

```typescript
export * as Button from './base/button';
export * as Dialog from './base/dialog';
export * as Tooltip from './base/tooltip';
```

**Usage:**
```svelte
<script lang="ts">
  import { Button, Dialog, Tooltip } from '@cio/ui';
</script>

<Button.Root>Click me</Button.Root>
<Dialog.Root>...</Dialog.Root>
```

### Custom Components

Custom components may use namespaced exports or direct exports depending on their structure:

```typescript
// Namespaced
export * as UnderlineTabs from './custom/underline-tabs';

// Direct exports
export { Chip } from './custom/chip';
export { IconButton } from './custom/icon-button';
```

**Usage:**
```svelte
<script lang="ts">
  import { UnderlineTabs, Chip, IconButton } from '@cio/ui';
</script>
```

### Component Index Files

Each component directory contains an `index.ts` file that exports the component and its types:

```typescript
// base/button/index.ts
import Root, { type ButtonProps, buttonVariants } from './button.svelte';

export {
  Root,
  Root as Button,
  type ButtonProps,
  buttonVariants
};
```

## Adding New Components

When adding a new component to this package, follow these steps:

1. **Determine the location:**
   - If it's from shadcn-svelte → add to `src/base/`
   - If it's from another source or extends base components → add to `src/custom/`

2. **Create the component structure:**
   - Create a folder with the component name (kebab-case)
   - Add the component file(s)
   - Create an `index.ts` file for exports

3. **Export from main index:**
   - Add the export to `src/index.ts`

4. **Add Tailwind prefix:**
   - Run `pnpm prefix` to automatically add the `ui:` prefix to all Tailwind classes

5. **Create a Storybook story:**
   - **Required:** After adding a new component, you must add a story for it in `packages/storybook`
   - See `packages/storybook/README.md` for detailed instructions on how to create stories
   - Stories help document component usage and enable visual testing

## Development

### Scripts

- `pnpm generate-css` - Generate CSS from Tailwind
- `pnpm build` - Build the package
- `pnpm dev` - Watch mode for CSS generation
- `pnpm format` - Format code with Prettier
- `pnpm prefix:list` - List files that need the `ui:` prefix (dry-run)
- `pnpm prefix` - Add `ui:` prefix to all Tailwind classes and format

### Configuration

- `components.json` - shadcn-svelte configuration
- `jsrepo.json` - jsrepo configuration for component installation
- `svelte.config.js` - Svelte configuration
- `tsconfig.json` - TypeScript configuration
