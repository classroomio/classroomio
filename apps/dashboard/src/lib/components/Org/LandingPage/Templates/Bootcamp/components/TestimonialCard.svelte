<script>
  export let profileImage;
  export let title;
  export let company;
  export let description;
  export let index;
</script>

<div
  class={`flex items-center overflow-hidden gap-4 p-4 ${
    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
  }`}
>
  <!-- Profile Image -->
  <div class="hidden md:block w-32 h-32 rounded-full overflow-hidden">
    <img
      src={profileImage}
      alt="Profile"
      class="w-full h-full object-cover border-2 border-gray-300"
    />
  </div>

  <!-- Card Content -->
  <div
    class={`flex-1 h-[150px] max-h-[200px] bg-white p-4 font-roboto rounded-lg border border-gray-300 relative shadow-lg bubble-card ${
      index % 2 === 0 ? 'left-pointer md:ml-4' : 'right-pointer md:mr-4'
    }`}
  >
    <div class="flex items-center gap-2">
      <div class="md:hidden w-10 h-10 rounded-full overflow-hidden">
        <img
          src={profileImage}
          alt="Profile"
          class="w-full h-full object-cover border-2 border-gray-300"
        />
      </div>
      <div class="mb-2">
        <p class="text-green-600 font-bold text-lg line-clamp-1">{title}</p>
        <p class="text-gray-500 font-semibold">{company}</p>
      </div>
    </div>
    <p class="text-gray-600 text-sm line-clamp-3">{description}</p>
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
