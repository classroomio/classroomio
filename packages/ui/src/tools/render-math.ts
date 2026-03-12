import katex from 'katex';
import 'katex/dist/katex.min.css';

const MATH_NODE_SELECTOR = '[data-type="inline-math"], [data-type="block-math"]';

export function renderMathInElement(root: ParentNode): void {
  const mathNodes = root.querySelectorAll<HTMLElement>(MATH_NODE_SELECTOR);

  for (const mathNode of mathNodes) {
    if (mathNode.dataset.mathRendered === 'true') continue;

    const latex = mathNode.getAttribute('data-latex');
    const mathType = mathNode.getAttribute('data-type');

    if (!latex || (mathType !== 'inline-math' && mathType !== 'block-math')) continue;

    katex.render(latex, mathNode, {
      displayMode: mathType === 'block-math',
      throwOnError: false
    });

    mathNode.dataset.mathRendered = 'true';
  }
}
