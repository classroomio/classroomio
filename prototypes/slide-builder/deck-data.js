/*
 * deck-data.js — the sample deck plus a tiny renderer.
 *
 * This is deliberately a direct mirror of the PRD's slide document: a slide is
 * { layout, blocks[], notes, transition }, and a block is a discriminated union
 * on a STRING `kind`. Slotted blocks carry `slot`; free blocks carry `box`.
 * Every prototype renders from THIS data, so the editor, the player, the
 * presenter view, the themes gallery and the public page cannot drift.
 */

// Stand-in images: CSS gradients, so the prototypes stay self-contained.
const IMG = {
  workshop:
    'linear-gradient(135deg, oklch(0.546 0.245 262.881), oklch(0.623 0.214 259.815) 55%, oklch(0.809 0.105 251.813))',
  rubric: 'linear-gradient(140deg, oklch(0.596 0.145 163.225), oklch(0.696 0.17 162.48) 60%, oklch(0.83 0.12 165))',
  charts: 'linear-gradient(125deg, oklch(0.666 0.179 58.318), oklch(0.769 0.188 70.08) 70%, oklch(0.86 0.14 80))'
};

const DECK = {
  id: 'dk_assess',
  title: 'Designing Effective Assessments',
  themeId: 'classic',
  course: 'Instructional Design 201',
  lesson: 'Designing Effective Assessments',
  slides: [
    {
      layout: 'cover',
      notes:
        'Set the frame: we are not talking about grading, we are talking about evidence. Ask who has written a quiz question in the last month.',
      blocks: [
        { kind: 'eyebrow', slot: 'main', text: 'Instructional Design 201 · Module 4' },
        { kind: 'heading', slot: 'main', level: 'hero', text: 'Designing Effective Assessments' },
        {
          kind: 'text',
          slot: 'main',
          emphasis: 'muted',
          text: 'How to write items that measure what you actually taught.'
        }
      ]
    },
    {
      layout: 'section-break',
      notes: 'Transition slide. Keep it to ten seconds.',
      blocks: [{ kind: 'heading', slot: 'main', level: 'section', text: 'Part 1 — Start with the outcome' }]
    },
    {
      layout: 'two-col',
      notes:
        'The single most common failure: the question is written first, then an outcome is reverse-engineered to justify it. Walk through the example on screen.',
      blocks: [
        { kind: 'eyebrow', slot: 'left', text: 'The core move' },
        { kind: 'heading', slot: 'left', level: 'page', text: 'Write the outcome before the question' },
        {
          kind: 'text',
          slot: 'left',
          text: 'An item that cannot name the outcome it measures is decoration. Name the behaviour, then build the evidence for it.'
        },
        { kind: 'image', slot: 'media', src: IMG.workshop, alt: 'Workshop participants mapping outcomes to items' }
      ]
    },
    {
      layout: 'bullets',
      notes: 'Spend the most time here. Ask for a show of hands on which trait their current quiz fails.',
      blocks: [
        { kind: 'heading', slot: 'main', level: 'page', text: 'Four traits of a usable item' },
        {
          kind: 'bullets',
          slot: 'main',
          items: [
            'It maps to exactly one stated outcome',
            'A learner who knows the material answers it correctly',
            'A learner who does not cannot guess it',
            'The distractors are all plausible to a novice'
          ]
        }
      ]
    },
    {
      layout: 'image-right',
      notes: 'The rubric is the contract. Show them the two-column version from the workbook.',
      blocks: [
        { kind: 'heading', slot: 'left', level: 'page', text: 'A rubric is a promise you make first' },
        {
          kind: 'text',
          slot: 'left',
          text: 'Publish it with the task, not with the grade. Learners calibrate to what you measure, so measure the thing you want.'
        },
        { kind: 'image', slot: 'media', src: IMG.rubric, alt: 'A two-column analytic rubric' }
      ]
    },
    {
      layout: 'kpi-row',
      notes: 'Numbers are from the 2025 cohort study — cite it if asked, do not put the citation on the slide.',
      blocks: [
        { kind: 'heading', slot: 'main', level: 'page', text: 'What changed when cohorts published rubrics up front' },
        {
          kind: 'kpis',
          slot: 'main',
          items: [
            { value: '+31%', label: 'Items answered on first attempt' },
            { value: '−48%', label: 'Regrade requests' },
            { value: '2.4×', label: 'Revision submissions' }
          ]
        }
      ]
    },
    {
      layout: 'quote',
      notes: 'Pause here. Let it sit before moving on.',
      blocks: [
        {
          kind: 'quote',
          slot: 'main',
          text: 'Assessment is the point at which your course finds out whether it worked.',
          attribution: 'Dylan Wiliam, paraphrased'
        }
      ]
    },
    {
      layout: 'title-body',
      notes: 'Close with the assignment. They build three items and bring them to the next session.',
      blocks: [
        { kind: 'eyebrow', slot: 'main', text: 'Before the next session' },
        { kind: 'heading', slot: 'main', level: 'page', text: 'Bring three items you have written' },
        {
          kind: 'text',
          slot: 'main',
          text: 'One recall, one applied, one scenario. Name the outcome each one measures. We will workshop them live.'
        },
        { kind: 'divider', slot: 'main' },
        { kind: 'text', slot: 'main', emphasis: 'accent', text: 'Post them to the cohort newsfeed by Thursday.' }
      ]
    }
  ]
};

/* A deliberately overflowing free-position slide, used to show the guard.
 * y + h = 760 + 400 = 1160 > 1080, so ZSlide.superRefine rejects it. */
const FREE_SLIDE = {
  layout: 'free',
  notes: 'Free-position example. The pull-quote block is dragged past the bottom edge on purpose.',
  blocks: [
    { kind: 'eyebrow', box: { x: 160, y: 150, w: 700, h: 60 }, text: 'Case study' },
    {
      kind: 'heading',
      level: 'section',
      box: { x: 160, y: 220, w: 980, h: 260 },
      text: 'One item, rewritten four times'
    },
    {
      kind: 'text',
      box: { x: 160, y: 520, w: 820, h: 200 },
      text: 'Each pass removed a guessable distractor and tightened the stem to a single outcome.'
    },
    {
      kind: 'image',
      box: { x: 1180, y: 220, w: 580, h: 640 },
      src: IMG.charts,
      alt: 'Four revisions of the same item'
    },
    {
      kind: 'quote',
      box: { x: 160, y: 760, w: 820, h: 400 },
      text: 'The fourth version was half the length.',
      attribution: 'Cohort 12 review'
    }
  ]
};

/* ---------- renderer: block kind -> markup (mirrors the block registry) ---------- */

function esc(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function renderBlock(block) {
  const emphasis = block.emphasis ? ` em-${block.emphasis}` : ' em-default';

  switch (block.kind) {
    case 'eyebrow':
      return `<div class="b-eyebrow">${esc(block.text)}</div>`;
    case 'heading':
      return `<h2 class="b-heading lv-${block.level || 'page'}">${esc(block.text)}</h2>`;
    case 'text':
      return `<p class="b-text${emphasis}">${esc(block.text)}</p>`;
    case 'bullets':
      return `<ul class="b-bullets">${block.items.map((i) => `<li><span>${esc(i)}</span></li>`).join('')}</ul>`;
    case 'image':
      return `<div class="b-image" role="img" aria-label="${esc(block.alt)}" style="background-image:${block.src}"></div>`;
    case 'quote':
      return `<div><p class="b-quote">“${esc(block.text)}”</p>${block.attribution ? `<div class="b-attr">— ${esc(block.attribution)}</div>` : ''}</div>`;
    case 'kpis':
      return `<div class="b-kpis">${block.items
        .map((k) => `<div class="b-kpi"><div class="v">${esc(k.value)}</div><div class="l">${esc(k.label)}</div></div>`)
        .join('')}</div>`;
    case 'code':
      return `<pre class="b-code">${esc(block.code)}</pre>`;
    case 'divider':
      return '<hr class="b-divider" />';
    default:
      return '';
  }
}

function renderSlide(slide, options) {
  const opts = options || {};
  const theme = opts.theme || DECK.themeId;
  const chrome = opts.chrome !== false;

  let inner;

  if (slide.layout === 'free') {
    inner = slide.blocks
      .map((block, index) => {
        const box = block.box;
        const overflow = box.y + box.h > 1080 || box.x + box.w > 1920;
        return `<div class="fblock${overflow ? ' is-overflow' : ''}" data-block="${index}"
          style="--x:${box.x};--y:${box.y};--w:${box.w};--h:${box.h}">${renderBlock(block)}</div>`;
      })
      .join('');
    inner = `<div class="lay lay-free">${inner}</div>`;
  } else {
    const slots = {};
    slide.blocks.forEach((block, index) => {
      const slot = block.slot || 'main';
      (slots[slot] = slots[slot] || []).push(`<div data-block="${index}" class="blk">${renderBlock(block)}</div>`);
    });
    const order = slide.layout === 'image-left' ? ['media', 'left', 'main'] : ['left', 'main', 'media', 'right'];
    inner = order
      .filter((slot) => slots[slot])
      .map((slot) => `<div class="slot${slot === 'media' ? ' slot-media' : ''}">${slots[slot].join('')}</div>`)
      .join('');
    inner = `<div class="lay lay-${slide.layout}">${inner}</div>`;
  }

  const foot =
    chrome && slide.layout !== 'cover' && slide.layout !== 'section-break'
      ? `<div class="slide-foot"><span class="logo"><span class="mk">A</span>Acme Academy</span><span>${esc(DECK.title)}</span></div>`
      : '';

  return `<div class="slide-frame theme-${theme}">${inner}${foot}</div>`;
}

/** Blocks whose declared box escapes the 1920x1080 canvas. */
function overflowingBlocks(slide) {
  if (slide.layout !== 'free') return [];

  return slide.blocks.filter(
    (block) => block.box && (block.box.y + block.box.h > 1080 || block.box.x + block.box.w > 1920)
  );
}
