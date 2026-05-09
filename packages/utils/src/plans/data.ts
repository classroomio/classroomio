export default {
  BASIC: {
    NAME: 'Basic',
    DESCRIPTION: 'Free tier plan for personal use, no credit card required.',
    PRICE: {
      CURRENCY: '$',
      MONTHLY: '0',
      YEARLY: '0',
      IS_PREMIUM: false
    },
    FEATURES: [
      'Unlimited Courses',
      'Unlimited Q/A',
      'Unlimited Programs',
      '20 Students',
      'Advanced Course Builder (no video upload)',
      '500K AI credits / month',
      'MCP access with 20 automation credits / month',
      'ClassroomIO branding'
    ],
    CTA: {
      LABEL: 'Signup Now',
      LINK: '/signup?plan=free',
      DASHBOARD_LABEL: 'Downgrade',
      DASHBOARD_LINK: '#disabled',
      IS_DISABLED: true
    }
  },
  EARLY_ADOPTER: {
    NAME: 'Early Adopters',
    DESCRIPTION: 'For fast growing teaching businesses that aim to scale.',
    PRICE: {
      CURRENCY: '$',
      MONTHLY: '35',
      YEARLY: '350',
      IS_PREMIUM: false
    },
    FEATURES: [
      'Everything in Basic',
      'Unlimited Collaborators',
      '10K Students',
      'Course Builder with Video Upload & Certificate',
      '3M AI credits / month',
      'MCP access with 500 automation credits / month',
      'Custom Branding',
      'Custom Domain',
      'API with limits',
      'Includes all upcoming features'
    ],
    CTA: {
      LABEL: 'I want in 😍',
      LINK: '/signup?plan=early-adopter',
      DASHBOARD_LABEL: 'Upgrade now',
      DASHBOARD_LINK: '',
      IS_DISABLED: false,
      PRODUCT_ID: '1e11ad75-c422-41c1-a541-0e989281276c',
      PRODUCT_ID_YEARLY: 'a84d3a82-3259-4300-b2bf-dccb7bd7814c'
    }
  },
  ENTERPRISE: {
    NAME: 'Enterprise',
    DESCRIPTION: 'Best suited for larger businesses that need more control',
    PRICE: {
      CURRENCY: '',
      MONTHLY: 'Request Pricing',
      YEARLY: 'Request Pricing',
      IS_PREMIUM: true
    },
    FEATURES: [
      'Everything in Early Adopters plus:',
      'Unlimited students',
      '15M AI credits / month',
      'Unlimited API requests',
      'SSO',
      '24/7 Support',
      'Need on-prem deployment, SSO, or a commercial license? Contact us.'
    ],
    CTA: {
      LABEL: 'Contact Us',
      LINK: 'https://cal.com/classroomio/enterprise',
      DASHBOARD_LABEL: 'Contact Us',
      DASHBOARD_LINK: 'https://cal.com/classroomio/enterprise',
      IS_DISABLED: false
    }
  }
};
