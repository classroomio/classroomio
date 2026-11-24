// brand-logos.js: the real product marks for every app in the directory, plus
// ClassroomIO and Zapier. Files live in ./logos and come from public brand
// icon sets (gilbarbara/logos, Simple Icons, svgl) or the vendor's own site;
// wordmark-only sources were cropped to the icon. Prototype use only — a
// shipped directory would pull approved assets from each vendor's press kit.
// Keys match the slugs in apps-catalog.js.

(function () {
  var FILES = {
    hubspot: ['HubSpot', 'hubspot.svg'],
    salesforce: ['Salesforce', 'salesforce.svg'],
    mailchimp: ['Mailchimp', 'mailchimp.svg'],
    customerio: ['Customer.io', 'customerio.svg'],
    slack: ['Slack', 'slack.svg'],
    teams: ['Microsoft Teams', 'teams.svg'],
    google_meet: ['Google Meet', 'google_meet.svg'],
    zoom: ['Zoom', 'zoom.svg'],
    zendesk: ['Zendesk', 'zendesk.svg'],
    intercom: ['Intercom', 'intercom.svg'],
    calendly: ['Calendly', 'calendly.svg'],
    calcom: ['Cal.com', 'calcom.svg'],
    sheets: ['Google Sheets', 'sheets.svg'],
    notion: ['Notion', 'notion.svg'],
    confluence: ['Confluence', 'confluence.svg'],
    typeform: ['Typeform', 'typeform.svg'],
    jotform: ['Jotform', 'jotform.png'],
    pendo: ['Pendo', 'pendo.svg'],
    mixpanel: ['Mixpanel', 'mixpanel.svg'],
    circle: ['Circle', 'circle.svg'],
    classroomio: ['ClassroomIO', 'classroomio.svg'],
    zapier: ['Zapier', 'zapier.svg']
  };

  var logos = {};
  Object.keys(FILES).forEach(function (slug) {
    var name = FILES[slug][0];
    var src = 'logos/' + FILES[slug][1];
    logos[slug] = {
      name: name,
      src: src,
      svg: '<img class="brand-logo-img" src="' + src + '" alt="' + name + '" loading="lazy" />'
    };
  });

  window.ZI_BRAND_LOGOS = logos;
})();
