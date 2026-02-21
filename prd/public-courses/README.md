# Public Courses PRD

## Purpose
Enable course creators to publish "Public Courses" - a new course type where lesson content is fully accessible without signup, while interactive features (quizzes, exercises, progress tracking) require authentication. This creates a low-friction entry point for learners and a lead generation channel for organizations.

## Problem Statement
Currently, all courses require signup before accessing any content. This creates friction:
- Learners abandon at signup gate before seeing course value
- Organizations can't use courses as top-of-funnel content marketing
- No way to offer "try before you buy" experiences
- SEO discoverability is limited (landing pages only, not deep content)

## Product Goals
1. Create a third course type: **Public Course** (alongside Live Class, Self Paced)
2. Allow anonymous browsing of full lesson content
3. Gate interactive features behind authentication (soft nudge, not hard wall)
4. Drive conversions through value demonstration, not forced signup
5. Maintain clear UX distinction between guest and authenticated modes

## Non-Goals (v1)
- Partial lesson locking (first X lessons free)
- Per-lesson public/private toggles
- Anonymous quiz attempts with delayed signup
- Public course certificates
- Revenue sharing for public courses

## User Roles & Permissions

### Anonymous/Guest User
- View all lesson content (video, text, embeds)
- Navigate between lessons
- See course outline/structure
- **Cannot:** Take quizzes, submit exercises, track progress, bookmark

### Authenticated User
- All guest capabilities PLUS:
- Take quizzes and exercises
- Track progress (lessons completed, quiz scores)
- Bookmark/save courses
- Participate in discussions (if enabled)

### Course Creator/Admin
- Choose course type at creation: Live Class | Self Paced | **Public Course**
- Convert existing courses to Public (with warning about implications)
- View analytics: guest views vs authenticated engagement

## Functional Requirements

### 1. Course Type Selection

#### At Course Creation
```
Create New Course

[○] Live Class      - Scheduled sessions with instructor
[○] Self Paced      - Learner progresses at own pace  
[●] Public Course   - Open access, signup required for quizzes

[Continue] → Course Setup Wizard
```

#### Course Type Indicator
- Public courses show "Public" badge on cards (landing page, dashboard)
- Icon: `Globe` or `Unlock` to signify openness
- Color: Distinct from Live (red) and Self Paced (blue) - suggest green or teal

### 2. Anonymous Content Access

#### Lesson View (Guest Mode)
```
┌─────────────────────────────────────────────────────────┐
│ Course: Introduction to Python              [Sign In]   │
│                                                         │
│ ┌──────────────┐  ┌─────────────────────────────────┐   │
│ │ Lesson 3/12  │  │ Video Player / Lesson Content   │   │
│ │              │  │                                 │   │
│ │ ◉ Lesson 1   │  │ [Full content accessible]       │   │
│ │ ◉ Lesson 2   │  │                                 │   │
│ │ ◍ Lesson 3   │  │                                 │   │
│ │ ○ Lesson 4   │  │                                 │   │
│ │ ...          │  │                                 │   │
│ └──────────────┘  └─────────────────────────────────┘   │
│                                                         │
│                    ┌───────────────────────────────┐    │
│                    │ 💡 Sign in to:                │    │
│                    │ • Track your progress         │    │
│                    │ • Take practice quizzes       │    │
│                    │ • Earn a certificate          │    │
│                    │                               │    │
│                    │ [Create Free Account]         │    │
│                    └───────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### Access Rules
| Feature | Guest | Authenticated |
|---------|-------|---------------|
| View lesson content | ✅ | ✅ |
| Navigate lessons | ✅ | ✅ |
| See course outline | ✅ | ✅ |
| View quiz content | ✅ (read-only) | ✅ |
| Submit quiz answers | ❌ | ✅ |
| Submit exercises | ❌ | ✅ |
| Progress tracking | ❌ (localStorage only) | ✅ |
| Bookmark/continue | ❌ | ✅ |
| Discussion forum | Read-only | Read + Write |

### 3. Conversion Nudges (Soft Gates)

#### Contextual Prompts
1. **On Quiz View** (guest):
   ```
   ┌────────────────────────────────────────┐
   │ 📋 Practice Quiz: Variables & Types    │
   │                                        │
   │ [Question content visible]             │
   │                                        │
   │ ┌────────────────────────────────────┐ │
   │ │ 🚀 Ready to test your knowledge?   │ │
   │ │                                    │ │
   │ │ Sign in to take this quiz and      │ │
   │ │ track your progress.               │ │
   │ │                                    │ │
   │ │ [Sign In to Continue]              │ │
   │ └────────────────────────────────────┘ │
   └────────────────────────────────────────┘
   ```

2. **After Lesson Completion** (guest):
   ```
   Nice work completing this lesson! 🎉
   
   [Sign in] to save your progress and pick up 
   where you left off next time.
   
   [Continue as Guest] [Create Account]
   ```

3. **Progress Persistence Banner** (guest, after 2+ lessons):
   ```
   ⚠️ You're making great progress! Sign in to save 
   your place before you leave.
   [Dismiss] [Save My Progress]
   ```

#### Nudge Strategy
- **Never block content** with modal on page load
- **Inline prompts** within context (quiz area, lesson end)
- **Dismissible** - guests can continue browsing
- **Frequency cap** - max 1 prompt per session per nudge type

### 4. Anonymous Progress (localStorage)

#### What We Track (Guest)
```typescript
// localStorage key: `guest_progress_{courseId}`
{
  courseId: "course_xxx",
  lastVisitedLessonId: "lesson_123",
  completedLessons: ["lesson_001", "lesson_002"],
  totalTimeSpent: 1847, // seconds
  firstVisit: "2026-02-19T10:00:00Z",
  lastVisit: "2026-02-19T14:30:00Z"
}
```

#### Conversion to Authenticated
- On signup/login, prompt: "Continue course from where you left off?"
- Merge localStorage progress into authenticated account
- Clear localStorage after successful merge

### 5. Landing Page Integration

#### New "Public Courses" Section
```
Our Courses

[Live Classes] [Self Paced] [Public Courses]

Explore free courses - no signup required to start learning!

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ [thumbnail] │ │ [thumbnail] │ │ [thumbnail] │
│             │ │             │ │             │
│ Python      │ │ Web Design  │ │ Excel       │
│ Basics      │ │ Fundamentals│ │ for Work    │
│             │ │             │ │             │
│ 🌐 Public   │ │ 🌐 Public   │ │ 🌐 Public   │
│ ⭐ 4.8 (234)│ │ ⭐ 4.6 (189)│ │ ⭐ 4.9 (512)│
│             │ │             │ │             │
│ [Start      │ │ [Start      │ │ [Start      │
│  Learning]  │ │  Learning]  │ │  Learning]  │
└─────────────┘ └─────────────┘ └─────────────┘
```

#### Course Card Badges
- **Live Class**: "📅 Live" badge (red)
- **Self Paced**: "📚 Self Paced" badge (blue)
- **Public Course**: "🌐 Public" badge (green/teal)

### 6. URL Structure

```
# Public course lesson (accessible to all)
/course/{courseSlug}/lesson/{lessonSlug}

# Same URL works for both guest and authenticated
# Server renders content based on auth state
# No separate /public/ prefix needed
```

### 7. SEO & Sharing

#### Meta Tags for Public Courses
```html
<meta name="description" content="Free course: Learn Python basics. No signup required.">
<meta property="og:type" content="article">
<meta property="og:availability" content="public">
```

#### Social Sharing Card
```
┌────────────────────────┐
│                        │
│    [Course Thumbnail]  │
│                        │
├────────────────────────┤
│ Python Basics          │
│ Free course - start    │
│ learning instantly!    │
│                        │
│ 🌐 classroomio.com     │
└────────────────────────┘
```

## Technical Requirements

### Data Model Changes

#### Course Table
```typescript
// Add to existing course schema
type CourseType = 'LIVE_CLASS' | 'SELF_PACED' | 'PUBLIC';

interface Course {
  id: string;
  name: string;
  slug: string;
  // ... existing fields
  
  // NEW
  type: CourseType; // default: 'SELF_PACED'
  isPublic: boolean; // computed: type === 'PUBLIC'
  
  // Analytics (NEW)
  guestViews: number; // counter
  authenticatedViews: number; // counter
  conversionCount: number; // guests who signed up and enrolled
}
```

#### Enrollment Handling
- **Guest**: No enrollment record, localStorage tracking only
- **Authenticated**: Auto-enrolled on first authenticated interaction (quiz attempt, etc.)
- No explicit "Enroll" button for public courses - just start learning

### API Changes

#### New/Modified Endpoints
```typescript
// GET /courses/:slug/lessons/:lessonId
// Response changes based on auth:
// - Guest: lesson content + "requiresAuth" flags for interactive elements
// - Auth: lesson content + user's progress + full interactivity

// POST /courses/:slug/enroll (auto-triggered for public courses)
// Called implicitly when authenticated user first interacts

// GET /courses/public
// List public courses for landing page
// No auth required

// POST /analytics/guest-event
// Fire-and-forget guest activity tracking (privacy-safe)
```

### Permission Matrix

| Action | Guest | Authenticated | Admin |
|--------|-------|---------------|-------|
| View lesson content | ✅ | ✅ | ✅ |
| View quiz questions | ✅ (no answers) | ✅ | ✅ |
| Submit quiz | ❌ | ✅ | ✅ |
| Submit exercise | ❌ | ✅ | ✅ |
| See "correct answers" | ❌ | ✅ | ✅ |
| Post in discussion | ❌ | ✅ | ✅ |
| View progress stats | ❌ (local only) | ✅ | ✅ |
| Download resources | Configurable* | ✅ | ✅ |
\* Depends on `allowGuestDownloads` setting |

## Analytics & Success Metrics

### Key Metrics
1. **Guest to Auth Conversion Rate**: % of guests who sign up
2. **Guest Engagement**: Avg lessons viewed per guest session
3. **Time to Signup**: How many lessons before conversion
4. **Public Course Traffic**: % of total site traffic from public courses
5. **SEO Impact**: Organic search traffic to course pages

### Tracking Events
```typescript
// Guest events (anonymous, privacy-safe)
- public_course_viewed
- public_lesson_completed
- conversion_prompt_shown
- conversion_prompt_clicked
- guest_signup_initiated (from course context)

// Post-conversion
- guest_progress_merged
- public_course_enrolled (after signup)
```

## UX Considerations

### Clear Communication
- Banner on first visit: "You're browsing in guest mode. [Sign in] for full features."
- Persistent subtle indicator: "👤 Guest Mode" in header
- Tooltips on locked features explain why signup is needed

### Seamless Transition
- After signup, return to exact lesson/position
- Preserve scroll position
- Auto-merge localStorage progress

### No Dead Ends
- Every "locked" feature has clear path forward
- Alternative actions for guests (e.g., "Preview quiz questions" instead of "Take quiz")

## Future Enhancements (Post-v1)

1. **Course Previews**: Any course can have first lesson public
2. **Anonymous Quiz Attempts**: Try once, see score, signup to save
3. **Public Course Analytics Dashboard**: Creator insights on guest engagement
4. **Email Capture**: "Get notified when new public courses launch"
5. **Paywall Option**: Public → Paid conversion for premium tier

## Success Criteria

1. Guest users can view full course content without any signup friction
2. Conversion prompts appear contextually without being intrusive
3. Public courses appear on landing page with clear distinction
4. Post-signup experience seamlessly continues from guest session
5. No significant bounce rate increase on public course pages
6. Measurable conversion rate from guest to authenticated user

## Open Questions (Resolved)

1. ✅ **Downloadables** - Configurable per course (creator decides: public or gated)
2. ✅ **Live viewer count** - Yes, show "X people learning now" for social proof
3. ✅ **Donations** - Configurable Stripe link for "support this course"
4. ✅ **Revert to private** - Yes, creators can convert public → self-paced (with warning)

## Additional Course Settings for Public Courses

### Creator Configuration Options

When creating/editing a public course, creators can configure:

```typescript
interface PublicCourseSettings {
  // Access control
  allowGuestDownloads: boolean; // default: true
  
  // Social proof
  showLiveViewerCount: boolean; // default: true
  
  // Monetization
  acceptDonations: boolean; // default: false
  donationLink?: string; // Stripe payment link
  suggestedAmount?: number; // e.g., 5, 10, 25 USD
  
  // Conversion
  showConversionNudges: boolean; // default: true
  nudgeFrequency: 'low' | 'medium' | 'high'; // default: 'medium'
}
```

#### UI: Public Course Settings Panel
```
Public Course Settings
─────────────────────────────

☑ Allow guests to download resources
  [?] When checked, PDFs and files are downloadable without signup

☑ Show live viewer count
  [?] Displays "X people learning now" on course page

☐ Accept donations via Stripe
  Stripe Payment Link: [____________________]
  Suggested Amount: $[10] USD
  [?] Add a "Support this course" button

Conversion Nudges
(•) Low - After 3+ lessons and quiz views
( ) Medium - After 2+ lessons and at quizzes  
( ) High - After every lesson and on all interactive elements
```

### Live Viewer Count Display

```
┌────────────────────────────────────────┐
│ Python Basics                🌐 Public │
│                                        │
│ 👥 24 people learning now              │
│ ⭐ 4.8 (234 reviews)                   │
│                                        │
│ [💝 Support $10]  [Start Learning →]   │
└────────────────────────────────────────┘
```

**Implementation:**
- WebSocket or polling for real-time count
- Count unique sessions in last 15 minutes
- Fallback to "Popular" badge if count < 5

### Download Access Control

| Resource Type | Guest (allowed) | Guest (blocked) |
|--------------|-----------------|-----------------|
| Video lessons | ✅ Always | ✅ Always |
| Text content | ✅ Always | ✅ Always |
| PDF resources | ✅ Download | 🔒 Sign in to download |
| Code files | ✅ Download | 🔒 Sign in to download |
| Worksheets | ✅ Download | 🔒 Sign in to download |

### Reverting Public → Private

Creators can change course type, but with safeguards:

```
⚠️ Change Course Type

You are about to convert "Python Basics" from Public to Self Paced.

This will:
• Require login to access all content
• Preserve existing enrolled students' access
• Remove course from Public Courses listing
• Break any shared public links (will redirect to login)

[X] I understand this affects [1,247] guest learners

[Cancel] [Convert to Self Paced]
```

**Grace Period:**
- Existing guest sessions get 7-day grace period
- Show banner: "This course is now private. Sign up to continue."
- After 7 days, all guest access revoked

## Updated Data Model

### Course Table Additions
```typescript
interface Course {
  // ... existing fields
  type: 'LIVE_CLASS' | 'SELF_PACED' | 'PUBLIC';
  
  // Public course settings (nullable for non-public)
  publicSettings?: {
    allowGuestDownloads: boolean;
    showLiveViewerCount: boolean;
    acceptDonations: boolean;
    donationLink?: string;
    suggestedAmount?: number;
    showConversionNudges: boolean;
    nudgeFrequency: 'low' | 'medium' | 'high';
  };
  
  // Analytics
  currentViewers: number; // real-time-ish count
  totalGuestViews: number; // lifetime
  donationTotal?: number; // if accepting donations
}
```
