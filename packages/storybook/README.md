# @cio/storybook

Storybook for ClassroomIO UI components.

## Development

To start the Storybook development server:

```bash
pnpm dev
```

## Build

To build the Storybook:

```bash
pnpm build
```

## Build Storybook

To build the Storybook (alternative command):

```bash
pnpm build-storybook
```

## Upload

To upload the built Storybook to Cloudflare R2:

```bash
pnpm upload:storybook
```

**Note:** This requires the build to be completed first. Make sure you have the following environment variables set:

- `CLOUDFLARE_ACCESS_KEY`
- `CLOUDFLARE_SECRET_ACCESS_KEY`
- `CLOUDFLARE_ACCOUNT_ID`

## Publish

To build and upload the Storybook in one command:

```bash
pnpm storybook:publish
```

This will build the Storybook and then upload it to R2.

## How to Create Storybook Stories

This guide documents the patterns and conventions for creating Storybook stories in the ClassroomIO UI component library.

### Table of Contents

- [File Structure](#file-structure)
- [Basic Story Structure](#basic-story-structure)
- [Import Patterns](#import-patterns)
- [Story Definition](#story-definition)
- [Template Snippets](#template-snippets)
- [Fields File](#fields-file)
- [Component Categorization](#component-categorization)
- [CSS Class Conventions](#css-class-conventions)
- [LMS Content Guidelines](#lms-content-guidelines)
- [Examples](#examples)

### File Structure

#### Directory Organization

Stories are organized into two main categories:

- **Atoms** (`src/atoms/`): Basic, indivisible UI components (Button, Input, Badge, etc.)
- **Molecules** (`src/molecules/`): Composite components made of multiple atoms (Card, Field, ButtonGroup, etc.)

#### File Naming

1. Create a directory matching the component name (kebab-case)
2. Create a story file: `{component-name}.stories.svelte`
3. Optionally create a fields file: `fields.ts` (for controls configuration)

**Example:**

```bash
src/molecules/hover-card/
  ├── hover-card.stories.svelte
  └── fields.ts
```

### Basic Story Structure

Every story file follows this structure:

```svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  // Component imports
  import * as ComponentName from '@cio/ui/base/component-name';

  // Other imports (icons, utilities, etc.)
  import IconName from '@lucide/svelte/icons/icon-name';

  // Fields import (if using controls)
  import { FIELDS } from './fields';

  // Story definition
  const { Story } = defineMeta({
    title: 'Category/ComponentName',
    component: ComponentName.Root, // or ComponentName for single components
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  // State variables (if needed)
  let someState = $state('');
</script>

<Story name="StoryName">
  {#snippet template()}
    <!-- Component usage -->
  {/snippet}
</Story>
```

### Import Patterns

#### Component Imports

- **Namespace imports** for multi-part components:

  ```svelte
  import * as HoverCard from '@cio/ui/base/hover-card'; import * as Card from '@cio/ui/base/card'; import * as Field
  from '@cio/ui/base/field';
  ```

- **Named imports** for single components:

  ```svelte
  import {Button} from '@cio/ui/base/button'; import {Input} from '@cio/ui/base/input'; import {Avatar} from '@cio/ui/base/avatar';
  ```

#### Icon Imports

Use Lucide Svelte icons:

```svelte
import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days'; import UsersIcon from '@lucide/svelte/icons/users';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
```

### Story Definition

#### Title Format

- **Atoms**: `'Atom/ComponentName'` (e.g., `'Atom/Button'`)
- **Molecules**: `'Molecules/ComponentName'` (e.g., `'Molecules/HoverCard'`)

#### Component Reference

- For multi-part components, reference the `Root` component:

  ```svelte
  component: HoverCard.Root component: Card.Root
  ```

- For single components, reference directly:

  ```svelte
  component: Button component: Input
  ```

#### Parameters

Standard parameters configuration:

```svelte
parameters: {
  layout: 'centered',
  controls: {
    include: FIELDS  // Only if using fields.ts
  }
}
```

#### Tags

Always include `tags: ['autodocs']` for automatic documentation generation.

### Template Snippets

#### Basic Template

```svelte
<Story name="Default">
  {#snippet template()}
    <ComponentName.Root>
      <!-- Component content -->
    </ComponentName.Root>
  {/snippet}
</Story>
```

#### Template with Args (for controls)

For atoms that need to pass args to controls:

```svelte
<Story name="Default">
  {#snippet template(args)}
    <Button {...args}>Button Text</Button>
  {/snippet}
</Story>
```

#### Multiple Stories

Create multiple stories to showcase different use cases:

```svelte
<Story name="Default">
  {#snippet template()}
    <!-- Basic usage -->
  {/snippet}
</Story>

<Story name="With Avatar">
  {#snippet template()}
    <!-- Avatar variant -->
  {/snippet}
</Story>

<Story name="Custom Content">
  {#snippet template()}
    <!-- Custom content variant -->
  {/snippet}
</Story>
```

### Fields File

Create a `fields.ts` file to control which props appear in Storybook controls:

```typescript
export const FIELDS = ['class'] as string[];
```

Common fields:

- `'class'` - CSS classes
- `'variant'` - Component variants
- `'size'` - Component sizes
- `'disabled'` - Disabled state
- Add more as needed based on component props

### Component Categorization

#### Atoms

Basic, indivisible components:

- Button, Input, Badge, Avatar, Label, Checkbox, Switch, etc.
- Single-purpose components
- Usually don't compose other components

#### Molecules

Composite components:

- Card, Field, ButtonGroup, HoverCard, Empty, etc.
- Made of multiple atoms or other components
- More complex functionality

**Guideline**: If a component uses multiple other components together, it's likely a molecule.

### CSS Class Conventions

#### UI Prefix

Use the `ui:` prefix for utility classes to scope them properly:

```svelte
<!-- ✅ Correct -->
<div class="ui:flex ui:flex-col ui:gap-6">
<Button class="ui:w-full">

<!-- ❌ Incorrect -->
<div class="flex flex-col gap-6">
<Button class="w-full">
```

#### When to Use UI Prefix

- **Always use** for utility classes (flex, grid, gap, padding, margin, etc.)
- **Don't use** for component-specific classes or data attributes
- **Don't use** for Tailwind classes that are part of component styling

#### Examples

```svelte
<!-- Utility classes - use ui: prefix -->
<div class="ui:flex ui:items-center ui:gap-2">
<div class="ui:space-y-2">
<div class="ui:text-muted-foreground ui:text-sm">

<!-- Component classes - no prefix needed -->
<Card.Root class="w-full max-w-sm">
<HoverCard.Content class="w-80">
```

### LMS Content Guidelines

Since ClassroomIO is an LMS platform, all story content should be **LMS-related**:

#### ✅ Good Examples

- **Courses**: "Introduction to Web Development", "Advanced React Patterns"
- **Users**: "Sarah Johnson (Instructor)", "Alex Martinez (Student)"
- **Content**: Course descriptions, assignment types, enrollment information
- **Actions**: "Create Course", "Enroll Student", "Submit Assignment"
- **States**: "No courses yet", "Student enrolled", "Assignment submitted"

#### ❌ Avoid

- Generic examples (Svelte, GitHub profiles, etc.)
- Non-educational content
- Examples that don't relate to learning/teaching

#### Content Patterns

**Instructor Profiles:**

```svelte
<h4 class="text-sm font-semibold">Sarah Johnson</h4>
<p class="text-sm">Senior Full-Stack Developer & Instructor</p>
<span class="text-muted-foreground text-xs">Teaching since January 2020</span>
```

**Course Information:**

```svelte
<h4 class="text-sm font-semibold">Advanced React Patterns</h4>
<p class="text-muted-foreground text-sm">
  Master advanced React concepts including hooks, context, performance optimization...
</p>
```

**Student Information:**

```svelte
<h4 class="text-sm font-semibold">Alex Martinez</h4>
<p class="text-muted-foreground text-xs">5 courses enrolled</p>
<p class="text-muted-foreground text-xs">Active since March 2024</p>
```

### Examples

#### Example 1: Simple Atom (Button)

```svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button } from '@cio/ui/base/button';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Button',
    component: Button,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <Button {...args}>Create Course</Button>
  {/snippet}
</Story>
```

#### Example 2: Multi-Part Molecule (HoverCard)

```svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
  import * as HoverCard from '@cio/ui/base/hover-card';
  import * as Avatar from '@cio/ui/base/avatar';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/HoverCard',
    component: HoverCard.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Instructor Profile">
  {#snippet template()}
    <HoverCard.Root>
      <HoverCard.Trigger
        href="/instructors/sarah-johnson"
        class="ui:rounded-sm ui:underline-offset-4 ui:hover:underline"
      >
        Sarah Johnson
      </HoverCard.Trigger>
      <HoverCard.Content class="w-80">
        <div class="flex justify-between space-x-4">
          <Avatar.Root>
            <Avatar.Image src="https://github.com/shadcn.png" />
            <Avatar.Fallback>SJ</Avatar.Fallback>
          </Avatar.Root>
          <div class="space-y-1">
            <h4 class="text-sm font-semibold">Sarah Johnson</h4>
            <p class="text-sm">Senior Full-Stack Developer & Instructor</p>
            <div class="flex items-center pt-2">
              <CalendarDaysIcon class="me-2 size-4 opacity-70" />
              <span class="text-muted-foreground text-xs">Teaching since January 2020</span>
            </div>
          </div>
        </div>
      </HoverCard.Content>
    </HoverCard.Root>
  {/snippet}
</Story>
```

#### Example 3: Complex Molecule with State (Field)

```svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/Field',
    component: Field.Field,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  let email = $state('');
</script>

<Story name="Course Enrollment">
  {#snippet template()}
    <div class="w-lg">
      <Field.Set>
        <Field.Legend>Enroll Student</Field.Legend>
        <Field.Description>Add a new student to your course</Field.Description>
        <Field.Group>
          <Field.Field>
            <Field.Label for="student-email">Student Email</Field.Label>
            <Input id="student-email" type="email" bind:value={email} placeholder="student@example.com" />
          </Field.Field>
        </Field.Group>
      </Field.Set>
    </div>
  {/snippet}
</Story>
```

### Checklist

When creating a new story, ensure:

- [ ] File is in the correct directory (`atoms/` or `molecules/`)
- [ ] File is named `{component-name}.stories.svelte`
- [ ] Imports use `@cio/ui/base/{component-name}` pattern
- [ ] Title follows `'Category/ComponentName'` format
- [ ] Component reference is correct (Root for multi-part, direct for single)
- [ ] `tags: ['autodocs']` is included
- [ ] All utility classes use `ui:` prefix
- [ ] Content is LMS-related (courses, students, instructors, etc.)
- [ ] Multiple stories showcase different use cases
- [ ] `fields.ts` is created if controls are needed
- [ ] State variables use `$state()` for reactivity
- [ ] Icons are imported from `@lucide/svelte/icons/`

### Additional Notes

- **State Management**: Use Svelte 5 runes (`$state()`, `$derived()`) for reactive state
- **Layout**: Most stories use `layout: 'centered'` in parameters
- **Styling**: Prefer Tailwind utility classes with `ui:` prefix
- **Accessibility**: Include proper ARIA labels and semantic HTML
- **Documentation**: Story names should be descriptive and reflect the use case

### Resources

- [Storybook Svelte CSF Addon](https://storybook.js.org/addons/@storybook/addon-svelte-csf)
- [Bits UI Documentation](https://bits-ui.com/docs/components)
- [Lucide Icons](https://lucide.dev/icons/)
