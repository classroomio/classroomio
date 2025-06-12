import { Hono } from 'hono';
import coursesRouter from './routes/courses';
import lessonsRouter from './routes/lessons';
import organizationsRouter from './routes/organizations';
// import profilesRouter from './routes/profiles';
import studentsRouter from './routes/students';
import { authMiddleware } from './middleware/auth';

const v1Router = new Hono();

// Apply auth middleware to all routes
v1Router.use('*', authMiddleware);

// Mount resource routers
v1Router.route('/organizations', organizationsRouter);
v1Router.route('/courses', coursesRouter);
v1Router.route('/lessons', lessonsRouter);
v1Router.route('/students', studentsRouter);
// v1Router.route('/profiles', profilesRouter);

export default v1Router;
