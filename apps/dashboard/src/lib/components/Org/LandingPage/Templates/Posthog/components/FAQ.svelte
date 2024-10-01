<script>
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import FaqCard from './FaqCard.svelte';

  // FAQ data with questions and answers
  const faqs = [
    {
      title: 'What is Svelte?',
      content: 'Svelte is a front-end framework for building web applications.'
    },
    {
      title: 'How do I install Svelte?',
      content: 'You can install Svelte via npm using the command: npm create svelte@latest.'
    },
    {
      title: 'What is the difference between Svelte and React?',
      content:
        'Svelte compiles components at build time, while React uses virtual DOM diffing at runtime.'
    },
    {
      title: 'What is the difference between Svelte and React?',
      content:
        'Svelte compiles components at build time, while React uses virtual DOM diffing at runtime.'
    },
    {
      title: 'What is the difference between Svelte and React?',
      content:
        'Svelte compiles components at build time, while React uses virtual DOM diffing at runtime.'
    }
  ];

  const generateColors = () => {
    const colors = [
      { background: '#FFD89E', iconColor: '#EF4444' },
      { background: '#FDBAF2', iconColor: '#3B82F6' }
    ];
    return colors[0];
  };

  const { background, iconColor } = generateColors();
</script>

<!-- FAQ Cards -->
{#if $landingPageSettings.faq.show}
  <div>
    <h1 class="text-center text-5xl mb-8">{$landingPageSettings.faq.title}</h1>

    <div class="flex flex-wrap gap-6 items-start justify-start cursor-pointer py-4 px-4">
      {#each $landingPageSettings.faq.questions as faq, index}
        <FaqCard {index} {faq} {background} {iconColor} />
      {/each}
    </div>
  </div>
{/if}
