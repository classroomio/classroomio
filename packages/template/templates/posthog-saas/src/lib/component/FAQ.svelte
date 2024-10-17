<script>
  import FaqCard from './FaqCard.svelte';

  export let data;
  // FAQ data with questions and answers
  const faqs = [
    {
      title: 'What is Svelte?',
      content: 'Svelte is a front-end framework for building web applications.',
      background: 'bg-[#FDBAF2]',
      iconColor: 'bg-[#3B82F6]'
    },
    {
      title: 'How do I install Svelte?',
      content: 'You can install Svelte via npm using the command: npm create svelte@latest.',
      background: 'bg-[#FDBAF2]',
      iconColor: 'bg-[#3B82F6]'
    },
    {
      title: 'What is the difference between Svelte and React?',
      content:
        'Svelte compiles components at build time, while React uses virtual DOM diffing at runtime.',
      background: 'bg-[#FDBAF2]',
      iconColor: 'bg-[#3B82F6]'
    },
    {
      title: 'What is the difference between Svelte and React?',
      content:
        'Svelte compiles components at build time, while React uses virtual DOM diffing at runtime.',
      background: 'bg-[#FDBAF2]',
      iconColor: 'bg-[#3B82F6]'
    },
    {
      title: 'What is the difference between Svelte and React?',
      content:
        'Svelte compiles components at build time, while React uses virtual DOM diffing at runtime.',
      background: 'bg-[#FDBAF2]',
      iconColor: 'bg-[#3B82F6]'
    }
  ];
</script>

<!-- FAQ Cards -->
{#if data.faq.show}
  <div id="faq">
    <h1 class="text-center text-3xl mb-8 font-bold">{data.faq.title}</h1>

    <div
      class="flex flex-wrap gap-6 justify-center items-start md:justify-start cursor-pointer py-4 px-4 w-fit mx-auto"
    >
      {#each data.faq.questions as faq, index}
        <FaqCard {index} {faq} />
      {/each}
    </div>
  </div>
{/if}
