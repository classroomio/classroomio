/*
 * video-data.js — content for video-lesson.html.
 *
 * TRANSCRIPT is shaped like media_transcript.segments / youtube_caption.segments:
 * { start, end, text } in seconds. Notebook entries on a video anchor to a time
 * (and, when made from the transcript, to segment offsets plus the exact words).
 */

const VIDEO_LESSON = {
  title: 'Grouping and aggregating',
  section: 'Working with data',
  position: 'Lesson 8 of 12',
  videoTitle: 'groupby, agg and transform',
  duration: 564,
  watchThreshold: 95
};

const TRANSCRIPT = [
  [
    0,
    9,
    'Welcome back. In the last lesson we cleaned the sales file, so every store name is consistent and every price is a number.'
  ],
  [
    9,
    19,
    'Now we can finally answer the questions a manager actually asks, like which store sold the most last month.'
  ],
  [
    19,
    30,
    'Answering those questions means grouping rows together and summarising each group, and that is what groupby is for.'
  ],
  [
    30,
    41,
    'By the end of this video you will be able to total revenue by store, count orders by month, and compare stores side by side.'
  ],
  [41, 53, 'The idea behind groupby has a name: split, apply, combine.'],
  [
    53,
    66,
    'First pandas splits the DataFrame into one smaller table per store. Every row goes into exactly one group.'
  ],
  [66, 79, 'Then it applies a function to each group on its own, such as a sum or a count.'],
  [79, 92, 'Finally it combines the results back into a single table with one row per group.'],
  [92, 106, 'You never see the split tables directly. pandas does all three steps when you ask for a result.'],
  [106, 118, "Let's write it. We start with the cleaned file from last time."],
  [
    118,
    131,
    'df.groupby, then the column to group by, which is store, then the column we want to summarise, which is revenue, then sum.'
  ],
  [
    131,
    145,
    'The result has one row per store. Lagos Island comes out on top, which matches what the sales team told us.'
  ],
  [
    145,
    158,
    'Notice that store is no longer an ordinary column. It has become the index of the result, shown in bold on the left.'
  ],
  [
    158,
    171,
    'That is fine for reading, but it gets in the way when you want to plot the result or merge it with another table.'
  ],
  [
    171,
    184,
    'There are two ways to fix it. You can call reset_index afterwards, or you can pass as_index equals False to groupby.'
  ],
  [
    184,
    197,
    'With as_index equals False, store stays an ordinary column and the result is a normal DataFrame you can keep working with.'
  ],
  [197, 212, 'I use as_index equals False almost every time, because the next step is usually a chart or a merge.'],
  [
    212,
    226,
    'A single number per store is useful, but managers usually want a few numbers at once: total revenue, number of orders, average order size.'
  ],
  [226, 240, 'For that we use agg. You can pass it a list of function names, like sum, count and mean.'],
  [
    240,
    254,
    'That works, but the column names it produces are nested and awkward. There is a cleaner way called named aggregation.'
  ],
  [
    254,
    268,
    'With named aggregation you write the new column name, then a pair: the column to read and the function to apply.'
  ],
  [268, 282, 'total equals revenue and sum. orders equals order_id and count. average equals revenue and mean.'],
  [
    282,
    296,
    'Each argument becomes one tidy column in the result, with exactly the name you chose. No renaming afterwards.'
  ],
  [296, 310, 'Named aggregation is the form I would recommend you use in the exercise at the end of this section.'],
  [
    310,
    324,
    "Now let's group by more than one thing. Pass a list of columns, store and product, and you get one row per combination."
  ],
  [324, 338, 'Grouping by time is a little different, because order_date has a different value for almost every row.'],
  [338, 352, 'Grouping by the raw date would give you one group per day, which is rarely what you want.'],
  [352, 366, 'Instead, use pd.Grouper with the date column and a frequency. M means month-end, W means week.'],
  [
    366,
    380,
    'Combine it with store and you get revenue for every store in every month, which is exactly the table we need for the trends lesson.'
  ],
  [
    380,
    394,
    "One more tool before we wrap up. Sometimes you don't want one row per group. You want to keep every row and add the group's value next to it."
  ],
  [394, 408, "For example, each order's share of its store's total revenue. For that, use transform instead of agg."],
  [
    408,
    422,
    'agg shrinks each group down to one row. transform returns a result the same length as the original, so it lines up row for row.'
  ],
  [
    422,
    436,
    "So df.groupby store, revenue, transform sum gives every order its store's total, and you can divide to get the share."
  ],
  [
    436,
    450,
    'If you remember one thing: agg when you want a summary table, transform when you want a new column on the original.'
  ],
  [
    450,
    466,
    'A quick warning. groupby drops rows where the grouping column is missing, so check for gaps in store before you trust the totals.'
  ],
  [466, 480, 'Pass dropna equals False if you want missing stores to show up as their own group instead.'],
  [
    480,
    495,
    "Let's recap. groupby splits, applies and combines. Use as_index equals False to keep your keys as columns."
  ],
  [
    495,
    510,
    'Use named aggregation for tidy multi-column summaries, pd.Grouper for dates, and transform when you need a value on every row.'
  ],
  [510, 525, "The notes under this video have every snippet from today, so you don't need to pause and copy code."],
  [525, 540, "In the exercise you'll build a monthly revenue table per store from the sales file."],
  [540, 564, "In the next lesson we'll turn that table into charts. See you there."]
].map(([start, end, text]) => ({ start, end, text }));

/* What the simulated video shows. Each slide covers [from, to) seconds. */
const SLIDES = [
  {
    from: 0,
    to: 41,
    key: 'intro',
    html: `<div class="sl-title"><span class="sl-kicker">Working with data · Lesson 8</span><h3>Grouping and aggregating</h3><p>groupby · agg · transform</p></div>`
  },
  {
    from: 41,
    to: 106,
    key: 'sac',
    html: `<div class="sl-sac"><h4>Split · Apply · Combine</h4><div class="sl-sac-row">
      <div class="sl-box"><b>Split</b><span>one table per store</span></div><span class="sl-arrow">→</span>
      <div class="sl-box"><b>Apply</b><span>sum() each group</span></div><span class="sl-arrow">→</span>
      <div class="sl-box"><b>Combine</b><span>one row per store</span></div></div></div>`
  },
  {
    from: 106,
    to: 171,
    key: 'groupby',
    html: `<div class="sl-code"><h4>Total revenue by store</h4><pre>df.groupby(<s>"store"</s>)[<s>"revenue"</s>].sum()</pre>
      <table><tr><th>store</th><th>revenue</th></tr><tr><td><b>Lagos Island</b></td><td>4,812,300</td></tr><tr><td><b>Victoria Island</b></td><td>3,140,950</td></tr><tr><td><b>Ikeja</b></td><td>2,206,400</td></tr></table></div>`
  },
  {
    from: 171,
    to: 212,
    key: 'asindex',
    html: `<div class="sl-code"><h4>Keep store as a column</h4><pre>df.groupby(<s>"store"</s>, <em>as_index=False</em>)[<s>"revenue"</s>].sum()</pre>
      <table><tr><th></th><th>store</th><th>revenue</th></tr><tr><td class="mute">0</td><td>Lagos Island</td><td>4,812,300</td></tr><tr><td class="mute">1</td><td>Victoria Island</td><td>3,140,950</td></tr><tr><td class="mute">2</td><td>Ikeja</td><td>2,206,400</td></tr></table></div>`
  },
  {
    from: 212,
    to: 310,
    key: 'agg',
    html: `<div class="sl-code"><h4>Named aggregation</h4><pre>df.groupby(<s>"store"</s>, as_index=False).agg(
    <em>total</em>=(<s>"revenue"</s>, <s>"sum"</s>),
    <em>orders</em>=(<s>"order_id"</s>, <s>"count"</s>),
    <em>average</em>=(<s>"revenue"</s>, <s>"mean"</s>),
)</pre></div>`
  },
  {
    from: 310,
    to: 380,
    key: 'grouper',
    html: `<div class="sl-code"><h4>Group by store and month</h4><pre>df.groupby(
    [<s>"store"</s>, <em>pd.Grouper</em>(key=<s>"order_date"</s>, freq=<s>"M"</s>)],
    as_index=False,
)[<s>"revenue"</s>].sum()</pre></div>`
  },
  {
    from: 380,
    to: 480,
    key: 'transform',
    html: `<div class="sl-vs"><h4>agg vs transform</h4><div class="sl-vs-row">
      <div class="sl-box"><b>agg</b><span>one row per group</span><code>3 rows</code></div>
      <div class="sl-box"><b>transform</b><span>same length as df</span><code>9,412 rows</code></div></div>
      <pre>df[<s>"store_total"</s>] = df.groupby(<s>"store"</s>)[<s>"revenue"</s>].<em>transform</em>(<s>"sum"</s>)</pre></div>`
  },
  {
    from: 480,
    to: 565,
    key: 'recap',
    html: `<div class="sl-recap"><h4>Recap</h4><ul><li><code>groupby</code> splits, applies, combines</li><li><code>as_index=False</code> keeps keys as columns</li><li>Named aggregation for tidy summaries</li><li><code>pd.Grouper</code> for dates · <code>transform</code> for per-row values</li></ul></div>`
  }
];

/* Lesson notes under the video: a mixed lesson keeps one notebook for both. */
const VIDEO_NOTES_HTML = `
<h2>Notes</h2>
<p>Every snippet from the video, so you don't need to pause and copy code. All examples use <code>sales_2025_clean.csv</code> from the previous lesson.</p>
<pre><code>totals = (
    df.groupby("store", as_index=False)
    .agg(total=("revenue", "sum"), orders=("order_id", "count"))
)</code></pre>
<p>Use <code>as_index=False</code> whenever the next step is a chart or a merge. <span class="vt-texthl" data-text-hl>Use agg when you want a summary table, and transform when you want a new column on the original rows.</span></p>
<pre><code>monthly = df.groupby(
    ["store", pd.Grouper(key="order_date", freq="M")], as_index=False
)["revenue"].sum()</code></pre>
<p>groupby drops rows where the grouping column is missing. Check <code>df["store"].isna().sum()</code> first, or pass <code>dropna=False</code> to keep them as their own group.</p>
`;

const VIDEO_SEED = [
  { id: 'v1', kind: 'bookmark', t: 128, when: '2 days ago' },
  {
    id: 'v2',
    kind: 'note',
    t: 192,
    color: 'yellow',
    note: 'as_index=False keeps store as a column. I need this for the plot in the trends lesson.',
    when: '2 days ago'
  },
  {
    id: 'v3',
    kind: 'highlight',
    t: 254,
    tEnd: 268,
    seg: 20,
    segEnd: 20,
    exact: 'write the new column name, then a pair: the column to read and the function to apply',
    color: 'green',
    when: '2 days ago'
  },
  {
    id: 'v4',
    kind: 'question',
    action: 'moment',
    t: 417,
    question: 'When would I use transform instead of agg?',
    answer:
      "Use transform when you want to keep every row and attach the group's value to it, such as each order's share of its store's total. agg collapses each store to one row, so it can't line up with the original rows.",
    key: "keep every row and attach the group's value to it",
    when: '2 days ago'
  },
  {
    id: 'v5',
    kind: 'note',
    t: 130,
    orphaned: true,
    videoTitle: 'Intro to groupby (2024 recording)',
    exact: 'sum skips missing values unless you tell it not to',
    note: 'sum() ignores NaN by default, so a store with gaps still gets a total.',
    color: 'blue',
    when: '3 weeks ago'
  }
];

const VIDEO_TEXT_SEED = [
  {
    id: 't1',
    kind: 'highlight',
    source: 'text',
    p: 4,
    exact: 'Use agg when you want a summary table, and transform when you want a new column on the original rows.',
    color: 'yellow',
    when: 'yesterday'
  }
];

/* Answers for "Ask about this moment" and transcript Explain / Define, by slide. */
const MOMENT_ANSWERS = {
  intro: {
    text: 'This opening sets the goal: now that the sales file is clean, you can summarise it by store and by month. Everything in the video builds toward one table, revenue per store per month.',
    key: 'revenue per store per month'
  },
  sac: {
    text: 'Split, apply, combine is what groupby does behind the scenes. pandas puts each row into one group per store, runs your function on each group separately, then stitches the answers into one table with a row per store.',
    key: 'runs your function on each group separately'
  },
  groupby: {
    text: 'df.groupby("store")["revenue"].sum() reads left to right: group the rows by store, keep only the revenue column, add it up within each group. The store names become the index of the result.',
    key: 'The store names become the index of the result'
  },
  asindex: {
    text: 'as_index=False tells groupby to keep store as a normal column instead of moving it into the index. That matters because charts and merges expect the key as a column, so you skip a reset_index() call.',
    key: 'charts and merges expect the key as a column'
  },
  agg: {
    text: 'Named aggregation lets you name each output column yourself: total=("revenue", "sum") means "make a column called total by summing revenue". You get flat, readable column names instead of a nested header.',
    key: 'name each output column yourself'
  },
  grouper: {
    text: 'pd.Grouper buckets dates by a frequency, so freq="M" groups every order into its calendar month. Without it, each distinct date becomes its own group and you get one row per day.',
    key: 'groups every order into its calendar month'
  },
  transform: {
    text: "transform keeps the original shape: every order gets its store's total next to it. agg would collapse each store to one row. Use transform when the result is a new column on df, agg when you want a summary table.",
    key: 'transform keeps the original shape'
  },
  recap: {
    text: 'The recap lists the four tools from this video: groupby for split-apply-combine, as_index=False to keep keys as columns, named aggregation for tidy summaries, and pd.Grouper or transform for dates and per-row values.',
    key: 'four tools from this video'
  }
};

const DEFINE_ANSWERS = [
  {
    match: ['as_index'],
    text: 'as_index: a groupby option. When False, the grouping columns stay as ordinary columns in the result instead of becoming its index.',
    key: 'stay as ordinary columns'
  },
  {
    match: ['reset_index'],
    text: 'reset_index(): moves the index back into a regular column and gives the DataFrame a fresh 0, 1, 2… index.',
    key: 'moves the index back into a regular column'
  },
  {
    match: ['named aggregation', 'agg'],
    text: 'agg (aggregate): applies one or more summary functions to each group. Named aggregation is the form where you choose each output column name.',
    key: 'choose each output column name'
  },
  {
    match: ['transform'],
    text: "transform: runs a function per group but returns a result the same length as the original, so each row gets its group's value.",
    key: 'the same length as the original'
  },
  {
    match: ['grouper'],
    text: 'pd.Grouper: a grouping instruction for dates (or other keys). With freq="M" it groups rows by calendar month.',
    key: 'groups rows by calendar month'
  },
  {
    match: ['index'],
    text: 'Index: the row labels of a DataFrame. After a groupby the group keys become the index unless you pass as_index=False.',
    key: 'the row labels of a DataFrame'
  },
  {
    match: ['split', 'apply', 'combine'],
    text: 'Split-apply-combine: the pattern groupby follows. Split rows into groups, apply a function to each, combine the results.',
    key: 'Split rows into groups'
  }
];

/* Teacher view: aggregated signals per 12-second bin, only from moments 3+ learners marked. */
const VIDEO_INSIGHTS = {
  learners: 64,
  bins: [
    1, 0, 1, 0, 2, 3, 2, 1, 1, 2, 4, 3, 2, 5, 9, 14, 12, 6, 3, 4, 6, 8, 5, 3, 2, 3, 5, 8, 10, 6, 3, 2, 4, 7, 15, 21, 18,
    11, 6, 3, 2, 1, 1, 2, 1, 1, 0
  ],
  moments: [
    {
      t: 184,
      label: 'as_index=False',
      bookmarks: 18,
      rewinds: 11,
      questions: 4,
      top: 'Why does store disappear from the columns after groupby?',
      suggestion:
        'Learners pause here to copy the snippet. It is already in the notes, so add a pointer on screen or in the video description.'
    },
    {
      t: 360,
      label: 'pd.Grouper',
      bookmarks: 6,
      rewinds: 9,
      questions: 7,
      top: 'What does freq="M" mean, end of month or start?',
      suggestion:
        'Add one sentence to the notes: M groups by calendar month and labels each group with the month-end date.'
    },
    {
      t: 415,
      label: 'agg vs transform',
      bookmarks: 9,
      rewinds: 23,
      questions: 9,
      top: 'When would I use transform instead of agg?',
      suggestion:
        'The most rewatched 40 seconds of the video. A short worked example in the notes would answer most of these questions.'
    }
  ]
};
