import { describe, expect, it } from 'vitest';

import {
  areMentionSpansValid,
  fromMentionMarkup,
  getMentionedProfileIds,
  segmentCommentBody,
  toMentionMarkup
} from '../src/functions/course-comment-mentions';

const ADA = '0b6f8a7e-6c3e-4f62-9a54-2d7c1c1f1a01';
const TUNDE = '0b6f8a7e-6c3e-4f62-9a54-2d7c1c1f1a02';

describe('fromMentionMarkup', () => {
  it('turns composer markup into a plain body with mention spans', () => {
    const result = fromMentionMarkup(`Can you check this @[Ada Obi](user:${ADA}) and @[Tunde](user:${TUNDE})?`);

    expect(result.body).toBe('Can you check this @Ada Obi and @Tunde?');
    expect(result.mentions).toEqual([
      { profileId: ADA, start: 19, end: 27 },
      { profileId: TUNDE, start: 32, end: 38 }
    ]);
    expect(result.body.slice(19, 27)).toBe('@Ada Obi');
  });

  it('shifts spans when leading whitespace is trimmed', () => {
    const result = fromMentionMarkup(`   @[Ada Obi](user:${ADA}) please look  `);

    expect(result.body).toBe('@Ada Obi please look');
    expect(result.mentions).toEqual([{ profileId: ADA, start: 0, end: 8 }]);
  });

  it('leaves text that only looks like markup alone', () => {
    const result = fromMentionMarkup('@[Ada](user:not-a-uuid) and an email a@b.com');

    expect(result.mentions).toEqual([]);
    expect(result.body).toBe('@[Ada](user:not-a-uuid) and an email a@b.com');
  });

  it('lowercases profile ids', () => {
    const result = fromMentionMarkup(`@[Ada](user:${ADA.toUpperCase()})`);

    expect(result.mentions[0].profileId).toBe(ADA);
  });
});

describe('toMentionMarkup', () => {
  it('round-trips with current names', () => {
    const { body, mentions } = fromMentionMarkup(`Hi @[Ada Obi](user:${ADA}), thanks`);
    const markup = toMentionMarkup(body, mentions, (profileId) => (profileId === ADA ? 'Ada O.' : null));

    expect(markup).toBe(`Hi @[Ada O.](user:${ADA}), thanks`);
    expect(fromMentionMarkup(markup).body).toBe('Hi @Ada O., thanks');
  });

  it('keeps the stored name when the person is unknown', () => {
    const markup = toMentionMarkup('Hi @Ada', [{ profileId: ADA, start: 3, end: 7 }], () => null);

    expect(markup).toBe(`Hi @[Ada](user:${ADA})`);
  });
});

describe('areMentionSpansValid', () => {
  it('accepts spans that start with @ and do not overlap', () => {
    expect(
      areMentionSpansValid('@Ada and @Tunde', [
        { profileId: ADA, start: 0, end: 4 },
        { profileId: TUNDE, start: 9, end: 15 }
      ])
    ).toBe(true);
  });

  it('rejects out-of-bounds, overlapping, empty and non-@ spans', () => {
    expect(areMentionSpansValid('@Ada', [{ profileId: ADA, start: 0, end: 10 }])).toBe(false);
    expect(
      areMentionSpansValid('@Ada', [
        { profileId: ADA, start: 0, end: 3 },
        { profileId: TUNDE, start: 2, end: 4 }
      ])
    ).toBe(false);
    expect(areMentionSpansValid('@Ada', [{ profileId: ADA, start: 2, end: 2 }])).toBe(false);
    expect(areMentionSpansValid('Ada', [{ profileId: ADA, start: 0, end: 3 }])).toBe(false);
  });
});

describe('segmentCommentBody', () => {
  it('splits mentions and links and keeps everything else as text', () => {
    const segments = segmentCommentBody('@Ada see https://example.com/study. Thanks', [
      { profileId: ADA, start: 0, end: 4 }
    ]);

    expect(segments).toEqual([
      { kind: 'mention', text: '@Ada', profileId: ADA },
      { kind: 'text', text: ' see ' },
      { kind: 'link', text: 'https://example.com/study', href: 'https://example.com/study' },
      { kind: 'text', text: '. Thanks' }
    ]);
  });

  it('never turns non-http schemes into links', () => {
    const segments = segmentCommentBody('javascript:alert(1) <b>hi</b>', []);

    expect(segments).toEqual([{ kind: 'text', text: 'javascript:alert(1) <b>hi</b>' }]);
  });

  it('renders invalid spans as plain text', () => {
    expect(segmentCommentBody('hello', [{ profileId: ADA, start: 0, end: 3 }])).toEqual([
      { kind: 'text', text: 'hello' }
    ]);
  });
});

describe('getMentionedProfileIds', () => {
  it('returns distinct ids in order', () => {
    expect(
      getMentionedProfileIds([
        { profileId: TUNDE, start: 10, end: 16 },
        { profileId: ADA, start: 0, end: 4 },
        { profileId: TUNDE, start: 20, end: 26 }
      ])
    ).toEqual([ADA, TUNDE]);
  });
});
