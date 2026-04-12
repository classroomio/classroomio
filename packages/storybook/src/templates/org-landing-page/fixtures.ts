import type { OrgLandingPageProps } from '@cio/ui/custom/org-landing-page/types';

export const mockProps: OrgLandingPageProps = {
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
  callout: {
    heading: 'Ready to simplify compliance?',
    description:
      'Launch your first certification program in minutes. Automate tracking, reduce risk, and keep your team certified.',
    action: { label: 'Start Free', href: '#courses' }
  },
  footerLinks: [
    { label: 'Terms of Service', href: '#terms' },
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Support', href: '#support' }
  ],
  footerText: '© 2026 Certifi Academy. All rights reserved.'
};
