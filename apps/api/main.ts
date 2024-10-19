import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('ClassroomIO API with Deno 😎!'));

Deno.serve({ port: 8787 }, app.fetch);
