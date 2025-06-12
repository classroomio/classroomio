import { Hono } from 'hono';
import organizationRouter from './routes/organization';
import studentsRouter from './routes/user/students';
import { authMiddleware } from './middleware/auth';

const v1Router = new Hono();

v1Router.use('*', authMiddleware);

v1Router.route('/org', organizationRouter);
v1Router.route('/user', studentsRouter);
export default v1Router;


