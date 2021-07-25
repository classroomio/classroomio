import dotenv from 'dotenv';

import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';

import { getConfig } from './config';

const config = getConfig(dotenv.config().parsed);

polka() // You can also use Express
  .use(
    compression({ threshold: 0 }),
    sirv('static', { dev: true }),
    sapper.middleware()
  )
  .listen(config.port, (err) => {
    if (err) console.log('error', err);
  });
