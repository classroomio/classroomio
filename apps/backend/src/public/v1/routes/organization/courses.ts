import { Context, Hono } from 'hono';
import { getCourse, getCourses, grantCourseAccess } from '../../service/course-service';
import { validateUUID } from '../../middleware/auth';

const coursesRouter = new Hono();


coursesRouter.get('/courses', async (c:Context) => {
    try {
      const organization = c.get('organization');
      const courses = await getCourses(organization.id);
      
      return c.json({
        success: true,
        data: courses,
        meta: {
          total: courses.length,
          version: 'v1'
        }
      });
    } catch (error) {
      console.error('Error in GET /courses:', error);
      return c.json({ error: 'Failed to fetch courses' }, 500);
    }
  });

  coursesRouter.get('/courses/:id', validateUUID('id'), async (c:Context) => {
    const { id } = c.req.valid('param' as unknown as never) as { id: string };
    const organization = c.get('organization');
    const course = await getCourse(organization.id, id);
    return c.json({
      success: true,
      data: course
    });
  });

  coursesRouter.post('/courses/:courseId/access', validateUUID('courseId'), async (c:Context) => {
    try {
      const { courseId } = c.req.valid('param' as unknown as never) as { courseId: string };    
      const organization = c.get('organization');
      const body = await c.req.json();
      
      if (!body.user_id) {
        return c.json({ error: 'user_id is required' }, 400);
      }
      
      const success = await grantCourseAccess(courseId, body.user_id, organization.id);
      if (!success) {
        return c.json({ error: 'Failed to grant access or course not found' }, 400);
      }
      
      return c.json({
        success: true,
        message: 'Course access granted successfully'
      });
    } catch (error) {
      console.error('Error in POST /courses/:courseId/access:', error);
      return c.json({ error: 'Failed to grant course access' }, 500);
    }
  });
  
export default coursesRouter;
