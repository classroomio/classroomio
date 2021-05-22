<script>
  import marked from "marked";
  import PageNav from "../PageNav/index.svelte";

  const readme = `
# Introduction
 Welcome to this course, we are glad you made it here

 ## What you'l learn

      1. Build powerful, fast, user-friendly and reactive web apps.
      2. Provide amazing user experiences by leveraging the power of JavaScript with ease.
      3. Apply for high-paid jobs or work as a freelancer in one the most-demanded sectors you can find in web dev right now.
      4. Learn all about React Hooks and React Components.
`;
</script>

<PageNav title="Overview" disableSticky={true} />

<div class="body">
  {@html marked(readme, { breaks: true, gfm: true })}
</div>
