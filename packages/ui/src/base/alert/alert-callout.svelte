<script lang="ts">
  import Root from './alert.svelte';
  import Title from './alert-title.svelte';
  import Description from './alert-description.svelte';
  import type { AlertVariant } from './alert.svelte';
  import InfoIcon from '@lucide/svelte/icons/info';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import { cn } from '../../tools';

  const variantIcons = {
    default: InfoIcon,
    destructive: AlertCircleIcon,
    warning: AlertTriangleIcon,
    information: InfoIcon
  } as const;

  type Props = {
    variant?: AlertVariant;
    title: string;
    description: string;
    class?: string;
  };

  let { variant = 'default', title, description, class: className }: Props = $props();

  const IconComponent = $derived(variantIcons[variant]);
</script>

<Root {variant} class={cn(className)}>
  <IconComponent />
  <Title>{title}</Title>
  <Description>{description}</Description>
</Root>
