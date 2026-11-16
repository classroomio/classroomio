import type { SkillMasteryLevel } from '@cio/question-types/skill-mastery';

import type { Skill, SkillRow } from './types';

export const MASTERY_LEVEL_CLASS: Record<SkillMasteryLevel, string> = {
  not_started: 'ui:bg-muted ui:text-muted-foreground',
  learning: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  proficient: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200',
  mastered: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
};

/**
 * Orders skills as a tree, parents before children and siblings by code, with each row's depth. A search keeps the
 * skills that match and their ancestors, so a match always shows where it sits.
 */
export function buildSkillRows(skills: readonly Skill[], search = ''): SkillRow[] {
  const query = search.trim().toLowerCase();
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const matches = (skill: Skill) =>
    !query || [skill.code, skill.name, skill.description ?? ''].some((text) => text.toLowerCase().includes(query));

  const visibleIds = new Set<string>();
  for (const skill of skills) {
    if (!matches(skill)) continue;

    let current: Skill | undefined = skill;
    while (current && !visibleIds.has(current.id)) {
      visibleIds.add(current.id);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }

  const children = new Map<string | null, Skill[]>();
  for (const skill of skills) {
    if (!visibleIds.has(skill.id)) continue;

    const parentKey = skill.parentId && byId.has(skill.parentId) ? skill.parentId : null;
    children.set(parentKey, [...(children.get(parentKey) ?? []), skill]);
  }

  const rows: SkillRow[] = [];
  const walk = (parentKey: string | null, depth: number) => {
    const siblings = [...(children.get(parentKey) ?? [])].sort((left, right) => left.code.localeCompare(right.code));
    for (const skill of siblings) {
      rows.push({ ...skill, depth });
      walk(skill.id, depth + 1);
    }
  };
  walk(null, 0);

  return rows;
}

/** The skills that cannot be chosen as the parent of `skillId`: itself and everything below it. */
export function getDescendantIds(skills: readonly Skill[], skillId: string): Set<string> {
  const excluded = new Set<string>([skillId]);
  let grew = true;

  while (grew) {
    grew = false;
    for (const skill of skills) {
      if (skill.parentId && excluded.has(skill.parentId) && !excluded.has(skill.id)) {
        excluded.add(skill.id);
        grew = true;
      }
    }
  }

  return excluded;
}

export function downloadTextFile(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
