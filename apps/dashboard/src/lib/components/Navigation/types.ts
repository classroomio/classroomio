// types.ts
export type CustomLink = {
  id: number;
  label: string;
  url: string;
  openInNewTab: boolean;
};

export type TCustomLinks = {
  show: boolean;
  links: CustomLink[];
};

export type TNavigationProps = {
  disableSignup?: boolean;
  logo?: string;
  orgName?: string;
  isOrgSite?: boolean;
  backgroundColor?: string;
  customLinks?: CustomLinks | null;
};
