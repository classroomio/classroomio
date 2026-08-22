<script lang="ts">
  interface Props {
    label: string;
    onclick: () => void;
    class?: string;
  }

  let { label, onclick, class: className = '' }: Props = $props();
</script>

<button
  type="button"
  {onclick}
  tabindex="-1"
  class="ui:group/rail ui:absolute ui:inset-y-0 ui:left-0 ui:flex ui:w-4 ui:cursor-pointer ui:justify-center {className}"
>
  <span
    aria-hidden="true"
    class="ui:h-full ui:w-px ui:bg-border/60 ui:transition-colors ui:group-hover/rail:bg-primary/60"
  ></span>
  <span class="ui:sr-only">{label}</span>
</button>
