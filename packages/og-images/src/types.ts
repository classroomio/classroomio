export type OrgSiteOgInput = {
  orgName: string;
  logoUrl?: string;
  tagline?: string;
  themeColor: string;
  showWatermark: boolean;
};

export type OrgSiteOgRenderResult = {
  html: string;
  styles: string;
};
