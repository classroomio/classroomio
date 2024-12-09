import { components as CalComponents } from './cal';
import { components as PosthogComponents } from './posthog';
import { components as ClassicComponents } from './classic';
import { components as MinimalComponents } from './minimal';

function getComponents() {
  switch (import.meta.env.VITE_TEMPLATE) {
    case 'posthog':
      return PosthogComponents;
    case 'classic':
      return ClassicComponents;
    case 'minimal':
      return MinimalComponents;
    default:
      return CalComponents;
  }
}

export const components = {
  ...getComponents()
};
