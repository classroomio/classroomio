import { useMemo } from 'react';

import type * as PageTree from 'fumadocs-core/page-tree';
import browserCollections from 'fumadocs-mdx:collections/browser';
import { isRouteErrorResponse, useLoaderData, useRouteError } from 'react-router';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { HomeLayout } from 'fumadocs-ui/layouts/home';

import { NotFound } from '@/components/not-found';
import { baseOptions } from '@/lib/layout.shared';

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX />
        </DocsBody>
      </DocsPage>
    );
  }
});

export async function loader({ params }: { params: Record<string, string | undefined> }) {
  const slug = params['*'];
  const slugs = slug ? slug.split('/') : ['home'];
  const { getDocsRouteData } = await import('@/lib/source.server');
  const routeData = await getDocsRouteData(slugs);
  if (!routeData) {
    throw new Response('Not Found', { status: 404 });
  }

  if (routeData.pageType === 'docs') {
    await clientLoader.preload(routeData.path);
  }

  return routeData;
}

export default function DocsRoute() {
  const data = useLoaderData<typeof loader>();
  const tree = useMemo(() => transformPageTree(data.tree as PageTree.Root), [data.tree]);

  return (
    <HomeLayout {...baseOptions()}>
      <DocsLayout
        sidebar={{
          collapsible: false
        }}
        themeSwitch={{
          enabled: false
        }}
        searchToggle={{
          enabled: false
        }}
        tree={tree}
      >
        <MdxContent path={data.path} />
      </DocsLayout>
    </HomeLayout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />;
  }

  return (
    <HomeLayout {...baseOptions()} className="justify-center py-32 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold">Docs Error</h1>
        <p className="text-fd-muted-foreground max-w-md">
          The docs page could not be rendered.
        </p>
      </div>
    </HomeLayout>
  );
}

function MdxContent({ path }: { path: string }) {
  const Content = clientLoader.getComponent(path);
  return <Content />;
}

function transformPageTree(root: PageTree.Root): PageTree.Root {
  function mapNode<T extends PageTree.Node>(item: T): T {
    if (typeof item.icon === 'string') {
      item = {
        ...item,
        icon: (
          <span
            dangerouslySetInnerHTML={{
              __html: item.icon
            }}
          />
        )
      };
    }

    if (item.type === 'folder') {
      return {
        ...item,
        index: item.index ? mapNode(item.index) : undefined,
        children: item.children.map(mapNode)
      };
    }

    return item;
  }

  return {
    ...root,
    children: root.children.map(mapNode),
    fallback: root.fallback ? transformPageTree(root.fallback) : undefined
  };
}
