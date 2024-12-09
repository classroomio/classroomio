import { components as CalComponents } from './cal';
import { components as PosthogComponents } from './posthog';

function getComponents() {
  switch (import.meta.env.VITE_TEMPLATE) {
    case 'posthog':
      return PosthogComponents;
    default:
      return CalComponents;
  }
}

export const components = {
  ...getComponents()
};
