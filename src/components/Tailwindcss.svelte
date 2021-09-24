<style global lang="scss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  /** Global scrollbar styles */
  html {
    --scrollbarBG: #fff;
    --thumbBG: #ccc;
  }
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--thumbBG) var(--scrollbarBG);
  }

  *::-webkit-scrollbar {
    width: 10px;
  }

  *::-webkit-scrollbar-track {
    background: var(--scrollbarBG);
  }

  *::-webkit-scrollbar-thumb {
    background-color: var(--thumbBG);
    border-radius: 10px;
    border: 2px solid var(--scrollbarBG);
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: revert;
    font-weight: revert;
    margin: 0.8em 0;
  }

  .prose {
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 0px !important;
      margin-bottom: 16px !important;
      font-weight: 600 !important;
      line-height: 1.25 !important;
    }
  }

  code {
    white-space: pre-wrap;
  }

  [aria-current] :global(svg.carbon-icon),
  .active :global(svg.carbon-icon) {
    fill: var(--main-primary-color);
  }

  .prose a {
    color: var(--main-primary-color);
  }

  .success :global(svg.carbon-icon) {
    fill: green;
  }
</style>
