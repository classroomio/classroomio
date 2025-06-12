import { getSupabase } from '$src/utils/supabase';
import { User } from '@supabase/supabase-js';
import { validator } from 'hono/validator';

const supabase = getSupabase();

 export async function validateApiKey(apiKey: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, api_key')
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

   export async function validateJWT(token: string): Promise<{ user: User; organization: Organization } | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return null;
      }

      // Get user's organization
      const { data: orgData, error: orgError } = await supabase
        .from('user_organizations')
        .select(`
          organization_id,
          role,
          organizations (id, name, slug)
        `)
        .eq('user_id', user.id)
        .single();

      if (orgError || !orgData) {
        return null;
      }

      return {
        user,
        organization: orgData.organizations as unknown as Organization
      };
    } catch (error) {
      console.error('Error validating JWT:', error);
      return null;
    }
  }


  export const authMiddleware = async (c: any, next: any) => {
    const apiKey = c.req.header('X-API-Key');
    const authHeader = c.req.header('Authorization');
    
    let organization: Organization | null = null;
    let user: User | null = null;
  
    if (apiKey) {
      // API Key authentication
      organization = await validateApiKey(apiKey);
      if (!organization) {
        return c.json({ error: 'Invalid API key' }, 401);
      }
    } else if (authHeader?.startsWith('Bearer ')) {
      // JWT authentication
      const token = authHeader.substring(7);
      const authResult = await validateJWT(token);
      if (!authResult) {
        return c.json({ error: 'Invalid or expired token' }, 401);
      }
      organization = authResult.organization;
      user = authResult.user;
    } else {
      return c.json({ error: 'Authentication required' }, 401);
    }
  
    c.set('organization', organization);
    c.set('user', user);
    await next();
  };
  
  // Validation middleware
  export const validateUUID = (paramName: string) => validator('param', (value, c) => {
    const uuid = value[paramName];
    if (!uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
      return c.text(`Invalid ${paramName} format`, 400);
    }
    return { [paramName]: uuid };
  });


