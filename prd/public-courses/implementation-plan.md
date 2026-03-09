# Public Courses Implementation Plan

## Scope Lock
1. **Course type**: Third option alongside Live Class and Self Paced
2. **Content access**: Full lesson content public, quizzes/exercises gated
3. **Conversion**: Soft nudges only, never hard modal on load
4. **Progress**: localStorage for guests, auto-merge on signup
5. **Landing page**: New "Public Courses" tab with distinct badge
6. **URL**: Same URL structure for guests and authenticated users
7. **SEO**: Public courses indexable with proper meta tags

## Delivery Phases

### Phase A: Data Model & Course Type (Days 1-2)
- Add `type` column to course table
- Update validation schemas
- Modify course creation wizard

### Phase B: Anonymous Content Access (Days 3-5)
- Make lesson endpoints work without auth for public courses
- Add permission checks for gated features
- Implement localStorage progress tracking

### Phase C: Conversion UX (Days 6-8)
- Build nudge components (quiz gate, lesson complete, progress banner)
- Implement guest mode UI indicators
- Add signup flow with progress merge

### Phase D: Landing Page (Days 9-10)
- Add Public Courses tab to landing page
- Create course type badges
- Update course cards with type indicators

### Phase E: Analytics & Polish (Days 11-12)
- Implement guest analytics tracking
- Add conversion funnel metrics
- Testing and edge cases

---

## Ticket Breakdown

| ID | Area | Task | Key Files | Dependencies | Done When |
|----|------|------|-----------|--------------|-----------|
| PC-A1 | DB | Add `type` enum to course schema | `packages/db/src/schema.ts` | None | Migration runs, `type` column exists with default 'SELF_PACED' |
| PC-A2 | DB | Update course queries to include type | `packages/db/src/queries/course/course.ts` | PC-A1 | Queries return course type |
| PC-A3 | Utils | Add course type validation | `packages/utils/src/validation/course/course.ts` | PC-A1 | Zod schema accepts 'LIVE_CLASS' \| 'SELF_PACED' \| 'PUBLIC' |
| PC-A4 | API | Update course create/update routes | `apps/api/src/routes/course/course.ts` | PC-A3 | Can create course with type 'PUBLIC' |
| PC-B1 | API | Make lesson content endpoint public-safe | `apps/api/src/routes/lesson/lesson.ts` | PC-A2 | Guests can GET lesson content for public courses |
| PC-B2 | API | Add permission middleware for gated features | `apps/api/src/middleware/permission.ts` | PC-B1 | Quiz/exercise endpoints check auth for public courses |
| PC-B3 | Dashboard | Implement localStorage progress tracking | `apps/dashboard/src/lib/utils/guest-progress.ts` | None | Can save/load guest progress from localStorage |
| PC-B4 | Dashboard | Add guest mode detection | `apps/dashboard/src/lib/stores/auth.svelte.ts` | None | Store exposes `isGuest` computed property |
| PC-C1 | Dashboard | Build quiz gate component | `apps/dashboard/src/lib/features/lesson/components/quiz-gate.svelte` | PC-B2 | Shows nudge when guest views quiz |
| PC-C2 | Dashboard | Build lesson complete nudge | `apps/dashboard/src/lib/features/lesson/components/lesson-complete-nudge.svelte` | PC-B3 | Shows after lesson completion for guests |
| PC-C3 | Dashboard | Build guest progress banner | `apps/dashboard/src/lib/features/lesson/components/guest-progress-banner.svelte` | PC-B3 | Shows after 2+ lessons viewed |
| PC-C4 | Dashboard | Implement progress merge flow | `apps/dashboard/src/lib/features/auth/utils/merge-progress.ts` | PC-B3 | Merges localStorage to account on signup |
| PC-C5 | Dashboard | Add guest mode UI indicators | `apps/dashboard/src/lib/features/ui/guest-indicator.svelte` | PC-B4 | Shows "Guest Mode" in header |
| PC-D1 | Dashboard | Update landing page tabs | `apps/dashboard/src/routes/org/[slug]/landing/+page.svelte` | PC-A4 | Has Live / Self Paced / Public tabs |
| PC-D2 | Dashboard | Create course type badge component | `apps/dashboard/src/lib/features/course/components/course-type-badge.svelte` | None | Shows Live/Self Paced/Public with colors |
| PC-D3 | Dashboard | Update course cards | `apps/dashboard/src/lib/features/course/components/course-card.svelte` | PC-D2 | Cards show type badge |
| PC-D4 | API | Add public courses list endpoint | `apps/api/src/routes/course/course.ts` | PC-A4 | `GET /courses/public` returns public courses |
| PC-E1 | API | Add guest analytics tracking | `apps/api/src/routes/analytics/analytics.ts` | None | Fire-and-forget endpoint for guest events |
| PC-E2 | Dashboard | Implement conversion tracking | `apps/dashboard/src/lib/utils/analytics/public-courses.ts` | PC-E1 | Tracks guest → auth conversions |
| PC-E3 | API | Add live viewer tracking | `apps/api/src/services/analytics/live-viewers.ts` | PC-B1 | Tracks active sessions per course |
| PC-E4 | Dashboard | Add live viewer count UI | `apps/dashboard/src/lib/features/course/components/live-viewer-count.svelte` | PC-E3 | Shows "X people learning now" |
| PC-E5 | Testing | Write integration tests | `apps/api/tests/public-courses.test.ts` | All above | Core flows tested |

---

## API Changes

### New Endpoints

```typescript
// GET /courses/public
// List all public courses (no auth required)
// Returns: Course[] filtered by type='PUBLIC' and status='PUBLISHED'

// POST /analytics/guest-event
// Track guest activity (privacy-safe, no PII)
// Body: { event: string, courseId: string, lessonId?: string, timestamp: number }
// Returns: 204 No Content
```

### Modified Endpoints

```typescript
// POST /courses
// Request body now accepts: type: 'LIVE_CLASS' | 'SELF_PACED' | 'PUBLIC'

// GET /courses/:slug/lessons/:lessonId
// Response now includes:
// - requiresAuth: boolean (for interactive elements)
// - userProgress: null | Progress (null for guests)

// POST /courses/:slug/enroll
// Auto-enrolls authenticated user to public course on first interaction
// No-op if already enrolled
```

---

## Data Flow

### Guest Viewing Public Course
```
1. Guest clicks course card on landing page
2. Server checks: course.type === 'PUBLIC' → allow
3. Lesson content rendered server-side (SEO-friendly)
4. Client hydrates with guest mode indicators
5. localStorage checked for saved progress
6. Guest browses lessons freely

On quiz view:
7. Client checks auth status
8. Guest sees inline nudge: "Sign in to take quiz"
9. Quiz questions visible but submit disabled

On signup:
10. Progress merged from localStorage
11. Auto-enrolled in course
12. Redirected back to last viewed lesson
```

---

## UI Components Needed

### Course Type Badge
```svelte
<CourseTypeBadge type="PUBLIC" />
// Shows: 🌐 Public (green/teal)
```

### Quiz Gate
```svelte
<QuizGate isGuest={true}>
  <QuizContent questions={questions} />
</QuizGate>
// Renders nudge overlay when guest tries to interact
```

### Guest Progress Banner
```svelte
<GuestProgressBanner 
  lessonsCompleted={3} 
  totalLessons={12}
  onSignUp={() => goto('/signup')}
/>
```

### Landing Page Tabs
```svelte
<Tabs value={activeTab}>
  <Tabs.List>
    <Tabs.Trigger value="live">📅 Live Classes</Tabs.Trigger>
    <Tabs.Trigger value="selfpaced">📚 Self Paced</Tabs.Trigger>
    <Tabs.Trigger value="public">🌐 Public Courses</Tabs.Trigger>
  </Tabs.List>
</Tabs>
```

---

## localStorage Schema

```typescript
// Key: `cio_guest_progress`
interface GuestProgressStore {
  version: 1;
  courses: {
    [courseId: string]: {
      lastVisitedLessonId: string;
      completedLessons: string[];
      totalTimeSpent: number; // seconds
      firstVisit: string; // ISO date
      lastVisit: string; // ISO date
    }
  };
  sessionId: string; // anonymous fingerprint for analytics
}
```

---

## Permission Matrix

| Endpoint | Guest (Public Course) | Auth (Public Course) | Any (Private Course) |
|----------|----------------------|----------------------|---------------------|
| GET /courses/:slug | ✅ | ✅ | ✅ (if enrolled) |
| GET /lessons/:id | ✅ | ✅ | ✅ (if enrolled) |
| GET /quizzes/:id | ✅ (no answers) | ✅ | ✅ (if enrolled) |
| POST /quizzes/:id/submit | ❌ | ✅ | ✅ (if enrolled) |
| POST /exercises/:id/submit | ❌ | ✅ | ✅ (if enrolled) |
| GET /progress | ❌ | ✅ | ✅ (own progress) |
| POST /discussions | ❌ | ✅ | ✅ (if enrolled) |

---

## Analytics Events

```typescript
// Guest events (no userId, use sessionId)
interface GuestEvent {
  event: 
    | 'public_course_viewed'
    | 'public_lesson_started' 
    | 'public_lesson_completed'
    | 'public_quiz_viewed'
    | 'conversion_prompt_shown'
    | 'conversion_prompt_clicked'
    | 'guest_signup_initiated';
  courseId: string;
  lessonId?: string;
  sessionId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Conversion events (with userId)
interface ConversionEvent {
  event: 'guest_progress_merged' | 'public_course_enrolled';
  userId: string;
  courseId: string;
  previousSessionId: string;
  lessonsCompletedBeforeSignup: number;
  timestamp: number;
}
```

---

## Acceptance Criteria

### Phase A
- [ ] Can create course with type 'PUBLIC' via API
- [ ] Course type persists and returns in responses
- [ ] Existing courses default to 'SELF_PACED'

### Phase B
- [ ] Guest can view lesson content for public courses
- [ ] Guest cannot submit quizzes/exercises
- [ ] localStorage saves guest progress
- [ ] Progress loads from localStorage on return visit

### Phase C
- [ ] Quiz gate shows for guests viewing quizzes
- [ ] Lesson complete nudge shows after finishing lesson
- [ ] Progress banner shows after 2+ lessons
- [ ] Signup merges localStorage progress to account
- [ ] Post-signup redirects to correct lesson

### Phase D
- [ ] Landing page has Public Courses tab
- [ ] Course cards show correct type badge
- [ ] Public courses list endpoint works without auth

### Phase E
- [ ] Guest events tracked (privacy-safe)
- [ ] Conversion funnel metrics calculated
- [ ] Live viewer count displays correctly
- [ ] Donation button appears when enabled
- [ ] Download permissions enforced correctly
- [ ] Course type conversion works with grace period
- [ ] Integration tests pass
- [ ] No console errors in guest mode

---

## Verification Commands

```bash
# Build all packages
pnpm --filter @cio/utils build
pnpm --filter @cio/db build
pnpm --filter @cio/api build
pnpm --filter @cio/dashboard build

# Run tests
pnpm --filter @cio/api test public-courses

# Type check
pnpm --filter @cio/dashboard check
```

---

## Rollout Plan

1. **Feature Flag**: Add `PUBLIC_COURSES_ENABLED` env var
2. **Internal Testing**: Enable for team org only
3. **Beta Users**: Select 5 orgs to test
4. **Full Rollout**: Remove feature flag
5. **Announcement**: Blog post + in-app notification

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Content scraping | Rate limiting on lesson endpoints; consider Cloudflare bot detection |
| Live viewer accuracy | Use heartbeat every 2 min, expire after 5 min of inactivity |
| Donation fraud | Validate Stripe link format; no server-side payment processing |
| SEO duplicate content | Canonical URLs; no separate /public/ path |
| localStorage quota exceeded | Max 10 courses tracked; LRU eviction |
| Guest analytics spam | Rate limit analytics endpoint; validate sessionId format |
| Conversion nudge fatigue | Frequency caps; dismissible with "Don't show again" |
