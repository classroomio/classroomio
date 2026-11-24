import { createFetcher, readStage } from '@cio/course-builder';
import { createRenderer } from './src/services/course-builder/renderer';

const [url, kind, brand] = process.argv.slice(2);
const fetcher = createFetcher({ productToken: 'ClassroomIO-CourseBuilder-Eval' });
const inner = createRenderer({ userAgent: 'ClassroomIO-CourseBuilder-Eval/0.1 (+https://classroomio.com)' });
const renderer = {
  async render(target: string, options: { timeoutMs: number }) {
    const started = Date.now();
    try {
      const result = await inner.render(target, options);
      console.log(`render ${((Date.now() - started) / 1000).toFixed(1)}s ${result.status} ${target}`);
      return result;
    } catch (error) {
      console.log(
        `render FAILED ${((Date.now() - started) / 1000).toFixed(1)}s ${target} ${String(error).slice(0, 160)}`
      );
      throw error;
    }
  }
};
const source = {
  kind,
  url,
  title: null,
  foundVia: 'subdomain-probe',
  foundAt: url,
  redirectChain: [url],
  ownership: 'foreign',
  evidence: 'redirect-from-own-name',
  access: 'open',
  llmsTxtUrl: null,
  sitemapUrls: []
};
const sourceMap = { brandDomain: brand, siteTitle: brand.split('.')[0] };
const started = Date.now();
let pages = 0;
const timer = setInterval(
  () => console.log(`[progress ${Math.round((Date.now() - started) / 1000)}s] pages ${pages}`),
  30_000
);
const read = await readStage({
  source,
  sourceMap,
  fetcher,
  renderer,
  locale: 'en',
  maxPages: Number(process.argv[5] ?? 40),
  deadlineAt: started + 5 * 60_000,
  onPage: () => {
    pages += 1;
  }
} as never);
clearInterval(timer);
console.log(
  `read ${((Date.now() - started) / 1000).toFixed(1)}s outcome ${read.outcome} pages ${read.pages.length}`,
  read.completeness
);
await inner.close();
process.exit(0);
