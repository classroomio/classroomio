import type {
  LearningPath,
  LearningPathCourse,
  LearningPathStatus,
  LearningPathWithEnrollment,
  LearningPathCourseProgress,
  LearningPathCourseState,
  LearningPathEnrollment
} from './types';

const BASE_COVERS: Record<string, string> = {
  blue: 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
  green: 'linear-gradient(135deg, oklch(0.596 0.145 163.225), oklch(0.696 0.17 162.48))',
  orange: 'linear-gradient(135deg, oklch(0.666 0.179 58.318), oklch(0.769 0.188 70.08))',
  purple: 'linear-gradient(135deg, oklch(0.585 0.233 277.117), oklch(0.606 0.25 292.717))',
  teal: 'linear-gradient(135deg, oklch(0.723 0.219 149.579), oklch(0.596 0.145 163.225))',
  sky: 'linear-gradient(135deg, oklch(0.685 0.169 237.323), oklch(0.488 0.243 264.376))',
  red: 'linear-gradient(135deg, oklch(0.645 0.246 16.439), oklch(0.586 0.253 17.585))'
};

function makeCourse(data: {
  id: string;
  title: string;
  description: string;
  order: number;
  coverGradient?: string;
  coverImage?: string;
  lessonCount: number;
  exerciseCount: number;
  lessonsCompleted: number;
  exercisesCompleted: number;
  durationHours: number;
  cost: number;
  outcomeBullets?: string[];
}): LearningPathCourse {
  return {
    ...data,
    slug: `course-${data.id}`,
    outcomeBullets: data.outcomeBullets ?? [
      'Build real-world projects as part of the curriculum.',
      'Get hands-on with guided exercises after every module.'
    ]
  };
}

const HTML_CSS = makeCourse({
  id: 'c-html-css',
  title: 'HTML & CSS Foundations',
  description: 'Semantic markup, the box model, flexbox, and responsive layout basics.',
  order: 1,
  coverGradient: BASE_COVERS.orange,
  coverImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=640&q=80',
  lessonCount: 10,
  exerciseCount: 3,
  lessonsCompleted: 10,
  exercisesCompleted: 3,
  durationHours: 8,
  cost: 59
});

const JS_ESSENTIALS = makeCourse({
  id: 'c-js',
  title: 'JavaScript Essentials',
  description: 'Types, functions, the DOM, async/await, and fetching data from APIs.',
  order: 2,
  coverGradient: BASE_COVERS.orange,
  coverImage: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=640&q=80',
  lessonCount: 12,
  exerciseCount: 4,
  lessonsCompleted: 12,
  exercisesCompleted: 4,
  durationHours: 10,
  cost: 79
});

const REACT = makeCourse({
  id: 'c-react',
  title: 'Modern Web Development with React',
  description: 'Components, props & state, hooks, and building interactive UIs.',
  order: 3,
  coverGradient: BASE_COVERS.sky,
  coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=640&q=80',
  lessonCount: 12,
  exerciseCount: 4,
  lessonsCompleted: 9,
  exercisesCompleted: 2,
  durationHours: 12,
  cost: 99
});

const REACT_ADVANCED = makeCourse({
  id: 'c-react-advanced',
  title: 'State Management & Data Fetching',
  description: 'Context, reducers, caching, and connecting a React app to a backend.',
  order: 4,
  coverGradient: BASE_COVERS.purple,
  coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=640&q=80',
  lessonCount: 10,
  exerciseCount: 3,
  lessonsCompleted: 0,
  exercisesCompleted: 0,
  durationHours: 10,
  cost: 89
});

const CAPSTONE = makeCourse({
  id: 'c-capstone',
  title: 'Building & Shipping a Capstone',
  description: 'Plan, build, and deploy a full project — your portfolio piece.',
  order: 5,
  coverGradient: BASE_COVERS.red,
  coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=640&q=80',
  lessonCount: 7,
  exerciseCount: 1,
  lessonsCompleted: 0,
  exercisesCompleted: 0,
  durationHours: 12,
  cost: 99
});

const PYTHON_BASICS = makeCourse({
  id: 'c-python',
  title: 'Intro to Python',
  description: 'Syntax, data types, and your first scripts.',
  order: 1,
  coverGradient: BASE_COVERS.green,
  coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=640&q=80',
  lessonCount: 10,
  exerciseCount: 3,
  lessonsCompleted: 3,
  exercisesCompleted: 1,
  durationHours: 6,
  cost: 49
});

const PANDAS = makeCourse({
  id: 'c-pandas',
  title: 'Pandas & Data Wrangling',
  description: 'Clean, reshape, and analyze tabular data at scale.',
  order: 2,
  coverGradient: BASE_COVERS.green,
  coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=640&q=80',
  lessonCount: 9,
  exerciseCount: 3,
  lessonsCompleted: 0,
  exercisesCompleted: 0,
  durationHours: 8,
  cost: 69
});

const VIZ = makeCourse({
  id: 'c-viz',
  title: 'Data Visualization',
  description: 'Charts, storytelling, and dashboards that communicate clearly.',
  order: 3,
  coverGradient: BASE_COVERS.teal,
  coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=640&q=80',
  lessonCount: 8,
  exerciseCount: 2,
  lessonsCompleted: 0,
  exercisesCompleted: 0,
  durationHours: 7,
  cost: 59
});

const ML_BASICS = makeCourse({
  id: 'c-ml',
  title: 'Applied Machine Learning',
  description: 'Scikit-learn pipelines, evaluation, and a final project.',
  order: 4,
  coverGradient: BASE_COVERS.purple,
  coverImage: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=640&q=80',
  lessonCount: 11,
  exerciseCount: 3,
  lessonsCompleted: 0,
  exercisesCompleted: 0,
  durationHours: 10,
  cost: 89
});

const SEC_AWARENESS = makeCourse({
  id: 'c-sec',
  title: 'Security Awareness 2026',
  description: 'Phishing, passwords, device hygiene, and incident reporting.',
  order: 1,
  coverGradient: BASE_COVERS.blue,
  coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=640&q=80',
  lessonCount: 6,
  exerciseCount: 2,
  lessonsCompleted: 6,
  exercisesCompleted: 2,
  durationHours: 3,
  cost: 29
});

const DATA_HANDLING = makeCourse({
  id: 'c-data',
  title: 'Data Handling & Privacy',
  description: 'Classification, retention, and safe disposal of sensitive data.',
  order: 2,
  coverGradient: BASE_COVERS.sky,
  coverImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=640&q=80',
  lessonCount: 5,
  exerciseCount: 2,
  lessonsCompleted: 5,
  exercisesCompleted: 2,
  durationHours: 2,
  cost: 29
});

const CODE_CONDUCT = makeCourse({
  id: 'c-conduct',
  title: 'Code of Conduct',
  description: 'Workplace behavior, reporting, and anti-harassment standards.',
  order: 3,
  coverGradient: BASE_COVERS.orange,
  coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=640&q=80',
  lessonCount: 4,
  exerciseCount: 1,
  lessonsCompleted: 4,
  exercisesCompleted: 1,
  durationHours: 2,
  cost: 19
});

const PRODUCT_ANALYTICS_COURSES = [
  makeCourse({
    id: 'c-pa-1',
    title: 'Product Analytics Fundamentals',
    description: 'Metrics frameworks and the analytics stack.',
    order: 1,
    coverGradient: BASE_COVERS.teal,
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=640&q=80',
    lessonCount: 6,
    exerciseCount: 2,
    lessonsCompleted: 0,
    exercisesCompleted: 0,
    durationHours: 1,
    cost: 19
  })
];

export function computeCourseState(course: LearningPathCourse): LearningPathCourseState {
  const lessonsComplete = course.lessonsCompleted >= course.lessonCount;
  const exercisesComplete = course.exercisesCompleted >= course.exerciseCount;

  if (lessonsComplete && exercisesComplete) {
    return 'COMPLETED';
  }

  if (course.lessonsCompleted > 0 || course.exercisesCompleted > 0) {
    return 'IN_PROGRESS';
  }

  return 'NOT_STARTED';
}

export function getCourseState(
  course: LearningPathCourse,
  previousComplete: boolean,
  sequentialUnlock: boolean
): LearningPathCourseState {
  const ownProgress = computeCourseState(course);

  if (!sequentialUnlock) {
    return ownProgress;
  }

  if (!previousComplete) {
    return 'LOCKED';
  }

  return ownProgress;
}

export function computePathProgress(
  courses: LearningPathCourse[],
  sequentialUnlock: boolean
): { progressPercent: number; coursesCompleted: number; unlocked: number } {
  const totalCourses = courses.length;
  if (totalCourses === 0) {
    return { progressPercent: 0, coursesCompleted: 0, unlocked: 0 };
  }

  const states = courses.map((course, index) => {
    const previousComplete = index === 0 || isCourseComplete(courses[index - 1]);

    return getCourseState(course, previousComplete, sequentialUnlock);
  });

  const coursesCompleted = states.filter((state) => state === 'COMPLETED').length;
  const unlocked = states.filter((state) => state !== 'LOCKED').length;

  return {
    progressPercent: Math.round((coursesCompleted / totalCourses) * 100),
    coursesCompleted,
    unlocked
  };
}

function isCourseComplete(course: LearningPathCourse): boolean {
  return course.lessonsCompleted >= course.lessonCount && course.exercisesCompleted >= course.exerciseCount;
}

export const IDS = {
  FE_BOOTCAMP: 'path-fe-bootcamp',
  DS_PYTHON: 'path-ds-python',
  COMPLIANCE: 'path-compliance',
  PRODUCT_ANALYTICS: 'path-product-analytics',
  CUSTOMER_SUCCESS: 'path-customer-success',
  AUTOMATION: 'path-automation',
  DRAFT_BOOTCAMP: 'path-draft-backend'
};

function createBasePath(
  id: string,
  data: {
    name: string;
    slug: string;
    description: string;
    status: LearningPathStatus;
    cost: number;
    coverGradient: string;
    coverImage?: string;
    difficulty: LearningPathWithEnrollment['difficulty'];
    sequentialUnlock?: boolean;
    showSavings?: boolean;
    certificateEnabled?: boolean;
    certificateTitle?: string;
    createdAt?: string;
    updatedAt?: string;
  }
): LearningPath {
  return {
    id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    coverImage: data.coverImage,
    coverGradient: data.coverGradient,
    status: data.status,
    cost: data.cost,
    currency: 'USD',
    showSavings: data.showSavings ?? true,
    sequentialUnlock: data.sequentialUnlock ?? true,
    selfEnrollment: true,
    autoEnroll: true,
    certificateEnabled: data.certificateEnabled ?? true,
    certificateTitle: data.certificateTitle ?? `${data.name} Certificate`,
    certificateIssuer: 'ClassroomIO Academy',
    difficulty: data.difficulty,
    createdByProfileId: 'p-admin',
    createdAt: data.createdAt ?? '2026-01-12T09:00:00.000Z',
    updatedAt: data.updatedAt ?? '2026-02-01T09:00:00.000Z',
    landing: {
      headline: data.name,
      subheadline: data.description,
      visitorAccess: 'preview',
      outcomes: [],
      skills: [],
      showInstructors: true,
      testimonials: [],
      showTestimonials: true,
      faqs: [],
      showFaqs: true
    },
    instructors: [
      { id: 'i-1', name: 'Ada Okafor', title: 'Lead Instructor' },
      { id: 'i-2', name: 'Ben Carter', title: 'Senior Instructor' }
    ],
    courses: [],
    members: []
  };
}

function seedMembers(
  pathId: string,
  rows: Array<{
    id: string;
    name: string;
    email: string;
    enrolledAt: string;
    completedAt?: string | null;
    certificateIssuedAt?: string | null;
    certificateId?: string | null;
  }>
): LearningPath['members'] {
  return rows.map((row) => ({
    id: row.id,
    pathId,
    profileId: row.id,
    name: row.name,
    email: row.email,
    role: 'STUDENT',
    enrolledAt: row.enrolledAt,
    completedAt: row.completedAt ?? null,
    certificateIssuedAt: row.certificateIssuedAt ?? null,
    certificateId: row.certificateId ?? null
  }));
}

function withLanding(base: LearningPath, landing: Partial<LearningPath['landing']>): LearningPath {
  return { ...base, landing: { ...base.landing, ...landing } };
}

export function buildMockPaths(): LearningPath[] {
  const feBootcamp = withLanding(
    {
      ...createBasePath(IDS.FE_BOOTCAMP, {
        name: 'Frontend Engineering Bootcamp',
        slug: 'frontend-engineering-bootcamp',
        description:
          'A guided, five-course track that takes you from markup fundamentals to shipping a production React app. Each course unlocks the next — finish in order to earn your certificate.',
        status: 'ACTIVE',
        cost: 229,
        coverGradient: BASE_COVERS.sky,
        coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=640&q=80',
        difficulty: 'Intermediate',
        createdAt: '2026-01-12T09:00:00.000Z',
        updatedAt: '2026-03-02T09:00:00.000Z'
      })
    },
    {
      headline: 'Become a job-ready frontend engineer',
      subheadline:
        'A guided five-course track from markup fundamentals to shipping a production React app. Finish in order to earn your certificate.',
      outcomes: [
        'Build responsive, accessible web pages with modern HTML & CSS',
        'Write clean, typed JavaScript and fetch data from real APIs',
        'Build interactive UIs with React components and hooks',
        'Manage state, cache data, and ship a full capstone project'
      ],
      skills: ['HTML', 'CSS', 'JavaScript', 'React', 'REST APIs', 'Git'],
      testimonials: [
        {
          id: 'f-t1',
          name: 'Maria Santos',
          role: 'Frontend Developer',
          quote:
            'The unlock-in-order format kept me honest. I finished the full track in six weeks and shipped a capstone I was genuinely proud of.'
        },
        {
          id: 'f-t2',
          name: 'David Oluwaseun',
          role: 'Career-switcher',
          quote:
            'Clear lessons, practical exercises, and a certificate that mattered for my first dev interview. Highly recommended.'
        }
      ],
      faqs: [
        {
          id: 'f-f1',
          question: 'Do courses unlock automatically?',
          answer:
            'Yes. With sequential unlocking on, each course unlocks once you complete every lesson and exercise in the previous one.'
        },
        {
          id: 'f-f2',
          question: 'Can I buy the courses individually?',
          answer:
            'Yes — every course remains available on its own. The bundle price simply saves you money versus buying them separately.'
        },
        {
          id: 'f-f3',
          question: 'What do I get when I finish?',
          answer:
            'A path certificate once all five courses are complete, alongside your individual course certificates.'
        }
      ]
    }
  );
  feBootcamp.courses = [HTML_CSS, JS_ESSENTIALS, REACT, REACT_ADVANCED, CAPSTONE];
  feBootcamp.members = seedMembers(IDS.FE_BOOTCAMP, [
    {
      id: 'm-ada',
      name: 'Ada Okafor',
      email: 'ada@test.com',
      enrolledAt: '2026-01-15T10:00:00.000Z'
    },
    {
      id: 'm-tom',
      name: 'Tom Becker',
      email: 'tom@test.com',
      enrolledAt: '2026-01-20T10:00:00.000Z',
      completedAt: '2026-05-12T10:00:00.000Z',
      certificateIssuedAt: '2026-05-12T10:00:00.000Z',
      certificateId: 'LP-1234-5678'
    },
    {
      id: 'm-lena',
      name: 'Lena Petrova',
      email: 'lena@test.com',
      enrolledAt: '2026-02-01T10:00:00.000Z'
    }
  ]);

  const dsPython = withLanding(
    createBasePath(IDS.DS_PYTHON, {
      name: 'Data Science with Python',
      slug: 'data-science-with-python',
      description: 'Pandas, visualization, and applied machine-learning basics.',
      status: 'ACTIVE',
      cost: 149,
      coverGradient: BASE_COVERS.green,
      coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=640&q=80',
      difficulty: 'Beginner',
      createdAt: '2026-01-05T09:00:00.000Z',
      updatedAt: '2026-02-20T09:00:00.000Z'
    }),
    {
      headline: 'From zero to confident data analyst',
      subheadline: 'Learn Python, wrangle data with Pandas, visualize it clearly, and run your first ML models.',
      outcomes: [
        'Write Python scripts with confidence',
        'Clean and reshape messy tabular datasets',
        'Build clear, publication-ready visualizations',
        'Train and evaluate your first ML models'
      ],
      skills: ['Python', 'Pandas', 'Matplotlib', 'Scikit-learn'],
      faqs: [
        {
          id: 'd-f1',
          question: 'Do I need prior experience?',
          answer: 'No — the track starts with Python fundamentals and builds up from there.'
        }
      ]
    }
  );
  dsPython.courses = [PYTHON_BASICS, PANDAS, VIZ, ML_BASICS];
  dsPython.members = seedMembers(IDS.DS_PYTHON, [
    {
      id: 'm-ada',
      name: 'Ada Okafor',
      email: 'ada@test.com',
      enrolledAt: '2026-03-01T10:00:00.000Z'
    },
    {
      id: 'm-chi',
      name: 'Chi Nguyen',
      email: 'chi@test.com',
      enrolledAt: '2026-03-10T10:00:00.000Z'
    }
  ]);

  const compliance = withLanding(
    createBasePath(IDS.COMPLIANCE, {
      name: 'Workplace Compliance 2026',
      slug: 'workplace-compliance-2026',
      description: 'Security awareness, data handling, and code of conduct.',
      status: 'ACTIVE',
      cost: 0,
      coverGradient: BASE_COVERS.blue,
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=640&q=80',
      difficulty: 'Beginner',
      sequentialUnlock: true,
      showSavings: false,
      createdAt: '2026-01-02T09:00:00.000Z',
      updatedAt: '2026-03-01T09:00:00.000Z'
    }),
    {
      headline: 'Your annual compliance training',
      subheadline: 'Three short courses covering the essentials — complete all three to earn your certificate.',
      outcomes: [
        'Recognize and report phishing attempts',
        'Handle personal data safely and legally',
        'Understand workplace reporting standards'
      ],
      skills: ['Security', 'Privacy', 'Workplace ethics']
    }
  );
  compliance.courses = [SEC_AWARENESS, DATA_HANDLING, CODE_CONDUCT];
  compliance.members = seedMembers(IDS.COMPLIANCE, [
    {
      id: 'm-ada',
      name: 'Ada Okafor',
      email: 'ada@test.com',
      enrolledAt: '2026-02-10T10:00:00.000Z',
      completedAt: '2026-02-18T10:00:00.000Z',
      certificateIssuedAt: '2026-02-18T10:00:00.000Z',
      certificateId: 'LP-2233-4455'
    },
    {
      id: 'm-jon',
      name: 'Jonas Weber',
      email: 'jonas@test.com',
      enrolledAt: '2026-02-11T10:00:00.000Z'
    }
  ]);

  const productAnalytics = withLanding(
    createBasePath(IDS.PRODUCT_ANALYTICS, {
      name: 'Become a Product Analytics Expert',
      slug: 'product-analytics-expert',
      description: '8 courses · 6h 30m — a structured track for reading, building, and acting on product data.',
      status: 'ACTIVE',
      cost: 89,
      coverGradient: BASE_COVERS.teal,
      coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=640&q=80',
      difficulty: 'Intermediate',
      createdAt: '2026-02-01T09:00:00.000Z',
      updatedAt: '2026-03-05T09:00:00.000Z'
    }),
    {
      headline: 'Read, build, and act on product data',
      subheadline: 'A structured track for product managers and analysts.',
      outcomes: ['Define product metrics', 'Build analytics dashboards', 'Run experiments'],
      skills: ['SQL', 'Amplitude', 'A/B testing'],
      faqs: []
    }
  );
  productAnalytics.courses = PRODUCT_ANALYTICS_COURSES;
  productAnalytics.members = [];

  const customerSuccess = withLanding(
    createBasePath(IDS.CUSTOMER_SUCCESS, {
      name: 'Customer Success Foundations',
      slug: 'customer-success-foundations',
      description: '6 courses · 4h 20m — onboarding, health scoring, and renewal playbooks.',
      status: 'ACTIVE',
      cost: 0,
      coverGradient: BASE_COVERS.sky,
      coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=640&q=80',
      difficulty: 'Beginner',
      showSavings: false,
      createdAt: '2026-02-05T09:00:00.000Z',
      updatedAt: '2026-03-01T09:00:00.000Z'
    }),
    { headline: 'Onboarding, health scoring, and renewals', subheadline: '', faqs: [] }
  );
  customerSuccess.courses = [];
  customerSuccess.members = [];

  const automation = withLanding(
    createBasePath(IDS.AUTOMATION, {
      name: 'Automating Your Workflows',
      slug: 'automating-your-workflows',
      description: '5 courses · 3h 45m — triggers, conditions, and multi-step automations.',
      status: 'ACTIVE',
      cost: 59,
      coverGradient: BASE_COVERS.purple,
      coverImage: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=640&q=80',
      difficulty: 'Advanced',
      createdAt: '2026-02-10T09:00:00.000Z',
      updatedAt: '2026-03-02T09:00:00.000Z'
    }),
    { headline: 'Design reliable, multi-step automations', subheadline: '', faqs: [] }
  );
  automation.courses = [];
  automation.members = [];

  const draftBackend = createBasePath(IDS.DRAFT_BOOTCAMP, {
    name: 'Backend Engineering Track',
    slug: 'backend-engineering-track',
    description: 'Node.js, databases, and API design — in progress.',
    status: 'DRAFT',
    cost: 199,
    coverGradient: BASE_COVERS.red,
    coverImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=640&q=80',
    difficulty: 'Advanced',
    sequentialUnlock: true,
    createdAt: '2026-03-08T09:00:00.000Z',
    updatedAt: '2026-03-08T09:00:00.000Z'
  });
  draftBackend.landing = {
    ...draftBackend.landing,
    headline: 'Backend Engineering Track',
    subheadline: '',
    outcomes: [],
    skills: [],
    testimonials: [],
    faqs: []
  };

  return [feBootcamp, dsPython, compliance, productAnalytics, customerSuccess, automation, draftBackend];
}

export const MOCK_PATHS = buildMockPaths();

const CURRENT_USER_ID = 'm-ada';

export function getMockPathsForUser(): LearningPathWithEnrollment[] {
  return MOCK_PATHS.filter((path) => path.members.some((member) => member.id === CURRENT_USER_ID)).map((path) => {
    const member = path.members.find((member) => member.id === CURRENT_USER_ID)!;

    const courseProgress = getCourseProgressList(path);
    const completed = courseProgress.filter((c) => c.state === 'COMPLETED').length;

    return {
      ...path,
      enrollment: {
        pathId: path.id,
        memberId: member.id,
        enrolledAt: member.enrolledAt,
        completedAt: member.completedAt,
        certificateIssuedAt: member.certificateIssuedAt,
        certificateId: member.certificateId,
        progressPercent: path.courses.length === 0 ? 0 : Math.round((completed / path.courses.length) * 100),
        coursesCompleted: completed,
        totalCourses: path.courses.length,
        currentCourse: courseProgress.find((c) => c.state === 'IN_PROGRESS') ?? null,
        state:
          completed === path.courses.length && path.courses.length > 0
            ? 'COMPLETED'
            : courseProgress.some((c) => c.state === 'IN_PROGRESS') || completed > 0
              ? 'IN_PROGRESS'
              : 'NOT_STARTED'
      }
    };
  });
}

export function getCourseProgressList(path: LearningPath): LearningPathCourseProgress[] {
  let previousComplete = true;

  return path.courses.map((course, index) => {
    const state = getCourseState(course, previousComplete, path.sequentialUnlock);
    const lessonsExpected = course.lessonCount;
    const exercisesExpected = course.exerciseCount;
    const totalItems = lessonsExpected + exercisesExpected;
    const doneItems = course.lessonsCompleted + course.exercisesCompleted;

    previousComplete = state === 'COMPLETED';

    const progressPercent =
      state === 'COMPLETED'
        ? 100
        : state === 'LOCKED'
          ? 0
          : totalItems === 0
            ? 0
            : Math.round((doneItems / totalItems) * 100);

    return {
      courseId: course.id,
      courseIndex: index,
      order: course.order,
      title: course.title,
      state,
      progressPercent,
      lessonCount: lessonsExpected,
      exerciseCount: exercisesExpected,
      lessonsCompleted: course.lessonsCompleted,
      exercisesCompleted: course.exercisesCompleted,
      durationHours: course.durationHours,
      slug: course.slug,
      coverGradient: course.coverGradient,
      coverImage: course.coverImage
    };
  });
}

export function getMockPathById(pathId: string): LearningPathWithEnrollment | null {
  const paths = getMockPathsForUser();
  const adminPath = MOCK_PATHS.find((path) => path.id === pathId);

  if (!adminPath) {
    return null;
  }

  const enrollmentPath = paths.find((path) => path.id === pathId);

  return enrollmentPath ?? { ...adminPath, enrollment: null };
}

export const EXPLORE_PATHS = getMockPathsForUser();

export function getMockEnrollmentState(pathId: string): LearningPathEnrollment | null {
  const path = getMockPathById(pathId);
  return path?.enrollment ?? null;
}

export { CURRENT_USER_ID };
