export const CREATED_VIA_VALUES = ['dashboard', 'public_api', 'mcp', 'agent', 'import', 'clone', 'template'] as const;

export type TCreatedVia = (typeof CREATED_VIA_VALUES)[number];
