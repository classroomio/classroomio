import { components as CalComponents } from './cal';
import { components as PosthogComponents } from './posthog';
import { components as ClassicComponents } from './classic';
import { components as MinimalComponents } from './minimal';
import { components as IeltsComponents } from './ielts';
import { components as WebflowComponents } from './webflow';

function getComponents() {
  switch (import.meta.env.VITE_TEMPLATE) {
    case 'posthog':
      return PosthogComponents;
    case 'classic':
      return ClassicComponents;
    case 'minimal':
      return MinimalComponents;
    case 'ielts':
      return IeltsComponents;
    case 'webflow':
      return WebflowComponents;
    default:
      return CalComponents;
  }
}

export const components = {
  ...getComponents()
};
