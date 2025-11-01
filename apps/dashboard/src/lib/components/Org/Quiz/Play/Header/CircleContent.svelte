<script lang="ts">
  import { slide } from 'svelte/transition';

  interface Props {
    value?: boolean;
    label?: string;
    className?: string;
  }

  let { value = false, label = '', className = '' }: Props = $props();

  function fadeSlide(node, options) {
    const slideTrans = slide(node, options);
    return {
      duration: options.duration,
      css: (t) => `
				${slideTrans.css(t)}
				opacity: ${t};
			`
    };
  }
</script>

<div class="circle flex flex-col items-center justify-center {className}">
  {#key value}
    <h3 class="text-primary-600" transition:fadeSlide={{ duration: 500 }}>
      {value}
    </h3>
  {/key}
  <p class="text-primary-600 text-md">{label}</p>
</div>

<style>
  .circle {
    width: 100px;
    height: 100px;
    line-height: 100px;
    border-radius: 50%;
    font-size: 50px;
    text-align: center;
    background: #fff;
  }
  .circle h3 {
    font-size: 40px;
    margin: 0;
    padding: 0;
    line-height: 1;
  }
</style>
