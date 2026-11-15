export const ORG_ANALYTICS_PAGE = { label: 'Academy', slug: 'academy', toolSegment: 'academy' } as const;

export const ORG_ANALYTICS_TOOLS = {
  snapshot: `get_${ORG_ANALYTICS_PAGE.toolSegment}_analytics`,
  students: `list_${ORG_ANALYTICS_PAGE.toolSegment}_students`,
  catalog: `get_${ORG_ANALYTICS_PAGE.toolSegment}_catalog`,
  query: `query_${ORG_ANALYTICS_PAGE.toolSegment}_analytics`
} as const;
