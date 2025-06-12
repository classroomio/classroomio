import { Hono } from 'hono';
import lessonsRouter from './lessons';

const studentsRouter = new Hono();

studentsRouter.route('/lessons', lessonsRouter);

export default studentsRouter;
