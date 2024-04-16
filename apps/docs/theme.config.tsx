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
        href={`${process.env.imagePath}/img/logo-16.svg`}
      />
      <link
        rel="icon"
        type="image/x-icon"
        sizes="32x32"
        href={`${process.env.imagePath}/img/logo-32.svg`}
      />

      <title>ClassroomIO – Launch Your Online Bootcamp In Minutes</title>
      <meta
        name="description"
        content="ClassroomIO is the easiest place to launch and scale your online bootcamp."
      />

      <meta property="og:url" content="https://classroomio.com/docs" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="ClassroomIO – Launch Your Online Bootcamp In Minutes" />
      <meta
        property="og:description"
        content="ClassroomIO is the easiest place to launch and scale your online bootcamp."
      />
      <meta property="og:image" content="https://classroomio.com/classroomio-opengraph-image.png" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="classroomio.com" />
      <meta property="twitter:url" content="https://classroomio.com/docs" />
      <meta name="twitter:title" content="ClassroomIO – Launch Your Online Bootcamp In Minutes" />
      <meta
        name="twitter:description"
        content="ClassroomIO is the easiest place to launch and scale your online bootcamp."
      />
      <meta name="twitter:creator" content="@classroomio" />
      <meta
        name="twitter:image"
        content="https://classroomio.com/classroomio-opengraph-image.png"
      />
    </>
  ),
  logo: (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={`${process.env.imagePath}/img/logo-512.svg`}
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
        Dashboard ↗
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
        description: 'ClassroomIO is the easiest place to launch and scale your online bootcamp.',
        images: [
          {
            url: `${process.env.imagePath}/img/logo-16.svg`,
            width: 16,
            height: 16,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          {
            url: `${process.env.imagePath}/img/logo-32.svg`,
            width: 32,
            height: 32,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          {
            url: `${process.env.imagePath}/img/logo-192.svg`,
            width: 192,
            height: 192,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/png'
          },
          {
            url: `${process.env.imagePath}/img/logo-512.svg`,
            width: 512,
            height: 512,
            alt: 'ClassroomIO Docs Og Image Alt',
            type: 'image/svg'
            type: 'image/svg'
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
