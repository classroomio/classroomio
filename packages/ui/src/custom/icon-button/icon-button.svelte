<script lang="ts">
  import { Button, type ButtonProps } from '../../base/button';
  import { Tooltip, Provider, Trigger, Content } from '../../base/tooltip';

  interface Props extends Omit<ButtonProps, 'variant' | 'size'> {
    tooltip?: string;
    tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  }

  let { tooltip, tooltipSide = 'top', children, ...buttonProps }: Props = $props();
</script>

{#if tooltip}
  <Provider>
    <Tooltip>
      <Trigger>
        <Button variant="secondary" size="icon" {...buttonProps}>
          {@render children?.()}
        </Button>
      </Trigger>
      <Content side={tooltipSide}>
        <p>{tooltip}</p>
      </Content>
    </Tooltip>
  </Provider>
{:else}
  <Button variant="secondary" size="icon" {...buttonProps}>
    {@render children?.()}
  </Button>
{/if}
