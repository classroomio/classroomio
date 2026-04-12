import { loader, multiple } from 'fumadocs-core/source';
import * as icons from 'lucide-static';
import { docs } from 'fumadocs-mdx:collections/server';

export const source = loader({
  source: multiple({
    docs: docs.toFumadocsSource()
  }),
  baseUrl: '/',
  icon(icon) {
    if (!icon) {
      return;
    }

    if (icon in icons) {
      return icons[icon as keyof typeof icons];
    }
  }
});

export async function getDocsRouteData(slugs: string[]) {
  const page = source.getPage(slugs);
  if (!page) {
    return null;
  }

  if (page.data.type === 'docs') {
    return {
      tree: source.pageTree as object,
      slugs,
      pageType: 'docs' as const,
      path: page.path
    };
  }
}
