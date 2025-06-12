import { Hono } from 'hono';

const profileRouter = new Hono();

profileRouter.get('/', (c) => c.json({ message: 'Welcome to your API' }));

export default profileRouter;
