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

      <title>ClassroomIO | The Open Source Learning Management System for Companies</title>
      <meta
        name="description"
        content="A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations"
      />

      <meta property="og:url" content="https://classroomio.com/docs" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="ClassroomIO | The Open Source Learning Management System for Companies" />
      <meta
        property="og:description"
        content="A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations"
      />
      <meta property="og:image" content="https://brand.cdn.clsrio.com/og/classroomio-og.png" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="classroomio.com" />
      <meta property="twitter:url" content="https://classroomio.com/docs" />
      <meta name="twitter:title" content="ClassroomIO | The Open Source Learning Management System for Companies" />
      <meta
        name="twitter:description"
        content="A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations"
      />
      <meta name="twitter:creator" content="@classroomio" />
      <meta name="twitter:image" content="https://brand.cdn.clsrio.com/og/classroomio-og.png" />
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
        description:
          'A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations',
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
