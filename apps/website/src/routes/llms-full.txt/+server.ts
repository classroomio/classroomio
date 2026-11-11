import { DOCS_ORIGIN, HELP_ORIGIN, SITE_ORIGIN } from '$lib/server/upstreams';

export const prerender = false;

const UPSTREAM_TIMEOUT_MS = 15000;

async function fetchText(origin: string, path: string): Promise<string> {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);

  return response.text();
}

function absolutizeRootLinks(content: string, basePath: '/help' | '/docs'): string {
  return content.replace(/\]\((\/(?!\/)[^)\s]*)\)/g, (_match, target: string) => {
    const hasBase = target === basePath || target.startsWith(`${basePath}/`);
    const resolvedPath = hasBase ? target : `${basePath}${target}`;

    return `](${SITE_ORIGIN}${resolvedPath})`;
  });
}

export async function GET() {
  try {
    const [helpContent, docsContent] = await Promise.all([
      fetchText(HELP_ORIGIN, '/help/llms-full.txt'),
      fetchText(DOCS_ORIGIN, '/docs/llms-full.txt')
    ]);

    const helpSection = absolutizeRootLinks(helpContent.trim(), '/help');
    const docsSection = absolutizeRootLinks(docsContent.trim(), '/docs');
    const body = `# ClassroomIO full documentation\n\n# Help center\n\n${helpSection}\n\n# Developer docs\n\n${docsSection}\n`;

    return new Response(body, {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=3600' }
    });
  } catch (error) {
    console.error('llms-full.txt error:', error);

    return new Response('Documentation is temporarily unavailable. Try again shortly.', {
      status: 502,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
    });
  }
}
