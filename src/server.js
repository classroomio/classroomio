import dotenv from 'dotenv';

import { json } from 'body-parser';
import sirv from 'sirv';
import express from 'express';
import compression from 'compression';
import * as sapper from '@sapper/server';
import cookieParser from 'cookie-parser';
import { getSupabase } from './utils/functions/supabase';

dotenv.config();

const config = {
  isProd: process.env.NODE_ENV !== 'development',
  telegramToken: process.env.SVELTE_APP_TELEGRAM_API_TOKEN,
  mixpanelToken: process.env.SVELTE_APP_MIXPANEL_TOKEN,
  supabaseConfig: {
    bucketPath:
      'https://koxqonvbkeakwvmdegcf.supabase.in/storage/v1/object/sign',
    url: process.env.SVELTE_APP_SUPABASE_URL,
    anonKey: process.env.SVELTE_APP_SUPABASE_ANON_KEY,
  },
};

const supabase = getSupabase(config);

express() // You can also use Express
  .use(cookieParser())
  .use(json())
  .use(
    compression({ threshold: 0 }),
    sirv('static', { dev: true }),
    sapper.middleware({
      session: async (req) => {
        const { user } = await supabase.auth.api.getUserByCookie(req);
        console.log('cookie calling');
        // console.log('req', req.headers.host);
        return {
          user: JSON.stringify(user),
          config,
          host: req.headers.host,
        };
      },
    })
  )
  .listen(process.env.PORT, (err) => {
    if (err) console.log('error', err);
  });
