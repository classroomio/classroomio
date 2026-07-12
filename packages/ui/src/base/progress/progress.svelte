<script lang="ts" module>
  import { type VariantProps, tv } from 'tailwind-variants';

  export const progressVariants = tv({
    slots: {
      root: 'ui:relative ui:h-2 ui:w-full ui:overflow-hidden ui:rounded-md',
      indicator: 'ui:h-full ui:w-full ui:flex-1 ui:transition-all'
    },
    variants: {
      variant: {
        default: { root: 'ui:bg-primary/20', indicator: 'ui:bg-primary' },
        muted: { root: 'ui:bg-muted', indicator: 'ui:bg-muted-foreground/40' }
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  });

  export type ProgressVariant = VariantProps<typeof progressVariants>['variant'];
</script>

<script lang="ts">
  import { Progress as ProgressPrimitive } from 'bits-ui';
  import { cn, type WithoutChildrenOrChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    variant = 'default',
    max = 100,
    value,
    ...restProps
  }: WithoutChildrenOrChild<ProgressPrimitive.RootProps> & { variant?: ProgressVariant } = $props();

  const styles = $derived(progressVariants({ variant }));
</script>

<ProgressPrimitive.Root bind:ref data-slot="progress" class={cn(styles.root(), className)} {value} {max} {...restProps}>
  <div
    data-slot="progress-indicator"
    class={styles.indicator()}
    style="transform: translateX(-{100 - (100 * (value ?? 0)) / (max ?? 1)}%)"
  ></div>
</ProgressPrimitive.Root>
