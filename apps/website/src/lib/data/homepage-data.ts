export const FAQ_ITEMS = [
  {
    question: 'What is ClassroomIO?',
    answer:
      'ClassroomIO is an intelligent customer education platform that helps SaaS companies use education to grow their business. You create courses, deliver them in a branded academy and track how learners progress.',
    open: true
  },
  {
    question: 'How does ClassroomIO pricing work?',
    answer:
      'The free plan covers 20 students. The Early Adopter plan is $35 a month and covers up to 10,000 students, with your own domain, branding, certificates, unlimited collaborators, the API and webhooks. Enterprise is priced by quote and includes SSO.'
  },
  {
    question: 'Can I use my own domain and branding?',
    answer: 'Yes. Your domain, logo and colors come with the $35 plan, so they are not add-ons.'
  },
  {
    question: 'Can ClassroomIO connect to the tools I already use?',
    answer:
      'Yes. SCORM, Zapier, webhooks and the public API let you move courses and learner data between ClassroomIO and your other tools. There are no native Salesforce or Gainsight connectors.'
  },
  {
    question: 'Can I move my courses from another platform?',
    answer:
      'Yes. ClassroomIO supports SCORM, so you can migrate your courses from previous LMS platforms and import them into ClassroomIO.'
  },
  {
    question: 'Can I run ClassroomIO on my own servers?',
    answer:
      'Yes. There is a self-hosting guide and the code is open source. Some Enterprise features, such as SSO, need a licence key when you self-host.'
  }
];

export interface StoryTab {
  type: 'image' | 'text';
  src?: string;
  alt?: string;
  mono?: boolean;
  text?: string;
}

export interface StorySlide {
  tab: StoryTab;
  photo: {
    src: string;
    alt: string;
    portrait?: boolean;
    hasPlay?: boolean;
    storyLength?: string;
  };
  quote: string;
  person: string;
  logo?: {
    src: string;
    alt: string;
    mono?: boolean;
  };
  link?: {
    href: string;
    text: string;
    external?: boolean;
  };
  stats: Array<{ label: string; detail: string }>;
}

export const STORY_SLIDES: StorySlide[] = [
  {
    tab: { type: 'image', src: '/home/images/sensorhubb-logo.png', alt: 'SensorHubb', mono: true },
    photo: {
      src: '/home/images/sensorhubb-poster.webp',
      alt: 'Andrew Bedell of SensorHubb',
      hasPlay: true,
      storyLength: 'Customer story · 1:39'
    },
    quote:
      '“I think my favorite part of using ClassroomIO, however, has been the extremely professional and prompt response from their team.”',
    person: 'Andrew Bedell · Strategy and Operations Intern',
    logo: { src: '/home/images/sensorhubb-logo.png', alt: 'SensorHubb', mono: true },
    link: {
      href: 'https://assets.cdn.clsrio.com/www/home/andrew-bedell-sensorhubb-website.mp4',
      text: 'Watch the story',
      external: true
    },
    stats: [
      { label: '5 stars', detail: 'What Andrew would give ClassroomIO' },
      { label: 'Recommended', detail: 'For any SaaS platform that trains its customers' },
      { label: 'Self-paced', detail: 'Customer training that teaches SensorHubb customers the product' }
    ]
  },
  {
    tab: {
      type: 'image',
      src: 'https://quickeasy.business/wp-content/uploads/elementor/thumbs/QEBS-Logo-scaled-rpo4xlet0k5vfquff4ut3hpo08ojhrufsyof1wjofc.png',
      alt: 'QuickEasy Business Systems'
    },
    photo: { src: '/home/images/jody.webp', alt: 'Jody Segers', portrait: true },
    quote:
      '“We love it because it helps us get training material out to clients, while clients can also monitor progress of their staff.”',
    person: 'Jody Segers · MD, QuickEasy Business Systems',
    logo: {
      src: 'https://quickeasy.business/wp-content/uploads/elementor/thumbs/QEBS-Logo-scaled-rpo4xlet0k5vfquff4ut3hpo08ojhrufsyof1wjofc.png',
      alt: 'QuickEasy Business Systems'
    },
    stats: [
      { label: 'Paid and free', detail: 'Training classes set up for their clients' },
      { label: 'Staff progress', detail: 'Clients follow how their own teams are doing' },
      { label: 'Customised', detail: 'ClassroomIO tailored to their needs with our team' }
    ]
  },
  {
    tab: { type: 'text', text: 'dBlocked · Web3 boot camp' },
    photo: {
      src: 'https://assets.cdn.clsrio.com/blog/pranav-web3-bootcamp-hit-100students.png',
      alt: "Pranav Singhal's Web3 boot camp on ClassroomIO"
    },
    quote:
      '“ClassroomIO really helped me bootstrap my program. The dashboard is extremely intuitive. I could navigate most of it without any help.”',
    person: 'Pranav Singhal · Web3 instructor, dBlocked',
    link: {
      href: 'https://classroomio.com/blog/pranav-hits-100-students',
      text: 'Read the story'
    },
    stats: [
      { label: '100+', detail: 'Students in his Web3 boot camp' },
      { label: 'One flat plan', detail: 'Instead of paying for a site template and plugins' },
      { label: 'Self-serve', detail: 'Found his way around the dashboard without support' }
    ]
  },
  {
    tab: { type: 'text', text: 'Dr Ozzy · Academic programs' },
    photo: { src: '/home/images/drozzy.webp', alt: 'Dr Ozzy', portrait: true },
    quote:
      '“ClassroomIO helps me focus on the learning experience rather than getting caught up in a complicated platform.”',
    person: 'Dr Ozzy · Academic Programs Coordinator',
    stats: [
      { label: 'Fast', detail: "And user friendly, in Dr Ozzy's words" },
      { label: 'Recommended', detail: 'To friends and colleagues who deliver courses' },
      { label: 'Learner first', detail: 'Time goes into the learning, not the platform' }
    ]
  }
];

export interface CustomerCard {
  href: string;
  image: { src: string; alt: string };
  logo: { type: 'image' | 'text'; src?: string; alt?: string; mono?: boolean; text?: string };
  title: string;
  excerpt: string;
  linkText: string;
}

export const CUSTOMER_CARDS: CustomerCard[] = [
  {
    href: '/customers/sensorhubb',
    image: { src: '/home/images/sensorhubb-poster.webp', alt: 'Andrew Bedell of SensorHubb' },
    logo: { type: 'image', src: '/home/images/sensorhubb-logo.png', alt: 'SensorHubb', mono: true },
    title: 'SensorHubb built its customer training on ClassroomIO',
    excerpt: '“My favorite part has been the extremely professional and prompt response from their team.”',
    linkText: 'Read the story →'
  },
  {
    href: '/customers/dblocked',
    image: {
      src: 'https://assets.cdn.clsrio.com/blog/pranav-web3-bootcamp-hit-100students.png',
      alt: "Pranav Singhal's Web3 boot camp"
    },
    logo: { type: 'text', text: 'dBlocked' },
    title: 'How dBlocked bootstrapped its Web3 program on ClassroomIO',
    excerpt: '“ClassroomIO really helped me bootstrap my program. The dashboard is extremely intuitive.”',
    linkText: 'Read the story →'
  },
  {
    href: '/customers/quickeasy',
    image: { src: '/home/images/jody.webp', alt: 'Jody Segers of QuickEasy Business Systems' },
    logo: {
      type: 'image',
      src: 'https://quickeasy.business/wp-content/uploads/elementor/thumbs/QEBS-Logo-scaled-rpo4xlet0k5vfquff4ut3hpo08ojhrufsyof1wjofc.png',
      alt: 'QuickEasy Business Systems'
    },
    title: 'How QuickEasy Business Systems trains its clients with ClassroomIO',
    excerpt: '“We love it because it helps us get training material out to clients.”',
    linkText: 'Read the story →'
  },
  {
    href: '/customers/dr-ozzy',
    image: { src: '/home/images/drozzy.webp', alt: 'Dr Ozzy' },
    logo: { type: 'text', text: 'Dr Ozzy' },
    title: 'How Dr Ozzy keeps the focus on learning with ClassroomIO',
    excerpt:
      '“ClassroomIO helps me focus on the learning experience rather than getting caught up in a complicated platform.”',
    linkText: 'Read the story →'
  },
  {
    href: '/customers/sensorhubb',
    image: { src: '/home/images/sensorhubb-poster.webp', alt: 'SensorHubb customer story video' },
    logo: { type: 'image', src: '/home/images/sensorhubb-logo.png', alt: 'SensorHubb', mono: true },
    title: 'Watch: Andrew Bedell of SensorHubb',
    excerpt: '“I would give ClassroomIO five stars and recommend it for any SaaS platform.”',
    linkText: 'Watch the story →'
  }
];

export interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice?: string;
  yearlyPrice?: string;
  customPrice?: string;
  monthlyBill?: string;
  yearlyBill?: string;
  customBill?: string;
  chip: string;
  cta: { text: string; href: string; style: 'blue' | 'line' };
  features: Array<{ text: string; isPlus?: boolean }>;
  isMain?: boolean;
  isEnterprise?: boolean;
  delay: string;
  tag?: string;
}

export const CLOUD_PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    description: 'For teams launching their first academy.',
    monthlyPrice: '39',
    yearlyPrice: '32.50',
    monthlyBill: 'Billed monthly',
    yearlyBill: 'Billed $390 a year',
    chip: '200 monthly active learners',
    cta: { text: 'Get started', href: '/signup', style: 'line' },
    delay: '0s',
    features: [
      { text: '2 admin seats' },
      { text: 'Unlimited courses and video streaming' },
      { text: 'Custom branding and branded certificates' },
      { text: 'All quiz question types' },
      { text: 'Multi-language courses' },
      { text: 'Video transcription and AI assistant' },
      { text: 'MCP server with 3M AI tokens a month' },
      { text: 'CSV bulk import' },
      { text: 'Basic analytics and email support' }
    ]
  },
  {
    name: 'Growth',
    tag: 'Most popular',
    description: 'The main plan, with your own domain and the API.',
    monthlyPrice: '99',
    yearlyPrice: '82.50',
    monthlyBill: 'Billed monthly',
    yearlyBill: 'Billed $990 a year',
    chip: '1,000 monthly active learners',
    cta: { text: 'Start 14-day free trial', href: '/signup', style: 'blue' },
    isMain: true,
    delay: '.08s',
    features: [
      { text: 'Everything in Starter, plus:', isPlus: true },
      { text: '5 admin seats' },
      { text: 'Custom domain with SSL' },
      { text: 'Remove ClassroomIO branding' },
      { text: 'REST API, webhooks and Zapier' },
      { text: 'Multiple academies' },
      { text: 'Verifiable certificates with expiry and renewal' },
      { text: 'Learning paths with prerequisites' },
      { text: 'Organisation-level enrolment' },
      { text: 'Advanced analytics and priority email support' }
    ]
  },
  {
    name: 'Scale',
    description: 'For larger programmes running several academies.',
    monthlyPrice: '299',
    yearlyPrice: '249',
    monthlyBill: 'Billed monthly',
    yearlyBill: 'Billed $2,990 a year',
    chip: '5,000 monthly active learners',
    cta: { text: 'Get started', href: '/signup', style: 'line' },
    delay: '.16s',
    features: [
      { text: 'Everything in Growth, plus:', isPlus: true },
      { text: '15 admin seats' },
      { text: '10M AI tokens a month' },
      { text: 'Advanced certification programmes' },
      { text: 'Higher API rate limits and a webhook delivery log' },
      { text: 'Native CRM integration' },
      { text: 'Sandbox environment' },
      { text: 'Named contact' }
    ]
  },
  {
    name: 'Enterprise',
    description: 'For more than 5,000 learners, with SSO and an SLA.',
    customPrice: 'Custom',
    customBill: 'Annual contract, priced by learner band',
    chip: 'Above 5,000 learners',
    cta: { text: 'Talk to sales', href: 'https://cal.com/classroomio/enterprise', style: 'line' },
    isEnterprise: true,
    delay: '.24s',
    features: [
      { text: 'Everything in Scale, plus:', isPlus: true },
      { text: 'Unlimited admin seats' },
      { text: 'SSO (OIDC) and SCIM' },
      { text: 'Audit logs and an SLA' },
      { text: 'Custom data residency' },
      { text: 'SCORM and xAPI' },
      { text: 'Security review support, DPA and custom contract' },
      { text: 'Free migration from any LMS and onboarding' }
    ]
  }
];

export const SELF_HOSTED_PLANS = [
  {
    name: 'Community',
    description: 'Run ClassroomIO on your own servers.',
    price: 'Free',
    priceSuffix: 'forever',
    cta: { text: 'View on GitHub', href: 'https://github.com/classroomio/classroomio', style: 'line' as const },
    delay: '0s',
    features: [{ text: 'AGPL-3.0 licence' }, { text: 'Self-hosting guide' }, { text: 'Community support' }]
  },
  {
    name: 'Self-hosted License',
    description: 'A commercial licence for one organisation.',
    price: '$2,990',
    priceSuffix: '/year',
    cta: { text: 'Get a license', href: 'https://cal.com/classroomio/enterprise', style: 'blue' as const },
    isMain: true,
    delay: '.08s',
    features: [
      { text: 'Commercial licence, so your changes can stay private' },
      { text: 'Unlimited learners' },
      { text: 'Email support' },
      { text: 'Help with upgrades' }
    ]
  },
  {
    name: 'Enterprise',
    description: 'Cloud or self-hosted, with an SLA.',
    price: '$6,000',
    priceSuffix: '/year and up',
    cta: { text: 'Talk to sales', href: 'https://cal.com/classroomio/enterprise', style: 'line' as const },
    delay: '.16s',
    features: [
      { text: 'Everything in Self-hosted License, plus:', isPlus: true },
      { text: 'SSO and an SLA' },
      { text: 'Priority support and a named contact' },
      { text: 'Free migration from any LMS' },
      { text: 'Onboarding' }
    ]
  }
];
