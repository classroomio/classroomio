import { Hono } from 'hono';
import { supabaseInit } from './utils/supabase';
import { env } from 'hono/adapter';
import generateRandomUUID from './utils/generateRandomUUID';
import { getRateLimiter } from './utils/redis';
import { SupabaseClient } from '@supabase/supabase-js';
import { Ratelimit } from '@upstash/ratelimit';
import { ExecutionContext } from 'hono/dist/types/context';
import { logger } from 'hono/logger';

const app = new Hono();
app.use(logger());
interface Env {
  SUPABASE_ANON_KEY: string;
  SUPABASE_URL: string;
  redis_url: string;
  host: string;
  token: string;
  telemetry: string;
}
let supabase: SupabaseClient;
let ratelimit: Ratelimit;
app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.use(async (c, next) => {
  // a middleware that handles rate limiting
  const response = await fetch('https://api.ipify.org?format=json');
  const { ip } = (await response.json()) as { ip: string };
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return c.json({ error: 'Too much request' }, 429);
  }
  return await next();
});

app.get('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const url = await supabase.from('links').select('original_url').eq('short_code', id).single();
    if (!url.data) {
      return c.json({ message: 'Url not found' }, 404);
    }
    return c.redirect(url.data?.original_url);
  } catch (error) {
    console.log(error);
    return c.json({ message: 'Server error', error }, 500);
  }
});

app.post('/short', async (c) => {
  try {
    const { host } = env<{
      host: string;
    }>(c);

    let { url } = await c.req.json();
    //append https:// if it doesn't exist
    if (url.indexOf(':') === -1) {
      url = 'https://' + url;
    }
    const uid = generateRandomUUID();
    const uidExists = await supabase.from('links').select('*').eq('short_code', uid).single();
    if (uidExists.data) {
      return c.json({ message: 'Server error! Try again' }, 500);
    }
    const urlExists = await supabase.from('links').select('*').eq('original_url', url).single();
    if (urlExists.data) {
      return c.json(
        { message: 'Link already exists', short_link: `${host}/${urlExists.data?.short_code}` },
        409
      );
    }
    const data = {
      original_url: url as string,
      short_code: uid,
      created_at: new Date().toISOString()
    };
    const res = await supabase.from('links').insert(data);
    if (res.error) {
      return c.json(res, 500);
    }
    return c.json({ short_url: host + `/${uid}` }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: 'Server error', error }, 500);
  }
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext | undefined) {
    if (!supabase) {
      supabase = supabaseInit({ url: env.SUPABASE_URL, key: env.SUPABASE_ANON_KEY });
    }
    if (!ratelimit) {
      ratelimit = getRateLimiter({
        url: env.redis_url,
        token: env.token,
        telemetry: env.telemetry
      });
    }
    return app.fetch(request, env, ctx);
  }
};
