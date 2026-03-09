import Root from './toggle-group.svelte';
import Item from './toggle-group-item.svelte';
export { type ToggleGroupSpacing } from './toggle-group.svelte';
export {
  toggleGroupItemVariants,
  type ToggleGroupItemSize,
  type ToggleGroupItemVariant,
  type ToggleGroupItemVariants
} from './toggle-group-item.svelte';

export {
  Root,
  Item,
  //
  Root as ToggleGroup,
  Item as ToggleGroupItem
};
