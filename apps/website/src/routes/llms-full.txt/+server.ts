import { DOCS_ORIGIN, HELP_ORIGIN } from '$lib/server/upstreams';

export const prerender = false;

async function fetchText(origin: string, path: string): Promise<string> {
  const response = await fetch(new URL(path, origin));
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);

  return response.text();
}

export async function GET() {
  const [helpContent, docsContent] = await Promise.all([
    fetchText(HELP_ORIGIN, '/help/llms-full.txt'),
    fetchText(DOCS_ORIGIN, '/docs/llms-full.txt')
  ]);

  const body = `# ClassroomIO full documentation\n\n# Help center\n\n${helpContent.trim()}\n\n# Developer docs\n\n${docsContent.trim()}\n`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=3600' }
  });
}
