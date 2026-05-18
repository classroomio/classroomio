import { z } from 'zod';

const fieldBase = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional(),
  placeholder: z.string().optional()
});

export const TemplateFormFieldSchema = z.discriminatedUnion('type', [
  fieldBase.extend({ type: z.literal('text') }),
  fieldBase.extend({ type: z.literal('textarea') }),
  fieldBase.extend({ type: z.literal('url') }),
  fieldBase.extend({
    type: z.literal('select'),
    options: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).min(1)
  })
]);

export type TemplateFormField = z.infer<typeof TemplateFormFieldSchema>;

export const CourseTemplateIdSchema = z.enum(['product_101', 'product_onboarding', 'expert_on_x']);
export type CourseTemplateId = z.infer<typeof CourseTemplateIdSchema>;

export type CourseTemplate = {
  id: CourseTemplateId;
  promptTemplate: string;
  fields: TemplateFormField[];
  coreInstructions: string;
  formTitle: string;
};

export type DepthTierId = 'light' | 'balanced' | 'deep_doc';

export type DepthTier = {
  id: DepthTierId;
  label: string;
  /** Range used when generating the plan (inclusive). */
  sectionRange: readonly [number, number];
  /** Total lesson range across the whole plan (inclusive). */
  totalLessonRange: readonly [number, number];
  /** Lesson length target used by the implementer (words). */
  lessonWordRange: readonly [number, number];
  /** Whether the template should require documentation grounding for this tier. */
  requiresDocumentationGrounding: boolean;
};

export const DEPTH_TIERS: Record<DepthTierId, DepthTier> = {
  light: {
    id: 'light',
    label: 'Light — essentials, ~4 sections, shorter lessons',
    sectionRange: [3, 4],
    totalLessonRange: [6, 8],
    lessonWordRange: [600, 1200],
    requiresDocumentationGrounding: false
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced — typical 101, ~6 sections, moderate depth',
    sectionRange: [5, 7],
    totalLessonRange: [12, 20],
    lessonWordRange: [1500, 2500],
    requiresDocumentationGrounding: false
  },
  deep_doc: {
    id: 'deep_doc',
    label: 'Deep (documentation-grounded) — ~10 sections, in-depth lessons',
    sectionRange: [8, 10],
    totalLessonRange: [25, 40],
    lessonWordRange: [2500, 4000],
    requiresDocumentationGrounding: true
  }
};

export const DEPTH_TIER_IDS = Object.keys(DEPTH_TIERS) as DepthTierId[];

export function getDepthTier(id: string | undefined): DepthTier | undefined {
  if (!id) return undefined;

  return DEPTH_TIERS[id as DepthTierId];
}

/**
 * Build a human-readable bullet block describing the chosen depth tier — interpolated
 * into the prompt so we don't hand-write tier guidance in multiple template `coreInstructions`.
 */
export function describeDepthTier(tier: DepthTier): string {
  const [secMin, secMax] = tier.sectionRange;
  const [lessonMin, lessonMax] = tier.totalLessonRange;
  const [wordMin, wordMax] = tier.lessonWordRange;
  const grounding = tier.requiresDocumentationGrounding
    ? 'Documentation grounding is REQUIRED. If a documentation URL is provided, you MUST call fetch_documentation_url before generate_course_plan. If no URL is provided and no document was uploaded, ask the teacher for at least one authoritative source before continuing.'
    : 'Documentation grounding is recommended when a URL is provided but not strictly required.';

  return `Depth: ${tier.id}
- Target ${secMin}-${secMax} instructional sections (plus one final-exam section).
- Total lesson count across the plan should fall in ${lessonMin}-${lessonMax}.
- Per-lesson target length when implementing: ${wordMin}-${wordMax} words.
- ${grounding}`;
}

export const COURSE_TEMPLATES = [
  {
    id: 'product_101',
    promptTemplate:
      'Create a [Product Name] 101 course that teaches our customers the fundamentals of using the product end-to-end.',
    formTitle: 'Tell us about your product',
    fields: [
      {
        id: 'product_name',
        type: 'text',
        label: 'Product name',
        required: true,
        placeholder: 'e.g. Acme CRM'
      },
      {
        id: 'product_summary',
        type: 'textarea',
        label: 'In one or two sentences, what does the product do?',
        required: true,
        placeholder: 'e.g. Acme CRM is a sales pipeline tool for B2B teams.'
      },
      {
        id: 'audience',
        type: 'text',
        label: 'Who is the audience?',
        required: true,
        placeholder: 'e.g. Account executives at SMB sales teams'
      },
      {
        id: 'outcome',
        type: 'textarea',
        label: 'What should learners be able to do after the course?',
        required: true,
        placeholder: 'e.g. Build a pipeline, log calls, run reports'
      },
      {
        id: 'depth',
        type: 'select',
        label: 'How deep should the course go?',
        required: true,
        options: [
          { value: 'balanced', label: 'Balanced — typical 101, ~6 sections, moderate depth' },
          { value: 'light', label: 'Light — essentials only, ~4 sections, shorter lessons' },
          {
            value: 'deep_doc',
            label: 'Deep (documentation-grounded) — ~10 sections, in-depth lessons sourced from the docs'
          }
        ]
      },
      {
        id: 'documentation_url',
        type: 'url',
        label: 'Documentation URL (optional)',
        required: false,
        placeholder: 'https://docs.your-product.com'
      }
    ],
    coreInstructions: `You are running the Product 101 Course template. The teacher wants a fundamentals course that takes a brand-new customer from zero to confidently using their product end-to-end.

Step-by-step protocol:
1. As your very first action, call ask_template_questions with the registry fields for this template.
2. Wait for a user message with metadata.template.action === 'submit_template_answers' OR 'skip_template_form'.
3. **Immediately after submit_template_answers** (or after you have collected all answers via skip_template_form): your **first** action MUST be a single \`update_course_landing_page\` tool call — no assistant prose and no other tool before it. The course sidebar title was created from a placeholder prompt; you must replace it with real data from the submitted answers:
   - \`title\`: exactly \`"{product_name} 101"\` using the trimmed \`product_name\` value from the answers (e.g. answers "Acme CRM" → title "Acme CRM 101"). Never use angle brackets, square brackets, or the words "Product name" as literals.
   - \`description\` / overview fields: write a short, polished description from \`product_summary\`, \`audience\`, and \`outcome\`. You may refine description again after fetching docs, but this first call must fix the wrong placeholder title.
4. The submitted \`depth\` is one of: \`light\`, \`balanced\`, \`deep_doc\`. Use the section/lesson/word ranges from the "Depth tier" block in the system prompt — do NOT pick your own ranges.
5. If \`documentation_url\` is non-empty, call fetch_documentation_url(url=documentation_url) and then follow up to 14 same-origin sub-pages, prioritising pages that describe core product workflows and how a customer uses the product end-to-end. Apply the link-selection rule in the system prompt — favour product pages (concept overviews, getting-started, how-tos, workflows) over API references for this template's audience. Call fetch_documentation_url again for each chosen URL, one per turn, stopping early if you have enough product-grounded context. For \`deep_doc\`: fetching is REQUIRED before generate_course_plan, and every implemented lesson must be grounded in the fetched markdown — never invent product facts.
6. Optionally call \`update_course_landing_page\` again to enrich description/overview after docs are fetched (keep the same real \`title\` unless the teacher asks to change it).
7. Call generate_course_plan with the following pedagogical shape:
   - Instructional sections progress from "what the product is" to "advanced workflows".
   - Section 1 always covers what the product is, who it's for, and the value proposition (1–2 single-task lessons).
   - Section 2 always covers a guided "first run" / hello-world workflow the learner can do alongside the lesson.
   - Middle sections cover core feature areas grouped by user task, not by UI screen.
   - The penultimate section covers integrations, edge cases, or troubleshooting if relevant.
   - The final section is the comprehensive final examination (per the global plan rules).
   - Match section count, total lesson count, and per-lesson length to the chosen \`depth\` ranges in the "Depth tier" block.
   - Lessons are single-task ("Send your first invoice"), never multi-task. Never use "and"/comma-joined compound titles.
8. Wait for plan approval. Do not implement until the teacher approves.

If the user chose 'skip_template_form', ask the questions from the registry one at a time in plain text instead of re-rendering the form. Use the answers in the same order to drive steps 3–8.`
  },
  {
    id: 'product_onboarding',
    promptTemplate: 'Create a [Product Name] onboarding training that gets new users productive in their first week.',
    formTitle: 'Tell us about your onboarding goals',
    fields: [
      {
        id: 'product_name',
        type: 'text',
        label: 'Product name',
        required: true,
        placeholder: 'e.g. Acme CRM'
      },
      {
        id: 'audience',
        type: 'select',
        label: 'Who is being onboarded?',
        required: true,
        options: [
          { value: 'new_customer', label: 'New external customer' },
          { value: 'new_hire', label: 'New internal hire / team member' },
          { value: 'partner', label: 'Partner / reseller' }
        ]
      },
      {
        id: 'outcome',
        type: 'textarea',
        label: 'By the end of week one, what should they be able to do unaided?',
        required: true,
        placeholder: 'e.g. Set up their workspace, invite teammates, run their first campaign'
      },
      {
        id: 'documentation_url',
        type: 'url',
        label: 'Documentation URL (optional)',
        required: false,
        placeholder: 'https://docs.your-product.com'
      }
    ],
    coreInstructions: `You are running the Product Onboarding Training template. The teacher wants a focused, action-oriented course that gets a specific audience productive within their first week of using the product.

Step-by-step protocol:
1. As your very first action, call ask_template_questions with the registry fields for this template.
2. Wait for metadata.template.action === 'submit_template_answers' OR 'skip_template_form'.
3. **Immediately after submit_template_answers** (or after you have collected all answers via skip_template_form): your **first** action MUST be a single \`update_course_landing_page\` tool call — no assistant prose and no other tool before it. Replace the placeholder-derived course title with real data:
   - \`title\`: if \`audience\` is \`new_hire\`, use \`"{product_name} Team Onboarding"\`; otherwise use \`"{product_name} Onboarding"\` — always with the trimmed \`product_name\` from answers. Never use angle brackets or the literal substring "Product name".
   - \`description\` / overview: from \`outcome\` and audience, write tailored copy.
4. If \`documentation_url\` is non-empty, call fetch_documentation_url(url=documentation_url) and then up to 14 same-origin sub-pages, prioritising onboarding, quickstart, setup, and first-week pages. Apply the link-selection rule in the system prompt — favour product pages (getting-started, how-tos, walkthroughs) over API references; this audience is being onboarded to use the product, not to integrate with it.
5. Optionally call \`update_course_landing_page\` again to refine copy after docs (keep the same real \`title\`).
6. Call generate_course_plan with the following pedagogical shape:
   - 5–7 short, day-shaped sections (e.g. "Day 1: Account setup", "Day 2: Your first project"). Sections are organized by sequenced milestones, not by feature area.
   - Each section has 2–4 lessons, with at least one lesson per section that is action-oriented (a checklist or do-it-now task).
   - Every section ends with a short exercise (3–5 questions) that verifies the learner did the action, not just read the content.
   - The final section is the comprehensive final examination (per the global plan rules) — it should feel like a "ready to work unsupervised" certification.
   - Tone: imperative, concrete, low fluff. Lessons should reference the product UI by the names used in the documentation when fetched.
   - Each daily milestone is split into atomic do-it-now lessons; never combine two actions into one lesson and never use compound titles.
7. Wait for plan approval before implementing.

If 'skip_template_form', ask the registry questions one at a time in plain text and proceed identically through steps 3–7.`
  },
  {
    id: 'expert_on_x',
    promptTemplate: 'Create a course that turns learners into experts on [Topic].',
    formTitle: 'Tell us about the topic',
    fields: [
      {
        id: 'topic',
        type: 'text',
        label: 'Topic or niche',
        required: true,
        placeholder: 'e.g. PostgreSQL performance tuning'
      },
      {
        id: 'expertise_level',
        type: 'select',
        label: 'What level of expertise is the target?',
        required: true,
        options: [
          { value: 'practitioner', label: 'Confident practitioner (working knowledge)' },
          { value: 'expert', label: 'Domain expert (deep, can teach others)' },
          { value: 'specialist', label: 'Specialist (can solve novel problems unaided)' }
        ]
      },
      {
        id: 'outcome',
        type: 'textarea',
        label: 'What specific things should an expert in this topic be able to do?',
        required: true,
        placeholder:
          'e.g. Diagnose and fix slow queries, design indexes from scratch, choose between OLTP and OLAP architectures'
      },
      {
        id: 'documentation_url',
        type: 'url',
        label: 'Reference documentation URL (optional)',
        required: false,
        placeholder: 'https://docs.example.com or a reputable reference site'
      }
    ],
    coreInstructions: `You are running the Expert on X template. The teacher wants a depth course that genuinely makes a learner an expert on a specific topic or niche, not a surface-level overview.

Step-by-step protocol:
1. As your very first action, call ask_template_questions with the registry fields for this template.
2. Wait for metadata.template.action === 'submit_template_answers' OR 'skip_template_form'.
3. **Immediately after submit_template_answers** (or after you have collected all answers via skip_template_form): your **first** action MUST be a single \`update_course_landing_page\` tool call — no assistant prose and no other tool before it. Replace the placeholder-derived course title with real data:
   - \`title\`: choose ONE style using the trimmed \`topic\` from answers: either \`Becoming an Expert on {topic}\` or \`{topic}: From Practitioner to Expert\`. Use the actual topic string (e.g. "PostgreSQL performance tuning"), never angle brackets, never the word "Topic" as a placeholder, never square brackets.
   - \`description\` / overview: serious, depth-oriented copy from \`outcome\` and \`expertise_level\`.
4. If \`documentation_url\` is non-empty, call fetch_documentation_url(url=documentation_url) and then up to 14 same-origin sub-pages, prioritising fundamentals, advanced concepts, and edge-case/troubleshooting pages. Apply the link-selection rule in the system prompt — for this template, API references are a primary source when they match the chosen depth, so include them freely alongside conceptual and advanced-pattern pages whenever the expertise target is developer- or integration-facing. If no URL is provided, rely on the topic and outcome to guide planning — do not fabricate sources.
5. Optionally call \`update_course_landing_page\` again to refine copy after docs (keep the same real \`title\`).
6. Call generate_course_plan with the following pedagogical shape:
   - 6–10 instructional sections, organized by mental model / progression of mastery rather than by topic area.
   - Section 1 sets foundational vocabulary and mental models.
   - Middle sections progress through "core mechanics" → "common patterns" → "advanced patterns" → "edge cases and trade-offs".
   - Each section has 3–5 lessons; lessons should target the deep-dive depth profile (3,000+ words per lesson when implemented).
   - Every other section ends with a non-trivial exercise that tests application, not recall.
   - The final section is the comprehensive final examination (per the global plan rules), with a higher difficulty bar than a 101 course.
   - Match the depth to the chosen \`expertise_level\` (practitioner = lower end of the ranges, specialist = upper end).
   - Atomic concept per lesson; depth comes from going deeper on one idea, not from packing many ideas together. Never use compound titles.
7. Wait for plan approval before implementing.

If 'skip_template_form', ask the registry questions one at a time in plain text and proceed identically through steps 3–7.`
  }
] as const satisfies readonly CourseTemplate[];

const templateById: Record<CourseTemplateId, CourseTemplate> = {
  product_101: COURSE_TEMPLATES[0],
  product_onboarding: COURSE_TEMPLATES[1],
  expert_on_x: COURSE_TEMPLATES[2]
};

export function getCourseTemplate(id: CourseTemplateId): CourseTemplate | undefined {
  return templateById[id];
}
