import type { ThemeColors } from '@/feature/common/constants/colors';

import { GEIST_FONT_FACES } from '../../../../assets/lesson-web/geist';
import { KATEX_CSS, KATEX_JS } from '../../../../assets/lesson-web/katex';

const MATH_NODE = /data-type="(inline|block)-math"/;

export const HEIGHT_MESSAGE = 'lesson-height';

type LessonDocumentOptions = {
  html: string;
  colors: ThemeColors;
  isDark: boolean;
  /** Multiplies the base text size so the body follows the system text size setting. */
  fontScale: number;
  /** BCP 47 language of `html`, so screen readers pronounce it correctly. */
  lang?: string | null;
};

/** Mirrors `@cio/ui/tools/render-math`: TipTap stores LaTeX in `data-latex` on inline and block math nodes. */
const RENDER_MATH = `
(function () {
  if (!window.katex) return;
  document.querySelectorAll('[data-type="inline-math"], [data-type="block-math"]').forEach(function (node) {
    var latex = node.getAttribute('data-latex');
    if (!latex) return;
    try {
      window.katex.render(latex, node, { displayMode: node.getAttribute('data-type') === 'block-math', throwOnError: false });
    } catch (error) {}
  });
})();
`;

const REPORT_HEIGHT = `
(function () {
  var last = 0;
  function report() {
    var height = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (Math.abs(height - last) < 2) return;
    last = height;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${HEIGHT_MESSAGE}', height: height }));
  }
  new ResizeObserver(report).observe(document.documentElement);
  window.addEventListener('load', report);
  Array.prototype.forEach.call(document.images, function (image) { image.addEventListener('load', report); });
  report();
})();
true;
`;

function stylesheet({ colors, isDark, fontScale }: Omit<LessonDocumentOptions, 'html'>) {
  const base = 16 * fontScale;

  return `
:root { color-scheme: ${isDark ? 'dark' : 'light'}; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: ${colors.background}; }
body {
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: ${base}px;
  line-height: 1.6;
  color: ${colors.inkBody};
  -webkit-text-size-adjust: 100%;
  overflow-wrap: anywhere;
  -webkit-tap-highlight-color: transparent;
}
#lesson > :first-child { margin-top: 0; }
#lesson > :last-child { margin-bottom: 0; }
h1, h2, h3, h4, h5, h6 { color: ${colors.ink}; font-weight: 600; letter-spacing: -0.015em; line-height: 1.3; margin: 1.5em 0 0.5em; }
h1 { font-size: 1.5em; } h2 { font-size: 1.3em; } h3 { font-size: 1.12em; } h4, h5, h6 { font-size: 1em; }
p { margin: 0 0 1em; }
strong, b { color: ${colors.ink}; font-weight: 600; }
a { color: ${colors.primaryText}; text-decoration: underline; text-underline-offset: 2px; }
ul, ol { margin: 0 0 1em; padding-left: 1.4em; }
li { margin: 0.25em 0; }
li > p { margin: 0; }
ul[data-type="taskList"] { list-style: none; padding-left: 0.2em; }
ul[data-type="taskList"] li { display: flex; gap: 0.5em; align-items: flex-start; }
blockquote { margin: 1.2em 0; padding: 0.2em 0 0.2em 1em; border-left: 3px solid ${colors.borderStrong}; color: ${colors.inkMuted}; }
hr { border: 0; border-top: 1px solid ${colors.border}; margin: 1.6em 0; }
img, video, iframe { max-width: 100%; border-radius: 10px; }
img { height: auto; display: block; margin: 1em 0; border: 1px solid ${colors.border}; }
iframe { width: 100%; aspect-ratio: 16 / 9; height: auto; border: 1px solid ${colors.border}; }
figure { margin: 1em 0; }
figcaption { font-size: 0.85em; color: ${colors.inkMuted}; margin-top: 0.4em; }
code { font-family: inherit; font-size: 0.92em; background: ${colors.sand}; border: 1px solid ${colors.border}; border-radius: 6px; padding: 0.1em 0.35em; }
pre { background: ${colors.sand}; border: 1px solid ${colors.border}; border-radius: 10px; padding: 0.9em 1em; overflow-x: auto; font-size: 0.9em; line-height: 1.5; }
pre code { background: none; border: 0; padding: 0; }
table { width: 100%; border-collapse: collapse; margin: 1em 0; display: block; overflow-x: auto; font-size: 0.94em; }
th, td { border: 1px solid ${colors.border}; padding: 0.5em 0.65em; text-align: left; vertical-align: top; }
th { background: ${colors.sand}; color: ${colors.ink}; font-weight: 600; }
mark { background: ${colors.warningTint}; color: inherit; padding: 0 0.15em; border-radius: 3px; }
[data-type="block-math"] { display: block; margin: 1em 0; overflow-x: auto; overflow-y: hidden; }
.katex { font-size: 1.05em; color: ${colors.ink}; }
::selection { background: ${colors.primaryTint}; }
`;
}

export function hasMath(html: string) {
  return MATH_NODE.test(html);
}

export function buildLessonDocument({ html, colors, isDark, fontScale, lang }: LessonDocumentOptions) {
  const math = hasMath(html);

  return `<!doctype html>
<html${lang ? ` lang="${lang.replace(/[^\w-]/g, '')}"` : ''}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
<style>${GEIST_FONT_FACES}</style>
${math ? `<style>${KATEX_CSS}</style>` : ''}
<style>${stylesheet({ colors, isDark, fontScale })}</style>
</head>
<body>
<article id="lesson">${html}</article>
${math ? `<script>${KATEX_JS}</script><script>${RENDER_MATH}</script>` : ''}
</body>
</html>`;
}

export const LESSON_DOCUMENT_SCRIPT = REPORT_HEIGHT;
