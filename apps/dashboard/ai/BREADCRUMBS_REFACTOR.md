# Breadcrumbs Refactoring Guide

This document explains how to migrate from the old breadcrumb system to the new unified system that addresses all scalability limitations.

## Migration Steps

### Step 1: Update Navigation Config Types

The navigation config types now support additional properties:

```typescript
export interface NavItemConfig {
  // ... existing properties ...
  
  // NEW: Route-specific breadcrumb label override
  breadcrumbLabel?: string;
  
  // NEW: Custom resolver for dynamic breadcrumb titles
  breadcrumbResolver?: (params: Record<string, string>) => string | Promise<string>;
  
  // ENHANCED: Nested routes can now have nested routes (multi-level)
  nestedRoutes?: NestedRouteConfig[];
}

export interface NestedRouteConfig {
  path: string;
  titleKey: string;
  
  // NEW: Custom resolver for this nested route
  titleResolver?: (params: Record<string, string>) => string | Promise<string>;
  
  // NEW: Nested routes can have nested routes
  nestedRoutes?: NestedRouteConfig[];
  
  // NEW: Support dynamic segments within nested routes
  supportsDynamicSegment?: boolean;
}
```

### Step 2: Update Breadcrumb Generation Calls

#### Before (Org):
```typescript
import { generateBreadcrumbs } from './breadcrumb';

const breadcrumbs = generateBreadcrumbs(
  page.url.pathname,
  page.url.search,
  navItems,
  $currentOrgPath,
  page.data as { breadcrumb?: string } | undefined
);
```

#### After (Org - Store-Based Reactive):
```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { generateBreadcrumbsSync } from './breadcrumb-core';
  import { createOrgBreadcrumbConfigWithStore } from './breadcrumb-configs';
  import { courseStore } from '$features/course/utils/store';

  // Reactive config that reads from stores
  const config = $derived(createOrgBreadcrumbConfigWithStore(
    $currentOrgPath,
    () => $courseStore.title // Reads reactively - updates automatically!
  ));
  
  // Breadcrumbs update automatically when store changes!
  const breadcrumbs = $derived(
    generateBreadcrumbsSync(
      page.url.pathname,
      page.url.search,
      navItems,
      config
    )
  );
</script>
```

#### Before (LMS):
```typescript
import { generateLmsBreadcrumbs } from './lms-breadcrumb';
import { currentCommunityQuestion } from '$features/community/utils/store';

const breadcrumbTitle = $derived($currentCommunityQuestion.title);
const breadcrumbs = generateLmsBreadcrumbs(
  page.url.pathname,
  page.url.search,
  navItems,
  breadcrumbTitle ? { breadcrumb: breadcrumbTitle } : undefined
);
```

#### After (LMS - Reactive Store-Based):
```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { generateBreadcrumbsSync } from './breadcrumb-core';
  import { createLmsBreadcrumbConfigWithStore } from './breadcrumb-configs';
  import { currentCommunityQuestion } from '$features/community/utils/store';

  // Config is reactive - updates when store changes
  const config = $derived(createLmsBreadcrumbConfigWithStore(
    () => $currentCommunityQuestion.title // Reads reactively from store
  ));
  
  // Breadcrumbs update automatically when store changes!
  const breadcrumbs = $derived(
    generateBreadcrumbsSync(
      page.url.pathname,
      page.url.search,
      navItems,
      config
    )
  );
</script>
```

### Step 3: Support Multi-Level Nesting (Up to 5 Layers)

The refactored system supports up to 5 layers of nesting through recursive traversal. Here's how it works:

#### How Deep Nesting Works

1. **Recursive Processing**: The `generateNestedBreadcrumbs` function processes path segments recursively, incrementing a `depth` counter
2. **Depth Limit**: Default `maxDepth` is 10, but can be configured (supports up to 5 layers by default)
3. **Segment-by-Segment Matching**: Each segment is matched against nested route definitions
4. **Dynamic Title Resolution**: Dynamic segments resolve titles via `titleResolver` or `dynamicTitleResolver`

#### Example: Courses → Course → Lesson → Assignment → Submission (5 Layers)

**Navigation Config** (in `org-navigation.ts`):
```typescript
{
  titleKey: 'org_navigation.courses',
  path: '/courses',
  nestedRoutes: [
    {
      path: '[id]',
      titleKey: 'Course',
      supportsDynamicSegment: true,
      // Note: titleResolver can be sync (store-based) or async (API-based)
      nestedRoutes: [
        {
          path: 'lessons',
          titleKey: 'Lessons',
          nestedRoutes: [
            {
              path: '[lessonId]',
              titleKey: 'Lesson',
              supportsDynamicSegment: true,
              nestedRoutes: [
                {
                  path: 'assignments',
                  titleKey: 'Assignments',
                  nestedRoutes: [
                    {
                      path: '[assignmentId]',
                      titleKey: 'Assignment',
                      supportsDynamicSegment: true,
                      nestedRoutes: [
                        {
                          path: 'submissions',
                          titleKey: 'Submissions',
                          nestedRoutes: [
                            {
                              path: '[submissionId]',
                              titleKey: 'Submission',
                              supportsDynamicSegment: true
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Breadcrumb Component** (in `app-breadcrumbs.svelte`):
```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { generateBreadcrumbsSync } from './breadcrumb-core';
  import { createOrgBreadcrumbConfigWithStore } from './breadcrumb-configs';
  import { assignmentStore, submissionStore, courseStore, lessonStore } from '$features/course/utils/store';
  
  // Create reactive config that reads from stores
  const config = $derived(createOrgBreadcrumbConfigWithStore(
    $currentOrgPath,
    () => {
      // This function is called reactively - reads from stores
      const pathSegments = page.url.pathname.split('/').filter(Boolean);
      
      // Determine which store to read based on current route
      if (pathSegments.includes('submissions') && pathSegments.length > 5) {
        return $submissionStore.title || 'Submission';
      }
      if (pathSegments.includes('assignments') && pathSegments.length > 4) {
        return $assignmentStore.title || 'Assignment';
      }
      if (pathSegments.includes('lessons') && pathSegments.length > 3) {
        return $lessonStore.title || 'Lesson';
      }
      if (pathSegments.includes('courses') && pathSegments.length > 2) {
        return $courseStore.title || 'Course';
      }
      return null;
    }
  ));
  
  const breadcrumbs = $derived(
    generateBreadcrumbsSync(
      page.url.pathname,
      page.url.search,
      navItems,
      config
    )
  );
</script>
```

**Alternative: Per-Route Store Resolvers** (More Granular):
```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { generateBreadcrumbsSync } from './breadcrumb-core';
  import { createOrgBreadcrumbConfigWithStore } from './breadcrumb-configs';
  import { assignmentStore, submissionStore, courseStore, lessonStore } from '$features/course/utils/store';
  
  // Create config with store-based resolver
  const config = $derived(createOrgBreadcrumbConfigWithStore(
    $currentOrgPath,
    () => {
      // Read from stores reactively based on path structure
      const pathSegments = page.url.pathname.split('/').filter(Boolean);
      
      // Match store to segment position
      if (pathSegments.includes('submissions')) {
        return $submissionStore.title || null;
      }
      if (pathSegments.includes('assignments')) {
        return $assignmentStore.title || null;
      }
      if (pathSegments.includes('lessons')) {
        return $lessonStore.title || null;
      }
      if (pathSegments.includes('courses')) {
        return $courseStore.title || null;
      }
      return null;
    }
  ));
  
  const breadcrumbs = $derived(
    generateBreadcrumbsSync(
      page.url.pathname,
      page.url.search,
      navItems,
      config
    )
  );
</script>
```

**URL**: `/org/myorg/courses/123/lessons/456/assignments/789/submissions/101`

**Result**: `Courses / React Fundamentals / Lessons / Components / Assignments / Build Todo App / Submissions / Submission #101`

**Key Benefit**: When stores update (e.g., `assignmentStore.title` changes), the breadcrumb automatically updates reactively without any API calls!

#### Key Points for 5-Layer Nesting:

1. **Each Level Must Define Nested Routes**: For nesting to work, each level must have `nestedRoutes` defined
2. **Dynamic Segments Need `supportsDynamicSegment: true`**: Mark dynamic segments explicitly
3. **Store-Based Resolvers Are Reactive**: Use stores instead of async requests for automatic updates
4. **Static Routes Are Checked First**: Static nested routes (like `lessons`, `assignments`) are matched before dynamic segments
5. **Recursive Depth Tracking**: The function tracks depth and stops at `maxDepth` (default: 10, supports 5 layers easily)

#### Store-Based vs Async Resolvers

**✅ Recommended: Store-Based (Reactive)**
```typescript
// In breadcrumb component
const config = $derived(createOrgBreadcrumbConfigWithStore(
  $currentOrgPath,
  () => $assignmentStore.title // Reads reactively from store
));

// Breadcrumbs update automatically when store changes!
const breadcrumbs = $derived(generateBreadcrumbsSync(...));
```

**⚠️ Alternative: Async Resolvers (API Calls)**
```typescript
// In navigation config
titleResolver: async (params) => {
  const assignment = await fetchAssignment(params.param0);
  return assignment.title;
}
```

**Why Use Stores?**
- ✅ **No API calls** - data already loaded in component
- ✅ **Automatic updates** - breadcrumb updates when store changes
- ✅ **Better performance** - no loading states or delays
- ✅ **Reactive** - works seamlessly with Svelte's reactivity system

#### Parameter Extraction for Deep Nesting

The `extractParamsFromPath` function extracts all path segments as `param0`, `param1`, `param2`, etc.:

```typescript
// For URL: /courses/123/lessons/456/assignments/789
// params = {
//   param0: '123',  // courseId
//   param1: '456',  // lessonId  
//   param2: '789'   // assignmentId
// }
```

**Note**: When using stores, you typically don't need these params - just read from the store directly!

### Step 4: Add Route-Specific Overrides

```typescript
{
  titleKey: 'org_navigation.courses',
  path: '/courses',
  breadcrumbLabel: 'My Courses', // Override default title
  breadcrumbResolver: (params) => {
    // Custom logic for this route
    return `Courses (${params.count || ''})`;
  }
}
```

### Step 5: Use Async Resolvers When Needed

For routes that need async data fetching:

```typescript
import { generateBreadcrumbs } from './breadcrumb-core'; // Note: async version

const breadcrumbs = await generateBreadcrumbs(
  page.url.pathname,
  page.url.search,
  navItems,
  config
);
```

## Benefits of the Refactored System

### ✅ 1. No Code Duplication
- Single unified generator for all contexts
- Context-specific configs handle differences

### ✅ 2. Multi-Level Nesting Support
- Recursive generation handles any depth
- Configurable max depth prevents infinite loops

### ✅ 3. Flexible Path Prefixes
- Function-based prefix extraction
- Supports dynamic prefixes like `/org/[slug]`

### ✅ 4. Consistent Dynamic Title Resolution
- Unified interface for all resolvers
- Supports both sync and async resolution

### ✅ 5. Route-Specific Customization
- Override labels per route
- Custom resolvers for complex cases

### ✅ 6. Optional Caching
- Performance optimization
- Configurable cache TTL

### ✅ 7. Type Safety
- Full TypeScript support
- Compile-time error checking

## Example: Complex Multi-Level Route (5 Layers)

**URL**: `/org/myorg/courses/123/lessons/456/assignments/789/submissions/101`

**Config**:
```typescript
{
  path: '/courses',
  nestedRoutes: [
    {
      path: '[id]',
      supportsDynamicSegment: true,
      titleResolver: async (params) => {
        const course = await getCourse(params.param0);
        return course.title;
      },
      nestedRoutes: [
        {
          path: 'lessons',
          titleKey: 'Lessons',
          nestedRoutes: [
            {
              path: '[lessonId]',
              supportsDynamicSegment: true,
              titleResolver: async (params) => {
                const lesson = await getLesson(params.param0, params.param1);
                return lesson.title;
              },
              nestedRoutes: [
                {
                  path: 'assignments',
                  titleKey: 'Assignments',
                  nestedRoutes: [
                    {
                      path: '[assignmentId]',
                      supportsDynamicSegment: true,
                      titleResolver: async (params) => {
                        const assignment = await getAssignment(
                          params.param0, // courseId
                          params.param1, // lessonId
                          params.param2  // assignmentId
                        );
                        return assignment.title;
                      },
                      nestedRoutes: [
                        {
                          path: 'submissions',
                          titleKey: 'Submissions',
                          nestedRoutes: [
                            {
                              path: '[submissionId]',
                              supportsDynamicSegment: true,
                              titleResolver: async (params) => {
                                const submission = await getSubmission(
                                  params.param0, // courseId
                                  params.param1, // lessonId
                                  params.param2, // assignmentId
                                  params.param3  // submissionId
                                );
                                return `Submission #${submission.id}`;
                              }
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Result**: `Courses / React Fundamentals / Lessons / Components / Assignments / Build Todo App / Submissions / Submission #101`

### How the Recursion Works for 5 Layers:

1. **Initial Call** (`depth=0`): Processes `/courses` → finds nav item → adds "Courses"
2. **First Recursion** (`depth=1`): Processes `123` → dynamic segment → resolves course title → adds "React Fundamentals"
3. **Second Recursion** (`depth=2`): Processes `lessons` → static nested route → adds "Lessons"
4. **Third Recursion** (`depth=3`): Processes `456` → dynamic segment → resolves lesson title → adds "Components"
5. **Fourth Recursion** (`depth=4`): Processes `assignments` → static nested route → adds "Assignments"
6. **Fifth Recursion** (`depth=5`): Processes `789` → dynamic segment → resolves assignment title → adds "Build Todo App"
7. **Sixth Recursion** (`depth=6`): Processes `submissions` → static nested route → adds "Submissions"
8. **Seventh Recursion** (`depth=7`): Processes `101` → dynamic segment → resolves submission → adds "Submission #101"

**Depth Limit**: Default `maxDepth` is 10, so this 5-layer example (which uses depth 7) works perfectly.

## How 5 Layers of Nesting Works

### Depth Calculation

The recursive function processes **each path segment** separately, incrementing depth on each recursive call. For a 5-layer breadcrumb path:

**Example Path**: `/courses/123/lessons/456/assignments/789/submissions/101`

**Breadcrumb Result**: `Courses / React Fundamentals / Lessons / Components / Assignments / Build Todo App / Submissions / Submission #101`

**Depth Breakdown**:
- `depth=0`: Top-level nav item (`/courses`) → "Courses"
- `depth=1`: First dynamic segment (`123`) → "React Fundamentals" 
- `depth=2`: Static nested route (`lessons`) → "Lessons"
- `depth=3`: Second dynamic segment (`456`) → "Components"
- `depth=4`: Static nested route (`assignments`) → "Assignments"
- `depth=5`: Third dynamic segment (`789`) → "Build Todo App"
- `depth=6`: Static nested route (`submissions`) → "Submissions"
- `depth=7`: Fourth dynamic segment (`101`) → "Submission #101"

**Total Depth**: 7 levels (includes static route labels)

**Default `maxDepth`**: 10, which easily supports 5 layers of actual content nesting.

### Recursive Processing Flow

```typescript
generateNestedBreadcrumbsSync(segments, navItem, currentPath, ..., depth=0)
  ├─ Process currentSegment (segments[0])
  ├─ Check: Is it a static nested route?
  │   ├─ YES: Add breadcrumb → Recurse with remaining segments (depth+1)
  │   └─ NO: Continue to dynamic check
  ├─ Check: Is it a dynamic segment?
  │   ├─ YES: Resolve title → Add breadcrumb → Recurse with remaining segments (depth+1)
  │   └─ NO: Return (no more breadcrumbs)
  └─ Stop if: depth >= maxDepth OR segments.length === 0
```

### Key Implementation Details

1. **Segment-by-Segment Processing**: Each recursive call processes ONE segment and passes remaining segments to the next call
2. **Static Routes First**: Static nested routes (like `lessons`, `assignments`) are checked before dynamic segments
3. **Nested Route Matching**: When a static route is found, its `nestedRoutes` become the `navItem.nestedRoutes` for the next recursion
4. **Dynamic Segment Handling**: When a dynamic segment is found, it resolves the title and continues with remaining segments if `nestedRoutes` exist
5. **Depth Safety**: The `maxDepth` check prevents infinite recursion (default: 10, configurable)

### Why This Supports 5 Layers

- **Default `maxDepth` of 10** provides plenty of headroom for 5 layers
- **Recursive structure** naturally handles any depth
- **Each layer increments depth by 1**, so 5 layers = depth 5-7 (depending on static route labels)
- **Configurable `maxDepth`** allows adjustment if needed

## Performance Considerations

1. **Caching**: Enable for routes with expensive resolvers
2. **Async Resolvers**: Use sparingly - prefer sync resolvers when possible
3. **Max Depth**: Default is 10 (supports 5 layers easily), but can be customized:
   ```svelte
   <script lang="ts">
     const baseConfig = createOrgBreadcrumbConfigWithStore($currentOrgPath, () => $courseStore.title);
     const config = $derived({ ...baseConfig, maxDepth: 15 });
   </script>
   ```
4. **Cache Invalidation**: Clear cache when navigation config changes
5. **Recursive Calls**: Each nested level adds one recursive call - 5 layers = ~7-10 calls total (very efficient)

## Testing

```typescript
import { generateBreadcrumbsSync, clearBreadcrumbCache } from './breadcrumb-core';

// Clear cache before tests
beforeEach(() => {
  clearBreadcrumbCache();
});

// Test breadcrumb generation
test('generates breadcrumbs for nested route', () => {
  const breadcrumbs = generateBreadcrumbsSync(
    '/org/test/courses/123/lessons/456',
    '',
    navItems,
    config
  );
  
  expect(breadcrumbs).toHaveLength(4);
  expect(breadcrumbs[0].label).toBe('Courses');
});
```

## Backward Compatibility

The old functions (`generateBreadcrumbs`, `generateLmsBreadcrumbs`) can be kept as wrappers:

```typescript
// breadcrumb.ts (legacy wrapper - using store-based approach)
import { generateBreadcrumbsSync } from './breadcrumb-core';
import { createOrgBreadcrumbConfigWithStore } from './breadcrumb-configs';
import { courseStore } from '$features/course/utils/store';

export function generateBreadcrumbs(
  pathname: string,
  searchParams: string,
  navItems: NavItem[],
  currentOrgPath: string,
  getStoreValue?: () => string | null | undefined
) {
  const config = createOrgBreadcrumbConfigWithStore(
    currentOrgPath,
    getStoreValue || (() => $courseStore.title || null)
  );
  return generateBreadcrumbsSync(pathname, searchParams, navItems, config);
}
```

This allows gradual migration without breaking existing code.

## Reactive Store-Based Title Resolution

### Why Use Stores Instead of Async Requests?

**✅ Benefits:**
- **No API calls** - Data is already loaded in your component
- **Automatic updates** - Breadcrumbs update reactively when stores change
- **Better performance** - No loading states, delays, or network requests
- **Simpler code** - Just read from stores, no async/await needed
- **Reactive by default** - Works seamlessly with Svelte's reactivity system

### How It Works

1. **Store Setup**: Your component/page loads data into a store
2. **Reactive Config**: Create breadcrumb config with a function that reads from stores
3. **Automatic Updates**: When store changes, breadcrumb automatically updates

### Example: Community Post Title

**Store** (`$features/community/utils/store.ts`):
```typescript
export const currentCommunityQuestion = writable<{ title: string | null }>({
  title: null
});
```

**Page Component** (`+page.svelte`):
```svelte
<script lang="ts">
  import { currentCommunityQuestion } from '$features/community/utils/store';
  
  let question = $state();
  
  async function fetchQuestion() {
    const data = await supabase.from('community_question').select('*').single();
    question = data;
    // Update store - breadcrumb will reactively update!
    currentCommunityQuestion.set({ title: data.title });
  }
  
  $effect(() => {
    fetchQuestion();
  });
</script>
```

**Breadcrumb Component** (`lms-breadcrumbs.svelte`):
```svelte
<script lang="ts">
  import { createLmsBreadcrumbConfigWithStore } from './breadcrumb-configs';
  import { currentCommunityQuestion } from '$features/community/utils/store';
  
  // Reactive config - updates when store changes
  const config = $derived(createLmsBreadcrumbConfigWithStore(
    () => $currentCommunityQuestion.title // Reads reactively!
  ));
  
  // Breadcrumbs automatically update when store changes!
  const breadcrumbs = $derived(
    generateBreadcrumbsSync(page.url.pathname, page.url.search, navItems, config)
  );
</script>
```

### Pattern for Multiple Stores

For routes with multiple dynamic segments, use path-based logic:

```svelte
<script lang="ts">
  const config = $derived(createOrgBreadcrumbConfigWithStore(
    $currentOrgPath,
    () => {
      const pathSegments = page.url.pathname.split('/').filter(Boolean);
      
      // Determine which store to read based on route
      if (pathSegments.includes('submissions')) {
        return $submissionStore.title;
      }
      if (pathSegments.includes('assignments')) {
        return $assignmentStore.title;
      }
      if (pathSegments.includes('lessons')) {
        return $lessonStore.title;
      }
      if (pathSegments.includes('courses')) {
        return $courseStore.title;
      }
      return null;
    }
  ));
</script>
```

### Important Notes

1. **Disable Caching**: When using stores, set `enableCache: false` in config (or use `createOrgBreadcrumbConfigWithStore` which does this automatically)
2. **Use `$derived`**: Always wrap config and breadcrumbs in `$derived` for reactivity
3. **Store Updates**: When you update a store, breadcrumbs automatically update - no manual refresh needed!
4. **No Async Needed**: Store-based resolvers are synchronous - just return the store value

