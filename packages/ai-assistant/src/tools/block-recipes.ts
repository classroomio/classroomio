/**
 * Lesson-body block types the editor supports beyond the always-allowed base set
 * (headings/paragraphs/lists/emphasis/callout/inline svg). Their markup is deliberately
 * kept out of the system prompt — only a one-line summary of each is listed there — and
 * fetched on demand via the get_block_recipe tool right before the agent uses one, so a
 * lesson that never needs a table or divider doesn't pay for that prompt text.
 */
export const BLOCK_RECIPE_TYPES = ['horizontal_rule', 'table'] as const;

export type BlockRecipeType = (typeof BLOCK_RECIPE_TYPES)[number];

type BlockRecipe = {
  summary: string;
  markup: string;
};

const BLOCK_RECIPES: Record<BlockRecipeType, BlockRecipe> = {
  horizontal_rule: {
    summary: 'A horizontal divider line to visually separate parts of a lesson.',
    markup:
      'Insert a bare <hr> on its own line between two block elements. No attributes, no wrapping <div>, no inline <svg>, and no CSS — the editor renders the divider itself.\n\nExample:\n<p>End of the first part.</p>\n<hr>\n<h3>Next part</h3>'
  },
  table: {
    summary: 'A data table with a header row and one or more body rows.',
    markup:
      'Use plain HTML table markup: header cells as <th> in the first <tr>, every other row as <td> cells. No colspan/rowspan, no inline styles, no nested tables.\n\nExample:\n<table><tbody><tr><th>Column A</th><th>Column B</th></tr><tr><td>Value 1</td><td>Value 2</td></tr></tbody></table>'
  }
};

export function buildBlockRecipeManifest(): string {
  return BLOCK_RECIPE_TYPES.map((type) => `- ${type}: ${BLOCK_RECIPES[type].summary}`).join('\n');
}

export function getBlockRecipeMarkup(blockType: BlockRecipeType): string {
  return BLOCK_RECIPES[blockType].markup;
}
