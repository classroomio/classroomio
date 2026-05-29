import type { OrgLandingPageProps } from './types';

export const mockOrgLandingPageProps: OrgLandingPageProps = {
  orgName: 'Certifi Academy',
  logoUrl: 'https://ui-avatars.com/api/?name=CA&background=0f172a&color=fff',
  navItems: [
    { label: 'Programs', href: '#courses' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
    { label: 'Sign In', href: '#signin' }
  ],
  hero: {
    heading: 'Become a Certified AI Engineer',
    subheading: 'Master the skills, earn your certification, and prove your expertise with hands-on training programs.',
    primaryAction: { label: 'Get Started', href: '#courses' },
    secondaryAction: { label: 'View Programs', href: '#about' },
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
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
