import type {
  LearningPathDetail,
  LearningPathSeriesCourse,
  LearningPathInstructorItem,
  LearningPathCertificateInfo,
  LearningPathReviewItem,
  LearningPathFaqItem
} from './learning-path-detail.types';
import { mockLearningPaths } from './fixtures';

const instructors: LearningPathInstructorItem[] = [
  {
    id: 'lp-i-1',
    name: 'Jordan Diallo',
    role: 'Lead Instructor · Frontend',
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: '10 years building web apps; previously staff engineer at a fintech scale-up.',
    coursesCount: 12
  },
  {
    id: 'lp-i-2',
    name: 'Efe Obi',
    role: 'Instructor · JavaScript',
    avatarUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Teaches JS to thousands of learners; maintainer of two OSS tooling projects.',
    coursesCount: 8
  },
  {
    id: 'lp-i-3',
    name: 'Rita Mensah',
    role: 'Instructor · React',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Product engineer and design-systems specialist; capstone project mentor.',
    coursesCount: 6
  }
];

function buildSeries(courseSlugPrefix: string): LearningPathSeriesCourse[] {
  return [
    {
      id: `${courseSlugPrefix}-s1`,
      slug: `${courseSlugPrefix}-html-css-foundations`,
      title: 'HTML & CSS Foundations',
      description: 'Semantic markup, modern layout mechanics, and accessible responsive web design.',
      siteName: 'classroomio',
      courseCount: 1,
      lessonCount: 12,
      exerciseCount: 4,
      outcomes: [
        'Semantic markup and document structure',
        'The box model, flexbox, and grid',
        'Responsive layout from mobile up',
        'Accessibility fundamentals'
      ],
      lessonOutlines: [
        { id: `${courseSlugPrefix}-l1`, title: 'Anatomy of a web page', preview: true },
        { id: `${courseSlugPrefix}-l2`, title: 'Semantic HTML in practice', preview: true },
        { id: `${courseSlugPrefix}-l3`, title: 'The box model', gated: true },
        { id: `${courseSlugPrefix}-l4`, title: 'Flexbox layout patterns', gated: true },
        { id: `${courseSlugPrefix}-l5`, title: 'CSS Grid from scratch', gated: true }
      ]
    },
    {
      id: `${courseSlugPrefix}-s2`,
      slug: `${courseSlugPrefix}-javascript-essentials`,
      title: 'JavaScript Essentials',
      description: 'Modern ES6+ syntax, asynchronous programming, APIs, and DOM manipulation.',
      siteName: 'classroomio',
      courseCount: 2,
      lessonCount: 10,
      exerciseCount: 3,
      outcomes: [
        'Types, functions, and control flow',
        'Working with the DOM and browser events',
        'async/await, promises, and fetch APIs',
        'Modular architecture and tooling'
      ],
      lessonOutlines: [
        { id: `${courseSlugPrefix}-l6`, title: 'Values, types, and variables', preview: true },
        { id: `${courseSlugPrefix}-l7`, title: 'Functions and scope', preview: true },
        { id: `${courseSlugPrefix}-l8`, title: 'DOM manipulation and events', gated: true },
        { id: `${courseSlugPrefix}-l9`, title: 'Asynchronous JavaScript & REST APIs', gated: true }
      ]
    },
    {
      id: `${courseSlugPrefix}-s3`,
      slug: `${courseSlugPrefix}-react-development`,
      title: 'Modern Web Development with React',
      description: 'Component architecture, reactive state, lifecycle hooks, and clean JSX design.',
      siteName: 'classroomio',
      courseCount: 3,
      lessonCount: 12,
      exerciseCount: 3,
      outcomes: [
        'Components, props, and JSX patterns',
        'State management with useState and useReducer',
        'Side effects and data fetching with useEffect',
        'Building composable component libraries'
      ],
      lessonOutlines: [
        { id: `${courseSlugPrefix}-l10`, title: 'What is React & JSX?', preview: true },
        { id: `${courseSlugPrefix}-l11`, title: 'Component hierarchy and props', preview: true },
        { id: `${courseSlugPrefix}-l12`, title: 'Interactive state and events', gated: true },
        { id: `${courseSlugPrefix}-l13`, title: 'Custom hooks and data pipelines', gated: true }
      ]
    },
    {
      id: `${courseSlugPrefix}-s4`,
      slug: `${courseSlugPrefix}-state-data-fetching`,
      title: 'State Management & Data Fetching',
      description: 'Context providers, caching layers, error handling, and robust backend integrations.',
      siteName: 'classroomio',
      courseCount: 4,
      lessonCount: 10,
      exerciseCount: 2,
      outcomes: [
        'Global state with Context and stores',
        'Caching, revalidation, and loading states',
        'Connecting React to REST and GraphQL APIs',
        'Resilient error handling and retry patterns'
      ],
      lessonOutlines: [
        { id: `${courseSlugPrefix}-l14`, title: 'Lifting state up and context providers', gated: true },
        { id: `${courseSlugPrefix}-l15`, title: 'Cache normalization and optimistic UI', gated: true },
        { id: `${courseSlugPrefix}-l16`, title: 'Error boundaries and fallback states', gated: true }
      ]
    },
    {
      id: `${courseSlugPrefix}-s5`,
      slug: `${courseSlugPrefix}-capstone-project`,
      title: 'Building & Shipping a Capstone',
      description: 'End-to-end production deployment, automated testing, peer review, and portfolio readiness.',
      siteName: 'classroomio',
      courseCount: 5,
      lessonCount: 7,
      exerciseCount: 1,
      outcomes: [
        'Scoping and planning a production-grade app',
        'Continuous integration and cloud deployment',
        'Code review and performance auditing',
        'Presenting your portfolio-ready deliverable'
      ],
      lessonOutlines: [
        { id: `${courseSlugPrefix}-l17`, title: 'Capstone specification and milestones', gated: true },
        { id: `${courseSlugPrefix}-l18`, title: 'Production deployment and domain setup', gated: true },
        { id: `${courseSlugPrefix}-l19`, title: 'Final submission and peer evaluation', gated: true }
      ]
    }
  ];
}

const certificate: LearningPathCertificateInfo = {
  issuer: 'Acme Academy',
  validity: 'Lifetime',
  description:
    'Complete all courses — every lesson, exercise, and the capstone project — to receive the verified Certificate of Completion, ready to add to LinkedIn and your CV.'
};

const reviews: LearningPathReviewItem[] = [
  {
    id: 'lp-r-1',
    name: 'Tunde Bello',
    rating: 5,
    location: 'Lagos, Nigeria',
    description:
      'I went from zero to deploying my own React app in ten weeks. The order of the courses just makes sense — nothing assumed I knew things I did not.',
    createdAt: '2025-06-12'
  },
  {
    id: 'lp-r-2',
    name: 'Mariam Kone',
    rating: 5,
    location: "Abidjan, Côte d'Ivoire",
    description:
      'The locked courses kept me honest — no skipping ahead, and everything built on what came before. The certificate helped me land interviews.',
    createdAt: '2025-04-30'
  }
];

const faq: LearningPathFaqItem[] = [
  {
    id: 'lp-f-1',
    question: 'Do I need any prior experience?',
    answer:
      'No — the path starts from absolute fundamentals and each course unlocks the next, so you are never dropped into material you are not ready for.'
  },
  {
    id: 'lp-f-2',
    question: 'Can I buy a single course instead of the whole path?',
    answer:
      'Yes, every course is also sold individually — the path bundle saves you 29% and adds the verified path certificate.'
  },
  {
    id: 'lp-f-3',
    question: 'Do I have to take the courses in order?',
    answer:
      'Yes — this path is sequential. Each course unlocks after you complete the previous one lessons and exercises. That is what makes the curriculum build properly.'
  },
  {
    id: 'lp-f-4',
    question: 'How long do I have access?',
    answer: 'Lifetime access. Learn at your own pace — complete courses as your schedule allows.'
  },
  {
    id: 'lp-f-5',
    question: 'What do I need to earn the certificate?',
    answer:
      'Complete every lesson and submit every exercise across all courses, including the capstone project. The certificate is issued automatically.'
  }
];

const outcomes = [
  'Build responsive, accessible websites with semantic HTML and modern CSS',
  'Write production JavaScript: async, APIs, and the DOM',
  'Build and ship interactive React apps with state, hooks, and data fetching',
  'Complete a portfolio-ready capstone project, deployed to production'
];

const skills = [
  'HTML & CSS',
  'Flexbox & Grid',
  'JavaScript ES6+',
  'REST APIs',
  'React',
  'State management',
  'Deployment'
];

export const mockLearningPathDetails: Record<string, LearningPathDetail> = Object.fromEntries(
  mockLearningPaths.map((path) => [
    path.slug,
    {
      id: path.id,
      slug: path.slug,
      title: path.title,
      description: path.description,
      chip: 'Learning Path · Certificate',
      logo: path.logo,
      cost: path.cost || 199,
      currency: path.currency || 'USD',
      courseCount: path.courseCount || 5,
      hasCertificate: path.hasCertificate,
      totalStudents: path.totalStudents || 942,
      rating: 4.7,
      reviewsCount: 213,
      level: 'Beginner',
      outcomes,
      skills,
      series: buildSeries(path.slug),
      instructors,
      certificate,
      reviews,
      faq,
      pricing: {
        cost: path.cost || 199,
        currency: path.currency || 'USD',
        originalCost: (path.cost || 199) + 81,
        discount: 29,
        showDiscount: true,
        features: [
          'All 5 courses, unlocked in sequential order',
          '52 lessons · 13 exercises · 1 capstone project',
          'Path certificate on completion',
          'Lifetime access, learn at your pace'
        ]
      },
      metadata: {
        discount: 29,
        showDiscount: true
      }
    } satisfies LearningPathDetail
  ])
);
