import type { DemoCourse } from './demoCatalogTypes';
import { COURSE_IMAGES, DOCUMENTS, VIDEOS, YOUTUBE_VIDEOS } from './demoMedia';

const DAY_MINUTES = 24 * 60;

export const MVC_LESSON_IDS = [
  '5c75f4f1-c222-44a9-a8c6-81773ea33872',
  'a99e65b7-1394-4751-ad8d-a5fb670ccb9e',
  '266b3daa-1eb2-401e-9510-1819952b44b7'
];

export const REACT_LESSON_IDS = [
  '6f2d8142-0903-425c-8534-f5105b624752',
  '0a39ab2f-9451-4a90-902c-3030bf965637',
  '80b79665-733b-41bf-9853-34fd8ab50496'
];

export const PANDAS_LESSON_IDS = [
  '5e5c8221-4c11-4c40-8664-11743bb79579',
  '829da386-8ccd-4c81-b2fb-b9891102c83c',
  '05f03084-3ff1-49e3-aa2a-7a13840cc4b1'
];

const COMPLIANCE_REMINDERS = [30, 14, 7, 1];

export const UDEMY_COURSES: DemoCourse[] = [
  {
    key: 'mvc',
    index: 1,
    org: 'udemy',
    title: 'Getting started with MVC',
    description: '',
    overview: '',
    bannerImage: COURSE_IMAGES.mvc,
    type: 'SELF_PACED',
    instructorKey: 'admin',
    createdDaysAgo: 320,
    existing: {
      courseId: '98e6e798-f0bd-4f9d-a6f5-ce0816a4f97e',
      groupId: 'c6b022fd-fff3-4f09-8960-c9cb06819761',
      lessonIds: MVC_LESSON_IDS,
      exercises: [
        { key: 'mvc-essentials', id: 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862' },
        {
          key: 'mvc-components',
          id: '8b6084b0-a936-411d-9408-a1289aeed068',
          extraQuestions: [
            {
              type: 'RADIO',
              title: 'Which layer should validate that an order total is never negative?',
              options: [
                { label: 'The view' },
                { label: 'The model', correct: true },
                { label: 'The router' },
                { label: 'The template engine' }
              ]
            },
            {
              type: 'TRUE_FALSE',
              title: 'A controller should contain the SQL that loads a record.',
              correct: false
            }
          ]
        },
        {
          key: 'mvc-node',
          id: '43f43374-7df0-4e02-b839-56403f71473a',
          extraQuestions: [
            {
              type: 'ORDERING',
              title: 'Put the steps of an Express request in order.',
              items: [
                'The router matches the URL',
                'The controller reads the request',
                'The model loads the data',
                'The view renders the response'
              ]
            },
            {
              type: 'FILL_BLANK',
              title: 'In Express, <code>res.____()</code> renders a template with data.',
              answers: ['render']
            }
          ]
        }
      ]
    },
    sections: [
      {
        title: 'Building Real Features',
        lessons: [
          {
            title: 'Routing and Controllers in Practice',
            video: VIDEOS.fastProductDevelopment,
            intro:
              'Routes decide which controller runs, and controllers decide what happens next. Keeping both thin is what lets an MVC codebase grow without turning into a tangle of special cases.',
            blocks: [
              {
                heading: 'Thin controllers',
                paragraphs: [
                  'A controller translates an HTTP request into a call on the model and picks a view for the result. Business rules belong in the model, where they can be tested without a web server.'
                ],
                code: "router.post('/orders', async (req, res) => {\n  const order = await Order.place(req.user, req.body.items);\n  res.status(201).render('orders/show', { order });\n});"
              },
              {
                heading: 'Naming routes',
                bullets: [
                  'Use nouns for resources: <code>/orders</code>, not <code>/createOrder</code>.',
                  'Let the HTTP verb carry the action.',
                  'Nest routes only one level deep, for example <code>/orders/:id/items</code>.'
                ]
              }
            ]
          },
          {
            title: 'Testing Your MVC Application',
            video: VIDEOS.djangoTesting,
            intro:
              'MVC gives you natural seams for testing. Models get fast unit tests, controllers get request tests, and a handful of end-to-end tests prove the pieces fit together.',
            blocks: [
              {
                heading: 'What to test where',
                bullets: [
                  'Model tests cover validation and business rules.',
                  'Controller tests check status codes, redirects and which template renders.',
                  'End-to-end tests follow the two or three journeys that make you money.'
                ]
              },
              {
                heading: 'Keep the pyramid',
                paragraphs: [
                  'If most of your tests drive a browser, the suite gets slow and flaky. Push each check down to the lowest layer that can catch the bug.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'mvc-controllers',
            title: 'Controller design check',
            description: '<p>Three questions on where code belongs in an MVC application.</p>',
            questions: [
              {
                type: 'RADIO',
                title: 'Where should the rule "an order needs at least one item" live?',
                options: [
                  { label: 'In the route definition' },
                  { label: 'In the Order model', correct: true },
                  { label: 'In the HTML template' }
                ]
              },
              {
                type: 'TRUE_FALSE',
                title: 'Controller tests can run without starting a browser.',
                correct: true
              },
              {
                type: 'CHECKBOX',
                title: 'Which of these are good RESTful route names?',
                options: [
                  { label: '/orders', correct: true },
                  { label: '/getAllOrders' },
                  { label: '/orders/:id/items', correct: true },
                  { label: '/doCheckout' }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'react',
    index: 2,
    org: 'udemy',
    title: 'Modern Web Development with React',
    description: '',
    overview: '',
    bannerImage: '',
    type: 'SELF_PACED',
    instructorKey: 'admin',
    createdDaysAgo: 300,
    existing: {
      courseId: '16e3bc8d-5d1b-4708-988e-93abae288ccf',
      groupId: '04a250f1-bcb9-4e0d-a3d4-a01096e7a105',
      lessonIds: REACT_LESSON_IDS,
      exercises: [
        { key: 'react-intro', id: 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1' },
        {
          key: 'react-props',
          id: '43ead5d7-af88-47cf-8f86-99124f5eb0cd',
          extraQuestions: [
            {
              type: 'TRUE_FALSE',
              title: 'A component may change the props it receives.',
              correct: false
            },
            {
              type: 'RADIO',
              title: 'How does a child component send data back to its parent?',
              options: [
                { label: 'By mutating the parent state directly' },
                { label: 'By calling a callback prop the parent passed down', correct: true },
                { label: 'By reading the parent from the DOM' }
              ]
            }
          ]
        },
        {
          key: 'react-state',
          id: 'b0770deb-a8a0-4efe-9d28-8bf1298c04b2',
          extraQuestions: [
            {
              type: 'FILL_BLANK',
              title: 'The hook that stores local component state is <code>____</code>.',
              answers: ['useState']
            },
            {
              type: 'CHECKBOX',
              title: 'Which of these belong in a <code>useEffect</code>?',
              options: [
                { label: 'Subscribing to a WebSocket', correct: true },
                { label: 'Computing a value from props' },
                { label: 'Fetching data after mount', correct: true },
                { label: 'Rendering JSX' }
              ]
            }
          ]
        }
      ]
    },
    sections: [
      {
        title: 'Shipping React Apps',
        lessons: [
          {
            title: 'Fetching Data and Real-Time Updates',
            video: VIDEOS.webSockets,
            intro:
              'Most React screens show data that lives on a server. This lesson covers loading it once with fetch, keeping it fresh with a WebSocket, and cleaning up so a closed screen stops listening.',
            blocks: [
              {
                heading: 'A small data hook',
                paragraphs: [
                  'Wrap loading, error and data state in a custom hook so every screen handles them the same way.'
                ],
                code: "function useOrders() {\n  const [orders, setOrders] = useState([]);\n\n  useEffect(() => {\n    const socket = new WebSocket('wss://api.example.com/orders');\n    socket.onmessage = (event) => setOrders(JSON.parse(event.data));\n    return () => socket.close();\n  }, []);\n\n  return orders;\n}"
              },
              {
                heading: 'Always clean up',
                bullets: [
                  'Return a cleanup function from every effect that subscribes to something.',
                  'Ignore responses that arrive after the component unmounted.',
                  'Show stale data with a refresh indicator instead of a blank screen.'
                ]
              }
            ]
          },
          {
            title: 'Styling Components with CSS',
            video: VIDEOS.cssBoxModel,
            intro:
              'Every component is a set of boxes. Knowing how margin, border and padding stack up is the difference between layouts that hold and layouts you fight with.',
            blocks: [
              {
                heading: 'The box model',
                bullets: [
                  'Padding is space inside the border and takes the background colour.',
                  'Margin is space outside the border and is always transparent.',
                  'Vertical margins between siblings collapse to the larger of the two.'
                ],
                code: '* {\n  box-sizing: border-box;\n}\n\n.card {\n  padding: 16px;\n  margin-bottom: 24px;\n}'
              },
              {
                heading: 'Spacing belongs to the parent',
                paragraphs: [
                  'Give reusable components no outer margin. Let the parent layout set the gap between them with <code>gap</code> in flex or grid, so the same card works in any list.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'react-data-hook',
            title: 'Project: build a data-fetching hook',
            description:
              '<p>Build a <code>useOrders</code> hook that loads orders, subscribes to updates and cleans up on unmount. Share your code and explain one decision you made.</p>',
            dueInDays: 5,
            questions: [
              {
                type: 'RADIO',
                title: 'What should an effect return when it opens a WebSocket?',
                options: [
                  { label: 'Nothing' },
                  { label: 'A function that closes the socket', correct: true },
                  { label: 'The socket itself' }
                ]
              },
              {
                type: 'LINK',
                title: 'Paste a link to your hook (GitHub, CodeSandbox or StackBlitz).',
                sampleLinks: [
                  'https://github.com/johndoe-dev/react-orders-hook',
                  'https://codesandbox.io/p/sandbox/use-orders-hook-demo',
                  'https://stackblitz.com/edit/react-use-orders'
                ]
              },
              {
                type: 'TEXTAREA',
                title: 'How does your hook handle a response that arrives after the component unmounts?',
                sampleAnswers: [
                  'I keep an isActive flag inside the effect and set it to false in the cleanup. When a response arrives I only call setOrders if isActive is still true. The socket is closed in the same cleanup function.',
                  'I used an AbortController for the initial fetch and abort it in the cleanup, then close the WebSocket. That way React never tries to update state on an unmounted component.',
                  'The cleanup closes the socket and the fetch checks a ref before setting state. I also show the last known orders with a small refreshing label while reconnecting.'
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'pandas',
    index: 3,
    org: 'udemy',
    title: 'Data Science with Python and Pandas',
    description: '',
    overview: '',
    bannerImage: '',
    type: 'SELF_PACED',
    instructorKey: 'nkechi.eze',
    createdDaysAgo: 280,
    existing: {
      courseId: 'f0a85d18-aff4-412f-b8e6-3b34ef098dce',
      groupId: '0789ced2-b8f3-472c-97ff-bdde1e80dddf',
      lessonIds: PANDAS_LESSON_IDS,
      exercises: [
        {
          key: 'python-intro',
          id: '6f1063ed-3791-43fe-81e9-ad3b007834fa',
          extraQuestions: [
            {
              type: 'RADIO',
              title: 'Which Python type would you use to store a row of named values?',
              options: [{ label: 'list' }, { label: 'dict', correct: true }, { label: 'tuple' }, { label: 'set' }]
            },
            {
              type: 'NUMERIC',
              title: 'What does <code>len([3, 1, 4, 1, 5])</code> return?',
              correctValue: 5
            },
            {
              type: 'TRUE_FALSE',
              title: 'Python lists are indexed from 1.',
              correct: false
            }
          ]
        },
        { key: 'pandas-analysis', id: 'bd6e81c7-3d28-4037-acf0-a3028c583771' },
        { key: 'pandas-cleaning', id: 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1' }
      ]
    },
    sections: [
      {
        title: 'Analysis in Practice',
        lessons: [
          {
            title: 'Indexing and Grouping Like a Pro',
            video: VIDEOS.pandasIndexes,
            documents: [DOCUMENTS.pandasCheatSheet],
            intro:
              'Most analysis questions are some form of "split, apply, combine". Pandas indexes and <code>groupby</code> let you answer them in one readable line instead of a loop.',
            blocks: [
              {
                heading: 'Group, then aggregate',
                code: "revenue = (\n    orders\n    .groupby(['region', 'month'])['amount']\n    .agg(['sum', 'mean', 'count'])\n    .sort_values('sum', ascending=False)\n)"
              },
              {
                heading: 'Make the index work for you',
                bullets: [
                  'Set a meaningful index such as a date or customer id with <code>set_index</code>.',
                  'Use <code>.loc</code> for labels and <code>.iloc</code> for positions.',
                  'Reset the index before exporting so the column is not lost.'
                ]
              }
            ]
          },
          {
            title: 'Making pandas Fast',
            video: VIDEOS.pandasFly,
            intro:
              'pandas is fast when you let it work on whole columns at once. Most slow notebooks loop over rows, keep text as generic objects, or load columns they never use.',
            blocks: [
              {
                heading: 'Vectorise first',
                code: "# slow\norders['total'] = orders.apply(lambda row: row.price * row.qty, axis=1)\n\n# fast\norders['total'] = orders['price'] * orders['qty']"
              },
              {
                heading: 'Cheap wins',
                bullets: [
                  'Convert repeated strings to <code>category</code> to cut memory.',
                  'Read only the columns you need with <code>usecols</code>.',
                  'Use the <code>pyarrow</code> engine for large CSV and Parquet files.'
                ]
              }
            ]
          },
          {
            title: 'Querying DataFrames with SQL Thinking',
            video: YOUTUBE_VIDEOS.sqlForBeginners,
            intro:
              'If you know SQL you already know most of pandas. Filtering is <code>WHERE</code>, <code>groupby</code> is <code>GROUP BY</code> and <code>merge</code> is a join.',
            blocks: [
              {
                heading: 'Side by side',
                code: "# SELECT region, SUM(amount) FROM orders WHERE status = 'paid' GROUP BY region\norders.query(\"status == 'paid'\").groupby('region')['amount'].sum()"
              },
              {
                heading: 'Joins',
                paragraphs: [
                  'Use <code>merge</code> with an explicit <code>how</code> and <code>validate</code> argument. <code>validate="many_to_one"</code> raises an error instead of silently duplicating rows when a key is not unique.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'pandas-groupby',
            title: 'GroupBy and indexing drill',
            description: '<p>Practice the split-apply-combine pattern on a small sales table.</p>',
            questions: [
              {
                type: 'FILL_BLANK',
                title: 'To total sales per region, call <code>df.____("region")["sales"].sum()</code>.',
                answers: ['groupby']
              },
              {
                type: 'NUMERIC',
                title:
                  'A DataFrame has 1,200 rows and 5 regions with equal counts. How many rows does each group have?',
                correctValue: 240
              },
              {
                type: 'CHECKBOX',
                title: 'Which changes usually make a slow pandas script faster?',
                options: [
                  { label: 'Replacing apply with column arithmetic', correct: true },
                  { label: 'Converting repeated strings to category', correct: true },
                  { label: 'Looping with iterrows' },
                  { label: 'Loading only the needed columns', correct: true }
                ]
              },
              {
                type: 'WORD_BANK',
                title: 'Complete the sentence.',
                template: 'Use ___ to select by label and ___ to select by position.',
                correct: ['.loc', '.iloc'],
                distractors: ['.at', '.query']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'python-engineering',
    index: 4,
    org: 'udemy',
    title: 'Python Engineering Best Practices',
    description:
      'Write Python that your teammates can read, test and change. Covers idiomatic code, functions and decorators, clean abstractions, error handling, debugging and safe refactoring.',
    overview:
      '<p>This course is for developers who can already write working Python and want it to survive contact with a team. Each lesson pairs a conference talk with a short written guide and code you can copy.</p><p>By the end you will structure modules around clear abstractions, handle errors deliberately and refactor without breaking callers.</p>',
    bannerImage: COURSE_IMAGES.pythonEngineering,
    type: 'SELF_PACED',
    instructorKey: 'admin',
    createdDaysAgo: 210,
    sections: [
      {
        title: 'Writing Pythonic Code',
        lessons: [
          {
            title: 'How Thinking in Python Changes Your Code',
            video: VIDEOS.thinkingInPython,
            intro:
              'Pythonic code is code that uses the language the way its designers expected. It is shorter, but more importantly it is easier for the next person to read.',
            blocks: [
              {
                heading: 'Prefer iteration to indexing',
                code: '# instead of\nfor i in range(len(users)):\n    print(i, users[i])\n\n# write\nfor position, user in enumerate(users, start=1):\n    print(position, user)'
              },
              {
                heading: 'Habits worth building',
                bullets: [
                  'Use comprehensions for simple transforms and loops for anything with side effects.',
                  'Return early instead of nesting <code>if</code> blocks.',
                  'Let <code>with</code> manage files, locks and connections.'
                ]
              }
            ]
          },
          {
            title: 'Functions, Closures and Decorators',
            video: VIDEOS.pythonFunctions,
            intro:
              'Functions in Python are objects. You can pass them around, return them from other functions and wrap them, which is all a decorator does.',
            blocks: [
              {
                heading: 'A timing decorator',
                code: "import functools\nimport time\n\ndef timed(func):\n    @functools.wraps(func)\n    def wrapper(*args, **kwargs):\n        started = time.perf_counter()\n        try:\n            return func(*args, **kwargs)\n        finally:\n            print(f'{func.__name__} took {time.perf_counter() - started:.3f}s')\n    return wrapper"
              },
              {
                heading: 'Watch out for',
                bullets: [
                  'Mutable default arguments such as <code>def add(item, items=[])</code>.',
                  'Late binding in closures created inside loops.',
                  'Forgetting <code>functools.wraps</code>, which hides the original name and docstring.'
                ]
              }
            ]
          },
          {
            title: 'Designing Clean Abstractions',
            video: VIDEOS.cleanAbstractions,
            intro:
              'A good abstraction hides a decision that is likely to change. A bad one hides nothing and adds a layer you have to read through.',
            blocks: [
              {
                heading: 'Test for a useful abstraction',
                bullets: [
                  'Can you describe it in one sentence without the word "and"?',
                  'Could you swap the implementation without touching callers?',
                  'Does it have fewer public methods than the thing it wraps?'
                ]
              },
              {
                heading: 'Start concrete',
                paragraphs: [
                  'Write the second use before you extract the abstraction. Two real callers show you which parts actually vary.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'pythonic-quiz',
            title: 'Pythonic code quiz',
            description: '<p>Five quick questions on idioms, functions and abstractions.</p>',
            questions: [
              {
                type: 'RADIO',
                title: 'What does <code>functools.wraps</code> preserve on a decorated function?',
                options: [
                  { label: 'Its return value' },
                  { label: 'Its name and docstring', correct: true },
                  { label: 'Its execution time' }
                ]
              },
              {
                type: 'TRUE_FALSE',
                title: 'Default argument values are evaluated each time the function is called.',
                correct: false
              },
              {
                type: 'CHECKBOX',
                title: 'Which are signs of a useful abstraction?',
                options: [
                  { label: 'It hides a decision likely to change', correct: true },
                  { label: 'It exposes every method of the wrapped object' },
                  { label: 'Callers do not change when the implementation does', correct: true }
                ]
              },
              {
                type: 'ORDERING',
                title: 'Order these refactoring steps.',
                items: [
                  'Write a test that pins current behaviour',
                  'Extract the function',
                  'Run the tests',
                  'Remove the old code path'
                ]
              },
              {
                type: 'NUMERIC',
                title: 'What does <code>sum(x * x for x in range(4))</code> evaluate to?',
                correctValue: 14
              }
            ]
          }
        ]
      },
      {
        title: 'Code That Survives Change',
        lessons: [
          {
            title: 'Errors and Exceptions Done Right',
            video: VIDEOS.exceptionalExceptions,
            intro:
              'Exceptions are part of a function contract. Raise specific ones, catch only what you can handle and never swallow an error silently.',
            blocks: [
              {
                heading: 'Specific beats generic',
                code: 'class PaymentDeclined(Exception):\n    pass\n\ntry:\n    charge(card, amount)\nexcept PaymentDeclined:\n    notify_customer(card.owner)\n    raise'
              },
              {
                heading: 'Rules of thumb',
                bullets: [
                  'Never use a bare <code>except:</code>.',
                  'Add context with <code>raise ... from error</code>.',
                  'Log at the boundary where the error is handled, not at every layer.'
                ]
              }
            ]
          },
          {
            title: 'A Systematic Approach to Debugging',
            video: VIDEOS.debuggingPractices,
            intro:
              'Debugging goes faster when you treat it as an experiment. Reproduce the bug, form a hypothesis, test it and only then change code.',
            blocks: [
              {
                heading: 'The loop',
                bullets: [
                  'Reproduce the failure with the smallest possible input.',
                  'Write down what you expected and what happened.',
                  'Bisect: halve the code or the history until the cause is obvious.',
                  'Add a test that fails before the fix and passes after.'
                ]
              },
              {
                heading: 'Use the debugger',
                code: 'def total(order):\n    breakpoint()  # drops into pdb here\n    return sum(item.price for item in order.items)'
              }
            ]
          },
          {
            title: 'Refactoring Without Breaking Your Users',
            video: VIDEOS.pythonicRefactoring,
            intro:
              'If other code depends on yours, every rename is a breaking change. Python gives you tools to change internals while keeping the public surface stable.',
            blocks: [
              {
                heading: 'Deprecate, then remove',
                code: "import warnings\n\ndef fetch_user(user_id):\n    warnings.warn('fetch_user is deprecated, use get_user', DeprecationWarning, stacklevel=2)\n    return get_user(user_id)"
              },
              {
                heading: 'Keep the surface small',
                paragraphs: [
                  'Prefix internal helpers with an underscore and list public names in <code>__all__</code>. Anything not listed is fair game to change.'
                ]
              }
            ]
          },
          {
            title: 'Async Python Without the Pain',
            video: VIDEOS.asyncioInPractice,
            intro:
              'asyncio helps when your program spends most of its time waiting on the network. It does not make CPU-heavy code faster, and mixing blocking calls into async code stalls everything.',
            blocks: [
              {
                heading: 'Run independent calls together',
                code: 'async def load_dashboard(user_id):\n    profile, orders = await asyncio.gather(\n        fetch_profile(user_id),\n        fetch_orders(user_id),\n    )\n    return profile, orders'
              },
              {
                heading: 'Common mistakes',
                bullets: [
                  'Calling <code>time.sleep</code> or <code>requests.get</code> inside a coroutine.',
                  'Creating tasks and never awaiting them.',
                  'Ignoring cancellation during shutdown.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'refactoring-reflection',
            title: 'Refactoring reflection',
            description:
              '<p>Describe a refactor you made or would make in a real codebase. Your instructor reads every answer.</p>',
            dueInDays: -3,
            questions: [
              {
                type: 'TEXTAREA',
                title: 'Describe a function you refactored. What changed and how did you keep callers working?',
                sampleAnswers: [
                  'Our invoice module had a 200 line function that calculated tax, discounts and currency conversion. I pinned the behaviour with snapshot tests, then extracted three pure functions. The old function name stayed as a thin wrapper with a deprecation warning for two releases.',
                  'I split a settings loader that read environment variables, files and defaults in one place. The new version has a small Settings dataclass and a loader per source. Existing imports still work because the module re-exports the old name.',
                  'I replaced a class hierarchy with a dict of strategy functions. Callers did not change because the public method signature stayed the same, and the tests from before the refactor still pass.'
                ]
              },
              {
                type: 'SHORT_ANSWER',
                title: 'Name the warning class Python uses for features that will be removed.',
                accepted: ['DeprecationWarning'],
                sampleAnswers: ['DeprecationWarning', 'DeprecationWarning', 'PendingDeprecationWarning']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'pytest',
    index: 5,
    org: 'udemy',
    title: 'Testing Python Applications with pytest',
    description:
      'Build a test suite you trust: pytest basics, fixtures, parametrisation, property-based testing with Hypothesis and system tests with Docker.',
    overview:
      '<p>Good tests let you change code on a Friday afternoon. This course takes you from your first assert to a fast, reliable suite that covers units, integrations and whole systems.</p>',
    bannerImage: COURSE_IMAGES.pytest,
    type: 'SELF_PACED',
    instructorKey: 'admin',
    createdDaysAgo: 150,
    sections: [
      {
        title: 'pytest Fundamentals',
        lessons: [
          {
            title: 'Writing Your First Tests',
            documents: [DOCUMENTS.pytestDocs],
            intro:
              'pytest finds files named <code>test_*.py</code>, runs every function that starts with <code>test_</code> and rewrites plain <code>assert</code> statements so failures explain themselves.',
            blocks: [
              {
                heading: 'A first test',
                code: "def slugify(title):\n    return '-'.join(title.lower().split())\n\ndef test_slugify_joins_words_with_dashes():\n    assert slugify('Hello World') == 'hello-world'"
              },
              {
                heading: 'Naming tests',
                bullets: [
                  'Name the behaviour, not the function: <code>test_rejects_expired_card</code>.',
                  'One reason to fail per test.',
                  'Arrange, act, assert, separated by blank lines.'
                ]
              }
            ]
          },
          {
            title: 'Fixtures and Parametrisation',
            video: VIDEOS.advancedPytest,
            intro:
              'Fixtures give tests the objects they need without copy-pasted setup. Parametrisation runs one test against many inputs.',
            blocks: [
              {
                heading: 'Fixture example',
                code: "@pytest.fixture\ndef cart():\n    return Cart(items=[Item('book', 12), Item('pen', 2)])\n\n@pytest.mark.parametrize('code, expected', [('SAVE10', 12.6), ('NONE', 14)])\ndef test_discounts(cart, code, expected):\n    assert cart.total(code) == expected"
              },
              {
                heading: 'Fixture scope',
                paragraphs: [
                  'Use function scope by default. Reach for <code>scope="session"</code> only for expensive, read-only resources such as a database container.'
                ]
              }
            ]
          },
          {
            title: 'Property-Based Testing with Hypothesis',
            video: VIDEOS.djangoTesting,
            intro:
              'Instead of picking examples yourself, describe the shape of valid input and let Hypothesis search for a case that breaks your code.',
            blocks: [
              {
                heading: 'A round-trip property',
                code: 'from hypothesis import given, strategies as st\n\n@given(st.text())\ndef test_encode_decode_round_trip(value):\n    assert decode(encode(value)) == value'
              },
              {
                heading: 'Good properties',
                bullets: [
                  'Round trips: decode(encode(x)) == x.',
                  'Invariants: a sorted list has the same length as the input.',
                  'Oracles: compare a fast implementation with a slow, obvious one.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'pytest-basics',
            title: 'pytest basics quiz',
            description: '<p>Check your understanding of discovery, fixtures and Hypothesis.</p>',
            questions: [
              {
                type: 'RADIO',
                title: 'Which file will pytest collect by default?',
                options: [
                  { label: 'checkout_spec.py' },
                  { label: 'test_checkout.py', correct: true },
                  { label: 'checkout.test' }
                ]
              },
              {
                type: 'FILL_BLANK',
                title: 'Decorate a function with <code>@pytest.____</code> to make it a fixture.',
                answers: ['fixture']
              },
              {
                type: 'TRUE_FALSE',
                title: 'Hypothesis generates inputs for you based on a strategy.',
                correct: true
              },
              {
                type: 'WORD_BANK',
                title: 'Complete the sentence.',
                template: 'Use ___ to share setup and ___ to run one test with many inputs.',
                correct: ['fixtures', 'parametrize'],
                distractors: ['mocks', 'conftest']
              }
            ]
          }
        ]
      },
      {
        title: 'Testing Real Systems',
        lessons: [
          {
            title: 'System Tests with Docker',
            video: VIDEOS.systemTesting,
            intro:
              'Some bugs only appear when real services talk to each other. Docker lets you start the same database and queue your production uses, run tests against them and throw them away.',
            blocks: [
              {
                heading: 'A database fixture',
                code: "@pytest.fixture(scope='session')\ndef database_url():\n    with PostgresContainer('postgres:16') as postgres:\n        yield postgres.get_connection_url()"
              },
              {
                heading: 'Keep them few',
                paragraphs: ['System tests are slow. Cover the critical paths here and leave edge cases to unit tests.']
              }
            ]
          },
          {
            title: 'Keeping the Suite Fast',
            intro:
              'A suite that takes twenty minutes stops being run. Measure first, then remove the waits, the network calls and the duplicated setup.',
            blocks: [
              {
                heading: 'Find the slow tests',
                code: 'pytest --durations=10\npytest -n auto  # parallel with pytest-xdist'
              },
              {
                heading: 'Usual suspects',
                bullets: [
                  '<code>time.sleep</code> waiting for something that could be polled.',
                  'Real HTTP calls that should be stubbed.',
                  'Database setup repeated per test instead of per session with transactions rolled back.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'test-plan',
            title: 'Write a test plan',
            description:
              '<p>Pick a feature from your own project and plan its tests across unit, integration and system levels.</p>',
            dueInDays: 12,
            questions: [
              {
                type: 'TEXTAREA',
                title: 'List the tests you would write for the feature, grouped by level.',
                sampleAnswers: [
                  'Unit: discount calculation for each code type and the rounding rules. Integration: checkout endpoint with a real database and a stubbed payment provider. System: one end-to-end purchase in Docker with the payment sandbox.'
                ]
              },
              { type: 'FILE_UPLOAD', title: 'Upload a screenshot of your test run, if you have one.' }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'docker',
    index: 6,
    org: 'udemy',
    title: 'Shipping Python Apps with Docker',
    description:
      'Package Python services in small, fast-building images, configure them the twelve-factor way and set up a release pipeline your team trusts.',
    overview:
      '<p>Learn how to go from "works on my machine" to a repeatable release. You will write a production Dockerfile, move configuration into the environment and design a pipeline that catches problems before users do.</p>',
    bannerImage: COURSE_IMAGES.docker,
    type: 'SELF_PACED',
    instructorKey: 'admin',
    createdDaysAgo: 120,
    sections: [
      {
        title: 'Containers for Python',
        lessons: [
          {
            title: 'Images, Layers and Caching',
            video: VIDEOS.dockerBuilds,
            intro:
              'Every instruction in a Dockerfile creates a layer, and Docker reuses layers that have not changed. Ordering instructions from least to most frequently changed turns a five-minute build into a ten-second one.',
            blocks: [
              {
                heading: 'A cache-friendly Dockerfile',
                code: 'FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD ["gunicorn", "app:create_app()", "--bind", "0.0.0.0:8000"]'
              },
              {
                heading: 'Smaller images',
                bullets: [
                  'Start from a slim base image.',
                  'Use multi-stage builds to leave compilers out of the final image.',
                  'Add a <code>.dockerignore</code> for virtualenvs, caches and git history.'
                ]
              }
            ]
          },
          {
            title: 'Configuration and Twelve-Factor Apps',
            video: VIDEOS.deploymentFriendly,
            intro:
              'The same image should run in staging and production. What changes between them is configuration, and configuration belongs in the environment.',
            blocks: [
              {
                heading: 'Read config once at startup',
                code: "import os\n\nDATABASE_URL = os.environ['DATABASE_URL']\nDEBUG = os.environ.get('DEBUG', 'false') == 'true'"
              },
              {
                heading: 'Deployment-friendly habits',
                bullets: [
                  'Log to stdout and let the platform collect it.',
                  'Expose a health check endpoint.',
                  'Handle SIGTERM and finish in-flight requests.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'docker-quiz',
            title: 'Docker fundamentals quiz',
            description: '<p>Layers, caching and configuration.</p>',
            questions: [
              {
                type: 'RADIO',
                title: 'Why copy <code>requirements.txt</code> before the rest of the source code?',
                options: [
                  { label: 'It makes the image smaller' },
                  { label: 'Dependency installs stay cached when only source code changes', correct: true },
                  { label: 'Docker requires it' }
                ]
              },
              {
                type: 'ORDERING',
                title: 'Order these Dockerfile instructions for the best caching.',
                items: [
                  'FROM python:3.12-slim',
                  'COPY requirements.txt .',
                  'RUN pip install -r requirements.txt',
                  'COPY . .'
                ]
              },
              {
                type: 'TRUE_FALSE',
                title: 'Database passwords should be baked into the image at build time.',
                correct: false
              }
            ]
          },
          {
            key: 'dockerfile-review',
            title: 'Dockerfile review',
            description: '<p>Share a Dockerfile for one of your services and explain the trade-offs you made.</p>',
            dueInDays: 7,
            questions: [
              {
                type: 'LINK',
                title: 'Link to your Dockerfile.',
                sampleLinks: ['https://github.com/fatima-alsayed/invoice-service/blob/main/Dockerfile']
              },
              {
                type: 'TEXTAREA',
                title: 'What did you do to keep the image small and the build fast?',
                sampleAnswers: [
                  'Multi-stage build: the first stage installs build tools and compiles wheels, the second copies only the wheels into python:3.12-slim. Requirements are copied before the source so dependency layers stay cached. The final image went from 1.1 GB to 180 MB.'
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Release Pipelines',
        lessons: [
          {
            title: 'Fast Feedback with Auto-Reload',
            video: VIDEOS.pythonAutoreloader,
            intro:
              'A short edit-run loop keeps you in flow. Mount your source into the container and let an auto-reloader restart the process when files change.',
            blocks: [
              {
                heading: 'Development compose file',
                code: 'services:\n  api:\n    build: .\n    command: flask --app app run --host 0.0.0.0 --reload\n    volumes:\n      - ./:/app\n    ports:\n      - "8000:5000"'
              },
              {
                heading: 'Keep dev and prod close',
                paragraphs: [
                  'Use the same base image and dependencies in development. Only the command and the mounted volume should differ.'
                ]
              }
            ]
          },
          {
            title: 'Continuous Delivery That Earns Trust',
            video: VIDEOS.canWeDeployYet,
            intro:
              'A pipeline is only useful if people trust it enough to deploy on a green build. That trust comes from fast, reliable checks and an easy way back.',
            blocks: [
              {
                heading: 'A pipeline in four stages',
                bullets: [
                  'Lint and unit tests on every push.',
                  'Build the image once and tag it with the commit.',
                  'Deploy that exact image to staging and run smoke tests.',
                  'Promote the same image to production.'
                ]
              },
              {
                heading: 'Plan the rollback',
                paragraphs: [
                  'Before you automate deploys, make sure you can redeploy the previous image in one command. Database migrations should be backwards compatible for one release.'
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'machine-learning',
    index: 7,
    org: 'udemy',
    title: 'Machine Learning Foundations',
    description:
      'Learn when machine learning is worth it, how to train and evaluate a first model with scikit-learn, and how to reason about uncertainty and ethics in data products.',
    overview:
      '<p>A practical introduction to machine learning for developers and analysts. You will train a text classifier, measure it honestly and learn to spot the projects where a simple rule would do better.</p>',
    bannerImage: COURSE_IMAGES.machineLearning,
    type: 'SELF_PACED',
    instructorKey: 'nkechi.eze',
    createdDaysAgo: 95,
    sections: [
      {
        title: 'Thinking About Machine Learning',
        lessons: [
          {
            title: 'When Machine Learning Is the Right Tool',
            video: VIDEOS.whenToUseMl,
            intro:
              'Machine learning shines when the rules are too many to write down but examples are easy to collect. It struggles when data is scarce, labels are noisy or a mistake is expensive.',
            blocks: [
              {
                heading: 'Ask these questions first',
                bullets: [
                  'Could a few hand-written rules get you 80% of the way?',
                  'Do you have thousands of labelled examples?',
                  'What happens when the model is wrong, and who notices?'
                ]
              },
              {
                heading: 'Start with a baseline',
                paragraphs: [
                  'Always compare against something simple, such as predicting the most common class. If your model cannot beat it clearly, you have learned something cheaply.'
                ]
              }
            ]
          },
          {
            title: 'What Is AI, Really?',
            video: YOUTUBE_VIDEOS.whatIsAi,
            intro:
              'Artificial intelligence, machine learning and deep learning are nested ideas. This short lesson untangles the vocabulary you will hear in the rest of the course.',
            blocks: [
              {
                heading: 'Three terms',
                bullets: [
                  '<strong>AI</strong>: any technique that makes a computer act intelligently.',
                  '<strong>Machine learning</strong>: AI that learns patterns from data instead of rules.',
                  '<strong>Deep learning</strong>: machine learning with many-layered neural networks.'
                ]
              },
              {
                heading: 'Supervised vs unsupervised',
                paragraphs: [
                  'Supervised learning uses labelled examples, like emails marked spam or not spam. Unsupervised learning finds structure without labels, such as grouping customers by behaviour.'
                ]
              }
            ]
          },
          {
            title: 'Working in Notebooks',
            video: VIDEOS.jupyterTeaching,
            intro:
              'Jupyter notebooks mix code, output and explanation in one document, which makes them ideal for exploring data and sharing results.',
            blocks: [
              {
                heading: 'Notebook hygiene',
                bullets: [
                  'Restart and run all before sharing.',
                  'Keep reusable code in a module and import it.',
                  'Pin library versions in a requirements file next to the notebook.'
                ]
              },
              {
                heading: 'Useful magics',
                code: '%load_ext autoreload\n%autoreload 2\n%timeit df.groupby("label").size()'
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'ml-concepts',
            title: 'Machine learning concepts check',
            description: '<p>Vocabulary, baselines and choosing the right problem.</p>',
            questions: [
              {
                type: 'RADIO',
                title: 'Sorting support tickets into categories using past labelled tickets is an example of:',
                options: [
                  { label: 'Unsupervised learning' },
                  { label: 'Supervised classification', correct: true },
                  { label: 'Reinforcement learning' }
                ]
              },
              {
                type: 'CHECKBOX',
                title: 'Which are good reasons to avoid machine learning for a problem?',
                options: [
                  { label: 'Only 40 labelled examples exist', correct: true },
                  { label: 'Three simple rules already work', correct: true },
                  { label: 'There are millions of labelled examples' }
                ]
              },
              {
                type: 'TRUE_FALSE',
                title: 'A model with 95% accuracy is always useful.',
                correct: false
              },
              {
                type: 'NUMERIC',
                title: '90 of 100 emails are not spam. What accuracy (in %) does always predicting "not spam" score?',
                correctValue: 90
              }
            ]
          }
        ]
      },
      {
        title: 'Building Models',
        lessons: [
          {
            title: 'Text Classification with Naive Bayes',
            video: VIDEOS.naiveBayes,
            intro:
              'Naive Bayes is fast, needs little data and is easy to explain, which makes it a great first model for text.',
            blocks: [
              {
                heading: 'Train and evaluate',
                code: 'from sklearn.feature_extraction.text import TfidfVectorizer\nfrom sklearn.naive_bayes import MultinomialNB\nfrom sklearn.pipeline import make_pipeline\n\nmodel = make_pipeline(TfidfVectorizer(), MultinomialNB())\nmodel.fit(train_texts, train_labels)\nprint(model.score(test_texts, test_labels))'
              },
              {
                heading: 'Measure honestly',
                bullets: [
                  'Split before you look at the data.',
                  'Report precision and recall, not only accuracy.',
                  'Read twenty misclassified examples by hand.'
                ]
              }
            ]
          },
          {
            title: 'Reasoning About Uncertainty',
            video: VIDEOS.decisionScience,
            intro:
              'A prediction without a sense of how sure the model is can be dangerous. Probabilistic thinking helps you decide what to do with a prediction, not just what it is.',
            blocks: [
              {
                heading: 'From probability to decision',
                paragraphs: [
                  'Combine the predicted probability with the cost of each mistake. A fraud model at 30% confidence might still justify a manual review if a missed fraud costs a hundred times more than a review.'
                ]
              },
              {
                heading: 'Calibrate',
                code: 'from sklearn.calibration import CalibratedClassifierCV\ncalibrated = CalibratedClassifierCV(model, cv=5).fit(X_train, y_train)'
              }
            ]
          },
          {
            title: 'Ethics for Data Products',
            video: VIDEOS.dataEthics,
            intro:
              'Models learn from historical data, including its biases. Builders are responsible for asking who could be harmed before a model ships.',
            blocks: [
              {
                heading: 'A pre-launch checklist',
                bullets: [
                  'Compare error rates across groups that matter for your users.',
                  'Document what the training data does and does not cover.',
                  'Give people a way to contest an automated decision.'
                ]
              },
              {
                heading: 'Data minimisation',
                paragraphs: [
                  'Collect only the features you need. Every extra column is a privacy risk and a possible source of proxy discrimination.'
                ]
              }
            ]
          },
          {
            title: 'Bonus: Serving a Model Behind an API',
            video: YOUTUBE_VIDEOS.machineLearningForEverybody,
            locked: true,
            intro:
              'This bonus lesson opens after the live model review. It shows how to wrap a trained pipeline in a small web service.',
            blocks: [
              {
                heading: 'A minimal service',
                code: "import joblib\nfrom fastapi import FastAPI\n\nmodel = joblib.load('model.joblib')\napp = FastAPI()\n\n@app.post('/predict')\ndef predict(payload: dict):\n    return {'label': model.predict([payload['text']])[0]}"
              },
              {
                heading: 'Before production',
                bullets: [
                  'Version the model file alongside the code.',
                  'Log inputs and predictions for monitoring.',
                  'Set a timeout and a fallback answer.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'classifier-project',
            title: 'Project: train a text classifier',
            description:
              '<p>Train a classifier on a dataset of your choice, report precision and recall and reflect on its failure cases.</p>',
            dueInDays: 10,
            questions: [
              {
                type: 'LINK',
                title: 'Link to your notebook.',
                sampleLinks: ['https://github.com/wei-zhang-ml/ticket-classifier/blob/main/notebook.ipynb']
              },
              {
                type: 'TEXTAREA',
                title: 'What kinds of examples does your model get wrong, and why?',
                sampleAnswers: [
                  'Most errors are short tickets with only a product name, like "billing app". There is not enough text for TF-IDF to separate billing questions from bug reports. Adding the ticket channel as a feature helped a little.'
                ]
              },
              { type: 'STAR', title: 'How confident are you about deploying this model?' }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'ux-design',
    index: 8,
    org: 'udemy',
    title: 'UX Design Fundamentals',
    description:
      'Learn the design thinking process, emotional and visual design, typography, learnable interfaces and accessibility on mobile.',
    overview:
      '<p>For developers, product managers and new designers who want to make interfaces people understand on first use. Each section ends with a practical review you can run on your own product.</p>',
    bannerImage: COURSE_IMAGES.uxDesign,
    type: 'SELF_PACED',
    instructorKey: 'camille.laurent',
    createdDaysAgo: 180,
    sections: [
      {
        title: 'Design Thinking',
        lessons: [
          {
            title: 'Design Thinking in Practice',
            video: VIDEOS.designThinkingPanel,
            intro:
              'Design thinking is a loop: understand the people you design for, define the problem, explore ideas, prototype and test. The value is in going around the loop quickly.',
            blocks: [
              {
                heading: 'The five stages',
                bullets: [
                  'Empathise: watch and interview real users.',
                  'Define: write the problem as a user need.',
                  'Ideate: generate many options before choosing.',
                  'Prototype: build the cheapest thing that answers a question.',
                  'Test: put it in front of users and listen.'
                ]
              },
              {
                heading: 'How might we',
                paragraphs: [
                  'Turn findings into "How might we" questions, for example: How might we help new users find their first project in under a minute?'
                ]
              }
            ]
          },
          {
            title: 'Designing for Emotion',
            video: VIDEOS.interfaceTherapy,
            intro:
              'People forgive a lot from an interface that feels friendly and clear, and very little from one that feels cold or confusing.',
            blocks: [
              {
                heading: 'Where emotion shows up',
                bullets: [
                  'Empty states that explain what to do next.',
                  'Error messages that say what happened and how to fix it.',
                  'Small moments of feedback when something succeeds.'
                ]
              },
              {
                heading: 'Write like a person',
                paragraphs: [
                  'Replace "Invalid input" with "Enter a date like 14 March 2026". Specific copy reduces support tickets and frustration.'
                ]
              }
            ]
          },
          {
            title: 'Typography and Layout',
            video: VIDEOS.webTypography,
            intro:
              'Most of an interface is text. Good typography sets a clear hierarchy, comfortable line lengths and consistent spacing.',
            blocks: [
              {
                heading: 'Practical rules',
                bullets: [
                  'Keep body text at 16px or larger on the web.',
                  'Aim for 45 to 75 characters per line.',
                  'Use one typeface with two or three weights before adding a second.'
                ]
              },
              {
                heading: 'A spacing scale',
                code: ':root {\n  --space-1: 4px;\n  --space-2: 8px;\n  --space-3: 16px;\n  --space-4: 24px;\n  --space-5: 40px;\n}'
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'ux-principles',
            title: 'UX principles quiz',
            description: '<p>Design thinking stages, emotional design and typography.</p>',
            questions: [
              {
                type: 'ORDERING',
                title: 'Put the design thinking stages in order.',
                items: ['Empathise', 'Define', 'Ideate', 'Prototype', 'Test']
              },
              {
                type: 'RADIO',
                title: 'Which error message is most helpful?',
                options: [
                  { label: 'Error 422' },
                  { label: 'Invalid input' },
                  { label: 'Enter a date like 14 March 2026', correct: true }
                ]
              },
              {
                type: 'CHECKBOX',
                title: 'Which typography choices improve readability?',
                options: [
                  { label: 'Lines of 45 to 75 characters', correct: true },
                  { label: 'Body text at 11px' },
                  { label: 'A consistent spacing scale', correct: true }
                ]
              },
              {
                type: 'TRUE_FALSE',
                title: 'A prototype should be as polished as the final product.',
                correct: false
              }
            ]
          }
        ]
      },
      {
        title: 'Usable and Accessible',
        lessons: [
          {
            title: 'Making Interfaces Easy to Learn',
            video: VIDEOS.learnableUx,
            intro:
              'A learnable interface teaches itself. Users should be able to guess what a control does and recover quickly when they guess wrong.',
            blocks: [
              {
                heading: "Nielsen's heuristics in brief",
                bullets: [
                  'Visibility of system status.',
                  'Match between the system and the real world.',
                  'User control and freedom, including undo.',
                  'Consistency and standards.',
                  'Recognition rather than recall.'
                ]
              },
              {
                heading: 'Run a heuristic review',
                paragraphs: [
                  'Walk through one task with the heuristics beside you and note every place the interface breaks one. Rate each issue by how often it happens and how bad it is.'
                ]
              }
            ]
          },
          {
            title: 'Accessibility on Mobile',
            video: VIDEOS.mobileAccessibility,
            intro:
              'Accessible apps work with screen readers, switch controls, large text and voice. Designing for them makes the app better for everyone.',
            blocks: [
              {
                heading: 'Checklist',
                bullets: [
                  'Touch targets at least 44 by 44 points.',
                  'Every icon button has an accessible label.',
                  'Layouts survive the largest text size.',
                  'Colour is never the only way to show state.'
                ]
              },
              {
                heading: 'Test with the real tools',
                paragraphs: [
                  'Turn on VoiceOver or TalkBack and complete your main task without looking at the screen. It takes ten minutes and finds most problems.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'heuristic-review',
            title: 'Heuristic review of a real app',
            description:
              '<p>Review one task in an app you use every day against the usability heuristics. Share your notes and three prioritised issues.</p>',
            dueInDays: 4,
            questions: [
              {
                type: 'TEXTAREA',
                title: 'Describe the three most serious usability issues you found and how you would fix them.',
                sampleAnswers: [
                  '1. The banking app hides the transfer limit until the last step, which breaks visibility of system status. Show it on the amount screen. 2. The back button discards the whole form, with no undo. Keep a draft. 3. Icons in the tab bar have no labels, so new users rely on recall. Add short labels.',
                  'Booking a train ticket: the date picker starts on today even when I search for a return trip, the error for a missing railcard appears only after payment details, and the seat map uses only colour to show availability. I would default the picker to the outbound date, validate the railcard earlier and add a pattern to unavailable seats.'
                ]
              },
              {
                type: 'LINK',
                title: 'Link to your annotated screenshots (Figma, Miro or a shared folder).',
                sampleLinks: [
                  'https://www.figma.com/file/heuristic-review-banking-app',
                  'https://miro.com/app/board/train-booking-review'
                ]
              },
              { type: 'THUMBS', title: 'Was this exercise useful?' }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'product-management',
    index: 9,
    org: 'udemy',
    title: 'Product Management in Practice',
    description:
      'A live, cohort-style class on discovery, problem framing, prioritisation and roadmaps, taught through weekly sessions and real case studies.',
    overview:
      '<p>Join five live sessions with Tom Hargreaves. Each session mixes a short talk, a worked case study and breakout practice. Recordings are posted the same day.</p><p>Bring a product you work on; every exercise is applied to it.</p>',
    bannerImage: COURSE_IMAGES.productManagement,
    type: 'LIVE_CLASS',
    instructorKey: 'tom.hargreaves',
    createdDaysAgo: 30,
    sections: [
      {
        title: 'Discovery',
        lessons: [
          {
            title: 'Kickoff: What Product Managers Actually Do',
            live: { startsInMinutes: -9 * DAY_MINUTES, durationMinutes: 60, recording: VIDEOS.startupAdvice },
            intro:
              'Our first session sets expectations for the course and maps the work of a product manager: understanding customers, choosing problems, aligning the team and measuring outcomes.',
            blocks: [
              {
                heading: 'Agenda',
                bullets: [
                  'Introductions and the product each of you brought.',
                  'Outcomes versus outputs.',
                  'The weekly rhythm of a product team.'
                ]
              },
              {
                heading: 'Before next session',
                paragraphs: ['Write down the three assumptions about your customers that you are least sure of.']
              }
            ]
          },
          {
            title: 'Customer Interviews That Reveal Real Problems',
            live: {
              startsInMinutes: -2 * DAY_MINUTES,
              durationMinutes: 75,
              recording: VIDEOS.fastProductDevelopment
            },
            intro:
              'Customers are good at describing their past behaviour and bad at predicting their future. This session practises interviews that focus on what people actually did.',
            blocks: [
              {
                heading: 'Questions that work',
                bullets: [
                  '"Tell me about the last time you..."',
                  '"What did you try before this?"',
                  '"What happened next?"'
                ]
              },
              {
                heading: 'Questions to avoid',
                bullets: ['"Would you use a feature that..."', '"How much would you pay for..."']
              }
            ]
          },
          {
            title: 'Writing Problem Statements',
            live: { startsInMinutes: -15, durationMinutes: 90 },
            intro:
              'A clear problem statement keeps the team from jumping to solutions. In this session we turn interview notes into statements the whole team can rally around.',
            blocks: [
              {
                heading: 'A template',
                paragraphs: [
                  '[User] needs a way to [job to be done] because [insight]. Today they [current workaround], which costs them [pain].'
                ]
              },
              {
                heading: 'In the breakout',
                bullets: [
                  'Draft one statement from your own interviews.',
                  'Swap with a partner and remove every solution word.',
                  'Agree on a metric that would show the problem is solved.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'problem-statement',
            title: 'Assignment: your problem statement',
            description:
              '<p>Submit a problem statement for the product you brought, with the evidence behind it. Tom reviews each one before the prioritisation workshop.</p>',
            dueInDays: 1,
            questions: [
              {
                type: 'TEXTAREA',
                title: 'Write your problem statement using the template from the session.',
                sampleAnswers: [
                  'Clinic receptionists need a way to fill last-minute cancellations because empty slots cost about 8% of weekly revenue. Today they phone patients from a paper waiting list, which takes 20 minutes per slot and often fails outside office hours.',
                  'First-time freelancers need a way to know how much tax to set aside from each invoice because they are surprised by their bill every January. Today they guess a percentage or ask friends, which leaves many short when payment is due.'
                ]
              },
              {
                type: 'SHORT_ANSWER',
                title: 'Name the metric that would show the problem is solved.',
                accepted: ['fill rate', 'slot fill rate', 'cancellations filled'],
                sampleAnswers: [
                  'Percentage of cancelled slots refilled within 2 hours',
                  'Share of users with tax saved covering their bill'
                ]
              },
              {
                type: 'RADIO',
                title: 'Which of these is an outcome rather than an output?',
                options: [
                  { label: 'Ship the waiting-list feature' },
                  { label: 'Reduce unfilled slots by 30%', correct: true },
                  { label: 'Write the PRD' }
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Delivery',
        lessons: [
          {
            title: 'Prioritisation Frameworks Workshop',
            live: { startsInMinutes: DAY_MINUTES + 120, durationMinutes: 90 },
            intro:
              'RICE, Kano and opportunity scoring are tools for a conversation, not a replacement for judgement. We will score a real backlog together and discuss where the numbers mislead.',
            blocks: [
              {
                heading: 'RICE',
                code: 'score = (reach * impact * confidence) / effort'
              },
              {
                heading: 'Bring',
                bullets: ['Your top ten backlog items.', 'Rough reach numbers from analytics.']
              }
            ]
          },
          {
            title: 'Roadmaps and Stakeholder Updates',
            live: { startsInMinutes: 4 * DAY_MINUTES + 60, durationMinutes: 60 },
            intro:
              'A roadmap communicates direction and confidence, not a list of dates. This final session covers now-next-later roadmaps and updates leadership actually reads.',
            blocks: [
              {
                heading: 'Now, next, later',
                bullets: [
                  'Now: committed work with high confidence.',
                  'Next: problems we will tackle once current work lands.',
                  'Later: bets we are still learning about.'
                ]
              },
              {
                heading: 'A five-line update',
                paragraphs: ['What we shipped, what we learned, what changed, what we need and what is next.']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'leading-teams',
    index: 10,
    org: 'udemy',
    title: 'Leading Engineering Teams',
    description:
      'Live sessions for new and aspiring engineering managers: everyday leadership, the shift from engineer to manager, feedback and succession planning.',
    overview:
      '<p>Four live sessions, each with a pre-watch talk and a practical assignment. Designed for tech leads, new managers and senior engineers deciding whether management is for them.</p>',
    bannerImage: COURSE_IMAGES.leadership,
    type: 'LIVE_CLASS',
    instructorKey: 'tom.hargreaves',
    createdDaysAgo: 25,
    sections: [
      {
        title: 'Foundations',
        lessons: [
          {
            title: 'Leadership Is Everyday Behaviour',
            live: { startsInMinutes: -5 * DAY_MINUTES, durationMinutes: 60, recording: VIDEOS.everydayLeadership },
            intro:
              'Leadership is not a title. It shows up in small daily choices: how you run a meeting, how you respond to a mistake, who you make room for.',
            blocks: [
              {
                heading: 'Discussion prompts',
                bullets: [
                  'Describe a moment when someone changed how you saw your work.',
                  'Which of your habits would you not want your team to copy?'
                ]
              },
              {
                heading: 'Takeaway',
                paragraphs: [
                  'Pick one recurring meeting this week and decide what you want people to feel when they leave it.'
                ]
              }
            ]
          },
          {
            title: 'From Engineer to Manager',
            video: VIDEOS.techManagement,
            live: { startsInMinutes: 2 * DAY_MINUTES + 30, durationMinutes: 60 },
            intro:
              'The skills that made you a strong engineer are not the ones that make you a good manager. Watch the talk before the session; we will discuss what surprised you.',
            blocks: [
              {
                heading: 'What changes',
                bullets: [
                  'Your output becomes the output of your team.',
                  'Your calendar fills with conversations, not code.',
                  'Feedback arrives slowly and indirectly.'
                ]
              },
              {
                heading: 'First 90 days',
                paragraphs: ['Hold a one-to-one with every report in week one and ask what they need from you.']
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'one-on-one-reflection',
            title: 'One-to-one reflection',
            description: '<p>Run a one-to-one using the agenda from the course and reflect on how it went.</p>',
            dueInDays: 3,
            questions: [
              {
                type: 'TEXTAREA',
                title: 'What did you learn from your one-to-one, and what will you change next time?',
                sampleAnswers: [
                  'I let my report set the agenda for the first time. She raised a concern about on-call load that never came up in standups. Next time I will ask "what is the one thing that would make your week easier" at the start rather than the end.'
                ]
              },
              { type: 'STAR', title: 'How useful was the agenda template?' }
            ]
          }
        ]
      },
      {
        title: 'Growing People',
        lessons: [
          {
            title: 'Feedback That Changes Behaviour',
            video: VIDEOS.feedbackThatHelps,
            live: { startsInMinutes: 6 * DAY_MINUTES + 60, durationMinutes: 75 },
            intro:
              'Feedback works when it is specific, timely and part of a system people trust. We will practise the situation-behaviour-impact model in pairs.',
            blocks: [
              {
                heading: 'Situation, behaviour, impact',
                paragraphs: [
                  '"In yesterday\'s planning meeting (situation), you summarised the trade-offs before we voted (behaviour). It saved us twenty minutes and everyone understood the decision (impact)."'
                ]
              },
              {
                heading: 'Make it routine',
                bullets: [
                  'Give positive feedback at least as often as corrective.',
                  'Ask for feedback on yourself first.'
                ]
              }
            ]
          },
          {
            title: 'Succession Planning and Delegation',
            video: VIDEOS.successionPlanning,
            live: { startsInMinutes: 13 * DAY_MINUTES + 60, durationMinutes: 60 },
            intro:
              'If the team cannot run without you, you have built a bottleneck, not a team. Delegation and succession planning protect the team and free you to grow.',
            blocks: [
              {
                heading: 'Delegation levels',
                bullets: [
                  'Do it as I described.',
                  'Recommend, and I decide.',
                  'Decide, and tell me.',
                  'Decide on your own.'
                ]
              },
              {
                heading: 'Exercise',
                paragraphs: ['List every recurring task only you can do, and name who could do each in six months.']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'digital-marketing',
    index: 11,
    org: 'udemy',
    title: 'Digital Marketing Essentials',
    description:
      'Positioning, permission marketing, email campaigns and measurement for marketers, founders and product teams.',
    overview:
      '<p>A practical course for anyone who has to get a product in front of the right people. You will write a positioning statement, plan a campaign and choose the few numbers worth tracking.</p>',
    bannerImage: COURSE_IMAGES.marketing,
    type: 'SELF_PACED',
    instructorKey: 'camille.laurent',
    createdDaysAgo: 160,
    sections: [
      {
        title: 'Strategy',
        lessons: [
          {
            title: 'Marketing Starts With a Point of View',
            video: VIDEOS.physicsOfMarketing,
            intro:
              'Brands are built on a few principles applied consistently. This lesson borrows ideas from physics to explain why focus and consistency beat volume.',
            blocks: [
              {
                heading: 'Key ideas',
                bullets: [
                  'Your brand is what people say about you when you are not in the room.',
                  'Every action either reinforces or erodes that impression.',
                  'Focus on one audience before trying to reach everyone.'
                ]
              },
              {
                heading: 'Apply it',
                paragraphs: ['Write one sentence that describes what you want customers to say about you.']
              }
            ]
          },
          {
            title: 'Permission and Remarkable Products',
            video: VIDEOS.transformMarketing,
            intro:
              'Interrupting people with ads gets more expensive every year. Earning permission to talk to them, and building something worth talking about, compounds instead.',
            blocks: [
              {
                heading: 'Permission marketing',
                bullets: [
                  'Offer something useful in exchange for attention.',
                  'Keep every message anticipated, personal and relevant.',
                  'Make leaving as easy as joining.'
                ]
              },
              {
                heading: 'Remarkable',
                paragraphs: [
                  'A remarkable product is one people choose to remark on. Ask what detail of yours would make someone tell a friend.'
                ]
              }
            ]
          },
          {
            title: 'Positioning Your Product',
            intro:
              'Positioning defines who your product is for, what it replaces and why it is better for them. Everything else in marketing builds on it.',
            blocks: [
              {
                heading: 'Positioning statement',
                paragraphs: [
                  'For [target customer] who [need], [product] is a [category] that [key benefit]. Unlike [alternative], we [differentiator].'
                ]
              },
              {
                heading: 'Test it',
                bullets: [
                  'Show it to five customers and ask them to explain it back.',
                  'Remove any word a competitor could also claim.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'marketing-basics',
            title: 'Marketing strategy quiz',
            description: '<p>Brand, permission and positioning.</p>',
            questions: [
              {
                type: 'RADIO',
                title: 'Which is an example of permission marketing?',
                options: [
                  { label: 'A pop-up ad on a news site' },
                  { label: 'A weekly newsletter people signed up for', correct: true },
                  { label: 'A purchased email list' }
                ]
              },
              {
                type: 'CHECKBOX',
                title: 'Which belong in a positioning statement?',
                options: [
                  { label: 'Target customer', correct: true },
                  { label: 'Key benefit', correct: true },
                  { label: 'Office address' },
                  { label: 'Main alternative', correct: true }
                ]
              },
              {
                type: 'TRUE_FALSE',
                title: 'Targeting everyone is the fastest way to build a brand.',
                correct: false
              },
              {
                type: 'FILL_BLANK',
                title: 'Good permission marketing is anticipated, personal and ____.',
                answers: ['relevant']
              }
            ]
          }
        ]
      },
      {
        title: 'Channels and Measurement',
        lessons: [
          {
            title: 'Email Campaigns That Get Opened',
            intro:
              'Email is still the channel you own outright. Good campaigns respect the reader: one message, one call to action and a subject line that tells the truth.',
            blocks: [
              {
                heading: 'Anatomy of a campaign email',
                bullets: [
                  'A subject line under 50 characters.',
                  'Preview text that adds information instead of repeating the subject.',
                  'One primary button above the fold.'
                ]
              },
              {
                heading: 'Send fewer, better emails',
                paragraphs: [
                  'Segment by behaviour. A message for people who started a trial last week beats a blast to the whole list.'
                ]
              }
            ]
          },
          {
            title: 'Measuring What Matters',
            intro:
              'Vanity metrics go up and to the right without telling you whether the business is healthier. Pick a few numbers that connect to revenue or retention.',
            blocks: [
              {
                heading: 'Core formulas',
                code: 'conversion rate = conversions / visitors\ncustomer acquisition cost = marketing spend / new customers\npayback months = CAC / monthly gross margin per customer'
              },
              {
                heading: 'Worked example',
                paragraphs: [
                  'A campaign costs 2,000 and brings 40 new customers, so CAC is 50. If each customer brings 25 of gross margin per month, payback takes two months.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'campaign-brief',
            title: 'Campaign brief',
            description: '<p>Plan a small email campaign for a product you know and estimate its economics.</p>',
            dueInDays: 6,
            questions: [
              {
                type: 'TEXTAREA',
                title: 'Write the brief: audience, message, call to action and success metric.',
                sampleAnswers: [
                  'Audience: trial users who created a project but invited nobody. Message: teams that invite a colleague in week one are twice as likely to stay. CTA: invite a teammate. Success: 15% of the segment sends an invite within 7 days.'
                ]
              },
              {
                type: 'NUMERIC',
                title: 'A campaign costs 3,000 and wins 60 customers. What is the CAC?',
                correctValue: 50
              },
              {
                type: 'LINK',
                title: 'Link to a draft of the email (Google Doc or your email tool preview).',
                sampleLinks: ['https://docs.google.com/document/d/campaign-brief-draft']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'productivity',
    index: 12,
    org: 'udemy',
    title: 'Productivity and Time Management',
    description:
      'Plan your week, protect focus time, run better meetings and communicate asynchronously with a distributed team.',
    overview:
      "<p>Short, practical lessons on getting the important work done. Built around Randy Pausch's classic lecture on time management and updated for remote and hybrid teams.</p>",
    bannerImage: COURSE_IMAGES.productivity,
    type: 'SELF_PACED',
    instructorKey: 'tom.hargreaves',
    createdDaysAgo: 240,
    sections: [
      {
        title: 'Managing Your Time',
        lessons: [
          {
            title: 'Time Management Fundamentals',
            video: VIDEOS.timeManagement,
            intro:
              'Time is the one resource you cannot get back. Managing it starts with knowing where it goes and deciding what not to do.',
            blocks: [
              {
                heading: 'Ideas from the lecture',
                bullets: [
                  'Being successful does not mean doing more things; it means doing the right things.',
                  'Keep a time journal for two weeks to see where your hours go.',
                  'Do the ugly task first.'
                ]
              },
              {
                heading: 'Urgent vs important',
                paragraphs: [
                  'Sort your list into four boxes. Spend most of your planned time on important but not urgent work.'
                ]
              }
            ]
          },
          {
            title: 'Deep Work and Focus Blocks',
            intro:
              'Complex work needs long, uninterrupted stretches. Protect them on your calendar the same way you protect meetings.',
            blocks: [
              {
                heading: 'Set up a focus block',
                bullets: [
                  'Book 90 to 120 minutes, ideally at the same time each day.',
                  'Turn off notifications and set a chat status.',
                  'Decide the single outcome before you start.'
                ]
              },
              {
                heading: 'Shut down deliberately',
                paragraphs: [
                  "At the end of the day, write tomorrow's first task. It makes starting easier and stops work following you home."
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'productivity-check',
            title: 'Productivity check',
            description: '<p>Three questions on planning and focus.</p>',
            questions: [
              {
                type: 'TRUE_FALSE',
                title: 'Urgent tasks are always the most important ones.',
                correct: false
              },
              {
                type: 'RADIO',
                title: 'How long should a focus block usually be?',
                options: [
                  { label: '15 minutes' },
                  { label: '90 to 120 minutes', correct: true },
                  { label: 'A whole day' }
                ]
              },
              {
                type: 'ORDERING',
                title: 'Order a weekly planning routine.',
                items: [
                  'Review last week',
                  'List outcomes for this week',
                  'Block focus time',
                  'Schedule everything else'
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Working With Others',
        lessons: [
          {
            title: 'Async Communication for Distributed Teams',
            video: VIDEOS.remoteTeaching,
            intro:
              'When a team spans time zones, writing becomes the main way work moves forward. Clear async messages save meetings and keep people unblocked.',
            blocks: [
              {
                heading: 'A good async message',
                bullets: [
                  'Context first, then the ask, then the deadline.',
                  'One topic per thread.',
                  'Say what you will do if you do not hear back.'
                ]
              },
              {
                heading: 'Example',
                paragraphs: [
                  '"We need to choose a payment provider by Friday. I recommend Provider B because of lower fees in Europe. If there are no objections by Thursday noon, I will sign the contract."'
                ]
              }
            ]
          },
          {
            title: 'Running Meetings Worth Attending',
            intro:
              'A meeting is worth having when it needs real-time discussion to reach a decision. Everything else can be a document.',
            blocks: [
              {
                heading: 'Before',
                bullets: ['Share an agenda with the decision you need.', 'Invite only people who contribute or decide.']
              },
              {
                heading: 'After',
                bullets: [
                  'Write down decisions and owners within the hour.',
                  'Cancel the next one if it is no longer needed.'
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'security-awareness',
    index: 13,
    org: 'udemy',
    title: 'Security Awareness Training 2026',
    description:
      'Mandatory annual security training: phishing, passwords and MFA, early warning systems and how to report an incident.',
    overview:
      '<p>Required for every employee once a year. It takes about 40 minutes and ends with a short quiz. Complete it before your due date to stay compliant.</p>',
    bannerImage: COURSE_IMAGES.securityAwareness,
    type: 'COMPLIANCE',
    instructorKey: 'admin',
    createdDaysAgo: 60,
    compliance: {
      retakeIntervalMonths: 12,
      gracePeriodDays: 7,
      reminderDaysBefore: COMPLIANCE_REMINDERS,
      isMandatory: true,
      framework: 'ISO'
    },
    sections: [
      {
        title: 'Recognising Threats',
        lessons: [
          {
            title: 'Recognising Phishing',
            video: VIDEOS.securityBootcamp,
            documents: [DOCUMENTS.owaspTopTen],
            intro:
              'Phishing is still the most common way attackers get in. Most attempts share a few tells you can learn to spot in seconds.',
            blocks: [
              {
                heading: 'Red flags',
                bullets: [
                  'Urgency: "your account will be closed today".',
                  'A sender address that is almost right.',
                  'Links whose real destination differs from the text.',
                  'Requests for passwords, codes or gift cards.'
                ]
              },
              {
                heading: 'If in doubt',
                paragraphs: [
                  'Do not click. Open the service directly from your bookmarks or report the message with the Report Phishing button.'
                ]
              }
            ]
          },
          {
            title: 'Passwords, Passkeys and MFA',
            documents: [DOCUMENTS.nistDigitalIdentity],
            intro:
              'Stolen passwords cause most account takeovers. A password manager, unique passwords and multi-factor authentication stop nearly all of them.',
            blocks: [
              {
                heading: 'Our policy',
                bullets: [
                  'Use the company password manager for every work account.',
                  'Turn on MFA everywhere it is offered; prefer passkeys or an authenticator app over SMS.',
                  'Never share a one-time code, even with IT.'
                ]
              },
              {
                heading: 'Why length beats complexity',
                paragraphs: [
                  'A four-word passphrase is easier to remember and harder to crack than a short password full of symbols.'
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Responding',
        lessons: [
          {
            title: 'Honeypots, Canaries and Early Warning',
            video: VIDEOS.deceptiveSecurity,
            intro:
              'Security teams plant decoys that no legitimate user should touch. When one fires, they know something is wrong long before damage is done.',
            blocks: [
              {
                heading: 'What this means for you',
                bullets: [
                  'If you are asked about access to an unusual file, answer honestly and quickly.',
                  'Never try to test security controls on your own.'
                ]
              },
              {
                heading: 'Defence in depth',
                paragraphs: [
                  'No single control is perfect. Training, MFA, monitoring and decoys together make an attack slow and noisy.'
                ]
              }
            ]
          },
          {
            title: 'Reporting an Incident',
            intro:
              'Fast reporting limits damage. You will never be blamed for reporting something that turns out to be harmless.',
            blocks: [
              {
                heading: 'Report immediately if you',
                bullets: [
                  'Clicked a suspicious link or entered credentials.',
                  'Lost a laptop, phone or badge.',
                  'Sent confidential data to the wrong person.'
                ]
              },
              {
                heading: 'How',
                paragraphs: [
                  'Email security@udemy-test.demo or use the #security-help channel. Include what happened, when, and which accounts or devices are involved.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'security-quiz',
            title: 'Security awareness assessment',
            description: '<p>Answer all questions to complete your annual training.</p>',
            questions: [
              {
                type: 'CHECKBOX',
                title: 'Which are common signs of phishing?',
                options: [
                  { label: 'Urgent deadlines', correct: true },
                  { label: 'A sender domain with a small typo', correct: true },
                  { label: 'A message from a colleague you expected' },
                  { label: 'A request for a one-time code', correct: true }
                ]
              },
              {
                type: 'RADIO',
                title: 'Which second factor is the strongest?',
                options: [{ label: 'SMS code' }, { label: 'Security question' }, { label: 'Passkey', correct: true }]
              },
              {
                type: 'TRUE_FALSE',
                title: 'You should wait until you are sure before reporting a possible incident.',
                correct: false
              },
              {
                type: 'ORDERING',
                title: 'You clicked a phishing link and entered your password. Order the steps.',
                items: [
                  'Disconnect from the network',
                  'Report to security',
                  'Change the password',
                  'Review recent account activity'
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'gdpr',
    index: 14,
    org: 'udemy',
    title: 'Data Privacy and GDPR Essentials',
    description:
      'Annual privacy training covering personal data, lawful basis, subject access requests and the 72-hour breach notification rule.',
    overview:
      '<p>Everyone who handles customer or employee data must complete this course every year. It explains your obligations under the GDPR in plain language with examples from daily work.</p>',
    bannerImage: COURSE_IMAGES.privacy,
    type: 'COMPLIANCE',
    instructorKey: 'nkechi.eze',
    createdDaysAgo: 75,
    compliance: {
      retakeIntervalMonths: 12,
      gracePeriodDays: 5,
      reminderDaysBefore: COMPLIANCE_REMINDERS,
      isMandatory: true,
      framework: 'GDPR'
    },
    sections: [
      {
        title: 'Principles',
        lessons: [
          {
            title: 'Personal Data and Lawful Basis',
            intro:
              'Personal data is any information that identifies a person directly or indirectly. You need a lawful basis for every way you use it.',
            blocks: [
              {
                heading: 'Examples of personal data',
                bullets: [
                  'Name, email and phone number.',
                  'IP address and device identifiers.',
                  'Support tickets that mention a customer.'
                ]
              },
              {
                heading: 'The six lawful bases',
                bullets: [
                  'Consent',
                  'Contract',
                  'Legal obligation',
                  'Vital interests',
                  'Public task',
                  'Legitimate interests'
                ]
              }
            ]
          },
          {
            title: 'Privacy by Design',
            video: VIDEOS.dataEthics,
            intro:
              'The cheapest time to protect personal data is before it is collected. Privacy by design means asking privacy questions at the start of every project.',
            blocks: [
              {
                heading: 'Questions for every new feature',
                bullets: [
                  'What personal data does it need, and why?',
                  'How long will we keep it?',
                  'Who can access it?'
                ]
              },
              {
                heading: 'Minimise and pseudonymise',
                paragraphs: [
                  'Collect less, keep it for less time and replace direct identifiers with ids wherever analysis allows.'
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Daily Practice',
        lessons: [
          {
            title: 'Handling Subject Access Requests',
            intro:
              'Anyone can ask what data we hold about them. We must answer within one month, so requests need to reach the privacy team quickly.',
            blocks: [
              {
                heading: 'If you receive a request',
                bullets: [
                  'Forward it to privacy@udemy-test.demo the same day.',
                  'Do not ask the person why they want the data.',
                  'Do not delete anything related to the request.'
                ]
              },
              {
                heading: 'Other rights',
                paragraphs: [
                  'People can also ask us to correct, delete or export their data, or to stop certain processing.'
                ]
              }
            ]
          },
          {
            title: 'Data Breaches: The 72-Hour Rule',
            intro:
              'A personal data breach must be reported to the regulator within 72 hours of becoming aware of it. The clock starts when anyone in the company notices.',
            blocks: [
              {
                heading: 'What counts as a breach',
                bullets: [
                  'An email with customer data sent to the wrong recipient.',
                  'A lost unencrypted laptop.',
                  'Unauthorised access to a database.'
                ]
              },
              {
                heading: 'Your part',
                paragraphs: [
                  'Report suspected breaches to the security team immediately. They decide whether notification is required.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'gdpr-quiz',
            title: 'GDPR knowledge check',
            description: '<p>Complete this check to finish the annual privacy training.</p>',
            questions: [
              {
                type: 'NUMERIC',
                title: 'Within how many hours must a qualifying breach be reported to the regulator?',
                correctValue: 72
              },
              {
                type: 'TRUE_FALSE',
                title: 'An IP address can be personal data.',
                correct: true
              },
              {
                type: 'RADIO',
                title: 'A customer asks for a copy of their data. What do you do?',
                options: [
                  { label: 'Ask why they need it' },
                  { label: 'Forward the request to the privacy team the same day', correct: true },
                  { label: 'Export it yourself from the CRM' }
                ]
              },
              {
                type: 'CHECKBOX',
                title: 'Which are lawful bases under the GDPR?',
                options: [
                  { label: 'Consent', correct: true },
                  { label: 'Contract', correct: true },
                  { label: 'Convenience' },
                  { label: 'Legitimate interests', correct: true }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'code-of-conduct',
    index: 15,
    org: 'udemy',
    title: 'Code of Conduct and Business Ethics',
    description:
      'Annual refresher on our code of conduct: conflicts of interest, gifts, respectful behaviour and how to raise a concern.',
    overview:
      '<p>Our code of conduct describes how we treat customers, partners and each other. This refresher takes about 25 minutes and must be completed every year.</p>',
    bannerImage: COURSE_IMAGES.codeOfConduct,
    type: 'COMPLIANCE',
    instructorKey: 'admin',
    createdDaysAgo: 200,
    compliance: {
      retakeIntervalMonths: 12,
      gracePeriodDays: 14,
      reminderDaysBefore: COMPLIANCE_REMINDERS,
      isMandatory: true,
      framework: 'CUSTOM'
    },
    sections: [
      {
        title: 'Our Standards',
        lessons: [
          {
            title: 'Why We Have a Code of Conduct',
            video: VIDEOS.everydayLeadership,
            intro:
              'A code of conduct turns shared values into everyday decisions. It protects customers, colleagues and the company, and it applies to everyone from interns to the board.',
            blocks: [
              {
                heading: 'Our principles',
                bullets: [
                  'Act with integrity.',
                  'Treat people with respect.',
                  'Protect information entrusted to us.',
                  'Speak up.'
                ]
              },
              {
                heading: 'When the code is silent',
                paragraphs: [
                  'Ask: would I be comfortable if this decision were reported in the news? If not, ask your manager or the ethics team.'
                ]
              }
            ]
          },
          {
            title: 'Conflicts of Interest and Gifts',
            intro:
              'A conflict of interest arises when personal interests could influence, or seem to influence, a work decision. Declaring it early is what matters.',
            blocks: [
              {
                heading: 'Declare if you',
                bullets: [
                  'Hire or manage a relative or partner.',
                  'Hold shares in a supplier or competitor.',
                  'Do paid work for another company.'
                ]
              },
              {
                heading: 'Gifts',
                paragraphs: [
                  'You may accept gifts worth up to 50 per year from any one business partner. Never accept cash or anything offered during a tender.'
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Speaking Up',
        lessons: [
          {
            title: 'Respect and Inclusion at Work',
            intro:
              'Everyone deserves to work free from harassment and discrimination. Respect includes how we speak in meetings, in chat and at company events.',
            blocks: [
              {
                heading: 'Not acceptable',
                bullets: [
                  'Jokes or comments about protected characteristics.',
                  'Unwanted physical contact or advances.',
                  'Excluding colleagues from information they need.'
                ]
              },
              {
                heading: 'Bystanders matter',
                paragraphs: [
                  'If you see something, you can interrupt, check in with the person affected afterwards or report it.'
                ]
              }
            ]
          },
          {
            title: 'How to Raise a Concern',
            intro:
              'You can raise a concern with your manager, HR, the ethics team or the anonymous hotline. Retaliation against anyone who speaks up in good faith is prohibited.',
            blocks: [
              {
                heading: 'Channels',
                bullets: [
                  'Your manager or their manager.',
                  'ethics@udemy-test.demo',
                  'The anonymous hotline, available 24 hours a day.'
                ]
              },
              {
                heading: 'What happens next',
                paragraphs: [
                  'The ethics team acknowledges every report within two working days and keeps you informed where possible.'
                ]
              }
            ]
          }
        ],
        exercises: [
          {
            key: 'conduct-quiz',
            title: 'Code of conduct check',
            description: '<p>Complete this check to finish the annual refresher.</p>',
            questions: [
              {
                type: 'TRUE_FALSE',
                title: 'You must declare a conflict of interest even if you think it will not affect your decisions.',
                correct: true
              },
              {
                type: 'RADIO',
                title: 'A supplier offers you concert tickets during a tender. What do you do?',
                options: [
                  { label: 'Accept if they cost less than 50' },
                  { label: 'Decline and tell your manager', correct: true },
                  { label: 'Accept and declare it later' }
                ]
              },
              {
                type: 'CHECKBOX',
                title: 'Which are valid ways to raise a concern?',
                options: [
                  { label: 'The anonymous hotline', correct: true },
                  { label: 'Your manager', correct: true },
                  { label: 'Posting on social media' }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];
