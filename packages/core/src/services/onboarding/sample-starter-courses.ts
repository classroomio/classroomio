import { STARTER_PRODUCT_PLACEHOLDER, type TStarterCourseSlot } from '@cio/utils/constants/onboarding';
import type { TStarterBlueprint } from '@cio/utils/validation/onboarding';

type SampleLesson = readonly [title: string, intro: string, points: readonly [string, string, string], closing: string];
type SampleSection = readonly [title: string, lessons: readonly [SampleLesson, SampleLesson, SampleLesson]];
type SampleCourse = {
  description: string;
  sections: readonly [SampleSection, SampleSection, SampleSection];
};

const P = STARTER_PRODUCT_PLACEHOLDER;

const SAMPLE_COURSES: Record<TStarterCourseSlot, SampleCourse> = {
  'getting-started': {
    description: `A first tour of ${P} for new customers: what it does, how to set up your account and how to reach a first result quickly.`,
    sections: [
      [
        `Meet ${P}`,
        [
          [
            `What ${P} helps you do`,
            `Before you click anything, it helps to know what ${P} is for. This lesson gives you the short version so the rest of the course makes sense.`,
            [
              'Name the main problem the product solves for you.',
              'Picture the result you want in your first week.',
              'Write down one question you hope this course answers.'
            ],
            'Keep that question handy. You will check it again at the end of the course.'
          ],
          [
            'Who uses it and why',
            `People come to ${P} from different roles, and each of them looks for something a little different. Seeing the range helps you spot which parts matter to you.`,
            [
              'Think about who on your team will use the product day to day.',
              'Note which of their tasks it should make easier.',
              'Decide who should be told when something changes.'
            ],
            'You do not need to cover every role today. Start with the people closest to the work.'
          ],
          [
            'How this course works',
            'This course is short on purpose. Each lesson covers one idea, and you can stop and return whenever you like.',
            [
              'Read each lesson in order the first time through.',
              'Try the small action at the end of each one.',
              'Come back to any lesson when you need a refresher.'
            ],
            'Your progress is saved as you go, so there is no need to finish in one sitting.'
          ]
        ]
      ],
      [
        'Set up your account',
        [
          [
            'Create and secure your account',
            'A secure account protects your work and your customers. A few minutes here saves trouble later.',
            [
              'Use a strong, unique password.',
              'Turn on any extra sign-in protection that is offered.',
              'Check that your contact email is one you read often.'
            ],
            'Treat sign-in details like keys. Share access through roles, never by sharing a password.'
          ],
          [
            'Set up your workspace',
            `Your workspace is where everything in ${P} lives. Getting its basics right makes every later step easier.`,
            [
              'Give it a clear name people will recognise.',
              'Add your logo and brand colour if you have them.',
              'Review the default settings and change only what you need.'
            ],
            'You can change all of this later, so there is no pressure to make it perfect.'
          ],
          [
            'Invite the people you work with',
            'Work goes faster with the right people on board from the start. Invite only those who need access today.',
            [
              'List the teammates who will use the product this month.',
              'Choose a role for each person before you send the invite.',
              'Tell them what to expect and what to do first.'
            ],
            'A short note with each invite helps people know it is genuine and what to do next.'
          ]
        ]
      ],
      [
        'Reach your first result',
        [
          [
            'Choose your first goal',
            'A small, clear goal gets you to a result faster than trying to do everything at once.',
            [
              'Pick one outcome you can reach this week.',
              'Say how you will know it is done.',
              'Note anything you need before you start.'
            ],
            'Write the goal down where you will see it. It keeps the next lesson focused.'
          ],
          [
            'Complete your first task',
            'Now put the goal into practice. Take it one step at a time and do not worry about speed.',
            [
              'Start with the simplest version of the task.',
              'Follow each step through to the end.',
              'Make a note of anything that felt unclear.'
            ],
            'If you get stuck, the last course in this series shows you where to find help.'
          ],
          [
            'Check that it worked',
            'Finishing a task is not the same as getting the result you wanted. A quick check tells you which one you have.',
            [
              'Compare the outcome with the goal you wrote down.',
              'Look for anything missing or unexpected.',
              'Decide what to do differently next time.'
            ],
            'Celebrate the first result, then pick your next goal. Small wins add up quickly.'
          ]
        ]
      ]
    ]
  },
  'core-workflows': {
    description: `The everyday routines most people follow in ${P}, broken into clear steps you can repeat: plan the work, do it, then review and improve.`,
    sections: [
      [
        'Plan the work',
        [
          [
            'Map your workflow',
            'A workflow is just the steps you repeat to get something done. Writing them down makes them easier to follow and to improve.',
            [
              'List each step from start to finish.',
              'Mark the steps that often cause delays.',
              'Note who is responsible for each one.'
            ],
            'A rough map is enough. You will refine it as you learn what really happens.'
          ],
          [
            'Prepare what you need',
            'Most delays come from missing information. A little preparation up front keeps the work moving.',
            [
              'Gather the details you will need before you begin.',
              'Check that you have the right access.',
              'Agree on what a finished result looks like.'
            ],
            'A short checklist you reuse each time is worth more than a long guide nobody reads.'
          ],
          [
            'Set clear owners',
            'When everyone assumes someone else has it, nobody does. Naming an owner for each step avoids that.',
            [
              'Give every step one owner.',
              'Say who steps in if the owner is away.',
              'Share the plan with everyone involved.'
            ],
            'Clear owners make work faster and calmer for the whole team.'
          ]
        ]
      ],
      [
        'Do the work',
        [
          [
            'Run the workflow from start to finish',
            `Now follow your plan inside ${P}. Resist the urge to skip ahead, so you learn where the real friction is.`,
            [
              'Work through each step in order.',
              'Record anything that did not go as planned.',
              'Finish the whole run before changing the process.'
            ],
            'One complete run teaches you more than several half-finished ones.'
          ],
          [
            'Handle the common variations',
            'Real work rarely follows the plan exactly. Knowing the usual exceptions in advance keeps you calm when they appear.',
            [
              'List the three most common exceptions.',
              'Decide how you will handle each one.',
              'Note when to ask for help instead.'
            ],
            'You do not need an answer for every case, just for the ones that come up most.'
          ],
          [
            'Keep records as you go',
            'Short notes taken while you work are far more accurate than memories written afterwards.',
            [
              'Note what you did and when.',
              'Save links and files in one agreed place.',
              'Write down decisions and the reasons for them.'
            ],
            'Good records let anyone pick up the work, including you after a long break.'
          ]
        ]
      ],
      [
        'Review and improve',
        [
          [
            'Review the results',
            'A review turns one piece of work into lessons for the next. Keep it short and honest.',
            ['Compare the result with what you planned.', 'Ask what went well and why.', 'Ask what slowed you down.'],
            'Review soon after the work ends, while the details are still fresh.'
          ],
          [
            'Fix what went wrong',
            'Problems are information. Fixing the cause, not just the symptom, stops the same issue coming back.',
            [
              'Describe the problem in one sentence.',
              'Look for the step where it began.',
              'Change that step and note the change.'
            ],
            'Share the fix with the people affected so the improvement lasts.'
          ],
          [
            'Make the workflow repeatable',
            'A workflow is only useful if other people can follow it. A few small touches make it repeatable.',
            [
              'Update the written steps with what you learned.',
              'Turn the preparation list into a checklist.',
              'Ask a teammate to try it and give feedback.'
            ],
            'When someone else can run it without you, you have a workflow you can rely on.'
          ]
        ]
      ]
    ]
  },
  collaboration: {
    description: `How to bring your team into ${P}, share the work, keep everyone informed and keep access tidy as the team grows.`,
    sections: [
      [
        'Bring your team in',
        [
          [
            'Decide who needs access',
            'Not everyone needs the same access. Deciding early keeps your workspace safe and easy to understand.',
            [
              'List the people who will use the product.',
              'Group them by what they need to do.',
              'Start with the least access that lets them work.'
            ],
            'It is easier to add access later than to take it away.'
          ],
          [
            'Assign roles and permissions',
            'Roles save you from deciding permissions one person at a time. Pick the closest fit and adjust only when you must.',
            [
              'Match each person to one role.',
              'Check what that role can and cannot do.',
              'Record why anyone has extra access.'
            ],
            'Review roles when someone changes job so access keeps matching the work.'
          ],
          [
            'Welcome new teammates',
            'A good first day makes people productive sooner and more confident.',
            [
              'Send a short welcome that explains what to do first.',
              'Point them to this course.',
              'Name someone they can ask for help.'
            ],
            'A quick check-in after the first week catches small problems early.'
          ]
        ]
      ],
      [
        'Work together',
        [
          [
            'Share work and give feedback',
            'Feedback works best when it is specific, kind and arrives while the work can still change.',
            [
              'Say what works before what needs to change.',
              'Be specific about the change you suggest.',
              'Agree who decides when opinions differ.'
            ],
            'Aim for feedback that helps the next person, not just the current task.'
          ],
          [
            'Keep everyone informed',
            'People do better work when they know what is happening. A little regular communication prevents a lot of surprises.',
            [
              'Share progress at a steady, predictable time.',
              'Say clearly what has changed and what has not.',
              'Mention anything you are waiting on.'
            ],
            'Short and regular beats long and rare.'
          ],
          [
            'Resolve conflicting changes',
            'When two people change the same thing, someone has to decide. Having a simple rule avoids arguments.',
            [
              'Agree who has the final say on each area.',
              'Talk to each other before changing shared work.',
              'Write down the decision once it is made.'
            ],
            'A calm, quick conversation is almost always faster than a long thread.'
          ]
        ]
      ],
      [
        'Keep things tidy',
        [
          [
            'Organise shared work',
            'Shared work gets messy fast. A simple naming habit keeps everything findable.',
            [
              'Choose one way to name things and stick to it.',
              'Group related work together.',
              'Archive what you no longer need.'
            ],
            'If a new teammate cannot find something in a minute, tidy up.'
          ],
          [
            'Review access regularly',
            'People move on and projects end. A regular review makes sure access still matches reality.',
            [
              'Set a reminder to check access every few months.',
              'Remove access that is no longer needed.',
              'Confirm that owners are still the right people.'
            ],
            'Regular reviews take minutes and avoid bigger problems later.'
          ],
          [
            'Hand over work cleanly',
            'A clean handover protects the work and the people taking it on.',
            [
              'Write down what is finished and what is not.',
              'Share where everything is kept.',
              'Stay available for questions for a short while.'
            ],
            'A good handover means the work keeps moving even when people change.'
          ]
        ]
      ]
    ]
  },
  'help-and-next-steps': {
    description: `Where to find answers, how to get support quickly and how to keep growing with ${P} once the basics feel comfortable.`,
    sections: [
      [
        'Find answers fast',
        [
          [
            'Search the help resources',
            'Most questions have already been answered somewhere. Knowing how to search turns minutes of waiting into seconds.',
            [
              'Search with the words you would use to describe the problem.',
              'Try a shorter search if you find nothing.',
              'Check the date on an answer to make sure it is current.'
            ],
            'If a search does not help, you have lost very little and can move to support.'
          ],
          [
            'Learn the product vocabulary',
            'Every product has its own words. Learning them makes help articles and conversations much easier to follow.',
            [
              'Keep a short list of terms you did not know.',
              'Look up each one the first time you see it.',
              'Use the same words when you ask for help.'
            ],
            'Using the right word often gets you the right answer on the first try.'
          ],
          [
            'Prepare a useful question',
            'A good question gets a good answer faster. A few details make all the difference.',
            [
              'Say what you were trying to do.',
              'Say what you expected and what happened instead.',
              'Include anything you already tried.'
            ],
            'Writing the question clearly sometimes answers it before you hit send.'
          ]
        ]
      ],
      [
        'Get support',
        [
          [
            'Contact the support team',
            'When self-service does not solve it, the support team is there to help. Choosing the right channel saves time.',
            [
              'Use the channel suited to how urgent the matter is.',
              'Have your account details ready.',
              'Be clear about the impact on your work.'
            ],
            'Support teams want to help. Clear details let them do it quickly.'
          ],
          [
            'Report a problem clearly',
            'A clear report lets someone reproduce a problem, and a problem that can be reproduced can be fixed.',
            [
              'Describe the steps that led to the problem.',
              'Attach a screenshot or short recording if you can.',
              'Say when it started and how often it happens.'
            ],
            'The more precise your report, the sooner the fix.'
          ],
          [
            'Follow a request through to the end',
            'A request is not finished until the problem is solved. A little follow-up keeps things moving.',
            [
              'Note the reference for your request.',
              'Reply promptly when you are asked for more detail.',
              'Confirm when the problem is fixed.'
            ],
            'Closing the loop helps the team learn and helps you trust the process.'
          ]
        ]
      ],
      [
        'Keep growing',
        [
          [
            'Explore features you have not used',
            'Most people use only a small part of a product. Exploring a little each month pays off.',
            [
              'Pick one unfamiliar feature to try each week.',
              'Try it on something low risk first.',
              'Keep it if it saves you time.'
            ],
            'You do not need every feature. You need the ones that help your work.'
          ],
          [
            'Track what you have learned',
            'Writing down what you learn makes it stick and makes it easy to share with others.',
            [
              'Keep a short log of tips that worked.',
              'Share a useful tip with your team each month.',
              'Review the log when you plan new work.'
            ],
            'A shared list of tips helps the whole team improve together.'
          ],
          [
            'Plan your next goal',
            'You have the basics. The next step is to choose something a little more ambitious.',
            [
              'Look back at the goal you set at the start.',
              'Choose one new goal that builds on it.',
              'Decide what help you will need.'
            ],
            `Well done for finishing. Keep going, and ${P} will keep getting more useful.`
          ]
        ]
      ]
    ]
  }
};

function renderLessonHtml([title, intro, points, closing]: SampleLesson): string {
  const items = points.map((point) => `<li>${point}</li>`).join('');

  return `<h3>${title}</h3><p>${intro}</p><ul>${items}</ul><p>${closing}</p>`;
}

/**
 * Static content for one starter course. Titles, descriptions and lesson HTML still contain the
 * `{Product}` placeholder, which is replaced when the course is created.
 */
export function getSampleStarterBlueprint(slot: TStarterCourseSlot): TStarterBlueprint {
  const course = SAMPLE_COURSES[slot];

  return {
    description: course.description,
    sections: course.sections.map(([sectionTitle, lessons]) => ({
      title: sectionTitle,
      lessons: lessons.map((lesson) => ({ title: lesson[0], bodyHtml: renderLessonHtml(lesson) }))
    }))
  };
}
