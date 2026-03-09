import Root from './alert.svelte';
import Description from './alert-description.svelte';
import Title from './alert-title.svelte';
import Callout from './alert-callout.svelte';
export { alertVariants, type AlertVariant } from './alert.svelte';

export {
  Root,
  Description,
  Title,
  Callout,
  //
  Root as Alert,
  Description as AlertDescription,
  Title as AlertTitle
};
