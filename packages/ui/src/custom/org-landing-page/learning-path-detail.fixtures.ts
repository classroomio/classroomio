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
    name: 'Ada Lovelace',
    role: 'Head of Strategy',
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Two decades leading growth-stage strategy and pricing.',
    coursesCount: 12
  },
  {
    id: 'lp-i-2',
    name: 'Grace Hopper',
    role: 'Analytics Lead',
    avatarUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Turns board decks into decision engines.',
    coursesCount: 8
  },
  {
    id: 'lp-i-3',
    name: 'Katherine Johnson',
    role: 'Growth Coach',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Helps founding teams run experiments that compound.',
    coursesCount: 6
  }
];

function buildSeries(courseSlugPrefix: string): LearningPathSeriesCourse[] {
  return [
    {
      id: `${courseSlugPrefix}-s1`,
      slug: `${courseSlugPrefix}-foundations`,
      title: 'Foundations',
      description: 'Core concepts, frameworks, and the first shipped exercise.',
      siteName: 'classroomio',
      lessonOutlines: [
        { id: `${courseSlugPrefix}-l1`, title: 'Orientation', durationMinutes: 14, gated: true },
        { id: `${courseSlugPrefix}-l2`, title: 'Core framework', durationMinutes: 22, gated: true },
        { id: `${courseSlugPrefix}-l3`, title: 'First exercise', durationMinutes: 18 }
      ],
      courseCount: 1,
      totalHours: 44
    },
    {
      id: `${courseSlugPrefix}-s2`,
      slug: `${courseSlugPrefix}-playbooks`,
      title: 'Playbooks',
      description: 'Applied patterns and the labs that make them stick.',
      siteName: 'classroomio',
      lessonOutlines: [
        { id: `${courseSlugPrefix}-l4`, title: 'Pattern library', durationMinutes: 26, gated: true },
        { id: `${courseSlugPrefix}-l5`, title: 'Applied lab', durationMinutes: 31, gated: true },
        { id: `${courseSlugPrefix}-l6`, title: 'Peer review', durationMinutes: 20 }
      ],
      courseCount: 2,
      totalHours: 72
    },
    {
      id: `${courseSlugPrefix}-s3`,
      slug: `${courseSlugPrefix}-capstone`,
      title: 'Capstone',
      description: 'A guided capstone plus readiness for the certificate exam.',
      siteName: 'classroomio',
      lessonOutlines: [
        { id: `${courseSlugPrefix}-l7`, title: 'Capstone brief', durationMinutes: 24, gated: true },
        { id: `${courseSlugPrefix}-l8`, title: 'Exam readiness', durationMinutes: 28, gated: true },
        { id: `${courseSlugPrefix}-l9`, title: 'Certification', durationMinutes: 16 }
      ],
      courseCount: 3,
      totalHours: 96
    }
  ];
}

const certificate: LearningPathCertificateInfo = {
  issuer: 'ClassroomIO',
  validity: 'Lifetime',
  description: 'Verified certificate earned on completing every series lesson.'
};

const reviews: LearningPathReviewItem[] = [
  {
    id: 'lp-r-1',
    name: 'Samira K.',
    rating: 5,
    description: 'The gated outlines kept my cohort accountable end to end.',
    createdAt: '2025-06-12'
  },
  {
    id: 'lp-r-2',
    name: 'Diego M.',
    rating: 5,
    description: 'Series structure made a broad topic feel finishable.',
    createdAt: '2025-04-30'
  }
];

const faq: LearningPathFaqItem[] = [
  {
    id: 'lp-f-1',
    question: 'Is this a single course or a series?',
    answer: 'It is a series of courses that build on one another.'
  },
  {
    id: 'lp-f-2',
    question: 'How long do I have access?',
    answer: 'Lifetime access, including every future series update.'
  },
  {
    id: 'lp-f-3',
    question: 'Do I earn a certificate?',
    answer: 'Yes — a verified certificate on completing all series lessons.'
  }
];
export const mockLearningPathDetails: Record<string, LearningPathDetail> = Object.fromEntries(
  mockLearningPaths.map((path) => [
    path.slug,
    {
      id: path.id,
      slug: path.slug,
      title: path.title,
      description: path.description,
      logo: path.logo,
      cost: path.cost,
      currency: path.currency,
      courseCount: path.courseCount,
      totalHours: path.totalHours,
      hasCertificate: path.hasCertificate,
      totalStudents: path.totalStudents,
      series: buildSeries(path.slug),
      instructors,
      certificate,
      reviews,
      faq
    } satisfies LearningPathDetail
  ])
);
