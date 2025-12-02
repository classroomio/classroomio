export interface OrgLandingPageJson {
  header: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    action: {
      label: string;
      link: string;
      redirect: boolean;
    };
    banner: {
      video: string;
      image: string;
      type: string;
      show: boolean;
    };
    background: {
      image: string;
      show: boolean;
    };
    show: boolean;
  };
  aboutUs: {
    title: string;
    content: string;
    imageUrl: string;
    show: boolean;
  };
  courses: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    show: boolean;
  };
  faq: {
    title: string;
    questions: Array<{
      id: number;
      title: string;
      content: string;
    }>;
    show: boolean;
  };
  contact: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    address: string;
    phone: string;
    email: string;
    show: boolean;
  };
  mailinglist: {
    title: string;
    subtitle: string;
    buttonLabel: string;
    show: boolean;
  };
  customLinks: {
    show: boolean;
    links: Array<{
      id: number;
      label: string;
      url: string;
      openInNewTab: boolean;
    }>;
  };
  footer: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    show: boolean;
  };
}

export interface OrgTeamMember {
  id: number;
  email: string;
  verified: boolean;
  profileId?: string;
  fullname: string;
  role: string;
  isAdmin: boolean;
}

export interface OrgAudience {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  date_joined: string;
}

export type DomainVerificationStatusProps =
  | 'Valid Configuration'
  | 'Invalid Configuration'
  | 'Pending Verification'
  | 'Domain Not Found'
  | 'Unknown Error';

// From https://vercel.com/docs/rest-api/endpoints#get-a-project-domain
export interface DomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: (307 | 301 | 302 | 308) | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  /** `true` if the domain is verified for use with the project. If `false` it will not be used as an alias on this project until the challenge in `verification` is completed. */
  verified: boolean;
  /** A list of verification challenges, one of which must be completed to verify the domain for use on the project. After the challenge is complete `POST /projects/:idOrName/domains/:domain/verify` to verify the domain. Possible challenges: - If `verification.type = TXT` the `verification.domain` will be checked for a TXT record matching `verification.value`. */
  verification: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

// From https://vercel.com/docs/rest-api/endpoints#get-a-domain-s-configuration
export interface DomainConfigResponse {
  /** How we see the domain's configuration. - `CNAME`: Domain has a CNAME pointing to Vercel. - `A`: Domain's A record is resolving to Vercel. - `http`: Domain is resolving to Vercel but may be behind a Proxy. - `null`: Domain is not resolving to Vercel. */
  configuredBy?: ('CNAME' | 'A' | 'http') | null;
  /** Which challenge types the domain can use for issuing certs. */
  acceptedChallenges?: ('dns-01' | 'http-01')[];
  /** Whether or not the domain is configured AND we can automatically generate a TLS certificate. */
  misconfigured: boolean;
}

// From https://vercel.com/docs/rest-api/endpoints#verify-project-domain
export interface DomainVerificationResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: (307 | 301 | 302 | 308) | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  /** `true` if the domain is verified for use with the project. If `false` it will not be used as an alias on this project until the challenge in `verification` is completed. */
  verified: boolean;
  /** A list of verification challenges, one of which must be completed to verify the domain for use on the project. After the challenge is complete `POST /projects/:idOrName/domains/:domain/verify` to verify the domain. Possible challenges: - If `verification.type = TXT` the `verification.domain` will be checked for a TXT record matching `verification.value`. */
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}
