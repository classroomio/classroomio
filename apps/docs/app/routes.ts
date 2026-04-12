import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('api/reference', 'routes/api-reference.ts'),
  route('api/search', 'routes/search.ts'),
  route('*', 'routes/docs.tsx')
] satisfies RouteConfig;
