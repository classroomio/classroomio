<script>
  import userAvatar from './assets/bootcamp-user.png';

  let { profileImage, title, role, description, index } = $props();
</script>

<div
  class={`flex items-center gap-4 overflow-hidden p-4 ${
    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
  }`}
>
  <!-- Profile Image -->
  <div class="hidden h-32 w-32 overflow-hidden rounded-full md:block">
    <img
      src={profileImage || userAvatar}
      alt="Profile"
      class="h-full w-full border-2 border-gray-300 object-cover"
    />
  </div>

  <!-- Card Content -->
  <div
    class={`font-roboto bubble-card relative h-[150px] max-h-[200px] flex-1 rounded-lg border border-gray-300 bg-white p-4 shadow-lg ${
      index % 2 === 0 ? 'left-pointer md:ml-4' : 'right-pointer md:mr-4'
    }`}
  >
    <div class="flex items-center gap-2">
      <div class="h-10 w-10 overflow-hidden rounded-full md:hidden">
        <img
          src={profileImage || userAvatar}
          alt="Profile"
          class="h-full w-full border-2 border-gray-300 object-cover"
        />
      </div>
      <div class="mb-2">
        <p class="line-clamp-1 text-lg font-bold text-green-600">{title}</p>
        <p class="line-clamp-1 font-semibold text-gray-500">{role}</p>
      </div>
    </div>
    <p class="line-clamp-3 text-sm text-gray-600">{description}</p>
  </div>
</div>

<style>
  /* Card content */
  .bubble-card {
    position: relative;
  }

  /* Shadow effect using ::after for pointer */
  .bubble-card::after {
    content: '';
    position: absolute;
    top: 39%;
    width: 32px;
    height: 42px;
    background-color: rgba(0, 0, 0, 0.2);
    clip-path: polygon(0 50%, 100% 0, 100% 100%);
    z-index: 1;
    filter: blur(6px);
  }

  /* Pointer for the card */
  .bubble-card::before {
    content: '';
    position: absolute;
    top: 40%;
    width: 30px;
    height: 40px;
    z-index: 2;
    background-color: white;
    clip-path: polygon(0 50%, 100% 0, 100% 100%);
  }

  /* Pointer for cards where the image is on the left (even index) */
  .left-pointer::after {
    left: -32px; /* Pointer shadow on the left */
  }

  .left-pointer::before {
    left: -30px; /* Pointer on the left */
  }

  /* Pointer for cards where the image is on the right (odd index) */
  .right-pointer::after {
    right: -32px; /* Pointer shadow on the right */
    clip-path: polygon(100% 50%, 0 0, 0 100%); /* Flipped pointer */
  }

  .right-pointer::before {
    right: -30px; /* Pointer on the right */
    clip-path: polygon(100% 50%, 0 0, 0 100%); /* Flipped pointer */
  }
  @media (max-width: 640px) {
    /* Adjust the max-width as needed */
    .bubble-card::before,
    .bubble-card::after,
    .right-pointer::before,
    .right-pointer::after,
    .left-pointer::after,
    .left-pointer::before {
      display: none;
    }
  }
</style>
