const US_CHOOSE = {
  skilljar: [
    'You want your courses to work with the tools you already use, through SCORM, Zapier, webhooks and the API.',
    'You want an editor that is flexible and intuitive, so anyone on your team can build and update courses, with AI drafts to start from.',
    'You want built-in analytics that show where customers drop off, and MCP access so AI assistants can work with your courses.'
  ],
  learnupon: [
    'You only teach customers and want a narrower product.',
    'You want to start free and see every price before a demo.',
    'You want AI to draft the first course, which your team reviews before it is published.'
  ],
  docebo: [
    'You only teach customers and do not need a workforce platform.',
    'You want monthly billing instead of a one-year minimum.',
    'You want to see every price before you talk to anyone.'
  ],
  intellum: [
    'You teach one customer audience and want a self-serve start.',
    'You want your domain, branding and certificates in one published plan.',
    'You want AI course drafts and MCP access without buying separate products.'
  ],
  'thought-industries': [
    'Your immediate job is a branded academy for customers.',
    'You want courses, certificates, your own domain and analytics at a published price.',
    'You want a free plan to try before you commit.'
  ],
  thinkific: [
    'You only teach customers and do not need a storefront.',
    'You want every teammate to be able to build, with unlimited collaborators from $35.',
    'You want certificates and your own domain on the $35 plan.'
  ],
  teachfloor: [
    'You want your own domain and branding in a plan with a published price.',
    'You want MCP access on every plan, including free.',
    'You want a free plan to build on before you pay.'
  ],
  teachable: [
    'You teach customers and do not need a payment page.',
    'You do not want a cap on the number of courses.',
    'You want certificates from $35 a month.'
  ],
  kajabi: [
    'You only train customers and do not need funnels, landing pages or email.',
    'You want plans sized by students instead of contacts.',
    'You want to start free and add your own domain at $35 a month.'
  ]
};

const THEM_CHOOSE = {
  skilljar: [
    'You need native Salesforce, Gainsight or Zendesk connectors.',
    'You need proctored exams or learning paths.',
    'You want multiple academy sites and language packs.'
  ],
  learnupon: [
    'You need native HubSpot or Salesforce connectors.',
    'You need Learning Journeys.',
    'You also train employees or associations and want implementation and 24/7 support on every plan.'
  ],
  docebo: [
    'You manage employees, partners and customers from one platform.',
    'You need skills intelligence, learning paths or a large content marketplace.',
    'You need published security certifications such as ISO 27001.'
  ],
  intellum: [
    'You need separate catalogs, sign-on and admins for each audience.',
    'You need a Data Connector that sends learning data to a warehouse.',
    'You need SOC 2 Type II, WCAG 2.1 AA and a 99.9% uptime SLA.'
  ],
  'thought-industries': [
    'You want one layer that keeps courses, help content and AI answers consistent.',
    'You need learning paths or monetization.',
    'You need xAPI or LTI, which third-party sources report it supports.'
  ],
  thinkific: [
    'You sell courses, memberships or communities.',
    'You need stronger payments or a branded mobile app add-on.',
    'You need learning paths or native HubSpot and Salesforce integrations.'
  ],
  teachfloor: [
    'You run cohorts built around peer feedback and rubric review.',
    'You need LTI 1.3 or a JavaScript SDK.',
    'You need certificate automations or deeper cohort workflows.'
  ],
  teachable: [
    'You sell courses and digital products.',
    'You need checkout and storefront features.',
    'You are a creator selling to an audience, not a team teaching customers.'
  ],
  kajabi: [
    'You sell to an audience and want funnels, landing pages and email in one suite.',
    'You want communities alongside your courses.',
    'You want one subscription for marketing and courses.'
  ]
};

const MOVE = {
  skilljar: {
    sub: 'Skilljar is well established. The gaps show once cost and reporting matter.',
    text: 'Teams pick Skilljar for CRM integrations and exams. The friction comes later, from quote-based pricing, add-ons and reporting, once the academy has to justify its cost.',
    items: [
      [
        'Pricing is a sales conversation',
        'An annual subscription plus a fee based on active users, with add-ons such as the Data Connector priced separately.'
      ],
      [
        'Reporting often needs exports',
        'Reviewers mention limited built-in reporting that needs exports to answer basic questions.'
      ],
      ['Branding changes take technical skills', 'Reviewers say heavier branding changes need HTML, CSS or API skills.']
    ]
  },
  learnupon: {
    sub: 'LearnUpon is flexible. The gaps show once the academy needs to be yours.',
    text: 'Teams pick LearnUpon for its connectors and range of audiences. The friction comes later, from demo-led pricing and add-ons, once customers expect a branded academy.',
    items: [
      [
        'Pricing is demo-led',
        'Plans list starting user counts, with Customer Education from 300 users, and no prices.'
      ],
      [
        'White labelling is an add-on',
        'White labelling, eCommerce and group branding are listed as Customer Education Enterprise add-ons.'
      ],
      ['Reporting and customization feel limited', 'Reviewers cite limited reporting depth and limited customization.']
    ]
  },
  docebo: {
    sub: 'Docebo is powerful. The gaps show once you only need a customer academy.',
    text: 'Teams pick Docebo for its breadth. The friction comes later, from a one-year minimum, quoted pricing and extra-cost modules, once the job is narrower than the platform.',
    items: [
      [
        'A quote and a one-year minimum',
        'Pricing is quoted by active users, with a one-year minimum on its pricing page.'
      ],
      ['Add-ons raise the bill', 'Modules such as advanced analytics are priced as add-ons.'],
      ['Admin takes time to learn', 'Reviewers report admin complexity and a learning curve.']
    ]
  },
  intellum: {
    sub: 'Intellum is built for scale. The gaps show once you want a simpler start.',
    text: 'Teams pick Intellum for audience management and enterprise assurances. The friction comes later, from separately quoted products, once you only need a customer academy.',
    items: [
      [
        'Every product is quoted separately',
        'The LMS, Evolve authoring, AI agents, e-commerce, Social and Data Connector each have no public price.'
      ],
      [
        'Billing follows monthly active users',
        'A few older reviews mention a billing model based on monthly active users.'
      ],
      ['Settings are spread out', 'The same reviews mention admin settings spread across many places.']
    ]
  },
  'thought-industries': {
    sub: 'Thought Industries is broad. The gaps show once you only need the academy.',
    text: 'Teams pick Thought Industries for its knowledge layer. The friction comes later, from demo-only pricing and learner caps, once the job is courses and certificates.',
    items: [
      ['The Academy is demo-only', 'The Academy price is not listed, so you need a demo to size the cost.'],
      ['Learner caps by tier', 'Academy tiers cap learners at 500, 2,000 and 5,000.'],
      ['Setup has a learning curve', 'Reviewers mention a steep configuration learning curve and mixed reporting.']
    ]
  },
  thinkific: {
    sub: 'Thinkific is well liked. The gaps show once it runs customer training.',
    text: 'Teams pick Thinkific for selling courses. The friction comes later, from seat caps and plan gates, once customer training is the only job.',
    items: [
      [
        'Admin seats are capped',
        'Self-serve plans include 1, 2 and 6 admin seats, and reviewers mention fees for additional admins.'
      ],
      ['SSO and SCORM sit on Plus', 'SSO, SCORM and learning paths are on the Plus plan, at a custom price.'],
      ['Certificates are not on Basic', 'You need a higher plan to issue certificates.']
    ]
  },
  teachfloor: {
    sub: 'Teachfloor is strong on cohorts. The gaps show once branding and domain matter.',
    text: 'Teams pick Teachfloor for cohort learning. The friction comes later, from plan packaging, once the academy has to look like your product.',
    items: [
      [
        'Domain and theming sit in a quoted plan',
        'Custom domain, theming, SSO, MCP and Zapier are in the custom-quoted Full Features plan.'
      ],
      ['The entry plan is small', 'Startup starts at $89 a month with 50 seats and one automation.'],
      ['Customization has limits', 'Reviewers mention customization limits and a learning curve for advanced features.']
    ]
  },
  teachable: {
    sub: 'Teachable is popular with creators. The gaps show once you train customers.',
    text: 'Teams pick Teachable to sell courses. The friction comes later, from caps and plan gates, once the goal is customer training.',
    items: [
      ['Certificates are on higher plans', 'Certificates are only on the Growth and Custom plans.'],
      ['Seats and products are capped', 'Admin seats are capped at 1, 1 and 5, and products at 5, 10 and 50.'],
      ['Support and certificates draw complaints', 'Reviewers cite slow support and missing certificate customization.']
    ]
  },
  kajabi: {
    sub: 'Kajabi is a full creator suite. The gaps show once you only train customers.',
    text: 'Teams pick Kajabi for funnels and email. The friction comes later, from contact-based limits and plan prices, once training is the only job.',
    items: [
      ['Plans start at $179 a month', 'Higher plans are $249 and $499 a month.'],
      [
        'Limits follow contacts and products',
        'Contacts are capped at 2,500, 25,000 and 100,000, and products at 5, 50 and unlimited.'
      ],
      ['Cost and support draw complaints', 'Reviewers cite expensive plans, add-ons and hard-to-reach support.']
    ]
  }
};

export function chooseFor(slug) {
  return { us: US_CHOOSE[slug], them: THEM_CHOOSE[slug], move: MOVE[slug] };
}
