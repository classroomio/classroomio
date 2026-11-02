import type { DemoCourse } from './demoCatalogTypes';
import { COURSE_IMAGES, DOCUMENTS, VIDEOS, YOUTUBE_VIDEOS } from './demoMedia';

const DAY_MINUTES = 24 * 60;

export const COURSERA_COURSES: DemoCourse[] = [
  {
    key: 'incident-response',
    index: 21,
    org: 'coursera',
    title: 'Incident Response Fundamentals',
    description:
      'Detect, contain and learn from security incidents. Covers triage, communication during an incident and blameless postmortems.',
    overview:
      '<p>For engineers and operations staff who join the on-call rotation. You will practise triage on realistic scenarios and write a postmortem.</p>',
    bannerImage: COURSE_IMAGES.incidentResponse,
    type: 'SELF_PACED',
    instructorKey: 'enterpriseAdmin',
    createdDaysAgo: 90,
    sections: [
      {
        title: 'Detection and Triage',
        lessons: [
          {
            title: 'Early Warning Signals',
            video: VIDEOS.deceptiveSecurity,
            intro:
              'Most incidents are noticed by a person before a tool. Knowing which signals matter shortens the time between the first sign and the first response.',
            blocks: [
              {
                heading: 'Signals worth paging for',
                bullets: [
                  'A canary token or honeypot firing.',
                  'Login attempts from impossible locations.',
                  'Sudden spikes in data egress.'
                ]
              },
              {
                heading: 'Severity levels',
                bullets: [
                  'SEV1: customer data at risk or full outage.',
                  'SEV2: major feature degraded.',
                  'SEV3: minor impact, fix in hours.'
                ]
              }
            ]
          },
          {
            title: 'Triage in the First 30 Minutes',
            intro:
              'The first half hour sets the tone. Assign roles, stabilise the system and start a written timeline before chasing root causes.',
            blocks: [
              {
                heading: 'Roles',
                bullets: ['Incident commander', 'Communications lead', 'Subject matter experts', 'Scribe']
              },
              {
                heading: 'Stabilise first',
                paragraphs: [
                  'Roll back, fail over or block the attacker before investigating. You can find the cause once users are safe.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'triage-quiz',
            title: 'Triage quiz',
            description: '<p>Roles, severities and first steps.</p>',
            questions: [
              {
                type: 'ORDERING',
                title: 'Order the first steps of an incident.',
                items: [
                  'Declare the incident',
                  'Assign an incident commander',
                  'Stabilise the system',
                  'Investigate the root cause'
                ]
              },
              {
                type: 'RADIO',
                title: 'Customer data may have been exposed. Which severity is it?',
                options: [{ label: 'SEV1', correct: true }, { label: 'SEV2' }, { label: 'SEV3' }]
              }
            ]
          }
        ]
      },
      {
        title: 'Learning From Incidents',
        lessons: [
          {
            title: 'Blameless Postmortems',
            video: VIDEOS.canWeDeployYet,
            intro:
              'A postmortem exists to make the next incident less likely, not to find someone to blame. People share more when they are not afraid.',
            blocks: [
              {
                heading: 'Template',
                bullets: [
                  'Summary and impact',
                  'Timeline',
                  'Contributing factors',
                  'What went well',
                  'Action items with owners'
                ]
              },
              {
                heading: 'Language',
                paragraphs: [
                  'Write "the deploy script allowed a production push without review" instead of "Sam pushed without review".'
                ]
              }
            ]
          },
          {
            title: 'Communicating During an Incident',
            intro:
              'Stakeholders handle bad news better than silence. Regular, honest updates build trust even when the fix is slow.',
            blocks: [
              {
                heading: 'Status update template',
                code: 'Status: Investigating\nImpact: Checkout fails for about 20% of EU customers\nNext update: 14:30 UTC'
              },
              {
                heading: 'Cadence',
                paragraphs: ['Update every 30 minutes for SEV1 incidents, even if nothing changed.']
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'postmortem',
            title: 'Write a postmortem',
            description: '<p>Write a short blameless postmortem for an incident you experienced or read about.</p>',
            dueInDays: 9,
            questions: [
              {
                type: 'TEXTAREA',
                title: 'Write the summary, contributing factors and two action items.',
                sampleAnswers: [
                  'Summary: a certificate expired on the payments API and checkout failed for 47 minutes. Contributing factors: renewal was manual and the reminder went to a former employee. Actions: automate renewal (owner: platform team), alert 30 days before expiry (owner: SRE).'
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'secure-coding',
    index: 22,
    org: 'coursera',
    title: 'Secure Coding for Developers',
    description:
      'Avoid the most common web vulnerabilities: injection, broken authentication, insecure error handling and unsafe dependencies.',
    overview:
      '<p>Practical secure coding for application developers, mapped to the OWASP Top 10. Each lesson shows a vulnerable snippet and the fix.</p>',
    bannerImage: COURSE_IMAGES.secureCoding,
    type: 'SELF_PACED',
    instructorKey: 'enterpriseAdmin',
    createdDaysAgo: 70,
    sections: [
      {
        title: 'Common Vulnerabilities',
        lessons: [
          {
            title: 'Injection and Untrusted Input',
            video: VIDEOS.securityBootcamp,
            documents: [DOCUMENTS.owaspTopTen],
            intro:
              'Injection happens when untrusted input is mixed into a command or query. Parameterised queries and output encoding prevent almost all of it.',
            blocks: [
              {
                heading: 'Vulnerable vs safe',
                code: "# vulnerable\ncursor.execute(f\"SELECT * FROM users WHERE email = '{email}'\")\n\n# safe\ncursor.execute('SELECT * FROM users WHERE email = %s', (email,))"
              },
              {
                heading: 'Treat all input as untrusted',
                bullets: ['Form fields and query strings.', 'HTTP headers and cookies.', 'Files and webhook payloads.']
              }
            ]
          },
          {
            title: 'HTML Injection and Output Encoding',
            video: YOUTUBE_VIDEOS.htmlCrashCourse,
            intro:
              "Cross-site scripting lets an attacker run code in another user's browser. Encode output for the context it lands in and avoid raw HTML rendering.",
            blocks: [
              {
                heading: 'Rules',
                bullets: [
                  'Let your template engine escape by default.',
                  'Sanitise any HTML you must render with an allowlist.',
                  'Set a Content Security Policy.'
                ]
              },
              {
                heading: 'Example header',
                code: "Content-Security-Policy: default-src 'self'; script-src 'self'"
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'secure-coding-quiz',
            title: 'Secure coding quiz',
            description: '<p>Spot the vulnerability and pick the fix.</p>',
            questions: [
              {
                type: 'RADIO',
                title: 'What is the safest way to include user input in a SQL query?',
                options: [
                  { label: 'String formatting' },
                  { label: 'Parameterised queries', correct: true },
                  { label: 'Escaping quotes manually' }
                ]
              },
              {
                type: 'TRUE_FALSE',
                title: 'HTTP headers can contain attacker-controlled input.',
                correct: true
              }
            ]
          }
        ]
      },
      {
        title: 'Defensive Habits',
        lessons: [
          {
            title: 'Error Handling Without Leaking Secrets',
            video: VIDEOS.exceptionalExceptions,
            intro:
              'Stack traces and verbose errors help attackers map your system. Log details internally and show users a short, safe message.',
            blocks: [
              {
                heading: 'Do and do not',
                bullets: [
                  'Do log the full error with a request id.',
                  'Do show the request id to the user.',
                  'Do not return stack traces or SQL errors in API responses.'
                ]
              },
              {
                heading: 'Example',
                code: "except Exception:\n    logger.exception('checkout failed', extra={'request_id': request_id})\n    return {'error': 'Something went wrong', 'requestId': request_id}, 500"
              }
            ]
          },
          {
            title: 'Type Safety as a Security Tool',
            video: YOUTUBE_VIDEOS.typescriptTutorial,
            intro:
              'Strong types catch a class of bugs before they ship, including some that become vulnerabilities, such as treating untrusted input as validated data.',
            blocks: [
              {
                heading: 'Parse, do not validate',
                code: 'const Signup = z.object({ email: z.string().email(), age: z.number().int().min(13) });\nconst data = Signup.parse(request.body);'
              },
              {
                heading: 'Branded types',
                paragraphs: [
                  'Give sanitised values their own type so raw input cannot be passed where safe HTML is expected.'
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'manager-essentials',
    index: 23,
    org: 'coursera',
    title: 'Manager Essentials',
    description: 'Live sessions for first-time managers on one-to-ones, feedback and delegation.',
    overview:
      '<p>Three live sessions for managers in their first year. Each session includes a recording for anyone who misses it.</p>',
    bannerImage: COURSE_IMAGES.managerEssentials,
    type: 'LIVE_CLASS',
    instructorKey: 'enterpriseAdmin',
    createdDaysAgo: 20,
    sections: [
      {
        title: 'Live Sessions',
        lessons: [
          {
            title: 'Running Effective One-to-Ones',
            live: { startsInMinutes: -3 * DAY_MINUTES, durationMinutes: 60, recording: VIDEOS.techManagement },
            intro:
              "One-to-ones are your report's meeting, not a status update. This session covers agendas, cadence and follow-up.",
            blocks: [
              {
                heading: 'A simple agenda',
                bullets: ['How are you doing?', 'What is blocking you?', 'Feedback in both directions', 'Growth goals']
              }
            ]
          },
          {
            title: 'Giving Feedback',
            video: VIDEOS.feedbackThatHelps,
            live: { startsInMinutes: 3 * DAY_MINUTES + 90, durationMinutes: 60 },
            intro: 'Practise situation-behaviour-impact feedback with realistic scenarios.',
            blocks: [
              {
                heading: 'Preparation',
                paragraphs: [
                  'Bring one piece of positive and one piece of corrective feedback you need to give this month.'
                ]
              }
            ]
          },
          {
            title: 'Delegating Well',
            video: VIDEOS.successionPlanning,
            live: { startsInMinutes: 10 * DAY_MINUTES + 90, durationMinutes: 60 },
            intro: 'Hand over work in a way that grows people instead of overloading them.',
            blocks: [
              {
                heading: 'Before the session',
                paragraphs: ['List three tasks you do every week that someone on your team could own.']
              }
            ]
          }
        ]
      }
    ]
  }
];

export const SKILLSHARE_COURSES: DemoCourse[] = [
  {
    key: 'product-fundamentals',
    index: 31,
    org: 'skillshare',
    title: 'Product Management Fundamentals',
    description: '',
    overview: '',
    bannerImage: COURSE_IMAGES.productFundamentals,
    type: 'SELF_PACED',
    instructorKey: 'earlyAdopterAdmin',
    createdDaysAgo: 220,
    existing: {
      courseId: '9bd496cc-c494-4a7e-e12c-6baeef246f8b',
      groupId: '8ac385bb-b383-4f6d-d01b-5a9ddf135e7a',
      lessonIds: [],
      exercises: []
    },
    sections: [
      {
        title: 'Understanding Customers',
        lessons: [
          {
            title: 'The Role of a Product Manager',
            video: VIDEOS.startupAdvice,
            intro:
              'Product managers decide what to build and why. They sit between customers, engineering, design and the business, and they own outcomes rather than tasks.',
            blocks: [
              {
                heading: 'Core responsibilities',
                bullets: [
                  'Understand customers and their problems.',
                  'Set direction and priorities.',
                  'Align the team around goals.',
                  'Measure results.'
                ]
              },
              {
                heading: 'What it is not',
                paragraphs: [
                  'A product manager is not the boss of the engineers or a backlog administrator. Influence comes from clarity and evidence.'
                ]
              }
            ]
          },
          {
            title: 'User Research on a Budget',
            intro:
              'You do not need a research team to learn from customers. Five interviews and a look at support tickets reveal most big problems.',
            blocks: [
              {
                heading: 'Cheap research methods',
                bullets: [
                  'Customer interviews',
                  'Support ticket review',
                  'Session recordings',
                  'A one-question in-app survey'
                ]
              },
              {
                heading: 'Synthesis',
                paragraphs: [
                  'Write each observation on a card and group them. Patterns that appear in three or more interviews are worth acting on.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'pm-basics',
            title: 'Product basics quiz',
            description: '<p>Roles and research methods.</p>',
            questions: [
              {
                type: 'RADIO',
                title: 'What does a product manager own?',
                options: [
                  { label: 'The engineering schedule' },
                  { label: 'Outcomes for customers and the business', correct: true },
                  { label: 'The design system' }
                ]
              },
              {
                type: 'NUMERIC',
                title: 'How many interviews does the lesson suggest to reveal most big problems?',
                correctValue: 5
              }
            ]
          }
        ]
      },
      {
        title: 'Building the Right Thing',
        lessons: [
          {
            title: 'Prioritisation With RICE',
            video: VIDEOS.fastProductDevelopment,
            intro: 'RICE scores ideas by reach, impact, confidence and effort so you can compare very different bets.',
            blocks: [
              { heading: 'Formula', code: 'RICE = (Reach x Impact x Confidence) / Effort' },
              {
                heading: 'Use it carefully',
                paragraphs: [
                  'Treat the score as a conversation starter. Strategic bets sometimes score low and are still the right call.'
                ]
              }
            ]
          },
          {
            title: 'Writing a One-Page Spec',
            intro: 'A short spec aligns the team on the problem and success criteria before anyone designs or builds.',
            blocks: [
              {
                heading: 'Sections',
                bullets: ['Problem and evidence', 'Goals and non-goals', 'Success metric', 'Open questions']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'brand-design',
    index: 32,
    org: 'skillshare',
    title: 'Brand Design Basics',
    description:
      'Create a simple, consistent visual identity: logo principles, colour, typography and a one-page brand guide.',
    overview:
      '<p>For founders, freelancers and designers starting out. You will finish with a one-page brand guide you can hand to anyone who makes something for your brand.</p>',
    bannerImage: COURSE_IMAGES.brandDesign,
    type: 'SELF_PACED',
    instructorKey: 'earlyAdopterAdmin',
    createdDaysAgo: 110,
    sections: [
      {
        title: 'Visual Identity',
        lessons: [
          {
            title: 'Typography for Brands',
            video: VIDEOS.webTypography,
            intro:
              'Typefaces carry personality. Choose one that fits your brand voice and works at every size you need.',
            blocks: [
              {
                heading: 'Choosing a typeface',
                bullets: [
                  'Test it at 12px and at 72px.',
                  'Check it has the weights and languages you need.',
                  'Pair at most two families.'
                ]
              }
            ]
          },
          {
            title: 'Designing With Emotion',
            video: VIDEOS.interfaceTherapy,
            intro:
              'Brands are felt before they are understood. Colour, shape and tone of voice work together to create that feeling.',
            blocks: [
              {
                heading: 'Colour roles',
                bullets: [
                  'One primary brand colour',
                  'One accent',
                  'Neutrals for text and backgrounds',
                  'Status colours for success and errors'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'brand-guide',
            title: 'Share your brand guide',
            description: '<p>Upload or link a one-page brand guide.</p>',
            dueInDays: 8,
            questions: [
              {
                type: 'LINK',
                title: 'Link to your brand guide.',
                sampleLinks: ['https://www.figma.com/file/brand-guide-sunrise-bakery']
              },
              {
                type: 'TEXTAREA',
                title: 'Explain your colour and typography choices in a few sentences.',
                sampleAnswers: [
                  'The bakery brand uses a warm terracotta primary and cream backgrounds to feel handmade. Headings use a rounded serif, body text a plain sans so menus stay readable on phones.'
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Applying the Brand',
        lessons: [
          {
            title: 'Design Thinking for Brand Projects',
            video: VIDEOS.designThinkingPanel,
            intro: 'Start brand projects with the people who will see the brand, not with a logo sketch.',
            blocks: [
              {
                heading: 'Questions to ask',
                bullets: [
                  'Who is the audience?',
                  'What three words should they use about us?',
                  'Which competitors do they compare us with?'
                ]
              }
            ]
          },
          {
            title: 'Accessible Brand Colours',
            intro: 'A brand colour that fails contrast checks will be overridden on every screen. Test early.',
            blocks: [
              {
                heading: 'Contrast targets',
                bullets: ['4.5:1 for body text', '3:1 for large text and icons']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'content-marketing',
    index: 33,
    org: 'skillshare',
    title: 'Content Marketing That Converts',
    description: 'Plan, write and distribute content that brings in customers, not just page views.',
    overview:
      '<p>Learn to build a content plan around customer questions, write posts people finish and measure what actually converts.</p>',
    bannerImage: COURSE_IMAGES.contentMarketing,
    type: 'SELF_PACED',
    instructorKey: 'earlyAdopterAdmin',
    createdDaysAgo: 85,
    sections: [
      {
        title: 'Planning',
        lessons: [
          {
            title: 'Content That Earns Permission',
            video: VIDEOS.transformMarketing,
            intro:
              'Useful content earns the right to keep talking to your audience. Start from their questions, not your product features.',
            blocks: [
              {
                heading: 'Finding topics',
                bullets: ['Questions from sales calls', 'Support tickets', 'Search queries from your analytics']
              }
            ]
          },
          {
            title: 'A Point of View Beats Volume',
            video: VIDEOS.physicsOfMarketing,
            intro: 'One opinionated, well-argued article outperforms ten generic ones.',
            blocks: [
              {
                heading: 'Test your draft',
                paragraphs: [
                  'Could a competitor publish the same article unchanged? If so, add your data, your examples or your opinion.'
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Measuring',
        lessons: [
          {
            title: 'Metrics for Content',
            intro: 'Page views show reach. Sign-ups, demo requests and assisted conversions show value.',
            blocks: [
              {
                heading: 'Content conversion rate',
                code: 'content conversion rate = sign-ups from content / content sessions'
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'content-quiz',
            title: 'Content marketing quiz',
            description: '<p>Planning and measurement.</p>',
            questions: [
              {
                type: 'TRUE_FALSE',
                title: 'Page views are the best measure of content value.',
                correct: false
              },
              {
                type: 'NUMERIC',
                title: '2,000 content sessions produce 50 sign-ups. What is the conversion rate in %?',
                correctValue: 2.5,
                tolerance: 0.01
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'founder-finance',
    index: 34,
    org: 'skillshare',
    title: 'Startup Finance for Founders',
    description: 'Runway, unit economics and fundraising basics for first-time founders.',
    overview:
      '<p>Understand the numbers investors ask about and the ones that decide whether your company survives.</p>',
    bannerImage: COURSE_IMAGES.founderFinance,
    type: 'SELF_PACED',
    instructorKey: 'earlyAdopterAdmin',
    createdDaysAgo: 45,
    sections: [
      {
        title: 'Survival Numbers',
        lessons: [
          {
            title: 'Building a Sustainable Business',
            video: VIDEOS.startupAdvice,
            intro: 'Not every company needs venture capital. A profitable, focused business can grow on its own terms.',
            blocks: [
              {
                heading: 'Questions to ask',
                bullets: [
                  'Can customers pay for this today?',
                  'How small a team can run it?',
                  'What would you build if you never raised money?'
                ]
              }
            ]
          },
          {
            title: 'Runway and Burn',
            intro: 'Runway is how many months you can operate before the money runs out. Track it monthly.',
            blocks: [{ heading: 'Formula', code: 'runway (months) = cash in bank / monthly net burn' }]
          }
        ],
        exercises: [
          {
            key: 'runway-quiz',
            title: 'Runway check',
            description: '<p>Two quick calculations.</p>',
            questions: [
              {
                type: 'NUMERIC',
                title: 'You have 240,000 in the bank and burn 20,000 a month. How many months of runway do you have?',
                correctValue: 12
              },
              {
                type: 'RADIO',
                title: 'Which change extends runway fastest?',
                options: [
                  { label: 'Hiring two engineers' },
                  { label: 'Cutting monthly burn', correct: true },
                  { label: 'Opening an office' }
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Unit Economics',
        lessons: [
          {
            title: 'CAC, LTV and Payback',
            intro:
              'Unit economics show whether each customer makes or loses you money. Build them in a spreadsheet or a notebook you can update monthly.',
            blocks: [
              {
                heading: 'Formulas',
                code: 'LTV = average monthly margin per customer x average lifetime in months\nLTV / CAC should be at least 3'
              }
            ]
          }
        ]
      }
    ]
  }
];
