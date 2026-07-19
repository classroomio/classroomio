export const COURSE_TEMPLATE_IDS = [
  'cohort_bootcamp',
  'self_paced_video',
  'single_workshop',
  'semester_course',
  'certification_prep',
  'blank_course'
] as const;

export type CourseTemplateId = (typeof COURSE_TEMPLATE_IDS)[number];

export type CourseTemplate = {
  id: CourseTemplateId;
  title: string;
  emoji: string;
  gradient: string;
  description: string;
  modules: string[];
  introHtml?: string;
};

export const NOTE_COURSE_TEMPLATES: CourseTemplate[] = [
  {
    id: 'cohort_bootcamp',
    title: 'Cohort Bootcamp',
    emoji: '🚀',
    gradient: 'from-violet-500 to-blue-500',
    description:
      'A structured, cohort-based sprint — everyone moves through it together, week by week.',
    modules: [
      'Week 1 — Kickoff & Goals',
      'Week 2 — Core Skills',
      'Week 3 — Projects',
      'Week 4 — Demo & Retrospective'
    ],
    introHtml: '<p>Outline your cohort bootcamp goals and weekly rhythm here.</p>'
  },
  {
    id: 'self_paced_video',
    title: 'Self-Paced Video Course',
    emoji: '🎥',
    gradient: 'from-blue-500 to-cyan-400',
    description: 'Async lessons students move through on their own schedule, wherever they are.',
    modules: [
      'Introduction & Setup',
      'Module 1 — Foundations',
      'Module 2 — Practice',
      'Module 3 — Advanced Topics',
      'Wrap-up & Next Steps'
    ],
    introHtml: '<p>Describe the self-paced learning journey and how students should progress.</p>'
  },
  {
    id: 'single_workshop',
    title: 'Single Workshop',
    emoji: '🛠️',
    gradient: 'from-emerald-500 to-green-500',
    description: 'One focused live session — in, hands-on, and out in an afternoon.',
    modules: ['Pre-work', 'Session — Part 1', 'Session — Part 2', 'Follow-up & Resources'],
    introHtml: '<p>Capture the workshop objective, agenda, and outcomes.</p>'
  },
  {
    id: 'semester_course',
    title: 'Semester Course',
    emoji: '🏛️',
    gradient: 'from-red-500 via-amber-400 to-orange-500',
    description: 'A full academic term with graded units and a midterm checkpoint.',
    modules: ['Unit 1', 'Unit 2', 'Midterm Review', 'Unit 3', 'Unit 4', 'Final Project'],
    introHtml: '<p>Map the semester structure, grading policy, and key milestones.</p>'
  },
  {
    id: 'certification_prep',
    title: 'Certification Prep',
    emoji: '📝',
    gradient: 'from-teal-500 via-blue-500 to-purple-500',
    description: 'Exam-focused review, organized around a certification blueprint.',
    modules: [
      'Domain 1 — Core concepts',
      'Domain 2 — Applied skills',
      'Practice exams',
      'Exam day checklist'
    ],
    introHtml: '<p>Align this prep course with the certification blueprint and exam format.</p>'
  },
  {
    id: 'blank_course',
    title: 'Blank Course',
    emoji: '✨',
    gradient: 'from-pink-500 to-red-500',
    description: 'Start from a single empty module and build the structure yourself.',
    modules: ['Module 1'],
    introHtml: '<p>Start building your course structure from scratch.</p>'
  }
];

export function getCourseTemplateById(templateId: string): CourseTemplate | undefined {
  return NOTE_COURSE_TEMPLATES.find((template) => template.id === templateId);
}
