import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  head: (
    <>
      <link
        rel="shortcut icon"
        type="image/x-icon"
        href={`${process.env.imagePath}/img/favicon.ico`}
      />
      <link
        rel="icon"
        type="image/x-icon"
        sizes="16x16"
        href={`${process.env.imagePath}/img/logo-16.png`}
      />
      <link
        rel="icon"
        type="image/x-icon"
        sizes="32x32"
        href={`${process.env.imagePath}/img/logo-32.png`}
      />
      <meta
        name="description"
        content="Spend less time doing the boring stuff, instead focus on impacting the lives of your students."
      />
      <meta name="theme-color" content="#ffffff" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        property="og:title"
        content="ClassroomIO –&nbsp;The Open Source Platform for Tech Bootcamps"
      />
      <meta
        property="og:description"
        content="Spend less time doing the boring stuff, instead focus on impacting the lives of your students."
      />
      <meta property="og:type" content="website" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1920" />
      <meta property="og:image:height" content="1080" />
      <meta
        property="og:image:secure_url"
        content="https://classroomio.com/classroomio-opengraph-image.png"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="@rotimi_best" />
      <meta
        name="twitter:title"
        content="ClassroomIO –&nbsp;The Open Source Platform for Tech Bootcamps"
      />
      <meta
        name="twitter:description"
        content="Spend less time doing the boring stuff, instead focus on impacting the lives of your students."
      />
    </>
  ),
  logo: (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={`${process.env.imagePath}/img/logo-512.png`}
        alt={'ClassroomIO logo'}
        width={32}
        height={32}
      />
      <span style={{ marginLeft: '5px', lineHeight: '15px' }}>ClassroomIO Docs</span>
    </div>
  ),
  navbar: {
    extraContent: (
      <a
        style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid gray',
          borderRadius: 5,
          padding: '2px 7px'
        }}
        href="https://app.classroomio.com"
      >
        Dashboard
      </a>
    )
  },
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
            url: `${process.env.imagePath}/img/logo-16.png`,
            width: 16,
            height: 16,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          {
            url: `${process.env.imagePath}/img/logo-32.png`,
            width: 32,
            height: 32,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          {
            url: `${process.env.imagePath}/img/logo-192.png`,
            width: 192,
            height: 192,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          {
            url: `${process.env.imagePath}/img/logo-512.png`,
            width: 512,
            height: 512,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          { url: `${process.env.imagePath}/img/og-image.png'` }
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
  docsRepositoryBase: 'https://github.com/rotimi-best/classroomio/tree/main/apps/docs',
  footer: {
    text: 'ClassroomIO Docs'
  }
};

export default config;
