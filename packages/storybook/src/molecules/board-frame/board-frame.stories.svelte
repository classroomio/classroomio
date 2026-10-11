<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { BoardFrame } from '@cio/ui/custom/board-frame';
  import { FIELDS } from './fields';

  const screenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1350" height="830" viewBox="0 0 1350 830"><rect width="1350" height="830" fill="#F4F0E8"/><rect x="60" y="80" width="520" height="70" fill="#0F2FC4"/><rect x="60" y="170" width="520" height="70" fill="#17140F"/><rect x="60" y="260" width="520" height="70" fill="#E3DACA"/><rect x="760" y="0" width="590" height="830" fill="#C9D3E8"/></svg>`;
  const screenshot = `data:image/svg+xml;utf8,${encodeURIComponent(screenshotSvg)}`;
  const tallScreenshot = `data:image/svg+xml;utf8,${encodeURIComponent(screenshotSvg.replace('height="830"', 'height="1100"').replace('viewBox="0 0 1350 830"', 'viewBox="0 0 1350 1100"'))}`;

  const { Story } = defineMeta({
    title: 'Molecules/BoardFrame',
    component: BoardFrame,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default" args={{ src: screenshot, alt: 'Screenshot of the ClassroomIO dashboard' }}>
  {#snippet template(args)}
    <div class="w-160 max-w-full">
      <BoardFrame {...args} />
    </div>
  {/snippet}
</Story>

<Story name="CustomUrl" args={{ src: screenshot, alt: 'Course page', url: 'academy.example.com/courses/onboarding' }}>
  {#snippet template(args)}
    <div class="w-160 max-w-full">
      <BoardFrame {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="LongUrlTruncated"
  args={{
    src: screenshot,
    alt: 'Changelog entry',
    url: 'feedback.classroomio.com/updates/p/set-your-academy-language-bunch-of-exercise-improvements'
  }}
>
  {#snippet template(args)}
    <div class="w-160 max-w-full">
      <BoardFrame {...args} />
    </div>
  {/snippet}
</Story>

<Story name="TallScreenshot" args={{ src: tallScreenshot, alt: 'Tall screenshot' }}>
  {#snippet template(args)}
    <div class="w-160 max-w-full">
      <BoardFrame {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Narrow" args={{ src: screenshot, alt: 'Screenshot in a narrow container' }}>
  {#snippet template(args)}
    <div class="w-72 max-w-full">
      <BoardFrame {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Wide" args={{ src: screenshot, alt: 'Screenshot in a wide container' }}>
  {#snippet template(args)}
    <div class="w-[1100px] max-w-full">
      <BoardFrame {...args} />
    </div>
  {/snippet}
</Story>
