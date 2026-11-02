import { courseNewsfeed, courseNewsfeedComment, db, groupmember, inArray } from '@db/drizzle';
import type { TNewCourseNewsfeed } from '@db/types';

import { demoCourseId, demoGroupId, demoId, type DemoCourse } from './demoCatalogTypes';
import { selectDemoCatalog } from './demoCourses';
import { buildPeopleDirectory, type DemoAccounts } from './demoPeople';

type DemoComment = { author: string; text: string; replies?: DemoComment[] };

type DemoPost = {
  courseKey: string;
  author: string;
  content: string;
  hoursAgo: number;
  pinned?: boolean;
  reactions?: { clap?: number; smile?: number; thumbsup?: number };
  comments?: DemoComment[];
};

const POSTS: DemoPost[] = [
  {
    courseKey: 'react',
    author: 'admin',
    content:
      '<p>Welcome to the new <strong>Shipping React Apps</strong> section. It covers data fetching with live updates and styling components that hold up in any layout. The data-hook project is due on Friday.</p>',
    hoursAgo: 52,
    pinned: true,
    reactions: { clap: 6, thumbsup: 4 },
    comments: [
      {
        author: 'amara.okafor',
        text: 'Can we use TanStack Query for the project, or should it be plain useEffect?',
        replies: [
          {
            author: 'admin',
            text: 'Plain useEffect for this one, so you see what the libraries do for you. Mention in your answer what you would switch to in production.',
            replies: [{ author: 'amara.okafor', text: 'Makes sense, thanks!' }]
          }
        ]
      },
      {
        author: 'student',
        text: 'Is there a public WebSocket endpoint we can test against?',
        replies: [
          {
            author: 'lucas.oliveira',
            text: 'I used a local ws server with ten lines of Node. Happy to share the snippet.'
          },
          {
            author: 'admin',
            text: 'Lucas has the right idea. A local server is easiest; I added one to the lesson notes.'
          }
        ]
      }
    ]
  },
  {
    courseKey: 'react',
    author: 'admin',
    content:
      '<p>Office hours this Thursday at 17:00 UTC. Bring the bug you have been stuck on longest. We will debug two or three live.</p>',
    hoursAgo: 120,
    reactions: { thumbsup: 7, smile: 2 },
    comments: [
      { author: 'samuel.adeyemi', text: 'Will it be recorded? I am on a flight then.' },
      { author: 'diego.herrera', text: 'Bringing my infinite re-render, see you there.' }
    ]
  },
  {
    courseKey: 'pandas',
    author: 'nkechi.eze',
    content:
      '<p>Congratulations to everyone who finished the course this month. Your certificates are ready in the app. The next cohort starts in two weeks; tell a friend.</p>',
    hoursAgo: 70,
    reactions: { clap: 9, smile: 3 },
    comments: [
      {
        author: 'student',
        text: 'Thank you! The groupby lesson alone saved me hours at work.',
        replies: [{ author: 'nkechi.eze', text: 'Love to hear that. Keep an eye out for the advanced course.' }]
      },
      { author: 'mateo.garcia', text: 'Is there an advanced follow-up course planned?' }
    ]
  },
  {
    courseKey: 'pandas',
    author: 'nkechi.eze',
    content:
      '<p>I uploaded the pandas cheat sheet to the "Indexing and Grouping" lesson. Print it, it is worth it.</p>',
    hoursAgo: 200,
    reactions: { thumbsup: 8 }
  },
  {
    courseKey: 'python-engineering',
    author: 'admin',
    content:
      '<p>Reflections are graded. Most of you described real refactors with clear before and after states, which is exactly the point. Common feedback: say how you verified nothing broke.</p>',
    hoursAgo: 30,
    reactions: { clap: 5, thumbsup: 3 },
    comments: [
      {
        author: 'kenji.watanabe',
        text: 'Would snapshot tests count as verification?',
        replies: [
          {
            author: 'admin',
            text: 'Yes, as long as the snapshots were taken before the change. Mention it explicitly.',
            replies: [{ author: 'arjun.mehta', text: 'Good to know, I left that out of mine.' }]
          }
        ]
      }
    ]
  },
  {
    courseKey: 'python-engineering',
    author: 'admin',
    content:
      '<p>Reading recommendation for the async lesson: the asyncio docs section on Task Groups. Short and very practical.</p>',
    hoursAgo: 260,
    reactions: { thumbsup: 4 },
    comments: [{ author: 'fatima.alsayed', text: 'Thanks, that answered my gather vs TaskGroup question.' }]
  },
  {
    courseKey: 'machine-learning',
    author: 'nkechi.eze',
    content:
      '<p>Live model review next Tuesday. Bring your notebook and one confusion matrix. The bonus lesson on serving models unlocks right after.</p>',
    hoursAgo: 18,
    pinned: true,
    reactions: { clap: 4, thumbsup: 6 },
    comments: [
      { author: 'wei.zhang', text: 'Can we bring a model that is not Naive Bayes?' },
      {
        author: 'student',
        text: 'My accuracy problem from the community thread is fixed, recall went from 0 to 0.71.',
        replies: [
          { author: 'nkechi.eze', text: 'Great progress. Bring it to the review and we will look at precision too.' },
          {
            author: 'jaewon.park',
            text: 'Nice, class weights?',
            replies: [{ author: 'student', text: 'Yes, class_weight="balanced" plus a stratified split.' }]
          }
        ]
      }
    ]
  },
  {
    courseKey: 'ux-design',
    author: 'camille.laurent',
    content:
      '<p>Heuristic reviews are coming in and they are excellent. A reminder that screenshots make your findings far easier to grade. The due date is in four days.</p>',
    hoursAgo: 26,
    reactions: { clap: 3, thumbsup: 5 },
    comments: [
      {
        author: 'hannah.becker',
        text: 'Is a Figma link fine instead of uploaded images?',
        replies: [
          { author: 'camille.laurent', text: 'Perfect, just make sure it is viewable by anyone with the link.' }
        ]
      }
    ]
  },
  {
    courseKey: 'ux-design',
    author: 'camille.laurent',
    content:
      '<p>Try this before the accessibility lesson: turn on VoiceOver or TalkBack and order a coffee in your favourite app. Share what broke.</p>',
    hoursAgo: 150,
    reactions: { smile: 4, thumbsup: 6 },
    comments: [
      {
        author: 'sofia.rossi',
        text: 'The "add to cart" button was announced as "button button". Never noticed before.'
      },
      {
        author: 'leila.rahimi',
        text: "Couldn't reach the size picker at all with swipe navigation.",
        replies: [
          { author: 'camille.laurent', text: 'Classic custom control without accessibility traits. Great find.' }
        ]
      }
    ]
  },
  {
    courseKey: 'product-management',
    author: 'tom.hargreaves',
    content:
      '<p>Session 3 on problem statements is <strong>live now</strong>. Join from the lesson page. Today we turn your interview notes into statements.</p>',
    hoursAgo: 0.3,
    pinned: true,
    reactions: { thumbsup: 5 },
    comments: [{ author: 'aisha.bello', text: 'Joining in two minutes!' }]
  },
  {
    courseKey: 'product-management',
    author: 'tom.hargreaves',
    content:
      '<p>The recording of the customer interviews session is up. Homework: run two interviews before session 3 and bring your notes.</p>',
    hoursAgo: 45,
    reactions: { clap: 4, thumbsup: 7 },
    comments: [
      {
        author: 'priya.raman',
        text: 'Ran three interviews this week. The "last time you..." question was a game changer.',
        replies: [
          { author: 'tom.hargreaves', text: 'Brilliant. Bring the most surprising quote to the session.' },
          {
            author: 'kwame.asante',
            text: 'Same here, people describe what they actually did instead of what they think they want.'
          }
        ]
      },
      { author: 'student', text: 'Could you share the interview guide template?' }
    ]
  },
  {
    courseKey: 'leading-teams',
    author: 'tom.hargreaves',
    content:
      '<p>Next session: <strong>From Engineer to Manager</strong>. Please watch the talk in the lesson beforehand. It is 40 minutes and sets up the whole discussion.</p>',
    hoursAgo: 20,
    reactions: { thumbsup: 6 },
    comments: [
      {
        author: 'emily.carter',
        text: "Watched it twice. The bit about your output becoming your team's output hit home.",
        replies: [{ author: 'tomas.rivera', text: 'Same. I still measure my day by the code I wrote.' }]
      }
    ]
  },
  {
    courseKey: 'digital-marketing',
    author: 'camille.laurent',
    content:
      '<p>New example added to "Measuring What Matters": a full CAC and payback calculation from a real campaign.</p>',
    hoursAgo: 96,
    reactions: { thumbsup: 5, clap: 2 },
    comments: [{ author: 'rafael.costa', text: 'Exactly what I needed for my budget review, thank you.' }]
  },
  {
    courseKey: 'security-awareness',
    author: 'admin',
    content:
      '<p>Reminder: the annual security training is due by the end of next week. It takes about 40 minutes. Thank you to the 60% of you who already finished.</p>',
    hoursAgo: 40,
    pinned: true,
    reactions: { thumbsup: 8 },
    comments: [{ author: 'nadia.haddad', text: 'Done! The phishing examples were very realistic.' }]
  },
  {
    courseKey: 'gdpr',
    author: 'nkechi.eze',
    content:
      '<p>Overdue privacy training will be escalated to managers on Monday. Please finish it this week if you have not already.</p>',
    hoursAgo: 60,
    reactions: { thumbsup: 3 }
  },
  {
    courseKey: 'docker',
    author: 'admin',
    content:
      '<p>Tip: run <code>docker history your-image</code> to see which layers are biggest. Post your before and after image sizes below.</p>',
    hoursAgo: 80,
    reactions: { clap: 3, thumbsup: 4 },
    comments: [
      { author: 'fatima.alsayed', text: '1.1 GB down to 180 MB with a multi-stage build.' },
      { author: 'olga.petrova', text: '640 MB to 210 MB. The .dockerignore did most of the work.' }
    ]
  },
  {
    courseKey: 'mvc',
    author: 'admin',
    content:
      '<p>Two new lessons are live in the Building Real Features section: routing in practice and testing your MVC app.</p>',
    hoursAgo: 110,
    reactions: { thumbsup: 5 }
  },
  {
    courseKey: 'incident-response',
    author: 'enterpriseAdmin',
    content:
      '<p>We ran a game day on Friday using the triage roles from this course. Postmortem examples are welcome in the assignment.</p>',
    hoursAgo: 50,
    reactions: { thumbsup: 4 },
    comments: [
      {
        author: 'enterpriseStudent',
        text: 'The scribe role was much more useful than I expected.',
        replies: [{ author: 'enterpriseAdmin', text: 'Agreed, the timeline made the postmortem take half the time.' }]
      }
    ]
  },
  {
    courseKey: 'product-fundamentals',
    author: 'earlyAdopterAdmin',
    content: '<p>Two new lessons on prioritisation and one-page specs are now available.</p>',
    hoursAgo: 72,
    reactions: { clap: 3 },
    comments: [{ author: 'earlyAdopterStudent', text: 'The spec template is great, using it at work this week.' }]
  },
  {
    courseKey: 'brand-design',
    author: 'earlyAdopterAdmin',
    content: '<p>Share your brand guide in the exercise by next week. I review every submission personally.</p>',
    hoursAgo: 30,
    reactions: { thumbsup: 3 }
  }
];

/** Id of the course's nth demo post, counting from 0 in `POSTS` order. */
export function demoNewsfeedPostId(demoCourse: DemoCourse, position: number) {
  return demoId('a000', demoCourse.index, position + 1);
}

export async function seedDemoNewsfeed({
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
  const posts = POSTS.filter((post) => courseByKey.has(post.courseKey));
  if (posts.length === 0) return;

  const groupIds = [...new Set(posts.map((post) => demoGroupId(courseByKey.get(post.courseKey)!)))];
  const members = await db
    .select({
      id: groupmember.id,
      groupId: groupmember.groupId,
      profileId: groupmember.profileId,
      roleId: groupmember.roleId
    })
    .from(groupmember)
    .where(inArray(groupmember.groupId, groupIds));
  const memberId = (demoCourse: DemoCourse, personKey: string) => {
    const profileId = personId(personKey);
    const member = members.find((row) => row.groupId === demoGroupId(demoCourse) && row.profileId === profileId);
    if (!member) throw new Error(`${personKey} is not a member of ${demoCourse.key}`);

    return member.id;
  };

  const positions = new Map<string, number>();
  const planned = posts.map((post) => {
    const demoCourse = courseByKey.get(post.courseKey)!;
    const position = positions.get(post.courseKey) ?? 0;
    positions.set(post.courseKey, position + 1);

    return { post, demoCourse, id: demoNewsfeedPostId(demoCourse, position) };
  });

  const existing = await db
    .select({ id: courseNewsfeed.id })
    .from(courseNewsfeed)
    .where(
      inArray(
        courseNewsfeed.id,
        planned.map((entry) => entry.id)
      )
    );
  const existingIds = new Set(existing.map((row) => row.id));
  const toInsert = planned.filter((entry) => !existingIds.has(entry.id));

  const feedRows: TNewCourseNewsfeed[] = toInsert.map(({ post, demoCourse, id }) => {
    const studentIds = members
      .filter((row) => row.groupId === demoGroupId(demoCourse) && row.roleId === 3)
      .map((row) => row.id);
    const take = (start: number, count = 0) => studentIds.slice(start, start + count);
    const clap = post.reactions?.clap ?? 0;
    const smile = post.reactions?.smile ?? 0;
    const thumbsup = post.reactions?.thumbsup ?? 0;

    return {
      id,
      courseId: demoCourseId(demoCourse),
      authorId: memberId(demoCourse, post.author),
      content: post.content,
      isPinned: post.pinned ?? false,
      reaction: {
        clap: take(0, clap),
        smile: take(clap, smile),
        thumbsup: take(clap + smile, thumbsup),
        thumbsdown: []
      },
      createdAt: new Date(now.getTime() - post.hoursAgo * 60 * 60 * 1000).toISOString()
    };
  });

  if (feedRows.length > 0) {
    await db.insert(courseNewsfeed).values(feedRows);
  }

  let commentCount = 0;
  for (const { post, demoCourse, id } of toInsert) {
    let minuteOffset = 0;
    const postedAt = now.getTime() - post.hoursAgo * 60 * 60 * 1000;
    const span = Math.max(post.hoursAgo * 60 - 5, 1);

    const insertThread = async (comments: DemoComment[], parentId: number | null) => {
      for (const comment of comments) {
        minuteOffset += Math.max(1, Math.floor(span / 12));
        const createdAt = new Date(Math.min(postedAt + minuteOffset * 60 * 1000, now.getTime() - 60 * 1000));
        const [created] = await db
          .insert(courseNewsfeedComment)
          .values({
            courseNewsfeedId: id,
            authorId: memberId(demoCourse, comment.author),
            content: comment.text,
            parentId,
            createdAt: createdAt.toISOString()
          })
          .returning({ id: courseNewsfeedComment.id });
        commentCount += 1;

        if (comment.replies?.length) await insertThread(comment.replies, created.id);
      }
    };

    await insertThread(post.comments ?? [], null);
  }

  console.log(`   ✓ Demo newsfeed: ${feedRows.length} post(s), ${commentCount} comment(s)`);
}
