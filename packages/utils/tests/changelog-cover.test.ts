import { describe, expect, it } from 'vitest';

import { layoutChangelogTitle } from '../src/functions/changelog-cover';

describe('layoutChangelogTitle', () => {
  it('keeps a short title large on few lines', () => {
    const layout = layoutChangelogTitle('Students Learning Progress');

    expect(layout.fontSize).toBe(112);
    expect(layout.lines).toEqual(['Students Learning', 'Progress']);
  });

  it('fits a medium title in three lines at the largest size', () => {
    const layout = layoutChangelogTitle('Set Academy Language, Exercise improvements and more');

    expect(layout.fontSize).toBe(112);
    expect(layout.lines).toEqual(['Set Academy Language,', 'Exercise improvements', 'and more']);
  });

  it('steps down in size for a long title', () => {
    const layout = layoutChangelogTitle(
      'Course templates, course members, cohorts and certificates in the API, and more'
    );

    expect(layout.fontSize).toBe(88);
    expect(layout.lines.length).toBeLessThanOrEqual(4);
    expect(layout.lines.join(' ')).toBe(
      'Course templates, course members, cohorts and certificates in the API, and more'
    );
  });

  it('never exceeds the character limit of a line', () => {
    const titles = [
      'Custom Favicons & Personalised OG Images',
      'Keyboard Shortcuts, Multi-Deck Slides, and Content Reporting',
      'YouTube + AI Chat, bulk student actions, Vimeo embeds and more'
    ];

    for (const title of titles) {
      const { fontSize, lines } = layoutChangelogTitle(title);
      const limit = fontSize === 112 ? 22 : fontSize === 88 ? 28 : 36;

      expect(lines.every((line) => line.length <= limit)).toBe(true);
    }
  });

  it('breaks a single word that is longer than a line', () => {
    const layout = layoutChangelogTitle('Supercalifragilisticexpialidocious');

    expect(layout.lines.every((line) => line.length <= 22)).toBe(true);
    expect(layout.lines.join('')).toBe('Supercalifragilisticexpialidocious');
  });

  it('cuts an extremely long title with an ellipsis at the smallest size', () => {
    const layout = layoutChangelogTitle(`${'Another improvement '.repeat(20)}`);

    expect(layout.fontSize).toBe(70);
    expect(layout.lines).toHaveLength(5);
    expect(layout.lines[4].endsWith('…')).toBe(true);
  });

  it('collapses extra whitespace and falls back when the title is empty', () => {
    expect(layoutChangelogTitle('  A   B  ').lines).toEqual(['A B']);
    expect(layoutChangelogTitle('   ').lines).toEqual(['ClassroomIO changelog']);
  });
});
