// brand-logos.js: simplified, brand-colored approximations of real product
// marks for the landing-page logo marquee. Not official brand assets (this is
// a prototype, not a shipped asset pipeline). Each is a small hand-built SVG
// that keeps the brand's actual color and rough silhouette so it reads
// instantly, the way SurveyMonkey's reference marquee uses real app icons
// rather than generic squares or text. Keys match the slugs in
// apps-catalog.js so each tile can link straight to its app-detail page.

window.ZI_BRAND_LOGOS = {
  slack: {
    name: 'Slack',
    svg: '<svg viewBox="0 0 122.8 122.8"><path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9z" fill="#E01E5A"/><path d="M32.3 77.6c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A"/><path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2z" fill="#36C5F0"/><path d="M45.2 32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0"/><path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2z" fill="#2EB67D"/><path d="M90.5 45.2c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D"/><path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9z" fill="#ECB22E"/><path d="M77.6 90.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E"/></svg>'
  },
  hubspot: {
    name: 'HubSpot',
    svg: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#FF7A59"/><g fill="none" stroke="#fff" stroke-width="2.2"><circle cx="21" cy="10" r="3.4"/><circle cx="12" cy="20" r="5.2"/><path d="M19 12.5 14 17.5"/></g></svg>'
  },
  salesforce: {
    name: 'Salesforce',
    svg: '<svg viewBox="0 0 32 32"><g fill="#00A1E0"><circle cx="11" cy="16" r="6"/><circle cx="18" cy="12" r="7"/><circle cx="23" cy="17" r="5"/><rect x="8" y="16" width="18" height="7" rx="3.5"/></g></svg>'
  },
  sheets: {
    name: 'Google Sheets',
    svg: '<svg viewBox="0 0 32 32"><rect x="6" y="3" width="20" height="26" rx="2" fill="#188038"/><rect x="9" y="9" width="14" height="14" fill="#fff"/><path d="M9 13.6h14M9 18.2h14M14.3 9v14M18.7 9v14" stroke="#188038" stroke-width="1.2"/></svg>'
  },
  gmail: {
    name: 'Gmail',
    svg: '<svg viewBox="0 0 32 32"><rect x="3" y="7" width="26" height="18" rx="2" fill="#fff" stroke="#E0E0E0"/><path d="M3 8v16.5l9-7z" fill="#EA4335"/><path d="M29 8v16.5l-9-7z" fill="#EA4335"/><path d="M3 8.5 16 18 29 8.5" fill="none" stroke="#EA4335" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  teams: {
    name: 'Microsoft Teams',
    svg: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#5059C9"/><circle cx="21.5" cy="10.5" r="3" fill="#fff"/><path d="M18 13h7a2.2 2.2 0 0 1 2.2 2.2V19a4.5 4.5 0 0 1-4.5 4.5H18z" fill="#fff"/><rect x="7" y="12" width="10" height="10" rx="1.5" fill="#fff" opacity=".95"/><text x="12" y="20" font-size="7" font-weight="700" fill="#5059C9" text-anchor="middle" font-family="Arial, sans-serif">T</text></svg>'
  },
  notion: {
    name: 'Notion',
    svg: '<svg viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="6" fill="#fff" stroke="#000" stroke-width="1.4"/><text x="16" y="21" font-size="12" font-weight="700" fill="#000" text-anchor="middle" font-family="Georgia, serif">N</text></svg>'
  },
  airtable: {
    name: 'Airtable',
    svg: '<svg viewBox="0 0 32 32"><polygon points="16,3 29,9 16,15 3,9" fill="#FCB400"/><polygon points="3,9 14,14 14,27 3,22" fill="#18BFFF"/><polygon points="29,9 18,14 18,27 29,22" fill="#F82B60"/></svg>'
  },
  mailchimp: {
    name: 'Mailchimp',
    svg: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#000"/><circle cx="12.5" cy="15" r="1.6" fill="#FFE01B"/><circle cx="19.5" cy="15" r="1.6" fill="#FFE01B"/><path d="M11 21c2 1.6 8 1.6 10 0" stroke="#FFE01B" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>'
  },
  intercom: {
    name: 'Intercom',
    svg: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1F8DED"/><g fill="#fff"><rect x="9" y="9" width="2.6" height="12" rx="1.3"/><rect x="14" y="7" width="2.6" height="14" rx="1.3"/><rect x="19" y="7" width="2.6" height="14" rx="1.3"/><rect x="24" y="9" width="2.6" height="12" rx="1.3"/></g></svg>'
  },
  typeform: {
    name: 'Typeform',
    svg: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#262627"/><rect x="14" y="7" width="4" height="4" rx="1" fill="#fff"/><rect x="14" y="14" width="4" height="11" rx="1" fill="#fff"/></svg>'
  },
  jotform: {
    name: 'Jotform',
    svg: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#FF6100"/><path d="M10 16.5 14 20.5 22 11.5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  trello: {
    name: 'Trello',
    svg: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0052CC"/><rect x="7" y="7" width="8" height="13" rx="1.5" fill="#fff"/><rect x="17" y="7" width="8" height="8" rx="1.5" fill="#fff"/></svg>'
  },
  asana: {
    name: 'Asana',
    svg: '<svg viewBox="0 0 32 32"><g fill="#FC636B"><circle cx="16" cy="8.5" r="5"/><circle cx="9" cy="20" r="5"/><circle cx="23" cy="20" r="5"/></g></svg>'
  },
  zendesk: {
    name: 'Zendesk',
    svg: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#03363D"/><path d="M8 22 20 10h4L12 22z" fill="#fff"/><circle cx="10" cy="22" r="2" fill="#fff"/><circle cx="22" cy="10" r="2" fill="#fff"/></svg>'
  },
  stripe: {
    name: 'Stripe',
    svg: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#635BFF"/><text x="16" y="22" font-size="18" font-weight="800" fill="#fff" text-anchor="middle" font-family="Georgia, serif">S</text></svg>'
  }
};
