import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img src={`/docs/img/logo-512.png`} alt={'ClassroomIO logo'} width={32} height={32} />
      <span style={{ marginLeft: '5px', lineHeight: '15px' }}>ClassroomIO Docs</span>
    </div>
  ),
  project: {
    link: 'https://github.com/rotimi-best/classroomio'
  },
  useNextSeoProps() {
    return {
      titleTemplate: 'ClassroomIO Documentation',
      openGraph: {
        siteName: 'ClassroomIO Docs',
        title: 'ClassroomIO Documentation',
        description:
          'Spend less time doing the boring stuff, instead focus on impacting the lives of your students.',
        images: [
          {
            url: '/docs/img/logo-16.png',
            width: 16,
            height: 16,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          {
            url: '/docs/img/logo-32.png',
            width: 32,
            height: 32,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          {
            url: '/docs/img/logo-192.png',
            width: 192,
            height: 192,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          {
            url: '/docs/img/logo-512.png',
            width: 512,
            height: 512,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          { url: '/docs/img/og-image.png' }
        ],
        twitter: {
          handle: '@classroomio',
          site: '@classroomio.com',
          cardType: 'summary_large_image'
        }
      }
    };
  },
  chat: {
    link: 'https://dub.sh/ciodiscord'
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    autoCollapse: false
  },
  docsRepositoryBase: 'https://github.com/rotimi-best/classroomio/apps/docs',
  footer: {
    text: 'ClassroomIO Help Docs'
  },
  head: (
    <>
      <link rel="shortcut icon" type="image/x-icon" href={`/img/favicon.ico`} />
      <link rel="icon" type="image/x-icon" sizes="16x16" href={`/img/logo-16.png`} />
      <link rel="icon" type="image/x-icon" sizes="32x32" href={`/img/logo-32.png`} />
    </>
  )
};

export default config;
