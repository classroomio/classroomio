import { describe, expect, it } from 'vitest';
import type * as z from 'zod/v4';

import type { CorpusBlock, CorpusPage } from '../corpus/types';
import { ClaudeRefusalError, type ClaudeRequest } from '../llm/claude';
import type { StructuredCaller } from '../verify/types';
import { addAliases, buildGlossary, type GlossaryEntry } from './glossary';
import { CARD_SYSTEM, pageCard, pageCards, splitPage, type CardDraft, type PageCard } from './page-card';

function block(id: string, kind: CorpusBlock['kind'], text: string, extra: Partial<CorpusBlock> = {}): CorpusBlock {
  return { id, kind, text, headingPath: [], ...extra };
}

function corpusPage(pageId: string, blocks: CorpusBlock[]): CorpusPage {
  return {
    pageId,
    url: `https://acme.com/docs/${pageId}`,
    title: `Page ${pageId}`,
    path: ['Docs'],
    order: 0,
    contentHash: pageId,
    blocks,
    wordCount: 100,
    excluded: null,
    referenceOnly: false
  };
}

const METERS = corpusPage('meters', [
  block('m-0', 'heading', 'Add a meter'),
  block('m-1', 'paragraph', 'A meter reports a reading every 15 minutes to the Meters screen.'),
  block('m-2', 'step', 'Open Settings.', { stepNumber: 1 }),
  block('m-3', 'step', 'Choose Add meter.', { stepNumber: 2 }),
  block('m-4', 'image', 'The Meters screen', { imageUrl: 'https://acme.com/m.png' })
]);

function draft(overrides: Partial<CardDraft> = {}): CardDraft {
  return {
    type: 'how-to',
    audience: ['Facility manager'],
    level: 'beginner',
    summary: 'How to add a meter. Meters report every 15 minutes.',
    keyFacts: [],
    procedures: [],
    names: [],
    prerequisites: [],
    freshness: { looksObsolete: false, clues: [] },
    ...overrides
  };
}

function fakeCaller(answer: (request: ClaudeRequest) => unknown): StructuredCaller & { calls: ClaudeRequest[] } {
  const calls: ClaudeRequest[] = [];

  return {
    calls,
    async structured<Schema extends z.ZodType>(request: ClaudeRequest & { schema: Schema }) {
      calls.push(request);

      return request.schema.parse(await answer(request)) as z.infer<Schema>;
    }
  };
}

function promptOf(request: ClaudeRequest): string {
  const first = request.content[0];

  return first.type === 'text' ? first.text : '';
}

describe('page cards', () => {
  it('cites block ids in the prompt and keeps only what the page supports', async () => {
    const caller = fakeCaller(() =>
      draft({
        keyFacts: [
          { fact: 'Meters report every 15 minutes.', blockIds: ['m-1', 'm-9'] },
          { fact: 'Meters cost nothing.', blockIds: ['m-9'] }
        ],
        procedures: [{ title: 'Add a meter', blockIds: ['m-2', 'm-3'] }],
        names: [
          { name: 'add meter', kind: 'button' },
          { name: 'Meters', kind: 'screen' },
          { name: 'Billing', kind: 'screen' }
        ]
      })
    );

    const card = await pageCard(caller, METERS);

    expect(caller.calls[0].role).toBe('card');
    expect(caller.calls[0].system).toBe(CARD_SYSTEM);
    expect(promptOf(caller.calls[0])).toContain('[m-2] (step) Open Settings.');
    expect(card.keyFacts).toEqual([{ fact: 'Meters report every 15 minutes.', blockIds: ['m-1'] }]);
    expect(card.procedures).toEqual([{ title: 'Add a meter', stepCount: 2, blockIds: ['m-2', 'm-3'] }]);
    expect(card.names).toEqual([
      { name: 'Add meter', kind: 'button' },
      { name: 'Meters', kind: 'screen' }
    ]);
    expect(card.media).toEqual({ screenshots: 1, videos: 0 });
    expect(card.dropped).toEqual({ facts: 1, procedures: 0, names: 1 });
  });

  it('splits a long page into parts that start at headings and keep every block in order', async () => {
    const paragraph = 'Readings arrive from every meter and are stored for two years. '.repeat(40);
    const blocks = [0, 1, 2, 3].flatMap((index) => [
      block(`h-${index}`, 'heading', `Topic ${index}`),
      block(`p-${index}`, 'paragraph', paragraph)
    ]);
    const parts = splitPage(blocks, 6_000);

    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((part) => part[0].kind === 'heading')).toBe(true);
    expect(parts.flat()).toEqual(blocks);
  });

  it('marks a split page obsolete when any part looks obsolete, and keeps the first part classification', async () => {
    const paragraph = 'x'.repeat(30_000);
    const blocks = [
      block('a', 'heading', 'Start'),
      block('b', 'paragraph', paragraph),
      block('c', 'heading', 'Legacy settings'),
      block('d', 'paragraph', paragraph)
    ];
    const caller = fakeCaller((request) =>
      promptOf(request).includes('part="1 of 2"')
        ? draft({ type: 'concept' })
        : draft({ type: 'reference', freshness: { looksObsolete: true, clues: ['Legacy settings'] } })
    );

    const card = await pageCard(caller, corpusPage('split', blocks));

    expect(card.parts).toBe(2);
    expect(card.type).toBe('concept');
    expect(card.freshness).toEqual({ looksObsolete: true, clues: ['Legacy settings'] });
  });

  it('runs at most `concurrency` cards at once, retries a failure once, and records pages that still fail', async () => {
    const pages = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) =>
      corpusPage(id, [block(`${id}-0`, 'paragraph', `Page ${id} text.`)])
    );
    const attempts = new Map<string, number>();
    let inFlight = 0;
    let mostInFlight = 0;
    const caller = fakeCaller(async (request) => {
      const pageId = promptOf(request).match(/title="Page (\w)"/)![1];
      attempts.set(pageId, (attempts.get(pageId) ?? 0) + 1);
      inFlight += 1;
      mostInFlight = Math.max(mostInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      if (pageId === 'b' && attempts.get(pageId) === 1) throw new Error('schema mismatch');
      if (pageId === 'c') throw new Error('schema mismatch');
      if (pageId === 'd') throw new ClaudeRefusalError('card', null);

      return draft();
    });
    const seen: string[] = [];

    const run = await pageCards(caller, pages, { concurrency: 2, onCard: (card) => seen.push(card.pageId) });

    expect(mostInFlight).toBe(2);
    expect([...run.cards.keys()].sort()).toEqual(['a', 'b', 'e', 'f']);
    expect(seen.sort()).toEqual(['a', 'b', 'e', 'f']);
    expect(run.failures.map((failure) => failure.pageId).sort()).toEqual(['c', 'd']);
    expect(attempts.get('c')).toBe(2);
    expect(attempts.get('d')).toBe(1);
  });
});

function card(pageId: string, names: PageCard['names']): PageCard {
  return {
    ...draft(),
    pageId,
    procedures: [],
    names,
    media: { screenshots: 0, videos: 0 },
    parts: 1,
    dropped: { facts: 0, procedures: 0, names: 0 }
  };
}

describe('glossary', () => {
  it('groups names across pages case-insensitively and keeps the spelling most pages use', () => {
    const glossary = buildGlossary([
      card('p1', [{ name: 'Work Order', kind: 'object' }]),
      card('p2', [
        { name: 'work order', kind: 'object' },
        { name: 'Settings', kind: 'menu' }
      ]),
      card('p3', [{ name: 'work order', kind: 'screen' }])
    ]);

    expect(glossary).toEqual([
      { name: 'work order', kind: 'object', pageIds: ['p1', 'p2', 'p3'], aliases: [] },
      { name: 'Settings', kind: 'menu', pageIds: ['p2'], aliases: [] }
    ]);
  });

  const GLOSSARY: GlossaryEntry[] = [
    { name: 'Work order', kind: 'object', pageIds: ['wo'], aliases: [] },
    { name: 'Asset', kind: 'object', pageIds: ['assets'], aliases: [] },
    { name: 'Meter', kind: 'object', pageIds: ['meters'], aliases: [] }
  ];
  const PRODUCT = [
    { pageId: 'home', title: 'Acme', text: 'Plan maintenance with Smart Jobs and track every Equipment item.' }
  ];

  it('adds only aliases that cite real pages on both sides, and reports a product name given to two docs names', async () => {
    const caller = fakeCaller(() => ({
      aliases: [
        { productName: 'Smart Jobs', productPageId: 'home', docName: 'Work order', docPageId: 'wo' },
        { productName: 'Equipment', productPageId: 'home', docName: 'Asset', docPageId: 'assets' },
        { productName: 'Equipment', productPageId: 'home', docName: 'Meter', docPageId: 'meters' },
        { productName: 'Gauges', productPageId: 'home', docName: 'Meter', docPageId: 'meters' },
        { productName: 'Work Order', productPageId: 'home', docName: 'Work order', docPageId: 'wo' },
        { productName: 'Smart Jobs', productPageId: 'home', docName: 'Work order', docPageId: 'assets' }
      ]
    }));

    const result = await addAliases(caller, GLOSSARY, PRODUCT);

    expect(result.glossary.find((entry) => entry.name === 'Work order')?.aliases).toEqual([
      { name: 'Smart Jobs', productPageId: 'home', docPageId: 'wo' }
    ]);
    expect(result.glossary.find((entry) => entry.name === 'Asset')?.aliases).toEqual([]);
    expect(result.conflicts).toEqual([{ productName: 'Equipment', docNames: ['Asset', 'Meter'] }]);
    expect(result.rejected).toBe(3);
    expect(promptOf(caller.calls[0])).toContain('<product-page id="home"');
  });

  it('makes no request without product pages', async () => {
    const caller = fakeCaller(() => ({ aliases: [] }));

    const result = await addAliases(caller, GLOSSARY, []);

    expect(caller.calls).toHaveLength(0);
    expect(result.glossary).toBe(GLOSSARY);
  });
});
