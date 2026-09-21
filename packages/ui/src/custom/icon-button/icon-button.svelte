<script lang="ts">
  import { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from '../../base/button';
  import { Tooltip, Provider, Trigger, Content } from '../../base/tooltip';
  import { KbdGroup, Kbd } from '../../base/kbd';

  interface Props extends Omit<ButtonProps, 'variant' | 'size'> {
    tooltip?: string;
    tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
    tooltipClass?: string;
    shortcut?: string[];
    variant?: ButtonVariant;
    size?: Extract<ButtonSize, 'icon' | 'icon-2xs' | 'icon-xs' | 'icon-sm' | 'icon-lg'>;
  }

  let {
    tooltip,
    tooltipSide = 'top',
    tooltipClass = '',
    shortcut,
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
        {#if shortcut?.length}
          <span class="ui:flex ui:items-center ui:gap-2">
            <p>{tooltip}</p>
            <KbdGroup>
              {#each shortcut as key (key)}
                <Kbd>{key}</Kbd>
              {/each}
            </KbdGroup>
          </span>
        {:else}
          <p>{tooltip}</p>
        {/if}
      </Content>
    </Tooltip>
  </Provider>
{:else}
  <Button {variant} {size} {...buttonProps}>
    {@render children?.()}
  </Button>
{/if}
