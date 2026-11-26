export const CREATED_VIA_VALUES = ['dashboard', 'public_api', 'mcp', 'agent', 'import', 'clone', 'template'] as const;

export type TCreatedVia = (typeof CREATED_VIA_VALUES)[number];

export const AUTOMATION_CHANNEL_VALUES = ['public_api', 'mcp'] as const;

export type TAutomationChannel = (typeof AUTOMATION_CHANNEL_VALUES)[number];
