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
interface ModalState {
  isOpen: boolean;
  component: ComponentType | null;
  props: Record<string, any>;
  id: string | null;
}

interface ModalManager {
  state: Writable<ModalState>;
  open: (component: ComponentType, props?: Record<string, any>) => void;
  close: () => void;
  // Optional: for modal queuing
  queue: (component: ComponentType, props?: Record<string, any>) => void;
}
```

**Features**:
- Single writable store for modal state
- `open()` function accepts component and props
- `close()` function clears current modal
- Auto-closes previous modal when opening new one (singleton behavior)

#### 1.2 Create Modal Container Component
**Location**: `apps/dashboard/src/lib/features/ui/modal/modal-container.svelte`

**Responsibilities**:
- Single `Dialog.Root` instance bound to store state
- Dynamically renders the current modal component
- Handles overlay, backdrop, and transitions
- Manages portal rendering
- Handles escape key and backdrop click

**Structure**:
```svelte
<script>
  import { modalManager } from './store';
  import { Dialog } from '@cio/ui/base/dialog';
  
  // Subscribe to modal state
  // Render component dynamically using <svelte:component>
</script>

<Dialog.Root bind:open={$modalManager.state.isOpen}>
  <Dialog.Content>
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

#### 1.3 Add Modal Container to App Layout
**Location**: `apps/dashboard/src/routes/+layout.svelte` (or root layout)

**Action**: Add `<ModalContainer />` component at root level so it's always available

### Phase 2: API Design

#### 2.1 Modal Manager API
```typescript
// Simple usage
modalManager.open(DeleteModal, { 
  itemId: '123',
  onConfirm: () => { /* ... */ }
});

// Close modal
modalManager.close();

// Check if modal is open
$modalManager.state.isOpen
```

#### 2.2 Modal Component Interface
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
3. **Low Priority**: URL-param controlled modals (can keep existing pattern if preferred)

#### 3.3 Backward Compatibility
- Keep old modal stores temporarily during migration
- Create wrapper functions that use new system but maintain old API
- Gradually migrate components

### Phase 4: Advanced Features (Optional)

#### 4.1 Modal Queue System
- Queue modals when one is already open
- Auto-open next modal when current closes
- Useful for sequential workflows

#### 4.2 Modal History
- Track modal open/close history
- Support "back" navigation through modals

#### 4.3 Modal Types/Configurations
- Predefined modal configurations (size, position, etc.)
- Modal variants (alert, confirm, form, etc.)

#### 4.4 Transition Animations
- Smooth transitions between modals
- Customizable animation presets

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
- **Option A**: Keep URL param modals as-is (they're navigation-based)
- **Option B**: Convert to function calls and handle navigation separately
- **Recommendation**: Keep URL-based modals for deep-linking, use singleton for programmatic modals

### Website App
- Website app uses simpler custom modal component
- Can create similar singleton system or adapt dashboard approach
- Consider creating shared modal package if both apps need it

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

- [ ] Create modal manager store
- [ ] Create modal container component
- [ ] Add container to app layout
- [ ] Create example refactored modal
- [ ] Update documentation
- [ ] Migrate high-priority modals
- [ ] Migrate medium-priority modals
- [ ] Migrate low-priority modals
- [ ] Remove old modal stores
- [ ] Update tests
- [ ] Performance testing

## Open Questions

1. **Modal Queue**: Should we implement queuing from the start, or add later?
2. **URL Modals**: How should URL-based modals integrate with singleton system?
3. **Website App**: Should website app use the same system or have its own?
4. **Backward Compatibility**: How long should we maintain old modal stores?
5. **Animation Library**: Should we use a specific animation library for transitions?

## Next Steps

1. Review and approve this plan
2. Create proof-of-concept with one modal
3. Gather feedback from team
4. Refine approach based on feedback
5. Begin phased migration
