import type {
  CourseLandingPageProps,
  LearningPathItem,
  LearningPathLandingPageProps,
  OrgLandingPageProps
} from './types';

export const mockLearningPaths: LearningPathItem[] = [
  {
    id: 'lp-1',
    slug: 'soc2-compliance-track',
    title: 'SOC 2 Compliance Track',
    description:
      'A guided, three-course sequence from security fundamentals to a completed control matrix — finish with a certificate auditors recognize.',
    logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 149.0,
    currency: 'USD',
    courseCount: 3,
    totalHours: 16,
    hasCertificate: true,
    totalStudents: 942,
    metadata: { showDiscount: true, discount: 20 }
  },
  {
    id: 'lp-2',
    slug: 'workplace-compliance-essentials',
    title: 'Workplace Compliance Essentials',
    description:
      'Safety, anti-harassment, and data-privacy training bundled into one required track for every new hire.',
    logo: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 0,
    currency: 'USD',
    courseCount: 3,
    totalHours: 7,
    hasCertificate: true,
    totalStudents: 2104
  },
  {
    id: 'lp-3',
    slug: 'full-stack-engineering-bootcamp',
    title: 'Full-Stack Engineering Bootcamp',
    description:
      'Go from HTML to a deployed production app — six hands-on courses covering JavaScript, APIs, databases, and cloud deploys.',
    logo: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 199.0,
    currency: 'USD',
    courseCount: 6,
    totalHours: 96,
    hasCertificate: true,
    totalStudents: 1687,
    metadata: { showDiscount: true, discount: 15 }
  },
  {
    id: 'lp-4',
    slug: 'data-science-mastery',
    title: 'Data Science Mastery',
    description:
      'A five-course path from Python and statistics to machine learning and a portfolio capstone that hiring teams actually read.',
    logo: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 129.0,
    currency: 'USD',
    courseCount: 5,
    totalHours: 64,
    hasCertificate: true,
    totalStudents: 1203
  },
  {
    id: 'lp-5',
    slug: 'product-management-essentials',
    title: 'Product Management Essentials',
    description:
      'Discovery, roadmapping, and delivery — four practical courses on turning vague problems into shipped products.',
    logo: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 89.0,
    currency: 'USD',
    courseCount: 4,
    totalHours: 32,
    hasCertificate: true,
    totalStudents: 946
  },
  {
    id: 'lp-6',
    slug: 'ui-ux-design-foundations',
    title: 'UI/UX Design Foundations',
    description:
      'Research, wireframes, and polished interfaces — a four-course path that ends with a full mobile product case study.',
    logo: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 79.0,
    currency: 'USD',
    courseCount: 4,
    totalHours: 28,
    hasCertificate: true,
    totalStudents: 758
  },
  {
    id: 'lp-7',
    slug: 'digital-marketing-playbook',
    title: 'Digital Marketing Playbook',
    description:
      'SEO, paid channels, and analytics in three compact courses — the essential marketing toolkit for small teams.',
    logo: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 0,
    currency: 'USD',
    courseCount: 3,
    totalHours: 18,
    hasCertificate: false,
    totalStudents: 315
  },
  {
    id: 'lp-8',
    slug: 'cloud-engineering-track',
    title: 'Cloud Engineering Track',
    description:
      'Architecture, infrastructure as code, and cost control — five courses preparing you for real-world production systems.',
    logo: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 179.0,
    currency: 'USD',
    courseCount: 5,
    totalHours: 72,
    hasCertificate: true,
    totalStudents: 881,
    metadata: { showDiscount: true, discount: 10 }
  },
  {
    id: 'lp-9',
    slug: 'applied-ai-and-machine-learning',
    title: 'Applied AI & Machine Learning',
    description:
      'From model basics to a deployed assistant — four courses on building and shipping machine learning in the real world.',
    logo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 149.0,
    currency: 'USD',
    courseCount: 4,
    totalHours: 52,
    hasCertificate: true,
    totalStudents: 1342
  },
  {
    id: 'lp-10',
    slug: 'leadership-and-team-management',
    title: 'Leadership & Team Management',
    description:
      'Feedback, delegation, and one-on-ones — three free courses that make first-time managers confident in their first quarter.',
    logo: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 0,
    currency: 'USD',
    courseCount: 3,
    totalHours: 22,
    hasCertificate: true,
    totalStudents: 2924
  },
  {
    id: 'lp-11',
    slug: 'cybersecurity-defense-fundamentals',
    title: 'Cybersecurity Defense Fundamentals',
    description:
      'Risk, defense-in-depth, and incident response — the four-course foundation every security-minded engineer should own.',
    logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 119.0,
    currency: 'USD',
    courseCount: 4,
    totalHours: 40,
    hasCertificate: true,
    totalStudents: 1094
  },
  {
    id: 'lp-12',
    slug: 'technical-writing-pro',
    title: 'Technical Writing Pro',
    description:
      'Documentation, API guides, and release notes — three short courses for developers who want their docs to do real work.',
    logo: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    cost: 59.0,
    currency: 'USD',
    courseCount: 3,
    totalHours: 14,
    hasCertificate: false,
    totalStudents: 436
  }
];

export const mockOrgLandingPageProps: OrgLandingPageProps = {
  orgName: 'Certifi Academy',
  logoUrl: 'https://ui-avatars.com/api/?name=CA&background=0f172a&color=fff',
  navItems: [
    { label: 'Courses', href: '/courses' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
    { label: 'Sign In', href: '#signin' }
  ],
  hero: {
    heading: 'Become a Certified AI Engineer',
    subheading: 'Master the skills, earn your certification, and prove your expertise with hands-on training programs.',
    primaryAction: { label: 'Get Started', href: '#courses' },
    secondaryAction: { label: 'View Programs', href: '#about' },
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    eyebrow: '// engineering academy'
  },
  courses: [
    {
      id: '1',
      slug: 'workplace-safety-certification',
      title: 'Workplace Safety Certification',
      description:
        'OSHA-aligned training covering hazard identification, emergency procedures, and workplace safety best practices.',
      logo: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      cost: 0,
      currency: 'USD',
      type: 'SELF_PACED',
      lessonCount: 12,
      exerciseCount: 6,
      totalStudents: 4350,
      duration: '3 hours',
      tags: [
        { id: 'tag-1', name: 'Required', slug: 'required', color: '#dc2626' },
        { id: 'tag-2', name: 'Safety', slug: 'safety', color: '#16a34a' }
      ]
    },
    {
      id: '2',
      slug: 'data-privacy-gdpr',
      title: 'Data Privacy & GDPR Compliance',
      description:
        'Comprehensive program covering data handling, privacy regulations, GDPR requirements, and breach response protocols.',
      logo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      cost: 49.0,
      currency: 'USD',
      type: 'SELF_PACED',
      lessonCount: 18,
      exerciseCount: 10,
      totalStudents: 2800,
      duration: '5 hours',
      tags: [
        { id: 'tag-3', name: 'Compliance', slug: 'compliance', color: '#2563eb' },
        { id: 'tag-4', name: 'Privacy', slug: 'privacy', color: '#7c3aed' }
      ]
    },
    {
      id: '3',
      slug: 'anti-harassment-training',
      title: 'Anti-Harassment & DEI Training',
      description:
        'State-mandated harassment prevention training with modules on inclusive workplace culture and bystander intervention.',
      logo: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      cost: 0,
      currency: 'USD',
      type: 'SELF_PACED',
      lessonCount: 8,
      exerciseCount: 4,
      totalStudents: 6100,
      duration: '2 hours',
      tags: [
        { id: 'tag-5', name: 'Required', slug: 'required', color: '#dc2626' },
        { id: 'tag-6', name: 'HR', slug: 'hr', color: '#f59e0b' }
      ]
    },
    {
      id: '4',
      slug: 'information-security-certification',
      title: 'Information Security Certification',
      description:
        'Prepare for SOC 2 and ISO 27001 audits with training on access controls, incident response, and security policies.',
      logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      cost: 99.0,
      currency: 'USD',
      type: 'SELF_PACED',
      lessonCount: 24,
      exerciseCount: 12,
      totalStudents: 1920,
      duration: '8 hours',
      tags: [
        { id: 'tag-7', name: 'Security', slug: 'security', color: '#0ea5e9' },
        { id: 'tag-8', name: 'Certification', slug: 'certification', color: '#64748b' }
      ],
      metadata: {
        showDiscount: true,
        discount: 15
      }
    }
  ],
  embed: {
    title: 'How Automated Certification Works',
    description:
      'See how teams use ClassroomIO to assign programs, track progress, and generate certificates — automatically.',
    code: `
      <div style="width: 100%; max-width: 720px; margin: 0 auto; border-radius: 24px; border: 1px solid rgba(148,163,184,.35); background: linear-gradient(135deg, rgba(59,130,246,.10), rgba(15,23,42,.04)); padding: 32px; box-sizing: border-box;">
        <div style="font-family: sans-serif;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #64748b;">Platform demo</p>
          <h4 style="margin: 0 0 12px; font-size: 28px; line-height: 1.1; color: #0f172a;">Automate Your Certification Workflow</h4>
          <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #334155;">
            Assign programs to teams, set deadlines, and let the platform handle reminders, grading, and certificate generation.
          </p>
        </div>
      </div>
    `,
    secondaryAction: {
      label: 'Request a Demo',
      href: '#contact'
    }
  },
  links: {
    heading: 'Resources',
    description: 'Everything you need beyond the catalog.',
    boldVisitLabel: 'Visit',
    classicLearnMoreLabel: 'Learn more',
    cards: [
      {
        icon: 'help-circle',
        title: 'Help Center',
        description: 'Guides, FAQs, and how-to articles for admins and learners.',
        href: 'https://example.com/help'
      },
      {
        icon: 'video',
        title: 'Webinars',
        description: 'Live sessions and recordings on compliance and product updates.',
        href: 'https://example.com/webinars'
      },
      {
        icon: 'users',
        title: 'Community',
        description: 'Connect with peers, share templates, and ask questions.',
        href: 'https://example.com/community'
      }
    ]
  },
  callout: {
    heading: 'Ready to simplify compliance?',
    description:
      'Launch your first certification program in minutes. Automate tracking, reduce risk, and keep your team certified.',
    action: { label: 'Start Free', href: '#courses' }
  },
  footer: {
    brand: {
      socials: [
        { platform: 'linkedin', href: 'https://linkedin.com/company/example' },
        { platform: 'x', href: 'https://x.com/example' },
        { platform: 'youtube', href: 'https://youtube.com/@example' },
        { platform: 'github', href: 'https://github.com/example' },
        { platform: 'instagram', href: 'https://instagram.com/example' },
        { platform: 'facebook', href: 'https://facebook.com/example' },
        { platform: 'tiktok', href: 'https://tiktok.com/@example' },
        { platform: 'website', href: 'https://example.com' }
      ]
    },
    columns: [
      {
        id: 'col-product',
        heading: 'Product',
        links: [
          { id: 'col-product-overview', label: 'Overview', href: '#overview' },
          { id: 'col-product-features', label: 'Features', href: '#features' },
          { id: 'col-product-integrations', label: 'Integrations', href: '#integrations' },
          { id: 'col-product-automations', label: 'Automations', href: '#automations' },
          { id: 'col-product-certifications', label: 'Certifications', href: '#certifications' },
          { id: 'col-product-analytics', label: 'Analytics', href: '#analytics' },
          { id: 'col-product-mobile', label: 'Mobile app', href: '#mobile' },
          { id: 'col-product-changelog', label: 'Changelog', href: '#changelog' },
          { id: 'col-product-roadmap', label: 'Roadmap', href: '#roadmap' }
        ]
      },
      {
        id: 'col-solutions',
        heading: 'Solutions',
        links: [
          { id: 'col-solutions-compliance', label: 'Compliance training', href: '#compliance' },
          { id: 'col-solutions-onboarding', label: 'Employee onboarding', href: '#onboarding' },
          { id: 'col-solutions-customer-ed', label: 'Customer education', href: '#customer-education' },
          { id: 'col-solutions-partner', label: 'Partner enablement', href: '#partner' },
          { id: 'col-solutions-sales', label: 'Sales enablement', href: '#sales' },
          { id: 'col-solutions-healthcare', label: 'Healthcare', href: '#healthcare' },
          { id: 'col-solutions-finance', label: 'Financial services', href: '#finance' },
          { id: 'col-solutions-government', label: 'Government', href: '#government' }
        ]
      },
      {
        id: 'col-resources',
        heading: 'Resources',
        links: [
          { id: 'col-resources-blog', label: 'Blog', href: '#blog' },
          { id: 'col-resources-help', label: 'Help center', href: '#help' },
          { id: 'col-resources-guides', label: 'Guides', href: '#guides' },
          { id: 'col-resources-webinars', label: 'Webinars', href: '#webinars' },
          { id: 'col-resources-podcast', label: 'Podcast', href: '#podcast' },
          { id: 'col-resources-templates', label: 'Templates', href: '#templates' },
          { id: 'col-resources-case-studies', label: 'Case studies', href: '#case-studies' },
          { id: 'col-resources-research', label: 'Research', href: '#research' },
          { id: 'col-resources-glossary', label: 'Glossary', href: '#glossary' }
        ]
      },
      {
        id: 'col-developers',
        heading: 'Developers',
        links: [
          { id: 'col-developers-docs', label: 'Documentation', href: '#docs' },
          { id: 'col-developers-api', label: 'API reference', href: '#api' },
          { id: 'col-developers-sdks', label: 'SDKs', href: '#sdks' },
          { id: 'col-developers-webhooks', label: 'Webhooks', href: '#webhooks' },
          { id: 'col-developers-mcp', label: 'MCP server', href: '#mcp' },
          { id: 'col-developers-cli', label: 'CLI', href: '#cli' },
          { id: 'col-developers-status', label: 'System status', href: '#status' },
          { id: 'col-developers-changelog', label: 'API changelog', href: '#api-changelog' }
        ]
      },
      {
        id: 'col-company',
        heading: 'Company',
        links: [
          { id: 'col-company-about', label: 'About', href: '#about' },
          { id: 'col-company-customers', label: 'Customers', href: '#customers' },
          { id: 'col-company-careers', label: 'Careers', href: '#careers' },
          { id: 'col-company-press', label: 'Press', href: '#press' },
          { id: 'col-company-partners', label: 'Partners', href: '#partners' },
          { id: 'col-company-contact', label: 'Contact', href: '#contact' },
          { id: 'col-company-events', label: 'Events', href: '#events' },
          { id: 'col-company-newsroom', label: 'Newsroom', href: '#newsroom' }
        ]
      },
      {
        id: 'col-trust',
        heading: 'Trust & Legal',
        links: [
          { id: 'col-trust-security', label: 'Security', href: '#security' },
          { id: 'col-trust-soc2', label: 'SOC 2', href: '#soc2' },
          { id: 'col-trust-gdpr', label: 'GDPR', href: '#gdpr' },
          { id: 'col-trust-hipaa', label: 'HIPAA', href: '#hipaa' },
          { id: 'col-trust-iso', label: 'ISO 27001', href: '#iso' },
          { id: 'col-trust-dpa', label: 'Data processing addendum', href: '#dpa' },
          { id: 'col-trust-subprocessors', label: 'Subprocessors', href: '#subprocessors' },
          { id: 'col-trust-responsible-disclosure', label: 'Responsible disclosure', href: '#responsible-disclosure' }
        ]
      }
    ],
    bottom: {
      text: '© 2026 Certifi Academy. All rights reserved.',
      links: [
        { id: 'bottom-terms', label: 'Terms of Service', href: '#terms' },
        { id: 'bottom-privacy', label: 'Privacy Policy', href: '#privacy' },
        { id: 'bottom-cookies', label: 'Cookie Settings', href: '#cookies' },
        { id: 'bottom-acceptable-use', label: 'Acceptable Use', href: '#acceptable-use' },
        { id: 'bottom-accessibility', label: 'Accessibility', href: '#accessibility' },
        { id: 'bottom-sitemap', label: 'Sitemap', href: '#sitemap' },
        { id: 'bottom-support', label: 'Support', href: '#support' }
      ]
    }
  }
};

export const mockCourseLandingPageProps: CourseLandingPageProps = {
  theme: 'minimal',
  orgName: mockOrgLandingPageProps.orgName,
  logoUrl: mockOrgLandingPageProps.logoUrl,
  navItems: mockOrgLandingPageProps.navItems,
  authAction: mockOrgLandingPageProps.authAction,
  hero: {
    heading: 'Information Security Certification',
    subheading:
      'A practitioner-led path to SOC 2 and ISO 27001 readiness — built around access controls, incident response, and the policies auditors actually look for.',
    primaryAction: { label: 'Enroll now', href: '#pricing' },
    secondaryAction: { label: 'View curriculum', href: '#curriculum' },
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    stats: [
      { label: 'Lessons', value: '24' },
      { label: 'Rating', value: '4.8' },
      { label: 'Certificate', value: 'Included' }
    ]
  },
  socialProof: {
    rating: 4.8,
    lessons: 24,
    type: 'Self-paced',
    hasCertificate: true
  },
  info: {
    requirements:
      '<ul><li>Working familiarity with a corporate IT environment.</li><li>Comfort reading vendor security questionnaires.</li><li>No prior audit experience required — we start from policy basics.</li></ul>',
    description:
      '<p>This program walks you through every control domain assessors examine, with worked examples drawn from real audit findings. You will produce a complete control matrix, an incident-response runbook, and an evidence-collection plan you can hand to your auditor on day one.</p>',
    goals:
      '<ul><li>Design an access-control model that maps cleanly to SOC 2 CC6.</li><li>Run a tabletop incident-response exercise and capture the evidence trail auditors expect.</li><li>Stand up a continuous-monitoring loop using the tools you already have.</li></ul>',
    certificateUrl:
      'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
  },
  chips: {
    skills: [
      'SOC 2 controls',
      'Access reviews',
      'Incident response',
      'ISO 27001 mapping',
      'Evidence collection',
      'Risk register',
      'Vendor security',
      'Policy authoring',
      'Tabletop exercises',
      'Audit readiness',
      'Continuous monitoring',
      'Joiner-mover-leaver'
    ],
    tools: ['Vanta', 'Drata', 'Okta', 'Jira', 'Notion', 'Slack', 'AWS IAM']
  },
  curriculum: {
    grouped: true,
    sections: [
      {
        id: 'sec-1',
        title: '1 · Foundations of Information Security',
        exerciseCount: 2,
        lessons: [
          { id: 'l-1', title: 'CIA triad and the modern threat landscape', durationMinutes: 12 },
          { id: 'l-2', title: 'Reading a SOC 2 report end-to-end', durationMinutes: 18 },
          { id: 'l-3', title: 'Mapping ISO 27001 Annex A to your controls', durationMinutes: 22 },
          { id: 'l-4', title: 'Lab: classify a sample data inventory', durationMinutes: 25 }
        ]
      },
      {
        id: 'sec-2',
        title: '2 · Access Controls & Identity',
        exerciseCount: 3,
        lessons: [
          { id: 'l-5', title: 'Designing RBAC for a 200-person org', durationMinutes: 20 },
          { id: 'l-6', title: 'MFA, SSO, and the JIT access pattern', durationMinutes: 16 },
          { id: 'l-7', title: 'Joiner-mover-leaver automation', durationMinutes: 22 },
          { id: 'l-8', title: 'Lab: audit a real privileged-access log', durationMinutes: 30 }
        ]
      },
      {
        id: 'sec-3',
        title: '3 · Incident Response & Evidence',
        exerciseCount: 2,
        lessons: [
          { id: 'l-9', title: 'Writing an IR runbook auditors trust', durationMinutes: 18 },
          { id: 'l-10', title: 'Tabletop exercise: ransomware in week one', durationMinutes: 35 },
          { id: 'l-11', title: 'Evidence collection without breaking velocity', durationMinutes: 20 }
        ]
      },
      {
        id: 'sec-4',
        title: '4 · Continuous Monitoring',
        exerciseCount: 2,
        lessons: [
          { id: 'l-12', title: 'Building a monitoring loop with what you own', durationMinutes: 24 },
          { id: 'l-13', title: 'Quarterly access reviews that finish on time', durationMinutes: 18 },
          { id: 'l-14', title: 'Capstone: ship a control matrix and IR plan', durationMinutes: 45 }
        ]
      }
    ]
  },
  instructor: {
    name: 'Amelia Okonkwo',
    role: 'Director of Security Engineering, Lattice',
    imgUrl:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    description:
      'Amelia has led SOC 2 Type II and ISO 27001 audits at four SaaS companies and built the security programs that passed them. She teaches the parts of compliance work that the textbooks skip.',
    coursesNo: 5
  },
  reviews: {
    averageRating: 4.8,
    items: [
      {
        id: 'r-1',
        name: 'Daniel R.',
        avatarUrl: 'https://i.pravatar.cc/120?img=15',
        rating: 5,
        description:
          'The IR runbook template alone paid for the course twice over. Walked into our Type II audit with zero scramble.',
        createdAt: '2026-02-14'
      },
      {
        id: 'r-2',
        name: 'Priya S.',
        avatarUrl: 'https://i.pravatar.cc/120?img=32',
        rating: 5,
        description:
          'Best material I have seen on access reviews that actually finish. The joiner-mover-leaver lab is gold.',
        createdAt: '2026-02-02'
      },
      {
        id: 'r-3',
        name: 'Marcus B.',
        avatarUrl: 'https://i.pravatar.cc/120?img=8',
        rating: 4,
        description: 'Dense in the best way. Skipped almost no theory but every lesson ends with something you ship.',
        createdAt: '2026-01-21'
      },
      {
        id: 'r-4',
        name: 'Helene D.',
        avatarUrl: 'https://i.pravatar.cc/120?img=47',
        rating: 5,
        description:
          'Finally a security course that respects my time. I finished it on a flight to Lisbon and shipped the capstone the next morning.',
        createdAt: '2026-01-09'
      }
    ]
  },
  pricing: {
    cost: 99,
    currency: 'USD',
    discount: 15,
    showDiscount: true,
    ctaLabel: 'Enroll now',
    ctaHref: '#enroll',
    features: [
      'Lifetime access to all lessons',
      'Auditor-ready IR runbook template',
      'Capstone review by the instructor',
      'Certificate of completion'
    ],
    reward: {
      show: true,
      description: 'Refer a teammate and unlock the bonus "Vendor risk in a week" module.'
    }
  },
  footer: mockOrgLandingPageProps.footer
};

export const mockLearningPathLandingPageProps: LearningPathLandingPageProps = {
  theme: 'minimal',
  orgName: mockOrgLandingPageProps.orgName,
  logoUrl: mockOrgLandingPageProps.logoUrl,
  navItems: mockOrgLandingPageProps.navItems,
  authAction: mockOrgLandingPageProps.authAction,
  hero: {
    chip: 'Learning Path · Certificate',
    heading: 'Frontend Engineering Bootcamp',
    subheading:
      'Five courses, one path — from your first HTML tag to a deployed React capstone. Learn in order, build real projects, earn a certificate.',
    primaryAction: { label: 'Enroll · $199', href: '#pricing' },
    cost: 199,
    currency: 'USD',
    originalCost: 280,
    courseCount: 5,
    totalStudents: 942,
    rating: 4.7,
    reviewsCount: 213,
    hasCertificate: true,
    instructors: [
      {
        id: 'lp-i-1',
        name: 'Jordan Diallo',
        role: 'Lead Instructor · Frontend',
        avatarUrl:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        bio: '10 years building web apps; previously staff engineer at a fintech scale-up.'
      },
      {
        id: 'lp-i-2',
        name: 'Efe Obi',
        role: 'Instructor · JavaScript',
        avatarUrl:
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        bio: 'Teaches JS to thousands of learners; maintainer of two OSS tooling projects.'
      }
    ]
  },
  about: {
    outcomes: [
      'Build responsive, accessible websites with semantic HTML and modern CSS',
      'Write production JavaScript: async, APIs, and the DOM',
      'Build and ship interactive React apps with state, hooks, and data fetching',
      'Complete a portfolio-ready capstone project, deployed to production'
    ],
    skills: ['HTML & CSS', 'Flexbox & Grid', 'JavaScript', 'REST APIs', 'React', 'State management', 'Deployment']
  },
  series: [
    {
      id: 'lp-s-1',
      slug: 'html-css-foundations',
      title: 'HTML & CSS Foundations',
      description: 'Semantic markup, layout mechanics, and accessibility.',
      siteName: 'classroomio',
      courseCount: 1,
      lessonCount: 12,
      exerciseCount: 4,
      outcomes: [
        'Semantic markup and document structure',
        'The box model, flexbox, and grid',
        'Responsive layout from mobile up',
        'Accessibility fundamentals'
      ],
      lessonOutlines: [
        { id: 'lp-l-1', title: 'Anatomy of a web page', preview: true },
        { id: 'lp-l-2', title: 'Semantic HTML in practice', preview: true },
        { id: 'lp-l-3', title: 'The box model', gated: true },
        { id: 'lp-l-4', title: 'Flexbox and Grid layout', gated: true }
      ]
    },
    {
      id: 'lp-s-2',
      slug: 'javascript-essentials',
      title: 'JavaScript Essentials',
      description: 'Types, functions, DOM manipulation, async/await, and APIs.',
      siteName: 'classroomio',
      courseCount: 2,
      lessonCount: 10,
      exerciseCount: 3,
      outcomes: [
        'Types, functions, and control flow',
        'Working with the DOM',
        'async/await and promises',
        'Fetching data from APIs'
      ],
      lessonOutlines: [
        { id: 'lp-l-5', title: 'Values, types, and variables', preview: true },
        { id: 'lp-l-6', title: 'Functions and scope', preview: true },
        { id: 'lp-l-7', title: 'DOM and event handling', gated: true }
      ]
    },
    {
      id: 'lp-s-3',
      slug: 'react-development',
      title: 'Modern Web Development with React',
      description: 'Components, props, state, hooks, and data fetching.',
      siteName: 'classroomio',
      courseCount: 3,
      lessonCount: 12,
      exerciseCount: 3,
      outcomes: [
        'Components, props, and JSX',
        'State and event handling',
        'Hooks and side effects',
        'Building interactive UIs'
      ],
      lessonOutlines: [
        { id: 'lp-l-8', title: 'What is React?', preview: true },
        { id: 'lp-l-9', title: 'JSX & rendering', preview: true },
        { id: 'lp-l-10', title: 'State and effects', gated: true }
      ]
    }
  ],
  certificate: {
    issuer: 'Acme Academy',
    validity: 'Lifetime',
    description: 'Verified certificate earned on completing every series lesson.'
  },
  hasCertificate: true,
  instructors: [
    {
      id: 'lp-i-1',
      name: 'Jordan Diallo',
      role: 'Lead Instructor · Frontend',
      avatarUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      bio: '10 years building web apps; previously staff engineer at a fintech scale-up.',
      coursesCount: 12
    },
    {
      id: 'lp-i-2',
      name: 'Efe Obi',
      role: 'Instructor · JavaScript',
      avatarUrl:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      bio: 'Teaches JS to thousands of learners; maintainer of two OSS tooling projects.',
      coursesCount: 8
    },
    {
      id: 'lp-i-3',
      name: 'Rita Mensah',
      role: 'Instructor · React',
      avatarUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      bio: 'Product engineer and design-systems specialist; capstone project mentor.',
      coursesCount: 6
    }
  ],
  reviews: [
    {
      id: 'lp-r-1',
      name: 'Tunde Bello',
      rating: 5,
      location: 'Lagos, Nigeria',
      description:
        'I went from zero to deploying my own React app in ten weeks. The order of the courses just makes sense — nothing assumed I knew things I did not.',
      createdAt: '2025-06-12'
    },
    {
      id: 'lp-r-2',
      name: 'Mariam Kone',
      rating: 5,
      location: "Abidjan, Côte d'Ivoire",
      description:
        'The locked courses kept me honest — no skipping ahead, and everything built on what came before. The certificate helped me land interviews.',
      createdAt: '2025-04-30'
    }
  ],
  faq: [
    {
      id: 'lp-f-1',
      question: 'Do I need any prior experience?',
      answer:
        'No — the path starts from absolute fundamentals and each course unlocks the next, so you are never dropped into material you are not ready for.'
    },
    {
      id: 'lp-f-2',
      question: 'Can I buy a single course instead of the whole path?',
      answer:
        'Yes, every course is also sold individually — the path bundle saves you 29% and adds the path certificate.'
    },
    {
      id: 'lp-f-3',
      question: 'Do I have to take the courses in order?',
      answer:
        'Yes — this path is sequential. Each course unlocks after you complete the previous one lessons and exercises. That is what makes the curriculum build properly.'
    },
    {
      id: 'lp-f-4',
      question: 'How long do I have access?',
      answer: 'Lifetime access. Learn at your own pace — complete courses as your schedule allows.'
    },
    {
      id: 'lp-f-5',
      question: 'What do I need to earn the certificate?',
      answer:
        'Complete every lesson and submit every exercise across all courses, including the capstone project. The certificate is issued automatically.'
    }
  ],
  pricing: {
    cost: 199,
    currency: 'USD',
    originalCost: 280,
    discount: 29,
    showDiscount: true,
    features: [
      'All 5 courses, unlocked in order',
      '52 lessons, 13 exercises, 1 capstone project',
      'Path certificate on completion',
      'Lifetime access'
    ],
    ctaLabel: 'Enroll in this path',
    ctaHref: '#pricing'
  },
  footer: mockOrgLandingPageProps.footer,
  labels: {
    aboutHeading: "What you'll learn",
    skillsHeading: "Skills you'll gain",
    seriesHeading: 'Courses in this path',
    certificateHeading: 'Earn a shareable certificate',
    certificateIssuerHeading: 'Issued by',
    certificateValidityHeading: 'Validity',
    instructorsHeading: 'Your instructors',
    reviewsHeading: 'What learners say',
    faqHeading: 'Frequently asked questions',
    noFaqLabel: 'No questions yet.',
    lockedLabel: 'Locked',
    unlockedLabel: 'Unlocked',
    enrollFreeLabel: 'Enroll free',
    enrollLabel: (cost: number, currency: string) => `Enroll for ${currency} ${cost}`,
    viewAllLabel: 'View all learning paths'
  }
};
