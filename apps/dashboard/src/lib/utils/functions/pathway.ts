import type { Pathway } from '../types';

export const isPathwayFree = (cost: number) => !(Number(cost) > 0);

export const getStudentInviteLink = (_pathway: Pathway, orgSiteName: string, origin: string) => {
  const hash = encodeURIComponent(
    btoa(
      JSON.stringify({
        id: _pathway.id,
        name: _pathway.title,
        description: _pathway.description,
        orgSiteName
      })
    )
  );

  return `${origin}/invite/s/${hash}`;
};

const tagsToReplace: { [k: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};

export function replaceHTMLTag(text: string) {
  return text
    .split('')
    .map((char) => tagsToReplace[char] || char)
    .join('');
}
