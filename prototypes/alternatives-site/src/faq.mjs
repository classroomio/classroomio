export function faqFor(name) {
  return [
    [
      'What is ClassroomIO?',
      'ClassroomIO is an open-source, AI-native customer education platform that helps SaaS companies use education to grow their business. You create courses, deliver them in a branded academy and track how learners progress.'
    ],
    [
      'How much does ClassroomIO cost?',
      'The free plan covers 20 students. The Early Adopter plan is $35 a month and covers up to 10,000 students, with your own domain, branding, certificates, unlimited collaborators, the API and webhooks. Enterprise is priced by quote and includes SSO.'
    ],
    [
      'Can I use my own domain and branding?',
      'Yes. Your domain, logo and colors come with the $35 plan, so they are not add-ons.'
    ],
    [
      'How does ClassroomIO use AI?',
      'AI helps draft outlines and lessons, and your team reviews and edits them before anything is published. MCP is available on every plan, so compatible AI assistants can work with your courses.'
    ],
    [
      'Does ClassroomIO support SCORM or connect to Salesforce?',
      'No to both. SCORM packages cannot be imported and there is no native Salesforce connector. The API and webhooks let you send learner events to your own systems.'
    ],
    [
      'Can I run ClassroomIO on my own servers?',
      'Yes. There is a self-hosting guide and the code is open source. Some Enterprise features, such as SSO, need a licence key when you self-host. The prices on this page are for the hosted plans.'
    ],
    [
      `Can I move my courses from ${name}?`,
      'There is no course-file importer, so plan on rebuilding or moving content manually. Tell us how much content you have and we will say what is realistic.'
    ],
    [
      `Is ClassroomIO a full replacement for ${name}?`,
      `For a focused customer academy, possibly. Read the rows above where ${name} is ahead, then check anything you depend on, such as native CRM connectors, learning paths or SCORM.`
    ]
  ];
}
