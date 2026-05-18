import type { OrgLandingPageTheme } from './types';

/** Class strings per footer region; markup reads these so themes stay consistent with nav/hero tokens. */
export type FooterRegionTokens = {
  root: string;
  container: string;
  compactRow: string;
  bottomRow: string;
  bottomHairline?: string;
  brandName: string;
  brandTagline: string;
  columnHeading: string;
  columnLink: string;
  columnCta: string;
  socialWrap: string;
  socialIcon: string;
  bottomText: string;
  bottomLinksWrap: string;
  bottomLink: string;
  logoImg: string;
};

export function getFooterTokens(variant: OrgLandingPageTheme): FooterRegionTokens {
  if (variant === 'minimal') {
    return {
      root: 'ui:border-t ui:border-border/50 ui:py-12 ui:px-4 ui:sm:px-6 ui:md:px-8 ui:md:py-16',
      container: 'ui:max-w-[1200px] ui:mx-auto',
      compactRow:
        'ui:flex ui:flex-col ui:gap-3 ui:items-start ui:md:flex-row ui:md:items-center ui:md:justify-between ui:text-sm ui:text-muted-foreground',
      bottomRow:
        'ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between ui:mt-10 ui:md:mt-12 ui:pt-6 ui:border-t ui:border-border/50 ui:text-sm ui:text-muted-foreground',
      brandName:
        'ui:font-semibold ui:text-xl ui:text-foreground ui:flex ui:items-center ui:gap-2 ui:no-underline ui:break-words',
      brandTagline: 'ui:text-sm ui:text-muted-foreground ui:break-words ui:mt-2',
      columnHeading: 'ui:text-sm ui:font-semibold ui:text-foreground ui:mb-4',
      columnLink:
        'ui:block ui:text-sm ui:text-muted-foreground ui:hover:text-foreground ui:transition-colors ui:break-words ui:py-1.5 ui:md:py-0',
      columnCta:
        'ui:text-sm ui:font-semibold ui:text-foreground ui:inline-flex ui:items-center ui:gap-1.5 ui:mt-4 ui:no-underline hover:ui:underline',
      socialWrap: 'ui:flex ui:flex-wrap ui:gap-2 ui:mt-3 ui:list-none ui:m-0 ui:p-0',
      socialIcon:
        'ui:inline-flex ui:items-center ui:justify-center ui:p-1.5 ui:rounded-md ui:text-muted-foreground ui:hover:text-foreground ui:transition-colors ui:no-underline',
      bottomText: 'ui:break-words',
      bottomLinksWrap: 'ui:flex ui:flex-wrap ui:gap-x-6 ui:gap-y-2 ui:justify-start ui:sm:justify-end',
      bottomLink:
        'ui:text-sm ui:text-muted-foreground ui:hover:text-foreground ui:transition-colors ui:break-words ui:inline-block ui:py-1 ui:md:py-0',
      logoImg: 'ui:h-7 ui:md:h-8 ui:w-auto'
    };
  }

  if (variant === 'tech') {
    return {
      root: 'ui:bg-foreground ui:text-background ui:py-16 ui:px-4 ui:sm:px-6 ui:md:py-20',
      container: 'ui:max-w-7xl ui:mx-auto',
      compactRow:
        'ui:flex ui:flex-col ui:gap-3 ui:items-start ui:md:flex-row ui:md:items-center ui:md:justify-between ui:text-sm',
      bottomRow:
        'ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between ui:mt-10 ui:pt-6 ui:border-t ui:border-background/15 ui:text-xs ui:text-background/55 ui:font-mono',
      brandName:
        'ui:font-bold ui:text-xl ui:tracking-tight ui:text-background ui:flex ui:items-center ui:gap-2 ui:no-underline ui:break-words',
      brandTagline: 'ui:text-sm ui:text-background/60 ui:break-words ui:mt-3 ui:max-w-[260px]',
      columnHeading:
        'ui:text-[11px] ui:font-mono ui:font-semibold ui:uppercase ui:tracking-widest ui:text-background/60 ui:mb-4',
      columnLink:
        'ui:block ui:text-sm ui:text-background/75 ui:hover:text-background ui:transition-colors ui:break-words ui:py-1.5 ui:md:py-0',
      columnCta:
        'ui:text-sm ui:font-semibold ui:text-background ui:inline-flex ui:items-center ui:gap-1.5 ui:mt-3 ui:no-underline hover:ui:underline',
      socialWrap: 'ui:flex ui:flex-wrap ui:gap-2 ui:mt-4 ui:list-none ui:m-0 ui:p-0',
      socialIcon:
        'ui:inline-flex ui:items-center ui:justify-center ui:size-8 ui:border ui:border-background/15 ui:bg-background/5 ui:text-background/75 ui:hover:text-background ui:hover:bg-background/10 ui:transition-colors ui:no-underline',
      bottomText: 'ui:break-words',
      bottomLinksWrap: 'ui:flex ui:flex-wrap ui:gap-x-5 ui:gap-y-2 ui:justify-start ui:sm:justify-end',
      bottomLink:
        'ui:text-xs ui:font-mono ui:text-background/65 ui:hover:text-background ui:transition-colors ui:break-words ui:inline-block ui:py-1 ui:md:py-0',
      logoImg: 'ui:h-6 ui:md:h-7 ui:w-auto'
    };
  }

  if (variant === 'studio') {
    return {
      root: 'ui:bg-background ui:text-foreground ui:border-t ui:border-border ui:py-16 ui:px-4 ui:sm:px-6 ui:md:py-20',
      container: 'ui:max-w-[1080px] ui:mx-auto',
      compactRow:
        'ui:flex ui:flex-col ui:gap-3 ui:items-start ui:md:flex-row ui:md:items-center ui:md:justify-between ui:text-sm ui:text-muted-foreground',
      bottomRow:
        'ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between ui:mt-12 ui:pt-6 ui:border-t ui:border-border ui:text-xs ui:text-muted-foreground',
      brandName:
        'ui:font-semibold ui:text-base ui:tracking-tight ui:text-foreground ui:flex ui:items-center ui:gap-2 ui:no-underline ui:break-words',
      brandTagline: 'ui:text-sm ui:text-muted-foreground ui:break-words ui:mt-3 ui:max-w-[240px] ui:leading-relaxed',
      columnHeading: 'ui:text-xs ui:font-medium ui:text-muted-foreground ui:mb-3',
      columnLink:
        'ui:block ui:text-[13px] ui:text-foreground ui:hover:text-muted-foreground ui:transition-colors ui:break-words ui:py-1.5 ui:md:py-0',
      columnCta:
        'ui:text-sm ui:font-medium ui:text-primary ui:inline-flex ui:items-center ui:gap-1.5 ui:mt-3 ui:no-underline hover:ui:underline',
      socialWrap: 'ui:flex ui:flex-wrap ui:gap-2 ui:mt-3 ui:list-none ui:m-0 ui:p-0',
      socialIcon:
        'ui:inline-flex ui:items-center ui:justify-center ui:size-7 ui:rounded-md ui:text-muted-foreground ui:hover:text-foreground ui:hover:bg-muted ui:transition-colors ui:no-underline',
      bottomText: 'ui:break-words',
      bottomLinksWrap: 'ui:flex ui:flex-wrap ui:gap-x-5 ui:gap-y-2 ui:justify-start ui:sm:justify-end',
      bottomLink:
        'ui:text-xs ui:text-muted-foreground ui:hover:text-foreground ui:transition-colors ui:break-words ui:inline-block ui:py-1 ui:md:py-0',
      logoImg: 'ui:h-6 ui:md:h-7 ui:w-auto'
    };
  }

  if (variant === 'terminal') {
    return {
      root: 'ui:relative ui:overflow-hidden ui:pt-16 ui:pb-0 ui:px-4 ui:sm:px-6 ui:md:pt-20 ui:bg-[#06070a]',
      container: 'ui:max-w-[1120px] ui:mx-auto',
      compactRow:
        'ui:flex ui:flex-col ui:gap-3 ui:items-start ui:md:flex-row ui:md:items-center ui:md:justify-between ui:text-sm ui:text-[#9da1ab]',
      bottomRow:
        'ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between ui:mt-14 ui:pt-6 ui:pb-6 ui:border-t ui:border-[#1c1f28] ui:text-xs ui:text-[#61656f]',
      brandName:
        'ui:font-semibold ui:text-base ui:text-[#e9eaed] ui:flex ui:items-center ui:gap-2 ui:no-underline ui:break-words',
      brandTagline: 'ui:text-sm ui:text-[#9da1ab] ui:break-words ui:mt-3 ui:max-w-[240px] ui:leading-relaxed',
      columnHeading: 'ui:text-[11px] ui:font-medium ui:tracking-[0.12em] ui:uppercase ui:text-[#61656f] ui:mb-4',
      columnLink:
        'ui:block ui:text-[13.5px] ui:text-[#9da1ab] ui:hover:text-[#e9eaed] ui:transition-colors ui:break-words ui:py-1 ui:md:py-0 ui:no-underline',
      columnCta:
        'ui:text-sm ui:font-medium ui:text-[#e9eaed] ui:inline-flex ui:items-center ui:gap-1.5 ui:mt-3 ui:no-underline hover:ui:underline',
      socialWrap: 'ui:flex ui:flex-wrap ui:gap-3 ui:mt-4 ui:list-none ui:m-0 ui:p-0',
      socialIcon:
        'ui:inline-flex ui:items-center ui:justify-center ui:text-[#9da1ab] ui:hover:text-[#e9eaed] ui:transition-colors ui:no-underline',
      bottomText: 'ui:break-words',
      bottomLinksWrap: 'ui:flex ui:flex-wrap ui:gap-x-5 ui:gap-y-2 ui:justify-start ui:sm:justify-end',
      bottomLink:
        'ui:text-xs ui:text-[#61656f] ui:hover:text-[#e9eaed] ui:transition-colors ui:break-words ui:inline-block ui:py-1 ui:md:py-0 ui:no-underline',
      logoImg: 'ui:h-6 ui:md:h-7 ui:w-auto'
    };
  }

  if (variant === 'corporate') {
    return {
      root: 'ui:bg-background ui:border-t ui:border-border ui:py-12 ui:px-4 ui:sm:px-6 ui:md:py-16',
      container: 'ui:max-w-[1120px] ui:mx-auto',
      compactRow:
        'ui:flex ui:flex-col ui:gap-3 ui:items-start ui:md:flex-row ui:md:items-center ui:md:justify-between ui:text-sm ui:text-muted-foreground',
      bottomRow:
        'ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between ui:mt-12 ui:pt-6 ui:border-t ui:border-border ui:text-xs ui:text-muted-foreground',
      brandName:
        'ui:font-semibold ui:text-base ui:tracking-tight ui:text-foreground ui:flex ui:items-center ui:gap-2 ui:no-underline ui:break-words',
      brandTagline: 'ui:text-sm ui:text-muted-foreground ui:break-words ui:mt-3 ui:max-w-[260px] ui:leading-relaxed',
      columnHeading: 'ui:text-xs ui:font-semibold ui:tracking-wider ui:text-foreground ui:mb-3 ui:uppercase',
      columnLink:
        'ui:block ui:text-sm ui:text-muted-foreground ui:hover:text-foreground ui:transition-colors ui:break-words ui:py-1 ui:md:py-0',
      columnCta:
        'ui:text-sm ui:font-medium ui:text-foreground ui:inline-flex ui:items-center ui:gap-1.5 ui:mt-3 ui:no-underline ui:underline ui:underline-offset-4',
      socialWrap: 'ui:flex ui:flex-wrap ui:gap-3 ui:mt-4 ui:list-none ui:m-0 ui:p-0',
      socialIcon:
        'ui:inline-flex ui:items-center ui:justify-center ui:text-muted-foreground ui:hover:text-foreground ui:transition-colors ui:no-underline',
      bottomText: 'ui:break-words',
      bottomLinksWrap: 'ui:flex ui:flex-wrap ui:gap-x-6 ui:gap-y-2 ui:justify-start ui:sm:justify-end',
      bottomLink:
        'ui:text-xs ui:text-muted-foreground ui:hover:text-foreground ui:transition-colors ui:break-words ui:inline-block ui:py-1 ui:md:py-0',
      logoImg: 'ui:h-6 ui:md:h-7 ui:w-auto'
    };
  }

  if (variant === 'saas') {
    return {
      root: 'ui:bg-background ui:border-t ui:border-border ui:py-14 ui:px-4 ui:sm:px-6 ui:md:py-16',
      container: 'ui:max-w-[1180px] ui:mx-auto',
      compactRow:
        'ui:flex ui:flex-col ui:gap-3 ui:items-start ui:md:flex-row ui:md:items-center ui:md:justify-between ui:text-sm ui:text-muted-foreground',
      bottomRow:
        'ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between ui:mt-10 ui:pt-6 ui:border-t ui:border-border ui:text-xs ui:text-muted-foreground',
      brandName:
        'ui:font-semibold ui:text-[15px] ui:tracking-tight ui:text-foreground ui:flex ui:items-center ui:gap-2 ui:no-underline ui:break-words',
      brandTagline: 'ui:text-sm ui:text-muted-foreground ui:break-words ui:mt-3 ui:max-w-[260px]',
      columnHeading: 'ui:text-sm ui:font-bold ui:text-foreground ui:mb-3',
      columnLink:
        'ui:block ui:text-sm ui:text-muted-foreground ui:hover:text-foreground ui:transition-colors ui:break-words ui:py-1.5 ui:md:py-0',
      columnCta:
        'ui:text-sm ui:font-semibold ui:text-primary ui:inline-flex ui:items-center ui:gap-1.5 ui:mt-3 ui:no-underline hover:ui:underline',
      socialWrap: 'ui:flex ui:flex-wrap ui:gap-2 ui:mt-4 ui:list-none ui:m-0 ui:p-0',
      socialIcon:
        'ui:inline-flex ui:items-center ui:justify-center ui:size-8 ui:rounded-full ui:border ui:border-border ui:bg-muted/40 ui:text-muted-foreground ui:hover:text-foreground ui:hover:bg-muted ui:transition-colors ui:no-underline',
      bottomText: 'ui:break-words',
      bottomLinksWrap: 'ui:flex ui:flex-wrap ui:gap-x-5 ui:gap-y-2 ui:justify-start ui:sm:justify-end',
      bottomLink:
        'ui:text-xs ui:text-muted-foreground ui:hover:text-foreground ui:transition-colors ui:break-words ui:inline-block ui:py-1 ui:md:py-0',
      logoImg: 'ui:h-6 ui:md:h-7 ui:w-auto'
    };
  }

  if (variant === 'bold') {
    return {
      root: 'ui:bg-foreground ui:text-background/60 ui:py-14 ui:px-4 ui:sm:px-6 ui:md:py-20',
      container: 'ui:max-w-7xl ui:mx-auto',
      compactRow:
        'ui:flex ui:flex-col ui:gap-3 ui:items-start ui:md:flex-row ui:md:items-center ui:md:justify-between ui:text-sm',
      bottomRow:
        'ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between ui:mt-10 ui:md:mt-12 ui:pt-6 ui:border-t ui:border-background/15 ui:text-xs ui:text-background/50',
      brandName:
        'ui:font-black ui:text-2xl ui:tracking-tighter ui:text-background ui:flex ui:items-center ui:gap-3 ui:no-underline ui:break-words',
      brandTagline: 'ui:text-sm ui:text-background/60 ui:break-words ui:mt-2',
      columnHeading: 'ui:text-xs ui:font-bold ui:uppercase ui:tracking-widest ui:text-background ui:mb-4',
      columnLink:
        'ui:block ui:text-sm ui:font-medium ui:text-background/70 ui:hover:text-background ui:transition-colors ui:break-words ui:py-1.5 ui:md:py-0',
      columnCta:
        'ui:text-sm ui:font-bold ui:text-background ui:inline-flex ui:items-center ui:gap-1.5 ui:mt-4 ui:no-underline hover:ui:underline',
      socialWrap: 'ui:flex ui:flex-wrap ui:gap-2 ui:mt-3 ui:list-none ui:m-0 ui:p-0',
      socialIcon:
        'ui:inline-flex ui:items-center ui:justify-center ui:p-1.5 ui:rounded-md ui:text-background/70 ui:hover:text-background ui:transition-colors ui:no-underline',
      bottomText: 'ui:break-words',
      bottomLinksWrap: 'ui:flex ui:flex-wrap ui:gap-x-6 ui:gap-y-2 ui:justify-start ui:sm:justify-end',
      bottomLink:
        'ui:text-xs ui:font-medium ui:text-background/70 ui:hover:text-background ui:transition-colors ui:break-words ui:inline-block ui:py-1 ui:md:py-0',
      logoImg: 'ui:h-7 ui:md:h-8 ui:w-auto ui:grayscale ui:brightness-200'
    };
  }

  return {
    root: 'ui:bg-foreground ui:text-background ui:py-12 ui:px-4 ui:sm:px-6 ui:lg:px-8 ui:md:py-16',
    container: 'ui:max-w-7xl ui:mx-auto',
    compactRow:
      'ui:flex ui:flex-col ui:gap-3 ui:items-start ui:md:flex-row ui:md:items-center ui:md:justify-between ui:text-sm',
    bottomRow:
      'ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between ui:mt-10 ui:md:mt-12 ui:pt-6 ui:text-sm ui:text-background/70',
    bottomHairline: 'ui:h-px ui:w-16 ui:md:w-24 ui:bg-background/30 ui:mx-auto ui:mb-6',
    brandName:
      'ui:text-xl ui:font-bold ui:tracking-wide ui:text-background ui:flex ui:items-center ui:gap-3 ui:no-underline ui:break-words',
    brandTagline: 'ui:text-sm ui:text-background/70 ui:break-words ui:mt-2',
    columnHeading: 'ui:text-sm ui:font-semibold ui:text-background ui:mb-4',
    columnLink:
      'ui:block ui:text-sm ui:font-medium ui:text-background/70 ui:hover:text-background ui:transition-colors ui:break-words ui:py-1.5 ui:md:py-0',
    columnCta:
      'ui:text-sm ui:font-semibold ui:text-background ui:inline-flex ui:items-center ui:gap-1.5 ui:mt-4 ui:no-underline hover:ui:underline',
    socialWrap: 'ui:flex ui:flex-wrap ui:gap-2 ui:mt-3 ui:list-none ui:m-0 ui:p-0',
    socialIcon:
      'ui:inline-flex ui:items-center ui:justify-center ui:p-1.5 ui:rounded-md ui:text-background/70 ui:hover:text-background ui:transition-colors ui:no-underline',
    bottomText: 'ui:break-words',
    bottomLinksWrap: 'ui:flex ui:flex-wrap ui:gap-x-6 ui:gap-y-2 ui:justify-start ui:sm:justify-end',
    bottomLink:
      'ui:text-sm ui:font-medium ui:text-background/70 ui:hover:text-background ui:transition-colors ui:break-words ui:inline-block ui:py-1 ui:md:py-0',
    logoImg: 'ui:h-7 ui:md:h-8 ui:w-auto'
  };
}
