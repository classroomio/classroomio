import { db, inArray, lesson, lessonLanguage } from '@db/drizzle';

import { renderLessonHtml, type DemoLesson } from './demoCatalogTypes';
import { VIDEOS, YOUTUBE_VIDEOS, type DemoVideo } from './demoMedia';

export interface LessonTemplate {
  mvcCourseId: string;
  reactCourseId: string;
  pandasCourseId: string;
  adminUserId: string;
  mvcSectionId: string;
  reactSectionId: string;
  pandasSectionId: string;
}

function lessonVideo(video: DemoVideo) {
  const type = /youtube\.com|youtu\.be/.test(video.link) ? ('youtube' as const) : ('generic' as const);

  return [{ link: video.link, type, fileName: video.title, metadata: { title: video.title } }];
}

type LessonContent = Pick<DemoLesson, 'intro' | 'blocks'>;

const LESSON_CONTENT: Record<string, LessonContent> = {
  '5c75f4f1-c222-44a9-a8c6-81773ea33872': {
    intro:
      'Model-View-Controller splits an application into three parts with one job each. The model holds data and rules, the view presents it and the controller handles input and decides what happens next.',
    blocks: [
      {
        heading: 'Why separate them',
        bullets: [
          'You can change how a page looks without touching business rules.',
          'Models can be tested without a browser or server.',
          'Several views, such as a web page and a JSON API, can share one model.'
        ]
      },
      {
        heading: 'Where you have seen it',
        paragraphs: [
          'Rails, Django, Laravel, ASP.NET MVC and Express apps with a templating engine all follow some version of this pattern, even when the names differ.'
        ]
      }
    ]
  },
  'a99e65b7-1394-4751-ad8d-a5fb670ccb9e': {
    intro:
      'Each MVC component has a clear contract. Learning what belongs where saves you from controllers that grow to a thousand lines.',
    blocks: [
      {
        heading: 'Model',
        paragraphs: ['Owns state and rules: validation, calculations and persistence. It knows nothing about HTTP.']
      },
      {
        heading: 'View',
        paragraphs: ['Renders data it is given. Keep logic to simple formatting and loops.']
      },
      {
        heading: 'Controller',
        paragraphs: ['Reads the request, calls the model and chooses a view or redirect.'],
        code: "class OrdersController {\n  async show(req, res) {\n    const order = await Order.find(req.params.id);\n    res.render('orders/show', { order });\n  }\n}"
      }
    ]
  },
  '266b3daa-1eb2-401e-9510-1819952b44b7': {
    intro:
      'Time to put the pieces together. You will build a small Node.js app with Express: one model, two views and a controller that connects them.',
    blocks: [
      {
        heading: 'Project layout',
        code: 'app/\n  models/task.js\n  controllers/tasks-controller.js\n  views/tasks/index.ejs\n  views/tasks/show.ejs\n  routes.js\nserver.js'
      },
      {
        heading: 'Steps',
        bullets: [
          'Create the Task model with title and done fields.',
          'Add routes for listing and showing tasks.',
          'Render the list with a template and link each task to its page.'
        ]
      }
    ]
  },
  '6f2d8142-0903-425c-8534-f5105b624752': {
    intro:
      'React is a library for building user interfaces from components. You describe what the UI should look like for a given state, and React updates the page when the state changes.',
    blocks: [
      {
        heading: 'Your first component',
        code: 'function Greeting({ name }) {\n  return <h1>Hello, {name}</h1>;\n}'
      },
      {
        heading: 'Key ideas',
        bullets: [
          'Components are functions that return JSX.',
          'Data flows down through props.',
          'React re-renders a component when its state or props change.'
        ]
      }
    ]
  },
  '0a39ab2f-9451-4a90-902c-3030bf965637': {
    intro:
      'Components let you split the UI into reusable pieces. Props are the inputs that make each piece configurable.',
    blocks: [
      {
        heading: 'Composing components',
        code: 'function ProductCard({ title, price, onAdd }) {\n  return (\n    <article>\n      <h2>{title}</h2>\n      <p>{price}</p>\n      <button onClick={onAdd}>Add to cart</button>\n    </article>\n  );\n}'
      },
      {
        heading: 'Good component boundaries',
        bullets: [
          'One component, one responsibility.',
          'Pass callbacks down so children can report events up.',
          'Prefer composition with children over long lists of props.'
        ]
      }
    ]
  },
  '80b79665-733b-41bf-9853-34fd8ab50496': {
    intro:
      'State is data that changes over time inside a component. Effects synchronise a component with something outside React, such as a network request or a timer.',
    blocks: [
      {
        heading: 'useState and useEffect',
        code: 'function Clock() {\n  const [now, setNow] = useState(new Date());\n\n  useEffect(() => {\n    const timer = setInterval(() => setNow(new Date()), 1000);\n    return () => clearInterval(timer);\n  }, []);\n\n  return <time>{now.toLocaleTimeString()}</time>;\n}'
      },
      {
        heading: 'Rules of hooks',
        bullets: [
          'Call hooks at the top level, never in loops or conditions.',
          'Only call hooks from components or other hooks.'
        ]
      }
    ]
  },
  '5e5c8221-4c11-4c40-8664-11743bb79579': {
    intro:
      'Python is the most common language in data science because it is readable and has excellent libraries. This lesson covers the essentials you need before pandas.',
    blocks: [
      {
        heading: 'Core types',
        code: "prices = [12.5, 8.0, 15.25]\nproduct = {'name': 'Notebook', 'price': 12.5}\ntotal = sum(prices)"
      },
      {
        heading: 'Habits for analysis',
        bullets: [
          'Work in a notebook and keep cells short.',
          'Name variables after what they hold.',
          'Restart and run all before sharing results.'
        ]
      }
    ]
  },
  '829da386-8ccd-4c81-b2fb-b9891102c83c': {
    intro:
      'pandas gives you the DataFrame, a table with labelled rows and columns. Most analysis is loading data, selecting what you need and summarising it.',
    blocks: [
      {
        heading: 'First steps',
        code: "import pandas as pd\n\norders = pd.read_csv('orders.csv', parse_dates=['created_at'])\norders.head()\norders.describe()\norders[orders['amount'] > 100]"
      },
      {
        heading: 'Questions to ask any new dataset',
        bullets: ['How many rows and columns?', 'What does one row represent?', 'Which columns have missing values?']
      }
    ]
  },
  '05f03084-3ff1-49e3-aa2a-7a13840cc4b1': {
    intro:
      'Real data is messy. Cleaning means finding missing values, duplicates, wrong types and inconsistent labels before they distort your analysis.',
    blocks: [
      {
        heading: 'Common fixes',
        code: "orders = orders.drop_duplicates(subset='order_id')\norders['country'] = orders['country'].str.strip().str.upper()\norders['amount'] = pd.to_numeric(orders['amount'], errors='coerce')\norders = orders.dropna(subset=['amount'])"
      },
      {
        heading: 'Document every step',
        paragraphs: [
          "Keep cleaning in a function or script so you can rerun it on next month's export and explain each decision."
        ]
      }
    ]
  }
};

export async function seedLessons({
  mvcCourseId,
  adminUserId,
  reactCourseId,
  pandasCourseId,
  mvcSectionId,
  reactSectionId,
  pandasSectionId
}: LessonTemplate) {
  const existingLessons = await db.select().from(lesson);
  const existingLessonIds = existingLessons.map((l) => l.id);

  const lessonsToInsert = [
    // MVC Course lessons
    {
      id: '5c75f4f1-c222-44a9-a8c6-81773ea33872',
      courseId: mvcCourseId,
      sectionId: mvcSectionId,
      title: 'Lesson 1: Introduction to MVC Architecture',
      slug: 'lesson-1-introduction-to-mvc-architecture',
      teacherId: adminUserId,
      videos: lessonVideo(YOUTUBE_VIDEOS.softwareArchitecture),
      isUnlocked: true,
      order: 1
    },
    {
      id: 'a99e65b7-1394-4751-ad8d-a5fb670ccb9e',
      courseId: mvcCourseId,
      sectionId: mvcSectionId,
      title: 'Anatomy of MVC Components',
      slug: 'anatomy-of-mvc-components',
      teacherId: adminUserId,
      videos: lessonVideo(YOUTUBE_VIDEOS.mvcIntroduction),
      isUnlocked: true,
      order: 2
    },
    {
      id: '266b3daa-1eb2-401e-9510-1819952b44b7',
      courseId: mvcCourseId,
      sectionId: mvcSectionId,
      title: 'Building Your First MVC Application',
      slug: 'building-your-first-mvc-application',
      teacherId: adminUserId,
      videos: lessonVideo(VIDEOS.fastProductDevelopment),
      isUnlocked: true,
      order: 3
    },
    // React Course lessons
    {
      id: '6f2d8142-0903-425c-8534-f5105b624752',
      courseId: reactCourseId,
      sectionId: reactSectionId,
      title: 'Introduction to React: Understanding the Basics',
      slug: 'introduction-to-react-understanding-the-basics',
      teacherId: adminUserId,
      videos: lessonVideo(YOUTUBE_VIDEOS.reactIn100Seconds),
      isUnlocked: true,
      order: 1
    },
    {
      id: '0a39ab2f-9451-4a90-902c-3030bf965637',
      courseId: reactCourseId,
      sectionId: reactSectionId,
      title: 'Components and Props: Building Reusable UI Elements',
      slug: 'components-and-props-building-reusable-ui-elements',
      teacherId: adminUserId,
      videos: lessonVideo(VIDEOS.fullStackReact),
      isUnlocked: true,
      order: 2
    },
    {
      id: '80b79665-733b-41bf-9853-34fd8ab50496',
      courseId: reactCourseId,
      sectionId: reactSectionId,
      title: 'State and Lifecycle: Managing Data in React Applications',
      slug: 'state-and-lifecycle-managing-data-in-react-applications',
      teacherId: adminUserId,
      videos: lessonVideo(VIDEOS.webSockets),
      isUnlocked: true,
      order: 3
    },
    // Pandas Course lessons
    {
      id: '5e5c8221-4c11-4c40-8664-11743bb79579',
      courseId: pandasCourseId,
      sectionId: pandasSectionId,
      title: 'Python Essentials: An Introduction to Data Science',
      slug: 'python-essentials-an-introduction-to-data-science',
      teacherId: adminUserId,
      videos: lessonVideo(VIDEOS.jupyterTeaching),
      isUnlocked: true,
      order: 1
    },
    {
      id: '829da386-8ccd-4c81-b2fb-b9891102c83c',
      courseId: pandasCourseId,
      sectionId: pandasSectionId,
      title: 'Delving into Data Analysis with Pandas',
      slug: 'delving-into-data-analysis-with-pandas',
      teacherId: adminUserId,
      videos: lessonVideo(YOUTUBE_VIDEOS.pandasTutorial),
      isUnlocked: true,
      order: 2
    },
    {
      id: '05f03084-3ff1-49e3-aa2a-7a13840cc4b1',
      courseId: pandasCourseId,
      sectionId: pandasSectionId,
      title: 'Data Cleaning and Preprocessing Techniques',
      slug: 'data-cleaning-and-preprocessing-techniques',
      teacherId: adminUserId,
      videos: lessonVideo(YOUTUBE_VIDEOS.dataCleaning),
      isUnlocked: true,
      order: 3
    }
  ].filter((l) => !existingLessonIds.includes(l.id));

  if (lessonsToInsert.length > 0) {
    await db.insert(lesson).values(lessonsToInsert);
    console.log(`   ✓ Inserted ${lessonsToInsert.length} lesson(s)`);
  } else {
    console.log('   ✓ Lessons already exist, skipping');
  }

  const lessonIds = Object.keys(LESSON_CONTENT);
  const existingContent = await db
    .select({ lessonId: lessonLanguage.lessonId })
    .from(lessonLanguage)
    .where(inArray(lessonLanguage.lessonId, lessonIds));
  const lessonsWithContent = new Set(existingContent.map((row) => row.lessonId));
  const insertedLessonIds = new Set([...existingLessonIds, ...lessonsToInsert.map((l) => l.id)]);
  const contentToInsert = lessonIds
    .filter((lessonId) => insertedLessonIds.has(lessonId) && !lessonsWithContent.has(lessonId))
    .map((lessonId) => ({ lessonId, locale: 'en' as const, content: renderLessonHtml(LESSON_CONTENT[lessonId]) }));

  if (contentToInsert.length > 0) {
    await db.insert(lessonLanguage).values(contentToInsert);
    console.log(`   ✓ Inserted ${contentToInsert.length} lesson body(ies)`);
  }
}
