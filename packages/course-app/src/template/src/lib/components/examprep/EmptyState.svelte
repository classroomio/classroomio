<script lang="ts">
  import emptyBanner from './assets/expert-empty.svg';
  interface Props {
    className?: string;
    headerClassName?: string;
    subtitleClassName?: string;
  }

  let { className = '', headerClassName = '', subtitleClassName = '' }: Props = $props();
</script>

<section
  class="{className} my-2 flex w-full items-center justify-center rounded-md border p-2 py-4"
>
  <div
    class="flex flex-col items-center justify-center gap-6 p-2 text-center md:flex-row md:text-start"
  >
    <img src={emptyBanner} alt="empty" />
    <div>
      <h3 class="font-semibold {headerClassName}">"No Course yet"</h3>
      <p class="text-sm md:text-base {subtitleClassName}">
        Looks like courses have not been added yet.<br /> Kindly check back later
      </p>
    </div>
  </div>
</section>
