export const ROWS = [
  ['Prices published', true],
  ['Custom domain and branding', true],
  ['Certificates', true],
  ['AI help creating courses', true],
  ['Learning paths', false],
  ['Unlimited collaborators', true],
  ['Native CRM connectors', false],
  ['SSO', true],
  ['Security attestations such as SOC 2', false],
  ['MCP for AI assistants', true]
];

const T = true;
const F = false;
const N = null;

export const THEM = {
  skilljar: [F, N, T, T, T, N, T, T, T, N],
  learnupon: [F, N, N, T, T, N, T, N, N, T],
  docebo: [F, T, N, T, T, N, T, N, T, T],
  intellum: [F, N, T, T, N, N, T, N, T, T],
  'thought-industries': [F, N, T, T, T, N, N, N, N, N],
  thinkific: [T, T, T, T, T, F, T, T, N, N],
  teachfloor: [T, T, N, T, N, N, N, T, N, T],
  teachable: [T, N, T, T, N, F, N, N, N, N],
  kajabi: [T, N, N, T, N, F, N, N, N, N]
};

export function matrixRows(slug) {
  return ROWS.map(([label, us], index) => [label, us, THEM[slug][index]]).filter(([, , them]) => them !== null);
}
