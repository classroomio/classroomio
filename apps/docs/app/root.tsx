import * as React from 'react';

import type { LinksFunction, MetaFunction } from 'react-router';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError
} from 'react-router';
import { RootProvider } from 'fumadocs-ui/provider/react-router';

import { NotFound } from '@/components/not-found';
import './app.css';

const DEFAULT_META_TITLE =
  'ClassroomIO Docs | Customer, Partner, and Employee Education';
const DEFAULT_META_DESCRIPTION =
  'Learn how to create customer academies, partner certification programs, and employee training workflows in ClassroomIO.';
const DEFAULT_OG_IMAGE_URL = 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.jpg';
const DEFAULT_OG_IMAGE_ALT = 'ClassroomIO documentation for customer, partner, and employee education';

export const links: LinksFunction = () => [
  { rel: 'icon', href: '/docs/favicon.ico' }
];

export const meta: MetaFunction = () => [
  {
    title: DEFAULT_META_TITLE
  },
  {
    name: 'description',
    content: DEFAULT_META_DESCRIPTION
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
    content: DEFAULT_META_TITLE
  },
  {
    property: 'og:description',
    content: DEFAULT_META_DESCRIPTION
  },
  {
    property: 'og:image',
    content: DEFAULT_OG_IMAGE_URL
  },
  {
    property: 'og:image:alt',
    content: DEFAULT_OG_IMAGE_ALT
  },
  {
    property: 'og:image:type',
    content: 'image/jpeg'
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
    content: DEFAULT_OG_IMAGE_URL
  },
  // WebP fallback for better compression on supported platforms
  {
    property: 'og:image',
    content: 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.webp'
  },
  {
    property: 'og:image:alt',
    content: DEFAULT_OG_IMAGE_ALT
  },
  {
    property: 'og:image:type',
    content: 'image/webp'
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
    content: 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.webp'
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
    content: DEFAULT_META_TITLE
  },
  {
    name: 'twitter:description',
    content: DEFAULT_META_DESCRIPTION
  },
  {
    name: 'twitter:creator',
    content: '@classroomio'
  },
  {
    name: 'twitter:image',
    content: DEFAULT_OG_IMAGE_URL
  },
  {
    name: 'twitter:image:alt',
    content: DEFAULT_OG_IMAGE_ALT
  }
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />;
  }

  return (
    <Layout>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-6 py-24">
        <h1 className="text-3xl font-semibold">Docs Error</h1>
        <p className="text-fd-muted-foreground">
          The docs app hit an unexpected error while rendering this page.
        </p>
      </main>
    </Layout>
  );
}
