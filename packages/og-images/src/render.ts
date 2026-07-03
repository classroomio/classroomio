import type { OrgSiteOgInput, OrgSiteOgRenderResult } from './types';
import { renderOrgSiteOgTemplate } from './templates/org-site';

export function renderOrgSiteOg(input: OrgSiteOgInput): OrgSiteOgRenderResult {
  const { body, styles } = renderOrgSiteOgTemplate(input);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1200,initial-scale=1.0">
  <title>${input.orgName} Open Graph</title>
</head>
<body>
${body}
</body>
</html>`;

  return { html, styles };
}
