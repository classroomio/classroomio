// apps-catalog.js: single source of truth for the app directory, app detail
// pages, and the landing/handoff pages. Kept as one file so every surface
// lists the same apps with the same names, descriptions, and actions rather
// than drifting apart.
//
// 20 apps, curated from the integration research (prd/zapier/integration-research.md
// and prd/zapier/10-app-deep-dive.md), not a sample of Zapier's full 6,000+
// directory. Every one maps to a real customer-education workflow for a SaaS
// company running ClassroomIO; nothing here is included for popularity alone.
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
    student_enrolled_in_course: {
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
    payment_request_created: {
      label: 'Payment request submitted',
      desc: 'A learner submits a payment request.',
      icon: ICONS.payment,
      filters: { course: true, tag: false },
      fields: ['Student Name', 'Student Email', 'Course Name', 'Amount', 'Submitted Date']
    }
  };

  // The 5 real "creates" ClassroomIO ships as a Zapier action app: what a Zap
  // built in another app (HubSpot, a form tool, a spreadsheet) can do TO
  // ClassroomIO. Separate from CATEGORY_DEFAULT_ACTIONS / APPS[x].action
  // above, which model the opposite direction (what a ClassroomIO trigger can
  // do to another app). Every field here is `zapier:write` scoped.
  var CLASSROOMIO_ACTIONS = {
    enroll_student_in_course: {
      label: 'Enroll Student in Course',
      desc: 'Find or create the student by email, then assign them to one or more courses.',
      endpoint: 'POST /public-api/v1/audience + POST /public-api/v1/audience/assign-courses',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 11 2 2 4-4"/></svg>',
      fields: [
        { key: 'email', label: 'Email', type: 'pill', default: '{{Contact Email}}' },
        { key: 'name', label: 'Full name', type: 'pill', default: '{{Contact Name}}' },
        {
          key: 'course',
          label: 'Course',
          type: 'select',
          options: ['Onboarding Basics', 'Product Fundamentals', 'Security & Compliance 101']
        }
      ]
    },
    add_student: {
      label: 'Add Student',
      desc: 'Create an audience member without assigning any course.',
      endpoint: 'POST /public-api/v1/audience',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>',
      fields: [
        { key: 'email', label: 'Email', type: 'pill', default: '{{Contact Email}}' },
        { key: 'name', label: 'Full name', type: 'pill', default: '{{Contact Name}}' }
      ]
    },
    update_student: {
      label: 'Update Student',
      desc: 'Update an existing audience member: name, email, or a custom attribute.',
      endpoint: 'PUT /public-api/v1/audience/:memberId',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>',
      fields: [
        { key: 'email', label: 'Email (to find)', type: 'pill', default: '{{Contact Email}}' },
        { key: 'name', label: 'Full name', type: 'pill', default: '{{Contact Name}}' },
        { key: 'attribute', label: 'Custom attribute', type: 'pill', default: 'plan: {{Deal Stage}}' }
      ]
    },
    remove_student: {
      label: 'Remove Student',
      desc: 'Remove a student from the organization by email.',
      endpoint: 'DELETE /public-api/v1/audience/:memberId',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M17 11h6"/></svg>',
      fields: [{ key: 'email', label: 'Email', type: 'pill', default: '{{Contact Email}}' }]
    },
    tag_student: {
      label: 'Tag Student',
      desc: 'Apply or remove a tag on an existing audience member.',
      endpoint: 'POST /public-api/v1/audience/:memberId/tags',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><circle cx="7" cy="7" r="1.5"/></svg>',
      fields: [
        { key: 'email', label: 'Email', type: 'pill', default: '{{Contact Email}}' },
        { key: 'tag', label: 'Tag', type: 'select', options: ['Enterprise', 'Trial', 'APAC'] },
        { key: 'mode', label: 'Action', type: 'select', options: ['Apply tag', 'Remove tag'] }
      ]
    }
  };

  // The 2 v1 searches, used by Zapier's find-or-create pattern alongside
  // add_student / find_course above. Not independently pickable in this
  // prototype's builder, since Zapier auto-generates the "Find or Create"
  // step from these plus the matching create action.
  var CLASSROOMIO_SEARCHES = {
    find_student_by_email: {
      label: 'Find Student by Email',
      desc: 'Look up an audience member by exact email.',
      endpoint: 'GET /public-api/v1/audience?email=…'
    },
    find_course: {
      label: 'Find Course',
      desc: 'Look up a course by slug or title.',
      endpoint: 'GET /public-api/v1/courses?slug=… or ?title=…'
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
    'Submitted Date': 'Sep 8, 2026',
    'Contact Name': 'Priya Sharma',
    'Contact Email': 'priya.sharma@northwind.io',
    'Deal Stage': 'Customer'
  };

  var CATEGORIES = [
    { key: 'all', label: 'All apps' },
    { key: 'crm', label: 'CRM' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'communication', label: 'Communication' },
    { key: 'customer-support', label: 'Customer Support' },
    { key: 'sales', label: 'Sales' },
    { key: 'productivity', label: 'Productivity' },
    { key: 'forms', label: 'Forms & Surveys' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'community', label: 'Community' }
  ];

  // One default action per category, used when an app doesn't define its own
  // `action`. Kept for the handful of curated apps whose real Zapier action
  // set is thin or trigger-only (see their detailBlurb for why).
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
    community: {
      label: 'Add Space Member',
      fields: [{ key: 'email', label: 'Email', type: 'pill', default: '{{Student Email}}' }]
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

    // ---------- Marketing ----------
    mailchimp: {
      name: 'Mailchimp',
      category: 'marketing',
      color: '#FFE01B',
      dark: true,
      mono: 'M',
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
    customerio: {
      name: 'Customer.io',
      category: 'marketing',
      color: '#5B3DF5',
      mono: 'C',
      popular: true,
      description: 'Messaging and lifecycle campaigns',
      detailBlurb:
        'Send lifecycle messages from Customer.io when learners enroll, finish courses, or earn certificates.',
      action: {
        label: 'Track Event',
        fields: [
          { key: 'event', label: 'Event name', type: 'pill', default: 'course_enrolled' },
          { key: 'email', label: 'Email', type: 'pill', default: '{{Student Email}}' }
        ]
      }
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
    google_meet: {
      name: 'Google Meet',
      category: 'communication',
      color: '#00AC47',
      mono: 'GM',
      recent: true,
      description: 'Video meetings in Google Workspace',
      detailBlurb:
        'The Workspace-native alternative to Zoom for teams standardized on Google. Meet’s own Zapier action set is thinner than Zoom’s, so this mostly routes through Google Calendar.'
    },
    zoom: {
      name: 'Zoom',
      category: 'communication',
      color: '#2D8CFF',
      mono: 'Z',
      popular: true,
      recent: true,
      description: 'Video meetings and webinars',
      detailBlurb:
        'Register learners for a live training session, webinar, or cohort kickoff the moment they enroll or complete a course in ClassroomIO.',
      action: {
        label: 'Add Webinar Registrant',
        fields: [
          { key: 'webinar', label: 'Webinar', type: 'select', options: ['Product Onboarding Live Q&A'] },
          { key: 'email', label: 'Registrant email', type: 'pill', default: '{{Student Email}}' }
        ]
      }
    },

    // ---------- Customer Support ----------
    zendesk: {
      name: 'Zendesk',
      category: 'customer-support',
      color: '#03363D',
      mono: 'Z',
      popular: true,
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
      popular: true,
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

    // ---------- Sales & scheduling ----------
    calendly: {
      name: 'Calendly',
      category: 'sales',
      color: '#006BFF',
      mono: 'C',
      popular: true,
      description: 'Scheduling and booking links',
      detailBlurb: 'Enroll a learner in prep material the moment they book an onboarding or kickoff call.'
    },
    calcom: {
      name: 'Cal.com',
      category: 'sales',
      color: '#000000',
      mono: 'Cal',
      recent: true,
      description: 'Open-source scheduling and booking links',
      detailBlurb:
        'The Calendly-equivalent for teams standardized on Cal.com: enroll a learner in prep material the moment a call is booked.'
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
    confluence: {
      name: 'Confluence',
      category: 'productivity',
      color: '#2684FF',
      mono: 'CF',
      recent: true,
      description: 'Docs and wikis for technical teams',
      detailBlurb:
        'Log a course completion to a Confluence page your team already uses for onboarding docs. No clean action exists for the reverse (a doc triggering a course), so this is one-directional.'
    },

    // ---------- Forms & Surveys ----------
    typeform: {
      name: 'Typeform',
      category: 'forms',
      color: '#262627',
      mono: 'TF',
      popular: true,
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

    // ---------- Analytics ----------
    pendo: {
      name: 'Pendo',
      category: 'analytics',
      color: '#00A99D',
      mono: 'PD',
      recent: true,
      description: 'Digital adoption and product usage',
      detailBlurb:
        'Enroll a learner in the right course the moment Pendo shows they haven’t adopted a key feature — the only integration here tying education to real product usage rather than CRM or form data.',
      action: {
        label: 'Update Visitor Metadata',
        fields: [
          { key: 'metadata', label: 'Metadata key', type: 'pill', default: 'course_completed' },
          { key: 'email', label: 'Visitor email', type: 'pill', default: '{{Student Email}}' }
        ]
      }
    },
    mixpanel: {
      name: 'Mixpanel',
      category: 'analytics',
      color: '#7856FF',
      mono: 'MX',
      description: 'Product analytics and funnels',
      detailBlurb:
        'Send course completions to Mixpanel as an event, so learner activity shows up alongside your product analytics.',
      action: {
        label: 'Track Event',
        fields: [
          { key: 'event', label: 'Event name', type: 'pill', default: 'course_completed' },
          { key: 'email', label: 'User', type: 'pill', default: '{{Student Email}}' }
        ]
      }
    },

    // ---------- Community ----------
    circle: {
      name: 'Circle',
      category: 'community',
      color: '#5B4FE9',
      mono: 'CI',
      recent: true,
      description: 'Community spaces and discussion',
      detailBlurb:
        'Enroll a new Circle community member in a welcome course, or unlock a private space once a learner earns a certificate.',
      action: {
        label: 'Add Space Member',
        fields: [
          { key: 'space', label: 'Space', type: 'select', options: ['Certified Members'] },
          { key: 'email', label: 'Email', type: 'pill', default: '{{Student Email}}' }
        ]
      }
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
    var logo = window.ZI_BRAND_LOGOS && window.ZI_BRAND_LOGOS[slug];
    if (logo) {
      return '<div class="app-badge app-badge-logo" style="' + (extraStyle || '') + '">' + logo.svg + '</div>';
    }
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
    CLASSROOMIO_ACTIONS: CLASSROOMIO_ACTIONS,
    CLASSROOMIO_SEARCHES: CLASSROOMIO_SEARCHES,
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
    badgeHTML: badgeHTML,
    classroomioLogoHTML: function (extraStyle) {
      var logo = window.ZI_BRAND_LOGOS && window.ZI_BRAND_LOGOS.classroomio;
      return (
        '<div class="app-badge app-badge-logo" style="' + (extraStyle || '') + '">' + (logo ? logo.svg : 'A') + '</div>'
      );
    }
  };
})();
