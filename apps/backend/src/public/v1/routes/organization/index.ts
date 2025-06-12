import { Hono } from 'hono';
import coursesRouter from './courses';
import profileRouter from './profile';

const organizationRouter = new Hono();

organizationRouter.route('/courses', coursesRouter);
organizationRouter.route('/profile', profileRouter);

export default organizationRouter;
