/**
 * Prints the source map discovery finds for any list of sites. Spends no model tokens.
 * Needs a build of the package (pnpm --filter @cio/course-builder build).
 * Run: node eval/discover-sites.mjs example.com other.org
 */
import { createFetcher, discoverSources } from '../dist/index.js';

const sites = process.argv.slice(2);
if (!sites.length) {
  console.log('Usage: node eval/discover-sites.mjs <site> [site ...]');
  process.exit(1);
}

const fetcher = createFetcher({ productToken: 'ClassroomIO-CourseBuilder-Eval' });

for (const site of sites) {
  const startedAt = Date.now();
  const map = await discoverSources(site, { fetcher });
  console.log(`\n=== ${site}: ${((Date.now() - startedAt) / 1000).toFixed(1)} s`);

  for (const source of map.sources) {
    const extras = [source.llmsTxtUrl ? 'llms.txt' : '', source.sitemapUrls.length ? 'sitemap' : '']
      .filter(Boolean)
      .join(', ');
    console.log(
      `  read     ${source.kind.padEnd(12)} ${source.url}  [${source.evidence}, ${source.access}]${extras ? `  ${extras}` : ''}`
    );
  }
  for (const source of map.needsConfirmation)
    console.log(`  confirm  ${source.kind.padEnd(12)} ${source.url}  "${source.title}"`);
  for (const entry of map.skipped.filter((skipped) => skipped.reason !== 'unreachable')) {
    console.log(`  skipped  ${entry.url}  ${entry.reason}${entry.detail ? ` (${entry.detail})` : ''}`);
  }
  console.log(`  youtube  ${map.youtubeChannels.join(', ') || 'none'}`);
}
