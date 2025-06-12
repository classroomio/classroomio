import { Context, Hono } from 'hono';
import { getSupabase } from '$src/utils/supabase';

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

    // Only allow updating certain fields
    const allowedUpdates = ['name', 'avatar_url'];
    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedUpdates.includes(key))
      .reduce(
        (obj, key) => {
          obj[key] = updates[key];
          return obj;
        },
        {} as Record<string, any>
      );

    if (Object.keys(filteredUpdates).length === 0) {
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
        ...filteredUpdates,
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
