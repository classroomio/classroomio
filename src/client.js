import * as sapper from '@sapper/app';
// import * as Sentry from '@sentry/browser';
// import { Integrations } from '@sentry/tracing';
// import { CaptureConsole } from '@sentry/integrations';
import config from './config';

console.log(`isProd`, config.isProd);

// if (config.isProd) {
//   Sentry.init({
//     dsn: 'https://c966f7e8cb1d4306be20b26bb4f0cc96@o476906.ingest.sentry.io/5999999',
//     integrations: [
//       new Integrations.BrowserTracing(),
//       new CaptureConsole({
//         levels: ['error'],
//       }),
//     ],
//     environment: config.isProd ? 'production' : 'development',
//     // Set tracesSampleRate to 1.0 to capture 100%
//     // of transactions for performance monitoring.
//     // We recommend adjusting this value in production
//     tracesSampleRate: 1.0,
//   });
// }

sapper.start({
  target: document.querySelector('#sapper'),
});
