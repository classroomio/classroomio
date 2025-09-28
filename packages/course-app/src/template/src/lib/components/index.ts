import { components as BootcampComponents, utils as BootcampUtils } from './bootcamp';
import { components as CalComponents, utils as CalUtils } from './cal';
import { components as ClassicComponents, utils as ClassicUtils } from './classic';
import { components as ExamprepComponents, utils as ExamprepUtils } from './examprep';
import { components as MinimalComponents, utils as MinimalUtils } from './minimal';
import { components as PosthogComponents, utils as PosthogUtils } from './posthog';
import { components as WebflowComponents, utils as WebflowUtils } from './webflow';

function getComponents() {
  switch (import.meta.env.VITE_TEMPLATE) {
    case 'posthog':
      return PosthogComponents;
    case 'classic':
      return ClassicComponents;
    case 'minimal':
      return MinimalComponents;
    case 'examprep':
      return ExamprepComponents;
    case 'webflow':
      return WebflowComponents;
    case 'bootcamp':
      return BootcampComponents;
    default:
      return CalComponents;
  }
}

export const components = getComponents();

function getUtils() {
  switch (import.meta.env.VITE_TEMPLATE) {
    case 'posthog':
      return PosthogUtils;
    case 'classic':
      return ClassicUtils;
    case 'minimal':
      return MinimalUtils;
    case 'examprep':
      return ExamprepUtils;
    case 'webflow':
      return WebflowUtils;
    case 'bootcamp':
      return BootcampUtils;
    default:
      return CalUtils;
  }
}

export const utils = getUtils();
