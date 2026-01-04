# Singleton Modal System - Implementation Plan

## Current State Analysis

### Current Modal Patterns
1. **Individual Stores**: Each modal has its own writable store (e.g., `newOrgModal`, `createCourseModal`, `openModal`)
2. **URL Query Params**: Some modals controlled via URL params (`?create=true`, `?upgrade=true`, `?welcomePopup=true`)
3. **Local State**: Some modals use bindable props with local state
4. **Dialog Component**: Uses `@cio/ui/base/dialog` (bits-ui/Radix UI Dialog) in dashboard app
5. **Custom Modal**: Website app has a simpler custom modal component

### Problems with Current Approach
- ❌ Multiple modals can be open simultaneously (no singleton enforcement)
- ❌ Requires creating a store for every modal
- ❌ Inconsistent patterns across the codebase
- ❌ Difficult to manage modal state globally
- ❌ No centralized modal lifecycle management
- ❌ Hard to prevent modal conflicts or ensure proper cleanup

## Proposed Singleton Modal System

### Core Concept
A centralized modal manager that:
- Ensures only one modal is open at a time
- Allows opening modals via function calls (no stores needed)
- Provides a consistent API across the entire application
- Handles modal state, transitions, and cleanup automatically

### Architecture Overview

```
┌─────────────────────────────────────────┐
│     Modal Manager (Singleton Store)     │
│  - Current modal state                  │
│  - Modal queue (optional)               │
│  - Open/close functions                 │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│     Modal Container Component           │
│  - Single Dialog.Root instance          │
│  - Dynamically renders modal content    │
│  - Handles transitions                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│     Modal Components (Content Only)     │
│  - No Dialog.Root wrapper              │
│  - Just content + logic                 │
└─────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Core Infrastructure

#### 1.1 Create Modal Manager Store
**Location**: `apps/dashboard/src/lib/features/ui/modal/store.ts` (or shared location)

**Structure**:
```typescript
interface ModalConfig {
  width?: string;           // e.g., 'w-96', 'w-[800px]', 'max-w-4xl'
  className?: string;        // Additional CSS classes for Dialog.Content
  maxWidth?: string;        // Max width override
  // Future: height, position, etc.
}

interface ModalState {
  isOpen: boolean;
  component: ComponentType | null;
  props: Record<string, any>;
  config: ModalConfig;
  id: string | null;
}

interface QueuedModal {
  component: ComponentType;
  props: Record<string, any>;
  config: ModalConfig;
}

interface ModalManager {
  state: Writable<ModalState>;
  queue: QueuedModal[];
  open: (component: ComponentType, props?: Record<string, any>, config?: ModalConfig) => void;
  close: () => void;
  queue: (component: ComponentType, props?: Record<string, any>, config?: ModalConfig) => void;
}
```

**Features**:
- Single writable store for modal state
- `open()` function accepts component, props, and optional config (styling)
- `close()` function clears current modal and processes queue if items exist
- `queue()` function adds modal to queue (opens when current closes)
- Auto-closes previous modal when opening new one (singleton behavior)
- Queue system processes automatically on close

#### 1.2 Create Modal Container Component
**Location**: `apps/dashboard/src/lib/features/ui/modal/modal-container.svelte`

**Responsibilities**:
- Single `Dialog.Root` instance bound to store state
- Dynamically renders the current modal component
- Applies styling configuration (width, className, etc.) to Dialog.Content
- Handles overlay, backdrop
- Manages portal rendering
- Handles escape key and backdrop click

**Structure**:
```svelte
<script lang="ts">
  import { modalManager } from './store';
  import * as Dialog from '@cio/ui/base/dialog';
  
  // Compute Dialog.Content classes from config
  $: config = $modalManager.state.config;
  $: dialogContentClass = [
    config.width,
    config.maxWidth,
    config.className
  ].filter(Boolean).join(' ');
</script>

<Dialog.Root bind:open={$modalManager.state.isOpen}>
  <Dialog.Content class={dialogContentClass}>
    {#if $modalManager.state.component}
      <svelte:component 
        this={$modalManager.state.component} 
        {...$modalManager.state.props}
        onClose={() => modalManager.close()}
      />
    {/if}
  </Dialog.Content>
</Dialog.Root>
```

**Styling Application**:
- Config classes are applied directly to `Dialog.Content`
- Tailwind classes work as expected (e.g., `w-[800px]`, `max-w-4xl`)
- Custom classes via `className` are appended
- Classes can be overridden by component-level styling if needed

#### 1.3 Add Modal Container to App Layout
**Location**: `apps/dashboard/src/routes/+layout.svelte` (or root layout)

**Action**: Add `<ModalContainer />` component at root level so it's always available

### Phase 2: API Design & Styling

#### 2.1 Styling Configuration System
**Purpose**: Allow developers to customize modal container appearance (width, classes, etc.) without modifying modal components.

**ModalConfig Interface**:
```typescript
interface ModalConfig {
  width?: string;        // Tailwind width class: 'w-96', 'w-[800px]', 'w-4/5', etc.
  maxWidth?: string;     // Tailwind max-width class: 'max-w-2xl', 'max-w-4xl', etc.
  className?: string;    // Additional CSS classes for Dialog.Content
}
```

**How It Works**:
- Config is passed as third parameter to `modalManager.open()` or `modalManager.queue()`
- Config is stored in modal state
- Modal container applies config classes to `Dialog.Content`
- Default: Uses Dialog.Content default styling if no config provided

**Styling Examples**:
```typescript
// Default width (uses Dialog.Content default)
modalManager.open(DeleteModal, { itemId: '123' });

// Custom width
modalManager.open(CreateCourseModal, { title: 'New' }, { 
  width: 'w-[800px]' 
});

// Wide modal with max-width constraint
modalManager.open(UpgradeModal, {}, {
  width: 'w-4/5',
  maxWidth: 'max-w-5xl'
});

// Full custom styling
modalManager.open(CustomModal, {}, {
  width: 'w-[600px]',
  className: 'p-8 bg-gradient-to-br from-blue-50 to-purple-50'
});
```

**Implementation Details**:
- Modal container reads config from `$modalManager.state.config`
- Classes are applied to `Dialog.Content` component
- Supports Tailwind classes and custom CSS
- Can be combined with component-level styling

#### 2.2 Modal Manager API
```typescript
// Simple usage
modalManager.open(DeleteModal, { 
  itemId: '123',
  onConfirm: () => { /* ... */ }
});

// With custom styling
modalManager.open(CreateCourseModal, {
  title: 'New Course'
}, {
  width: 'w-[800px]',
  className: 'custom-class',
  maxWidth: 'max-w-4xl'
});

// Queue modal (opens after current modal closes)
modalManager.queue(NextModal, { prop: 'value' }, { width: 'w-96' });

// Close modal
modalManager.close();

// Check if modal is open
$modalManager.state.isOpen
```

#### 2.3 Modal Component Interface
**Standard Props**:
- `onClose?: () => void` - Callback when modal should close
- `onConfirm?: () => void` - Optional confirmation callback
- Component-specific props passed through

**Example Modal Component**:
```svelte
<script lang="ts">
  interface Props {
    itemId: string;
    onClose?: () => void;
    onConfirm?: () => void;
  }
  
  let { itemId, onClose, onConfirm }: Props = $props();
  
  async function handleConfirm() {
    await deleteItem(itemId);
    onConfirm?.();
    onClose?.();
  }
</script>

<Dialog.Header>
  <Dialog.Title>Delete Item</Dialog.Title>
</Dialog.Header>
<!-- Rest of modal content -->
```

### Phase 3: Migration Strategy

#### 3.1 Refactor Existing Modals
**Steps for each modal**:

1. **Remove Dialog.Root wrapper** from modal component
   - Keep only Dialog.Content, Dialog.Header, Dialog.Title, etc.
   - Remove `bind:open` and `onOpenChange` handlers

2. **Remove individual stores**
   - Delete modal-specific stores (e.g., `newOrgModal`, `createCourseModal`)
   - Remove store imports from components

3. **Update modal opening calls**
   - Replace `$modalStore.open = true` with `modalManager.open(ModalComponent, props)`
   - Replace URL param checks with direct function calls where appropriate

4. **Update modal closing**
   - Replace `$modalStore.open = false` with `modalManager.close()`
   - Use `onClose` prop callback if needed

#### 3.2 Migration Priority
1. **High Priority**: Frequently used modals (delete, create, edit)
2. **Medium Priority**: Feature-specific modals
3. **URL Modals**: Migrate URL-param controlled modals to use URL integration pattern

#### 3.3 URL-Based Modals Integration
- Listen to URL changes (using `$app/state` page store)
- Programmatically call `modalManager.open()` when URL params detected
- Example: `?create=true` → `modalManager.open(CreateCourseModal)`
- Remove URL param when modal closes
- This replaces the current URL param pattern with singleton system

### Phase 4: Modal Queue System

#### 4.1 Queue Implementation
- Queue modals when one is already open
- Auto-open next modal when current closes
- Useful for sequential workflows (e.g., create course → add students → configure settings)

**Queue API**:
```typescript
// If modal is open, queue this one
modalManager.queue(NextModal, props, config);

// Queue opens automatically when current modal closes
// Or manually process queue if needed
```

**Queue Behavior**:
- When `open()` is called while modal is open, current modal closes and new one opens (singleton)
- When `queue()` is called while modal is open, modal is added to queue
- When modal closes, if queue has items, next modal opens automatically

## File Structure

```
apps/dashboard/src/lib/features/ui/modal/
├── store.ts                 # Modal manager store
├── modal-container.svelte   # Container component
├── types.ts                 # TypeScript types
└── utils.ts                 # Helper functions

apps/dashboard/src/lib/features/ui/modal/components/
├── delete-modal.svelte      # Refactored modals (no Dialog.Root)
├── create-course-modal.svelte
└── ...
```

## Benefits

### Developer Experience
✅ **No stores needed**: Open modals with simple function calls  
✅ **Consistent API**: Same pattern for all modals  
✅ **Type safety**: TypeScript support for modal props  
✅ **Less boilerplate**: No need to create stores for each modal  

### User Experience
✅ **No modal conflicts**: Only one modal open at a time  
✅ **Better focus management**: Proper focus trapping  
✅ **Consistent behavior**: All modals behave the same way  

### Code Quality
✅ **Centralized logic**: Modal management in one place  
✅ **Easier testing**: Test modal manager independently  
✅ **Better maintainability**: Single source of truth  

## Implementation Considerations

### URL-Based Modals
- **Approach**: Programmatically call `modalManager.open()` based on URL changes
- Use `$app/state` page store to watch for URL param changes
- When URL param detected (e.g., `?create=true`), call `modalManager.open()`
- When modal closes, remove URL param via `goto()` or `invalidateAll()`
- This integrates URL-based modals into singleton system

**Example Implementation**:
```svelte
<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { modalManager } from '$features/ui/modal/store';
  import CreateCourseModal from './create-course-modal.svelte';
  
  $effect(() => {
    const query = new URLSearchParams($page.url.search);
    if (query.get('create') === 'true') {
      modalManager.open(CreateCourseModal, {}, { width: 'w-[600px]' });
    }
  });
  
  // Listen for modal close and remove URL param
  $effect(() => {
    if (!$modalManager.state.isOpen && $page.url.search.includes('create=true')) {
      goto($page.url.pathname);
    }
  });
</script>
```

### Website App
- **Decision**: Do not touch website app, focus only on `apps/dashboard`
- Website app can continue using its existing modal pattern
- No changes needed to website app codebase

### Testing Strategy
1. Unit tests for modal manager store
2. Component tests for modal container
3. Integration tests for modal opening/closing
4. E2E tests for critical modal flows

### Performance
- Lazy load modal components (code splitting)
- Minimize re-renders with proper reactivity
- Consider virtualizing if many modals exist

## Migration Checklist

- [ ] Create modal manager store with queue support
- [ ] Create modal container component with styling support
- [ ] Add container to app layout
- [ ] Create URL param integration helper
- [ ] Create example refactored modal
- [ ] Update documentation
- [ ] Migrate high-priority modals
- [ ] Migrate medium-priority modals
- [ ] Migrate URL-based modals
- [ ] Delete old modal stores (no backward compatibility needed)
- [ ] Update tests
- [ ] Performance testing

## Decisions Made

1. **Modal Queue**: ✅ Implement from the start - queue system included in Phase 4
2. **URL Modals**: ✅ Programmatically call `modalManager.open()` based on URL changes - see URL-Based Modals section
3. **Website App**: ✅ Do not touch - focus only on `apps/dashboard`
4. **Backward Compatibility**: ✅ Delete old modal stores immediately after migration - no backward compatibility layer needed
5. **Animation Library**: ✅ No animations needed - keep it simple

## Next Steps

1. Review and approve this plan
2. Create proof-of-concept with one modal
3. Gather feedback from team
4. Refine approach based on feedback
5. Begin phased migration
