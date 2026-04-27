import {
  getDefaultWidgetConfig,
  type TWidgetLayoutType,
  type TWidgetPayload,
  type TWidgetPayloadCategory,
  type TWidgetPayloadCourse,
  type TWidgetPayloadCourseTag
} from '@cio/utils/validation/widget';

const TAGS: TWidgetPayloadCourseTag[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Compliance', slug: 'compliance', color: '#16a34a' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Math', slug: 'math', color: '#ef4444' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'AI', slug: 'ai', color: '#6366f1' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Certificate', slug: 'certificate', color: '#f59e0b' },
  { id: '55555555-5555-4555-8555-555555555555', name: 'Live', slug: 'live', color: '#0ea5e9' },
  { id: '66666666-6666-4666-8666-666666666666', name: 'Design', slug: 'design', color: '#ec4899' },
  { id: '77777777-7777-4777-8777-777777777777', name: 'Engineering', slug: 'engineering', color: '#14b8a6' },
  { id: '88888888-8888-4888-8888-888888888888', name: 'Leadership', slug: 'leadership', color: '#8b5cf6' }
];

/** Stable Unsplash thumbnails (signed by Unsplash, no API key needed) at 800×500. */
function unsplash(seed: string): string {
  return `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&h=500&q=70`;
}

function makeCourse(
  partial: Partial<TWidgetPayloadCourse> & { id: string; title: string; courseType: string }
): TWidgetPayloadCourse {
  return {
    id: partial.id,
    slug: partial.id,
    title: partial.title,
    description:
      partial.description ??
      'A structured course covering core concepts, applied exercises, and a final assessment to lock in mastery.',
    imageUrl: partial.imageUrl ?? null,
    price: partial.price ?? 'Free',
    lessonCount: partial.lessonCount ?? 12,
    exerciseCount: partial.exerciseCount ?? 4,
    rating: partial.rating ?? 4.4,
    ratingCount: partial.ratingCount ?? 38,
    courseType: partial.courseType,
    createdAt: partial.createdAt ?? new Date().toISOString(),
    tags: partial.tags ?? [],
    featured: partial.featured ?? false,
    url: partial.url ?? `https://demo.classroomio.com/course/${partial.id}`
  };
}

const COURSES: TWidgetPayloadCourse[] = [
  makeCourse({
    id: 'aaaaaaa1-1111-4111-8111-aaaaaaaaaaaa',
    title: 'SaaS Security & Compliance Essentials',
    description:
      'Stand up a SOC 2-ready posture in weeks: scope, controls, evidence collection, vendor reviews, and audit prep — explained for engineers and ops leads.',
    courseType: 'COMPLIANCE',
    rating: 4.0,
    ratingCount: 28,
    lessonCount: 14,
    exerciseCount: 4,
    price: '$199',
    imageUrl: unsplash('photo-1518770660439-4636190af475'),
    tags: [TAGS[0], TAGS[3]]
  }),
  makeCourse({
    id: 'aaaaaaa2-2222-4222-8222-aaaaaaaaaaab',
    title: 'Geometry: Shapes, Proofs, and Space',
    description:
      'Twenty-five hands-on lessons on Euclidean and analytic geometry, with proof-writing drills and visual intuition for transformations and loci.',
    courseType: 'SELF_PACED',
    rating: 4.8,
    ratingCount: 112,
    lessonCount: 25,
    exerciseCount: 9,
    price: 'Free',
    imageUrl: unsplash('photo-1509228468518-180dd4864904'),
    tags: [TAGS[1], TAGS[3]]
  }),
  makeCourse({
    id: 'aaaaaaa3-3333-4333-8333-aaaaaaaaaaac',
    title: 'Trigonometry Rebuild: A Detailed Refresher',
    description:
      'Rebuild your trig instincts from the unit circle up. Identities, graphs, inverse functions, and applied problems with worked solutions.',
    courseType: 'SELF_PACED',
    rating: 4.2,
    ratingCount: 47,
    lessonCount: 7,
    exerciseCount: 4,
    price: '$49',
    imageUrl: unsplash('photo-1503676260728-1c00da094a0b'),
    tags: [TAGS[1], TAGS[3]]
  }),
  makeCourse({
    id: 'aaaaaaa4-4444-4444-8444-aaaaaaaaaaad',
    title: 'AI Ethics & Responsible Use in Production',
    description:
      'A practical, case-based curriculum for product teams shipping LLM features. Bias audits, eval harnesses, escalation paths, and red-team exercises.',
    courseType: 'LIVE_CLASS',
    rating: 4.9,
    ratingCount: 203,
    lessonCount: 9,
    exerciseCount: 2,
    price: '$299',
    imageUrl: unsplash('photo-1677442136019-21780ecad995'),
    tags: [TAGS[2], TAGS[4], TAGS[3]]
  }),
  makeCourse({
    id: 'aaaaaaa5-5555-4555-8555-aaaaaaaaaaae',
    title: 'Data Privacy Fundamentals (GDPR & CCPA)',
    description:
      'Map data flows, write defensible DPIAs, and configure consent so legal sleeps at night. Built for PMs, engineers, and customer-facing teams.',
    courseType: 'COMPLIANCE',
    rating: 4.3,
    ratingCount: 61,
    lessonCount: 11,
    exerciseCount: 3,
    price: '$149',
    imageUrl: unsplash('photo-1554224155-6726b3ff858f'),
    tags: [TAGS[0]]
  }),
  makeCourse({
    id: 'aaaaaaa6-6666-4666-8666-aaaaaaaaaaaf',
    title: 'Business Communication for Hybrid Teams',
    description:
      'Run sharper standups, write briefs that stick, and present decisions to execs. Six live workshops with peer feedback and rubrics.',
    courseType: 'LIVE_CLASS',
    rating: 4.1,
    ratingCount: 39,
    lessonCount: 12,
    exerciseCount: 5,
    price: '$129',
    imageUrl: unsplash('photo-1552664730-d307ca884978'),
    tags: [TAGS[4], TAGS[3], TAGS[7]]
  }),
  makeCourse({
    id: 'aaaaaaa7-7777-4777-8777-aaaaaaaaaaa1',
    title: 'Design Systems with Tokens & Figma',
    description:
      'From color ramps to multi-brand theming. Build a token pipeline that survives team changes, with hands-on Figma-to-code workflows.',
    courseType: 'SELF_PACED',
    rating: 4.7,
    ratingCount: 87,
    lessonCount: 18,
    exerciseCount: 6,
    price: '$179',
    imageUrl: unsplash('photo-1581291518633-83b4ebd1d83e'),
    tags: [TAGS[5], TAGS[3]]
  }),
  makeCourse({
    id: 'aaaaaaa8-8888-4888-8888-aaaaaaaaaaa2',
    title: 'TypeScript for Production Engineers',
    description:
      'Stop fighting the inferencer. Generics, type guards, conditional types, and migration patterns for sprawling JavaScript codebases.',
    courseType: 'SELF_PACED',
    rating: 4.6,
    ratingCount: 156,
    lessonCount: 22,
    exerciseCount: 12,
    price: '$229',
    imageUrl: unsplash('photo-1517694712202-14dd9538aa97'),
    tags: [TAGS[6], TAGS[3]]
  }),
  makeCourse({
    id: 'aaaaaaa9-9999-4999-8999-aaaaaaaaaaa3',
    title: 'Engineering Management 101',
    description:
      'The transition from staff engineer to engineering manager: 1:1s, performance feedback, hiring loops, and the calendar discipline nobody warns you about.',
    courseType: 'LIVE_CLASS',
    rating: 4.5,
    ratingCount: 92,
    lessonCount: 10,
    exerciseCount: 4,
    price: '$249',
    imageUrl: unsplash('photo-1521737711867-e3b97375f902'),
    tags: [TAGS[7], TAGS[4], TAGS[3]]
  }),
  makeCourse({
    id: 'aaaaaaab-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    title: 'Postgres Performance for Application Teams',
    description:
      'Indexes that earn their keep, EXPLAIN ANALYZE without the panic, and the partitioning strategies that keep your p99 honest.',
    courseType: 'SELF_PACED',
    rating: 4.8,
    ratingCount: 64,
    lessonCount: 16,
    exerciseCount: 7,
    price: '$159',
    imageUrl: unsplash('photo-1544383835-bda2bc66a55d'),
    tags: [TAGS[6]]
  }),
  makeCourse({
    id: 'aaaaaaac-bbbb-4bbb-8bbb-aaaaaaaaaaa5',
    title: 'Practical Calculus for Data Practitioners',
    description:
      'Limits, derivatives, integrals — taught through gradient descent, ROC curves, and the math that actually shows up in your notebooks.',
    courseType: 'SELF_PACED',
    rating: 4.4,
    ratingCount: 41,
    lessonCount: 14,
    exerciseCount: 8,
    price: '$99',
    imageUrl: unsplash('photo-1635070041078-e363dbe005cb'),
    tags: [TAGS[1], TAGS[2]]
  }),
  makeCourse({
    id: 'aaaaaaad-cccc-4ccc-8ccc-aaaaaaaaaaa6',
    title: 'Brand Visual Identity Workshop',
    description:
      'A four-week studio: research, moodboards, logo systems, and a packaged brand guideline ready for client handoff.',
    courseType: 'LIVE_CLASS',
    rating: 4.6,
    ratingCount: 73,
    lessonCount: 8,
    exerciseCount: 3,
    price: '$219',
    imageUrl: unsplash('photo-1561070791-2526d30994b8'),
    tags: [TAGS[5], TAGS[4]]
  })
];

const courseIdsByTag = new Map<string, string[]>();
for (const tag of TAGS) {
  courseIdsByTag.set(
    tag.id,
    COURSES.filter((course) => course.tags.some((courseTag) => courseTag.id === tag.id)).map((course) => course.id)
  );
}

const CATEGORIES: TWidgetPayloadCategory[] = TAGS.filter((tag) => (courseIdsByTag.get(tag.id)?.length ?? 0) > 0).map(
  (tag) => ({
    tagId: tag.id,
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
    courseIds: courseIdsByTag.get(tag.id) ?? []
  })
);

export function makeFixturePayload(layoutType: TWidgetLayoutType): TWidgetPayload {
  const config = getDefaultWidgetConfig();

  if (layoutType === 'primary_course') {
    config.layoutOptions.primaryCourse.featuredCourseId = COURSES[3].id;
    config.layoutOptions.primaryCourse.eyebrowLabel = 'Featured course';
    config.layoutOptions.primaryCourse.ctaLabel = 'Enroll today';
  }
  if (layoutType === 'editorial_spotlight') {
    config.layoutOptions.editorialSpotlight.mainCourseId = COURSES[3].id;
  }
  if (layoutType === 'category_shelf') {
    config.layoutOptions.categoryShelf.categoryTagIds = CATEGORIES.map((cat) => cat.tagId);
    config.layoutOptions.categoryShelf.maxPerCategory = 4;
  }
  if (layoutType === 'card_grid') {
    config.layoutOptions.cardGrid.maxCount = 9;
  }
  if (layoutType === 'tag_filter') {
    config.layoutOptions.tagFilter.maxCount = 12;
  }
  if (layoutType === 'carousel') {
    config.layoutOptions.carousel.maxCount = 8;
  }
  if (layoutType === 'compact_list') {
    config.layoutOptions.compactList.maxCount = 6;
  }

  const featuredId =
    layoutType === 'primary_course'
      ? config.layoutOptions.primaryCourse.featuredCourseId
      : layoutType === 'editorial_spotlight'
        ? config.layoutOptions.editorialSpotlight.mainCourseId
        : null;

  const orderedCourses = featuredId
    ? [
        COURSES.find((course) => course.id === featuredId)!,
        ...COURSES.filter((course) => course.id !== featuredId)
      ].map((course, index) => ({ ...course, featured: index === 0 }))
    : COURSES;

  return {
    version: 'v1',
    widgetId: '99999999-9999-4999-8999-999999999999',
    publicKey: 'wgt_storybook_demo_key',
    organization: {
      id: 'aaaaaaaa-0000-4000-8000-aaaaaaaa0000',
      name: 'Acme Academy',
      siteName: 'acme',
      customDomain: null
    },
    layoutType,
    selectionMode: 'manual',
    design: config,
    planGatedFields: {
      isPaidPlan: true,
      canUseCustomColors: true,
      canUseCustomCss: true,
      canToggleBranding: true,
      isBrandingForced: false,
      availableThemes: ['classroomio', 'graphite', 'linen', 'spruce'],
      selectedTheme: 'classroomio'
    },
    labels: {
      loadMoreLabel: 'Load more',
      poweredByLabel: 'Powered by Classroomio'
    },
    courses: orderedCourses,
    tagPool: layoutType === 'tag_filter' ? TAGS : [],
    categories: layoutType === 'category_shelf' ? CATEGORIES : [],
    timestamp: Date.now()
  };
}
