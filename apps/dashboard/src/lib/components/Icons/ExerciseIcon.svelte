<script lang="ts">
  interface Props {
    color?: string;
  }

  let { color = 'currentColor' }: Props = $props();
</script>

<svg
  width="25"
  height="24"
  viewBox="0 0 25 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class="dark"
>
  <path
    d="M16.9999 2H8.99991C8.46948 2 7.96077 2.21071 7.58569 2.58579C7.21062 2.96086 6.99991 3.46957 6.99991 4V20C6.99991 20.5304 7.21062 21.0391 7.58569 21.4142C7.96077 21.7893 8.46948 22 8.99991 22H20.9999C21.5303 22 22.039 21.7893 22.4141 21.4142C22.7892 21.0391 22.9999 20.5304 22.9999 20V8L16.9999 2Z"
    stroke={color}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M16.9999 2V8H22.9999"
    stroke={color}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M18.9999 13H10.9999"
    stroke={color}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M18.9999 17H10.9999"
    stroke={color}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M12.9999 9H11.9999H10.9999"
    stroke={color}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
