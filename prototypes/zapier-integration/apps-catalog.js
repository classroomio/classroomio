// apps-catalog.js: single source of truth for the app directory, app detail
// pages, and the Zap builder. Kept as one file so all three surfaces list the
// same apps with the same names, descriptions, and actions rather than
// drifting apart.
//
// 77 real, recognizable apps across 15 categories. Not exhaustive (Zapier's
// real directory has 6,000+), but every category has at least 5 apps so
// browsing by category always shows something. See README.md "Why 77 apps,
// not 6,000".
//
// Badges are rendered from a `color` (plus an optional `dark` flag for light
// backgrounds) rather than a per-app CSS class, so adding an app never means
// adding CSS.

(function () {
  var ICONS = {
    audience:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    enrolled:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 11 2 2 4-4"/></svg>',
    completed:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></svg>',
    certificate:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M9 17v4M15 17v4"/></svg>',
    payment:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>'
  };

  var TRIGGERS = {
    new_audience_member: {
      label: 'New audience member',
      desc: 'A new student is added to your organization audience.',
      icon: ICONS.audience,
      filters: { course: false, tag: false },
      fields: ['Student Name', 'Student Email', 'Signup Date']
    },
    student_enrolled: {
      label: 'Student enrolled in a course',
      desc: 'A student is added to a course, by invite or direct assignment.',
      icon: ICONS.enrolled,
      filters: { course: true, tag: true },
      fields: ['Student Name', 'Student Email', 'Course Name', 'Course ID', 'Enrolled Date']
    },
    course_completed: {
      label: 'Course completed',
      desc: 'A student completes all required lessons in a course.',
      icon: ICONS.completed,
      filters: { course: true, tag: true },
      fields: ['Student Name', 'Student Email', 'Course Name', 'Course ID', 'Completion Date']
    },
    certificate_issued: {
      label: 'Certificate issued',
      desc: 'A certificate is issued to a learner.',
      icon: ICONS.certificate,
      filters: { course: true, tag: false },
      fields: ['Student Name', 'Student Email', 'Course Name', 'Certificate ID', 'Issued Date']
    },
    payment_request: {
      label: 'Payment request submitted',
      desc: 'A learner submits a payment request.',
      icon: ICONS.payment,
      filters: { course: true, tag: false },
      fields: ['Student Name', 'Student Email', 'Course Name', 'Amount', 'Submitted Date']
    }
  };

  var SAMPLE_VALUES = {
    'Student Name': 'Amara Chen',
    'Student Email': 'amara.chen@brightpath.io',
    'Course Name': 'Product Fundamentals',
    'Course ID': 'crs_4f2a91',
    'Completion Date': 'Sep 8, 2026',
    'Enrolled Date': 'Sep 8, 2026',
    'Signup Date': 'Sep 8, 2026',
    'Certificate ID': 'cert_9b21e4',
    'Issued Date': 'Sep 8, 2026',
    Amount: '$249.00',
    'Submitted Date': 'Sep 8, 2026'
  };

  var CATEGORIES = [
    { key: 'all', label: 'All apps' },
    { key: 'crm', label: 'CRM' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'communication', label: 'Communication' },
    { key: 'customer-support', label: 'Customer Support' },
    { key: 'sales', label: 'Sales' },
    { key: 'productivity', label: 'Productivity' },
    { key: 'project-management', label: 'Project Management' },
    { key: 'forms', label: 'Forms & Surveys' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'email', label: 'Email' },
    { key: 'storage', label: 'Storage' },
    { key: 'finance', label: 'Finance' },
    { key: 'developer-tools', label: 'Developer Tools' },
    { key: 'payments', label: 'Payments' },
    { key: 'hr', label: 'HR' }
  ];

  // One default action per category, used when an app doesn't define its own
  // `action`. This keeps 70+ apps functional in the builder without 70+
  // hand-written action definitions: the same "one primary create action"
  // pattern real, simpler Zapier integrations ship with.
  var CATEGORY_DEFAULT_ACTIONS = {
    crm: {
      label: 'Create or Update Contact',
      fields: [
        { key: 'name', label: 'Full name', type: 'pill', default: '{{Student Name}}' },
        { key: 'email', label: 'Email', type: 'pill', default: '{{Student Email}}' }
      ]
    },
    marketing: {
      label: 'Add or Update Subscriber',
      fields: [{ key: 'email', label: 'Email address', type: 'pill', default: '{{Student Email}}' }]
    },
    communication: {
      label: 'Send Message',
      fields: [
        { key: 'channel', label: 'Channel', type: 'select', options: ['#customer-onboarding', '#general'] },
        {
          key: 'message',
          label: 'Message text',
          type: 'pill',
          default: '🎓 {{Student Name}} just completed {{Course Name}}!'
        }
      ]
    },
    'customer-support': {
      label: 'Create Ticket',
      fields: [{ key: 'subject', label: 'Subject', type: 'pill', default: 'Course completed: {{Course Name}}' }]
    },
    sales: {
      label: 'Create or Update Deal',
      fields: [{ key: 'name', label: 'Deal name', type: 'pill', default: '{{Student Name}}: {{Course Name}}' }]
    },
    productivity: {
      label: 'Create Item',
      fields: [{ key: 'title', label: 'Title', type: 'pill', default: '{{Student Name}}: {{Course Name}}' }]
    },
    'project-management': {
      label: 'Create Task',
      fields: [{ key: 'task', label: 'Task name', type: 'pill', default: 'Follow up with {{Student Name}}' }]
    },
    forms: {
      label: 'Log Response',
      fields: [{ key: 'note', label: 'Note', type: 'pill', default: 'Completed {{Course Name}}' }]
    },
    analytics: {
      label: 'Track Event',
      fields: [
        { key: 'event', label: 'Event name', type: 'pill', default: 'course_completed' },
        { key: 'user', label: 'User', type: 'pill', default: '{{Student Email}}' }
      ]
    },
    email: { label: 'Send Email', fields: [{ key: 'to', label: 'To', type: 'pill', default: '{{Student Email}}' }] },
    storage: {
      label: 'Upload File',
      fields: [{ key: 'filename', label: 'File name', type: 'pill', default: '{{Student Name}} - {{Course Name}}.pdf' }]
    },
    finance: {
      label: 'Create Invoice',
      fields: [{ key: 'name', label: 'Customer name', type: 'pill', default: '{{Student Name}}' }]
    },
    'developer-tools': {
      label: 'Create Issue',
      fields: [{ key: 'title', label: 'Title', type: 'pill', default: 'Onboarding: {{Student Name}}' }]
    },
    payments: {
      label: 'Create Charge',
      fields: [
        { key: 'email', label: 'Customer email', type: 'pill', default: '{{Student Email}}' },
        { key: 'amount', label: 'Amount', type: 'pill', default: '{{Amount}}' }
      ]
    },
    hr: {
      label: 'Update Employee Record',
      fields: [{ key: 'value', label: 'Value', type: 'pill', default: 'Completed {{Course Name}}' }]
    }
  };

  // key: {name, category, color, dark?, popular?, recent?, description, detailBlurb, action?}
  var APPS = {
    // ---------- CRM ----------
    hubspot: {
      name: 'HubSpot',
      category: 'crm',
      color: '#FF7A59',
      mono: 'H',
      popular: true,
      description: 'CRM and customer platform',
      detailBlurb: 'Keep contacts and deals in HubSpot in sync with what learners do in ClassroomIO.',
      action: {
        label: 'Create or Update Deal',
        fields: [
          { key: 'dealname', label: 'Deal name', type: 'pill', default: '{{Course Name}}: {{Student Name}}' },
          { key: 'amount', label: 'Amount', type: 'pill', default: '{{Amount}}' }
        ]
      }
    },
    salesforce: {
      name: 'Salesforce',
      category: 'crm',
      color: '#00A1E0',
      mono: 'S',
      popular: true,
      description: 'CRM for sales and service teams',
      detailBlurb: 'Create or update Salesforce records when learners enroll, complete courses, or earn certificates.',
      action: {
        label: 'Create Lead',
        fields: [
          { key: 'object', label: 'Object', type: 'select', options: ['Lead'] },
          { key: 'email', label: 'Email', type: 'pill', default: '{{Student Email}}' }
        ]
      }
    },
    pipedrive: {
      name: 'Pipedrive',
      category: 'crm',
      color: '#017737',
      mono: 'P',
      description: 'Sales pipeline CRM',
      detailBlurb: 'Track learner activity alongside your sales pipeline in Pipedrive.',
      action: {
        label: 'Create Person',
        fields: [
          { key: 'pipeline', label: 'Pipeline', type: 'select', options: ['Sales Pipeline'] },
          { key: 'name', label: 'Name', type: 'pill', default: '{{Student Name}}' }
        ]
      }
    },
    zoho_crm: {
      name: 'Zoho CRM',
      category: 'crm',
      color: '#E42527',
      mono: 'Z',
      description: 'CRM for growing sales teams'
    },
    copper: {
      name: 'Copper',
      category: 'crm',
      color: '#FF5C35',
      mono: 'C',
      description: 'CRM built for Google Workspace'
    },

    // ---------- Marketing ----------
    mailchimp: {
      name: 'Mailchimp',
      category: 'marketing',
      color: '#FFE01B',
      dark: true,
      mono: 'M',
      popular: true,
      description: 'Email marketing and audiences',
      detailBlurb: 'Add or update contacts in a Mailchimp audience based on course activity.',
      action: {
        label: 'Add or Update Subscriber',
        fields: [
          { key: 'audience', label: 'Audience', type: 'select', options: ['Product Newsletter'] },
          { key: 'email', label: 'Email address', type: 'pill', default: '{{Student Email}}' }
        ]
      }
    },
    activecampaign: {
      name: 'ActiveCampaign',
      category: 'marketing',
      color: '#EB1C26',
      mono: 'AC',
      description: 'Marketing automation and email',
      detailBlurb: 'Trigger email sequences in ActiveCampaign from learner milestones.',
      action: {
        label: 'Add Contact to Automation',
        fields: [
          { key: 'automation', label: 'Automation', type: 'select', options: ['Onboarding Sequence'] },
          { key: 'email', label: 'Email', type: 'pill', default: '{{Student Email}}' }
        ]
      }
    },
    klaviyo: {
      name: 'Klaviyo',
      category: 'marketing',
      color: '#1A1A1A',
      mono: 'K',
      description: 'Email and SMS marketing'
    },
    marketo: {
      name: 'Marketo',
      category: 'marketing',
      color: '#5C4C9F',
      mono: 'MK',
      description: 'Enterprise marketing automation'
    },
    constant_contact: {
      name: 'Constant Contact',
      category: 'marketing',
      color: '#FFB400',
      dark: true,
      mono: 'CC',
      description: 'Email marketing for small business'
    },
    brevo: {
      name: 'Brevo',
      category: 'marketing',
      color: '#0B996E',
      mono: 'BR',
      description: 'Email marketing and automation'
    },

    // ---------- Communication ----------
    slack: {
      name: 'Slack',
      category: 'communication',
      color: '#4A154B',
      mono: '#',
      popular: true,
      description: 'Team communication and collaboration',
      detailBlurb:
        'Post messages, DMs, and channel alerts the moment something happens in ClassroomIO, like a course completion, a new certificate, or a payment request.',
      action: {
        label: 'Send Channel Message',
        fields: [
          {
            key: 'channel',
            label: 'Channel',
            type: 'select',
            options: ['#customer-onboarding', '#cs-team', '#general']
          },
          {
            key: 'message',
            label: 'Message text',
            type: 'pill',
            default: '🎓 {{Student Name}} just completed {{Course Name}}!'
          }
        ]
      }
    },
    teams: {
      name: 'Microsoft Teams',
      category: 'communication',
      color: '#5059C9',
      mono: 'T',
      description: 'Chat and channels for your organization',
      detailBlurb: 'Post updates to Teams channels so your team sees learner activity without checking ClassroomIO.',
      action: {
        label: 'Post Channel Message',
        fields: [
          { key: 'channel', label: 'Channel', type: 'select', options: ['Customer Success', 'General'] },
          {
            key: 'message',
            label: 'Message text',
            type: 'pill',
            default: '🎓 {{Student Name}} completed {{Course Name}}!'
          }
        ]
      }
    },
    discord: {
      name: 'Discord',
      category: 'communication',
      color: '#5865F2',
      mono: 'D',
      description: 'Community chat and voice'
    },
    zoom: {
      name: 'Zoom',
      category: 'communication',
      color: '#2D8CFF',
      mono: 'Z',
      recent: true,
      description: 'Video meetings and webinars'
    },
    twilio: {
      name: 'Twilio',
      category: 'communication',
      color: '#F22F46',
      mono: 'TW',
      description: 'SMS and voice notifications'
    },

    // ---------- Customer Support ----------
    zendesk: {
      name: 'Zendesk',
      category: 'customer-support',
      color: '#03363D',
      mono: 'Z',
      description: 'Customer support and ticketing',
      detailBlurb: 'Open a support ticket when a learner needs help or hits an issue.',
      action: {
        label: 'Create Ticket',
        fields: [
          { key: 'form', label: 'Ticket form', type: 'select', options: ['Onboarding'] },
          { key: 'subject', label: 'Subject', type: 'pill', default: 'Course completed: {{Course Name}}' }
        ]
      }
    },
    intercom: {
      name: 'Intercom',
      category: 'customer-support',
      color: '#1F8DED',
      mono: 'IC',
      recent: true,
      description: 'Customer messaging platform',
      detailBlurb: 'Message learners in-app or by email based on what they do in ClassroomIO.',
      action: {
        label: 'Send Message',
        fields: [
          { key: 'type', label: 'Message type', type: 'select', options: ['In-app', 'Email'] },
          { key: 'message', label: 'Message', type: 'pill', default: '🎉 Nice work finishing {{Course Name}}!' }
        ]
      }
    },
    freshdesk: {
      name: 'Freshdesk',
      category: 'customer-support',
      color: '#25C16F',
      mono: 'F',
      description: 'Helpdesk and ticketing'
    },
    help_scout: {
      name: 'Help Scout',
      category: 'customer-support',
      color: '#1292EE',
      mono: 'HS',
      description: 'Shared inbox for support teams'
    },
    front: {
      name: 'Front',
      category: 'customer-support',
      color: '#1989FA',
      mono: 'FR',
      description: 'Shared inbox and customer communication'
    },

    // ---------- Sales ----------
    calendly: {
      name: 'Calendly',
      category: 'sales',
      color: '#006BFF',
      mono: 'C',
      popular: true,
      description: 'Scheduling and booking links'
    },
    docusign: {
      name: 'DocuSign',
      category: 'sales',
      color: '#FFB100',
      dark: true,
      mono: 'DS',
      description: 'E-signature and agreements'
    },
    pandadoc: {
      name: 'PandaDoc',
      category: 'sales',
      color: '#4472CA',
      mono: 'P',
      description: 'Proposals, quotes, and e-signatures'
    },
    outreach: {
      name: 'Outreach',
      category: 'sales',
      color: '#4E56C4',
      mono: 'O',
      description: 'Sales engagement platform'
    },
    close: {
      name: 'Close',
      category: 'sales',
      color: '#1A73E8',
      mono: 'CL',
      description: 'CRM built for inside sales teams'
    },

    // ---------- Productivity ----------
    sheets: {
      name: 'Google Sheets',
      category: 'productivity',
      color: '#188038',
      mono: 'S',
      popular: true,
      description: 'Spreadsheets and data management',
      detailBlurb: 'Log ClassroomIO events as rows in a spreadsheet. It works as a lightweight system of record.',
      action: {
        label: 'Create Spreadsheet Row',
        fields: [
          { key: 'sheet', label: 'Spreadsheet', type: 'select', options: ['Course Completions 2026'] },
          { key: 'name', label: 'Student Name', type: 'pill', default: '{{Student Name}}' },
          { key: 'email', label: 'Student Email', type: 'pill', default: '{{Student Email}}' }
        ]
      }
    },
    airtable: {
      name: 'Airtable',
      category: 'productivity',
      color: '#F82B60',
      mono: 'AT',
      description: 'Flexible databases and workflows',
      detailBlurb: 'Create and update records in an Airtable base to track learners.',
      action: {
        label: 'Create Record',
        fields: [
          { key: 'base', label: 'Base', type: 'select', options: ['Learner Tracking'] },
          { key: 'name', label: 'Name', type: 'pill', default: '{{Student Name}}' }
        ]
      }
    },
    notion: {
      name: 'Notion',
      category: 'productivity',
      color: '#1A1A1A',
      mono: 'N',
      recent: true,
      description: 'Docs, wikis, and project notes',
      detailBlurb: 'Create pages or database items in Notion for onboarding and reporting.',
      action: {
        label: 'Create Database Item',
        fields: [
          { key: 'db', label: 'Database', type: 'select', options: ['Onboarding Tracker'] },
          { key: 'name', label: 'Name', type: 'pill', default: '{{Student Name}}' }
        ]
      }
    },
    google_docs: {
      name: 'Google Docs',
      category: 'productivity',
      color: '#4285F4',
      mono: 'D',
      description: 'Documents and shared writing'
    },
    excel: {
      name: 'Microsoft Excel',
      category: 'productivity',
      color: '#217346',
      mono: 'X',
      description: 'Spreadsheets in Microsoft 365'
    },
    evernote: {
      name: 'Evernote',
      category: 'productivity',
      color: '#00A82D',
      mono: 'EV',
      description: 'Notes and personal organization'
    },

    // ---------- Project Management ----------
    trello: {
      name: 'Trello',
      category: 'project-management',
      color: '#0052CC',
      mono: 'TR',
      description: 'Visual project boards',
      detailBlurb: 'Create cards on a Trello board when a learner needs follow-up.',
      action: {
        label: 'Create Card',
        fields: [
          { key: 'board', label: 'Board', type: 'select', options: ['Customer Onboarding'] },
          { key: 'title', label: 'Card title', type: 'pill', default: '{{Student Name}}: {{Course Name}}' }
        ]
      }
    },
    asana: {
      name: 'Asana',
      category: 'project-management',
      color: '#FC636B',
      mono: 'AS',
      description: 'Task and project management',
      detailBlurb: 'Create tasks for your team based on learner activity.',
      action: {
        label: 'Create Task',
        fields: [
          { key: 'project', label: 'Project', type: 'select', options: ['Onboarding'] },
          { key: 'task', label: 'Task name', type: 'pill', default: 'Follow up with {{Student Name}}' }
        ]
      }
    },
    monday: {
      name: 'Monday.com',
      category: 'project-management',
      color: '#FF3D57',
      mono: 'M',
      recent: true,
      description: 'Work management platform'
    },
    clickup: {
      name: 'ClickUp',
      category: 'project-management',
      color: '#7B68EE',
      mono: 'CU',
      description: 'Tasks, docs, and goals in one app'
    },
    jira: {
      name: 'Jira',
      category: 'project-management',
      color: '#0052CC',
      mono: 'J',
      description: 'Issue tracking for engineering teams'
    },

    // ---------- Forms & Surveys ----------
    typeform: {
      name: 'Typeform',
      category: 'forms',
      color: '#262627',
      mono: 'TF',
      description: 'Forms and surveys',
      detailBlurb: 'Connect form responses to learner records and course activity.',
      action: {
        label: 'Add Response Note',
        fields: [
          { key: 'form', label: 'Form', type: 'select', options: ['Course Feedback'] },
          { key: 'note', label: 'Note', type: 'pill', default: 'Completed {{Course Name}}' }
        ]
      }
    },
    jotform: {
      name: 'Jotform',
      category: 'forms',
      color: '#FF6100',
      mono: 'J',
      description: 'Forms and surveys',
      detailBlurb: 'Sync Jotform submissions with ClassroomIO enrollment and audience data.',
      action: {
        label: 'Create Submission Entry',
        fields: [
          { key: 'form', label: 'Form', type: 'select', options: ['Onboarding Intake'] },
          { key: 'value', label: 'Field value', type: 'pill', default: '{{Student Name}}' }
        ]
      }
    },
    google_forms: {
      name: 'Google Forms',
      category: 'forms',
      color: '#7248B9',
      mono: 'GF',
      description: 'Simple forms in Google Workspace'
    },
    surveymonkey: {
      name: 'SurveyMonkey',
      category: 'forms',
      color: '#00BF6F',
      mono: 'SM',
      description: 'Surveys and feedback'
    },
    wufoo: { name: 'Wufoo', category: 'forms', color: '#6B46C1', mono: 'W', description: 'Online forms and surveys' },

    // ---------- Analytics ----------
    google_analytics: {
      name: 'Google Analytics',
      category: 'analytics',
      color: '#E37400',
      mono: 'GA',
      description: 'Web and product analytics'
    },
    mixpanel: {
      name: 'Mixpanel',
      category: 'analytics',
      color: '#7856FF',
      mono: 'MX',
      description: 'Product analytics and funnels'
    },
    amplitude: {
      name: 'Amplitude',
      category: 'analytics',
      color: '#0062FF',
      mono: 'A',
      description: 'Digital analytics platform'
    },
    tableau: {
      name: 'Tableau',
      category: 'analytics',
      color: '#E97627',
      mono: 'T',
      description: 'Visual analytics and dashboards'
    },
    heap: {
      name: 'Heap',
      category: 'analytics',
      color: '#FF6DC6',
      mono: 'HP',
      description: 'Product analytics and insights'
    },

    // ---------- Email ----------
    gmail: {
      name: 'Gmail',
      category: 'email',
      color: '#EA4335',
      mono: 'G',
      description: 'Email',
      detailBlurb: 'Send a personalized email the moment a learner completes a milestone.',
      action: {
        label: 'Send Email',
        fields: [
          { key: 'template', label: 'Template', type: 'select', options: ['Course Completion'] },
          { key: 'to', label: 'To', type: 'pill', default: '{{Student Email}}' }
        ]
      }
    },
    outlook: { name: 'Outlook', category: 'email', color: '#0078D4', mono: 'O', description: 'Email and calendar' },
    sendgrid: {
      name: 'SendGrid',
      category: 'email',
      color: '#1A82E2',
      mono: 'SG',
      description: 'Transactional email delivery'
    },
    mailgun: {
      name: 'Mailgun',
      category: 'email',
      color: '#C02127',
      mono: 'MG',
      description: 'Email API for developers'
    },
    postmark: {
      name: 'Postmark',
      category: 'email',
      color: '#FFD500',
      dark: true,
      mono: 'PM',
      description: 'Fast, reliable transactional email'
    },

    // ---------- Storage ----------
    drive: {
      name: 'Google Drive',
      category: 'storage',
      color: '#2684FC',
      mono: 'D',
      description: 'Cloud file storage',
      detailBlurb: 'Save issued certificates and exports straight to a Drive folder.',
      action: {
        label: 'Upload File',
        fields: [
          { key: 'folder', label: 'Folder', type: 'select', options: ['/Certificates/2026'] },
          { key: 'filename', label: 'File name', type: 'pill', default: '{{Student Name}} - {{Course Name}}.pdf' }
        ]
      }
    },
    dropbox: {
      name: 'Dropbox',
      category: 'storage',
      color: '#0061FF',
      mono: 'DB',
      description: 'Cloud file storage',
      detailBlurb: 'Store certificates and exported files automatically in Dropbox.',
      action: {
        label: 'Upload File',
        fields: [
          { key: 'folder', label: 'Folder', type: 'select', options: ['/Certificates'] },
          { key: 'filename', label: 'File name', type: 'pill', default: '{{Student Name}} - {{Course Name}}.pdf' }
        ]
      }
    },
    box: { name: 'Box', category: 'storage', color: '#0061D5', mono: 'B', description: 'Enterprise content storage' },
    onedrive: {
      name: 'OneDrive',
      category: 'storage',
      color: '#0078D4',
      mono: 'OD',
      description: 'Cloud storage in Microsoft 365'
    },
    egnyte: {
      name: 'Egnyte',
      category: 'storage',
      color: '#00A4E4',
      mono: 'E',
      description: 'Secure content storage and governance'
    },

    // ---------- Finance ----------
    quickbooks: {
      name: 'QuickBooks',
      category: 'finance',
      color: '#2CA01C',
      mono: 'QB',
      recent: true,
      description: 'Accounting and invoicing',
      detailBlurb: 'Send invoices for paid courses and reconcile revenue.',
      action: {
        label: 'Create Invoice',
        fields: [
          { key: 'list', label: 'Customer list', type: 'select', options: ['Learners'] },
          { key: 'name', label: 'Customer name', type: 'pill', default: '{{Student Name}}' }
        ]
      }
    },
    xero: {
      name: 'Xero',
      category: 'finance',
      color: '#13B5EA',
      mono: 'X',
      description: 'Accounting for small business'
    },
    freshbooks: {
      name: 'FreshBooks',
      category: 'finance',
      color: '#0075DD',
      mono: 'FB',
      description: 'Invoicing and bookkeeping'
    },
    wave: {
      name: 'Wave',
      category: 'finance',
      color: '#4A9D50',
      mono: 'WV',
      description: 'Free accounting for small business'
    },
    bill_com: {
      name: 'Bill.com',
      category: 'finance',
      color: '#E31E24',
      mono: 'B',
      description: 'Accounts payable and invoicing'
    },

    // ---------- Developer Tools ----------
    github: {
      name: 'GitHub',
      category: 'developer-tools',
      color: '#181717',
      mono: 'GH',
      popular: true,
      description: 'Code hosting and issue tracking'
    },
    gitlab: {
      name: 'GitLab',
      category: 'developer-tools',
      color: '#FC6D26',
      mono: 'GL',
      description: 'DevOps and source control'
    },
    postman: {
      name: 'Postman',
      category: 'developer-tools',
      color: '#FF6C37',
      mono: 'P',
      description: 'API testing and collaboration'
    },
    bitbucket: {
      name: 'Bitbucket',
      category: 'developer-tools',
      color: '#0052CC',
      mono: 'BB',
      description: 'Git repository management'
    },
    vercel: {
      name: 'Vercel',
      category: 'developer-tools',
      color: '#000000',
      mono: 'V',
      description: 'Deployment platform for developers'
    },

    // ---------- Payments ----------
    stripe: {
      name: 'Stripe',
      category: 'payments',
      color: '#635BFF',
      mono: 'ST',
      popular: true,
      description: 'Online payments',
      detailBlurb: 'Reconcile payments with course enrollments and access.',
      action: {
        label: 'Create Invoice',
        fields: [
          { key: 'product', label: 'Product', type: 'select', options: ['Course Access'] },
          { key: 'email', label: 'Customer email', type: 'pill', default: '{{Student Email}}' }
        ]
      }
    },
    paypal: {
      name: 'PayPal',
      category: 'payments',
      color: '#003087',
      mono: 'PP',
      description: 'Online payments',
      detailBlurb: 'Track PayPal payment activity alongside course access.',
      action: {
        label: 'Send Invoice',
        fields: [
          { key: 'template', label: 'Template', type: 'select', options: ['Course Payment'] },
          { key: 'email', label: 'Email', type: 'pill', default: '{{Student Email}}' }
        ]
      }
    },
    square: {
      name: 'Square',
      category: 'payments',
      color: '#000000',
      mono: 'SQ',
      description: 'Payments and point of sale'
    },
    braintree: {
      name: 'Braintree',
      category: 'payments',
      color: '#7DC240',
      mono: 'BT',
      description: 'Payments platform owned by PayPal'
    },
    authorize_net: {
      name: 'Authorize.net',
      category: 'payments',
      color: '#003057',
      mono: 'AN',
      description: 'Payment gateway for online business'
    },

    // ---------- HR ----------
    bamboohr: {
      name: 'BambooHR',
      category: 'hr',
      color: '#73C41D',
      mono: 'BH',
      description: 'HR and people management',
      detailBlurb: 'Sync training completions to employee records for compliance and onboarding.',
      action: {
        label: 'Update Employee Record',
        fields: [
          { key: 'field', label: 'Field', type: 'select', options: ['Training Status'] },
          { key: 'value', label: 'Value', type: 'pill', default: 'Completed {{Course Name}}' }
        ]
      }
    },
    gusto: { name: 'Gusto', category: 'hr', color: '#F45D48', mono: 'G', description: 'Payroll and benefits' },
    greenhouse: {
      name: 'Greenhouse',
      category: 'hr',
      color: '#24A47F',
      mono: 'GR',
      description: 'Hiring and onboarding'
    },
    lever: {
      name: 'Lever',
      category: 'hr',
      color: '#9147FF',
      mono: 'L',
      description: 'Recruiting and applicant tracking'
    },
    workday: {
      name: 'Workday',
      category: 'hr',
      color: '#F89C0E',
      mono: 'WD',
      description: 'HR and workforce management'
    }
  };

  function getAction(slug) {
    var app = APPS[slug];
    if (!app) return null;
    if (app.action) return app.action;
    return CATEGORY_DEFAULT_ACTIONS[app.category] || CATEGORY_DEFAULT_ACTIONS.productivity;
  }

  function badgeHTML(slug, extraStyle) {
    var app = APPS[slug];
    if (!app) return '';
    var color = app.dark ? '#241c15' : '#fff';
    return (
      '<div class="app-badge" style="background:' +
      app.color +
      ';color:' +
      color +
      (extraStyle ? ';' + extraStyle : '') +
      '">' +
      app.mono +
      '</div>'
    );
  }

  window.ZI = {
    ICONS: ICONS,
    TRIGGERS: TRIGGERS,
    SAMPLE_VALUES: SAMPLE_VALUES,
    CATEGORIES: CATEGORIES,
    APPS: APPS,
    categoryLabel: function (key) {
      var found = CATEGORIES.filter(function (c) {
        return c.key === key;
      })[0];
      return found ? found.label : key;
    },
    appSlugs: function () {
      return Object.keys(APPS);
    },
    getAction: getAction,
    badgeHTML: badgeHTML
  };
})();
