<script>
  import Icon from "svelte-awesome/components/Icon.svelte";
  import { faTelegram } from "@fortawesome/free-brands-svg-icons";
  import { faEnvelope } from "@fortawesome/free-regular-svg-icons";

  export let avatarUrl =
    "https://tailwindcss.com/_next/static/media/sarah-dayan.a8ff3f1095a58085a82e3bb6aab12eb2.jpg";
  export let name = "Sarah Dayan";
  export let title = "Staff Engineer, Algolia";
  export let mailLink;
  export let telegramLink;
</script>

<style>
  .profile {
    width: 200px;
  }

  .profile img {
    width: 104px;
    height: 104px;
  }
  .description {
    min-height: 70px;
  }
</style>

<figure class="profile bg-gray-100 rounded-xl px-4 py-7 mr-4 mb-4">
  <img
    class="w-32 h-32 rounded-full mx-auto"
    src={avatarUrl}
    alt=""
    width="384"
    height="512" />
  <div class="pt-6 text-center space-y-4">
    <div class="description font-medium flex flex-col justify-around">
      <div class="text-cyan-600">{name}</div>
      <div class="text-gray-500">{title}</div>
    </div>
  </div>
  {#if telegramLink && mailLink}
    <div class="flex justify-center">
      <a href={telegramLink} target="_blank">
        <Icon
          data={faTelegram}
          scale="1"
          class="social-icon"
          style="color:#4dabf7;margin:0 5px;" />
      </a>
      <a href={mailLink} target="_blank">
        <Icon
          data={faEnvelope}
          scale="1"
          class="social-icon"
          style="color:#d44c3d;margin:0 5px;" />
      </a>
    </div>
  {/if}
</figure>
