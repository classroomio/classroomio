import type { CorpusPage } from '../corpus/types';
import type { BlockLookup, SourceBlock } from './types';

/**
 * Every block of the corpus by id. Pages with identical content share block ids, so a block on a taught page wins over
 * the same block on an excluded one.
 */
export function corpusBlockLookup(pages: CorpusPage[]): BlockLookup {
  const lookup = new Map<string, SourceBlock>();
  const excludedFirst = [...pages].sort((left, right) => Number(!left.excluded) - Number(!right.excluded));

  for (const page of excludedFirst) {
    for (const block of page.blocks) {
      lookup.set(block.id, {
        id: block.id,
        text: block.text,
        pageUrl: page.url,
        kind: block.kind,
        stepNumber: block.stepNumber,
        excluded: page.excluded
      });
    }
  }

  return lookup;
}
