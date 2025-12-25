<script lang="ts">
  import { Button } from '@cio/ui/base/button';

  interface Props {
    header?: string;
    subText?: string;
    btnLabel?: string;
    link?: string;
    demo?: boolean;
  }

  let { header = '', subText = '', btnLabel = '', link = '', demo = true }: Props = $props();
</script>

<div
  class="floating grad relative mx-auto my-5 flex h-[61vh] w-full max-w-4xl flex-col items-center justify-center space-y-8 px-6 py-12 text-center shadow-2xl lg:h-[50vh] lg:w-[70%] lg:rounded-3xl"
>
  <div>
    <h3 class="font-display mt-3 max-w-2xl text-xl tracking-tight text-white lg:mt-2 lg:text-4xl">
      {header}
    </h3>
    <p class="text-md mt-6 text-gray-300">
      {subText}
    </p>
  </div>

  {#if demo}
    <Button variant="ghost" data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo" class="bg-white!">
      {btnLabel}
    </Button>
  {:else}
    <Button
      href={link}
      variant="link"
      target="_blank"
      class="ui:bg-secondary ui:text-secondary-foreground"
      rel="noopener noreferrer nofollow"
    >
      {btnLabel}
    </Button>
  {/if}
</div>

<style>
  .grad {
    /* background: rgb(2, 51, 189);
    background: radial-gradient(circle at 50% 100%, rgba(2, 51, 189, 1) 1%, rgb(4, 2, 56) 100%); */
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
    background-image: url('https://brand.cdn.clsrio.com/cta-bg.png');
  }
</style>
