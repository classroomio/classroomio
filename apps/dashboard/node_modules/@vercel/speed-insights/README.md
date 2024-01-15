![Speed Insights](https://github.com/vercel/speed-insights/blob/main/.github/banner.png)

<div align="center"><strong>Vercel Speed Insights</strong></div>
<div align="center">Performance insights for your website</div>
<br />
<div align="center">
<a href="https://vercel.com/docs/speed-insights">Website</a>
<span> · </span>
<a href="https://vercel.com/docs/speed-insights/package">Documentation</a>
<span> · </span>
<a href="https://twitter.com/vercel">Twitter</a>
</div>

## Overview

`@vercel/speed-insights` automatically tracks web vitals and other performance metrics for your website.

This package does **not** track data in development mode.

It has 1st class integration with:

| Framework | Package                            |
| --------- | ---------------------------------- |
| Next.js   | `@vercel/speed-insights/next`      |
| Nuxt      | `@vercel/speed-insights/nuxt`      |
| Sveltekit | `@vercel/speed-insights/sveltekit` |
| React     | `@vercel/speed-insights/react`     |
| Vue       | `@vercel/speed-insights/vue`       |

It also supports other frameworks, vanilla JS and static websites.

## Quickstart

1. Enable Vercel Speed Insights for a project in the [Vercel Dashboard](https://vercel.com/d?to=%2F%5Bteam%5D%2F%5Bproject%5D%2Fspeed-insights&title=Open+Web+Analytics).
2. Add the `@vercel/speed-insights` package to your project
3. Inject Speed Insights to your app

   - If you are using **Next.js**, **React**, **Nuxt** or **Vue** you can use the framework-specific `<SpeedInsights />` component to inject the script into your app.
   - If you are using **Sveltekit**, you can use the `injectSpeedInsights()` function `@vercel/speed-insights/sveltekit` in your top-level `+layout.svelte` file.
   - For other frameworks, you can use the `inject` function add the tracking script to your app.
   - If you want to use Vercel Speed Insights on a static site without npm, follow the instructions in the [documentation](https://vercel.com/docs/speed-insights/quickstart).

4. Deploy your app to Vercel and see data flowing in.

## Documentation

Find more details about this package in our [documentation](https://vercel.com/docs/speed-insights/quickstart).
