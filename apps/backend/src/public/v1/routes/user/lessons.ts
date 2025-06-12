import { Hono } from 'hono';

const lessonsRouter = new Hono();

lessonsRouter.get('/', (c) => c.json({ message: 'Welcome to your API' }));

export default lessonsRouter;
