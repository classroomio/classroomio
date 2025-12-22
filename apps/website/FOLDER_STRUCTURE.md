# Folder Structure Documentation

This document describes the folder structure for the `apps/website` project, specifically focusing on the `src/lib` directory organization.

## Overview

The codebase follows a clear separation of concerns with three main categories:
- **Components**: Presentational UI components (dummy components)
- **Features**: Business logic and functional components
- **Utils**: Utility functions, constants, and shared types

## Directory Structure

```
src/lib/
├── components/          # UI Components (Presentational)
│   ├── index.ts         # Centralized exports - use this for imports
│   ├── blog-list-item.svelte
│   ├── core-feature-section.svelte
│   ├── core-features.svelte
│   ├── custom-img.svelte
│   ├── faq.svelte
│   ├── footer.svelte
│   ├── hero.svelte
│   ├── modal.svelte
│   ├── more-features.svelte
│   ├── navigation.svelte
│   ├── not-found.svelte
│   ├── page-header.svelte
│   ├── page-signup-cta.svelte
│   ├── senja-embed.svelte
│   ├── student-dashboard.svelte
│   ├── success.svelte
│   ├── testimonial.svelte
│   ├── timeline.svelte
│   ├── tools-header.svelte
│   └── upload-widget.svelte
│
├── features/           # Features (Business Logic)
│   ├── contact/
│   │   ├── feedback-form.svelte
│   │   └── help-form.svelte
│   └── tools/
│       ├── progress/
│       │   ├── avatar.svelte
│       │   ├── background.svelte
│       │   ├── download-button.svelte
│       │   ├── full-view.svelte
│       │   ├── mood.svelte
│       │   ├── report.svelte
│       │   └── store.ts
│       ├── stopwatch/
│       │   └── timer.svelte
│       └── tic-tac-toe/
│           ├── board.svelte
│           ├── board.ts
│           ├── store.ts
│           └── winning-line.svelte
│
├── utils/              # Utilities
│   ├── constants/
│   │   └── tools.ts
│   ├── posthog/
│   │   └── index.ts
│   ├── faqs.ts
│   ├── format-date.ts
│   ├── is-form-valid.ts
│   ├── submit-form.ts
│   └── types.ts
│
└── index.ts            # Root index - re-exports from components
│
└── emojis/             # Assets (Static files)
    ├── crossed-fingers.svg
    ├── folder.svg
    ├── globe.svg
    ├── index.js
    ├── left-fist.svg
    ├── printer.svg
    ├── right-fist.svg
    ├── robot-arm.svg
    ├── team.svg
    ├── thumbs-up.svg
    └── ...
```

## Naming Conventions

### Files and Folders
- **Kebab-case**: All file and folder names use kebab-case (e.g., `blog-list-item.svelte`, `feedback-form.svelte`)
- **Single-file folders**: If a folder contains only one file, it should be flattened to a single file (e.g., `Footer/Footer.svelte` → `components/footer.svelte`)

### Components
- Component files use `.svelte` extension
- Component names match their file names in kebab-case
- Example: `blog-list-item.svelte` exports a component that can be imported as `BlogListItem`

## Directory Purposes

### `/components` - UI Components

**Purpose**: Presentational components with minimal or no business logic. These are "dummy" components that receive props and render UI.

**Characteristics**:
- No API calls or complex state management
- Primarily focused on rendering and styling
- May have simple local state for UI interactions (e.g., open/close modals)
- Reusable across different pages/features

**Examples**:
- `footer.svelte` - Site footer component
- `navigation.svelte` - Site navigation bar
- `hero.svelte` - Hero section component
- `modal.svelte` - Generic modal wrapper

**Import Pattern**:
```svelte
// ✅ CORRECT - Use named imports from the index
import { Footer, Navigation, Hero } from '$lib/components';

// ❌ INCORRECT - Direct file imports are not allowed
// import Footer from '$lib/components/footer.svelte';
```

**Note**: All components must be imported using named imports from `$lib/components`. Direct file imports are not allowed.

### `/features` - Features

**Purpose**: Components and modules that contain business logic, API calls, form handling, state management, or domain-specific functionality.

**Characteristics**:
- Contains business logic and data handling
- May include API calls, form submissions, or data transformations
- Often includes stores, utilities, or helper functions specific to the feature
- Organized by feature domain (e.g., `contact/`, `tools/`)

**Examples**:
- `features/contact/feedback-form.svelte` - Form with submission logic
- `features/tools/progress/store.ts` - State management for progress tool
- `features/tools/tic-tac-toe/board.ts` - Game logic

**Import Pattern**:
```svelte
import FeedbackForm from '$lib/features/contact/feedback-form.svelte';
import { htmlBody, openModal } from '$lib/features/tools/progress/store';
```

### `/utils` - Utilities

**Purpose**: Shared utility functions, constants, types, and helper modules used across the application.

**Characteristics**:
- Pure functions or utility modules
- No component-specific logic
- Reusable across different features/components
- May include TypeScript types and interfaces

**Examples**:
- `utils/format-date.ts` - Date formatting utility
- `utils/is-form-valid.ts` - Form validation helper
- `utils/submit-form.ts` - Generic form submission utility
- `utils/types.ts` - Shared TypeScript types
- `utils/constants/tools.ts` - Application constants

**Import Pattern**:
```typescript
import { formatDate } from '$lib/utils/format-date';
import { isFormValid } from '$lib/utils/is-form-valid';
import type { BlogPost } from '$lib/utils/types';
```

## Migration from Old Structure

### Old Structure (Before Refactoring)

```
src/lib/
├── Blog/BlogListItem.svelte
├── Contact/FeedbackForm.svelte, HelpForm.svelte, Sucess.svelte
├── Footer/Footer.svelte
├── Home/*.svelte, faqs.ts
├── Navigation/Navigation.svelte
├── Modal/Modal.svelte
├── PageHeader/PageHeader.svelte
├── PageSignupCTA/index.svelte
├── Senja/Embed.svelte
├── Timeline/Timeline.svelte
├── ToolsHeader/ToolsHeader.svelte
├── UploadWidget/UploadWidget.svelte
├── NotFound/NotFound.svelte
├── custom/img.svelte, index.ts
├── utils/*.ts
└── types.ts
```

### Key Changes

1. **Flattened single-file folders**: Folders with only one file were flattened (e.g., `Footer/Footer.svelte` → `components/footer.svelte`)

2. **Kebab-case conversion**: All PascalCase file names converted to kebab-case (e.g., `BlogListItem.svelte` → `blog-list-item.svelte`)

3. **Separation of concerns**: Components split into `components/` (UI) and `features/` (logic)

4. **Routes components moved**: Capitalized `components/` folders from `routes/tools/*/` moved to `features/tools/*/`

5. **Types moved**: `types.ts` moved to `utils/types.ts`

6. **Fixed typos**: `Sucess.svelte` → `success.svelte`

7. **Centralized component exports**: Created `components/index.ts` to export all components with PascalCase names

8. **Standardized imports**: All component imports now use named imports from `$lib/components` instead of direct file imports

## Import Examples

### Components

```svelte
<script>
  // ✅ CORRECT - Named imports from centralized index
  import { Footer, Navigation, Hero, Testimonial } from '$lib/components';
  
  // ❌ INCORRECT - Direct file imports are not allowed
  // import Footer from '$lib/components/footer.svelte';
</script>
```

**Important**: All components are exported from `components/index.ts` with PascalCase names. Always use named imports from `$lib/components`.

### Features

```svelte
<script>
  import FeedbackForm from '$lib/features/contact/feedback-form.svelte';
  import { htmlBody, openModal } from '$lib/features/tools/progress/store';
  import Board from '$lib/features/tools/tic-tac-toe/board.svelte';
</script>
```

### Utils

```svelte
<script>
  import { formatDate } from '$lib/utils/format-date';
  import { isFormValid } from '$lib/utils/is-form-valid';
  import { submitForm } from '$lib/utils/submit-form';
  import type { BlogPost } from '$lib/utils/types';
  import { tools } from '$lib/utils/constants/tools';
</script>
```

## Best Practices

1. **When to create a component vs feature**:
   - **Component**: If it's purely presentational and reusable
   - **Feature**: If it contains business logic, API calls, or domain-specific functionality

2. **File naming**:
   - Always use kebab-case for file and folder names
   - Match component file names with their import names (converted to PascalCase in imports)

3. **Component imports**:
   - **Always** import components using named imports from `$lib/components`
   - **Never** import directly from component files (e.g., `$lib/components/footer.svelte`)
   - All components are exported from `components/index.ts` with PascalCase names
   - Example: `import { Footer, Navigation } from '$lib/components'`

4. **Folder organization**:
   - Group related features in subfolders (e.g., `features/contact/`, `features/tools/progress/`)
   - Keep utility functions organized by purpose in `utils/`

5. **Avoid single-file folders**:
   - If a folder contains only one file, flatten it to a single file
   - Example: `Footer/Footer.svelte` → `components/footer.svelte`

6. **Type definitions**:
   - Shared types go in `utils/types.ts`
   - Feature-specific types can be co-located with the feature

7. **Adding new components**:
   - Add the component file in kebab-case (e.g., `new-component.svelte`)
   - Export it from `components/index.ts` with PascalCase name (e.g., `NewComponent`)
   - Import using: `import { NewComponent } from '$lib/components'`

## Routes Structure

Routes that previously had capitalized `components/` folders have been refactored:

**Before**:

```
routes/tools/progress/components/Avatar.svelte
routes/tools/stopwatch/components/Timer.svelte
routes/tools/tic-tac-toe/components/Board.svelte
```

**After**:

```
lib/features/tools/progress/avatar.svelte
lib/features/tools/stopwatch/timer.svelte
lib/features/tools/tic-tac-toe/board.svelte
```

Routes now import from `$lib/features/tools/*/` instead of `./components/`.

## Assets

Static assets like images, SVGs, and other media files remain in their respective locations:
- `emojis/` - Emoji SVG files
- `public/` - Public static assets (images, fonts, etc.)

## Component Index File

All components are exported from `components/index.ts` with PascalCase names:

```typescript
// components/index.ts
export { default as BlogListItem } from './blog-list-item.svelte';
export { default as Footer } from './footer.svelte';
export { default as Navigation } from './navigation.svelte';
// ... etc
```

This allows for clean, consistent imports:
```svelte
import { Footer, Navigation, Hero } from '$lib/components';
```

**Rule**: Direct file imports (e.g., `import Footer from '$lib/components/footer.svelte'`) are **not allowed**. Always use named imports from `$lib/components`.

## Summary

This structure provides:
- ✅ Clear separation between UI and business logic
- ✅ Consistent naming conventions (kebab-case)
- ✅ Flattened structure (no unnecessary single-file folders)
- ✅ Centralized component exports via `index.ts`
- ✅ Standardized import pattern (named imports from `$lib/components`)
- ✅ Easy to navigate and maintain
- ✅ Scalable for future growth

For questions or suggestions about this structure, please refer to the project maintainers.

