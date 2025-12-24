import * as React from 'react';

import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';

import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import appCss from '@/styles/app.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      {
        title: 'ClassroomIO | The Open Source Learning Management System for Companies'
      },
      {
        name: 'description',
        content:
          'A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations'
      },
      {
        property: 'og:url',
        content: 'https://classroomio.com/docs'
      },
      {
        property: 'og:type',
        content: 'website'
      },
      {
        property: 'og:title',
        content: 'ClassroomIO | The Open Source Learning Management System for Companies'
      },
      {
        property: 'og:description',
        content:
          'A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations'
      },
      {
        property: 'og:image:type',
        content: 'image/png'
      },
      {
        property: 'og:image:width',
        content: '1920'
      },
      {
        property: 'og:image:height',
        content: '1080'
      },
      {
        property: 'og:image:secure_url',
        itemProp: 'image',
        content: 'https://brand.cdn.clsrio.com/og/classroomio-og.png'
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      },
      {
        property: 'twitter:domain',
        content: 'classroomio.com'
      },
      {
        property: 'twitter:url',
        content: 'https://classroomio.com/docs'
      },
      {
        name: 'twitter:title',
        content: 'ClassroomIO | The Open Source Learning Management System for Companies'
      },
      {
        name: 'twitter:description',
        content:
          'A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations'
      },
      {
        name: 'twitter:creator',
        content: '@classroomio'
      },
      {
        name: 'twitter:image',
        content: 'https://brand.cdn.clsrio.com/og/classroomio-og.png'
      }
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' }
    ]
  }),
  component: RootComponent
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
