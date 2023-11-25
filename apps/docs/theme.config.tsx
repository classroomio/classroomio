import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={`/img/logo-512.png`}
        alt={"ClassroomIO logo"}
        width={32}
        height={32}
      />
      <span style={{ marginLeft: '5px', lineHeight: '15px' }}>ClassroomIO Help Docs</span>
    </div>
  ),
  project: {
    link: 'https://github.com/classroomio/docs',
  },
  useNextSeoProps() {
    return {
      titleTemplate: "ClassroomIO Help Docs",
      openGraph: {
        images: [{ url: `/img/og-image.png` }],
        siteName: "ClassroomIO Help Docs",
      },
    };
  },
  chat: {
    link: 'https://discord.com',
  },
  docsRepositoryBase: 'https://github.com/classroomio/docs',
  footer: {
    text: 'ClassroomIO Help Docs',
  },
  head: (
    <>
      <link
        rel="shortcut icon"
        type="image/x-icon"
        href={`/img/favicon.ico`}
      />
      <link
        rel="icon"
        type="image/x-icon"
        sizes="16x16"
        href={`/img/logo-16.png`}
      />
      <link
        rel="icon"
        type="image/x-icon"
        sizes="32x32"
        href={`/img/logo-32.png`}
      />
    </>
  ),
}

export default config
