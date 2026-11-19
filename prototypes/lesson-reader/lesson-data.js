/*
 * lesson-data.js — content and canned data for the lesson-reader prototypes.
 *
 * LESSON_HTML is shaped like real TipTap output from lesson_language.content:
 * plain blocks, <pre><code>, a table and cio-callout divs. Block indexes (¶ numbers)
 * are never stored in it; reader.js derives them at render time.
 */

const COURSE = {
  title: 'Data Science with Python and Pandas',
  org: 'Udemy Test',
  learner: { name: 'Maya Ruiz', initials: 'MR' },
  progress: { completed: 7, total: 12, lessonsDone: 5, lessonsTotal: 8, exercisesDone: 2, exercisesTotal: 4 },
  outline: [
    {
      section: 'Getting started',
      items: [
        { type: 'lesson', title: 'Why pandas?', done: true },
        { type: 'lesson', title: 'Setting up Jupyter', done: true },
        { type: 'exercise', title: 'Quiz: Python refresher', done: true }
      ]
    },
    {
      section: 'Working with data',
      items: [
        { type: 'lesson', title: 'Loading data with pandas', done: true },
        { type: 'exercise', title: 'Quiz: DataFrame basics', done: true },
        { type: 'lesson', title: 'Selecting rows and columns', done: true },
        { type: 'lesson', title: 'Cleaning messy data', active: true },
        { type: 'lesson', title: 'Grouping and aggregating' },
        { type: 'exercise', title: 'Exercise: Clean the sales data' }
      ]
    },
    {
      section: 'Analysis',
      items: [
        { type: 'lesson', title: 'Visualising trends', done: true },
        { type: 'lesson', title: 'Time series basics' },
        { type: 'exercise', title: 'Final project: Forecast next quarter' }
      ]
    }
  ]
};

const LESSON = {
  title: 'Cleaning messy data',
  section: 'Working with data',
  position: 'Lesson 7 of 12',
  updated: '2 days ago'
};

const CALLOUT_ICON = {
  tip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  warning:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
};

const LESSON_HTML = `
<p>Real-world data almost never arrives clean. A sales export from a point-of-sale system will have blank cells where a cashier skipped a field, prices stored as text with currency symbols, the same store spelled three different ways, and a handful of rows that appear twice because someone re-ran the export. Before you can trust any chart or average, you need to find these problems and decide what to do about each one.</p>
<p>In this lesson you will work through the four problems that cause most analysis bugs: missing values, wrong data types, inconsistent categories and duplicate rows. We will use the <code>sales_2025.csv</code> file you loaded in the previous lesson.</p>
<div class="cio-callout" data-callout="tip"><div class="cio-callout-mark" aria-hidden="true">${CALLOUT_ICON.tip}</div><div class="cio-callout-body"><p>Run <code>df.info()</code> before anything else. It shows every column, its type and how many non-null values it holds, which is usually enough to spot three of the four problems at a glance.</p></div></div>
<h2>Missing values</h2>
<p>pandas marks missing data with <code>NaN</code>, short for "not a number". It is a special floating-point value, which is why a column of whole numbers with a single gap silently becomes a column of floats. You can count the gaps in every column with <code>df.isna().sum()</code>.</p>
<pre><code>df = pd.read_csv("sales_2025.csv")
df.isna().sum()

store         0
order_date    0
price        12
discount    418
quantity      3</code></pre>
<p>Once you know where the gaps are, you have two broad choices: remove the rows, or fill the gaps with a sensible value. Neither is always right. Dropping rows is safe when only a small share of rows is affected and the gaps are random. Filling is better when dropping would throw away too much data, or when a missing value has an obvious meaning, such as a blank discount meaning no discount was applied.</p>
<ul>
<li><code>dropna()</code> removes rows that contain missing values. Pass <code>subset=</code> to look only at the columns that matter.</li>
<li><code>fillna(value)</code> replaces missing values with a constant, such as <code>0</code> or <code>"Unknown"</code>.</li>
<li><code>ffill()</code> carries the last valid value forward, which suits time series where a reading stays the same until it changes.</li>
</ul>
<p>A common mistake is to fill missing prices with zero. That turns "we don't know the price" into "the item was free", and every average you calculate afterwards will be too low. When a numeric gap has no natural default, the median of the column is a safer stand-in than the mean, because a few extreme values can drag the mean far from a typical row.</p>
<h2>Fixing data types</h2>
<p>When pandas reads a CSV it guesses each column's type from its contents. One stray value is enough to push a whole column to <code>object</code>, which is pandas' word for plain Python strings. A price column containing <code>"$12.50"</code> cannot be summed, and a date column read as text cannot be sorted by month.</p>
<pre><code>df["price"] = pd.to_numeric(
    df["price"].str.replace("$", "", regex=False),
    errors="coerce",
)
df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")</code></pre>
<p>The <code>errors="coerce"</code> argument tells pandas to turn anything it cannot convert into <code>NaN</code> rather than stopping with an error. That is usually what you want during cleaning, but always check how many new gaps it created. A jump from 12 missing prices to 900 means your conversion is wrong, not your data.</p>
<h2>Inconsistent categories</h2>
<p>Text typed by people drifts. In our file the store column contains "Lagos Island", "lagos island" and "Lagos Island " with a trailing space. To pandas these are three different stores, so a group-by will split one store's revenue across three rows.</p>
<table>
<thead><tr><th>Raw value</th><th>Rows</th><th>After cleaning</th></tr></thead>
<tbody>
<tr><td>Lagos Island</td><td>1,204</td><td>Lagos Island</td></tr>
<tr><td>lagos island</td><td>87</td><td>Lagos Island</td></tr>
<tr><td>Lagos Island&nbsp;(trailing space)</td><td>31</td><td>Lagos Island</td></tr>
<tr><td>VI - Adetokunbo</td><td>412</td><td>Victoria Island</td></tr>
</tbody>
</table>
<p>Normalising case and whitespace with <code>str.strip()</code> and <code>str.title()</code> fixes most of it. A small mapping dictionary handles the rest, such as abbreviations that a person would recognise but a computer would not.</p>
<h2>Duplicate rows</h2>
<p>Duplicates usually come from merges or repeated exports. <code>df.duplicated()</code> flags every row that is an exact copy of an earlier one, and <code>drop_duplicates()</code> removes them. Be careful with partial duplicates: two sales with the same order ID but different amounts are not duplicates to delete. They are a data-quality question for whoever owns the source system.</p>
<div class="cio-callout" data-callout="warning"><div class="cio-callout-mark" aria-hidden="true">${CALLOUT_ICON.warning}</div><div class="cio-callout-body"><p>Never overwrite the raw file. Keep <code>sales_2025.csv</code> untouched and save your cleaned result as a new file, so you can always re-run the cleaning steps from the start.</p></div></div>
<h2>Putting it together</h2>
<p>Cleaning is easier to review when each step is one line in a chain. Method chaining reads top to bottom like a recipe, and because every step returns a new DataFrame, you can comment out a line to see exactly what it changed.</p>
<pre><code>clean = (
    df
    .drop_duplicates()
    .assign(store=lambda d: d["store"].str.strip().str.title())
    .assign(discount=lambda d: d["discount"].fillna(0))
    .dropna(subset=["price", "order_date"])
)
clean.to_csv("sales_2025_clean.csv", index=False)</code></pre>
<p>After running the chain, call <code>df.info()</code> again and compare it with the first output. Every column should now have the type you expect, and any remaining gaps should be ones you have decided to keep on purpose. In the next lesson you will use this cleaned file to group sales by store and month.</p>
`;

/* What the Explain / Define / Ask actions answer with. Matched against the selected
   text (lowercased, contains). `key` is the phrase marked in the pen colour. */
const AI_ANSWERS = [
  {
    match: ['nan'],
    explain: {
      text: 'NaN is the marker you are hunting for in this section. Because it is technically a float, a single gap turns a column of whole numbers into floats, which is why df.info() can show quantity as float64 even though nobody sells half an item.',
      key: 'a single gap turns a column of whole numbers into floats'
    },
    define: {
      text: 'NaN ("not a number") is the special floating-point value pandas uses to mark a missing entry. isna() returns True wherever it appears.',
      key: 'mark a missing entry'
    }
  },
  {
    match: ['median', 'mean'],
    explain: {
      text: 'The median is the middle value once the column is sorted. The lesson prefers it because a few very large orders would pull the mean upward, so filling gaps with the mean would make the missing rows look bigger than a typical sale.',
      key: 'a few very large orders would pull the mean upward'
    },
    define: {
      text: 'Median: the middle value of a sorted column (or the average of the two middle values). Unlike the mean, it barely moves when a handful of extreme values are added.',
      key: 'barely moves when a handful of extreme values are added'
    }
  },
  {
    match: ['coerce'],
    explain: {
      text: 'errors="coerce" tells to_numeric and to_datetime to turn anything they cannot parse into NaN instead of raising an error. The lesson’s warning is the important part: compare the missing count before and after, because a big jump means your cleaning pattern is wrong, not the data.',
      key: 'compare the missing count before and after'
    },
    define: {
      text: 'Coerce: to force a value into a type. With errors="coerce", values that cannot be converted become NaN.',
      key: 'become NaN'
    }
  },
  {
    match: ['object'],
    explain: {
      text: 'object is the type pandas falls back to when a column holds anything that is not a clean number or date, which in practice almost always means strings. Seeing it on a column you expect to be numeric is your cue to look for symbols like "$" or stray text.',
      key: 'your cue to look for symbols like "$" or stray text'
    },
    define: {
      text: 'object: the pandas dtype for columns of general Python objects, almost always text.',
      key: 'almost always text'
    }
  },
  {
    match: ['ffill', 'carries the last valid value'],
    explain: {
      text: 'Forward fill copies the last value that is not missing down into the gaps after it. It fits readings that stay the same until they change, like a product’s list price, but it would be wrong for something like daily sales, where a gap is not the same as yesterday’s number.',
      key: 'a gap is not the same as yesterday’s number'
    },
    define: {
      text: 'ffill (forward fill): replace each missing value with the most recent non-missing value above it.',
      key: 'most recent non-missing value above it'
    }
  },
  {
    match: ['method chaining', 'chain'],
    explain: {
      text: 'Method chaining means calling one DataFrame method after another, each on the result of the last. Here it turns cleaning into a readable recipe, and because nothing is overwritten in place you can disable a single line to see what it changed.',
      key: 'disable a single line to see what it changed'
    },
    define: {
      text: 'Method chaining: writing df.a().b().c() so each call works on the previous call’s result.',
      key: 'each call works on the previous call’s result'
    }
  },
  {
    match: ['duplicate'],
    explain: {
      text: 'An exact duplicate repeats every column of an earlier row, so it is safe to drop. The lesson separates that from a partial duplicate, where the order ID matches but the amount does not. That is a question to raise with the data owner, not a row to delete.',
      key: 'a question to raise with the data owner'
    },
    define: {
      text: 'Duplicate row: a row whose values match an earlier row in every column (or in the columns you pass to subset=).',
      key: 'match an earlier row in every column'
    }
  },
  {
    match: ['df.info()', 'info()'],
    explain: {
      text: 'df.info() prints each column’s name, type and non-null count. Gaps show up as non-null counts lower than the row count, and wrong types show up as object where you expected numbers or dates, which covers three of the four problems in this lesson.',
      key: 'covers three of the four problems in this lesson'
    },
    define: {
      text: 'df.info(): prints a DataFrame’s columns, their dtypes, non-null counts and memory use.',
      key: 'non-null counts'
    }
  }
];

/* Answers for free-form Ask questions, matched against the question text. */
const ASK_ANSWERS = [
  {
    match: ['simple', 'eli5', 'plain'],
    text: 'In plain words: some cells in the spreadsheet are empty. Before you do any maths, decide what an empty cell means. If it really means "zero", fill it with zero. If it means "we don’t know", either leave the row out or use a typical value so it doesn’t drag your totals around.',
    key: 'decide what an empty cell means'
  },
  {
    match: ['difference', 'dropna', 'fillna', 'vs'],
    text: 'dropna() deletes rows that have gaps, so you lose those rows entirely. fillna() keeps every row and writes a value into the gaps. Drop when few rows are affected and the gaps are random. Fill when the gap has an obvious meaning (no discount means 0) or when dropping would throw away too much data.',
    key: 'Drop when few rows are affected and the gaps are random'
  },
  {
    match: ['example'],
    text: 'Example from this file: 418 orders have no discount. A blank discount means none was applied, so fillna(0) is correct. 12 orders have no price, and a free sale is unlikely, so those rows are better dropped (or filled with the median if you need every order).',
    key: 'fillna(0) is correct'
  },
  {
    match: ['why', 'matter'],
    text: 'It matters because every later step trusts this one. If missing prices become zero, average order value drops; if stores are split across spellings, the best store looks average. Cleaning decisions change the answer, so they should be deliberate and written down.',
    key: 'Cleaning decisions change the answer'
  }
];

/* Notebook entries a returning learner already has. `exact` must exist in the lesson;
   the last highlight intentionally points at text that was edited away. */
const SEED_NOTEBOOK = [
  {
    id: 'h1',
    kind: 'highlight',
    color: 'yellow',
    exact:
      'Before you can trust any chart or average, you need to find these problems and decide what to do about each one.',
    note: '',
    when: 'Mon'
  },
  {
    id: 'h2',
    kind: 'highlight',
    color: 'green',
    exact: 'the median of the column is a safer stand-in than the mean',
    note: 'Use this in the sales exercise for missing prices.',
    when: 'Mon'
  },
  {
    id: 'q1',
    kind: 'question',
    action: 'explain',
    exact: 'errors="coerce"',
    question: 'What does this mean here?',
    when: 'Mon'
  },
  {
    id: 'h3',
    kind: 'highlight',
    color: 'blue',
    exact: 'Text typed by people drifts.',
    note: '',
    when: 'Tue'
  },
  {
    id: 'h4',
    kind: 'highlight',
    color: 'pink',
    exact: 'Use the isnull() method to find blank cells before doing anything else.',
    note: '',
    when: 'Sep 30',
    orphaned: true
  }
];

/* Other lessons' entries for the course notebook page and the dashboard card. */
const COURSE_NOTEBOOK = [
  {
    lesson: 'Loading data with pandas',
    section: 'Working with data',
    entries: [
      {
        kind: 'highlight',
        color: 'yellow',
        p: 3,
        exact: 'read_csv guesses column types from the first rows it sees, so check dtypes straight after loading.',
        when: 'Sep 24'
      },
      {
        kind: 'question',
        action: 'ask',
        p: 6,
        exact: 'index_col=0',
        question: 'Why would I set the index when loading?',
        answer:
          'Setting index_col uses a column as row labels instead of 0, 1, 2… It makes lookups like df.loc["ORD-1042"] possible and stops pandas adding an unnamed column when you save and reload.',
        when: 'Sep 24'
      }
    ]
  },
  {
    lesson: 'Selecting rows and columns',
    section: 'Working with data',
    entries: [
      {
        kind: 'highlight',
        color: 'green',
        p: 2,
        exact: 'loc selects by label and iloc selects by position.',
        note: 'loc = label, iloc = integer position',
        when: 'Sep 27'
      },
      {
        kind: 'highlight',
        color: 'yellow',
        p: 9,
        exact: 'Chained indexing like df[df.x > 0]["y"] = 1 may modify a copy, not the original DataFrame.',
        when: 'Sep 27'
      }
    ]
  },
  {
    lesson: 'Visualising trends',
    section: 'Analysis',
    entries: [
      {
        kind: 'question',
        action: 'explain',
        p: 4,
        exact: 'rolling(7).mean()',
        question: 'What does this mean here?',
        answer:
          'It averages each day with the six days before it, which smooths daily noise so the weekly trend is easier to see.',
        when: 'Oct 2'
      },
      {
        kind: 'highlight',
        color: 'blue',
        p: 11,
        exact: 'Start the y-axis at zero for bar charts; line charts may zoom in to show change.',
        when: 'Oct 2'
      }
    ]
  }
];

/* Aggregated, anonymised signals for the teacher insights view (k >= 3 shown). */
const INSIGHTS = {
  learners: 64,
  readers: 51,
  avgRead: '7 min',
  finishRate: 78,
  blocks: {
    0: { hl: 9, q: 0 },
    4: { hl: 6, q: 11, top: ['What is NaN exactly?', 'Why does one gap change the column type?'] },
    6: { hl: 4, q: 3 },
    8: { hl: 21, q: 4, top: ['Why is the median safer than the mean?'] },
    10: { hl: 3, q: 0 },
    12: {
      hl: 7,
      q: 17,
      top: [
        'What does errors="coerce" do?',
        'How do I check how many new gaps it created?',
        'Explain this in simple terms'
      ]
    },
    14: { hl: 2, q: 0 },
    16: { hl: 5, q: 6, top: ['Difference between strip() and title()?'] },
    18: { hl: 12, q: 3 },
    19: { hl: 14, q: 0 },
    22: { hl: 8, q: 9, top: ['What is method chaining?', 'Why use lambda inside assign?'] }
  }
};
