import { getSupabase } from '$src/utils/supabase';
import { validator } from 'hono/validator';

const supabase = getSupabase();

export async function validateApiKey(apiKey: string): Promise<Organization | null> {
  try {
    // const data = {
    //   id: '1',
    //   name: 'Test Organization',
    //   slug: 'test-organization',
    //   api_key: 'test-api-key'
    // };

    const { data, error } = await supabase
      .from('organization')
      .select('id, name, siteName, api_key')
      .eq('api_key', apiKey)
      .single();

    if (error || !data) {
      return null;
    }

    return data as unknown as Organization;
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

export const authMiddleware = async (c: any, next: any) => {
  const apiKey = c.req.header('X-API-Key');

  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401);
  }

  const organization = await validateApiKey(apiKey);
  if (!organization) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  c.set('organization', organization);
  await next();
};

// UUID validation middleware
export const validateUUIDs = (paramNames: string[]) =>
  validator('param', (value, c) => {
    const result: Record<string, string> = {};

    for (const paramName of paramNames) {
      const uuid = value[paramName];
      if (!uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
        return c.text(`Invalid ${paramName} format`, 400);
      }
      result[paramName] = uuid;
    }

    return result;
  });
