import { Hono } from 'hono';

const studentsRouter = new Hono();

studentsRouter.get('/', (c) => c.json({ message: 'Welcome to your API' }));

export default studentsRouter;
