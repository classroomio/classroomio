<script lang="ts">
  import { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from '../../base/button';
  import { Tooltip, Provider, Trigger, Content } from '../../base/tooltip';

  interface Props extends Omit<ButtonProps, 'variant' | 'size'> {
    tooltip?: string;
    tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
    tooltipClass?: string;
    variant?: ButtonVariant;
    size?: Extract<ButtonSize, 'icon' | 'icon-2xs' | 'icon-xs' | 'icon-sm' | 'icon-lg'>;
  }

  let {
    tooltip,
    tooltipSide = 'top',
    tooltipClass = '',
    variant = 'secondary',
    size = 'icon',
    children,
    ...buttonProps
  }: Props = $props();
</script>

{#if tooltip}
  <Provider>
    <Tooltip>
      <Trigger class={tooltipClass}>
        <Button {variant} {size} {...buttonProps}>
          {@render children?.()}
        </Button>
      </Trigger>
      <Content side={tooltipSide}>
        <p>{tooltip}</p>
      </Content>
    </Tooltip>
  </Provider>
{:else}
  <Button {variant} {size} {...buttonProps}>
    {@render children?.()}
  </Button>
{/if}
