import { Hono } from 'hono';
import { supabaseInit } from './utils/supabase';
import { env } from 'hono/adapter';
import generateRandomUUID from './utils/generateRandomUUID';

const app = new Hono();
app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/:id', async (c) => {
  const { id } = c.req.param();
  console.log(id);
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env<{
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
  }>(c);
  try {
    const url = await supabaseInit({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY })
      .from('links')
      .select('original_url')
      .eq('short_code', id)
      .single();
    if (!url.data) {
      return c.json({ message: 'Url not found' }, 404);
    }
    console.log(url.data);
    return c.redirect(url.data?.original_url);
  } catch (error) {
    console.log(error);
    return c.json({ message: 'Server error', error }, 500);
  }
});

app.post('/short', async (c) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, host } = env<{
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    host: string;
  }>(c);
  console.log(SUPABASE_URL);
  console.log(SUPABASE_ANON_KEY);
  try {
    let { url } = await c.req.json();
    //append https:// if it doesn't exist
    if (url.indexOf(':') === -1) {
      url = 'https://' + url;
    }
    const uid = generateRandomUUID();
    const uidExists = await supabaseInit({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY })
      .from('links')
      .select('*')
      .eq('short_code', uid)
      .single();
    if (uidExists.data) {
      return c.json({ message: 'Server error! Try again' }, 500);
    }
    const urlExists = await supabaseInit({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY })
      .from('links')
      .select('*')
      .eq('original_url', url)
      .single();
    if (urlExists.data) {
      return c.json({ message: 'Link already exists', urlExists }, 409);
    }
    const data = {
      original_url: url as string,
      short_code: uid,
      created_at: new Date().toISOString()
    };
    const res = await supabaseInit({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY })
      .from('links')
      .insert(data);
    if (res.error) {
      return c.json(res, 500);
    }
    return c.json({ short_url: host + `/${uid}` }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: 'Server error', error }, 500);
  }
});

export default app;
