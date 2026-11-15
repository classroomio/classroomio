---
name: seo-blog-images
description: Plan, generate, compress, verify, and wire high-CTR cover images and inline proof visuals into blog posts (MDX, Astro, Next.js, Hugo, HTML) with strict image SEO checks. Use when adding a blog cover or OG image, generating inline visuals without dark icon-box AI slop, capturing real product screenshots or data charts, or auditing image alt text, filenames, and Core Web Vitals attributes.
---

# Blog images and image SEO

The default AI blog visual hurts the post: a dark background with 5 glowing wireframe icons, garbled infographic labels, a `2.4 MB` PNG named `image-1.png`, and no `width`/`height`, so the layout jumps on load. This workflow picks the right visual type per slot, produces it (real capture, deterministic chart, or a short-prompt generation), reads every letter back, and wires SEO-complete tags into the post.

## Step 0: Find where images live

```
Which framework is the repo?
├── `next.config.*`, `astro.config.*`, `vite.config.*`, Remix -> files in `public/blog/<slug>/`, src `/blog/<slug>/<name>.webp`
├── Hugo (`hugo.toml` / `config.toml`) -> page bundle next to `index.md`, or `static/blog/<slug>/`
├── Jekyll (`_config.yml`) -> `assets/blog/<slug>/`
└── Other -> match the path pattern of an existing image in a published post
```

Never invent a new image directory when the repo already has one; mixed locations break the size audit and CDN caching rules.

## Step 1: Pick the visual type per slot

Walk this for the cover and for each `<h2>` that needs a visual:

```
What is this slot for?
├── Software product review or UI tutorial (`### 1. ToolName`)?
│   └── Path B: real Playwright screenshot or short `<video>` loop.
│       Never ask an image model to draw a real product's UI; readers spot fake dashboards and it misrepresents the product.
├── Benchmark, dataset, or any chart with numbers?
│   └── Path C: deterministic SVG chart from the real numbers.
│       Never ask an image model for charts or tables; it invents bar heights and misspells values.
├── Cover / OpenGraph (`og:image`)?
│   └── Path A: 16:9, 12-22 word prompt, 1 focal scene + a 3-6 word headline badge.
└── Inline concept (workflow, pricing contrast, architecture)?
    ├── Does a 2-4 word contrast label make the point in half a second?
    │   └── Path A: topic-literal scene + 2-4 quoted labels (`"MANUAL CSV"` vs `"LIVE WEBHOOK"`). No invented numbers.
    └── Otherwise -> Path A: zero-text close-up, 12-20 words, tight framing.
```

## Step 2: Prompt rules (Path A only)

1. **12-22 words.** Long prompts make image models crowd the frame with sub-panels and tiny unreadable text; short prompts produce one bold subject.
2. **No dark icon-box templates.** Never prompt for `"cards with glowing wireframe icons"`, `"holographic brain"`, `"dark monochrome desk with ice-blue highlights"`, or trophy metaphors. Describe tangible objects under bright, high-contrast light.
3. **Cover headline badge: 3-6 quoted words,** using the target query plus a year or format badge, kept inside the center 80% of the frame so the 1.91:1 OG crop on X and LinkedIn does not cut it.
   - `querybench.dev`: `"Crisp daylight 3D studio, cobalt Postgres server rack splitting into instant branches, bold headline 'POSTGRES CI BRANCHING', badge '2026 BENCHMARK'."`
   - `example.com`: `"High-contrast isometric shipping container launching from a GitHub terminal into orbit, bold text '11 BEST NEXT.JS HOSTS', badge '2026 TESTED'."`
4. **Inline contrast labels: 2-4 quoted labels, only real numbers.** Any figure in a label must exist in the post or `seo/kb/`.
   - `invoicekit.io`: `"Split studio scene: tangled red paper receipts labeled '0.8% BILLING FEE' versus a clean cobalt API card labeled '$19 FLAT', crisp daylight."`

## Step 3: Produce the file

### Scaffold the image script (once per repo)

If `scripts/seo-image.mjs` does not exist, create it. It handles both generation (Path A) and compression of any existing PNG (Paths B and C), so every image goes through the same size pipeline.

```javascript
// scripts/seo-image.mjs
// Generate: node scripts/seo-image.mjs --prompt "<12-22 words>" --out public/blog/<slug>/<keyword-name>.webp
// Compress: node scripts/seo-image.mjs --input /tmp/raw.png --out public/blog/<slug>/<keyword-name>.webp
// Options:  --quality 82 (lower it if the file is over budget), --model <openrouter-image-model>
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";

const { values: a } = parseArgs({
  options: {
    prompt: { type: "string" },
    input: { type: "string" },
    out: { type: "string" },
    quality: { type: "string", default: "82" },
    model: { type: "string", default: "google/gemini-2.5-flash-image" },
  },
});
if (!a.out || (!a.prompt && !a.input)) {
  console.error("Usage: --prompt <text> | --input <file>, plus --out <path.webp|.jpg>");
  process.exit(1);
}

let raw;
if (a.input) {
  raw = await fs.readFile(a.input);
} else {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set");
    process.exit(1);
  }
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: a.model,
      messages: [{ role: "user", content: a.prompt }],
      modalities: ["image", "text"],
      image_config: { aspect_ratio: "16:9" },
    }),
  });
  const data = await res.json();
  const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!res.ok || !url) {
    console.error(`Generation failed (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
    process.exit(1);
  }
  raw = Buffer.from(url.replace(/^data:image\/\w+;base64,/, ""), "base64");
}

await fs.mkdir(path.dirname(a.out), { recursive: true });
const q = Number(a.quality);
const img = sharp(raw).resize({ width: 1536, withoutEnlargement: true });
const buf = /\.jpe?g$/i.test(a.out)
  ? await img.jpeg({ quality: q, mozjpeg: true }).toBuffer()
  : await img.webp({ quality: q }).toBuffer();
await fs.writeFile(a.out, buf);
const { width, height } = await sharp(buf).metadata();
console.log(`${a.out} ${width}x${height} ${Math.round(buf.length / 1024)} KB`);
```

Install `sharp` with the repo's package manager: `pnpm add -D sharp` (`pnpm-lock.yaml`), `bun add -d sharp` (`bun.lock`), `yarn add -D sharp` (`yarn.lock`), else `npm i -D sharp`. If the repo has no `package.json` (Hugo, Jekyll), put the script in `/tmp/seo-image/`, run `npm init -y && npm i sharp` there, and pass absolute `--out` paths, so the repo gains no Node tooling it does not use.

If `OPENROUTER_API_KEY` is missing, generate with the agent's built-in image tool, save the PNG to `/tmp/`, and run the script in `--input` mode.

### Path A: generate

```bash
node scripts/seo-image.mjs --prompt "<prompt from Step 2>" --out public/blog/<slug>/<keyword-name>.webp
```

Use `.jpg` for the cover when the site's OG pipeline rejects WebP; use `.webp` everywhere else.

### Path B: real screenshot

```bash
npx playwright install chromium   # first run only
npx playwright screenshot --viewport-size "1440, 900" --wait-for-timeout 1500 \
  "https://querybench.dev" /tmp/raw-shot.png
node scripts/seo-image.mjs --input /tmp/raw-shot.png --out public/blog/postgres-tools/querybench-explain-analyze-ui.webp
```

### Path C: deterministic chart

For numbers from the post or `seo/kb/proof/benchmarks/*.md`, write a self-contained `1536x864` SVG: bar lengths computed from the values (cap the longest horizontal bar at `760px` so right-hand value labels never clip at the `1536px` edge), every value printed as a label, `font-family="system-ui, -apple-system, sans-serif"`, dark text on a light background. Save it as `/tmp/<name>.svg`, then convert with `--input /tmp/<name>.svg`. Every number on the chart then matches the source exactly.

## Step 4: Read back every image

Open every generated file with the agent's file-viewing tool right after saving. Image models misspell (`"BENCHMMARK"`), duplicate letters, and clip text at the edge.

- Check every quoted word letter by letter and confirm it sits fully inside the frame.
- Garbled, blurry, duplicated, or clipped text, or a dark icon-box layout: delete the file and regenerate with a 12-16 word prompt. After 2 failed attempts, switch that slot to zero-text mode.

## Step 5: Wire it in with full image SEO

1. **Keyword kebab-case filenames** naming the subject (`postgres-zfs-branch-spinup-benchmark.webp`). Never `image1.png`, `hero.webp`, `screenshot-2026.png`, or UUIDs, because the filename is one of the few text signals image search reads.
2. **`alt` text of 80-160 characters** stating what the image shows in the post's terms. Never start with `"Image of"`, `"Picture of"`, or `"An infographic showing"`; screen readers already announce the image.
   - *Bad:* `"An infographic of database branching speed"` (43 chars, generic).
   - *Good:* `"Comparison of 50GB Postgres CI branch creation times showing ZFS copy-on-write cloning in 1.8 seconds versus 14 minutes for pg_restore"` (134 chars).
3. **Explicit `width` and `height`** equal to the intrinsic pixels the script printed, on every `<img>` and `<Image>`, so the browser reserves the space and the layout does not shift.
4. **Loading priority:**
   - Cover / above-the-fold hero only: `priority` (Next.js) or `fetchpriority="high"` + `loading="eager"`, because it is the LCP element.
   - Every image below the fold: `loading="lazy"` and `decoding="async"`. Never `priority` on body images; it competes with the hero for bandwidth.
5. **Size budgets:**
   - Cover: 1200px or wider, 350 KB or less. Also set it in frontmatter (`image` / `cover` / `openGraph.images`) so X, LinkedIn, Slack, and Google Discover render the large card.
   - Inline: 220 KB or less, `.webp`. Over budget: re-run with `--quality 72`, then `--quality 62`.
6. **Placement:** put inline images after the first paragraph of their `<h2>` section, never between the heading and its first sentence. Featured snippet extraction and readers both expect the text answer directly under the heading.

```mdx
## How much faster is ZFS copy-on-write branching than pg_restore in CI?

Cloning a 50.4 GB Postgres 16 database with `pg_restore -j 4` takes a median of 14 minutes and 22 seconds in GitHub Actions. A ZFS copy-on-write snapshot boots the same 180-million-row dataset in 1.8 seconds.

<Image
  src="/blog/postgres-ci-testing/postgres-zfs-branch-spinup-benchmark.webp"
  alt="Benchmark comparison showing QueryBench ZFS copy-on-write booting a 50GB Postgres branch in 1.8 seconds compared to 14 minutes for pg_restore"
  width={1536}
  height={864}
  loading="lazy"
  decoding="async"
/>
```

## Step 6: Audit before finishing

```bash
dir=public/blog/<slug>; post=content/blog/<slug>.mdx
for f in "$dir"/*; do
  n=$(basename "$f"); kb=$(( $(wc -c < "$f") / 1024 ))
  echo "$kb KB  $n"
  [ "$kb" -gt 350 ] && echo "  FAIL: over 350 KB"
  [ "$kb" -gt 220 ] && echo "  CHECK: only the cover may exceed 220 KB"
  echo "$n" | grep -qiE '^(image|img|hero|screenshot|untitled)[-_.0-9]|^[0-9a-f]{8}-' && echo "  FAIL: generic filename"
done
grep -oE 'alt="[^"]*"' "$post" | awk '{ l = length($0) - 6; s = (l < 80 || l > 160) ? "FAIL" : "ok"; print s, l, $0 }'
```

Done means:

- [ ] Image files exist in the framework's image directory and the post file references them.
- [ ] Each slot used the right path: screenshot for products, SVG chart for numbers, short prompt for cover and concepts.
- [ ] Every generated image was viewed with zero misspelled or clipped text.
- [ ] The audit prints no `FAIL`, and the only file over 220 KB is the cover.
- [ ] The cover is in frontmatter/OG metadata; inline images sit after the first paragraph of their `<h2>` with `width`, `height`, and `loading="lazy"`.
