import { communityAnswer, communityQuestion, communityQuestionSubscription, db, eq, inArray } from '@db/drizzle';

import { daysFromNow, demoCourseId, slugify } from './demoCatalogTypes';
import { demoOrgId, selectDemoCatalog } from './demoCourses';
import { buildPeopleDirectory, type DemoAccounts } from './demoPeople';

type DemoAnswer = { author: string; body: string; hoursLater: number; votes: number; accepted?: boolean };

type DemoCommunityQuestion = {
  courseKey: string;
  author: string;
  title: string;
  body: string;
  daysAgo: number;
  votes: number;
  answers: DemoAnswer[];
};

const QUESTIONS: DemoCommunityQuestion[] = [
  {
    courseKey: 'react',
    author: 'student',
    title: 'Why does my useEffect run twice in development?',
    body: '<p>My data hook fetches the orders list twice every time the page loads, but only on my machine. In production it runs once. Is this a bug in my dependency array?</p>',
    daysAgo: 3,
    votes: 14,
    answers: [
      {
        author: 'admin',
        body: '<p>This is React Strict Mode. In development it mounts, unmounts and remounts every component to check that your effects clean up properly. It does not happen in production builds. If your cleanup function cancels the request, the double run is harmless.</p>',
        hoursLater: 2,
        votes: 11,
        accepted: true
      },
      {
        author: 'lucas.oliveira',
        body: '<p>Had the same surprise last month. Adding an AbortController in the cleanup made the network tab show the first request as cancelled, which made it obvious what was happening.</p>',
        hoursLater: 5,
        votes: 4
      },
      {
        author: 'amara.okafor',
        body: '<p>Thanks for asking this. I almost removed Strict Mode to "fix" it.</p>',
        hoursLater: 30,
        votes: 1
      }
    ]
  },
  {
    courseKey: 'react',
    author: 'samuel.adeyemi',
    title: 'Should I keep form state in a single object or separate useState calls?',
    body: '<p>My signup form has eight fields. One <code>useState</code> per field feels repetitive, but one big object means spreading on every change. Which do you prefer?</p>',
    daysAgo: 9,
    votes: 6,
    answers: [
      {
        author: 'diego.herrera',
        body: '<p>For more than three or four related fields I use <code>useReducer</code>. One action like <code>{ type: "field", name, value }</code> keeps the change handler generic.</p>',
        hoursLater: 4,
        votes: 7,
        accepted: true
      },
      {
        author: 'admin',
        body: '<p>Both work. Group state that changes together. If validation runs across fields, a single object or reducer is easier to reason about.</p>',
        hoursLater: 20,
        votes: 5
      }
    ]
  },
  {
    courseKey: 'react',
    author: 'leila.rahimi',
    title: 'Margin collapsing broke my card layout',
    body: '<p>Two cards in a column have <code>margin: 24px</code> each but the gap between them is 24px, not 48px. Is this expected?</p>',
    daysAgo: 1,
    votes: 3,
    answers: [
      {
        author: 'mei.lin',
        body: '<p>Yes, vertical margins between siblings collapse to the larger value. The lesson on styling covers it around minute four. Using <code>gap</code> on a flex column avoids the issue entirely.</p>',
        hoursLater: 3,
        votes: 4
      }
    ]
  },
  {
    courseKey: 'pandas',
    author: 'mateo.garcia',
    title: 'groupby drops rows where the key is NaN',
    body: '<p>I group sales by <code>region</code> and the totals do not add up to the overall sum. Some rows have no region. Where did they go?</p>',
    daysAgo: 6,
    votes: 9,
    answers: [
      {
        author: 'nkechi.eze',
        body: '<p>By default <code>groupby</code> excludes NaN keys. Pass <code>dropna=False</code> to keep them as their own group, or fill them first with <code>fillna("Unknown")</code> so they show up clearly in reports.</p>',
        hoursLater: 1,
        votes: 12,
        accepted: true
      },
      {
        author: 'jaewon.park',
        body: '<p>Worth adding an assertion after grouping: <code>assert grouped.sum() == df["amount"].sum()</code>. It has caught this for me more than once.</p>',
        hoursLater: 9,
        votes: 6
      }
    ]
  },
  {
    courseKey: 'pandas',
    author: 'student',
    title: 'Is apply always slower than vectorised code?',
    body: '<p>After the "Making pandas fast" lesson I rewrote everything without <code>apply</code>. Are there cases where apply is fine?</p>',
    daysAgo: 15,
    votes: 7,
    answers: [
      {
        author: 'nkechi.eze',
        body: '<p>apply is fine on small frames or when the logic genuinely cannot be expressed as column operations, such as calling an external parser per row. Measure with <code>%timeit</code> before rewriting; readability matters too.</p>',
        hoursLater: 6,
        votes: 8,
        accepted: true
      },
      {
        author: 'wei.zhang',
        body: '<p>Also check <code>np.where</code> and <code>np.select</code> for conditional logic. They replace most of the apply calls I used to write.</p>',
        hoursLater: 26,
        votes: 5
      },
      {
        author: 'priya.raman',
        body: '<p>Saving this thread. np.select just replaced a 40 line function in my notebook.</p>',
        hoursLater: 50,
        votes: 2
      }
    ]
  },
  {
    courseKey: 'pandas',
    author: 'zanele.dlamini',
    title: 'Best way to read a 3 GB CSV on a laptop?',
    body: '<p>My laptop runs out of memory when I load our transactions export. Any tips beyond buying more RAM?</p>',
    daysAgo: 20,
    votes: 11,
    answers: [
      {
        author: 'mei.lin',
        body: '<p>Load only the columns you need with <code>usecols</code>, set <code>dtype</code> explicitly and read in chunks with <code>chunksize</code> if you are aggregating. Converting the file to Parquet once also helps a lot.</p>',
        hoursLater: 2,
        votes: 9,
        accepted: true
      },
      {
        author: 'arjun.mehta',
        body: '<p>Category dtype for repeated strings cut our memory by about 70%.</p>',
        hoursLater: 7,
        votes: 4
      }
    ]
  },
  {
    courseKey: 'python-engineering',
    author: 'kenji.watanabe',
    title: 'When is a custom exception worth creating?',
    body: '<p>Our codebase raises <code>ValueError</code> everywhere. The lesson suggests specific exceptions, but I do not want a class for every error.</p>',
    daysAgo: 4,
    votes: 8,
    answers: [
      {
        author: 'admin',
        body: '<p>Create one when a caller needs to handle that case differently. If nobody catches it specifically, a built-in exception with a good message is enough. A small hierarchy per module, with one base class, works well.</p>',
        hoursLater: 3,
        votes: 10,
        accepted: true
      },
      {
        author: 'olga.petrova',
        body: '<p>We added a base <code>BillingError</code> and three subclasses. Monitoring now groups errors by class, which made our dashboards much more useful.</p>',
        hoursLater: 11,
        votes: 3
      }
    ]
  },
  {
    courseKey: 'python-engineering',
    author: 'student',
    title: 'How do I decorate a function that takes arguments?',
    body: '<p>I followed the timing decorator from the lesson, but I want <code>@timed(threshold=0.5)</code> to only print slow calls. Where does the extra argument go?</p>',
    daysAgo: 2,
    votes: 5,
    answers: [
      {
        author: 'arjun.mehta',
        body: '<p>You need one more level: a function that takes the arguments and returns the actual decorator.</p><pre><code>def timed(threshold=0.0):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            ...\n        return wrapper\n    return decorator</code></pre>',
        hoursLater: 1,
        votes: 6,
        accepted: true
      },
      {
        author: 'admin',
        body: '<p>Exactly right. Note that you then always need the parentheses: <code>@timed()</code>, not <code>@timed</code>.</p>',
        hoursLater: 4,
        votes: 3
      }
    ]
  },
  {
    courseKey: 'python-engineering',
    author: 'fatima.alsayed',
    title: 'asyncio.gather or TaskGroup?',
    body: '<p>Python 3.11 added <code>TaskGroup</code>. Should I switch from <code>gather</code>?</p>',
    daysAgo: 12,
    votes: 4,
    answers: [
      {
        author: 'kenji.watanabe',
        body: '<p>TaskGroup cancels the remaining tasks when one fails, which gather does not do by default. For new code I use TaskGroup; for simple fan-out gather is still fine.</p>',
        hoursLater: 8,
        votes: 5
      }
    ]
  },
  {
    courseKey: 'pytest',
    author: 'yusuf.demir',
    title: 'Fixtures in conftest.py are not found',
    body: '<p>I moved my fixtures into <code>conftest.py</code> in the project root, but tests in <code>tests/api/</code> cannot see them.</p>',
    daysAgo: 5,
    votes: 6,
    answers: [
      {
        author: 'olga.petrova',
        body: '<p>conftest files apply to their directory and below. If your root is outside the test path pytest uses, put it in <code>tests/conftest.py</code> or set <code>rootdir</code> and <code>testpaths</code> in <code>pyproject.toml</code>.</p>',
        hoursLater: 2,
        votes: 7,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'pytest',
    author: 'diego.herrera',
    title: 'Hypothesis found a bug I cannot reproduce',
    body: '<p>Hypothesis reported a failing example, but when I rerun the test it passes.</p>',
    daysAgo: 18,
    votes: 3,
    answers: [
      {
        author: 'admin',
        body: '<p>Hypothesis stores failing examples in <code>.hypothesis/</code> and replays them first. If it now passes, the failure may depend on time or ordering. Copy the printed example into an <code>@example(...)</code> decorator so it runs every time.</p>',
        hoursLater: 5,
        votes: 4,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'docker',
    author: 'olga.petrova',
    title: 'Image rebuilds pip install on every code change',
    body: '<p>Every small change triggers a full dependency install. My Dockerfile copies the whole project and then runs pip.</p>',
    daysAgo: 7,
    votes: 10,
    answers: [
      {
        author: 'fatima.alsayed',
        body: '<p>Copy <code>requirements.txt</code> first, install, then copy the rest. That keeps the install layer cached until requirements change.</p>',
        hoursLater: 1,
        votes: 9,
        accepted: true
      },
      {
        author: 'daniel.mensah',
        body: '<p>Also add a <code>.dockerignore</code>. Our <code>.git</code> folder alone was invalidating the cache.</p>',
        hoursLater: 6,
        votes: 5
      }
    ]
  },
  {
    courseKey: 'machine-learning',
    author: 'student',
    title: 'Accuracy is 92% but the model is useless. What am I missing?',
    body: '<p>My fraud classifier reports 92% accuracy, but it never flags any fraud. The dataset is 92% legitimate transactions.</p>',
    daysAgo: 1,
    votes: 12,
    answers: [
      {
        author: 'nkechi.eze',
        body: '<p>Your model learned to predict the majority class. Accuracy hides that on imbalanced data. Look at recall for the fraud class and the confusion matrix, and try <code>class_weight="balanced"</code> as a first fix.</p>',
        hoursLater: 2,
        votes: 13,
        accepted: true
      },
      {
        author: 'wei.zhang',
        body: '<p>Precision-recall curves are more informative than ROC here. Also check that your train/test split is stratified.</p>',
        hoursLater: 4,
        votes: 6
      },
      {
        author: 'jaewon.park',
        body: '<p>This is exactly the baseline trap from lesson one. Predicting "legit" always gives you 92% for free.</p>',
        hoursLater: 7,
        votes: 4
      }
    ]
  },
  {
    courseKey: 'machine-learning',
    author: 'priya.raman',
    title: 'How many labelled examples do I need for Naive Bayes?',
    body: '<p>We have about 600 labelled support tickets across 5 categories. Is that enough to start?</p>',
    daysAgo: 8,
    votes: 5,
    answers: [
      {
        author: 'wei.zhang',
        body: '<p>Enough to start and learn. Naive Bayes does well with a few hundred examples. Plot a learning curve: if the score is still rising at 600, more labels will help.</p>',
        hoursLater: 5,
        votes: 6,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'machine-learning',
    author: 'emily.carter',
    title: 'When will the bonus lesson on serving models open?',
    body: '<p>The bonus lesson shows as locked. Is there something I need to finish first?</p>',
    daysAgo: 2,
    votes: 2,
    answers: [
      {
        author: 'nkechi.eze',
        body: '<p>I unlock it after the live model review so everyone has a trained model to deploy. Expect it later this week.</p>',
        hoursLater: 3,
        votes: 3,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'ux-design',
    author: 'hannah.becker',
    title: 'How many users do I need for a usability test?',
    body: '<p>My manager wants statistically significant results before we change the onboarding flow.</p>',
    daysAgo: 10,
    votes: 9,
    answers: [
      {
        author: 'camille.laurent',
        body: '<p>For finding problems, five users per round usually surface the majority of issues. Significance matters for comparing two designs quantitatively, which is a different study. Run small qualitative rounds first, then A/B test the fix.</p>',
        hoursLater: 4,
        votes: 10,
        accepted: true
      },
      {
        author: 'sofia.rossi',
        body: '<p>Showing a video clip of a user getting stuck convinced our leadership more than any number did.</p>',
        hoursLater: 12,
        votes: 6
      }
    ]
  },
  {
    courseKey: 'ux-design',
    author: 'student',
    title: 'Is 16px body text really the minimum on mobile?',
    body: '<p>Our designer uses 14px for dense tables in the app. Is that an accessibility problem?</p>',
    daysAgo: 4,
    votes: 4,
    answers: [
      {
        author: 'leila.rahimi',
        body: '<p>For dense data 14px can be fine, but make sure it scales with the system text size setting. Fixed sizes that ignore Dynamic Type are the bigger issue.</p>',
        hoursLater: 6,
        votes: 5
      },
      {
        author: 'camille.laurent',
        body: '<p>Agree with Leila. Test with the largest accessibility text size; if the table breaks, offer a card layout at large sizes.</p>',
        hoursLater: 20,
        votes: 4
      }
    ]
  },
  {
    courseKey: 'ux-design',
    author: 'aisha.bello',
    title: 'Writing better empty states',
    body: '<p>Any examples of empty states that actually help users take the next step?</p>',
    daysAgo: 16,
    votes: 7,
    answers: [
      {
        author: 'chloe.dubois',
        body: '<p>Our best one says what the screen will show, why it is empty and has one button to create the first item. Three short lines, no illustration needed.</p>',
        hoursLater: 3,
        votes: 6,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'product-management',
    author: 'kwame.asante',
    title: 'How do you stop interviewees from pitching feature ideas?',
    body: '<p>Every customer interview turns into a list of features they want. How do I get back to the problem?</p>',
    daysAgo: 1,
    votes: 8,
    answers: [
      {
        author: 'tom.hargreaves',
        body: '<p>Write the idea down, then ask "what would that let you do?" and "when did you last need that?". The feature request is a clue to the problem; follow it back to a real past event.</p>',
        hoursLater: 2,
        votes: 9,
        accepted: true
      },
      {
        author: 'priya.raman',
        body: '<p>I ask them to share their screen and show me how they do the task today. It shifts the conversation to behaviour immediately.</p>',
        hoursLater: 5,
        votes: 5
      }
    ]
  },
  {
    courseKey: 'product-management',
    author: 'student',
    title: 'Can a problem statement include a metric?',
    body: '<p>For the assignment, should the success metric be inside the problem statement or separate?</p>',
    daysAgo: 0,
    votes: 2,
    answers: [
      {
        author: 'aisha.bello',
        body: '<p>Tom mentioned in the session that the pain should be measurable, but the target metric goes in its own field. I quantified the cost in the statement itself.</p>',
        hoursLater: 1,
        votes: 2
      },
      {
        author: 'tom.hargreaves',
        body: '<p>Aisha is right. Quantify the pain in the statement, and put the metric that shows it is solved in the separate question.</p>',
        hoursLater: 3,
        votes: 4,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'leading-teams',
    author: 'tomas.rivera',
    title: 'Weekly or fortnightly one-to-ones?',
    body: '<p>I have seven direct reports. Weekly one-to-ones take most of a day. Is fortnightly enough?</p>',
    daysAgo: 3,
    votes: 6,
    answers: [
      {
        author: 'tom.hargreaves',
        body: '<p>Weekly 30 minutes beats fortnightly 60 for most people, because problems surface sooner. With seven reports, consider weekly for newer team members and fortnightly for experienced ones who prefer it, and ask each person.</p>',
        hoursLater: 4,
        votes: 8,
        accepted: true
      },
      {
        author: 'emily.carter',
        body: '<p>I moved to weekly 25-minute slots and my calendar actually got lighter, because fewer things escalated.</p>',
        hoursLater: 10,
        votes: 4
      }
    ]
  },
  {
    courseKey: 'leading-teams',
    author: 'olga.petrova',
    title: 'Giving feedback to a more senior engineer',
    body: '<p>I lead a team where one engineer has ten more years of experience than me. How do I give corrective feedback without it feeling awkward?</p>',
    daysAgo: 11,
    votes: 10,
    answers: [
      {
        author: 'tomas.rivera',
        body: '<p>Focus on impact rather than skill. "When the design review was skipped, two teams had to redo work" is about an outcome, not about who knows more.</p>',
        hoursLater: 3,
        votes: 7,
        accepted: true
      },
      {
        author: 'kenji.watanabe',
        body: '<p>Ask for their feedback on you first. It sets up a two-way relationship.</p>',
        hoursLater: 8,
        votes: 5
      }
    ]
  },
  {
    courseKey: 'digital-marketing',
    author: 'rafael.costa',
    title: 'Open rates dropped after Apple Mail Privacy Protection',
    body: '<p>Our open rate jumped to 60% and then became meaningless. What should we track instead?</p>',
    daysAgo: 13,
    votes: 7,
    answers: [
      {
        author: 'ingrid.larsen',
        body: '<p>Track clicks and downstream conversions. We report click-to-delivered rate and revenue per send, and we only use opens for spotting deliverability problems.</p>',
        hoursLater: 2,
        votes: 8,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'digital-marketing',
    author: 'chloe.dubois',
    title: 'Positioning statement feels generic',
    body: '<p>Mine reads "for small teams who want to save time". Every competitor could say that. How do I make it sharper?</p>',
    daysAgo: 5,
    votes: 5,
    answers: [
      {
        author: 'camille.laurent',
        body: '<p>Name the alternative they use today and the specific moment it fails them. "For agencies who chase client approvals over email" is already more specific than "small teams".</p>',
        hoursLater: 6,
        votes: 6,
        accepted: true
      },
      {
        author: 'kwame.asante',
        body: '<p>Interview your three happiest customers and use their words, not yours.</p>',
        hoursLater: 14,
        votes: 3
      }
    ]
  },
  {
    courseKey: 'security-awareness',
    author: 'student',
    title: 'Is an SMS code still acceptable as a second factor?',
    body: '<p>Some of our vendor tools only offer SMS. Should I turn MFA on anyway?</p>',
    daysAgo: 6,
    votes: 6,
    answers: [
      {
        author: 'daniel.mensah',
        body: '<p>Yes, turn it on. SMS is weaker than an authenticator app or passkey because of SIM swapping, but it is far better than a password alone. Let the security team know which vendors lack better options.</p>',
        hoursLater: 2,
        votes: 7,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'security-awareness',
    author: 'nadia.haddad',
    title: 'I reported an email that turned out to be legitimate',
    body: '<p>Felt a bit embarrassed. Is it a problem to report false alarms?</p>',
    daysAgo: 9,
    votes: 9,
    answers: [
      {
        author: 'admin',
        body: '<p>Not at all. A false alarm costs a few minutes; a missed phishing email can cost weeks. Please keep reporting.</p>',
        hoursLater: 1,
        votes: 10,
        accepted: true
      },
      {
        author: 'olga.petrova',
        body: '<p>Our security team actually tracks reports as a positive metric. More reports means people are paying attention.</p>',
        hoursLater: 5,
        votes: 4
      }
    ]
  },
  {
    courseKey: 'gdpr',
    author: 'marcus.johnson',
    title: 'Can I keep customer emails in a personal spreadsheet for follow-ups?',
    body: '<p>I track renewal follow-ups in a spreadsheet on my laptop. Is that allowed?</p>',
    daysAgo: 14,
    votes: 4,
    answers: [
      {
        author: 'nadia.haddad',
        body: '<p>Keep personal data in approved systems such as the CRM, which have access controls and retention rules. A local spreadsheet is hard to secure and easy to forget when someone asks for deletion.</p>',
        hoursLater: 3,
        votes: 6,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'code-of-conduct',
    author: 'diego.herrera',
    title: 'Does the gift limit include conference tickets from vendors?',
    body: '<p>A cloud vendor offered free tickets to their annual conference. Does that count as a gift?</p>',
    daysAgo: 22,
    votes: 3,
    answers: [
      {
        author: 'admin',
        body: '<p>Yes, tickets count toward the gift limit, including the value of travel or hotels if offered. Declare it to your manager; educational events are often approved when we are not in a procurement process with that vendor.</p>',
        hoursLater: 4,
        votes: 4,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'mvc',
    author: 'samuel.adeyemi',
    title: 'Where should input validation live in MVC?',
    body: '<p>Controller, model or both? I keep duplicating checks.</p>',
    daysAgo: 17,
    votes: 5,
    answers: [
      {
        author: 'admin',
        body: '<p>Validate shape and types at the boundary (controller or a request schema), and business rules in the model. The controller asks "is this a valid request?", the model asks "is this allowed?".</p>',
        hoursLater: 5,
        votes: 7,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'productivity',
    author: 'zanele.dlamini',
    title: 'How do you protect focus blocks from meeting invites?',
    body: '<p>People book over my focus time because it shows as free.</p>',
    daysAgo: 19,
    votes: 6,
    answers: [
      {
        author: 'emily.carter',
        body: '<p>Book them as real events marked busy with a clear name like "Focus: quarterly report". Most calendar tools also let you decline automatically during that block.</p>',
        hoursLater: 3,
        votes: 5,
        accepted: true
      },
      {
        author: 'tom.hargreaves',
        body: '<p>Agree on team-wide focus hours. It works far better when everyone protects the same window.</p>',
        hoursLater: 9,
        votes: 4
      }
    ]
  },
  {
    courseKey: 'incident-response',
    author: 'enterpriseStudent',
    title: 'Who should be incident commander when the on-call engineer is junior?',
    body: '<p>Our rota puts new engineers on call alone. Should they also run the incident?</p>',
    daysAgo: 4,
    votes: 4,
    answers: [
      {
        author: 'grace.hopper',
        body: '<p>We separate the roles: the on-call engineer investigates and a rotating senior person takes incident command for SEV1 and SEV2. It is great training to shadow the commander a few times first.</p>',
        hoursLater: 2,
        votes: 5,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'secure-coding',
    author: 'linus.torvalds',
    title: 'Is an ORM enough to prevent SQL injection?',
    body: '<p>We use an ORM everywhere. Can we stop worrying about injection?</p>',
    daysAgo: 6,
    votes: 5,
    answers: [
      {
        author: 'enterpriseAdmin',
        body: '<p>Mostly, as long as you avoid raw query helpers with string formatting. Search the codebase for raw SQL and dynamic ORDER BY clauses; those are where injection still appears.</p>',
        hoursLater: 4,
        votes: 6,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'brand-design',
    author: 'earlyAdopterStudent',
    title: 'How many colours should a small brand have?',
    body: '<p>My palette has nine colours and it feels messy.</p>',
    daysAgo: 3,
    votes: 3,
    answers: [
      {
        author: 'sofia.rossi',
        body: '<p>One primary, one accent and a neutral scale covers almost everything. Add status colours only for product interfaces.</p>',
        hoursLater: 5,
        votes: 4,
        accepted: true
      }
    ]
  },
  {
    courseKey: 'product-fundamentals',
    author: 'kwame.asante',
    title: 'RICE scores feel made up. How do you estimate impact?',
    body: '<p>Our impact scores are basically opinions. Any tips?</p>',
    daysAgo: 8,
    votes: 4,
    answers: [
      {
        author: 'earlyAdopterAdmin',
        body: '<p>Use a fixed scale (3 massive, 2 high, 1 medium, 0.5 low) and write one sentence of evidence for each score. The evidence matters more than the number.</p>',
        hoursLater: 6,
        votes: 5,
        accepted: true
      }
    ]
  }
];

const HOUR_MS = 60 * 60 * 1000;

export function demoCommunitySlug(title: string) {
  const position = QUESTIONS.findIndex((demoQuestion) => demoQuestion.title === title);
  if (position === -1) throw new Error(`Unknown demo community question ${title}`);

  return `${slugify(title)}-${position + 1}`;
}

export async function seedDemoCommunity({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  const now = new Date();
  const catalog = selectDemoCatalog(accounts, selectedOrganizationId);
  const courseByKey = new Map(catalog.map((demoCourse) => [demoCourse.key, demoCourse]));
  const personId = buildPeopleDirectory(accounts);
  const selected = QUESTIONS.filter((demoQuestion) => courseByKey.has(demoQuestion.courseKey));
  const slugFor = (demoQuestion: DemoCommunityQuestion) => demoCommunitySlug(demoQuestion.title);

  const existing = selected.length
    ? await db
        .select({ slug: communityQuestion.slug })
        .from(communityQuestion)
        .where(inArray(communityQuestion.slug, selected.map(slugFor)))
    : [];
  const existingSlugs = new Set(existing.map((row) => row.slug));
  let questionCount = 0;
  let answerCount = 0;
  let subscriptionCount = 0;

  for (const demoQuestion of selected) {
    if (existingSlugs.has(slugFor(demoQuestion))) continue;

    const demoCourse = courseByKey.get(demoQuestion.courseKey)!;
    const askedAt = new Date(now.getTime() - demoQuestion.daysAgo * 24 * HOUR_MS - 3 * HOUR_MS);
    const authorProfileId = personId(demoQuestion.author);
    const [createdQuestion] = await db
      .insert(communityQuestion)
      .values({
        title: demoQuestion.title,
        body: demoQuestion.body,
        votes: demoQuestion.votes,
        organizationId: demoOrgId(accounts, demoCourse.org),
        courseId: demoCourseId(demoCourse),
        slug: slugFor(demoQuestion),
        authorProfileId,
        createdAt: askedAt.toISOString()
      })
      .returning({ id: communityQuestion.id });
    questionCount += 1;

    const answerTimes = demoQuestion.answers.map(
      (answer) => new Date(Math.min(askedAt.getTime() + answer.hoursLater * HOUR_MS, now.getTime() - 10 * 60 * 1000))
    );
    const createdAnswers = demoQuestion.answers.length
      ? await db
          .insert(communityAnswer)
          .values(
            demoQuestion.answers.map((answer, index) => ({
              questionId: createdQuestion.id,
              body: answer.body,
              votes: answer.votes,
              authorProfileId: personId(answer.author),
              createdAt: answerTimes[index].toISOString()
            }))
          )
          .returning({ id: communityAnswer.id })
      : [];
    answerCount += createdAnswers.length;

    const acceptedIndex = demoQuestion.answers.findIndex((answer) => answer.accepted);
    if (acceptedIndex !== -1) {
      await db
        .update(communityQuestion)
        .set({ acceptedAnswerId: createdAnswers[acceptedIndex].id })
        .where(eq(communityQuestion.id, createdQuestion.id));
    }

    const isStudentQuestion = ['student', 'enterpriseStudent', 'earlyAdopterStudent'].includes(demoQuestion.author);
    if (isStudentQuestion) {
      const firstAnswerAt = answerTimes[0] ?? askedAt;
      await db.insert(communityQuestionSubscription).values({
        questionId: createdQuestion.id,
        profileId: authorProfileId,
        isFollowing: true,
        lastReadAt: new Date(firstAnswerAt.getTime() - HOUR_MS).toISOString(),
        createdAt: askedAt.toISOString()
      });
      subscriptionCount += 1;
    }
  }

  console.log(
    `   ✓ Demo community: ${questionCount} question(s), ${answerCount} answer(s), ${subscriptionCount} subscription(s)`
  );
}
