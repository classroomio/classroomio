<script lang="ts">
  import { getPageSection } from '@/utils/helpers/page';
  import { sharedPage } from '@/utils/stores/pages';

  interface Props {
    name?: string;
    description?: string;
    role?: string;
  }

  let { name = '', description = '', role = '' }: Props = $props();
  const seo = $derived(getPageSection($sharedPage, 'seo'));
</script>

<section
  class="h-full w-full max-w-[350px] space-y-4 rounded border border-[#D7D7D7] bg-[#192533] px-4 py-6 text-white md:max-w-[300px]"
>
  <div class="flex items-center gap-2">
    <img src={seo?.settings.logo} alt="" class="h-12 w-12 rounded-full bg-white" />
    <span>
      <p class="text-sm font-bold">{name}</p>
      <p class="text-xs text-white">{role}</p>
    </span>
  </div>
  <p class="line-clamp-5 text-justify text-white">
    {description}
  </p>
</section>
