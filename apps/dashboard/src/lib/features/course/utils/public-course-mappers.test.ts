import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/utils/services/api', () => ({ classroomio: {} }));

import { toPublicSidebarSections } from './public-course-mappers';

type Tree = Parameters<typeof toPublicSidebarSections>[0];

function item(id: string, order: number, sectionId: string | null = null) {
  return { kind: 'lesson' as const, id, slug: id, title: id, order, sectionId, isUnlocked: true, hasVideo: false };
}

describe('toPublicSidebarSections', () => {
  it('keeps consecutive standalone items in one block between sections', () => {
    const tree = {
      sections: [
        { id: 'fundamentals', title: 'Fundamentals', order: 3 },
        { id: 'projects', title: 'Projects', order: 5 }
      ],
      items: [
        item('final', 1),
        item('quiz', 2),
        item('cleaning', 1, 'fundamentals'),
        item('project-1', 4),
        item('project-2', 1, 'projects')
      ]
    } as unknown as Tree;

    const sections = toPublicSidebarSections(tree);

    expect(sections.map((section) => [section.standalone ?? false, section.items.map((entry) => entry.id)])).toEqual([
      [true, ['final', 'quiz']],
      [false, ['cleaning']],
      [true, ['project-1']],
      [false, ['project-2']]
    ]);
  });
});
