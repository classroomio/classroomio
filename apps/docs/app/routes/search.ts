import { createFromSource } from 'fumadocs-core/search/server';

export async function loader({ request }: { request: Request }) {
  const { source } = await import('@/lib/source.server');
  const server = createFromSource(source, {
    language: 'english'
  });

  return server.GET(request);
}
