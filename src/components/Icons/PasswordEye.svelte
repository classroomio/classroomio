<script>
  export let isClosed = true;
</script>

{#if isClosed}
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="dark"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M2.6 11.3L3.3 10.6C2.6 9.8 1.9 9 1.5 8C2.5 5.5 5.3 3.5 8 3.5C8.7 3.5 9.4 3.6 10 3.9L10.8 3.1C9.9 2.7 9 2.5 8 2.5C4.7 2.6 1.7 4.7 0.5 7.8V8.1C1 9.3 1.7 10.4 2.6 11.3ZM12.6 4.1C13.9 5 14.9 6.3 15.5 7.8V8.2C14.3 11.3 11.3 13.4 8 13.5C6.7 13.4 5.4 13.1 4.3 12.4L1.7 15L1 14.3L14.3 1L15 1.7L12.6 4.1ZM7.8 6.1C6.9 6.1 6.1 6.9 6 7.9L5.1 8.8C5 8.3 5 7.7 5.1 7.2C5.5 5.6 7.2 4.7 8.7 5.2L7.8 6.1ZM10 8C10 9.1 9.1 10 8 10C7.7 10 7.3 9.9 7 9.7L9.7 7C9.9 7.3 10 7.6 10 8ZM5 11.7C5.9 12.2 7 12.5 8 12.5C10.6 12.5 13.4 10.5 14.5 8C13.9 6.7 13 5.6 11.9 4.8L10.5 6.2C11.2 7.2 11.2 8.6 10.5 9.6C9.5 11 7.7 11.3 6.3 10.4L5 11.7Z"
      fill="#ADADAD"
    />
  </svg>
{:else}
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="dark"
  >
    <path
      d="M0.666748 8.00008C0.666748 8.00008 3.33341 2.66675 8.00008 2.66675C12.6667 2.66675 15.3334 8.00008 15.3334 8.00008C15.3334 8.00008 12.6667 13.3334 8.00008 13.3334C3.33341 13.3334 0.666748 8.00008 0.666748 8.00008Z"
      stroke="#ADADAD"
      stroke-width="1.33333"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
      stroke="#ADADAD"
      stroke-width="1.33333"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{/if}
