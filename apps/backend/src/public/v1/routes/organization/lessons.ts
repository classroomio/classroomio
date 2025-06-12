import { Context, Hono } from 'hono';
import { validateUUID } from '../../middleware/auth';
import { getLesson, toggleLessonLock, updateLesson } from '../../service/course-service';

const lessonsRouter = new Hono();

lessonsRouter.get('/lessons/:lessonId', validateUUID('lessonId'), async (c:Context) => {
    try {
      const { lessonId } = c.req.valid('param' as unknown as never) as {lessonId:string};
      const organization = c.get('organization' )
      
      const lesson = await getLesson(lessonId, organization.id);
      if (!lesson) {
        return c.json({ error: 'Lesson not found' }, 404);
      }
      
      return c.json({
        success: true,
        data: lesson
      });
    } catch (error) {
      console.error('Error in GET /lessons/:lessonId:', error);
      return c.json({ error: 'Failed to fetch lesson' }, 500);
    }
  });
  
  lessonsRouter.patch('/lessons/:lessonId', validateUUID('lessonId'), async (c:Context) => {
    try {
      const { lessonId } = c.req.valid('param' as unknown as never) as {lessonId:string};
      const organization = c.get('organization');
      const updates = await c.req.json();
      
      // Validate allowed fields
      const allowedFields = ['title', 'content', 'video_url', 'duration', 'is_locked', 'published'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);
      
      const lesson = await updateLesson(lessonId, organization.id, filteredUpdates);
      if (!lesson) {
        return c.json({ error: 'Lesson not found' }, 404);
      }
      
      return c.json({
        success: true,
        data: lesson
      });
    } catch (error) {
      console.error('Error in PATCH /lessons/:lessonId:', error);
      return c.json({ error: 'Failed to update lesson' }, 500);
    }
  });
  
  // Lesson lock/unlock endpoints
  lessonsRouter.post('/lessons/:lessonId/lock', validateUUID('lessonId'), async (c:Context) => {
    const lock = c.req.query('lock');
    try {
      const { lessonId } = c.req.valid('param' as unknown as never) as {lessonId:string};
      const organization = c.get('organization');
      
      const success = await toggleLessonLock(lessonId, organization.id, lock === 'true');
      if (!success) {
        return c.json({ error: 'Lesson not found' }, 404);
      }
      const message = lock === 'true' ? 'Lesson locked successfully' : 'Lesson unlocked successfully';
      return c.json({
        success: true,
        message: message
      });
    } catch (error) {
      console.error('Error in POST /lessons/:lessonId/lock:', error);
      return c.json({ error: `Failed to ${lock === 'true' ? 'lock' : 'unlock'} lesson` }, 500);
    }
  });
  
//   lessonsRouter.post('/lessons/:lessonId/unlock', validateUUID('lessonId'), async (c:Context) => {
//     try {
//       const { lessonId } = c.req.valid('param' as unknown as never) as {lessonId:string};
//       const organization = c.get('organization');
      
//       const success = await toggleLessonLock(lessonId, organization.id, false);
//       if (!success) {
//         return c.json({ error: 'Lesson not found' }, 404);
//       }
      
//       return c.json({
//         success: true,
//         message: 'Lesson unlocked successfully'
//       });
//     } catch (error) {
//       console.error('Error in POST /lessons/:lessonId/unlock:', error);
//       return c.json({ error: 'Failed to unlock lesson' }, 500);
//     }
//   });

export default lessonsRouter;
