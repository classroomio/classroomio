import { Context, Hono } from 'hono';
import { getSupabase } from '$src/utils/supabase';
import { ZOrganizationUpdate } from '$src/public/utils/validations';
import { z } from 'zod';
import { updateOrganization, getOrganization } from '$src/public/v1/service/org-services';

const organizationsRouter = new Hono();

// Get organization profile
organizationsRouter.get('/', async (c: Context) => {
  try {
    const organization = c.get('organization');

    // Get organization details
    const organizationDetails = await getOrganization(organization.id);

    if (!organizationDetails) {
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
        id: organizationDetails.id,
        name: organizationDetails.name,
        siteName: organizationDetails.siteName,
        avatar_url: organizationDetails.avatar_url,
        landingpage: organizationDetails.landingpage,
        created_at: organizationDetails.created_at
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

    const validatedUpdates = ZOrganizationUpdate.parse(updates);

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

    const updatedOrganization = await updateOrganization(organization.id, validatedUpdates);
    if (!updatedOrganization) {
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
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        siteName: updatedOrganization.siteName,
        avatar_url: updatedOrganization.avatar_url,
        landingpage: updatedOrganization.landingpage,
        created_at: updatedOrganization.created_at,
        updated_at: updatedOrganization.updated_at
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
