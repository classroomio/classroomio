import { Hono } from 'hono';
import v1App from '../tests/services/v1';

const app = new Hono();

app.route('/v1', v1App);

export default app;
