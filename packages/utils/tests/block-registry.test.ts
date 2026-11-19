import { describe, expect, it } from 'vitest';

import {
  AGENT_AUTHORED_BLOCK_TYPES,
  BLOCK_DEFINITIONS,
  BLOCK_TYPES,
  ZBlockCreate,
  getBlockAgentAuthoring,
  getBlockAssetId,
  listBlockMedia,
  parseBlockData,
  toPublicBlockData,
  withBlockMedia
} from '../src/validation/block';

const ASSET_ID = '7f3c6c2e-3a7b-4d5e-9f10-1a2b3c4d5e6f';

describe('block registry', () => {
  it('keys every definition by its own type', () => {
    for (const [key, definition] of Object.entries(BLOCK_DEFINITIONS)) {
      expect(definition.key).toBe(key);
    }
  });

  it('accepts a create payload for every registered type', () => {
    const samples = {
      note: { type: 'note', data: {}, content: '<p>Hi</p>' },
      video: { type: 'video', data: { type: 'youtube', link: 'https://youtu.be/abc' } },
      slides: {
        type: 'slides',
        data: { src: 'https://www.canva.com/design/DAH/abc/view?embed', platform: 'canva' }
      },
      document: { type: 'document', data: { type: 'pdf', name: 'a.pdf', link: '/a.pdf', key: 'a' } },
      image: { type: 'image', data: { url: 'https://example.com/a.png', fit: 'contain' } },
      chart: {
        type: 'chart',
        data: { title: 'Revenue', type: 'bar', points: [{ id: 'a', label: 'Q1', value: 30 }] }
      },
      flashcards: {
        type: 'flashcards',
        data: { cards: [{ id: 'a', question: 'What is HTTP?', answer: 'A protocol for the web.' }] }
      },
      tabs: {
        type: 'tabs',
        data: { align: 'center', tabs: [{ id: 'a', name: 'Overview', note: '' }] }
      },
      multiple_choice: {
        type: 'multiple_choice',
        data: {
          question: 'What is the capital city of Italy?',
          options: [
            { id: 'a', text: 'Rome' },
            { id: 'b', text: 'Athens' }
          ],
          correctOptionId: 'a'
        }
      },
      process: {
        type: 'process',
        data: { steps: [{ id: 'a', heading: 'Introduction', body: 'Start here.' }] }
      }
    };

    expect(Object.keys(samples).sort()).toEqual([...BLOCK_TYPES].sort());

    for (const sample of Object.values(samples)) {
      expect(ZBlockCreate.safeParse(sample).success).toBe(true);
    }
  });

  it('requires at least one flashcard with a unique id', () => {
    const card = { id: 'a', question: 'Q', answer: 'A' };

    expect(ZBlockCreate.safeParse({ type: 'flashcards', data: { cards: [] } }).success).toBe(false);
    expect(ZBlockCreate.safeParse({ type: 'flashcards', data: { cards: [card, card] } }).success).toBe(false);
  });

  it('keeps a chart between 1 and 12 non-negative points with unique ids', () => {
    const point = { id: 'a', label: 'Q1', value: 30 };
    const chart = (points: unknown[], type = 'bar') => ({ type: 'chart', data: { title: 'Revenue', type, points } });
    const twelvePoints = Array.from({ length: 12 }, (_, index) => ({ ...point, id: `p${index}` }));

    expect(ZBlockCreate.safeParse(chart(twelvePoints)).success).toBe(true);
    expect(ZBlockCreate.safeParse(chart([])).success).toBe(false);
    expect(ZBlockCreate.safeParse(chart([...twelvePoints, { ...point, id: 'p12' }])).success).toBe(false);
    expect(ZBlockCreate.safeParse(chart([{ ...point, value: -1 }])).success).toBe(false);
    expect(ZBlockCreate.safeParse(chart([point, point])).success).toBe(false);
    expect(ZBlockCreate.safeParse(chart([point], 'area')).success).toBe(false);
  });

  it('keeps a process between 1 and 20 steps with unique ids and optional image URLs', () => {
    const step = { id: 'a', heading: 'Intro', body: 'Start here.' };
    const process = (steps: unknown[]) => ({ type: 'process', data: { steps } });
    const twentySteps = Array.from({ length: 20 }, (_, index) => ({ ...step, id: `s${index}` }));

    expect(ZBlockCreate.safeParse(process(twentySteps)).success).toBe(true);
    expect(ZBlockCreate.safeParse(process([{ ...step, imageUrl: 'https://example.com/a.png' }])).success).toBe(true);
    expect(ZBlockCreate.safeParse(process([])).success).toBe(false);
    expect(ZBlockCreate.safeParse(process([...twentySteps, { ...step, id: 's20' }])).success).toBe(false);
    expect(ZBlockCreate.safeParse(process([step, step])).success).toBe(false);
    expect(ZBlockCreate.safeParse(process([{ ...step, imageUrl: 'not a url' }])).success).toBe(false);
  });

  it('keeps tabs between 1 and 10 with unique ids and a known alignment', () => {
    const tab = { id: 'a', name: 'Overview', note: '' };
    const tabs = (items: unknown[], align = 'center') => ({ type: 'tabs', data: { align, tabs: items } });
    const tenTabs = Array.from({ length: 10 }, (_, index) => ({ ...tab, id: `t${index}` }));

    expect(ZBlockCreate.safeParse(tabs(tenTabs)).success).toBe(true);
    expect(ZBlockCreate.safeParse(tabs([])).success).toBe(false);
    expect(ZBlockCreate.safeParse(tabs([...tenTabs, { ...tab, id: 't10' }])).success).toBe(false);
    expect(ZBlockCreate.safeParse(tabs([tab, tab])).success).toBe(false);
    expect(ZBlockCreate.safeParse(tabs([tab], 'justify')).success).toBe(false);
  });

  it('keeps at most one image or video in a tab and validates it like the matching block', () => {
    const withMedia = (media: unknown) => ({
      type: 'tabs',
      data: { align: 'center', tabs: [{ id: 'a', name: 'One', note: '', media }] }
    });

    expect(
      ZBlockCreate.safeParse(withMedia({ kind: 'image', data: { url: 'https://example.com/a.png' } })).success
    ).toBe(true);
    expect(
      ZBlockCreate.safeParse(withMedia({ kind: 'video', data: { type: 'youtube', link: 'https://youtu.be/x' } }))
        .success
    ).toBe(true);
    expect(ZBlockCreate.safeParse(withMedia({ kind: 'image', data: { url: 'not a url' } })).success).toBe(false);
    expect(
      ZBlockCreate.safeParse(withMedia({ kind: 'video', data: { type: 'youtube', link: 'javascript:alert(1)' } }))
        .success
    ).toBe(false);
    expect(ZBlockCreate.safeParse(withMedia({ kind: 'note', data: {} })).success).toBe(false);
    expect(
      ZBlockCreate.safeParse(withMedia([{ kind: 'image', data: { url: 'https://example.com/a.png' } }])).success
    ).toBe(false);
  });

  it('lists the videos inside tabs as media, puts signed copies back, and projects them for public pages', () => {
    const video = {
      type: 'upload',
      link: '',
      assetId: ASSET_ID,
      key: 'org/video.mp4',
      metadata: { thumbnailUrl: 'https://example.com/t.png', secret: 'x' }
    };
    const data = {
      align: 'center',
      tabs: [
        { id: 'a', name: 'One', note: '', media: { kind: 'image', data: { url: 'https://example.com/a.png' } } },
        { id: 'b', name: 'Two', note: '', media: { kind: 'video', data: video } },
        { id: 'c', name: 'Three', note: '' }
      ]
    };

    expect(listBlockMedia('tabs', data)).toEqual([{ media: 'video', data: video }]);
    expect(listBlockMedia('video', { type: 'youtube', link: 'https://youtu.be/x' })).toHaveLength(1);
    expect(listBlockMedia('note', {})).toEqual([]);

    const signed = withBlockMedia('tabs', data, [
      { ...video, link: 'https://signed.example.com/v.mp4' }
    ]) as typeof data;
    expect(signed.tabs[1].media).toEqual({
      kind: 'video',
      data: { ...video, link: 'https://signed.example.com/v.mp4' }
    });
    expect(signed.tabs[0]).toEqual(data.tabs[0]);

    const publicData = toPublicBlockData('tabs', data) as typeof data;
    expect(publicData.tabs[1].media?.data).not.toHaveProperty('metadata.secret');
    expect(publicData.tabs[1].media?.data).toMatchObject({ metadata: { thumbnailUrl: 'https://example.com/t.png' } });
  });

  it('reads asset ids only from media types', () => {
    expect(getBlockAssetId('video', { assetId: ASSET_ID })).toBe(ASSET_ID);
    expect(getBlockAssetId('document', { assetId: ASSET_ID })).toBe(ASSET_ID);
    expect(getBlockAssetId('image', { assetId: ASSET_ID })).toBeNull();
    expect(getBlockAssetId('unknown', { assetId: ASSET_ID })).toBeNull();
  });

  it('keeps documents off public pages and strips video metadata', () => {
    expect(toPublicBlockData('document', { type: 'pdf', name: 'a.pdf', link: '/a.pdf', key: 'a' })).toBeNull();
    expect(
      toPublicBlockData('video', {
        type: 'youtube',
        link: 'https://youtu.be/abc',
        metadata: { thumbnailUrl: 'https://img/a.jpg', internal: 'secret' }
      })
    ).toEqual({
      type: 'youtube',
      link: 'https://youtu.be/abc',
      assetId: undefined,
      metadata: { thumbnailUrl: 'https://img/a.jpg' }
    });
  });

  it('lets the assistant author the five interactive blocks and nothing that points at uploaded media', () => {
    expect(AGENT_AUTHORED_BLOCK_TYPES).toEqual(['chart', 'flashcards', 'tabs', 'multiple_choice', 'process']);
    expect(getBlockAgentAuthoring('video')).toBeNull();
    expect(getBlockAgentAuthoring('unknown')).toBeNull();
  });

  it('round-trips authored data through what the assistant reads and writes', () => {
    const samples = {
      chart: { title: 'Sales', type: 'bar', points: [{ id: 'a', label: 'Q1', value: 3 }] },
      flashcards: { cards: [{ id: 'a', question: 'Q', answer: 'A' }] },
      tabs: { align: 'center', tabs: [{ id: 'a', name: 'One', note: 'Hi' }] },
      multiple_choice: {
        question: 'Q',
        options: [
          { id: 'a', text: 'Yes' },
          { id: 'b', text: 'No' }
        ],
        correctOptionId: 'a'
      },
      process: { steps: [{ id: 'a', heading: 'Start', body: 'Do it' }] }
    };

    for (const type of AGENT_AUTHORED_BLOCK_TYPES) {
      const authoring = getBlockAgentAuthoring(type);
      const input = authoring?.inputSchema.parse(authoring.toInput(samples[type]));
      const data = input ? authoring?.fromInput(input, null) : null;

      expect(parseBlockData(type, data)).toEqual(samples[type]);
    }
  });

  it('keeps a tab video and image fit the assistant cannot write, and drops an image it leaves out', () => {
    const authoring = getBlockAgentAuthoring('tabs');
    const video = { type: 'youtube', link: 'https://youtu.be/abc' };
    const previous = {
      align: 'center',
      tabs: [
        { id: 'a', name: 'One', note: '', media: { kind: 'video', data: video } },
        {
          id: 'b',
          name: 'Two',
          note: '',
          media: { kind: 'image', data: { url: 'https://x.test/b.png', fit: 'contain' } }
        },
        { id: 'c', name: 'Three', note: '', media: { kind: 'image', data: { url: 'https://x.test/c.png' } } }
      ]
    };

    const read = authoring?.toInput(previous);
    expect(read).toEqual({
      align: 'center',
      tabs: [
        { id: 'a', name: 'One', note: '', hasVideo: true },
        { id: 'b', name: 'Two', note: '', image: { url: 'https://x.test/b.png' } },
        { id: 'c', name: 'Three', note: '', image: { url: 'https://x.test/c.png' } }
      ]
    });

    const input = authoring?.inputSchema.parse({
      align: 'center',
      tabs: [
        { id: 'a', name: 'One', note: '', hasVideo: true },
        { id: 'b', name: 'Two', note: '', image: { url: 'https://x.test/new.png' } },
        { id: 'c', name: 'Three', note: '' }
      ]
    });
    const next = input ? authoring?.fromInput(input, previous) : null;

    expect(next).toEqual({
      align: 'center',
      tabs: [
        { id: 'a', name: 'One', note: '', media: { kind: 'video', data: video } },
        {
          id: 'b',
          name: 'Two',
          note: '',
          media: { kind: 'image', data: { url: 'https://x.test/new.png', fit: 'contain' } }
        },
        { id: 'c', name: 'Three', note: '' }
      ]
    });
  });

  it('accepts only https images from the assistant in a tab', () => {
    const authoring = getBlockAgentAuthoring('tabs');
    const input = {
      align: 'center',
      tabs: [{ id: 'a', name: 'One', note: '', image: { url: 'http://x.test/a.png' } }]
    };

    expect(authoring?.inputSchema.safeParse(input).success).toBe(false);
  });

  it('accepts only https images from the assistant in a multiple choice or process block', () => {
    const multipleChoice = getBlockAgentAuthoring('multiple_choice');
    const process = getBlockAgentAuthoring('process');
    const options = [
      { id: 'a', text: 'Yes' },
      { id: 'b', text: 'No' }
    ];
    const question = { question: 'Q', options, correctOptionId: 'a' };

    expect(multipleChoice?.inputSchema.safeParse({ ...question, imageUrl: 'http://x.test/a.png' }).success).toBe(false);
    expect(multipleChoice?.inputSchema.safeParse({ ...question, imageUrl: 'https://x.test/a.png' }).success).toBe(true);
    expect(multipleChoice?.inputSchema.safeParse(question).success).toBe(true);
    expect(
      process?.inputSchema.safeParse({
        steps: [{ id: 'a', heading: 'Start', body: '', imageUrl: 'http://x.test/a.png' }]
      }).success
    ).toBe(false);
  });

  it('keeps an existing http image through a text-only edit by the assistant', () => {
    const tabs = getBlockAgentAuthoring('tabs');
    const tabsData = {
      align: 'center',
      tabs: [{ id: 'a', name: 'One', note: '', media: { kind: 'image', data: { url: 'http://x.test/a.png' } } }]
    };
    const tabsRead = tabs?.toInput(tabsData);
    expect(tabsRead).toEqual({ align: 'center', tabs: [{ id: 'a', name: 'One', note: '', keepImage: true }] });
    const tabsInput = tabs?.inputSchema.parse({
      align: 'center',
      tabs: [{ id: 'a', name: 'Renamed', note: '', keepImage: true }]
    });
    expect(tabsInput ? tabs?.fromInput(tabsInput, tabsData) : null).toEqual({
      align: 'center',
      tabs: [{ id: 'a', name: 'Renamed', note: '', media: { kind: 'image', data: { url: 'http://x.test/a.png' } } }]
    });

    const multipleChoice = getBlockAgentAuthoring('multiple_choice');
    const questionData = {
      question: 'Q',
      options: [
        { id: 'a', text: 'Yes' },
        { id: 'b', text: 'No' }
      ],
      correctOptionId: 'a',
      imageUrl: 'http://x.test/q.png'
    };
    const questionRead = multipleChoice?.inputSchema.parse(multipleChoice.toInput(questionData));
    expect(questionRead).toMatchObject({ keepImage: true });
    expect(questionRead).not.toHaveProperty('imageUrl');
    expect(questionRead ? multipleChoice?.fromInput({ ...questionRead, question: 'New' }, questionData) : null).toEqual(
      {
        ...questionData,
        question: 'New'
      }
    );

    const process = getBlockAgentAuthoring('process');
    const processData = {
      steps: [
        { id: 'a', heading: 'Start', body: '', imageUrl: 'http://x.test/a.png' },
        { id: 'b', heading: 'Next', body: '', imageUrl: 'https://x.test/b.png' }
      ]
    };
    const processRead = process?.inputSchema.parse(process.toInput(processData));
    expect(processRead).toEqual({
      steps: [
        { id: 'a', heading: 'Start', body: '', keepImage: true },
        { id: 'b', heading: 'Next', body: '', imageUrl: 'https://x.test/b.png' }
      ]
    });
    expect(processRead ? process?.fromInput(processRead, processData) : null).toEqual(processData);
    expect(processRead ? process?.fromInput(processRead, null) : null).toEqual({
      steps: [
        { id: 'a', heading: 'Start', body: '' },
        { id: 'b', heading: 'Next', body: '', imageUrl: 'https://x.test/b.png' }
      ]
    });
  });
});
