import { useEffect, useState } from 'react';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { createServerFn } from '@tanstack/react-start';
import browserCollections from 'fumadocs-mdx:collections/browser';
import { createFileRoute, notFound } from '@tanstack/react-router';

import { source } from '@/lib/source';
import { DocsNav } from '@/components/docs-nav';
import { baseOptions } from '@/lib/layout.shared';

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/') ?? [];
    const data = await loader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  }
});

const loader = createServerFn({
  method: 'GET'
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      path: page.path
    };
  });

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-2 text-4xl font-bold">{frontmatter.title}</h1>
        {frontmatter.description && (
          <p className="text-muted-foreground mb-8 text-lg">{frontmatter.description}</p>
        )}
        <div className="prose dark:prose-invert">
          <MDX
            components={{
              ...defaultMdxComponents
            }}
          />
        </div>
      </div>
    );
  }
});

function Page() {
  const data = Route.useLoaderData();
  const Content = clientLoader.getComponent(data.path);
  const base = baseOptions();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        {
          type: 'custom',
          on: 'all',
          children: <DocsNav />,
          secondary: isMobile
        }
      ]}
      nav={{
        ...base.nav
      }}
    >
      <section className="w-full">
        <Content />
      </section>
    </HomeLayout>
  );
}
