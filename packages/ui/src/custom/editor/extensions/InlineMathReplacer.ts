import { textInputRule } from '@tiptap/core';
import { InlineMath } from '@tiptap/extension-mathematics';

export const InlineMathReplacer = InlineMath.extend({
	name: 'inlineMathReplacer',
	addInputRules() {
		return [
			textInputRule({
				find: /\$\$([^$]+)\$\$/,
				replace: ({ match, commands }) => {
					const latex = match[1];
					// Insert the inline math node with the LaTeX content
					commands.insertInlineMath({
						latex
					});
					return '';
				}
			})
		];
	}
});
