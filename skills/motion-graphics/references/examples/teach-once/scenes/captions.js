/* Word-timed captions. Front captions sit on the lower shirt; big behind-words sit on the wall at head height.
 * The front layer is rendered from ../motion-front (window.LAYER = 'front'), so behind mattes never cut the front captions.
 * Times are seconds on the cut master (speech 0–29.567, then the ClassroomIO outro). */

const LAYER = window.LAYER || 'behind';
const INK = '#17130D';
const BLUE = '#0332BD';
const FOOTAGE_END = 29.567;

const FRONT_X = 830;
const FRONT_Y = 985;

/* Caption-band cut (../motion-band, window.CAPTION_BAND): the captions sit in the frosted band that tools/band.py lays over
 * the shirt print. The band follows each shot's punch-in about ANCHOR_Y, so the caption line does too (shots from tools/reframe.py). */
const CAPTION_BAND = window.CAPTION_BAND === true;
const BAND_CAPTION_Y = 830;
const ANCHOR_Y = 420;
const CUT_FPS = 30;
const SHOTS = [
  [0, 150, 1.0, 1.04],
  [150, 241, 1.14, 1.16],
  [241, 505, 1.0, 1.05],
  [505, 557, 1.17, 1.19],
  [557, 793, 1.0, 1.05],
  [793, 887, 1.12, 1.15]
];

function zoomAt(T) {
  const frame = Math.round(T * CUT_FPS);
  const shot = SHOTS.find(([first, end]) => frame >= first && frame < end);
  if (!shot) return 1;

  const [first, end, startZoom, endZoom] = shot;

  return startZoom + (endZoom - startZoom) * ((frame - first) / Math.max(end - first - 1, 1));
}

function captionY(T) {
  if (!CAPTION_BAND) return FRONT_Y;

  return ANCHOR_Y + (BAND_CAPTION_Y - ANCHOR_Y) * zoomAt(T);
}
const FRONT_SIZE = 56;
const FRONT_SHADOW = '0 3px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)';

/* [word, start]; *word* is set in the serif italic. Each phrase ends where `out` says. */
const FRONT = [
  { out: 1.93, words: [['why', 1.4], ['does', 1.5], ['your', 1.58], ['team', 1.72]] },
  { out: 3.7, words: [['keep', 1.95], ['explaining', 2.24], ['the', 2.67], ['same', 2.8]] },
  { out: 5.0, words: [['to', 3.75], ['different', 3.92], ['*customers?*', 4.39]] },
  { out: 6.28, words: [['because', 5.15], ['every', 5.56], ['new', 5.72], ['customer', 6.04]] },
  { out: 6.72, words: [['needs', 6.3], ['to', 6.44], ['*learn*', 6.58]] },
  { out: 8.03, words: [['how', 6.74], ['your', 6.9], ['product', 7.16], ['works', 7.6]] },
  { out: 9.58, words: [['but', 8.16], ['I', 8.26], ['think', 8.5], ['your', 8.68], ['team', 8.86], ['have', 9.06], ['more', 9.28]] },
  { out: 10.98, words: [['things', 9.86], ['to', 10.04], ['focus', 10.36], ['on', 10.6]] },
  { out: 12.16, words: [['your', 11.0], ['customer', 11.32], ['success', 11.68], ['team', 12.0]] },
  { out: 13.96, words: [['should', 12.18], ['be', 12.28], ['helping', 12.5], ['customers', 13.0]] },
  { out: 15.7, words: [['not', 13.98], ['repeating', 14.3], ['the', 14.54], ['same', 14.76]] },
  { out: 16.83, words: [['process', 15.72], ['every', 16.16], ['new', 16.36], ['week', 16.62]] },
  { out: 18.56, words: [['so', 17.01], ['how', 17.16], ['do', 17.28], ['we', 17.4], ['break', 17.58], ['that', 17.78], ['*circle?*', 18.06]] },
  { out: 20.06, words: [['you', 18.68], ['turn', 18.9], ['your', 19.08], ["team's", 19.36]] },
  { out: 21.9, words: [['into', 20.08], ['structured', 20.6], ['customer', 21.04], ['training', 21.48]] },
  { out: 23.24, words: [['that', 21.92], ['people', 22.28], ['can', 22.48], ['access', 22.92]] },
  { out: 24.44, words: [['*whenever*', 23.24], ['they', 23.54], ['need', 23.78], ['it', 23.98]] },
  { out: 25.8, words: [['and', 24.46], ["that's", 24.56], ['what', 24.84]] },
  { out: 26.43, words: [['helps', 25.8], ['you', 25.98], ['do', 26.14]] },
  { out: 27.92, words: [['with', 26.6], ['ClassroomIO,', 26.84]] },
  { out: FOOTAGE_END, words: [['we', 27.94], ['teach', 28.16], ['and', 28.54], ['we', 28.7], ['teach', 28.9]] }
];

/* Big words behind the speaker, on the white wall (the story graphics in graphics.js fill the other beats). Each starts at WALL_LEFT, just behind her right-hand braids
 * (hair edge sways between x 985 and 1007), so only a sliver of the first letter tucks behind her. y is the first line's centre. */
const WALL_LEFT = 960;
const BEHIND = [
  { lines: ['important'], at: 9.58, out: 10.96, size: 180, y: 420 },
  { lines: ['succeed'], at: 13.5, out: 14.25, size: 215, y: 420 },
  { lines: ['once.'], at: 29.16, out: FOOTAGE_END, size: 330, y: 400, serif: true }
];

const ONCE_ON_OUTRO = { in: FOOTAGE_END, hold: 29.86, out: 30.22 };

function wordNode(parent, raw) {
  const isSerif = raw.startsWith('*');
  const text = isSerif ? raw.slice(1, -1) : raw;
  const node = el('span', isSerif ? 'serif-i' : '', parent, text);
  css(node, {
    display: 'inline-block',
    marginRight: '0.24em',
    fontSize: (isSerif ? FRONT_SIZE * 1.5 : FRONT_SIZE) + 'px',
    lineHeight: '1',
    letterSpacing: isSerif ? '0' : '-0.02em',
    fontWeight: isSerif ? 400 : 700
  });

  return node;
}

function bigWord(parent, word) {
  const holder = el('div', 'abs', parent);
  css(holder, {
    left: WALL_LEFT + 'px',
    top: word.y - word.size * 0.6 + 'px',
    whiteSpace: 'nowrap',
    color: word.color || INK,
    lineHeight: '0.98',
    transformOrigin: '0 50%'
  });
  const spans = [];
  word.lines.forEach((text) => {
    const line = el('div', word.serif ? 'serif-i' : '', holder);
    css(line, {
      fontFamily: word.serif ? undefined : 'Poppins, sans-serif',
      fontWeight: word.serif ? 400 : 700,
      fontSize: word.size + 'px',
      letterSpacing: word.serif ? '-0.01em' : '-0.045em'
    });
    spans.push(...letters(line, text));
  });

  return { holder, spans };
}

function updateBigWord(handles, T, word, fadeFrom, fadeTo, settleEnd = fadeTo) {
  lettersIn(handles.spans, T, word.at - 0.05, { stagger: 0.022, duration: 0.42, distance: 46, blur: 12 });
  const leave = ep(T, fadeFrom, fadeTo, ease.inCubic);
  const settle = prog(T, word.at, settleEnd);
  handles.holder.style.opacity = String(0.94 * (1 - leave));
  handles.holder.style.transform = `scale(${1 + 0.025 * settle}) translateY(${-10 * leave}px)`;
}

if (LAYER === 'front' && !CAPTION_BAND) {
  scene({
    id: 'front-00-scrim',
    in: 0,
    out: FOOTAGE_END,
    build(root) {
      const scrim = el('div', 'abs', root);
      css(scrim, { left: '0', right: '0', bottom: '0', height: '300px', background: 'linear-gradient(to bottom, rgba(12,9,6,0) 0%, rgba(12,9,6,0.32) 45%, rgba(12,9,6,0.58) 100%)' });

      return { scrim };
    },
    update() {}
  });
}

if (LAYER === 'front') {
  FRONT.forEach((phrase, index) => {
    const first = phrase.words[0][1];
    scene({
      id: `front-${String(index + 1).padStart(2, '0')}`,
      in: first - 0.04,
      out: phrase.out,
      build(root) {
        const line = el('div', 'abs', root);
        css(line, {
          left: FRONT_X - 700 + 'px',
          width: '1400px',
          top: FRONT_Y - FRONT_SIZE * 0.6 + 'px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          fontFamily: 'Poppins, sans-serif',
          color: '#FFFFFF',
          textShadow: FRONT_SHADOW
        });
        const nodes = phrase.words.map(([raw]) => wordNode(line, raw));

        return { line, nodes };
      },
      update({ T, s }) {
        s.line.style.top = captionY(T) - FRONT_SIZE * 0.6 + 'px';
        s.nodes.forEach((node, wordIndex) => {
          const start = phrase.words[wordIndex][1] - 0.04;
          const pop = ep(T, start, start + 0.2, ease.outBack);
          node.style.opacity = String(prog(T, start, start + 0.07));
          node.style.transform = `translateY(${10 * (1 - ep(T, start, start + 0.16))}px) scale(${lerp(0.84, 1, pop)})`;
        });
        const isCut = phrase.out === FOOTAGE_END || [5.0, 8.03, 16.83, 18.56, 26.43].includes(phrase.out);
        const leave = isCut ? 0 : ep(T, phrase.out - 0.08, phrase.out, ease.inCubic);
        s.line.style.opacity = String(1 - leave);
      }
    });
  });

  const outroWord = BEHIND[BEHIND.length - 1];
  scene({
    id: 'once-on-outro',
    in: ONCE_ON_OUTRO.in,
    out: ONCE_ON_OUTRO.out,
    build(root) {
      return bigWord(root, outroWord);
    },
    update({ T, s }) {
      s.spans.forEach((span) => {
        span.style.opacity = '1';
        span.style.transform = 'none';
        span.style.filter = 'none';
      });
      const leave = ep(T, ONCE_ON_OUTRO.hold, ONCE_ON_OUTRO.out, ease.inCubic);
      const settle = prog(T, outroWord.at, ONCE_ON_OUTRO.out);
      s.holder.style.opacity = String(0.94 * (1 - leave));
      s.holder.style.transform = `scale(${1 + 0.025 * settle}) translateY(${-14 * leave}px)`;
      s.holder.style.filter = `blur(${8 * leave}px)`;
    }
  });
} else {
  BEHIND.forEach((word, index) => {
    scene({
      id: `behind-${index + 1}-${word.lines.join('-').replace(/[^a-z-]+/g, '')}`,
      in: word.at - 0.06,
      out: word.out,
      behind: [word.at - 0.06, word.out],
      build(root) {
        return bigWord(root, word);
      },
      update({ T, s }) {
        const endsOnCut = word.out === FOOTAGE_END || [4.98, 16.82, 26.42].includes(word.out);
        if (endsOnCut) {
          updateBigWord(s, T, word, word.out + 1, word.out + 2, word.serif ? ONCE_ON_OUTRO.out : word.out);
          return;
        }

        updateBigWord(s, T, word, word.out - 0.22, word.out);
      }
    });
  });
}
