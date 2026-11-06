const US = {
  published: 'Yes. Three plans on one page',
  entry: 'Free, then $35 a month or $350 a year',
  capacity: '20 students free, up to 10,000 on the $35 plan',
  branding: 'Custom domain, branding and certificates on the $35 plan',
  seats: 'Unlimited collaborators from $35',
  sso: 'Enterprise plan, by quote'
};

export const PRICING = {
  skilljar: [
    ['Prices published', US.published, 'No. Quote only'],
    ['Entry price', US.entry, 'Not listed. Third-party estimates run $30,000 or more a year (indicative only)'],
    ['How it is priced', US.capacity, 'Annual subscription plus a fee based on active users'],
    [
      'Add-ons',
      'Domain, branding and certificates are in the $35 plan',
      'Priced separately, such as the Data Connector'
    ],
    ['SSO', US.sso, 'From the Professional tier']
  ],
  learnupon: [
    ['Prices published', US.published, 'No. Plans are demo-led'],
    ['Entry price', US.entry, 'Not listed'],
    ['How it is priced', US.capacity, 'Plans list starting user counts, Customer Education from 300 users'],
    ['Branding and domain', US.branding, 'Confirm what each plan includes on a demo'],
    ['Support', 'Not part of the comparison here', 'Implementation and 24/7 support on all plans, per its pricing page']
  ],
  docebo: [
    ['Prices published', US.published, 'No. Custom quote'],
    ['Entry price', US.entry, 'Not listed'],
    ['How it is priced', US.capacity, 'Quote by active users, AI credits and add-ons'],
    ['Contract term', 'Monthly or yearly, your choice', 'One-year minimum on its pricing page'],
    ['Add-ons', 'No per-feature add-ons for branding or certificates', 'Add-ons such as advanced analytics']
  ],
  intellum: [
    ['Prices published', US.published, 'No public prices'],
    ['Entry price', US.entry, 'Not listed'],
    ['How it is priced', US.capacity, 'Quoted per product and audience'],
    [
      'What is quoted separately',
      'One product, one plan',
      'LMS, Evolve authoring, AI agents, e-commerce, Social and Data Connector'
    ]
  ],
  'thought-industries': [
    ['Prices published', US.published, 'Academy is demo-only. Lens lists $0, $499 and $999 a month'],
    ['Entry price', US.entry, 'Academy price not listed'],
    ['Learner capacity', US.capacity, 'Academy tiers cap learners at 500, 2,000 and 5,000'],
    ['Add-ons', US.branding, 'Some capabilities are sold as add-ons']
  ],
  thinkific: [
    ['Entry price', US.entry, 'Basic $54 a month'],
    ['Higher plans', 'Enterprise by quote', 'Start $109, Grow $219, Plus on a custom price'],
    ['Team seats', US.seats, '1, 2 and 6 admin seats on the self-serve plans'],
    ['SSO', US.sso, 'Plus plan only'],
    ['Free option', 'Free plan for 20 students', '30-day trial']
  ],
  teachfloor: [
    ['Entry price', US.entry, 'Startup from $89 a month'],
    ['Capacity', US.capacity, 'Startup has 50 seats and one automation'],
    ['Branding and domain', US.branding, 'In the custom-quoted Full Features plan'],
    ['SSO and MCP', 'SSO on Enterprise. MCP on every plan, including free', 'In the Full Features plan']
  ],
  teachable: [
    ['Entry price', US.entry, 'Starter $39 a month'],
    ['Higher plans', 'Enterprise by quote', 'Builder $89, Growth $189, Custom'],
    ['Certificates', 'On the $35 plan', 'Growth and Custom only'],
    ['Team seats', US.seats, '1, 1 and 5 admin seats by plan'],
    ['Course limits', 'Unlimited courses', '5, 10 and 50 products by plan']
  ],
  kajabi: [
    ['Entry price', US.entry, '$179 a month'],
    ['Higher plans', 'Enterprise by quote', '$249 and $499 a month'],
    ['What limits you', 'Student capacity: 20, then 10,000', 'Contacts: 2,500, 25,000 and 100,000'],
    ['Team seats', US.seats, '2, 11 and 26 admin users'],
    ['Course limits', 'Unlimited courses', '5, 50 and unlimited products']
  ]
};

export const US_CARD = {
  price: '$35',
  unit: 'a month',
  text: 'Or $350 a year. Includes your own domain, branding and certificates, unlimited collaborators and up to 10,000 students. The free plan covers 20 students.'
};

export const CARDS = {
  skilljar: {
    price: 'Quote only',
    text: 'Skilljar does not publish prices. It is an annual subscription plus a fee based on active users. Third-party estimates run $30,000 or more a year (indicative only).'
  },
  learnupon: {
    price: 'Demo-led',
    text: 'Plans are sold through a demo and list starting user counts, with Customer Education from 300 users.'
  },
  docebo: {
    price: 'Custom quote',
    text: 'Quoted by active users, AI credits and add-ons, with a one-year minimum on its pricing page.'
  },
  intellum: {
    price: 'No public prices',
    text: 'Quoted per product and audience: LMS, Evolve authoring, AI agents, e-commerce, Social and Data Connector.'
  },
  'thought-industries': {
    price: 'Demo only',
    text: 'The Academy price is not listed, and its tiers cap learners at 500, 2,000 and 5,000. Lens lists $0, $499 and $999 a month.'
  },
  thinkific: {
    price: '$54',
    unit: 'a month',
    text: 'Basic. Start is $109, Grow $219 and Plus is a custom price, with 1, 2 and 6 admin seats on the self-serve plans. SSO is on Plus only.'
  },
  teachfloor: {
    price: '$89',
    unit: 'a month',
    text: 'Startup, with 50 seats and one automation. Branding and domain are in the custom-quoted Full Features plan.'
  },
  teachable: {
    price: '$39',
    unit: 'a month',
    text: 'Starter. Builder is $89, Growth $189 and Custom is quoted. Certificates are on Growth and Custom only.'
  },
  kajabi: {
    price: '$179',
    unit: 'a month',
    text: 'The entry plan. Higher plans are $249 and $499 a month, limited by contacts: 2,500, 25,000 and 100,000.'
  }
};

export const PRICING_URL = {
  skilljar: 'https://www.skilljar.com/pricing',
  learnupon: 'https://www.learnupon.com/pricing/',
  docebo: 'https://www.docebo.com/pricing/',
  intellum: 'https://www.intellum.com',
  'thought-industries': 'https://www.thoughtindustries.com/pricing',
  thinkific: 'https://www.thinkific.com/pricing/',
  teachfloor: 'https://www.teachfloor.com/pricing',
  teachable: 'https://www.teachable.com/pricing',
  kajabi: 'https://www.kajabi.com/pricing'
};
