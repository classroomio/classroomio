import { Context, Hono } from 'hono';
import { getSupabase } from '$src/utils/supabase';
import { ZOrganizationUpdate } from '$src/public/utils/validations';
import { z } from 'zod';

const organizationsRouter = new Hono();
const supabase = getSupabase();

// Get organization profile
organizationsRouter.get('/', async (c: Context) => {
  try {
    const organization = c.get('organization');

    // Get organization details
    const { data, error } = await supabase
      .from('organization')
      .select('id, name, siteName, avatar_url, created_at')
      .eq('id', organization.id)
      .single();

    if (error || !data) {
      return c.json(
        {
          success: false,
          error: 'Organization not found',
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        404
      );
    }

    return c.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        siteName: data.siteName,
        avatar_url: data.avatar_url,
        created_at: data.created_at
      },
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in GET /organizations:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch organization profile',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

// Update organization profile
organizationsRouter.patch('/', async (c: Context) => {
  try {
    const organization = c.get('organization');
    const updates = await c.req.json();

    // Validate and sanitize updates with Zod schema
    const validatedUpdates = ZOrganizationUpdate.parse(updates);

    // Only proceed if there are valid updates
    if (Object.keys(validatedUpdates).length === 0) {
      return c.json(
        {
          success: false,
          error: 'No valid fields to update',
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        400
      );
    }

    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...validatedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', organization.id)
      .select()
      .single();

    if (error) {
      return c.json(
        {
          success: false,
          error: 'Failed to update organization',
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        500
      );
    }

    return c.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        avatar_url: data.avatar_url,
        updated_at: data.updated_at
      },
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: error.errors,
          meta: {
            version: 'v1',
            timestamp: new Date().toISOString()
          }
        },
        400
      );
    }
    console.error('Error in PATCH /organizations:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update organization profile',
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      },
      500
    );
  }
});

export default organizationsRouter;
