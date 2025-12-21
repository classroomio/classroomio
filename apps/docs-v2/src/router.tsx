import { NotFound } from '@/components/not-found';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createTanStackRouter({
    basepath: '/docs',
    defaultNotFoundComponent: NotFound,
    defaultPreload: 'intent',
    routeTree,
    scrollRestoration: true
  });
}
