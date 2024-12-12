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
  class="border bg-[#192533] text-white border-[#D7D7D7] px-4 py-6 space-y-4 rounded h-full w-full max-w-[350px] md:max-w-[300px]"
>
  <div class="flex items-center gap-2">
    <img src={seo?.settings.logo} alt="" class="w-12 h-12 rounded-full" />
    <span>
      <p class="text-sm font-bold">{name}</p>
      <p class="text-xs text-white">{role}</p>
    </span>
  </div>
  <p class="text-white text-justify line-clamp-5">
    {description}
  </p>
</section>
