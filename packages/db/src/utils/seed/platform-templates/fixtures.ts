export type LaunchQuestion = {
  type:
    | 'RADIO'
    | 'CHECKBOX'
    | 'TRUE_FALSE'
    | 'ORDERING'
    | 'MATCHING'
    | 'FILL_BLANK'
    | 'LINK'
    | 'FILE_UPLOAD'
    | 'HOTSPOT'
    | 'NUMERIC'
    | 'SHORT_ANSWER'
    | 'WORD_BANK'
    | 'VIDEO_RECORDING'
    | 'TEXTAREA'
    | 'STAR'
    | 'THUMBS';
  title: string;
  options?: { label: string; correct?: boolean }[];
  template?: string;
};

export type LaunchExerciseSection = {
  title: string;
  goToTitle?: string;
  submit?: boolean;
  questions: LaunchQuestion[];
};

export type LaunchExercise = {
  title: string;
  description?: string;
  final?: boolean;
  questions?: LaunchQuestion[];
  sections?: LaunchExerciseSection[];
};

export type LessonVideo = {
  youtubeId: string;
  title: string;
};

export type LaunchLesson = {
  title: string;
  content: string;
  videos?: LessonVideo[];
  translations?: { locale: 'fr'; content: string }[];
};

export type LaunchSection = {
  title: string;
  lessons: LaunchLesson[];
  exercises: LaunchExercise[];
};

export type LaunchTemplateFixture = {
  slug: string;
  title: string;
  description: string;
  type: 'SELF_PACED' | 'PUBLIC' | 'COMPLIANCE';
  bannerImage: string;
  metadata: Record<string, unknown>;
  certificate?: Record<string, unknown>;
  compliance?: Record<string, unknown>;
  callout?: {
    title: string;
    description: string;
    buttonLabel: string;
    buttonUrl: string;
  };
  highlights: { title: string; description: string }[];
  sections: LaunchSection[];
};

function templateBanner(slug: string) {
  return `https://assets.cdn.clsrio.com/www/course-templates/${slug}.jpg`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function lessonList(items: string[]) {
  const itemsHtml = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  return `<ul>${itemsHtml}</ul>`;
}

function videoLesson(lesson: {
  title: string;
  youtubeId: string;
  source: string;
  summary: string;
  points: string[];
  next: string;
}): LaunchLesson {
  const summary = escapeHtml(lesson.summary);
  const points = lessonList(lesson.points);
  const next = escapeHtml(lesson.next);
  const content = `<p>${summary}</p><h2>What you will see</h2>${points}<p>${next}</p>`;

  return {
    title: lesson.title,
    videos: [{ youtubeId: lesson.youtubeId, title: `${lesson.title} (${lesson.source})` }],
    content
  };
}

function guide(featureLocations: string[], extra = '', videos: LessonVideo[] = []): LaunchLesson {
  const locations = lessonList(featureLocations);
  const content = `<p>This lesson is for the person editing the template. Delete it before you publish, because learners can see every lesson in the course.</p><h2>Where each feature lives</h2>${locations}${extra}`;

  return {
    title: 'How this template is built',
    videos,
    content
  };
}

const customerOnboarding: LaunchTemplateFixture = {
  slug: 'customer-onboarding-academy',
  title: 'Customer Onboarding Academy',
  description:
    'A self-paced academy that takes a new customer from first login to a working workflow, with a certificate at the end.',
  type: 'SELF_PACED',
  bannerImage: templateBanner('customer-onboarding-academy'),
  metadata: {
    skills: [
      'Workspace setup',
      'Connecting data',
      'Roles and permissions',
      'Running the core workflow',
      'Inviting a team'
    ],
    tools: ['AI tutor', 'Saved views', 'Keyboard shortcuts', 'Certificates'],
    reviews: [
      {
        id: 1,
        hide: false,
        name: 'Tomás G.',
        avatar_url: '',
        rating: 4,
        created_at: 1791849600000,
        description:
          'Useful and to the point. I skipped a lesson once and the quiz sent me straight back to it, which was fair.'
      },
      {
        id: 2,
        hide: false,
        name: 'Priya S.',
        avatar_url: '',
        rating: 5,
        created_at: 1790985600000,
        description:
          'Short lessons and a quiz at the end of every section. I finished it over two lunch breaks and still remembered it a month later.'
      },
      {
        id: 3,
        hide: false,
        name: 'Chen W.',
        avatar_url: '',
        rating: 5,
        created_at: 1791244800000,
        description:
          'Well structured. I could see how every section built on the one before it, which made the harder parts easier.'
      },
      {
        id: 4,
        hide: false,
        name: 'Sofia L.',
        avatar_url: '',
        rating: 4,
        created_at: 1797120000000,
        description:
          'Solid course. The word bank and fill-in-the-blank questions were harder than they looked, in a good way.'
      },
      {
        id: 5,
        hide: false,
        name: 'Aiko T.',
        avatar_url: '',
        rating: 4,
        created_at: 1792022400000,
        description:
          'Clear and practical. I wanted one more worked example in the middle section, but the final exam pulled everything together.'
      }
    ],
    requirements: 'A ClassroomIO workspace and permission to invite teammates.',
    description: 'Four short sections that mirror a real customer’s first week.',
    goals: 'Create a workspace, connect data, run one workflow, and invite the team.',
    allowSelfEnrollment: true,
    isContentGroupingEnabled: true,
    progressionMode: 'sequential',
    commentsEnabled: true,
    welcomeEmailMessage:
      '<p>Welcome. Start with “Why you are here”, then work through the sections in order. Your certificate unlocks when you finish the final review with a score of 80% or higher.</p>',
    aiTutor: {
      enabled: true,
      inheritFromOrg: false,
      persona: 'friendly',
      assessmentMode: 'hint_only',
      groundingScope: 'course'
    }
  },
  certificate: {
    isDownloadable: true,
    threshold: 100,
    exerciseMinScorePercent: 80,
    design: {
      templateId: 'minimal',
      accentColor: '#111111',
      subtitle: 'Customer Onboarding Academy',
      signatories: [
        { name: 'Success team', role: 'Customer education', enabled: true },
        { name: '', role: '', enabled: false }
      ]
    }
  },
  highlights: [
    {
      title: 'Sequential progression',
      description: 'Learners finish each lesson before the next one unlocks.'
    },
    {
      title: 'Hint-only AI tutor',
      description: 'The tutor stays inside the course and will not hand over exercise answers.'
    },
    {
      title: 'Certificate',
      description: 'The learner must score 80% or higher in the final exam before the certificate is issued.'
    }
  ],
  sections: [
    {
      title: 'Welcome aboard',
      lessons: [
        guide(
          [
            'Student progression → Settings › Content. This course uses sequential progression.',
            'AI tutor → Settings › AI tutor. Persona is friendly, assessment mode is hint-only, and answers stay grounded in the course.',
            'Certificate → Settings › Certificate. Completion is 100% and the final exercise needs 80%.',
            'Welcome email → Settings › Access. Self-enrollment is on.',
            'Landing page → the landing editor. Requirements, description, and goals are filled in.'
          ],
          `<h2>Make it yours</h2><ul><li>Replace “the product” with your product’s name throughout.</li><li>Swap in screenshots of your own workspace, data sources, and core workflow.</li><li>Point the help lesson at your real help center and support channels.</li></ul><h2>Further watching for you, not learners</h2><p>The two videos attached to this lesson are about designing onboarding. Watch them before you tailor the course.</p>`,
          [
            { youtubeId: 'yL0oVZEzWq8', title: 'How to Create the Best SaaS User Onboarding Experience (Userpilot)' },
            { youtubeId: 'RS0TU1XL7FQ', title: 'Customer Onboarding Metric: Time to First Value (CSM Practice)' }
          ]
        ),
        {
          title: 'Why you are here, in two minutes',
          content: `<p>Most people who sign up for a new product never reach the moment where it pays off. They arrive with a job to do, click around, and leave before the first result. This academy exists so that does not happen to you.</p><h2>What you will do</h2><ul><li>Set up a workspace that is yours, not a demo.</li><li>Connect one real source of data.</li><li>Run the core workflow once from start to finish.</li><li>Invite one teammate so the work does not live with you alone.</li></ul><p>That is the whole first week. Everything else in the product builds on these four steps, and every lesson here points at one of them.</p><h2>How long it takes</h2><p>Each lesson takes five minutes or less. Most sections end with a short check. If you work through one section a day, you will be using the product for real by the end of the week.</p><h2>Before you start</h2><p>Have one real task in mind: a report you owe someone, a process you want to stop doing by hand, or a question your team keeps asking. You will use it in section three, and a real task teaches far more than a sample one.</p><p>Next, you will see how the academy works: why lessons unlock in order, what the AI tutor can and cannot do, and how your certificate is earned.</p>`
        },
        {
          title: 'How this academy works',
          content: `<p>Lessons unlock one at a time. You finish a lesson, answer the short check that follows its section, and the next section opens. That order is deliberate: each step depends on the one before it, and skipping ahead is the most common reason people get stuck later.</p><h2>The AI tutor</h2><p>Every lesson has an AI tutor you can ask about what you just read. It knows this course and nothing else, so its answers stay on topic.</p><ul><li>Ask it to explain a step in different words.</li><li>Ask it where something lives in the product.</li><li>Ask it why a step matters.</li></ul><p>It will not give you the answer to a check, even if you ask twice. It will point you back to the part of the lesson that covers it. The checks are there to show you what you know, not to be passed.</p><h2>Checks and the certificate</h2><p>Checks are short and you can retake them. The final review at the end of the course needs a score of 80% or higher, and the certificate is issued once the final review meets that score and every lesson is complete.</p><h2>When you get stuck</h2><p>Leave a comment on the lesson where it happened. The comment keeps the context of what you were reading, which gets you a better answer than a separate email.</p>`
        },
        {
          title: 'Meet your success team',
          content: `<p>You are not doing this alone. A success team reads the comments on these lessons and helps when a step does not work the way the lesson says it will.</p><h2>How to reach them</h2><ul><li>Comment on the lesson you are stuck on. It is the fastest route, because the team sees exactly what you were reading.</li><li>Ask the AI tutor first for quick questions about the course itself.</li><li>Use the help center for anything that is not covered here.</li></ul><h2>What to include</h2><p>Say what you tried, what you expected, and what happened instead. One sentence each is enough. A screenshot helps when the problem is on screen.</p><h2>The welcome email</h2><p>You received a welcome email when you joined this academy. If your organization turns on self-enrollment for its own courses, that is the same kind of message its learners will receive, so it is worth reading once with that in mind.</p><p>Next section: setting up your account. Keep your real task from the first lesson in mind as you go.</p>`
        }
      ],
      exercises: [
        {
          title: 'Quick check',
          description:
            '<p>A quick look back at the welcome section: how the academy works, what the AI tutor will and will not do, and how the certificate is earned.</p><p>2 questions in 2 formats: single choice, true or false.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1522071901873-411886a10004?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Quick check" />',
          questions: [
            {
              type: 'RADIO',
              title: 'What should you do before inviting teammates?',
              options: [
                { label: 'Finish the workspace setup', correct: true },
                { label: 'Publish the course' },
                { label: 'Turn the certificate off' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'The AI tutor will give you the exercise answer if you ask twice.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            }
          ]
        }
      ]
    },
    {
      title: 'Set up your account',
      lessons: [
        {
          title: 'Create your workspace',
          content: `<p>Your workspace is where your team’s work lives. Setting it up properly takes ten minutes now and saves hours of cleanup later.</p><h2>Name it for how people will look for it</h2><p>Use the name your team already says out loud, such as the company or department, not a project codename. People will search for it and see it in every email the product sends.</p><h2>The first setup, in order</h2><ul><li>Name the workspace.</li><li>Connect one data source.</li><li>Assign roles.</li><li>Invite the rest of the team.</li></ul><p>The order matters. Roles only make sense once there is something to protect, and invitations only make sense once the roles exist. If you invite people before the workspace is set up, they arrive to an empty space and form a first impression you then have to undo.</p><h2>What can wait</h2><p>Branding, integrations beyond the first data source, and notification preferences can all wait until the core workflow is running. Setup lists feel productive, but the first real result is what makes the product worth keeping.</p><p>Try it now: name your workspace and write down the one data source you will connect in the next lesson.</p>`
        },
        {
          title: 'Connect your data',
          content: `<p>The product is only as useful as the data it can see. Connect one source now, the one your real task depends on, and leave the rest for later.</p><h2>Pick the right first source</h2><ul><li>It holds the data your real task needs.</li><li>You already have access to it.</li><li>It is up to date, not an old export.</li></ul><h2>After you connect it</h2><p>Wait for the first sync to finish, then open one record you know well and check it against the source. If the numbers match, you can trust what you build on top of it. If they do not, fix the connection now, before anything depends on it.</p><h2>One source, not five</h2><p>Connecting every system on day one feels thorough, but it multiplies the things that can go wrong before you have seen a single result. One working source beats five half-working ones.</p><p>Try it now: connect your source and check one record you know by heart.</p>`
        },
        {
          title: 'Roles and permissions',
          content: `<p>Roles decide who can see and change what. Get them right before you invite anyone, so no one sees data they should not and no one is blocked from doing their job.</p><h2>Start from the job, not the person</h2><p>Think about what each group needs to do. Most teams need three roles at most:</p><ul><li>Admins who manage settings, billing, and access.</li><li>Editors who build and change the work.</li><li>Viewers who read results and nothing more.</li></ul><h2>Give the least access that works</h2><p>It is easy to add a permission later and awkward to take one away. Start people in the narrowest role that lets them do their job, and move them up when they ask for more.</p><h2>Never share a login</h2><p>Every person gets their own account. A shared login hides who did what, breaks the audit trail, and means one departure forces a password change for everyone.</p><p>Try it now: write down the three roles your team needs and who belongs in each. You will use the list when you invite people at the end of the course.</p>`
        }
      ],
      exercises: [
        {
          title: 'Setup checklist',
          description:
            '<p>Confirm the first setup is in the right order before anything depends on it: the workspace name, one data source, the roles, and then the invitations.</p><p>2 questions in 2 formats: multiple choice, ordering.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1603201667141-5a2d4c673378?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Setup checklist" />',
          questions: [
            {
              type: 'CHECKBOX',
              title: 'Which of these belong in the first setup?',
              options: [
                { label: 'Name the workspace', correct: true },
                { label: 'Connect one data source', correct: true },
                { label: 'Publish every course you copied' }
              ]
            },
            {
              type: 'ORDERING',
              title: 'Put the setup steps in order.',
              options: [
                { label: 'Name the workspace', correct: true },
                { label: 'Connect one data source', correct: true },
                { label: 'Assign roles', correct: true },
                { label: 'Invite the rest of the team', correct: true }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Your first workflow',
      lessons: [
        {
          title: 'The core loop',
          content: `<p>Every product has one loop people repeat: bring something in, do the work, share the result. Learning that loop once, with your real task, is the point of this section.</p><h2>The loop</h2><ul><li>Start from your connected data.</li><li>Do the work the product exists for.</li><li>Check the result against what you expected.</li><li>Share it with the person who needs it.</li></ul><h2>Do it with your real task</h2><p>Use the task you picked in the first lesson. A sample task teaches you where the buttons are. A real one teaches you whether the product answers your question, which is the only thing that decides whether you keep using it.</p><h2>Expect the first run to be slow</h2><p>The first time through will take longer than the lesson suggests. That is normal. The second run is where it gets fast, because you will know where everything is.</p><p>Try it now: run the loop once with your real task, and note how long it took. You will compare it with your second run in the next lesson.</p>`
        },
        {
          title: 'Shortcuts that save hours',
          content: `<p>Once you have run the core loop, the next win is doing it again in a fraction of the time. Most of that time comes from not starting from zero.</p><h2>Duplicate what works</h2><p>When something works, duplicate it instead of rebuilding it from scratch. A copy keeps the settings, structure, and choices you already got right, and you only change what is different.</p><h2>Save your views</h2><p>If you filter or sort the same way every time, save it as a view. A saved view turns a three-minute setup into one click.</p><h2>Learn three shortcuts, not thirty</h2><ul><li>The one that opens search.</li><li>The one that creates something new.</li><li>The one that duplicates what you are looking at.</li></ul><p>Those three cover most of a normal day. Learn more once these are automatic.</p><p>Try it now: run the core loop a second time by duplicating your first run, and compare the time with your first attempt.</p>`
        },
        {
          title: 'Common mistakes',
          content: `<p>A handful of mistakes account for most of the problems new teams hit. None of them are hard to avoid once you know them.</p><h2>Publishing before the basics are written</h2><p>A blank welcome email is the first thing a new person sees, and it tells them nobody is expecting them. Write it before you publish anything.</p><h2>Inviting people before the path is set</h2><p>If learners or teammates get stuck halfway, the usual cause is that the order was never set. Set progression before you invite anyone, so people move through the steps in the order they depend on.</p><h2>Rebuilding instead of duplicating</h2><p>Every rebuild from scratch reintroduces mistakes you already fixed. Duplicate the version that works and change only what is different.</p><h2>Measuring activity instead of results</h2><p>Logins and clicks feel like progress. Whether the real task got done is the only number that tells you the product is working for you.</p><p>Before the next section, check your own setup against this list and fix anything that matches.</p>`
        }
      ],
      exercises: [
        {
          title: 'Scenario quiz',
          description:
            '<p>Real situations from a first week in the product. Pick the fix for each common mistake and the shortcut that saves the most time.</p><p>2 questions in 2 formats: word bank, fill in the blank.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Scenario quiz" />',
          questions: [
            {
              type: 'WORD_BANK',
              title: 'Complete the sentence.',
              template: 'Write the ___ before you publish, and set ___ before you invite learners.',
              options: [
                { label: 'welcome email', correct: true },
                { label: 'progression', correct: true },
                { label: 'billing' },
                { label: 'branding' }
              ]
            },
            {
              type: 'FILL_BLANK',
              title: 'Duplicate a working course instead of rebuilding it from ____.',
              options: [{ label: 'scratch', correct: true }]
            }
          ]
        },
        {
          title: 'Prove it',
          description:
            '<p>Show the first real thing you built. Paste a link, or upload a screenshot if it is not on a public URL. Your instructor reviews it.</p><p>2 questions in 2 formats: link submission, file upload.</p><h2>Before you start</h2><ul><li>There is no right or wrong answer here. Your instructor reads every response.</li></ul><img src="https://images.unsplash.com/photo-1599658880436-c61792e70672?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Prove it" />',
          questions: [
            {
              type: 'LINK',
              title: 'Paste a link to the first thing you built in the product.'
            },
            {
              type: 'FILE_UPLOAD',
              title: 'Or upload a screenshot if the work is not on a public URL.'
            }
          ]
        }
      ]
    },
    {
      title: 'Bring your team',
      lessons: [
        {
          title: 'Inviting teammates',
          content: `<p>The product becomes much more useful the moment someone else can see and build on your work. Invite your team now, and do it properly.</p><h2>Before you invite</h2><p>Finish the workspace setup first: the data source connected, the roles decided, and one real result from the core loop to show. People who arrive to a working space stay. People who arrive to an empty one drift away.</p><h2>Invite by role</h2><p>Use the list of roles you wrote in the roles lesson. Invite each person into the role they need, not as an admin by default.</p><h2>One account per person</h2><p>Never invite a team through a shared login. Each person gets an invitation to their own account, so their work, permissions, and history stay theirs.</p><h2>Say why</h2><p>Add a line to the invitation that says what you want them to do first, such as “Review the report I shared.” A specific first task turns an invitation into a habit.</p><p>Try it now: invite one teammate into the right role, with one sentence about their first task.</p>`
        },
        {
          title: 'Where to get help',
          content: `<p>You have set up the workspace, run the core loop, and invited your team. Here is where to go when something new comes up.</p><h2>In order of speed</h2><ul><li>Ask the AI tutor on any lesson for questions about this course.</li><li>Search the help center for how a feature works.</li><li>Comment on a lesson when a step here does not match what you see.</li><li>Contact your success team for anything about your account.</li></ul><h2>Keep learning</h2><p>This academy covered the first week. Come back to any lesson when you need it; they stay open after you finish. When you are ready, the final review is next. Pass it with 80% or more and your certificate is issued.</p><p>Thank you for getting this far. The teams that finish onboarding are the ones that get real value from the product, and you are now one of them.</p>`
        }
      ],
      exercises: [
        {
          title: 'Final review',
          description:
            '<p>A short recap of the whole academy before the final exam. It does not count toward your certificate.</p><p>2 questions in 2 formats: single choice, true or false.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1622675363311-3e1904dc1885?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Final review" />',
          questions: [
            {
              type: 'RADIO',
              title: 'When is the certificate issued?',
              options: [
                { label: 'After the final review meets the score and the course is complete', correct: true },
                { label: 'After the first quiz' },
                { label: 'When an admin clicks publish' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'A shared login is an acceptable way to invite a team.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            }
          ]
        },
        {
          title: 'How did we do?',
          description:
            '<p>Tell us how the academy worked for you. Your rating and a thumbs up or down help the team improve the next version.</p><p>2 questions in 2 formats: star rating, thumbs feedback.</p><h2>Before you start</h2><ul><li>There is no right or wrong answer here. Your instructor reads every response.</li></ul><img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="How did we do?" />',
          questions: [
            { type: 'STAR', title: 'How clear was the academy?' },
            { type: 'THUMBS', title: 'Would you send a teammate through this academy?' }
          ]
        }
      ]
    },
    {
      title: 'Final exam',
      lessons: [],
      exercises: [
        {
          title: 'Final exam',
          description:
            '<p>The final exam covers all four sections: setup, the core workflow, shortcuts, and inviting your team.</p><p>9 questions in 9 formats: single choice, multiple choice, true or false, fill in the blank, ordering, word bank, short answer, numeric, written reflection.</p><h2>Before you start the exam</h2><ul><li>You need 80% on the scored questions to earn your certificate.</li><li>The reflection and feedback questions are not scored; your instructor reads them.</li><li>Take it when you have finished every section. You can retake it.</li></ul><img src="https://images.unsplash.com/photo-1622675363311-3e1904dc1885?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Final exam" />',
          final: true,
          questions: [
            {
              type: 'RADIO',
              title: 'What should you do before inviting teammates?',
              options: [
                { label: 'Finish the workspace setup', correct: true },
                { label: 'Invite everyone on day one' },
                { label: 'Share one admin login' },
                { label: 'Turn on every integration' }
              ]
            },
            {
              type: 'CHECKBOX',
              title: 'Which roles do most teams need?',
              options: [
                { label: 'Admins', correct: true },
                { label: 'Editors', correct: true },
                { label: 'Viewers', correct: true },
                { label: 'A shared account for everyone' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'A shared login is an acceptable way to invite a team.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            },
            {
              type: 'FILL_BLANK',
              title: 'Duplicate a working course instead of rebuilding it from ___.',
              options: [{ label: 'scratch', correct: true }]
            },
            {
              type: 'ORDERING',
              title: 'Put the first setup steps in order.',
              options: [
                { label: 'Name the workspace', correct: true },
                { label: 'Connect one data source', correct: true },
                { label: 'Assign roles', correct: true },
                { label: 'Invite the rest of the team', correct: true }
              ]
            },
            {
              type: 'WORD_BANK',
              title: 'Complete the sentence.',
              template: 'Write the ___ before you publish, and set ___ before you invite anyone.',
              options: [
                { label: 'welcome email', correct: true },
                { label: 'progression', correct: true },
                { label: 'billing' },
                { label: 'branding' },
                { label: 'notifications' }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'What do you save so a filter or sort you repeat takes one click?',
              options: [
                { label: 'saved view', correct: true },
                { label: 'a saved view', correct: true },
                { label: 'view', correct: true },
                { label: 'saved views', correct: true }
              ]
            },
            {
              type: 'NUMERIC',
              title: 'What score does the final review need, as a percentage?',
              options: [{ label: '80', correct: true }]
            },
            {
              type: 'TEXTAREA',
              title: 'Describe the real task you used in this academy and what changed once it was working.'
            }
          ]
        }
      ]
    }
  ]
};

const productTraining: LaunchTemplateFixture = {
  slug: 'product-training-power-user',
  title: 'Product Training: Power User Path',
  description: 'A deeper path for admins and analysts, with a branch, a French translation, and tutor-graded answers.',
  type: 'SELF_PACED',
  bannerImage: templateBanner('product-training-power-user'),
  metadata: {
    skills: [
      'Permission design',
      'Single sign-on',
      'SCIM provisioning',
      'Audit log review',
      'Advanced reporting',
      'Automation design'
    ],
    tools: ['Identity provider', 'SCIM', 'Audit log', 'Reports', 'Automations'],
    reviews: [
      {
        id: 1,
        hide: false,
        name: 'Daniel R.',
        avatar_url: '',
        rating: 5,
        created_at: 1798243200000,
        description:
          'We rolled this out to the whole team in a week. The written summaries under each video are what people keep coming back to.'
      },
      {
        id: 2,
        hide: false,
        name: 'Grace N.',
        avatar_url: '',
        rating: 5,
        created_at: 1793232000000,
        description:
          'Exactly the right length. Every lesson ends with something to try, so I was doing the work, not just watching it.'
      },
      {
        id: 3,
        hide: false,
        name: 'Chen W.',
        avatar_url: '',
        rating: 5,
        created_at: 1790553600000,
        description:
          'Well structured. I could see how every section built on the one before it, which made the harder parts easier.'
      },
      {
        id: 4,
        hide: false,
        name: 'Fatima B.',
        avatar_url: '',
        rating: 5,
        created_at: 1794960000000,
        description:
          'I liked that the AI tutor nudged me toward the answer instead of handing it over. It felt like studying with someone, not being tested.'
      },
      {
        id: 5,
        hide: false,
        name: 'Tomás G.',
        avatar_url: '',
        rating: 4,
        created_at: 1795132800000,
        description:
          'Useful and to the point. I skipped a lesson once and the quiz sent me straight back to it, which was fair.'
      }
    ],
    requirements: 'You already finished onboarding, or you administer the workspace.',
    description: 'Pick an admin or analyst track, then prove it with a recording and a short case.',
    goals: 'Configure permissions or reports, then submit work a tutor can grade.',
    lessonDownload: true,
    isContentGroupingEnabled: true,
    progressionMode: 'free',
    grading: true,
    aiTutor: {
      enabled: true,
      inheritFromOrg: false,
      persona: 'socratic',
      assessmentMode: 'hint_only',
      groundingScope: 'course'
    }
  },
  highlights: [
    {
      title: 'Branching exercise',
      description: 'One question sends admins and analysts down different sections.'
    },
    {
      title: 'English and French',
      description: 'The path-picking lesson is written in both languages.'
    },
    {
      title: 'Tutor grading',
      description: 'The walkthrough and case study wait for a tutor instead of auto-grading.'
    }
  ],
  sections: [
    {
      title: 'Pick your path',
      lessons: [
        guide([
          'Exercise sections → the “Which describes you?” exercise. After the first section it jumps to Admin. Point that jump at Analyst to send the other track there.',
          'Translations → open the path lesson and switch locale to French.',
          'Lesson download → Settings › Content.',
          'Tutor grading → Submissions and Marks. The recording and the case study are not auto-graded.',
          'AI tutor → Settings › AI tutor. Persona is Socratic.'
        ]),
        {
          title: 'Which path fits your job',
          content: `<p>You already know the basics. This path goes deeper, and it splits in two, because people who have used the product for a while tend to spend their time in one of two places.</p><h2>Two tracks</h2><ul><li>Admin track: access, single sign-on, provisioning, and the audit log. For people who keep the workspace safe and running.</li><li>Analyst track: advanced reports and automations. For people who turn data into decisions and take repeated work off the team’s plate.</li></ul><h2>Pick by this quarter, not your title</h2><p>Choose the track that matches what you will actually do in the next three months. If you manage access and sign-on, take the admin track. If you build reports and automations, take the analyst track. You can read the other track afterwards.</p><h2>How the path adapts</h2><p>The first exercise asks which describes your work. Your answer sends you to the questions for your track, so you only answer what is relevant to you.</p><p>The path ends with a short recorded walkthrough and a written case study. Both are reviewed by a tutor, not graded automatically.</p>`,
          translations: [
            {
              locale: 'fr',
              content: `<p>Vous connaissez déjà les bases. Ce parcours va plus loin et se divise en deux, parce que les personnes qui utilisent le produit depuis un moment passent surtout leur temps à l’un de ces deux endroits.</p><h2>Deux parcours</h2><ul><li>Parcours administrateur : accès, authentification unique, provisionnement et journal d’audit. Pour celles et ceux qui assurent la sécurité et le bon fonctionnement de l’espace de travail.</li><li>Parcours analyste : rapports avancés et automatisations. Pour celles et ceux qui transforment les données en décisions et retirent le travail répétitif à l’équipe.</li></ul><h2>Choisissez selon ce trimestre, pas selon votre titre</h2><p>Choisissez le parcours qui correspond à ce que vous ferez réellement dans les trois prochains mois. Si vous gérez les accès et la connexion, prenez le parcours administrateur. Si vous créez des rapports et des automatisations, prenez le parcours analyste. Vous pourrez lire l’autre parcours ensuite.</p><h2>Un parcours qui s’adapte</h2><p>Le premier exercice vous demande ce qui décrit le mieux votre travail. Votre réponse vous envoie vers les questions de votre parcours, pour que vous ne répondiez qu’à ce qui vous concerne.</p><p>Le parcours se termine par une courte présentation enregistrée et une étude de cas écrite. Les deux sont évaluées par un tuteur, pas automatiquement.</p>`
            }
          ]
        }
      ],
      exercises: [
        {
          title: 'Which describes you?',
          description:
            '<p>Choose the track that matches your work this quarter. Your answer takes you to the admin or the analyst questions.</p><p>3 questions in 3 formats: single choice, true or false, numeric.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Which describes you?" />',
          sections: [
            {
              title: 'Choose a track',
              goToTitle: 'Admin',
              questions: [
                {
                  type: 'RADIO',
                  title: 'Which describes your work this quarter?',
                  options: [
                    { label: 'I manage access and sign-on', correct: true },
                    { label: 'I build reports and automations', correct: true }
                  ]
                }
              ]
            },
            {
              title: 'Admin',
              submit: true,
              questions: [
                {
                  type: 'TRUE_FALSE',
                  title: 'An admin should share one login across the team.',
                  options: [{ label: 'True' }, { label: 'False', correct: true }]
                }
              ]
            },
            {
              title: 'Analyst',
              submit: true,
              questions: [
                {
                  type: 'NUMERIC',
                  title: 'A report that 40 people open and 10 people export has an export rate of what percent?',
                  options: [{ label: '25', correct: true }]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Admin track',
      lessons: [
        {
          title: 'Permissions at scale',
          content: `<p>With five people, permissions are a list you can hold in your head. With fifty, they need a system, or they drift until nobody knows who can see what.</p><h2>Use groups, not individuals</h2><p>Grant access to groups that match how your organization works, such as a team, a region, or a function, and put people into groups. When someone changes teams, you move them between groups instead of editing a dozen permissions by hand.</p><h2>Least privilege, reviewed</h2><ul><li>Start everyone at the narrowest access that lets them work.</li><li>Review admin access every quarter; admin lists only grow if nobody prunes them.</li><li>Remove access the day someone leaves, not at the next review.</li></ul><h2>Never share one login</h2><p>An admin should never share one login across the team. Shared accounts hide who made a change, cannot be offboarded cleanly, and usually end up with more access than anyone needs.</p><p>Try it: list your current admins and mark each one you could move to a narrower role.</p>`,
          translations: [
            {
              locale: 'fr',
              content: `<p>À cinq personnes, les autorisations tiennent dans une liste que l’on garde en tête. À cinquante, il faut un système, sinon elles dérivent jusqu’à ce que plus personne ne sache qui voit quoi.</p><h2>Utilisez des groupes, pas des individus</h2><p>Accordez l’accès à des groupes qui reflètent le fonctionnement de votre organisation, par exemple une équipe, une région ou une fonction, et placez les personnes dans ces groupes. Quand quelqu’un change d’équipe, vous le déplacez d’un groupe à l’autre au lieu de modifier une dizaine d’autorisations à la main.</p><h2>Le moindre privilège, revu régulièrement</h2><ul><li>Donnez à chacun l’accès le plus restreint qui lui permet de travailler.</li><li>Revoyez les accès administrateur chaque trimestre ; ces listes ne font que grandir si personne ne les élague.</li><li>Retirez l’accès le jour du départ, pas à la revue suivante.</li></ul><h2>Ne partagez jamais un identifiant</h2><p>Un administrateur ne doit jamais partager un identifiant avec l’équipe. Un compte partagé masque qui a fait une modification, ne peut pas être désactivé proprement et finit souvent avec plus d’accès que nécessaire.</p><p>À essayer : listez vos administrateurs actuels et marquez ceux qui pourraient passer à un rôle plus restreint.</p>`
            }
          ]
        },
        {
          title: 'Single sign-on and provisioning',
          content: `<p>Single sign-on lets your team log in with the account they already use for work, through your identity provider. Provisioning goes one step further: it creates, updates, and removes accounts automatically when people join, move, or leave.</p><h2>Why it matters</h2><ul><li>One password fewer for every person on the team.</li><li>Access follows your identity provider, so leavers lose access everywhere at once.</li><li>Security policies such as multi-factor authentication apply in one place.</li></ul><h2>Setting it up</h2><p>Single sign-on is switched on in the workspace security settings. You connect your identity provider, test with your own account, and only then require it for everyone. Keep one admin who can still sign in with a password, so a misconfiguration cannot lock the whole team out.</p><h2>Provisioning with SCIM</h2><p>SCIM is the standard most identity providers use to keep accounts in sync. Once it is on, adding someone to the right group in your identity provider creates their account here with the right role, and removing them deactivates it.</p><p>The two videos in this lesson explain single sign-on and SCIM in a few minutes each.</p>`,
          videos: [
            { youtubeId: 'Bv6NZlqqn48', title: 'What is Single Sign On (SSO)? (IBM Technology)' },
            { youtubeId: 'GMunhcCk418', title: 'What Is SCIM Provisioning and How Does It Work? (Keeper Security)' }
          ],
          translations: [
            {
              locale: 'fr',
              content: `<p>L’authentification unique permet à votre équipe de se connecter avec le compte qu’elle utilise déjà au travail, via votre fournisseur d’identité. Le provisionnement va plus loin : il crée, met à jour et supprime les comptes automatiquement quand des personnes arrivent, changent de poste ou partent.</p><h2>Pourquoi c’est important</h2><ul><li>Un mot de passe de moins pour chaque membre de l’équipe.</li><li>L’accès suit votre fournisseur d’identité : une personne qui part perd l’accès partout en même temps.</li><li>Les règles de sécurité, comme l’authentification multifacteur, s’appliquent à un seul endroit.</li></ul><h2>La mise en place</h2><p>L’authentification unique s’active dans les paramètres de sécurité de l’espace de travail. Connectez votre fournisseur d’identité, testez avec votre propre compte, puis seulement ensuite rendez-la obligatoire pour tous. Gardez un administrateur capable de se connecter avec un mot de passe, pour qu’une erreur de configuration ne bloque pas toute l’équipe.</p><h2>Le provisionnement avec SCIM</h2><p>SCIM est la norme utilisée par la plupart des fournisseurs d’identité pour synchroniser les comptes. Une fois activé, ajouter une personne au bon groupe dans votre fournisseur d’identité crée son compte ici avec le bon rôle, et la retirer désactive ce compte.</p><p>Les deux vidéos de cette leçon expliquent l’authentification unique et SCIM en quelques minutes chacune.</p>`
            }
          ]
        },
        {
          title: 'Audit logs',
          content: `<p>The audit log is the record of who did what, and when. It is the first place to look when something changed and nobody remembers changing it, and the evidence you hand over when a customer or auditor asks how access is controlled.</p><h2>What it records</h2><ul><li>Sign-ins, including failed ones.</li><li>Changes to roles, permissions, and security settings.</li><li>Exports and deletions of data.</li><li>Changes to billing and integrations.</li></ul><h2>How to read it</h2><p>Start from the question, not the log. Filter by the person, the time window, or the kind of event, and read forwards from just before the change. Most investigations take minutes when you know the rough time.</p><h2>Make it part of the routine</h2><p>Review admin and permission changes once a month. It takes a few minutes and catches access that was granted for a one-off task and never removed.</p><p>The video in this lesson is a talk on why audit logs matter for data protection in business software.</p>`,
          videos: [
            { youtubeId: 'OXMT9hrNn7c', title: 'Audit Logs and Data Protection (WorkOS, Enterprise Ready Conf 2024)' }
          ],
          translations: [
            {
              locale: 'fr',
              content: `<p>Le journal d’audit enregistre qui a fait quoi, et quand. C’est le premier endroit à consulter quand quelque chose a changé sans que personne ne s’en souvienne, et la preuve à fournir quand un client ou un auditeur demande comment les accès sont contrôlés.</p><h2>Ce qu’il enregistre</h2><ul><li>Les connexions, y compris celles qui ont échoué.</li><li>Les changements de rôles, d’autorisations et de paramètres de sécurité.</li><li>Les exports et les suppressions de données.</li><li>Les changements de facturation et d’intégrations.</li></ul><h2>Comment le lire</h2><p>Partez de la question, pas du journal. Filtrez par personne, par période ou par type d’événement, et lisez à partir d’un peu avant le changement. La plupart des recherches prennent quelques minutes quand vous connaissez l’heure approximative.</p><h2>Intégrez-le à la routine</h2><p>Revoyez les changements d’administration et d’autorisations une fois par mois. Cela prend quelques minutes et révèle les accès accordés pour une tâche ponctuelle et jamais retirés.</p><p>La vidéo de cette leçon est une présentation sur le rôle des journaux d’audit dans la protection des données des logiciels professionnels.</p>`
            }
          ]
        }
      ],
      exercises: [
        {
          title: 'Find it',
          description:
            '<p>Check that you know where the admin controls live, from single sign-on to the audit log.</p><p>1 question (single choice).</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1614064548237-096f735f344f?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Find it" />',
          questions: [
            {
              type: 'RADIO',
              title: 'Where do you switch on single sign-on?',
              options: [
                { label: 'Workspace security settings', correct: true },
                { label: 'Billing' },
                { label: 'Notification preferences' },
                { label: 'Each person’s profile' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Analyst track',
      lessons: [
        {
          title: 'Building advanced reports',
          content: `<p>A report is only useful if someone makes a decision with it. Advanced reports are not about more charts; they are about answering one question clearly enough that the answer changes what someone does.</p><h2>Name it after the decision</h2><p>A report should be named after the decision it supports, not the data it contains. “Which accounts need a call this week” gets opened. “Account activity export v3” does not.</p><h2>Use rates, not only counts</h2><p>Counts go up as you grow. Rates show whether things are getting better. If 40 people open a report and 10 of them export it, the export rate is 25%. If 80 of 200 learners finish a course, 40% finished. Put the rate next to the count so the reader sees both.</p><h2>Build it in this order</h2><ul><li>Write the question in one sentence.</li><li>Pick the one number that answers it.</li><li>Add only the breakdowns that change the decision.</li><li>Share it with the person who makes the decision, and ask if it did.</li></ul><p>Try it: take one report you already have and rename it after the decision it supports.</p>`,
          translations: [
            {
              locale: 'fr',
              content: `<p>Un rapport n’est utile que si quelqu’un prend une décision grâce à lui. Les rapports avancés ne consistent pas à ajouter des graphiques, mais à répondre à une question assez clairement pour que la réponse change ce que quelqu’un fait.</p><h2>Nommez-le d’après la décision</h2><p>Un rapport doit porter le nom de la décision qu’il soutient, pas des données qu’il contient. « Quels comptes appeler cette semaine » est ouvert. « Export d’activité des comptes v3 » ne l’est pas.</p><h2>Utilisez des taux, pas seulement des totaux</h2><p>Les totaux augmentent quand vous grandissez. Les taux montrent si les choses s’améliorent. Si 40 personnes ouvrent un rapport et que 10 l’exportent, le taux d’export est de 25 %. Si 80 apprenants sur 200 terminent un cours, 40 % ont terminé. Placez le taux à côté du total pour que le lecteur voie les deux.</p><h2>Construisez-le dans cet ordre</h2><ul><li>Écrivez la question en une phrase.</li><li>Choisissez le chiffre qui y répond.</li><li>N’ajoutez que les ventilations qui changent la décision.</li><li>Partagez-le avec la personne qui décide, et demandez-lui s’il l’a aidée.</li></ul><p>À essayer : prenez un rapport existant et renommez-le d’après la décision qu’il soutient.</p>`
            }
          ]
        },
        {
          title: 'Automations',
          content: `<p>An automation does a repeated task for you when something happens: a record changes, a date arrives, a form is submitted. Good automations remove work nobody enjoys. Bad ones create surprises nobody can explain.</p><h2>Automate what you already do by hand</h2><p>Only automate a task you have done manually at least three times. By then you know the steps, the exceptions, and what a correct result looks like.</p><h2>Every automation needs</h2><ul><li>A clear trigger: exactly what starts it.</li><li>A named owner who is told when it fails.</li><li>A way to see what it did, so nobody has to guess.</li></ul><h2>Start small</h2><p>Build the smallest version, run it for a week, and check every result. Then widen it. Automations that start big tend to fail quietly on the cases nobody thought of.</p><h2>Measure it</h2><p>Note how long the task took by hand and how often it ran. That number is how you show the automation was worth building, and how you decide which one to build next.</p><p>Try it: pick one task you did by hand three times last week and write down its trigger and owner.</p>`,
          translations: [
            {
              locale: 'fr',
              content: `<p>Une automatisation effectue une tâche répétitive à votre place quand un événement se produit : un enregistrement change, une date arrive, un formulaire est envoyé. Les bonnes automatisations suppriment un travail que personne n’aime. Les mauvaises créent des surprises que personne ne sait expliquer.</p><h2>Automatisez ce que vous faites déjà à la main</h2><p>N’automatisez qu’une tâche que vous avez faite manuellement au moins trois fois. À ce stade, vous connaissez les étapes, les exceptions et ce qu’est un résultat correct.</p><h2>Chaque automatisation a besoin de</h2><ul><li>Un déclencheur clair : exactement ce qui la lance.</li><li>Une personne responsable, prévenue en cas d’échec.</li><li>Un moyen de voir ce qu’elle a fait, pour que personne n’ait à deviner.</li></ul><h2>Commencez petit</h2><p>Construisez la plus petite version, faites-la tourner une semaine et vérifiez chaque résultat. Élargissez ensuite. Les automatisations qui commencent grand échouent souvent en silence sur les cas que personne n’avait prévus.</p><h2>Mesurez-la</h2><p>Notez combien de temps la tâche prenait à la main et à quelle fréquence elle revenait. Ce chiffre montre que l’automatisation valait la peine, et vous aide à choisir la suivante.</p><p>À essayer : choisissez une tâche faite trois fois à la main la semaine dernière et notez son déclencheur et son responsable.</p>`
            }
          ]
        }
      ],
      exercises: [
        {
          title: 'Crunch the numbers',
          description:
            '<p>Work out the rates behind a report and name it after the decision it supports.</p><p>2 questions in 2 formats: numeric, word bank.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Crunch the numbers" />',
          questions: [
            {
              type: 'NUMERIC',
              title: 'If 80 of 200 learners finish, what percent finished?',
              options: [{ label: '40', correct: true }]
            },
            {
              type: 'WORD_BANK',
              title: 'Complete the sentence.',
              template: 'A report should be named after the ___ it supports, with a ___ next to the count.',
              options: [
                { label: 'decision', correct: true },
                { label: 'rate', correct: true },
                { label: 'data' },
                { label: 'chart' },
                { label: 'owner' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Show what you know',
      lessons: [
        {
          title: 'Before you record',
          content: `<p>The last part of this path asks you to show what you can do, not just answer questions about it. A tutor reviews both pieces and gives you written feedback.</p><h2>The walkthrough</h2><p>Record a walkthrough of one real task, no longer than 90 seconds. Pick a task from your track: setting up sign-on or reviewing access for admins, or building a report or automation for analysts.</p><ul><li>Say what you are about to do and why, in one sentence.</li><li>Do the task on screen without cutting away.</li><li>End by showing the result.</li></ul><p>Ninety seconds is short on purpose. If it does not fit, the task is too big; pick one step of it.</p><h2>The case study</h2><p>Then write a short case study: one change you made, why you made it, and how you checked that it worked. A few paragraphs is enough. Specific beats long.</p><h2>How it is reviewed</h2><p>The tutor looks for three things: the task works, you can explain why you did it that way, and you checked the result. Neither piece is graded automatically, so expect feedback within a few days.</p>`,
          translations: [
            {
              locale: 'fr',
              content: `<p>La dernière partie de ce parcours vous demande de montrer ce que vous savez faire, et pas seulement de répondre à des questions. Un tuteur évalue les deux éléments et vous fait un retour écrit.</p><h2>La présentation enregistrée</h2><p>Enregistrez la réalisation d’une vraie tâche, en 90 secondes maximum. Choisissez une tâche de votre parcours : configurer la connexion ou revoir les accès pour les administrateurs, créer un rapport ou une automatisation pour les analystes.</p><ul><li>Dites en une phrase ce que vous allez faire et pourquoi.</li><li>Réalisez la tâche à l’écran sans coupure.</li><li>Terminez en montrant le résultat.</li></ul><p>Quatre-vingt-dix secondes, c’est court, et c’est voulu. Si cela ne tient pas, la tâche est trop grande ; choisissez-en une étape.</p><h2>L’étude de cas</h2><p>Écrivez ensuite une courte étude de cas : un changement que vous avez fait, pourquoi, et comment vous avez vérifié qu’il fonctionnait. Quelques paragraphes suffisent. Précis vaut mieux que long.</p><h2>Comment c’est évalué</h2><p>Le tuteur regarde trois choses : la tâche fonctionne, vous savez expliquer pourquoi vous l’avez faite ainsi, et vous avez vérifié le résultat. Aucun des deux éléments n’est noté automatiquement ; comptez quelques jours pour le retour.</p>`
            }
          ]
        }
      ],
      exercises: [
        {
          title: 'Record a walkthrough',
          description:
            '<p>Record a walkthrough of one real task from your track, no longer than 90 seconds. A tutor reviews it.</p><p>1 question (video recording).</p><h2>Before you start</h2><ul><li>There is no right or wrong answer here. Your instructor reads every response.</li></ul><img src="https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Record a walkthrough" />',
          questions: [
            {
              type: 'VIDEO_RECORDING',
              title: 'Record a 90 second walkthrough of one task. A tutor will grade it.'
            }
          ]
        },
        {
          title: 'Case study',
          description:
            '<p>Write up one change you made, why you made it, and how you checked that it worked. A tutor reviews it.</p><p>1 question (written reflection).</p><h2>Before you start</h2><ul><li>There is no right or wrong answer here. Your instructor reads every response.</li></ul><img src="https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Case study" />',
          questions: [
            {
              type: 'TEXTAREA',
              title: 'Describe one change you made, why you made it, and how you checked that it worked.'
            }
          ]
        }
      ]
    },
    {
      title: 'Final exam',
      lessons: [],
      exercises: [
        {
          title: 'Final exam',
          description:
            '<p>The final exam covers both tracks: permissions, sign-on, provisioning, audit logs, reports, and automations.</p><p>9 questions in 9 formats: true or false, numeric, fill in the blank, ordering, multiple choice, short answer, word bank, single choice, written reflection.</p><h2>Before you start the exam</h2><ul><li>The reflection and feedback questions are not scored; your instructor reads them.</li><li>Take it when you have finished every section. You can retake it.</li></ul><img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Final exam" />',
          final: true,
          questions: [
            {
              type: 'TRUE_FALSE',
              title: 'An admin should share one login across the team.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            },
            {
              type: 'NUMERIC',
              title: 'If 30 of 120 learners finish a course, what percent finished?',
              options: [{ label: '25', correct: true }]
            },
            {
              type: 'FILL_BLANK',
              title: 'A report should be named after the ___ it supports.',
              options: [{ label: 'decision', correct: true }]
            },
            {
              type: 'ORDERING',
              title: 'Put the steps for building a report in order.',
              options: [
                { label: 'Write the question in one sentence', correct: true },
                { label: 'Pick the one number that answers it', correct: true },
                { label: 'Add only the breakdowns that change the decision', correct: true },
                { label: 'Share it with the person who makes the decision', correct: true }
              ]
            },
            {
              type: 'CHECKBOX',
              title: 'Every automation needs:',
              options: [
                { label: 'A clear trigger', correct: true },
                { label: 'A named owner', correct: true },
                { label: 'A way to see what it did', correct: true },
                { label: 'A second automation as a backup' }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'Which standard do most identity providers use to keep accounts in sync?',
              options: [{ label: 'SCIM', correct: true }]
            },
            {
              type: 'WORD_BANK',
              title: 'Complete the sentence.',
              template:
                'Only automate a task you have done by hand at least ___ times, and review ___ access every quarter.',
              options: [
                { label: 'three', correct: true },
                { label: 'admin', correct: true },
                { label: 'ten' },
                { label: 'viewer' },
                { label: 'guest' }
              ]
            },
            {
              type: 'RADIO',
              title: 'Before you require single sign-on for everyone, keep:',
              options: [
                { label: 'One admin who can still sign in with a password', correct: true },
                { label: 'No admins at all' },
                { label: 'A shared team login' },
                { label: 'Password sign-in for every user' }
              ]
            },
            {
              type: 'TEXTAREA',
              title: 'Which change from this path will you make first, and how will you check that it worked?'
            }
          ]
        }
      ]
    }
  ]
};

const publicMiniCourse: LaunchTemplateFixture = {
  slug: 'customer-education-101',
  title: 'Customer Education 101',
  description: 'A free public mini course for prospects. No signup. Each lesson ends with a short quiz.',
  type: 'PUBLIC',
  bannerImage: templateBanner('customer-education-101'),
  metadata: {
    skills: [
      'Customer education strategy',
      'First-week journey mapping',
      'Writing lessons people finish',
      'Measuring course impact',
      'Turning learners into advocates'
    ],
    tools: ['ClassroomIO public courses', 'Course widget', 'Landing page callouts'],
    reviews: [
      {
        id: 1,
        hide: false,
        name: 'Daniel R.',
        avatar_url: '',
        rating: 5,
        created_at: 1790553600000,
        description:
          'We rolled this out to the whole team in a week. The written summaries under each video are what people keep coming back to.'
      },
      {
        id: 2,
        hide: false,
        name: 'Tomás G.',
        avatar_url: '',
        rating: 4,
        created_at: 1788220800000,
        description:
          'Useful and to the point. I skipped a lesson once and the quiz sent me straight back to it, which was fair.'
      },
      {
        id: 3,
        hide: false,
        name: 'Chen W.',
        avatar_url: '',
        rating: 5,
        created_at: 1797638400000,
        description:
          'Well structured. I could see how every section built on the one before it, which made the harder parts easier.'
      },
      {
        id: 4,
        hide: false,
        name: 'Aiko T.',
        avatar_url: '',
        rating: 4,
        created_at: 1794009600000,
        description:
          'Clear and practical. I wanted one more worked example in the middle section, but the final exam pulled everything together.'
      },
      {
        id: 5,
        hide: false,
        name: 'Hannah P.',
        avatar_url: '',
        rating: 5,
        created_at: 1794441600000,
        description:
          'Our new starters now arrive at their first meeting already knowing the basics. It saved us hours of repeated explanations.'
      }
    ],
    description: 'Five short lessons on why customers drop off and how a course brings them back.',
    goals: 'Leave with a first-week map and a lesson outline you can publish.',
    allowMarkdownExport: true,
    isContentGroupingEnabled: true,
    progressionMode: 'free'
  },
  callout: {
    title: 'Book a demo',
    description: 'See how this course would look on your own site.',
    buttonLabel: 'Book a demo',
    buttonUrl: 'https://classroomio.com'
  },
  highlights: [
    {
      title: 'Public course',
      description: 'No signup. Each lesson has its own address for search.'
    },
    {
      title: 'Call to action',
      description: 'The last lesson ends on a “Book a demo” callout.'
    },
    {
      title: 'Copy as Markdown',
      description: 'Readers can copy a lesson and drop it into their own notes.'
    }
  ],
  sections: [
    {
      title: 'Customer Education 101',
      lessons: [
        guide([
          'Course type → Settings. This course is Public, so lessons are readable without an account.',
          'Lesson slugs → each lesson has its own address. Rename the slug before you share it.',
          'Callout → Settings › Landing. The button is “Book a demo”. Replace the URL with yours.',
          'Copy as Markdown → Settings › Content.',
          'Embed → the course widget. The public URL is what you paste into your site.'
        ]),
        {
          title: 'Why customers stop using products',
          content: `<p>Most customers who stop using a product never complain. They sign up, try it, get stuck, and quietly go back to what they did before. The reason is rarely missing features. It is that the first success takes longer than the patience they arrived with.</p><h2>Patience runs out fast</h2><p>A new customer arrives with a job to do and a small budget of attention. Every screen that does not move them toward that job spends some of it. When the budget runs out before the first result, they leave, and they rarely come back.</p><h2>Why the tour does not help</h2><p>The instinct is to show everything: a tour of every menu, every setting, every feature you are proud of. A menu tour is a poor first lesson. It teaches where things are, not how to get a result, and it spends the attention the customer needed for their first win.</p><h2>What a good first lesson does</h2><ul><li>It shows one path that works, start to finish.</li><li>It uses the customer’s own goal, not a generic example.</li><li>It ends with something the reader can try right now.</li></ul><p>The rest of this course builds on that idea: shorten the time to the first real success, and customers stay long enough to learn the rest.</p>`,
          videos: [{ youtubeId: '9kM-UMFIlms', title: '5 Best Practices for Better SaaS User Onboarding (ProductLed)' }]
        }
      ],
      exercises: [
        {
          title: 'Check: why customers stop',
          description:
            '<p>Why new customers quit, and what a good first lesson does instead of a menu tour.</p><p>3 questions in 3 formats: single choice, true or false, multiple choice.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Check: why customers stop" />',
          questions: [
            {
              type: 'RADIO',
              title: 'What usually makes a new customer quit?',
              options: [
                { label: 'The first success takes too long', correct: true },
                { label: 'The logo is the wrong color' },
                { label: 'There are too few settings' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'A menu tour is a good first lesson.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            },
            {
              type: 'CHECKBOX',
              title: 'A first lesson should do which of these?',
              options: [
                { label: 'Show one path that works', correct: true },
                { label: 'End with something the reader can try', correct: true },
                { label: 'List every feature' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'The first week',
      lessons: [
        {
          title: 'Map the first-week journey',
          content: `<p>Before you write a single lesson, map the first week. The map decides what goes in the course and, just as important, what stays out.</p><h2>Start from the outcome</h2><p>Write down the outcome the customer came for, in their words. Everything in week one should move toward it. If a step does not, it belongs later.</p><h2>Break it into sittings</h2><p>Split the week into steps that each finish in one sitting. A step someone can complete in ten minutes gets done. A step that needs an afternoon gets postponed, and postponed steps are where people drop off.</p><h2>Put the hardest step second</h2><p>Open with a quick win so the customer believes it will work. Put the hardest step second, while their motivation is still high. By the fourth or fifth step, momentum carries them.</p><h2>Leave things out</h2><p>Week one should not include every feature you are proud of. Advanced settings, integrations, and edge cases can wait for week two, once the customer has something working.</p><p>Try it: write your customer’s outcome in one sentence, then list the three to five steps that get them there.</p>`,
          videos: [
            { youtubeId: 'RS0TU1XL7FQ', title: 'Customer Onboarding Metric: Time to First Value (CSM Practice)' }
          ]
        }
      ],
      exercises: [
        {
          title: 'Check: the first week',
          description:
            '<p>Map the first week: start from the outcome, keep each step to one sitting, and put the hardest step second.</p><p>3 questions in 3 formats: single choice, true or false, multiple choice.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1647559709189-a257be60e147?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Check: the first week" />',
          questions: [
            {
              type: 'RADIO',
              title: 'Where should the hardest step sit?',
              options: [
                { label: 'Second', correct: true },
                { label: 'First' },
                { label: 'It should be a separate course' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'Week one should include every feature you are proud of.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            },
            {
              type: 'CHECKBOX',
              title: 'A good first-week map includes:',
              options: [
                { label: 'A step that finishes in one sitting', correct: true },
                { label: 'The outcome the customer came for', correct: true },
                { label: 'A tour of the billing page' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Lessons people finish',
      lessons: [
        {
          title: 'Write lessons people finish',
          content: `<p>A lesson people finish teaches one idea and ends with one thing to do. Most unfinished lessons are not too hard; they are two or three lessons squeezed into one.</p><h2>One idea per lesson</h2><p>Split a lesson when it starts teaching a second idea. Two short lessons get finished more often than one long one, and each one is easier to update later.</p><h2>Short on purpose</h2><ul><li>Say what the reader will be able to do, in the first line.</li><li>Show the steps with the real screens.</li><li>Cut anything they will not need today.</li></ul><h2>End on the action</h2><p>The last line of a lesson should be the action: the one thing the reader does next. Endings that earn the next click are either a single action to try now, or a question the next lesson answers.</p><h2>Write like you talk</h2><p>Use short sentences and the words your customers use. If you would not say it to a customer on a call, rewrite it.</p><p>Try it: take your longest lesson, find where it starts a second idea, and split it there.</p>`,
          videos: [
            {
              youtubeId: 'ORSNz-Vki4w',
              title: 'How To Effectively Use Microlearning when Designing Training (Educraft)'
            }
          ]
        }
      ],
      exercises: [
        {
          title: 'Check: lessons',
          description:
            '<p>What makes a lesson people finish: one idea, short on purpose, and an ending that earns the next click.</p><p>3 questions in 3 formats: single choice, true or false, multiple choice.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1676287565869-6992e7df9bb4?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Check: lessons" />',
          questions: [
            {
              type: 'RADIO',
              title: 'When should you split a lesson?',
              options: [
                { label: 'When it starts teaching a second idea', correct: true },
                { label: 'When it passes 2,000 words no matter the idea' },
                { label: 'Never' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'The last line of a lesson should be the action.',
              options: [{ label: 'True', correct: true }, { label: 'False' }]
            },
            {
              type: 'CHECKBOX',
              title: 'Which endings earn the next click?',
              options: [
                { label: 'A single action', correct: true },
                { label: 'A question the next lesson answers', correct: true },
                { label: 'A repeat of the introduction' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Measure',
      lessons: [
        {
          title: 'Measure what matters',
          content: `<p>You cannot improve a course you do not measure, but most course numbers measure the wrong thing. Page views and time spent tell you people showed up, not that they succeeded.</p><h2>Count the steps that matter</h2><ul><li>How many started the first lesson.</li><li>How many finished the first lesson.</li><li>How many finished the course.</li><li>How many did the real task afterwards.</li></ul><h2>Fix the biggest gap first</h2><p>Look at where the numbers drop. The gap to rewrite first is usually people who started the first lesson but did not finish the course: they were interested, and something in the course lost them.</p><h2>Scores are not skills</h2><p>A high quiz score means the learner remembered the lesson, not that they can do the job. Pair quizzes with a real task, such as building something, submitting a link, or completing a step in the product, and measure that.</p><h2>Time to first value</h2><p>Track how long it takes a new customer to reach their first real result. If the course shortens that time, it is working, whatever the page views say.</p><p>Try it: write down your four counts from the list above for last month, and circle the biggest drop.</p>`,
          videos: [
            { youtubeId: 'Ae5-shAAU-s', title: 'What Is Time to Value (TTV) and How Do You Measure It? (Jotform)' }
          ]
        }
      ],
      exercises: [
        {
          title: 'Check: measurement',
          description:
            '<p>Which numbers show a course is working, and which gap to fix first.</p><p>3 questions in 3 formats: single choice, true or false, multiple choice.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1650735311937-1876825e971b?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Check: measurement" />',
          questions: [
            {
              type: 'RADIO',
              title: 'Which gap should you rewrite first?',
              options: [
                { label: 'Started the first lesson, did not finish the course', correct: true },
                { label: 'Visited the pricing page' },
                { label: 'Opened the welcome email' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'A high quiz score means the learner can do the job.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            },
            {
              type: 'CHECKBOX',
              title: 'Useful counts are:',
              options: [
                { label: 'Finished the first lesson', correct: true },
                { label: 'Finished the course', correct: true },
                { label: 'How many times the logo was viewed' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Advocates',
      lessons: [
        {
          title: 'Turn learners into advocates',
          content: `<p>Customers who succeed because of your course are your best marketing. The trick is to ask them to share that success at the right moment, and to make it easy.</p><h2>Ask right after the first real win</h2><p>The best time to ask for a story is right after the customer’s first real win, when the result is fresh and they are proud of it. A month later, the details are gone and the enthusiasm has faded.</p><h2>What makes a useful story</h2><ul><li>What they did, in their own words.</li><li>How long it took.</li><li>What changed because of it.</li></ul><p>Specific stories persuade. “We set up onboarding in two days and support tickets dropped” beats “Great product, highly recommend.”</p><h2>Give the next step</h2><p>This course ends with a call to action. If you publish it for your own customers, point the button at your real demo or sign-up page. Never leave the placeholder URL in place; it is the one link every reader who liked the course will click.</p><h2>Close the loop</h2><p>When a customer shares a story, thank them and show them where it was used. People who see their story help others tend to share the next one too.</p><p>You have finished Customer Education 101. Book a demo below to see how to put these ideas into practice.</p>`
        }
      ],
      exercises: [
        {
          title: 'Check: advocates',
          description:
            '<p>When to ask for a customer story, what makes it useful, and where the button should point.</p><p>3 questions in 3 formats: single choice, true or false, multiple choice.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>You can retake it as many times as you like.</li></ul><img src="https://images.unsplash.com/photo-1676287569988-e5d4f914968d?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Check: advocates" />',
          questions: [
            {
              type: 'RADIO',
              title: 'When should you ask for the story?',
              options: [
                { label: 'Right after the first real win', correct: true },
                { label: 'A year later in a survey' },
                { label: 'Before they have finished anything' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'The demo button should keep the placeholder URL.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            },
            {
              type: 'CHECKBOX',
              title: 'A useful story includes:',
              options: [
                { label: 'What they did', correct: true },
                { label: 'How long it took', correct: true },
                { label: 'Their password' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Final exam',
      lessons: [],
      exercises: [
        {
          title: 'Final exam',
          description:
            '<p>The final exam covers all five lessons, from why customers stop to turning learners into advocates.</p><p>8 questions in 8 formats: single choice, true or false, ordering, fill in the blank, multiple choice, short answer, word bank, numeric.</p><h2>Before you start the exam</h2><ul><li>Take it when you have finished every section. You can retake it.</li></ul><img src="https://images.unsplash.com/photo-1675119715594-30fde4bd3dbc?w=1200&amp;q=75&amp;auto=format&amp;fit=crop" alt="Final exam" />',
          final: true,
          questions: [
            {
              type: 'RADIO',
              title: 'What usually makes a new customer quit?',
              options: [
                { label: 'The first success takes too long', correct: true },
                { label: 'Too many features' },
                { label: 'A high price' },
                { label: 'Too few emails' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'A menu tour is a good first lesson.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            },
            {
              type: 'ORDERING',
              title: 'Put the first week in order.',
              options: [
                { label: 'Open with a quick win', correct: true },
                { label: 'Put the hardest step second', correct: true },
                { label: 'Let momentum carry the later steps', correct: true }
              ]
            },
            {
              type: 'FILL_BLANK',
              title: 'Split a lesson when it starts teaching a second ___.',
              options: [{ label: 'idea', correct: true }]
            },
            {
              type: 'CHECKBOX',
              title: 'Which counts tell you a course is working?',
              options: [
                { label: 'Finished the first lesson', correct: true },
                { label: 'Finished the course', correct: true },
                { label: 'Did the real task afterwards', correct: true },
                { label: 'Page views' },
                { label: 'Time on page' }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'What should the last line of a lesson be?',
              options: [
                { label: 'the action', correct: true },
                { label: 'action', correct: true },
                { label: 'an action', correct: true },
                { label: 'the next action', correct: true }
              ]
            },
            {
              type: 'WORD_BANK',
              title: 'Complete the sentence.',
              template:
                'Ask for a story right after the first real ___, and point the button at your real ___ or sign-up page.',
              options: [
                { label: 'win', correct: true },
                { label: 'demo', correct: true },
                { label: 'login' },
                { label: 'pricing' },
                { label: 'invoice' }
              ]
            },
            {
              type: 'NUMERIC',
              title: 'How many ideas should one lesson teach?',
              options: [{ label: '1', correct: true }]
            }
          ]
        }
      ]
    }
  ]
};

const chatgptWork: LaunchTemplateFixture = {
  slug: 'getting-started-with-chatgpt-work',
  title: 'Getting Started with ChatGPT Work',
  description:
    'Learn to use ChatGPT Work for real tasks: connect your apps, reuse skills, schedule work, create docs and slides, and work from your phone. Built on OpenAI’s official video series.',
  type: 'SELF_PACED',
  bannerImage: templateBanner('getting-started-with-chatgpt-work'),
  metadata: {
    skills: [
      'Connecting work apps',
      'Building reusable skills',
      'Scheduling recurring tasks',
      'Creating docs and slides',
      'Building shareable sites',
      'Working by voice'
    ],
    tools: [
      'ChatGPT Work',
      'Gmail',
      'Slack',
      'Google Calendar',
      'Google Drive',
      'Google Docs',
      'Google Slides',
      'Chrome'
    ],
    reviews: [
      {
        id: 1,
        hide: false,
        name: 'Sofia L.',
        avatar_url: '',
        rating: 4,
        created_at: 1791763200000,
        description:
          'Solid course. The word bank and fill-in-the-blank questions were harder than they looked, in a good way.'
      },
      {
        id: 2,
        hide: false,
        name: 'Aiko T.',
        avatar_url: '',
        rating: 4,
        created_at: 1798416000000,
        description:
          'Clear and practical. I wanted one more worked example in the middle section, but the final exam pulled everything together.'
      },
      {
        id: 3,
        hide: false,
        name: 'Lucas M.',
        avatar_url: '',
        rating: 4,
        created_at: 1795564800000,
        description:
          'Good pacing. The reflection question at the end made me write down what I would change at work, and then I actually changed it.'
      },
      {
        id: 4,
        hide: false,
        name: 'Priya S.',
        avatar_url: '',
        rating: 5,
        created_at: 1794528000000,
        description:
          'Short lessons and a quiz at the end of every section. I finished it over two lunch breaks and still remembered it a month later.'
      },
      {
        id: 5,
        hide: false,
        name: 'Chen W.',
        avatar_url: '',
        rating: 5,
        created_at: 1790380800000,
        description:
          'Well structured. I could see how every section built on the one before it, which made the harder parts easier.'
      }
    ],
    requirements: 'No prior experience needed. Each lesson is a short video with a written summary.',
    description:
      'Learn to use ChatGPT Work for real tasks: connect your apps, reuse skills, schedule work, create docs and slides, and work from your phone. Built on OpenAI’s official video series.',
    goals: 'Connect your work apps, reuse what works with skills and templates, and hand repeat tasks to ChatGPT Work.',
    allowSelfEnrollment: true,
    isContentGroupingEnabled: true,
    progressionMode: 'free',
    commentsEnabled: true,
    aiTutor: {
      enabled: true,
      inheritFromOrg: false,
      persona: 'friendly',
      assessmentMode: 'hint_only',
      groundingScope: 'course'
    }
  },
  certificate: {
    isDownloadable: true,
    threshold: 100,
    exerciseMinScorePercent: 70,
    design: { templateId: 'minimal', accentColor: '#111111', subtitle: 'Getting Started with ChatGPT Work' }
  },
  highlights: [
    { title: 'Official OpenAI videos', description: 'Every lesson embeds a video from OpenAI’s YouTube series.' },
    {
      title: 'A mixed-format final exam',
      description: 'Ten questions across nine question types, from word banks to ordering.'
    },
    {
      title: 'Certificate on completion',
      description: 'Issued when every lesson is done and the final exam scores 70% or more.'
    }
  ],
  sections: [
    {
      title: 'Start working',
      lessons: [
        guide(
          [
            'Video lessons → each lesson has its YouTube video attached under Videos.',
            'Section quizzes → the exercise at the end of each section.',
            'Certificate → Settings › Certificate. Issued when every lesson is complete.',
            'AI tutor → Settings › AI tutor. It answers from the lesson text, so keep the summaries accurate.'
          ],
          '<h2>Credits</h2><p>Videos are published by OpenAI on YouTube and embedded here. The lesson text and quizzes are ClassroomIO’s summary of them.</p>'
        ),
        videoLesson({
          title: 'Getting Started with ChatGPT Work',
          youtubeId: 'Rk4VyQxDq5s',
          source: 'OpenAI',
          summary:
            'Chat is for a thoughtful answer. Work goes a step further: it can bring in information from the apps you already use and help you finish the task. This video installs the desktop app, connects Gmail and Slack as plugins, and drafts a reply to confirm a team dinner. You review the draft, and nothing is sent until you approve it.',
          points: [
            'Download the ChatGPT desktop app, sign in, and choose Work instead of Chat. Work mode is also on the web at chatgpt.com.',
            'Install the Gmail and Slack plugins from Plugins in the sidebar, and review the permissions before connecting. You only do this once.',
            'Ask ChatGPT Work to find the restaurant’s email, check Slack for the latest headcount and dietary needs, and draft a reply. You don’t need a perfect prompt.',
            'Edit the draft, then approve the send. Nothing goes out until you say so.',
            'Turn on Wake Pet to get an alert when a task finishes or needs your attention.'
          ],
          next: 'Try it: connect one app you use every day and ask ChatGPT Work to pull together what you need for one small task.'
        }),
        videoLesson({
          title: 'Use Your Computer and Browser',
          youtubeId: '981SivztzOc',
          source: 'OpenAI',
          summary:
            'Some tools have no plugin, or live in a desktop app or a website you’re already signed into. Computer use and Chrome use cover those cases, but only in the Work tab of the ChatGPT desktop app. This video plays a Spotify daylist, takes an appshot, and prepares a Workday time-off request and an out-of-office event that stop for your review.',
          points: [
            'Computer use and Chrome use are only in the Work tab of the desktop app, not on the web or your phone.',
            'ChatGPT asks for permission before it uses an app or website. You can allow it once or let it remember your choice.',
            'Computer use plays a Spotify daylist through the desktop app, with no special Spotify integration. You can watch, take over, or stop it.',
            'Press Command Command to take an appshot, a screenshot with context, so ChatGPT can see what you’re looking at.',
            'Chrome use fills in the Workday form because Workday has no plugin, and the Google Calendar plugin prepares the out-of-office event. Both stop before submitting.'
          ],
          next: 'Next: use a plugin when there’s a direct route to a tool, Computer use for a desktop app, and Chrome use for a website you’re signed into.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Start working',
          description:
            '<p>This quiz checks what you took from Getting Started with ChatGPT Work and Use Your Computer and Browser.</p><p>4 questions in 3 formats: single choice, ordering, fill in the blank.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/Rk4VyQxDq5s/hqdefault.jpg" alt="Getting Started with ChatGPT Work" />',
          questions: [
            {
              type: 'RADIO',
              title: 'In the team-dinner example, when does the reply get sent?',
              options: [
                { label: 'After you review it and approve the send', correct: true },
                { label: 'As soon as ChatGPT Work finishes the draft' },
                { label: 'When the restaurant confirms the booking' },
                { label: 'When Slack shows the final headcount' }
              ]
            },
            {
              type: 'ORDERING',
              title: 'Put the steps for connecting the Gmail plugin in order.',
              options: [
                { label: 'Click Plugins in the sidebar', correct: true },
                { label: 'Search for Gmail', correct: true },
                { label: 'Select Install', correct: true },
                { label: 'Sign in and review the permissions', correct: true }
              ]
            },
            {
              type: 'RADIO',
              title: 'Where can you use Computer use and Chrome use?',
              options: [
                { label: 'Only in the Work tab of the ChatGPT desktop app', correct: true },
                { label: 'In regular ChatGPT on the web' },
                { label: 'In the ChatGPT app on your phone' },
                { label: 'Anywhere you are signed in to ChatGPT' }
              ]
            },
            {
              type: 'FILL_BLANK',
              title: 'Choose ___ use when the work lives in a browser you’re already signed into.',
              options: [{ label: 'Chrome', correct: true }]
            }
          ]
        }
      ]
    },
    {
      title: 'Reuse what works',
      lessons: [
        videoLesson({
          title: 'Plugins and Skills',
          youtubeId: '5QPBVrAAdBk',
          source: 'OpenAI',
          summary:
            'Plugins connect ChatGPT Work to the apps you already use. A skill is a reusable set of instructions ChatGPT can follow whenever you need the same kind of work done. This video adds Google Calendar to Gmail, books a client kickoff, builds a meeting brief, and saves the process as a skill called meeting prep.',
          points: [
            'Install the Google Calendar plugin next to Gmail so ChatGPT can use your inbox and calendar together.',
            'Ask for open times before Friday, then have ChatGPT use the client’s email to draft the invitation with attendees, a title, and an agenda.',
            'Build a meeting brief that covers the objective, client priorities, decisions, risks, and next steps.',
            'Save the process as a skill named meeting prep, then run it on another meeting to check the format and email context.'
          ],
          next: 'Try it: do one task you repeat every week, then save it as a skill and test it on a second case.'
        }),
        videoLesson({
          title: 'Scheduled Tasks',
          youtubeId: 'urXc4xxixVU',
          source: 'OpenAI',
          summary:
            'If you ask ChatGPT to do the same thing every day, turn it into a scheduled task that runs hourly, daily, weekly, or whenever you choose. This video checks a meeting-brief prompt by hand first, schedules it for every weekday at nine, manages it from Scheduled in the sidebar, and adds the meeting prep skill.',
          points: [
            'Make sure the Google Calendar and Gmail plugins are connected.',
            'Run the task once by hand to check the result is useful before scheduling it.',
            'Ask ChatGPT to do the same thing every weekday at nine.',
            'Open Scheduled in the sidebar to see the task and its next run, and change the time, pause it, or remove it.',
            'Add a skill to the task. The skill remembers how you like the work done, and the schedule decides when it happens.'
          ],
          next: 'Try it: run a task you repeat by hand once, check the result, then schedule it.'
        }),
        videoLesson({
          title: 'Create Slides, Docs, and Templates',
          youtubeId: 'syML5KT-HzI',
          source: 'OpenAI',
          summary:
            'A weekly meeting transcript becomes a Google Doc for the team and a slide deck for leadership. This video connects Google Drive, spells out the sections and formatting the doc needs, builds five leadership slides in the style of last week’s deck, and saves both formats with template creator so next week starts from the same structure.',
          points: [
            'Install the Google Drive plugin so ChatGPT can create actual Google Docs and slides.',
            'Spell out the doc: executive summary, updates, decisions, risks and blockers, action items, open questions, and next steps, with an action items table.',
            'Where an owner or deadline isn’t in the transcript, ChatGPT can flag it instead of guessing.',
            'Build five leadership slides from the doc, passing in last week’s deck so it uses the same format.',
            'Save both formats with template creator: it learns the doc’s headings and table, and the deck’s slide order, layout, and visual style.'
          ],
          next: 'Try it: turn your last meeting notes into a doc with the sections you want, then save it as a template.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Reuse what works',
          description:
            '<p>This quiz checks what you took from Plugins and Skills, Scheduled Tasks and Create Slides, Docs, and Templates.</p><p>4 questions in 4 formats: single choice, short answer, word bank, multiple choice.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/5QPBVrAAdBk/hqdefault.jpg" alt="Plugins and Skills" />',
          questions: [
            {
              type: 'RADIO',
              title: 'What is a skill in ChatGPT Work?',
              options: [
                { label: 'A reusable set of instructions ChatGPT can follow for the same kind of work', correct: true },
                { label: 'A plugin that connects a new app' },
                { label: 'A task that runs on a timer' },
                { label: 'A copy of your last chat' }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'What do you open in the sidebar to see, change, or pause a scheduled task?',
              options: [
                { label: 'Scheduled', correct: true },
                { label: 'Scheduled tab', correct: true }
              ]
            },
            {
              type: 'WORD_BANK',
              title: 'Complete the sentence about skills and scheduled tasks.',
              template: 'A ___ remembers how you like the work done. The ___ decides when it happens.',
              options: [
                { label: 'skill', correct: true },
                { label: 'scheduled task', correct: true },
                { label: 'plugin' },
                { label: 'template' },
                { label: 'site' }
              ]
            },
            {
              type: 'CHECKBOX',
              title: 'What does template creator learn from the leadership deck?',
              options: [
                { label: 'Slide order', correct: true },
                { label: 'Layout', correct: true },
                { label: 'Visual style', correct: true },
                { label: 'Who is allowed to view it' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Share and go mobile',
      lessons: [
        videoLesson({
          title: 'Build a Shareable Site',
          youtubeId: '0qK3KqvtRrg',
          source: 'OpenAI',
          summary:
            'ChatGPT Work can build a real website and put it on the internet, with no code. This video turns a group trip into a private site with votes and a shared expenses tracker, explains how to share it, and builds a launch dashboard that ChatGPT updates every weekday morning. Everything you build shows up in the sites tab.',
          points: [
            'Describe the site: arrival times, where you’re staying, reservations, a day-by-day itinerary, activity voting, and a shared expenses tracker.',
            'The site can save votes and expenses in a database, store uploaded files like receipts, and control who has access.',
            'To change the site, ask ChatGPT, for example to split shared costs automatically.',
            'The site starts private. Share it with specific people, who sign in with ChatGPT, or make it public.',
            'A launch dashboard checks Databricks, Slack, and public feedback every weekday morning and flags anything behind target.'
          ],
          next: 'Try it: turn a plan you are sharing by email into a small site, and decide who can see it.'
        }),
        videoLesson({
          title: 'Use ChatGPT Work on Your Phone',
          youtubeId: 'yfnh8SuMbNw',
          source: 'OpenAI',
          summary:
            'You can use ChatGPT Work from your phone to catch up on work and personal tasks before you reach your desk. This video catches up on a week of Slack and Gmail, checks spending with the read-only Finances plugin, sets a daily check, and uses Remote to guide a task running on a laptop that stays awake and online.',
          points: [
            'Ask for a catch-up on Slack and Gmail from the last week, including anything urgent.',
            'The Finances plugin checks your accounts and credit cards with read-only access.',
            'Ask it to repeat the check every day and flag anything out of the ordinary.',
            'Pair with Remote: open Remote on your computer, scan the pairing code with the phone app, and choose your computer.',
            'Keep the computer awake and online, for example with Keep this Mac awake.'
          ],
          next: 'Try it: pair your phone with Remote and check a task that is running on your computer.'
        }),
        videoLesson({
          title: 'Talk to ChatGPT Work',
          youtubeId: 'DLcQSp_CIIc',
          source: 'OpenAI',
          summary:
            'You can already talk to ChatGPT with Voice, but in ChatGPT Work on your computer it can start tasks and get things done. This video starts Voice from the Work tab, brainstorms Dev Day activation ideas, and asks for a visual pitch deck that is built in the background. To use this Voice from your phone, you connect through Remote.',
          points: [
            'Start Voice from the Work tab in the desktop app with the Voice button or a keyboard shortcut.',
            'Brainstorm out loud, such as Dev Day ideas for a Codex Game Boy and a custom T-shirt booth.',
            'Ask for a visual pitch deck from the OpenAI Slides template and image generation, built in the background while you keep using your computer.',
            'To use this Voice from your phone, connect through Remote and tap the button to trigger Voice.'
          ],
          next: 'Try it: talk through an idea for two minutes and ask ChatGPT Work to turn it into a short deck.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Share and go mobile',
          description:
            '<p>This quiz checks what you took from Build a Shareable Site, Use ChatGPT Work on Your Phone and Talk to ChatGPT Work.</p><p>4 questions in 4 formats: multiple choice, ordering, true or false, fill in the blank.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/0qK3KqvtRrg/hqdefault.jpg" alt="Build a Shareable Site" />',
          questions: [
            {
              type: 'CHECKBOX',
              title: 'What does the group-trip site include?',
              options: [
                { label: 'A day-by-day itinerary', correct: true },
                { label: 'Activities people can vote on', correct: true },
                { label: 'A shared expenses tracker', correct: true },
                { label: 'Flight booking' }
              ]
            },
            {
              type: 'ORDERING',
              title: 'Put the steps for connecting your phone to your computer with Remote in order.',
              options: [
                { label: 'Open Remote on your computer', correct: true },
                { label: 'Scan the pairing code with the ChatGPT app on your phone', correct: true },
                { label: 'Choose your computer', correct: true }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'The Finances plugin only has read-only access to your accounts.',
              options: [{ label: 'True', correct: true }, { label: 'False' }]
            },
            {
              type: 'FILL_BLANK',
              title: 'You start Voice from the ___ tab in the ChatGPT desktop app.',
              options: [{ label: 'Work', correct: true }]
            }
          ]
        }
      ]
    },
    {
      title: 'Final exam',
      lessons: [],
      exercises: [
        {
          title: 'Final exam',
          description:
            '<p>The final exam covers the whole course: Start working, Reuse what works, Share and go mobile.</p><p>10 questions in 9 formats: single choice, multiple choice, true or false, fill in the blank, short answer, ordering, word bank, numeric, written reflection.</p><h2>Before you start the exam</h2><ul><li>You need 70% on the scored questions to earn your certificate.</li><li>The reflection and feedback questions are not scored; your instructor reads them.</li><li>Take it when you have finished every section. You can retake it.</li></ul><img src="https://i.ytimg.com/vi/Rk4VyQxDq5s/maxresdefault.jpg" alt="Getting Started with ChatGPT Work" />',
          final: true,
          questions: [
            {
              type: 'RADIO',
              title: 'In the PTO demo, what fills in the Workday request?',
              options: [
                { label: 'Chrome use', correct: true },
                { label: 'Computer use' },
                { label: 'A Workday plugin' },
                { label: 'Remote' }
              ]
            },
            {
              type: 'CHECKBOX',
              title: 'A new site starts private. Which sharing choices do you have after that?',
              options: [
                { label: 'Keep it private', correct: true },
                { label: 'Give specific people access', correct: true },
                { label: 'Share it publicly', correct: true },
                { label: 'Sell access to it' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'Computer use and Chrome use can work in the background while you keep using your computer.',
              options: [{ label: 'True', correct: true }, { label: 'False' }]
            },
            {
              type: 'FILL_BLANK',
              title: 'Everything you build with Sites shows up in the ___ tab.',
              options: [
                { label: 'sites', correct: true },
                { label: 'Sites', correct: true }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'What do you type in to save a doc or deck format so you can reuse it next week?',
              options: [
                { label: 'template creator', correct: true },
                { label: 'Template Creator', correct: true }
              ]
            },
            {
              type: 'ORDERING',
              title: 'Put the steps for setting up the morning meeting-brief task in order.',
              options: [
                { label: 'Make sure Google Calendar and Gmail are connected', correct: true },
                { label: 'Test a brief for today’s meetings', correct: true },
                { label: 'Ask for the same thing every weekday at nine', correct: true },
                { label: 'Check the task under Scheduled in the sidebar', correct: true }
              ]
            },
            {
              type: 'WORD_BANK',
              title: 'Complete the rule for picking a tool.',
              template:
                'Use a ___ when there’s a direct route to the tool, ___ use when the work lives in a desktop app, and ___ use when it lives in a browser you’re signed into.',
              options: [
                { label: 'plugin', correct: true },
                { label: 'Computer', correct: true },
                { label: 'Chrome', correct: true },
                { label: 'Remote' },
                { label: 'Voice' },
                { label: 'skill' }
              ]
            },
            {
              type: 'NUMERIC',
              title: 'How many slides does the speaker ask for in the leadership deck?',
              options: [{ label: '5', correct: true }]
            },
            {
              type: 'RADIO',
              title: 'Which setting keeps a Mac available for Remote while you’re away?',
              options: [
                { label: 'Keep this Mac awake', correct: true },
                { label: 'Wake Pet' },
                { label: 'Do Not Disturb' },
                { label: 'Read-only access' }
              ]
            },
            {
              type: 'TEXTAREA',
              title:
                'Pick one task you repeat every week. Would you handle it with a plugin, a skill, a scheduled task, or a site, and which step would you still want to review yourself before anything is sent or submitted?'
            }
          ]
        }
      ]
    }
  ]
};

const aiFluency: LaunchTemplateFixture = {
  slug: 'ai-fluency-framework-foundations',
  title: 'AI Fluency: Framework & Foundations',
  description:
    'Build practical AI fluency with the 4D framework: Delegation, Description, Discernment, and Diligence. Built on the AI Fluency course videos from Anthropic, Prof. Rick Dakan, and Prof. Joseph Feller.',
  type: 'SELF_PACED',
  bannerImage: templateBanner('ai-fluency-framework-foundations'),
  metadata: {
    skills: ['Delegation', 'Description', 'Discernment', 'Diligence', 'Effective prompting', 'Evaluating AI output'],
    tools: ['Claude', 'Generative AI assistants'],
    reviews: [
      {
        id: 1,
        hide: false,
        name: 'Chen W.',
        avatar_url: '',
        rating: 5,
        created_at: 1798156800000,
        description:
          'Well structured. I could see how every section built on the one before it, which made the harder parts easier.'
      },
      {
        id: 2,
        hide: false,
        name: 'Daniel R.',
        avatar_url: '',
        rating: 5,
        created_at: 1793404800000,
        description:
          'We rolled this out to the whole team in a week. The written summaries under each video are what people keep coming back to.'
      },
      {
        id: 3,
        hide: false,
        name: 'Aiko T.',
        avatar_url: '',
        rating: 4,
        created_at: 1797638400000,
        description:
          'Clear and practical. I wanted one more worked example in the middle section, but the final exam pulled everything together.'
      },
      {
        id: 4,
        hide: false,
        name: 'Sofia L.',
        avatar_url: '',
        rating: 4,
        created_at: 1788825600000,
        description:
          'Solid course. The word bank and fill-in-the-blank questions were harder than they looked, in a good way.'
      },
      {
        id: 5,
        hide: false,
        name: 'Fatima B.',
        avatar_url: '',
        rating: 5,
        created_at: 1792972800000,
        description:
          'I liked that the AI tutor nudged me toward the answer instead of handing it over. It felt like studying with someone, not being tested.'
      }
    ],
    requirements: 'No prior experience needed. Each lesson is a short video with a written summary.',
    description:
      'Build practical AI fluency with the 4D framework: Delegation, Description, Discernment, and Diligence. Built on the AI Fluency course videos from Anthropic, Prof. Rick Dakan, and Prof. Joseph Feller.',
    goals:
      'Understand what generative AI can and cannot do, and work with it effectively, efficiently, ethically, and safely using the 4D framework.',
    allowSelfEnrollment: true,
    isContentGroupingEnabled: true,
    progressionMode: 'free',
    commentsEnabled: true,
    aiTutor: {
      enabled: true,
      inheritFromOrg: false,
      persona: 'friendly',
      assessmentMode: 'hint_only',
      groundingScope: 'course'
    }
  },
  certificate: {
    isDownloadable: true,
    threshold: 100,
    exerciseMinScorePercent: 70,
    design: { templateId: 'minimal', accentColor: '#111111', subtitle: 'AI Fluency: Framework & Foundations' }
  },
  highlights: [
    { title: 'A research-backed framework', description: 'Four competencies learners can apply to any AI tool.' },
    { title: 'Official course videos', description: 'Every lesson embeds a video from the AI Fluency course.' },
    {
      title: 'A mixed-format final exam',
      description: 'Ten questions across nine question types, from word banks to ordering.'
    }
  ],
  sections: [
    {
      title: 'Why AI fluency',
      lessons: [
        guide(
          [
            'Video lessons → each lesson has its YouTube video attached under Videos.',
            'Section quizzes → the exercise at the end of each section.',
            'Certificate → Settings › Certificate. Issued when every lesson is complete.',
            'AI tutor → Settings › AI tutor. A good fit here: learners can practise the 4Ds with it.'
          ],
          '<h2>Credits</h2><p>Videos are from AI Fluency: Framework and Foundations, developed by Anthropic, Prof. Rick Dakan (Ringling College of Art and Design), and Prof. Joseph Feller (University College Cork), and published on YouTube. The lesson text and quizzes are ClassroomIO’s summary.</p>'
        ),
        videoLesson({
          title: 'Introduction to AI Fluency',
          youtubeId: 'JpGtOfSgR-c',
          source: 'Anthropic',
          summary:
            'The course is about people, not the technology: how we interact and collaborate with AI systems. AI fluency is our ability to engage with AI in ways that are effective, efficient, ethical, and safe. Instead of prompt tips that go out of date, the course teaches core competencies, the four Ds, that prepare you for today’s AI and the changes to come.',
          points: [
            'AI fluency is the ability to engage with AI systems in ways that are effective, efficient, ethical, and safe.',
            'The course focuses on how humans interact and collaborate with AI, not on AI as a technology.',
            'Tactical skills like specific prompts can quickly go out of date, so the course teaches core competencies instead.',
            'The four Ds are delegation, description, discernment, and diligence, and each gets a closer look later in the course.'
          ],
          next: 'Next: why we need AI fluency, and the three ways people work with AI.'
        }),
        videoLesson({
          title: 'Why do we need AI Fluency?',
          youtubeId: '4szRHy_CT7s',
          source: 'Anthropic',
          summary:
            'Having powerful AI tools does not mean we know how to use them well or responsibly. Research and experience point to three main ways people engage with AI: automation, augmentation, and agency. None is better than the others. They suit different situations, and you might use all three in a single project.',
          points: [
            'Automation: an AI assistant completes a specific task based on your instructions.',
            'Augmentation: you and the AI collaborate as creative thinking and problem-solving partners.',
            'Agency: AI works independently on your behalf, and you set its knowledge and behavior patterns.',
            'None of the three modes is inherently better, and one project can use all three.'
          ],
          next: 'Next: the 4D framework that ties the course together.'
        }),
        videoLesson({
          title: 'The 4D Framework',
          youtubeId: 'W4Ua6XFfX9w',
          source: 'Anthropic',
          summary:
            'Whether you work through automation, augmentation, or agency, four competencies make the difference: delegation, description, discernment, and diligence. They are not tied to specific tools or techniques, so they stay useful as AI changes. Most interactions run in small loops of description and discernment: describe, evaluate, refine.',
          points: [
            'Delegation: deciding when and how to use AI, and dividing the work between you and the AI.',
            'Description: communicating clearly with AI.',
            'Discernment: evaluating AI outputs.',
            'Diligence: using AI responsibly and standing behind the final work.',
            'Most interactions are small loops of describing what you need, evaluating what you get, and refining your request.'
          ],
          next: 'Try it: think of one task from your week and ask which of the four Ds it needs most.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Why AI fluency',
          description:
            '<p>This quiz checks what you took from Introduction to AI Fluency, Why do we need AI Fluency? and The 4D Framework.</p><p>4 questions in 4 formats: multiple choice, single choice, word bank, short answer.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/JpGtOfSgR-c/hqdefault.jpg" alt="Introduction to AI Fluency" />',
          questions: [
            {
              type: 'CHECKBOX',
              title: 'The four competencies in the 4D framework are:',
              options: [
                { label: 'Delegation', correct: true },
                { label: 'Description', correct: true },
                { label: 'Discernment', correct: true },
                { label: 'Diligence', correct: true },
                { label: 'Deployment' },
                { label: 'Debugging' }
              ]
            },
            {
              type: 'RADIO',
              title: 'You and the AI bounce ideas back and forth to develop a story character together. This mode is:',
              options: [{ label: 'Augmentation', correct: true }, { label: 'Automation' }, { label: 'Agency' }]
            },
            {
              type: 'WORD_BANK',
              title: 'Complete the definition of AI fluency.',
              template: 'AI fluency means interacting with AI systems in ways that are effective, ___, ___, and safe.',
              options: [
                { label: 'efficient', correct: true },
                { label: 'ethical', correct: true },
                { label: 'fast' },
                { label: 'automated' },
                { label: 'cheap' }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'Which way of working with AI has it working independently on your behalf?',
              options: [{ label: 'Agency', correct: true }]
            }
          ]
        }
      ]
    },
    {
      title: 'How generative AI works',
      lessons: [
        videoLesson({
          title: 'What is generative AI?',
          youtubeId: 'RyvXxApfHkk',
          source: 'Anthropic',
          summary:
            'Generative AI creates new content rather than just analyzing existing data. Large language models are a prominent type. Three developments made them possible: the transformer architecture, an explosion of digital data, and massive computing power. Models are pre-trained to predict the next text, then fine-tuned, and they generate responses instead of retrieving answers.',
          points: [
            'Generative AI creates new content rather than just analyzing existing data.',
            'Three developments came together: algorithmic breakthroughs like the transformer, lots of digital data, and more computing power.',
            'In pre-training, the model is shown text and asked to predict what comes next. Fine-tuning then teaches it to follow instructions.',
            'The model does not retrieve pre-written answers from a database. It generates new text.',
            'The context window is the AI’s working memory, a limit on how much it can consider at once.'
          ],
          next: 'Next: what these models are good at, and where they fall short.'
        }),
        videoLesson({
          title: 'Capabilities and limitations',
          youtubeId: 'W5cga7xipRI',
          source: 'Anthropic',
          summary:
            'Language models are versatile. They switch between tasks without extra training, keep track of a conversation, and can use tools like web search. They also have limits: a knowledge cutoff, hallucinations, a finite context window, varied answers to the same question, and historic trouble with multi-step reasoning. Humans and AI bring complementary strengths.',
          points: [
            'Models can shift between very different tasks without needing additional training.',
            'A knowledge cutoff date is the point after which a model has no innate knowledge of the world.',
            'A hallucination is AI confidently stating something that sounds plausible but is incorrect.',
            'Models are non-deterministic: ask the same question twice and you may get different answers.',
            'Humans bring critical thinking, judgment, creativity, and ethical oversight, while AI offers speed, scale, and pattern recognition.'
          ],
          next: 'Try it: ask an AI tool about something you know well, and check where it is right and wrong.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: How generative AI works',
          description:
            '<p>This quiz checks what you took from What is generative AI? and Capabilities and limitations.</p><p>4 questions in 3 formats: numeric, single choice, fill in the blank.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/RyvXxApfHkk/hqdefault.jpg" alt="What is generative AI?" />',
          questions: [
            {
              type: 'NUMERIC',
              title: 'In what year was the transformer architecture developed?',
              options: [{ label: '2017', correct: true }]
            },
            {
              type: 'RADIO',
              title: 'A model’s knowledge cutoff date is:',
              options: [
                { label: 'The point after which it has no innate knowledge of the world', correct: true },
                { label: 'The longest answer it can write' },
                { label: 'The number of users it allows' },
                { label: 'A setting that deletes old chats' }
              ]
            },
            {
              type: 'FILL_BLANK',
              title: 'The setting some LLM interfaces offer to control randomness is often called ___.',
              options: [{ label: 'temperature', correct: true }]
            },
            {
              type: 'RADIO',
              title: 'The context window is best described as:',
              options: [
                { label: 'The AI’s working memory: how much information it can consider at once', correct: true },
                { label: 'The date its training data ends' },
                { label: 'The settings screen of the chat app' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Delegation and description',
      lessons: [
        videoLesson({
          title: 'A closer look at Delegation',
          youtubeId: 'EljzyfdYkrc',
          source: 'Anthropic',
          summary:
            'Delegation is deciding what work is to be done, what you should do yourself, and what might suit AI better. It rests on three elements: problem awareness, platform awareness, and task delegation. The cornerstone is not AI at all but your own expertise. The best AI collaborators are experts in their fields first.',
          points: [
            'Problem awareness: clearly define your goals and the work needed before bringing AI in.',
            'Platform awareness: a working knowledge of available AI systems and their capabilities and limitations.',
            'Task delegation: strategically dividing the work between humans and AI.',
            'Some critical judgment areas should stay exclusively human.'
          ],
          next: 'Next: how to describe what you want clearly.'
        }),
        videoLesson({
          title: 'A closer look at Description',
          youtubeId: 'DmgujoZ1mmk',
          source: 'Anthropic',
          summary:
            'Description is communicating with AI: explaining tasks, giving context, and guiding the interaction. It goes far beyond writing clever prompts. It has three parts: product description, process description, and performance description. AI tools are not databases or vending machines. They behave differently in different contexts, so tell them how you want them to behave.',
          points: [
            'Product description: clearly define what you want the AI to create or provide.',
            'Process description: guide how the AI approaches your request.',
            'Performance description: define the behavioral aspects of the interaction.',
            'AI can’t read your mind, so set explicit requirements.'
          ],
          next: 'Next: prompting techniques that make descriptions work.'
        }),
        videoLesson({
          title: 'Effective prompting techniques',
          youtubeId: '2YCaBqP8muw',
          source: 'Anthropic',
          summary:
            'Prompting is how you apply description in practice. The video covers six foundational tips: give context, show examples, specify output constraints, break complex tasks into steps, ask the AI to think first, and define its role, style, or tone. It also suggests asking the AI to help improve your prompt, and treating prompting as iterative.',
          points: [
            'Give context: say what you want, why you want it, and who you are.',
            'Show examples of what good looks like, sometimes called few-shot prompting.',
            'Specify output constraints such as format and length, and break complex tasks into steps.',
            'Ask the AI to think first, and define its role, style, or tone.',
            'When unsure how to ask, have the AI help you improve your prompt.'
          ],
          next: 'Try it: rewrite one prompt you used this week with context, an example, and a format.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Delegation and description',
          description:
            '<p>This quiz checks what you took from A closer look at Delegation, A closer look at Description and Effective prompting techniques.</p><p>4 questions in 4 formats: multiple choice, single choice, fill in the blank, short answer.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/EljzyfdYkrc/hqdefault.jpg" alt="A closer look at Delegation" />',
          questions: [
            {
              type: 'CHECKBOX',
              title: 'The three elements of delegation are:',
              options: [
                { label: 'Problem awareness', correct: true },
                { label: 'Platform awareness', correct: true },
                { label: 'Task delegation', correct: true },
                { label: 'Price awareness' }
              ]
            },
            {
              type: 'RADIO',
              title: 'Which concept is the ability to guide how the AI approaches your request?',
              options: [
                { label: 'Process description', correct: true },
                { label: 'Product description' },
                { label: 'Performance description' },
                { label: 'Platform awareness' }
              ]
            },
            {
              type: 'FILL_BLANK',
              title: 'Giving the AI examples of good output to emulate is sometimes called ___ prompting.',
              options: [
                { label: 'few-shot', correct: true },
                { label: 'few shot', correct: true },
                { label: 'fewshot', correct: true },
                { label: 'n-shot', correct: true },
                { label: 'n shot', correct: true },
                { label: 'nshot', correct: true }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title:
                'Listing out task steps so the AI follows your process is sometimes called what kind of prompting?',
              options: [
                { label: 'chain of thought', correct: true },
                { label: 'chain-of-thought', correct: true }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Discernment and diligence',
      lessons: [
        videoLesson({
          title: 'A closer look at Discernment',
          youtubeId: 'Y0KidGr9Z2Y',
          source: 'Anthropic',
          summary:
            'Discernment is evaluating what AI produces, how it produces it, and how it behaves. It is the flip side of description. It has three parts: product, process, and performance discernment. When discernment flags a problem, better description is often the fix, though sometimes you need to rethink your delegation decisions.',
          points: [
            'Product discernment: judge the accuracy and value of what the AI creates.',
            'Process discernment: judge the quality and effectiveness of the AI’s process.',
            'Performance discernment: judge the quality of the human AI interaction.',
            'When discernment flags a problem, better description is often the solution, but not always.',
            'Description and discernment form a continuous loop of instruction and evaluation.'
          ],
          next: 'Next: diligence, taking responsibility for your AI use.'
        }),
        videoLesson({
          title: 'A closer look at Diligence',
          youtubeId: 'QbLf2zb3oPc',
          source: 'Anthropic',
          summary:
            'Diligence is taking responsibility for your AI interactions. It focuses mostly on the ethical and safety side of fluency. It has three parts: creation diligence, transparency diligence, and deployment diligence. When you share AI generated content, you, not the AI, are responsible for it. Legal and regulatory frameworks are still emerging, so staying informed is part of diligence.',
          points: [
            'Creation diligence: be critical and intentional about which AI systems you work with and how.',
            'Transparency diligence: be open and accurate about AI’s role with everyone who needs to know.',
            'Deployment diligence: take informed responsibility for outputs you use or share.',
            'You, not the AI, are ultimately responsible for the accuracy of what you share.'
          ],
          next: 'Next: bringing the four Ds together.'
        }),
        videoLesson({
          title: 'Conclusion',
          youtubeId: 'ytEN_iAk09c',
          source: 'Anthropic',
          summary:
            'The closing lesson revisits the four Ds and their parts, and reminds you that they apply across automation, augmentation, and agency. The competencies are not mastered overnight. They grow through practice. AI systems are powerful but not silver bullets, so invest in your own expertise and take responsibility for what you create together.',
          points: [
            'The four Ds apply across all three ways of interacting with AI: automation, augmentation, and agency.',
            'The competencies develop through practice, and the goal isn’t perfection.',
            'AI systems are powerful but not silver bullets or magical solutions.',
            'The framework is designed to stay relevant as AI systems evolve.'
          ],
          next: 'Try it: pick one task and walk it through all four Ds.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Discernment and diligence',
          description:
            '<p>This quiz checks what you took from A closer look at Discernment, A closer look at Diligence and Conclusion.</p><p>4 questions in 4 formats: fill in the blank, single choice, short answer, true or false.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/Y0KidGr9Z2Y/hqdefault.jpg" alt="A closer look at Discernment" />',
          questions: [
            {
              type: 'FILL_BLANK',
              title:
                'Noticing that the AI keeps reinserting ideas you already rejected is an example of ___ discernment.',
              options: [{ label: 'process', correct: true }]
            },
            {
              type: 'RADIO',
              title: 'Telling colleagues which parts of a team proposal were AI assisted is an example of:',
              options: [
                { label: 'Transparency diligence', correct: true },
                { label: 'Creation diligence' },
                { label: 'Deployment diligence' },
                { label: 'Process discernment' }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title:
                'Checking a service’s data protection policies before sharing sensitive company information is which type of diligence?',
              options: [
                { label: 'creation diligence', correct: true },
                { label: 'creation', correct: true }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'Description and discernment work together as a continuous loop of instruction and evaluation.',
              options: [{ label: 'True', correct: true }, { label: 'False' }]
            }
          ]
        }
      ]
    },
    {
      title: 'Final exam',
      lessons: [],
      exercises: [
        {
          title: 'Final exam',
          description:
            '<p>The final exam covers the whole course: Why AI fluency, How generative AI works, Delegation and description, Discernment and diligence.</p><p>10 questions in 9 formats: multiple choice, ordering, word bank, fill in the blank, short answer, true or false, single choice, numeric, written reflection.</p><h2>Before you start the exam</h2><ul><li>You need 70% on the scored questions to earn your certificate.</li><li>The reflection and feedback questions are not scored; your instructor reads them.</li><li>Take it when you have finished every section. You can retake it.</li></ul><img src="https://i.ytimg.com/vi/W4Ua6XFfX9w/maxresdefault.jpg" alt="AI Fluency: Framework &amp; Foundations" />',
          final: true,
          questions: [
            {
              type: 'CHECKBOX',
              title: 'Which three developments came together to make today’s generative AI possible?',
              options: [
                { label: 'Algorithmic and architectural breakthroughs', correct: true },
                { label: 'The explosion of digital data', correct: true },
                { label: 'Massive increases in computational power', correct: true },
                { label: 'Cheaper smartphones' }
              ]
            },
            {
              type: 'ORDERING',
              title: 'Put the stages of an LLM’s life in order.',
              options: [
                { label: 'Pre-training', correct: true },
                { label: 'Fine-tuning', correct: true },
                { label: 'Deployment', correct: true }
              ]
            },
            {
              type: 'WORD_BANK',
              title: 'Complete the sentence about the diligence competency.',
              template: 'Creation, ___, and ___ diligence work together to form the complete diligence competency.',
              options: [
                { label: 'transparency', correct: true },
                { label: 'deployment', correct: true },
                { label: 'discernment' },
                { label: 'delegation' },
                { label: 'description' }
              ]
            },
            {
              type: 'FILL_BLANK',
              title: 'Ask the same question twice and you may get different answers, because LLMs are ___ by default.',
              options: [
                { label: 'non-deterministic', correct: true },
                { label: 'nondeterministic', correct: true },
                { label: 'non deterministic', correct: true },
                { label: 'unpredictable', correct: true }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'Which of the four Ds asks how we evaluate what AI gives us?',
              options: [{ label: 'Discernment', correct: true }]
            },
            {
              type: 'TRUE_FALSE',
              title:
                'When the context window limit is exceeded, information usually drops out on a first in, first out basis.',
              options: [{ label: 'True', correct: true }, { label: 'False' }]
            },
            {
              type: 'RADIO',
              title: '“Is the AI asking too many questions when you need concise answers?” This question is part of:',
              options: [
                { label: 'Performance discernment', correct: true },
                { label: 'Product discernment' },
                { label: 'Process description' },
                { label: 'Deployment diligence' }
              ]
            },
            {
              type: 'NUMERIC',
              title: 'How many foundational prompting tips does the prompting video cover?',
              options: [{ label: '6', correct: true }]
            },
            {
              type: 'RADIO',
              title: 'According to the conclusion, critical evaluation of AI outputs is:',
              options: [
                { label: 'A non-negotiable responsibility', correct: true },
                { label: 'Optional once you are an expert' },
                { label: 'The AI’s job' },
                { label: 'Only needed for code' }
              ]
            },
            {
              type: 'TEXTAREA',
              title:
                'Think of one piece of work you plan to do with AI this month. Which parts would you delegate, how would you describe the task, how would you check the result, and what would you tell others about the AI’s role?'
            }
          ]
        }
      ]
    }
  ]
};

const hubspotSalesHub: LaunchTemplateFixture = {
  slug: 'hubspot-sales-hub-essentials',
  title: 'HubSpot Sales Hub Essentials',
  description:
    'Get productive in HubSpot Sales Hub: manage leads, write cold emails with templates and sequences, run a consistent sales process, and coach with call recordings. Built on HubSpot Academy’s official videos.',
  type: 'SELF_PACED',
  bannerImage: templateBanner('hubspot-sales-hub-essentials'),
  metadata: {
    skills: [
      'Lead management',
      'Cold email writing',
      'Email sequences',
      'Sales process design',
      'Call coaching',
      'Sales forecasting'
    ],
    tools: ['HubSpot Sales Hub', 'HubSpot CRM', 'Breeze', 'Gmail', 'Outlook', 'LinkedIn'],
    reviews: [
      {
        id: 1,
        hide: false,
        name: 'Priya S.',
        avatar_url: '',
        rating: 5,
        created_at: 1793664000000,
        description:
          'Short lessons and a quiz at the end of every section. I finished it over two lunch breaks and still remembered it a month later.'
      },
      {
        id: 2,
        hide: false,
        name: 'Aiko T.',
        avatar_url: '',
        rating: 4,
        created_at: 1788480000000,
        description:
          'Clear and practical. I wanted one more worked example in the middle section, but the final exam pulled everything together.'
      },
      {
        id: 3,
        hide: false,
        name: 'Lucas M.',
        avatar_url: '',
        rating: 4,
        created_at: 1790467200000,
        description:
          'Good pacing. The reflection question at the end made me write down what I would change at work, and then I actually changed it.'
      },
      {
        id: 4,
        hide: false,
        name: 'Sofia L.',
        avatar_url: '',
        rating: 4,
        created_at: 1797206400000,
        description:
          'Solid course. The word bank and fill-in-the-blank questions were harder than they looked, in a good way.'
      },
      {
        id: 5,
        hide: false,
        name: 'Omar K.',
        avatar_url: '',
        rating: 5,
        created_at: 1789862400000,
        description:
          'The certificate was a nice touch for our training records, and the quizzes felt fair rather than tricky.'
      }
    ],
    requirements: 'No prior experience needed. Each lesson is a short video with a written summary.',
    description:
      'Get productive in HubSpot Sales Hub: manage leads, write cold emails with templates and sequences, run a consistent sales process, and coach with call recordings. Built on HubSpot Academy’s official videos.',
    goals: 'Manage leads, write outreach that gets replies, and run a sales process your team can repeat and coach.',
    allowSelfEnrollment: true,
    isContentGroupingEnabled: true,
    progressionMode: 'free',
    commentsEnabled: true,
    aiTutor: {
      enabled: true,
      inheritFromOrg: false,
      persona: 'friendly',
      assessmentMode: 'hint_only',
      groundingScope: 'course'
    }
  },
  certificate: {
    isDownloadable: true,
    threshold: 100,
    exerciseMinScorePercent: 70,
    design: { templateId: 'minimal', accentColor: '#111111', subtitle: 'HubSpot Sales Hub Essentials' }
  },
  highlights: [
    { title: 'Official HubSpot Academy videos', description: 'Every lesson embeds a HubSpot Academy tutorial.' },
    { title: 'Three practical sections', description: 'From leads to coaching, each ending with a mixed-format quiz.' },
    {
      title: 'Certificate on completion',
      description: 'Issued when every lesson is done and the final exam scores 70% or more.'
    }
  ],
  sections: [
    {
      title: 'Manage leads and prospecting',
      lessons: [
        guide(
          [
            'Video lessons → each lesson has its YouTube video attached under Videos.',
            'Section quizzes → the exercise at the end of each section.',
            'Certificate → Settings › Certificate. Issued when every lesson is complete.',
            'Tailor it → add your own pipeline stages and email templates as extra lessons.'
          ],
          '<h2>Credits</h2><p>Videos are published by HubSpot Academy on YouTube and embedded here. The lesson text and quizzes are ClassroomIO’s summary of them.</p>'
        ),
        videoLesson({
          title: 'The Official HubSpot Sales Hub Tutorial',
          youtubeId: 'tRpOCQ15L7M',
          source: 'HubSpot Academy',
          summary:
            'A tour of Sales Hub from first lead to closed deal. The smart CRM keeps contacts, companies and activities in one shared view. The sales workspace gathers calls, emails, tasks and LinkedIn to-dos. You then see how leads become deals, how AI drafts emails, how sequences automate outreach, and how reports and call reviews help managers coach.',
          points: [
            'The smart CRM connects your data, customers and teams in one place.',
            'The sales workspace collects calls, emails, tasks and LinkedIn activities.',
            'Deal score ranks a deal from one to 100 on how likely it is to close.',
            'The sales velocity report shows the pace at which deals move through your pipeline.',
            'Coaching playlists let managers share call snippets with new reps.'
          ],
          next: 'Next: creating, working and qualifying leads step by step.'
        }),
        videoLesson({
          title: 'How to Manage Leads and Personalize Prospecting with HubSpot Sales Hub',
          youtubeId: 'Wrofb4JOIiY',
          source: 'HubSpot Academy',
          summary:
            'Leads can be created by hand from a contact, automatically through workflows, or pulled in as a list. Each lead moves through stages as you reach out and the prospect replies. When a lead is ready, you qualify it and it becomes a deal. You can also customize lead stages, add lead tags and automate outreach with sequences.',
          points: [
            'Not every contact is a lead, and not every lead is a contact.',
            'Workflows can create leads automatically, for example when a contact submits a form.',
            'Sending an email moves a lead to attempting, and a reply moves it to connected.',
            'Qualifying a lead creates a deal and carries over its activities.',
            'Lead tags are color-coded labels that show you where to focus.'
          ],
          next: 'Try it: move three of your own leads to the right stage and note the next step for each.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Manage leads and prospecting',
          description:
            '<p>This quiz checks what you took from The Official HubSpot Sales Hub Tutorial and How to Manage Leads and Personalize Prospecting with HubSpot Sales Hub.</p><p>4 questions in 4 formats: ordering, single choice, numeric, multiple choice.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/tRpOCQ15L7M/hqdefault.jpg" alt="The Official HubSpot Sales Hub Tutorial" />',
          questions: [
            {
              type: 'ORDERING',
              title: 'Put the lead stages in order, from first to last.',
              options: [
                { label: 'New', correct: true },
                { label: 'Attempting', correct: true },
                { label: 'Connected', correct: true },
                { label: 'Qualified', correct: true }
              ]
            },
            {
              type: 'RADIO',
              title: 'What happens to a lead’s stage as soon as you send it an email?',
              options: [
                { label: 'It moves to attempting', correct: true },
                { label: 'It moves to qualified' },
                { label: 'It becomes a deal' },
                { label: 'It stays new until a call' }
              ]
            },
            {
              type: 'NUMERIC',
              title: 'Deal score ranks a deal on a scale from one up to what number?',
              options: [{ label: '100', correct: true }]
            },
            {
              type: 'CHECKBOX',
              title: 'Which of these does the sales workspace collect in one place?',
              options: [
                { label: 'Calls', correct: true },
                { label: 'Emails', correct: true },
                { label: 'Tasks', correct: true },
                { label: 'Employee payroll' },
                { label: 'Office floor plans' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Write outreach and save time',
      lessons: [
        videoLesson({
          title: 'How to Write Cold Emails That Get Results',
          youtubeId: 'KGBoQsmFyHg',
          source: 'HubSpot Academy',
          summary:
            'Reps spend around 21% of their day writing emails. This lesson shows how to win that time back with templates and AI. A good cold email has a short subject line, a clear value proposition and something of value. You mix personalization tokens with spaces for manual notes, check each email before sending, and review what Breeze drafts.',
          points: [
            'Keep subject lines short, around 45 characters.',
            'A strong cold email needs a clear value proposition.',
            'Personalization tokens pull in details already in your CRM.',
            'Mix tokens with spaces you fill in by hand after your research.',
            'Check that an AI email matches your voice and is accurate before you send it.'
          ],
          next: 'Next: using AI to save time on deals, forecasts and meetings.'
        }),
        videoLesson({
          title: 'Your Sales Funnel Strategy Just Changed Forever',
          youtubeId: 'xOJYrM59XXs',
          source: 'HubSpot Academy',
          summary:
            'Sales reps spend 40% of their day on non-selling work. This lesson shows how Sales Hub helps you take that time back. Deal score and deal insights show deal health and risks. The forecast tool predicts where you will land. AI helps you prepare for meetings and follow up. Task queues and pipeline automation keep your to-do list moving.',
          points: [
            'Deal score is a health meter on a scale of 0 to 100.',
            'Deal insights surface risks and buyer goals from a deal’s activity.',
            'The forecast shows a most likely number plus upper and lower ranges.',
            'Task queues split your day into focused blocks of work.',
            'After a call, the follow-up card gives AI summaries and next steps.'
          ],
          next: 'Next: building a sales process your team can repeat.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Write outreach and save time',
          description:
            '<p>This quiz checks what you took from How to Write Cold Emails That Get Results and Your Sales Funnel Strategy Just Changed Forever.</p><p>4 questions in 4 formats: fill in the blank, true or false, single choice, numeric.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/KGBoQsmFyHg/hqdefault.jpg" alt="How to Write Cold Emails That Get Results" />',
          questions: [
            {
              type: 'FILL_BLANK',
              title: 'The presenter likes to keep cold email subject lines around ___ characters.',
              options: [
                { label: '45', correct: true },
                { label: 'forty-five', correct: true }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'You can send an AI-drafted email without reviewing it first.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            },
            {
              type: 'RADIO',
              title: 'In the forecast tool, which number does the presenter look at first?',
              options: [
                { label: 'The most likely number', correct: true },
                { label: 'The upper range' },
                { label: 'The lower range' },
                { label: 'Forecast accuracy over time' }
              ]
            },
            {
              type: 'NUMERIC',
              title: 'What percentage of their day do sales reps spend on non-selling activities?',
              options: [{ label: '40', correct: true }]
            }
          ]
        }
      ]
    },
    {
      title: 'Run and coach a consistent process',
      lessons: [
        videoLesson({
          title: 'How to Build a Consistent Sales Process',
          youtubeId: 'coWjMi3JGnA',
          source: 'HubSpot Academy',
          summary:
            'Many sales teams rely on guesswork and personal habits. This lesson shows how to add consistency without making things rigid. You customize deal stages, set close probabilities, require key fields and add approvals. Then you automate follow-up tasks, build playbooks for calls like discovery, and use tracked terms to see how consistent reps are on real calls.',
          points: [
            'Setting a close probability for each stage makes forecasting more accurate.',
            'Ask only for the information that is truly required at each stage.',
            'Deal approvals add a second set of eyes before a deal moves on.',
            'A stage automation can create a follow-up task three days after a proposal is sent.',
            'Playbooks standardize calls such as discovery, qualification and demos.'
          ],
          next: 'Next: using call analysis to coach your team.'
        }),
        videoLesson({
          title: 'Time-Saving Sales Training Tools You Need Now',
          youtubeId: 'nltHbp8_lvA',
          source: 'HubSpot Academy',
          summary:
            'Managers can spend hours listening to their team’s calls. This lesson shows a faster way to coach. You turn on conversation intelligence and transcription, then set tracked terms for competitors, features, pricing and next steps. Each call shows insights, stats and a transcript. You can comment on key moments, build coaching playlists and get a quick AI summary.',
          points: [
            'Tracked terms show when competitors, features and next steps come up.',
            'Start small with tracked terms and add more later.',
            'Call stats show talk time, the longest customer monologue and pace.',
            'Coaching playlists collect great calls, and you can clip just the best moment.',
            'The goal is to help your team improve, not to micromanage.'
          ],
          next: 'Try it: pick three terms your team should track and one call to share.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Run and coach a consistent process',
          description:
            '<p>This quiz checks what you took from How to Build a Consistent Sales Process and Time-Saving Sales Training Tools You Need Now.</p><p>4 questions in 4 formats: single choice, multiple choice, short answer, true or false.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/coWjMi3JGnA/hqdefault.jpg" alt="How to Build a Consistent Sales Process" />',
          questions: [
            {
              type: 'RADIO',
              title: 'What does the presenter say you are aiming for in your sales process?',
              options: [
                { label: 'Consistency', correct: true },
                { label: 'Perfection' },
                { label: 'More meetings' },
                { label: 'Longer calls' }
              ]
            },
            {
              type: 'CHECKBOX',
              title: 'Which stats does automatic call analysis show?',
              options: [
                { label: 'How much each person talks', correct: true },
                { label: 'Longest customer monologue', correct: true },
                { label: 'Pace', correct: true },
                { label: 'Email open rate' },
                { label: 'Deal amount' }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'Which button on the call page asks Breeze for a quick AI summary of a call?',
              options: [
                { label: 'Summarize', correct: true },
                { label: 'Summarize button', correct: true }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'The presenter recommends tracking every word said on calls.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            }
          ]
        }
      ]
    },
    {
      title: 'Final exam',
      lessons: [],
      exercises: [
        {
          title: 'Final exam',
          description:
            '<p>The final exam covers the whole course: Manage leads and prospecting, Write outreach and save time, Run and coach a consistent process.</p><p>10 questions in 10 formats: fill in the blank, ordering, word bank, short answer, multiple choice, true or false, numeric, single choice, written reflection, thumbs feedback.</p><h2>Before you start the exam</h2><ul><li>You need 70% on the scored questions to earn your certificate.</li><li>The reflection and feedback questions are not scored; your instructor reads them.</li><li>Take it when you have finished every section. You can retake it.</li></ul><img src="https://i.ytimg.com/vi/tRpOCQ15L7M/maxresdefault.jpg" alt="HubSpot Sales Hub Essentials" />',
          final: true,
          questions: [
            {
              type: 'FILL_BLANK',
              title: 'Sales reps spend around ___% of their day writing emails.',
              options: [{ label: '21', correct: true }]
            },
            {
              type: 'ORDERING',
              title: 'Put the steps of the lead sequence in order.',
              options: [
                { label: 'Send three automated emails', correct: true },
                { label: 'Wait for an open or a click', correct: true },
                { label: 'Research the company', correct: true },
                { label: 'Connect on LinkedIn', correct: true }
              ]
            },
            {
              type: 'WORD_BANK',
              title: 'Complete the sentence.',
              template: 'Start with pipeline ___, add some ___, then work in ___ when your team is ready.',
              options: [
                { label: 'stages', correct: true },
                { label: 'automation', correct: true },
                { label: 'playbooks', correct: true },
                { label: 'quotes' },
                { label: 'reports' }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'Which tool builds a series of automated emails plus manual tasks?',
              options: [
                { label: 'Sequences', correct: true },
                { label: 'Sequence', correct: true }
              ]
            },
            {
              type: 'CHECKBOX',
              title: 'Where can you send your email templates from?',
              options: [
                { label: 'A contact record in the CRM', correct: true },
                { label: 'Gmail or Outlook', correct: true },
                { label: 'Automated sequences', correct: true },
                { label: 'Printed letters' },
                { label: 'Text messages' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title:
                'When you qualify a lead, its emails and calls stay on the lead and do not carry over to the deal.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            },
            {
              type: 'NUMERIC',
              title: 'Up to how many approvers can the presenter set for a deal approval?',
              options: [{ label: '3', correct: true }]
            },
            {
              type: 'RADIO',
              title: 'How does the presenter describe the lower range in a forecast?',
              options: [
                { label: 'A safety net', correct: true },
                { label: 'The best case scenario' },
                { label: 'The most likely number' },
                { label: 'A list of closed deals' }
              ]
            },
            {
              type: 'TEXTAREA',
              title:
                'Which part of your own sales process is least consistent today, and which tool from this course would you try first?'
            },
            { type: 'THUMBS', title: 'Was this course useful?' }
          ]
        }
      ]
    }
  ]
};

const salesforceCpq: LaunchTemplateFixture = {
  slug: 'salesforce-cpq-admin-essentials',
  title: 'Salesforce CPQ Admin Essentials',
  description:
    'Short, practical demos for Salesforce admins: bundles, product rules, guided selling, subscriptions, multi-dimensional quoting, contracted pricing, approvals, and quote documents. Built on Salesforce’s official micro demos.',
  type: 'SELF_PACED',
  bannerImage: templateBanner('salesforce-cpq-admin-essentials'),
  metadata: {
    skills: [
      'Product bundling',
      'Product rules',
      'Guided selling',
      'Subscription management',
      'Multi-dimensional quoting',
      'Contracted pricing',
      'Approval chains'
    ],
    tools: ['Salesforce CPQ', 'Salesforce CPQ Plus', 'Advanced Approvals', 'DocuSign'],
    reviews: [
      {
        id: 1,
        hide: false,
        name: 'Chen W.',
        avatar_url: '',
        rating: 5,
        created_at: 1788739200000,
        description:
          'Well structured. I could see how every section built on the one before it, which made the harder parts easier.'
      },
      {
        id: 2,
        hide: false,
        name: 'Priya S.',
        avatar_url: '',
        rating: 5,
        created_at: 1792800000000,
        description:
          'Short lessons and a quiz at the end of every section. I finished it over two lunch breaks and still remembered it a month later.'
      },
      {
        id: 3,
        hide: false,
        name: 'Tomás G.',
        avatar_url: '',
        rating: 4,
        created_at: 1791590400000,
        description:
          'Useful and to the point. I skipped a lesson once and the quiz sent me straight back to it, which was fair.'
      },
      {
        id: 4,
        hide: false,
        name: 'Lucas M.',
        avatar_url: '',
        rating: 4,
        created_at: 1795564800000,
        description:
          'Good pacing. The reflection question at the end made me write down what I would change at work, and then I actually changed it.'
      },
      {
        id: 5,
        hide: false,
        name: 'Sofia L.',
        avatar_url: '',
        rating: 4,
        created_at: 1791331200000,
        description:
          'Solid course. The word bank and fill-in-the-blank questions were harder than they looked, in a good way.'
      }
    ],
    requirements: 'No prior experience needed. Each lesson is a short video with a written summary.',
    description:
      'Short, practical demos for Salesforce admins: bundles, product rules, guided selling, subscriptions, multi-dimensional quoting, contracted pricing, approvals, and quote documents. Built on Salesforce’s official micro demos.',
    goals: 'Configure a CPQ catalog, price and renew subscriptions, and speed up approvals and quote documents.',
    allowSelfEnrollment: true,
    isContentGroupingEnabled: true,
    progressionMode: 'free',
    commentsEnabled: true,
    aiTutor: {
      enabled: true,
      inheritFromOrg: false,
      persona: 'friendly',
      assessmentMode: 'hint_only',
      groundingScope: 'course'
    }
  },
  certificate: {
    isDownloadable: true,
    threshold: 100,
    exerciseMinScorePercent: 70,
    design: { templateId: 'minimal', accentColor: '#111111', subtitle: 'Salesforce CPQ Admin Essentials' }
  },
  highlights: [
    {
      title: 'Official Salesforce demos',
      description: 'Every lesson embeds a two-to-three minute Salesforce CPQ demo.'
    },
    { title: 'Admin-focused', description: 'Setup steps for each feature, with the terminology explained.' },
    {
      title: 'A mixed-format final exam',
      description: 'Ten questions across nine question types, from word banks to ordering.'
    }
  ],
  sections: [
    {
      title: 'Build the catalog',
      lessons: [
        guide(
          [
            'Video lessons → each lesson has its YouTube video attached under Videos.',
            'Section quizzes → the exercise at the end of each section.',
            'Certificate → Settings › Certificate. Issued when every lesson is complete.',
            'Tailor it → add a lesson with your own product catalog and approval rules.'
          ],
          '<h2>Credits</h2><p>Videos are published by Salesforce on YouTube and embedded here. The lesson text and quizzes are ClassroomIO’s summary of them.</p>'
        ),
        videoLesson({
          title: 'Bundled quotes for up-selling and cross-selling',
          youtubeId: '28juxa933qY',
          source: 'Salesforce',
          summary:
            'A bundle is a set of products sold together as a package. The parent product is the foundation, and the products sold beneath it are product options. Bundles help your team promote upsell and cross-sell opportunities while keeping packages technically valid. Setup takes three steps: turn the product into a bundle, define its features, then set its product options.',
          points: [
            'A bundle is a parent product with product options sold beneath it.',
            'Step 1: configure the product to function as a bundle.',
            'Step 2: define features, which organize product options within the bundle. Features can be grouped into tabs.',
            'Step 3: set product options. They can override pricing and set a default quantity, or be preselected or required.'
          ],
          next: 'Next: product rules that keep configurations valid.'
        }),
        videoLesson({
          title: 'How to Use Product Rules',
          youtubeId: 'skebbabq1vQ',
          source: 'Salesforce',
          summary:
            'Product rules keep configurations technically valid. Each rule is made of conditions and matching actions. The three most popular types are validation, alert and selection. You set a rule up in four steps: create the rule, define its conditions, create its product actions, and set the configuration rule that says which products it runs on.',
          points: [
            'Validation rules show a red message and block the quote until the error is cleared.',
            'Alert rules act like suggestions and let the rep decide how to proceed.',
            'Selection rules present relevant product options and filter out the rest.',
            'Conditions Met can be All, Any, or Custom for advanced logic.',
            'Conditions can use an object and field, a configuration attribute, or a summary variable.'
          ],
          next: 'Next: guided selling for large catalogs.'
        }),
        videoLesson({
          title: 'Guided Selling',
          youtubeId: '0VWTEBuluBk',
          source: 'Salesforce',
          summary:
            'Guided selling helps reps sort through a large product catalog. At the start of a quote, reps answer a series of targeted questions, and each answer can shape the questions that follow. After they click Suggest, CPQ returns the products that match. Setup takes three steps: process input fields, matching product fields, and a quote process.',
          points: [
            'Create Process Input fields for the questions to ask.',
            'Create the same fields on the Product object, then fill in their values on the products.',
            'Create a Quote Process that stores the guided selling parameters, and add a process input for each question.',
            'Use process input conditions to make questions dynamic. Otherwise all questions appear at once.'
          ],
          next: 'Try it: list three questions a rep should answer before choosing a product in your catalog.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Build the catalog',
          description:
            '<p>This quiz checks what you took from Bundled quotes for up-selling and cross-selling, How to Use Product Rules and Guided Selling.</p><p>4 questions in 4 formats: ordering, multiple choice, fill in the blank, single choice.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/28juxa933qY/hqdefault.jpg" alt="Bundled quotes for up-selling and cross-selling" />',
          questions: [
            {
              type: 'ORDERING',
              title: 'Put the three steps for creating a bundled product in order.',
              options: [
                { label: 'Configure the product to function as a bundle', correct: true },
                { label: 'Define the product’s features', correct: true },
                { label: 'Set product options', correct: true }
              ]
            },
            {
              type: 'CHECKBOX',
              title: 'The three most popular product rule types are:',
              options: [
                { label: 'Validation', correct: true },
                { label: 'Alert', correct: true },
                { label: 'Selection', correct: true },
                { label: 'Pricing' }
              ]
            },
            {
              type: 'FILL_BLANK',
              title:
                'Unlike validation rules, ___ rules act more like suggestions and let the rep decide how to proceed.',
              options: [
                { label: 'alert', correct: true },
                { label: 'alerts', correct: true }
              ]
            },
            {
              type: 'RADIO',
              title: 'Guided selling matches rep answers against:',
              options: [
                { label: 'Matching fields on the Product object', correct: true },
                { label: 'The rep’s email signature' },
                { label: 'The account’s billing address' },
                { label: 'Approval chains' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Price and renew',
      lessons: [
        videoLesson({
          title: 'How to Manage Subscriptions',
          youtubeId: 't23Nzbq8NKQ',
          source: 'Salesforce',
          summary:
            'CPQ automates subscription work like amendments and renewals. When you add subscription products to a quote, CPQ creates a contract with child subscriptions on the account. That contract creates a renewal opportunity that shows up in your forecast. Setup takes three steps: define subscription products, review the account setup, and automate the renewal forecast.',
          points: [
            'Define subscription products: choose a pricing model, fixed price or percent of total, then the subscription type.',
            'A term in months, combined with the price, lets CPQ work out a prorated price.',
            'On the account, the co-termination setting controls adding new subscriptions to existing contracts.',
            'Renewal pricing: Same keeps prices, List uses the latest price book, Uplift applies a pre-negotiated percentage.',
            'Renewal Quoted is checked 30, 60 or 90 days before the contract expires to create a renewal quote.'
          ],
          next: 'Next: pricing subscriptions over time with MDQ.'
        }),
        videoLesson({
          title: 'Multi-Dimensional Quoting (MDQ)',
          youtubeId: 'Sg1DS_oztNk',
          source: 'Salesforce',
          summary:
            'Multidimensional quoting, or MDQ, shows separate quantities and prices for a subscription product by month, quarter or year. Each block of time is a segment. Reps can change quantity or add a discount per segment, which suits ramped quantities and yearly uplifts. CPQ creates a separate quote line for each segment. Setup takes two steps.',
          points: [
            'A segment is an independent unit of time: month, quarter, year, or custom.',
            'A three-year contract with a yearly dimension creates three segments.',
            'Each segment gets its own quote line, which helps reporting and forecasting.',
            'Step 1: create a price dimension on the product.',
            'Step 2: define the dimension’s name and type. The custom type lets reps set their own segment dates.'
          ],
          next: 'Next: contracted pricing for specific accounts.'
        }),
        videoLesson({
          title: 'How to Set Up Contracted Pricing',
          youtubeId: '0CuMp2Mr5TE',
          source: 'Salesforce',
          summary:
            'Contracted pricing gives specific accounts their own prices. It helps when a customer wants to keep a price negotiated during the first quote, or when an account should inherit special pricing from its parent account. CPQ applies the contracted price on quotes automatically. You can create contracted prices while quoting or directly on the account.',
          points: [
            'Let reps generate a contracted price while quoting by adding the field to the quote line field set.',
            'Or create a contracted price record on the account, as a price or a percentage discount.',
            'Set an effective date, and an expiration date for temporary offers.',
            'The price applies to new, renewal, and amendment quotes until it expires.'
          ],
          next: 'Try it: find one customer with negotiated pricing and note where it should be stored.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Price and renew',
          description:
            '<p>This quiz checks what you took from How to Manage Subscriptions, Multi-Dimensional Quoting (MDQ) and How to Set Up Contracted Pricing.</p><p>4 questions in 4 formats: word bank, fill in the blank, numeric, single choice.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/t23Nzbq8NKQ/hqdefault.jpg" alt="How to Manage Subscriptions" />',
          questions: [
            {
              type: 'WORD_BANK',
              title: 'Complete the three renewal pricing methods.',
              template:
                '___ passes the existing pricing to the renewal, ___ draws from the latest pricing in the price book, and ___ applies a pre-negotiated percentage to each line item.',
              options: [
                { label: 'Same', correct: true },
                { label: 'List', correct: true },
                { label: 'Uplift', correct: true },
                { label: 'Fixed' },
                { label: 'Percent of total' }
              ]
            },
            {
              type: 'FILL_BLANK',
              title: 'In MDQ, a ___ is an independent unit of time such as a quarter, month, or year.',
              options: [{ label: 'segment', correct: true }]
            },
            {
              type: 'NUMERIC',
              title: 'A three-year subscription with a yearly price dimension creates how many segments?',
              options: [{ label: '3', correct: true }]
            },
            {
              type: 'RADIO',
              title: 'Once the deal closes, a contracted price is stored:',
              options: [
                { label: 'On the customer’s account', correct: true },
                { label: 'On the rep’s profile' },
                { label: 'In the product description' },
                { label: 'Nowhere, it is recalculated each time' }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Approve and send',
      lessons: [
        videoLesson({
          title: 'How Advanced Approvals Can Speed Up Your Business',
          youtubeId: 'EWfsYPIOdJk',
          source: 'Salesforce',
          summary:
            'Advanced Approvals create independent approval chains that shorten the approval cycle. In the demo, a 40% discount needs three levels of management to sign off. Changing payment terms starts a separate legal review in a parallel chain, so it does not wait for the discount approval. Setup takes four steps: approvers, approval chains, approval rules and approval conditions.',
          points: [
            'A 40% discount can need sign-off from three levels of management.',
            'A payment-terms change can start a separate, parallel approval chain.',
            'Approvers can be single users or groups, with temporary delegates for vacations.',
            'Approval chains can send approvals in sequence or in parallel paths.',
            'Approval conditions test a field or a variable and use an index value for logic.'
          ],
          next: 'Next: generating quote documents.'
        }),
        videoLesson({
          title: 'DocuSign Quote Generation for CPQ Plus',
          youtubeId: 'Linajr1zaWY',
          source: 'Salesforce',
          summary:
            'DocuSign Quote Generation creates custom, complex quote documents with Salesforce CPQ Plus. Quotes that are easy to read avoid confusion with customers and shorten the quote-to-cash process. Changing a product can add required content to the quote automatically. Setup takes three steps: convert or create templates, use advanced options, and add the quote button.',
          points: [
            'Convert existing CPQ templates with DocuSign’s conversion tool, or upload a template and select data fields.',
            'Use advanced options such as conditional logic so one template covers many variations.',
            'Add the quote button to any Salesforce object, such as the quote object.',
            'The goal is to reduce both time and errors in the quote-to-cash lifecycle.'
          ],
          next: 'Try it: list the quote templates you maintain today and mark which could be merged with conditional logic.'
        })
      ],
      exercises: [
        {
          title: 'Quiz: Approve and send',
          description:
            '<p>This quiz checks what you took from How Advanced Approvals Can Speed Up Your Business and DocuSign Quote Generation for CPQ Plus.</p><p>4 questions in 4 formats: true or false, ordering, numeric, short answer.</p><h2>Before you start</h2><ul><li>Every answer comes from the lessons in this section, so reopen one if you are unsure.</li><li>The AI tutor can point you back to the right part of a lesson. It will not give you the answer.</li><li>You can retake it as many times as you like.</li></ul><img src="https://i.ytimg.com/vi/EWfsYPIOdJk/hqdefault.jpg" alt="How Advanced Approvals Can Speed Up Your Business" />',
          questions: [
            {
              type: 'TRUE_FALSE',
              title: 'With Advanced Approvals, a payment-terms review must wait for the discount approval to finish.',
              options: [{ label: 'True' }, { label: 'False', correct: true }]
            },
            {
              type: 'ORDERING',
              title: 'Put the four steps for setting up Advanced Approvals in order.',
              options: [
                { label: 'Create an approver', correct: true },
                { label: 'Create an approval chain', correct: true },
                { label: 'Create approval rules', correct: true },
                { label: 'Define the approval conditions', correct: true }
              ]
            },
            {
              type: 'NUMERIC',
              title: 'In the demo, how many levels of management must sign off on the 40% discount?',
              options: [{ label: '3', correct: true }]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'In the DocuSign demo, which Salesforce object is the quote button added to?',
              options: [
                { label: 'quote', correct: true },
                { label: 'quote object', correct: true },
                { label: 'Quote', correct: true }
              ]
            }
          ]
        }
      ]
    },
    {
      title: 'Final exam',
      lessons: [],
      exercises: [
        {
          title: 'Final exam',
          description:
            '<p>The final exam covers the whole course: Build the catalog, Price and renew, Approve and send.</p><p>10 questions in 9 formats: single choice, ordering, word bank, fill in the blank, short answer, numeric, multiple choice, true or false, written reflection.</p><h2>Before you start the exam</h2><ul><li>You need 70% on the scored questions to earn your certificate.</li><li>The reflection and feedback questions are not scored; your instructor reads them.</li><li>Take it when you have finished every section. You can retake it.</li></ul><img src="https://i.ytimg.com/vi/28juxa933qY/maxresdefault.jpg" alt="Salesforce CPQ Admin Essentials" />',
          final: true,
          questions: [
            {
              type: 'RADIO',
              title: 'Products sold beneath a parent bundle product are called:',
              options: [
                { label: 'Product options', correct: true },
                { label: 'Price books' },
                { label: 'Features' },
                { label: 'Opportunities' }
              ]
            },
            {
              type: 'ORDERING',
              title: 'Put the three steps for setting up Guided Selling in order.',
              options: [
                { label: 'Create the Process Input fields', correct: true },
                { label: 'Create matching fields on the Product object', correct: true },
                { label: 'Create a Quote Process for Guided Selling', correct: true }
              ]
            },
            {
              type: 'WORD_BANK',
              title: 'Complete the Conditions Met choices for a product rule.',
              template:
                '___ ensures every condition is met, ___ fires the rule if any condition is met, and ___ allows advanced logic.',
              options: [
                { label: 'All', correct: true },
                { label: 'Any', correct: true },
                { label: 'Custom', correct: true },
                { label: 'None' },
                { label: 'Either' }
              ]
            },
            {
              type: 'FILL_BLANK',
              title: 'Features are a way to organize product ___ within a bundle.',
              options: [
                { label: 'options', correct: true },
                { label: 'option', correct: true }
              ]
            },
            {
              type: 'SHORT_ANSWER',
              title: 'Which product rule type lets you show or hide products during configuration?',
              options: [
                { label: 'selection', correct: true },
                { label: 'selection rule', correct: true }
              ]
            },
            {
              type: 'NUMERIC',
              title:
                'In the contracted pricing demo, the list unit price is $80. What is the net unit price in dollars?',
              options: [{ label: '72', correct: true }]
            },
            {
              type: 'CHECKBOX',
              title:
                'How many days before a contract expires is renewal quoted typically checked? Choose all that apply.',
              options: [
                { label: '30', correct: true },
                { label: '60', correct: true },
                { label: '90', correct: true },
                { label: '120' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title:
                'Contracted prices inherit the prices of their parent accounts unless a related account has different contracted prices.',
              options: [{ label: 'True', correct: true }, { label: 'False' }]
            },
            {
              type: 'RADIO',
              title:
                'When you select data fields in the DocuSign template builder for conditional logic, what is added to the template automatically?',
              options: [
                { label: 'Anchor text', correct: true },
                { label: 'A new price book' },
                { label: 'An approval chain' },
                { label: 'A product rule' }
              ]
            },
            {
              type: 'TEXTAREA',
              title:
                'Pick one deal your team quotes often. Which CPQ features from this course would you set up first, bundles, product rules, guided selling, MDQ, contracted pricing, or advanced approvals, and why?'
            }
          ]
        }
      ]
    }
  ]
};

export const launchTemplateFixtures: LaunchTemplateFixture[] = [
  aiFluency,
  salesforceCpq,
  hubspotSalesHub,
  chatgptWork,
  publicMiniCourse,
  customerOnboarding,
  productTraining
];
