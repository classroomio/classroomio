import type { OssFriend } from '$lib/utils/types';

export async function load() {
  const friends: OssFriend[] = [
    {
      name: 'Appsmith',
      description: 'Build custom software on top of your data.',
      href: 'https://www.appsmith.com'
    },
    {
      name: 'BoxyHQ',
      description:
        'BoxyHQ’s suite of APIs for security and privacy helps engineering teams build and ship compliant cloud applications faster.',
      href: 'https://boxyhq.com'
    },
    {
      name: 'Cal.com',
      description:
        'Cal.com is a scheduling tool that helps you schedule meetings without the back-and-forth emails.',
      href: 'https://cal.com'
    },
    {
      name: 'Crowd.dev',
      description:
        'Centralize community, product, and customer data to understand which companies are engaging with your open source project.',
      href: 'https://www.crowd.dev'
    },
    {
      name: 'Documenso',
      description:
        'The Open-Source DocuSign Alternative. We aim to earn your trust by enabling you to self-host the platform and examine its inner workings.',
      href: 'https://documenso.com'
    },
    {
      name: 'Dub',
      description:
        'Dub is an open-source link management tool for modern marketing teams to create, share, and track short links.',
      href: 'https://dub.co'
    },
    {
      name: 'Formbricks',
      description:
        'Survey granular user segments at any point in the user journey. Gather up to 6x more insights with targeted micro-surveys. All open-source.',
      href: 'https://formbricks.com'
    },
    {
      name: 'Hanko',
      description:
        'Open-source authentication and user management for the passkey era. Integrated in minutes, for web and mobile apps.',
      href: 'https://www.hanko.io'
    },
    {
      name: 'Infisical',
      description:
        'Open source, end-to-end encrypted platform that lets you securely manage secrets and configs across your team, devices, and infrastructure.',
      href: 'https://infisical.com'
    },
    {
      name: 'Novu',
      description:
        'The open-source notification infrastructure for developers. Simple components and APIs for managing all communication channels in one place.',
      href: 'https://novu.co'
    },
    {
      name: 'OpenBB',
      description:
        'Democratizing investment research through an open source financial ecosystem. The OpenBB Terminal allows everyone to perform investment research, from everywhere.',
      href: 'https://openbb.co'
    },
    {
      name: 'OpenStatus',
      description: 'Open-source monitoring platform with beautiful status pages.',
      href: 'https://www.openstatus.dev'
    },
    {
      name: 'Papermark',
      description:
        'Open-Source Docsend Alternative to securely share documents with real-time analytics.',
      href: 'https://papermark.io'
    },
    {
      name: 'Trigger',
      description:
        'Create long-running Jobs directly in your codebase with features like API integrations, webhooks, scheduling and delays.',
      href: 'https://trigger.dev'
    },
    {
      name: 'UnInbox',
      description: 'Open Source Email + Chat communication platform',
      href: 'https://uninbox.com'
    },
    {
      name: 'Webstudio',
      description:
        'Webstudio visually translates CSS without obscuring it, giving designers superpowers that were exclusive to developers in the past.',
      href: 'https://webstudio.is'
    }
  ];
  return { friends };
}
