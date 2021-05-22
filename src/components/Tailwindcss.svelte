<style global lang="scss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

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
</style>
